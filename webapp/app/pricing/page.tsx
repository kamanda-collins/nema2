"use client";

import { useEffect, useState } from "react";
import { ApiError, initiatePayment, listPlans, setApiKey } from "@/lib/api";
import type { Plan, PaymentInitiateResponse } from "@/lib/types";

type Provider = "pesapal" | "flutterwave";

export default function PricingPage() {
  const [plans, setPlans] = useState<Record<string, Plan> | null>(null);
  const [selected, setSelected] = useState<string>("pro");
  const [provider, setProvider] = useState<Provider>("pesapal");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState<PaymentInitiateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    listPlans()
      .then((resp) => setPlans(resp.plans))
      .catch((err) =>
        setLoadError(err instanceof ApiError ? err.detail : "Could not load the pricing catalog."),
      );
  }, []);

  async function pay() {
    setCheckout(null);
    setError("Self-service payment is not live during the pilot. Professional access is provisioned after a verified review.");
  }

  const order: string[] = ["free", "instant", "pro", "law_firm"];
  const listed = plans ? order.filter((id) => plans[id]).map((id) => plans[id]) : [];

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">Pilot access</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Location screening is free. Paid reports and organisational access are paused until the
          verified-data and professional-review workflow is complete.
        </p>
      </section>

      {loadError && (
        <p className="rounded-lg bg-risk-high/5 p-3 text-sm text-risk-high">{loadError}</p>
      )}

      {!plans && !loadError && (
        <p className="card animate-pulse text-sm text-slate-500">Loading plans…</p>
      )}

      {plans && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {listed.map((plan) => {
            const isSelected = selected === plan.plan_id;
            const purchasable = plan.plan_id !== "free";
            return (
              <div
                key={plan.plan_id}
                className={`card flex flex-col justify-between transition-shadow ${
                  isSelected && purchasable ? "ring-2 ring-brand-accent" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">{plan.title}</p>
                  <p className="mt-1 text-lg font-semibold text-brand">{plan.price_display}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {plan.reports_per_month === -1
                      ? "Unlimited reports"
                      : plan.reports_per_month > 0
                        ? `${plan.reports_per_month} reports / month`
                        : plan.certificates
                          ? "Per-certificate credit"
                          : "Free preview"}
                  </p>

                  <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    {plan.includes.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-brand-accent" aria-hidden>
                          &#10003;
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  className={`mt-4 w-full ${
                    isSelected && purchasable ? "btn-primary" : "btn-ghost"
                  }`}
                  disabled={!purchasable}
                  onClick={() => {
                    setSelected(plan.plan_id);
                    setCheckout(null);
                  }}
                >
                  {!purchasable ? "Included" : isSelected ? "Selected" : "Choose plan"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkout */}
      <div className="card space-y-4">
        <div>
          <p className="label">Professional access</p>
          <p className="text-sm text-slate-600">
            Do not submit payment details here. Pilot access is provisioned only after a manual
            review of data coverage and intended use.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="plan-select">
              Plan
            </label>
            <select
              id="plan-select"
              className="field"
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                setCheckout(null);
              }}
            >
              {listed
                .filter((p) => p.plan_id !== "free")
                .map((p) => (
                  <option key={p.plan_id} value={p.plan_id}>
                    {p.title}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <span className="label">Gateway</span>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {(["pesapal", "flutterwave"] as Provider[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`flex-1 rounded-md px-2 py-2 text-xs font-semibold transition-colors ${
                    provider === p ? "bg-white text-brand shadow-sm" : "text-slate-500"
                  }`}
                >
                  {p === "pesapal" ? "Mobile Money" : "Card"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="phone">
              Contact number (not collected during pilot)
            </label>
            <input
              id="phone"
              className="field"
              placeholder="+256700000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="email">
            Contact email (not collected during pilot)
          </label>
          <input
            id="email"
            className="field"
            type="email"
            placeholder="you@agency.co.ug"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={pay} disabled={busy}>
          Request pilot access
        </button>

        {error && <p className="rounded-lg bg-risk-high/5 p-3 text-xs text-risk-high">{error}</p>}

        {checkout && (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
            <p className="font-semibold text-slate-700">
              {checkout.status === "not_configured"
                ? "Payments are not configured on this server"
                : "Checkout started"}
            </p>
            <p className="text-slate-600">{checkout.message || `Gateway: ${checkout.provider}`}</p>

            {checkout.reference && (
              <p className="break-all font-mono text-[11px] text-slate-500">
                reference: {checkout.reference}
              </p>
            )}

            {checkout.redirect_url && (
              <a
                className="btn-primary"
                href={checkout.redirect_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open the payment page
              </a>
            )}

            {checkout.status === "not_configured" && (
              <p className="text-slate-500">
                Set <code className="font-mono">PESAPAL_CONSUMER_KEY</code> and{" "}
                <code className="font-mono">PESAPAL_CONSUMER_SECRET</code>, or{" "}
                <code className="font-mono">FLW_SECRET_KEY</code>, to enable live processing.
              </p>
            )}
          </div>
        )}
      </div>

      {/* API key shortcut */}
      <div className="card space-y-3">
        <div>
          <p className="label">Already have a key?</p>
          <p className="text-sm text-slate-600">
            Paste it here to unlock your tier&apos;s features in this browser.
          </p>
        </div>
        <KeyEntry onSaved={() => setError(null)} />
      </div>
    </div>
  );
}

function KeyEntry({ onSaved }: { onSaved: () => void }) {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <input
        className="field max-w-sm flex-1"
        placeholder="your X-API-Key"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
      />
      <button
        className="btn-primary"
        onClick={() => {
          setApiKey(value.trim() || null);
          setSaved(true);
          onSaved();
        }}
      >
        Save key
      </button>
      {saved && <span className="self-center text-xs text-risk-safe">Saved in this browser.</span>}
    </div>
  );
}
