"use client";

import type { FloodRisk } from "@/lib/types";

const BAND: Record<string, { dot: string; fill: string; pill: string }> = {
  Low: { dot: "bg-risk-safe", fill: "bg-risk-safe", pill: "pill-positive" },
  Moderate: { dot: "bg-[#d97706]", fill: "bg-[#d97706]", pill: "pill-warning" },
  Elevated: { dot: "bg-[#d97706]", fill: "bg-[#d97706]", pill: "pill-warning" },
  High: { dot: "bg-risk-high", fill: "bg-risk-high", pill: "pill-negative" },
};

/** Copernicus GLO-90 DEM flood susceptibility panel (plan Phase 3.3). */
export default function FloodPanel({
  flood,
  loading,
}: {
  flood: FloodRisk | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="card p-5">
        <p className="text-xs text-muted">Flood susceptibility</p>
        <p className="mt-1 text-sm text-faint">Sampling the Copernicus GLO-90 DEM…</p>
      </div>
    );
  }

  if (!flood) {
    return (
      <div className="card p-5">
        <p className="text-xs text-muted">Flood susceptibility</p>
        <p className="mt-1 text-sm text-muted">
          Not requested. Enable flood risk before screening to sample terrain elevation and
          drainage from the Copernicus DEM.
        </p>
      </div>
    );
  }

  if (flood.status !== "available") {
    return (
      <div className="card p-5">
        <p className="text-xs text-muted">Flood susceptibility</p>
        <p className="mt-1 text-sm text-muted">
          {flood.message || "Terrain service unavailable."}
          {flood.reason ? ` (${flood.reason})` : ""}
        </p>
        <p className="mt-1 text-[11px] text-muted">
          The wetland verdict above is unaffected, this layer is an optional extra.
        </p>
      </div>
    );
  }

  const index = flood.susceptibility_index ?? 0;
  const band = flood.band ?? "Moderate";
  const tone = BAND[band] ?? BAND.Moderate;

  const facts: Array<[string, string]> = [
    ["Elevation (centre)", flood.elevation_m != null ? `${flood.elevation_m.toFixed(1)} m` : "—"],
    [
      "Surrounding average",
      flood.surrounding_elevation_m != null ? `${flood.surrounding_elevation_m.toFixed(1)} m` : "—",
    ],
    ["Max slope", flood.max_slope_deg != null ? `${flood.max_slope_deg.toFixed(2)}°` : "—"],
    ["Local relief", flood.elevation_range_m != null ? `${flood.elevation_range_m.toFixed(1)} m` : "—"],
    [
      "Depression depth",
      flood.depression_depth_m != null ? `${flood.depression_depth_m.toFixed(2)} m` : "—",
    ],
    ["DEM samples", flood.samples != null ? String(flood.samples) : "—"],
  ];

  return (
    <section className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted">Flood susceptibility</p>
          <p className="tnum mt-1 text-3xl font-medium leading-none text-ink">
            {index}
            <span className="text-base text-faint">/100</span>
          </p>
        </div>
        <span className={`${tone.pill} px-2.5 py-1`}>
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
          {band}
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-line bg-white">
        <div
          className={`h-full ${tone.fill}`}
          style={{ width: `${Math.min(100, Math.max(0, index))}%` }}
        />
      </div>

      <dl className="mt-3">
        {facts.map(([name, value]) => (
          <div key={name} className="ledger-row text-xs">
            <dt className="shrink-0 text-muted">{name}</dt>
            <dd className="tnum text-right font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {flood.components && (
        <div className="mt-2 border-t border-rule pt-3">
          <p className="mb-2 text-xs text-muted">Index components</p>
          {(
            [
              ["Drainage descent", flood.components.slope, 40],
              ["Depression (ponding)", flood.components.depression, 40],
              ["Elevation variability", flood.components.variability, 20],
            ] as const
          ).map(([name, value, max]) => (
            <div key={name} className="mb-2 last:mb-0">
              <p className="tnum flex justify-between text-[11px] text-muted">
                <span>{name}</span>
                <span className="font-medium text-ink">
                  {value.toFixed(1)}/{max}
                </span>
              </p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-raised">
                <div
                  className="h-full bg-chart"
                  style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 border-t border-rule pt-3 text-[11px] text-muted">
        {flood.method || "Copernicus GLO-90 DEM via Open-Meteo Elevation API"}
        {flood.cached ? " · cached" : ""} · Indicative, not a survey.
      </p>
    </section>
  );
}
