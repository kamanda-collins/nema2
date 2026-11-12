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

  const valid = result?.status === "valid";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-2xl font-medium leading-tight text-ink">Verify a report</h1>
        <p className="mt-1 text-sm text-muted">
          Every report carries a QR code pointing here. Enter the report ID from the footer of the
          PDF to confirm it was issued by the official registry and that the assessment has not
          been altered.
        </p>
      </header>

      <form
        className="card space-y-3 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          run(certId);
        }}
      >
        <div>
          <label className="label" htmlFor="cert-id">
            Report ID
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
          {busy ? "Checking the registry…" : "Verify report"}
        </button>
      </form>

      {error && <p className="text-sm text-risk-high">{error}</p>}

      {result && (
        <div className="card p-5">
          <div className="flex items-start gap-3">
            <span
              className={`pill shrink-0 px-2.5 py-1 ${
                valid ? "pill-positive" : "pill-negative"
              }`}
            >
              <span
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full ${
                  valid ? "bg-risk-safe" : "bg-risk-high"
                }`}
              />
              {valid ? "Authentic report" : result.message || "Not found in the registry"}
            </span>
          </div>
          <p className="mt-2 break-all font-mono text-[11px] text-muted">{result.certificate_id}</p>

          {valid && (
            <dl className="mt-4 border-t border-rule pt-2">
              {(
                [
                  ["Risk score", `${result.assessment?.score ?? "—"}/100`],
                  ["Band", result.assessment?.band ?? "—"],
                  ["Jurisdiction", result.assessment?.country ?? "—"],
                  ["Issued", result.issued_at ?? "—"],
                ] as const
              ).map(([name, value]) => (
                <div key={name} className="ledger-row">
                  <dt className="shrink-0 text-muted">{name}</dt>
                  <dd className="tnum text-right font-medium text-ink">{value}</dd>
                </div>
              ))}
              <div className="ledger-row">
                <dt className="shrink-0 text-muted">Coordinates screened</dt>
                <dd className="text-right font-mono text-xs text-ink">
                  {result.assessment?.latitude ?? "—"}, {result.assessment?.longitude ?? "—"}
                </dd>
              </div>
            </dl>
          )}

          {!valid && (
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Treat the document as unverified. Ask the issuer to re-share the original PDF, or
              contact the registry.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="card p-5 text-sm text-muted">Loading…</div>}>
      <VerifyInner />
    </Suspense>
  );
}
