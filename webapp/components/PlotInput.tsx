"use client";

import { useState } from "react";

export type InputMode = "search" | "link" | "coords";

export interface PlotFormValue {
  mode: InputMode;
  query: string;
  mapLink: string;
  lat: string;
  lon: string;
  widthM: number;
  lengthM: number;
  label: string;
}

export const EMPTY_PLOT: PlotFormValue = {
  mode: "search",
  query: "",
  mapLink: "",
  lat: "",
  lon: "",
  widthM: 30,
  lengthM: 30,
  label: "Property Plot",
};

const MODES: { id: InputMode; label: string; hint: string }[] = [
  { id: "search", label: "Landmark", hint: "Type a place, street or village name" },
  { id: "link", label: "Paste link", hint: "Google Maps, WhatsApp or Apple Maps link, or DMS" },
  { id: "coords", label: "Coordinates", hint: "Decimal degrees, WGS84" },
];

/**
 * Three-way plot locator: landmark search, pasted map link/DMS, or raw
 * coordinates. Mirrors the input forms accepted by location_input.py.
 */
export default function PlotInput({
  value,
  onChange,
  onSubmit,
  busy,
  includeFlood,
  onIncludeFloodChange,
}: {
  value: PlotFormValue;
  onChange: (next: PlotFormValue) => void;
  onSubmit: () => void;
  busy: boolean;
  includeFlood: boolean;
  onIncludeFloodChange: (next: boolean) => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const active = MODES.find((m) => m.id === value.mode) ?? MODES[0];

  function set<K extends keyof PlotFormValue>(key: K, v: PlotFormValue[K]) {
    onChange({ ...value, [key]: v });
  }

  const hasLocation =
    value.mode === "search"
      ? value.query.trim().length >= 3
      : value.mode === "link"
        ? value.mapLink.trim().length >= 3
        : value.lat.trim() !== "" && value.lon.trim() !== "";
  const canSubmit = hasLocation && acknowledged;

  return (
    <form
      className="card space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit && !busy) onSubmit();
      }}
    >
      {/* Mode switch: a segmented control as wide as its options */}
      <div>
        <p className="label">Where is the plot?</p>
        <div
          role="tablist"
          aria-label="Input method"
          className="inline-flex max-w-full rounded-md bg-raised p-1"
        >
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={value.mode === m.id}
              onClick={() => set("mode", m.id)}
              className={`rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors ${
                value.mode === m.id ? "bg-white text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-muted">{active.hint}</p>
      </div>

      {value.mode === "search" && (
        <div>
          <label className="label" htmlFor="plot-query">
            Plot location
          </label>
          <input
            id="plot-query"
            className="field"
            placeholder="e.g. Ntinda, Kampala or Kasarani, Nairobi"
            value={value.query}
            autoComplete="off"
            onChange={(e) => set("query", e.target.value)}
          />
        </div>
      )}

      {value.mode === "link" && (
        <div>
          <label className="label" htmlFor="plot-link">
            Map link or DMS coordinates
          </label>
          <textarea
            id="plot-link"
            className="field min-h-[76px] resize-y"
            placeholder={"https://maps.google.com/?q=0.3476,32.5825\nor 0\u00b020'51.4\"N 32\u00b034'57.0\"E"}
            value={value.mapLink}
            onChange={(e) => set("mapLink", e.target.value)}
          />
        </div>
      )}

      {value.mode === "coords" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="plot-lat">
              Latitude
            </label>
            <input
              id="plot-lat"
              className="field"
              inputMode="decimal"
              placeholder="0.3476"
              value={value.lat}
              onChange={(e) => set("lat", e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="plot-lon">
              Longitude
            </label>
            <input
              id="plot-lon"
              className="field"
              inputMode="decimal"
              placeholder="32.5825"
              value={value.lon}
              onChange={(e) => set("lon", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Plot metadata */}
      <div className="grid grid-cols-3 gap-3 border-t border-rule pt-3">
        <div>
          <label className="label" htmlFor="plot-label">
            Reference
          </label>
          <input
            id="plot-label"
            className="field"
            value={value.label}
            onChange={(e) => set("label", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="plot-width">
            Width (m)
          </label>
          <input
            id="plot-width"
            className="field tnum"
            type="number"
            min={5}
            max={2000}
            value={value.widthM}
            onChange={(e) => set("widthM", Number(e.target.value) || 30)}
          />
        </div>
        <div>
          <label className="label" htmlFor="plot-length">
            Length (m)
          </label>
          <input
            id="plot-length"
            className="field tnum"
            type="number"
            min={5}
            max={2000}
            value={value.lengthM}
            onChange={(e) => set("lengthM", Number(e.target.value) || 30)}
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={includeFlood}
          onChange={(e) => onIncludeFloodChange(e.target.checked)}
        />
        <span>
          <span className="font-medium text-ink">Include flood susceptibility</span>
          <span className="block text-muted">
            Samples the Copernicus GLO-90 DEM for drainage and ponding (adds a few seconds).
          </span>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-2 border-t border-rule pt-3 text-xs leading-relaxed">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
        />
        <span className="text-muted">
          I understand this is a preliminary mapped-data screen, not a survey, title check or
          clearance.
        </span>
      </label>

      <button type="submit" className="btn-primary w-full" disabled={!canSubmit || busy}>
        {busy ? "Screening…" : "Screen this plot"}
      </button>
    </form>
  );
}
