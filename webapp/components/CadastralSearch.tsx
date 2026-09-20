"use client";

import { useEffect, useState } from "react";
import { ApiError, cadastralSearch, cadastralStatus } from "@/lib/api";
import type { CadastralSearchResponse } from "@/lib/types";

/**
 * Cadastral block/plot lookup (plan Phase 4.2).
 * When a parcel is found its centroid feeds straight into the screening flow.
 */
export default function CadastralSearch({
  onParcelFound,
}: {
  onParcelFound: (parcel: CadastralSearchResponse) => void;
}) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [block, setBlock] = useState("");
  const [plot, setPlot] = useState("");
  const [result, setResult] = useState<CadastralSearchResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cadastralStatus()
      .then((info) => setAvailable(info.available))
      .catch(() => setAvailable(false));
  }, []);

  async function search() {
    if (!block.trim() || !plot.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const found = await cadastralSearch(block.trim(), plot.trim());
      setResult(found);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Cadastral lookup failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="card space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        search();
      }}
    >
      <div>
        <p className="label">Search by block &amp; plot number</p>
        <p className="text-[11px] text-slate-500">
          {available === null
            ? "Checking the cadastral registry…"
            : available
              ? "Registry loaded — use the block/plot numbers from the title or survey plan."
              : "No cadastral registry is loaded on this server. Coordinate and landmark screening still work."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-1">
          <label className="label" htmlFor="block">
            Block
          </label>
          <input
            id="block"
            className="field"
            placeholder="B42"
            value={block}
            onChange={(e) => setBlock(e.target.value)}
          />
        </div>
        <div className="col-span-1">
          <label className="label" htmlFor="plot">
            Plot
          </label>
          <input
            id="plot"
            className="field"
            placeholder="0055"
            value={plot}
            onChange={(e) => setPlot(e.target.value)}
          />
        </div>
        <div className="col-span-1 flex items-end">
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={busy || !block.trim() || !plot.trim()}
          >
            {busy ? "Looking…" : "Find"}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-risk-high">{error}</p>}

      {result && result.status === "found" && result.centroid && (
        <div className="space-y-2 rounded-lg border border-risk-safe/30 bg-risk-safe/5 p-3 text-xs">
          <p className="font-semibold text-slate-700">
            {result.parcel_name || `Block ${result.block} / Plot ${result.plot}`}
          </p>
          <p className="text-slate-600">
            Centroid {result.centroid.lat.toFixed(5)}, {result.centroid.lon.toFixed(5)}
            {result.area_m2 ? ` · ${result.area_m2.toFixed(1)} m²` : ""}
            {result.source ? ` · ${result.source}` : ""}
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onParcelFound(result)}
          >
            Screen this parcel
          </button>
        </div>
      )}

      {result && result.status === "not_found" && (
        <p className="rounded-lg bg-risk-caution/5 p-3 text-xs text-risk-caution">
          {result.message || `Block ${block} / Plot ${plot} was not found in the registry.`}
        </p>
      )}

      {result && result.status === "not_available" && (
        <p className="rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
          {result.message || "No cadastral registry is loaded."}
        </p>
      )}
    </form>
  );
}
