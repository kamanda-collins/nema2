import type { AssessPlotResponse } from "@/lib/types";

/* Traffic-light verdict (mirrors risk_score.py bands): the screen's answer leads,
   followed by the statutory buffer meter (the one element only this product has)
   and the screening facts as ledger rows. */

const DECISION: Record<string, { label: string; pill: string }> = {
  red: { label: "Mapped overlap / close signal", pill: "pill-negative" },
  yellow: { label: "Needs verification", pill: "pill-warning" },
  green: { label: "No mapped signal", pill: "pill-positive" },
};

/** Statutory buffer meter: the plot's nearest-feature distance on one scale
 *  against the statutory buffer line and the 500 m safe line. */
function BufferMeter({
  distanceM,
  bufferM,
  inWetland,
}: {
  distanceM: number | null;
  bufferM: number | null;
  inWetland: boolean;
}) {
  const insideWetland = inWetland;
  const safeAt = 500;
  const max =
    Math.max(safeAt * 1.2, (distanceM ?? 0) * 1.1, (bufferM ?? 0) * 3) || safeAt * 1.2;
  const pct = (v: number) => Math.min(100, Math.max(0, (v / max) * 100));

  // Zones: inside the buffer (negative), buffer -> 500 m (warning), beyond (safe).
  const zoneBreak = bufferM != null && bufferM > 0 ? bufferM : null;
  const zones = zoneBreak
    ? [
        { to: pct(zoneBreak), cls: "bg-[#ffedea]" },
        { to: pct(safeAt) - pct(zoneBreak), cls: "bg-[#fffbeb]" },
        { to: 100 - pct(safeAt), cls: "bg-[#dcfae5]" },
      ]
    : [
        { to: pct(safeAt), cls: "bg-[#fffbeb]" },
        { to: 100 - pct(safeAt), cls: "bg-[#dcfae5]" },
      ];

  const markerPct = insideWetland ? 0 : distanceM != null ? pct(distanceM) : null;

  return (
    <div className="mt-5 border-t border-rule pt-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-xs text-muted">Distance to nearest mapped feature</p>
        <p className="tnum text-sm font-medium text-ink">
          {insideWetland
            ? "inside"
            : distanceM != null
              ? `${Math.round(distanceM).toLocaleString("en")} m`
              : "—"}
        </p>
      </div>

      <div className="relative mt-2 h-2.5 w-full overflow-hidden rounded-full border border-line">
        <div className="flex h-full w-full">
          {zones.map((zone, i) => (
            <div key={i} className={zone.cls} style={{ width: `${zone.to}%` }} />
          ))}
        </div>
        {markerPct != null && (
          <span
            aria-hidden
            className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-ink"
            style={{ left: `calc(${markerPct}% - 1px)` }}
          />
        )}
      </div>

      <div className="relative mt-1 h-4 text-[11px] leading-4 text-muted">
        {zoneBreak && zoneBreak < max * 0.9 && (
          <span
            className="tnum absolute whitespace-nowrap"
            style={{ left: `${pct(zoneBreak)}%`, transform: "translateX(-50%)" }}
          >
            buffer {Math.round(zoneBreak)} m
          </span>
        )}
        <span
          className="tnum absolute whitespace-nowrap"
          style={{ left: `${pct(safeAt)}%`, transform: "translateX(-50%)" }}
        >
          500 m safe
        </span>
        <span className="tnum absolute right-0 whitespace-nowrap">
          {Math.round(max).toLocaleString("en")} m
        </span>
      </div>

      {distanceM == null && !insideWetland && (
        <p className="mt-1 text-[11px] text-muted">
          Distance could not be measured this run, treat the verdict as unverified.
        </p>
      )}
    </div>
  );
}

export default function RiskScorecard({ result }: { result: AssessPlotResponse }) {
  const { risk, compliance, provenance, location } = result;
  const unverifiedCoverage = provenance.coverage_status !== "verified";
  const decision = DECISION[risk.traffic_light] ?? DECISION.green;
  const distance =
    compliance.min_distance_meters != null ? Number(compliance.min_distance_meters) : null;

  const facts: Array<[string, React.ReactNode]> = [
    ["Location", location.label],
    ["Jurisdiction", risk.country],
    ["Input method", String(location.input_method || "coordinates").replace(/_/g, " ")],
    ["Plot size", `${Number(location.width_m).toFixed(0)} × ${Number(location.length_m).toFixed(0)} m`],
    ["Reference buffer", risk.statutory_buffer_m != null ? `${risk.statutory_buffer_m} m` : "—"],
    ["Nearest feature", compliance.nearest_feature_kind || "—"],
    ["Overlaps mapped feature", compliance.in_wetland ? "Yes" : "Not detected"],
  ];

  return (
    <div className="space-y-3">
      {/* The verdict, the screen's answer, read first */}
      <section className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted">Screening verdict</p>
            <p className="mt-1 text-2xl font-medium leading-tight text-ink sm:text-3xl">
              {decision.label}
            </p>
            <p className="mt-1.5 text-sm text-muted">{risk.headline}</p>
          </div>
          <span className={`${decision.pill} shrink-0 px-2.5 py-1`}>
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${
                risk.traffic_light === "red"
                  ? "bg-risk-high"
                  : risk.traffic_light === "yellow"
                    ? "bg-[#d97706]"
                    : "bg-risk-safe"
              }`}
            />
            Indicative
          </span>
        </div>

        <BufferMeter
          distanceM={distance}
          bufferM={risk.statutory_buffer_m}
          inWetland={compliance.in_wetland}
        />

        {risk.flags.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-rule pt-3">
            {risk.flags.map((flag) => (
              <li key={flag} className="flex gap-2 text-xs leading-relaxed text-muted">
                <span
                  aria-hidden
                  className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${
                    risk.traffic_light === "red"
                      ? "bg-risk-high"
                      : risk.traffic_light === "yellow"
                        ? "bg-[#d97706]"
                        : "bg-risk-safe"
                  }`}
                />
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Screening facts as ledger rows */}
      <section className="card p-5">
        <p className="text-xs text-muted">Screening facts</p>
        <dl className="mt-2">
          {facts.map(([name, value]) => (
            <div key={name} className="ledger-row">
              <dt className="shrink-0 text-muted">{name}</dt>
              <dd className="tnum min-w-0 truncate text-right font-medium text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        {compliance.wetland_names.length > 0 && (
          <div className="mt-3 border-t border-rule pt-3">
            <p className="mb-2 text-xs text-muted">Named features nearby</p>
            <ul className="flex flex-wrap gap-1.5">
              {compliance.wetland_names.slice(0, 8).map((name) => (
                <li key={name} className="pill-neutral">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Guidance, provenance, legal text */}
      <section className="card p-5">
        <div className="flex items-center gap-2">
          <span className={unverifiedCoverage ? "pill-warning" : "pill-positive"}>
            {unverifiedCoverage ? "Community or unverified data" : "Verified-source coverage"}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {unverifiedCoverage
            ? "This result uses community or unverified mapped data. An absent feature is not evidence that the land is clear."
            : "Even with verified-source coverage, confirm the boundary, feature type and applicable approval path with a registered professional and authority."}
        </p>

        <p className="mt-4 text-sm leading-relaxed text-ink">{risk.guidance}</p>

        {risk.legal_references.length > 0 && (
          <div className="mt-4 border-t border-rule pt-3">
            <p className="mb-1.5 text-xs text-muted">Legal references</p>
            <ul className="space-y-1 text-xs leading-relaxed text-muted">
              {risk.legal_references.map((ref) => (
                <li key={ref}>{ref}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-4 border-t border-rule pt-3 text-[11px] leading-relaxed text-muted">
          {risk.disclaimer ||
            "This screen identifies mapped signals only. It is not a clearance, cadastral survey, title search, or NEMA decision."}
        </p>
        <p className="mt-2 text-[11px] text-muted">
          Source: {provenance.source_tags?.join(", ") || provenance.source} · {provenance.message}
        </p>
      </section>
    </div>
  );
}
