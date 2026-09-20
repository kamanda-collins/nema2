"use client";

import type { AssessPlotResponse } from "@/lib/types";

/** Traffic-light risk scorecard (mirrors risk_score.py bands). */
export default function RiskScorecard({ result }: { result: AssessPlotResponse }) {
  const { risk, compliance, provenance, location } = result;

  const tone =
    risk.traffic_light === "red"
      ? { bg: "bg-risk-high", ring: "ring-risk-high/30", text: "text-risk-high" }
      : risk.traffic_light === "yellow"
        ? { bg: "bg-risk-caution", ring: "ring-risk-caution/30", text: "text-risk-caution" }
        : { bg: "bg-risk-safe", ring: "ring-risk-safe/30", text: "text-risk-safe" };

  return (
    <div className="space-y-4">
      {/* Headline score */}
      <div className={`card ring-2 ${tone.ring}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label">Risk score</p>
            <p className="text-4xl font-bold leading-none text-slate-900">
              {risk.score}
              <span className="text-lg font-medium text-slate-400">/100</span>
            </p>
            <p className={`mt-2 text-sm font-semibold ${tone.text}`}>{risk.headline}</p>
          </div>

          <span className={`pill ${tone.bg} px-3 py-1.5 text-xs text-white`}>{risk.band}</span>
        </div>

        {risk.flags.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
            {risk.flags.map((flag) => (
              <li key={flag} className="flex gap-2 text-xs text-slate-600">
                <span className={`mt-0.5 ${tone.text}`} aria-hidden>
                  ●
                </span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Key facts */}
      <div className="card">
        <p className="label">Screening facts</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Location</dt>
            <dd className="font-medium text-slate-800">{location.label}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Input method</dt>
            <dd className="font-medium capitalize text-slate-800">
              {String(location.input_method || "coordinates").replace(/_/g, " ")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Jurisdiction</dt>
            <dd className="font-medium text-slate-800">{risk.country}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Statutory buffer</dt>
            <dd className="font-medium text-slate-800">
              {risk.statutory_buffer_m != null ? `${risk.statutory_buffer_m} m` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Nearest wetland</dt>
            <dd className="font-medium text-slate-800">
              {compliance.min_distance_meters != null
                ? `${Math.round(compliance.min_distance_meters)} m`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Feature type</dt>
            <dd className="font-medium text-slate-800">
              {compliance.nearest_feature_kind || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Inside wetland</dt>
            <dd
              className={`font-semibold ${compliance.in_wetland ? "text-risk-high" : "text-risk-safe"}`}
            >
              {compliance.in_wetland ? "YES" : "No"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Plot size</dt>
            <dd className="font-medium text-slate-800">
              {Number(location.width_m).toFixed(0)} m × {Number(location.length_m).toFixed(0)} m
            </dd>
          </div>
        </dl>

        {compliance.wetland_names.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="label">Wetlands detected nearby</p>
            <ul className="flex flex-wrap gap-1.5">
              {compliance.wetland_names.slice(0, 8).map((name) => (
                <li key={name} className="pill bg-slate-100 text-slate-600">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Guidance + legal citations */}
      <div className="card">
        <p className="label">What this means for your transaction</p>
        <p className="text-sm leading-relaxed text-slate-700">{risk.guidance}</p>

        {risk.legal_references.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="label">Legal references</p>
            <ul className="space-y-1 text-xs text-slate-600">
              {risk.legal_references.map((ref) => (
                <li key={ref}>• {ref}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-500">
          {risk.disclaimer ||
            "This screening is indicative and based on gazetted wetland layers plus OpenStreetMap. It is not a substitute for a certified cadastral survey or a NEMA environmental audit."}
        </p>
        <p className="mt-2 text-[11px] text-slate-400">
          Source: {provenance.source} · {provenance.message}
        </p>
      </div>
    </div>
  );
}
