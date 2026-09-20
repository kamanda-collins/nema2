"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSONPolygon, RiskScorecard } from "@/lib/types";

/**
 * MapLibre GL vector map — replaces the legacy <iframe> embed (plan Phase 2.3).
 * Renders the plot footprint, the statutory wetland buffer ring and any parcel
 * geometry returned by the cadastral registry, without an external API key.
 */

const OSM_RASTER_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export interface MapPanelProps {
  lat: number;
  lon: number;
  widthM?: number;
  lengthM?: number;
  label?: string;
  risk?: RiskScorecard | null;
  /** Optional parcel geometry returned by the cadastral registry (Phase 4.2). */
  parcelGeometry?: GeoJSONPolygon | null;
  className?: string;
}

/** Build a WGS84 square polygon for a metric footprint centred on lat/lon. */
function footprint(lat: number, lon: number, widthM: number, lengthM: number) {
  const dLat = lengthM / 2 / 111320;
  const dLon = widthM / 2 / (111320 * Math.cos((lat * Math.PI) / 180) || 1);
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [lon - dLon, lat - dLat],
          [lon + dLon, lat - dLat],
          [lon + dLon, lat + dLat],
          [lon - dLon, lat + dLat],
          [lon - dLon, lat - dLat],
        ],
      ],
    },
  };
}

/** Build a circular buffer ring as a 64-vertex GeoJSON polygon. */
function ring(lat: number, lon: number, radiusM: number) {
  const points: number[][] = [];
  const dLat = radiusM / 111320;
  const dLon = radiusM / (111320 * Math.cos((lat * Math.PI) / 180) || 1);
  for (let i = 0; i <= 64; i += 1) {
    const theta = (i / 64) * 2 * Math.PI;
    points.push([lon + dLon * Math.cos(theta), lat + dLat * Math.sin(theta)]);
  }
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [points] },
  };
}

function accentFor(risk?: RiskScorecard | null) {
  if (risk?.traffic_light === "red") return "#c62828";
  if (risk?.traffic_light === "yellow") return "#f57c00";
  return "#2e7d32";
}

/* MapLibre objects are loosely typed here to keep this file framework-agnostic. */
type AnyMap = {
  addControl: (c: unknown, pos?: string) => void;
  addSource: (id: string, spec: unknown) => void;
  addLayer: (spec: unknown) => void;
  getSource: (id: string) => { setData: (d: unknown) => void } | undefined;
  fitBounds: (b: unknown, o?: unknown) => void;
  flyTo: (o: unknown) => void;
  on: (ev: string, cb: (e: unknown) => void) => void;
  remove: () => void;
};

export default function MapPanel({
  lat,
  lon,
  widthM = 30,
  lengthM = 30,
  label = "Property Plot",
  risk = null,
  parcelGeometry = null,
  className = "",
}: MapPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<AnyMap | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialise the map exactly once.
  useEffect(() => {
    let disposed = false;

    (async () => {
      try {
        const maplibre = (await import("maplibre-gl")).default;
        if (disposed || !containerRef.current) return;

        const map = new maplibre.Map({
          container: containerRef.current,
          style: OSM_RASTER_STYLE as never,
          center: [lon, lat],
          zoom: 16.5,
        }) as unknown as AnyMap;

        map.addControl(new maplibre.NavigationControl({ showCompass: true }), "top-right");
        map.addControl(new maplibre.ScaleControl({ unit: "metric" }), "bottom-left");

        map.on("load", () => {
          if (disposed) return;
          mapRef.current = map;
          setReady(true);
        });

        map.on("error", (e: unknown) => {
          const message = (e as { error?: { message?: string } })?.error?.message;
          if (message) setError(message);
        });
      } catch {
        if (!disposed) setError("MapLibre GL could not be loaded in this browser.");
      }
    })();

    return () => {
      disposed = true;
      const map = mapRef.current;
      if (map) map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push footprint / buffer / parcel geometry whenever the inputs change.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    const bufferM = risk?.statutory_buffer_m ?? 30;
    const accent = accentFor(risk);
    const plot = footprint(lat, lon, widthM, lengthM);
    const bufferRing = ring(lat, lon, bufferM);

    const specs: Array<{ source: string; layer: string; data: unknown; spec: unknown }> = [
      {
        source: "plot",
        layer: "plot-fill",
        data: plot,
        spec: {
          id: "plot-fill",
          source: "plot",
          type: "fill",
          paint: { "fill-color": accent, "fill-opacity": 0.28 },
        },
      },
      {
        source: "buffer",
        layer: "buffer-fill",
        data: bufferRing,
        spec: {
          id: "buffer-fill",
          source: "buffer",
          type: "fill",
          paint: { "fill-color": "#1e88e5", "fill-opacity": 0.07 },
        },
      },
      {
        source: "plot",
        layer: "plot-line",
        data: plot,
        spec: {
          id: "plot-line",
          source: "plot",
          type: "line",
          paint: { "line-color": accent, "line-width": 2.5 },
        },
      },
      {
        source: "buffer",
        layer: "buffer-line",
        data: bufferRing,
        spec: {
          id: "buffer-line",
          source: "buffer",
          type: "line",
          paint: {
            "line-color": "#1e88e5",
            "line-width": 1.6,
            "line-dasharray": [2, 1.4],
          },
        },
      },
    ];

    for (const item of specs) {
      const existing = map.getSource(item.source);
      if (existing) {
        existing.setData(item.data);
      } else {
        map.addSource(item.source, { type: "geojson", data: item.data });
        map.addLayer(item.spec);
      }
    }

    if (parcelGeometry) {
      const parcelData = { type: "Feature", properties: {}, geometry: parcelGeometry };
      const parcelSource = map.getSource("parcel");
      if (parcelSource) {
        parcelSource.setData(parcelData);
      } else {
        map.addSource("parcel", { type: "geojson", data: parcelData });
        map.addLayer({
          id: "parcel-outline",
          source: "parcel",
          type: "line",
          paint: { "line-color": "#6a1b9a", "line-width": 2 },
        });
      }
    }

    // Keep the whole buffer ring (plus margin) in frame.
    const spanM = Math.max(bufferM * 2.4, 120);
    const dLat = spanM / 2 / 111320;
    const dLon = spanM / 2 / (111320 * Math.cos((lat * Math.PI) / 180) || 1);

    if (risk) {
      map.fitBounds(
        [
          [lon - dLon, lat - dLat],
          [lon + dLon, lat + dLat],
        ],
        { duration: 600, padding: 24 },
      );
    } else {
      map.flyTo({ center: [lon, lat], zoom: 16.5, duration: 500 });
    }
  }, [ready, lat, lon, widthM, lengthM, risk, parcelGeometry]);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 ${className}`}>
      <div ref={containerRef} className="h-full min-h-[340px] w-full" />

      <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-white/95 px-3 py-2 shadow-card">
        <p className="max-w-[220px] truncate text-xs font-semibold text-slate-800">{label}</p>
        <p className="text-[11px] text-slate-500">
          {lat.toFixed(5)}, {lon.toFixed(5)}
        </p>
        <p className="text-[11px] text-slate-500">
          {widthM.toFixed(0)} m × {lengthM.toFixed(0)} m
        </p>
      </div>

      {error && (
        <p className="absolute bottom-14 left-3 rounded-lg bg-white/95 px-3 py-1.5 text-[11px] text-risk-high shadow-card">
          {error}
        </p>
      )}

      <div className="pointer-events-none absolute bottom-3 right-3 space-y-1 rounded-lg bg-white/95 px-3 py-2 text-[10px] text-slate-600 shadow-card">
        <p className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-risk-safe" />
          plot footprint
        </p>
        <p className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-brand-accent/30" />
          statutory buffer
        </p>
      </div>
    </div>
  );
}
