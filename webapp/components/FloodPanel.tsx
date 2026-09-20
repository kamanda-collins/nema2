"use client";

import type { FloodRisk } from "@/lib/types";

const BAND_TONE: Record<string, string> = {
  Low: "bg-risk-safe",
  Moderate: "bg-risk-caution",
  Elevated: "bg-orange-600",
  High: "bg-risk-high",
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
      <div className="card animate-pulse">
        <p className="label">Flood susceptibility</p>
        <p className="text-sm text-slate-400">Sampling the Copernicus GLO-90 DEM…</p>
      </div>
    );
  }

  if (!flood) {
    return (
      <div className="card">
        <p className="label">Flood susceptibility</p>
        <p className="text-sm text-slate-500">
          Not requested. Enable <span className="font-medium">flood risk</span> before screening
          to sample terrain elevation and drainage from the Copernicus DEM.
        </p>
      </div>
    );
  }

  if (flood.status !== "available") {
    return (
      <div className="card">
        <p className="label">Flood susceptibility</p>
        <p className="text-sm text-risk-caution">
          {flood.message || "Terrain service unavailable."}
          {flood.reason ? ` (${flood.reason})` : ""}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          The wetland compliance score above is unaffected — this layer is an optional extra.
        </p>
      </div>
    );
  }

  const index = flood.susceptibility_index ?? 0;
  const band = flood.band ?? "Moderate";

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="label">Flood susceptibility</p>
          <p className="text-3xl font-bold leading-none text-slate-900">
            {index}
            <span className="text-base font-medium text-slate-400">/100</span>
          </p>
        </div>
        <span className={`pill ${BAND_TONE[band] ?? "bg-slate-400"} text-white`}>{band}</span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${BAND_TONE[band] ?? "bg-slate-400"}`}
          style={{ width: `${Math.min(100, Math.max(3, index))}%` }}
        />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <dt className="text-slate-500">Elevation (centre)</dt>
          <dd className="font-medium text-slate-800">
            {flood.elevation_m != null ? `${flood.elevation_m.toFixed(1)} m` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Surrounding average</dt>
          <dd className="font-medium text-slate-800">
            {flood.surrounding_elevation_m != null
              ? `${flood.surrounding_elevation_m.toFixed(1)} m`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Max slope</dt>
          <dd className="font-medium text-slate-800">
            {flood.max_slope_deg != null ? `${flood.max_slope_deg.toFixed(2)}°` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Local relief</dt>
          <dd className="font-medium text-slate-800">
            {flood.elevation_range_m != null ? `${flood.elevation_range_m.toFixed(1)} m` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Depression depth</dt>
          <dd className="font-medium text-slate-800">
            {flood.depression_depth_m != null ? `${flood.depression_depth_m.toFixed(2)} m` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">DEM samples</dt>
          <dd className="font-medium text-slate-800">{flood.samples ?? "—"}</dd>
        </div>
      </dl>

      {flood.components && (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
          <p className="label">Index components</p>
          {(
            [
              ["Drainage descent", flood.components.slope, 40],
              ["Depression (ponding)", flood.components.depression, 40],
              ["Elevation variability", flood.components.variability, 20],
            ] as const
          ).map(([name, value, max]) => (
            <div key={name}>
              <p className="flex justify-between text-[11px] text-slate-600">
                <span>{name}</span>
                <span className="font-medium">
                  {value.toFixed(1)}/{max}
                </span>
              </p>
              <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand-accent"
                  style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        {flood.method || "Copernicus GLO-90 DEM via Open-Meteo Elevation API"}
        {flood.cached ? " · cached" : ""}
      </p>
    </div>
  );
}
