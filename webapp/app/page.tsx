"use client";

import { useState } from "react";
import CadastralSearch from "@/components/CadastralSearch";
import CertificateActions from "@/components/CertificateActions";
import DecisionChecklist from "@/components/DecisionChecklist";
import FloodPanel from "@/components/FloodPanel";
import MapPanel from "@/components/MapPanel";
import PlotInput, { EMPTY_PLOT, type PlotFormValue } from "@/components/PlotInput";
import RiskScorecard from "@/components/RiskScorecard";
import { ApiError, assessPlot } from "@/lib/api";
import type { AssessPlotResponse, CadastralSearchResponse, FloodRisk } from "@/lib/types";

/** Default view: Kampala CBD — keeps the map useful before any screening. */
const DEFAULT_CENTRE = { lat: 0.3476, lon: 32.5825 };

export default function HomePage() {
  const [form, setForm] = useState<PlotFormValue>(EMPTY_PLOT);
  const [includeFlood, setIncludeFlood] = useState(false);
  const [result, setResult] = useState<AssessPlotResponse | null>(null);
  const [parcel, setParcel] = useState<CadastralSearchResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);

  async function run() {
    setBusy(true);
    setError(null);
    setPaywall(false);
    setResult(null);
    try {
      const payload =
        form.mode === "search"
          ? { query: form.query.trim() }
          : form.mode === "link"
            ? { map_link: form.mapLink.trim() }
            : { lat: Number(form.lat), lon: Number(form.lon) };

      const resp = await assessPlot({
        ...payload,
        width_m: form.widthM,
        length_m: form.lengthM,
        plot_label: form.label || "Property Plot",
        include_flood_risk: includeFlood,
      });
      setResult(resp);
    } catch (err) {
      if (err instanceof ApiError && (err.isQuotaExceeded || err.isUnauthorized)) {
        setPaywall(true);
      }
      setError(err instanceof ApiError ? err.detail : "Screening failed. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  /** Cadastral hit → prefill coordinates and screen that parcel. */
  function useParcel(found: CadastralSearchResponse) {
    if (!found.centroid) return;
    setParcel(found);
    const centroid = found.centroid;
    setForm((prev) => ({
      ...prev,
      mode: "coords",
      lat: String(centroid.lat),
      lon: String(centroid.lon),
      label: found.parcel_name || `Block ${found.block} / Plot ${found.plot}`,
    }));
  }

  const centre = result
    ? { lat: result.location.lat, lon: result.location.lon }
    : parcel?.centroid
      ? { lat: parcel.centroid.lat, lon: parcel.centroid.lon }
      : DEFAULT_CENTRE;

  const flood: FloodRisk | null = result?.flood_risk ?? null;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-brand to-brand-accent px-6 py-8 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Check this location before you pay a deposit.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-blue-50">
          Find mapped wetland and water-feature signals around a pin. Use the result to decide
          whether to pause, inspect, or obtain a surveyor and authority verification—never as
          proof that land is cleared.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* Left: inputs */}
        <div className="space-y-4">
          <PlotInput
            value={form}
            onChange={setForm}
            onSubmit={run}
            busy={busy}
            includeFlood={includeFlood}
            onIncludeFloodChange={setIncludeFlood}
          />

          <CadastralSearch onParcelFound={useParcel} />

          {paywall && (
            <div className="rounded-lg border border-risk-caution/40 bg-risk-caution/5 p-3 text-xs">
              <p className="font-semibold text-risk-caution">Monthly quota reached</p>
              <p className="mt-1 text-slate-600">
                Your API key has used its allowance for this month.{" "}
                <a href="/pricing" className="font-semibold text-brand underline">
                  Upgrade your plan
                </a>
                .
              </p>
            </div>
          )}

          {error && !paywall && (
            <p className="rounded-lg bg-risk-high/5 p-3 text-xs text-risk-high">{error}</p>
          )}
        </div>

        {/* Right: map + results */}
        <div className="space-y-4">
          <MapPanel
            lat={centre.lat}
            lon={centre.lon}
            widthM={result ? result.location.width_m : form.widthM}
            lengthM={result ? result.location.length_m : form.lengthM}
            label={result ? result.location.label : form.label}
            risk={result?.risk ?? null}
            parcelGeometry={parcel?.geometry_geojson ?? null}
            className="h-[360px]"
          />

          {busy && (
            <div className="card animate-pulse text-sm text-slate-500">
              Querying wetland layers and computing the risk score…
            </div>
          )}

          {!result && !busy && (
            <div className="card">
              <p className="label">How to use this screen</p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <span className="font-semibold text-risk-high">Mapped overlap / close signal</span> — pause the transaction and obtain professional advice.
                </li>
                <li>
                  <span className="font-semibold text-risk-caution">Needs verification</span> — a nearby feature, uncertain pin, or incomplete coverage needs field checks.
                </li>
                <li>
                  <span className="font-semibold text-slate-700">No mapped signal</span> — this is not a clearance; unmapped or seasonal features may still exist.
                </li>
              </ul>
              <p className="mt-3 text-xs text-slate-500">
                Results describe mapped signals and data coverage. Buffer requirements vary by
                feature and jurisdiction and must be confirmed by the responsible authority.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <RiskScorecard result={result} />
              <DecisionChecklist result={result} />
              <FloodPanel flood={flood} loading={includeFlood && !flood} />
              <CertificateActions result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
