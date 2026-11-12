"use client";

import { useMemo, useState } from "react";
import { ApiError, batchAssess, certificateDownloadUrl, generateReport } from "@/lib/api";
import type { BatchAssessResult, BatchPlotItem } from "@/lib/types";

const SAMPLE = `lat,lon,label,width_m,length_m
0.3476,32.5825,Kampala CBD parcel,30,30
0.3621,32.5526,Lubigi fringe plot,40,40`;

/** Parse pasted CSV: lat,lon,label[,width_m,length_m] */
function parseCsv(text: string): { plots: BatchPlotItem[]; errors: string[] } {
  const plots: BatchPlotItem[] = [];
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  lines.forEach((line, idx) => {
    if (idx === 0 && /^lat\b/i.test(line)) return; // header
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 2) {
      errors.push(`Line ${idx + 1}: needs at least lat,lon`);
      return;
    }
    const lat = Number(parts[0]);
    const lon = Number(parts[1]);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      errors.push(`Line ${idx + 1}: invalid latitude "${parts[0]}"`);
      return;
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      errors.push(`Line ${idx + 1}: invalid longitude "${parts[1]}"`);
      return;
    }
    const width = parts[3] ? Number(parts[3]) : 30;
    const length = parts[4] ? Number(parts[4]) : 30;
    plots.push({
      lat,
      lon,
      label: parts[2] || `Plot ${idx + 1}`,
      width_m: Number.isFinite(width) && width > 0 ? width : 30,
      length_m: Number.isFinite(length) && length > 0 ? length : 30,
    });
  });

  if (plots.length > 100) {
    errors.push(`Only the first 100 of ${plots.length} plots will be screened.`);
  }
  return { plots: plots.slice(0, 100), errors };
}

const DOT: Record<string, string> = {
  green: "bg-risk-safe",
  yellow: "bg-[#d97706]",
  red: "bg-risk-high",
};

export default function BatchPage() {
  const [csv, setCsv] = useState(SAMPLE);
  const [results, setResults] = useState<BatchAssessResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [issuing, setIssuing] = useState<string | null>(null);

  const parsed = useMemo(() => parseCsv(csv), [csv]);

  async function run() {
    setBusy(true);
    setError(null);
    setPaywall(false);
    setResults(null);
    try {
      const resp = await batchAssess(parsed.plots);
      setResults(resp.results);
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.isUpgradeRequired || err.isQuotaExceeded || err.isUnauthorized)
      ) {
        setPaywall(true);
      }
      setError(err instanceof ApiError ? err.detail : "Batch screening failed.");
    } finally {
      setBusy(false);
    }
  }

  async function issueFor(row: BatchAssessResult) {
    setIssuing(row.label);
    setError(null);
    try {
      const resp = await generateReport({
        lat: row.lat,
        lon: row.lon,
        plot_label: row.label,
      });
      window.open(certificateDownloadUrl(resp.certificate_id), "_blank", "noopener");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not issue the report.");
    } finally {
      setIssuing(null);
    }
  }

  const summary = useMemo(() => {
    if (!results) return null;
    const ok = results.filter((r) => r.status === "success");
    return {
      total: results.length,
      ok: ok.length,
      high: ok.filter((r) => r.traffic_light === "red").length,
      caution: ok.filter((r) => r.traffic_light === "yellow").length,
      safe: ok.filter((r) => r.traffic_light === "green").length,
    };
  }, [results]);

  function downloadCsv() {
    if (!results) return;
    const header =
      "label,lat,lon,status,score,band,in_wetland,min_distance_m,nearest_feature,country";
    const body = results
      .map((r) =>
        [
          `"${r.label.replace(/"/g, '""')}"`,
          r.lat,
          r.lon,
          r.status,
          r.score ?? "",
          r.band ?? "",
          r.in_wetland ?? "",
          r.min_distance_meters ?? "",
          r.nearest_feature_kind ?? "",
          r.country ?? "",
        ].join(","),
      )
      .join("\n");

    const blob = new Blob([`${header}\n${body}\n`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plot-screener-batch-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-medium leading-tight text-ink">Batch portfolio screening</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Screen up to 100 plots in one pass, for law firms, surveyors, SACCOs and bank lending
          desks reviewing a portfolio. Part of the Law Firm / Surveyor Pack.
        </p>
      </header>

      <div className="card space-y-3 p-5">
        <div>
          <label className="label" htmlFor="batch-csv">
            Paste your portfolio (CSV)
          </label>
          <textarea
            id="batch-csv"
            className="field min-h-[160px] resize-y font-mono text-xs"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-muted">
            Columns: <code className="font-mono">lat, lon, label, width_m, length_m</code>, the
            header row is optional and the last two columns default to 30 m.
          </p>
        </div>

        {parsed.errors.length > 0 && (
          <ul className="text-xs text-risk-high">
            {parsed.errors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-primary" onClick={run} disabled={busy || parsed.plots.length === 0}>
            {busy
              ? "Screening portfolio…"
              : `Screen ${parsed.plots.length} plot${parsed.plots.length === 1 ? "" : "s"}`}
          </button>
          {results && (
            <button className="btn-secondary" onClick={downloadCsv}>
              Download results as CSV
            </button>
          )}
        </div>
      </div>

      {paywall && (
        <div className="card p-3 text-sm">
          <p className="font-medium text-ink">Law Firm / Surveyor Pack required</p>
          <p className="mt-1 text-muted">
            Batch screening is available on the Law Firm tier.{" "}
            <a href="/pricing" className="underline hover:text-ink">
              View pricing
            </a>
            .
          </p>
        </div>
      )}

      {error && !paywall && <p className="text-sm text-risk-high">{error}</p>}

      {summary && (
        <div className="card grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
          {(
            [
              ["Screened", summary.ok],
              ["High risk", summary.high],
              ["Caution", summary.caution],
              ["Safe", summary.safe],
            ] as const
          ).map(([label, value], i) => (
            <div
              key={label}
              className={`px-4 py-3 ${i < 2 ? "border-b border-rule sm:border-b-0" : ""} ${
                i % 2 === 1 ? "border-l border-rule sm:border-l-0" : ""
              } sm:border-l sm:first:border-l-0`}
            >
              <p className="text-xs text-muted">{label}</p>
              <p
                className={`tnum mt-0.5 text-2xl font-medium ${
                  label === "High risk"
                    ? "text-risk-high"
                    : label === "Caution"
                      ? "text-[#92400e]"
                      : label === "Safe"
                        ? "text-risk-safe"
                        : "text-ink"
                }`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {results && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-4 py-2 font-normal">Plot</th>
                <th className="px-3 py-2 text-right font-normal">Score</th>
                <th className="px-3 py-2 font-normal">Band</th>
                <th className="px-3 py-2 text-right font-normal">Distance</th>
                <th className="px-3 py-2 font-normal">Nearest feature</th>
                <th className="px-3 py-2 font-normal">Report</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, idx) => (
                <tr key={`${row.label}-${idx}`} className="border-b border-rule last:border-b-0">
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-ink">{row.label}</span>
                    <span className="tnum block font-mono text-[10px] text-faint">
                      {row.lat.toFixed(4)}, {row.lon.toFixed(4)}
                    </span>
                  </td>
                  {row.status === "success" ? (
                    <>
                      <td className="tnum px-3 py-2.5 text-right font-medium text-ink">
                        {row.score}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="pill-neutral">
                          <span
                            aria-hidden
                            className={`h-1.5 w-1.5 rounded-full ${
                              DOT[row.traffic_light ?? ""] ?? "bg-control"
                            }`}
                          />
                          {row.band}
                        </span>
                      </td>
                      <td className="tnum px-3 py-2.5 text-right text-muted">
                        {row.min_distance_meters != null
                          ? `${Math.round(row.min_distance_meters).toLocaleString("en")} m`
                          : "—"}
                        {row.in_wetland && (
                          <span className="ml-1 font-medium text-risk-high">in wetland</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-muted">{row.nearest_feature_kind ?? "—"}</td>
                      <td className="px-3 py-2.5">
                        <button
                          className="underline hover:text-ink disabled:opacity-45"
                          disabled={issuing === row.label}
                          onClick={() => issueFor(row)}
                        >
                          {issuing === row.label ? "issuing…" : "issue PDF"}
                        </button>
                      </td>
                    </>
                  ) : (
                    <td colSpan={5} className="px-3 py-2.5 text-risk-high">
                      {row.error || "Screening failed for this plot."}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
