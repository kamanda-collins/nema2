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

const TONE: Record<string, string> = {
  green: "text-risk-safe",
  yellow: "text-risk-caution",
  red: "text-risk-high",
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
      setError(err instanceof ApiError ? err.detail : "Could not issue the certificate.");
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
    a.download = `nema-batch-screening-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">Batch portfolio screening</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Screen up to 100 plots in one pass — for law firms, surveyors, SACCOs and bank lending
          desks reviewing a portfolio. Part of the Law Firm / Surveyor Pack.
        </p>
      </section>

      <div className="card space-y-3">
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
          <p className="mt-1 text-[11px] text-slate-500">
            Columns: <code className="font-mono">lat, lon, label, width_m, length_m</code> — the
            header row is optional and the last two columns default to 30 m.
          </p>
        </div>

        {parsed.errors.length > 0 && (
          <ul className="rounded-lg bg-risk-caution/5 p-3 text-xs text-risk-caution">
            {parsed.errors.map((msg) => (
              <li key={msg}>• {msg}</li>
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
            <button className="btn-ghost" onClick={downloadCsv}>
              Download results as CSV
            </button>
          )}
        </div>
      </div>

      {paywall && (
        <div className="rounded-lg border border-risk-caution/40 bg-risk-caution/5 p-3 text-sm">
          <p className="font-semibold text-risk-caution">Law Firm / Surveyor Pack required</p>
          <p className="mt-1 text-slate-600">
            Batch screening is available on the Law Firm tier.{" "}
            <a href="/pricing" className="font-semibold text-brand underline">
              View pricing
            </a>
            .
          </p>
        </div>
      )}

      {error && !paywall && (
        <p className="rounded-lg bg-risk-high/5 p-3 text-sm text-risk-high">{error}</p>
      )}

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["Screened", summary.ok, "text-slate-800"],
              ["High risk", summary.high, "text-risk-high"],
              ["Caution", summary.caution, "text-risk-caution"],
              ["Safe", summary.safe, "text-risk-safe"],
            ] as const
          ).map(([label, value, tone]) => (
            <div key={label} className="card">
              <p className="label">{label}</p>
              <p className={`text-2xl font-bold ${tone}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {results && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-slate-500">
                <th className="px-3 py-2 font-semibold">Plot</th>
                <th className="px-3 py-2 font-semibold">Score</th>
                <th className="px-3 py-2 font-semibold">Band</th>
                <th className="px-3 py-2 font-semibold">Distance</th>
                <th className="px-3 py-2 font-semibold">Nearest feature</th>
                <th className="px-3 py-2 font-semibold">Certificate</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, idx) => (
                <tr key={`${row.label}-${idx}`} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2">
                    <span className="font-medium text-slate-800">{row.label}</span>
                    <span className="block font-mono text-[10px] text-slate-400">
                      {row.lat.toFixed(4)}, {row.lon.toFixed(4)}
                    </span>
                  </td>
                  {row.status === "success" ? (
                    <>
                      <td
                        className={`px-3 py-2 font-semibold ${
                          TONE[row.traffic_light ?? ""] ?? ""
                        }`}
                      >
                        {row.score}/100
                      </td>
                      <td className="px-3 py-2">
                        <span className={`pill bg-slate-100 ${TONE[row.traffic_light ?? ""] ?? ""}`}>
                          {row.band}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {row.min_distance_meters != null
                          ? `${Math.round(row.min_distance_meters)} m`
                          : "—"}
                        {row.in_wetland && (
                          <span className="ml-1 font-semibold text-risk-high">in wetland</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {row.nearest_feature_kind ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          className="text-brand underline disabled:opacity-50"
                          disabled={issuing === row.label}
                          onClick={() => issueFor(row)}
                        >
                          {issuing === row.label ? "issuing…" : "issue PDF"}
                        </button>
                      </td>
                    </>
                  ) : (
                    <td colSpan={5} className="px-3 py-2 text-risk-high">
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
