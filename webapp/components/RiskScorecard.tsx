"use client";

import type { AssessPlotResponse } from "@/lib/types";

/** Traffic-light risk scorecard (mirrors risk_score.py bands). */
export default function RiskScorecard({ result }: { result: AssessPlotResponse }) {
  const { risk, compliance, provenance, location } = result;
  const unverifiedCoverage = provenance.coverage_status !== "verified";
  const decisionLabel = unverifiedCoverage
    ? "Unverified data coverage"
    : risk.traffic_light === "red"
      ? "Mapped overlap / close signal"
      : risk.traffic_light === "yellow"
        ? "Needs verification"
        : "No mapped signal";

  const tone =
    risk.traffic_light === "red"
      ? { bg: "bg-risk-high", ring: "ring-risk-high/30", text: "text-risk-high" }
      : risk.traffic_light === "yellow"
        ? { bg: "bg-risk-caution", ring: "ring-risk-caution/30", text: "text-risk-caution" }
        : { bg: "bg-slate-600", ring: "ring-slate-300", text: "text-slate-700" };

  return (
    <div className="space-y-4">
      {/* Headline score */}
      <div className={`card ring-2 ${tone.ring}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label">Preliminary screening result</p>
            <p className="text-xl font-bold leading-tight text-slate-900">{decisionLabel}</p>
            <p className={`mt-2 text-sm font-semibold ${tone.text}`}>{risk.headline}</p>
          </div>

          <span className={`pill ${tone.bg} px-3 py-1.5 text-xs text-white`}>Indicative only</span>
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
            <dt className="text-xs text-slate-500">Reference buffer</dt>
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
            <dt className="text-xs text-slate-500">Overlaps mapped feature</dt>
            <dd
              className={`font-semibold ${compliance.in_wetland ? "text-risk-high" : "text-risk-safe"}`}
            >
              {compliance.in_wetland ? "YES" : "Not detected"}
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
        <div className={`mb-4 rounded-lg border p-3 text-xs ${unverifiedCoverage ? "border-risk-caution/40 bg-risk-caution/5 text-slate-700" : "border-risk-safe/30 bg-risk-safe/5 text-slate-700"}`}>
          <p className="font-semibold">{unverifiedCoverage ? "Coverage needs confirmation" : "Verified-source coverage reported"}</p>
          <p className="mt-1">{unverifiedCoverage ? "This result uses community or unverified mapped data. An absent feature is not evidence that the land is clear." : "Even with verified-source coverage, confirm the boundary, feature type and applicable approval path with a registered professional and authority."}</p>
        </div>
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
            "This screen identifies mapped signals only. It is not a clearance, cadastral survey, title search, or NEMA decision."}
        </p>
        <p className="mt-2 text-[11px] text-slate-400">
          Source: {provenance.source_tags?.join(", ") || provenance.source} · {provenance.message}
        </p>
      </div>
    </div>
  );
}
