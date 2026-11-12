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

/** Default view: Kampala CBD, keeps the map useful before any screening. */
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

  /** Cadastral hit -> prefill coordinates and screen that parcel. */
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
    <div className="space-y-5">
      {/* Title row */}
      <header>
        <h1 className="text-2xl font-medium leading-tight text-ink">Screen a plot</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Check mapped wetland, riparian and flood signals before you pay a deposit.
        </p>
      </header>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* Left: the screening form */}
        <div className="space-y-3">
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
            <div className="card p-3 text-xs">
              <p className="font-medium text-ink">Monthly quota reached</p>
              <p className="mt-1 text-muted">
                Your API key has used its allowance for this month.{" "}
                <a href="/pricing" className="underline hover:text-ink">
                  Upgrade your plan
                </a>
                .
              </p>
            </div>
          )}

          {error && !paywall && <p className="text-xs text-risk-high">{error}</p>}
        </div>

        {/* Right: the verdict first, then its evidence */}
        <div className="flex flex-col gap-3">
          {busy && (
            <div className="card p-5 text-sm text-muted">
              Querying wetland layers and computing the risk score…
            </div>
          )}

          {!result && !busy && (
            <div className="card p-5">
              <p className="text-xs text-muted">Reading a verdict</p>
              <ol className="mt-2 space-y-2.5 text-sm leading-relaxed text-ink">
                <li className="flex gap-2.5">
                  <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-risk-high" />
                  <span>
                    <span className="font-medium">Mapped overlap / close signal</span>: pause the
                    transaction and obtain professional advice.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#d97706]" />
                  <span>
                    <span className="font-medium">Needs verification</span>: a nearby feature,
                    uncertain pin, or incomplete coverage needs field checks.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-risk-safe" />
                  <span>
                    <span className="font-medium">No mapped signal</span>: this is not a clearance;
                    unmapped or seasonal features may still exist.
                  </span>
                </li>
              </ol>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Results describe mapped signals and data coverage. Buffer requirements vary by
                feature and jurisdiction and must be confirmed by the responsible authority.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <RiskScorecard result={result} />
            </div>
          )}

          <MapPanel
            lat={centre.lat}
            lon={centre.lon}
            widthM={result ? result.location.width_m : form.widthM}
            lengthM={result ? result.location.length_m : form.lengthM}
            label={result ? result.location.label : form.label}
            risk={result?.risk ?? null}
            parcelGeometry={parcel?.geometry_geojson ?? null}
            className="min-h-[360px] flex-1"
          />

          {result && (
            <div className="space-y-3">
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
