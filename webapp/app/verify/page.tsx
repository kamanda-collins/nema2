"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ApiError, verifyCertificate } from "@/lib/api";
import type { VerifyResponse } from "@/lib/types";

function VerifyInner() {
  const params = useSearchParams();
  const initial = params.get("id") || "";
  const [certId, setCertId] = useState(initial);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await verifyCertificate(trimmed));
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }, []);

  // Auto-verify when arriving from a QR code / shared link.
  useEffect(() => {
    if (initial) run(initial);
  }, [initial, run]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">Verify a certificate</h1>
        <p className="mt-1 text-sm text-slate-600">
          Every certificate carries a QR code pointing here. Enter the certificate ID from the
          footer of the PDF to confirm it was issued by the official registry and that the
          assessment has not been altered.
        </p>
      </section>

      <form
        className="card space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(certId);
        }}
      >
        <div>
          <label className="label" htmlFor="cert-id">
            Certificate ID
          </label>
          <input
            id="cert-id"
            className="field font-mono text-xs"
            placeholder="e.g. NEMA-2f8a1c4e9b"
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
          />
        </div>
        <button className="btn-primary w-full" disabled={busy || !certId.trim()}>
          {busy ? "Checking the registry…" : "Verify certificate"}
        </button>
      </form>

      {error && <p className="rounded-lg bg-risk-high/5 p-3 text-sm text-risk-high">{error}</p>}

      {result && (
        <div
          className={`card ring-2 ${
            result.status === "valid" ? "ring-risk-safe/30" : "ring-risk-high/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xl font-bold text-white ${
                result.status === "valid" ? "bg-risk-safe" : "bg-risk-high"
              }`}
              aria-hidden
            >
              {result.status === "valid" ? "\u2713" : "!"}
            </span>
            <div className="min-w-0">
              <p
                className={`text-sm font-bold ${
                  result.status === "valid" ? "text-risk-safe" : "text-risk-high"
                }`}
              >
                {result.status === "valid"
                  ? "Authentic certificate"
                  : result.message || "Not found in the official registry"}
              </p>
              <p className="mt-0.5 break-all font-mono text-[11px] text-slate-500">
                {result.certificate_id}
              </p>

              {result.status === "valid" && (
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <dt className="text-slate-500">Risk score</dt>
                    <dd className="font-semibold text-slate-800">
                      {result.assessment?.score ?? "—"}/100
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Band</dt>
                    <dd className="font-semibold text-slate-800">
                      {result.assessment?.band ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Jurisdiction</dt>
                    <dd className="font-semibold text-slate-800">
                      {result.assessment?.country ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Issued</dt>
                    <dd className="font-semibold text-slate-800">{result.issued_at ?? "—"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-500">Coordinates screened</dt>
                    <dd className="font-mono text-[11px] text-slate-800">
                      {result.assessment?.latitude ?? "—"}, {result.assessment?.longitude ?? "—"}
                    </dd>
                  </div>
                </dl>
              )}

              {result.status !== "valid" && (
                <p className="mt-2 text-xs text-slate-600">
                  Treat the document as unverified. Ask the issuer to re-share the original PDF, or
                  contact the registry.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<p className="card animate-pulse text-sm text-slate-500">Loading…</p>}>
      <VerifyInner />
    </Suspense>
  );
}
