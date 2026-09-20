"use client";

import { useState } from "react";
import {
  ApiError,
  certificateDownloadUrl,
  generateReport,
  submitFeedback,
  verifyCertificate,
} from "@/lib/api";
import type { AssessPlotResponse, BrandingPayload, VerifyResponse } from "@/lib/types";
import BrandingForm from "./BrandingForm";

/**
 * Certificate issuance + WhatsApp share kit.
 * Free/anonymous callers hit the 402 paywall and are pointed at /pricing.
 */
export default function CertificateActions({ result }: { result: AssessPlotResponse }) {
  const [branding, setBranding] = useState<BrandingPayload | null>(null);
  const [showBranding, setShowBranding] = useState(false);
  const [certId, setCertId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);

  const { location, risk } = result;

  async function issue() {
    setBusy(true);
    setError(null);
    setPaywall(false);
    setVerifyResult(null);
    try {
      const resp = await generateReport({
        lat: location.lat,
        lon: location.lon,
        plot_label: location.label,
        width_m: location.width_m,
        length_m: location.length_m,
        branding: branding ?? undefined,
      });
      setCertId(resp.certificate_id);
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.isUpgradeRequired || err.isQuotaExceeded || err.isUnauthorized)
      ) {
        setPaywall(true);
      }
      setError(err instanceof ApiError ? err.detail : "Certificate generation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!certId) return;
    setError(null);
    try {
      setVerifyResult(await verifyCertificate(certId));
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Verification failed.");
    }
  }

  async function sendFeedback() {
    if (feedback.trim().length < 3) return;
    try {
      await submitFeedback(feedback.trim(), { plot_label: location.label });
      setFeedbackSent(true);
      setFeedback("");
    } catch {
      setError("Could not record feedback.");
    }
  }

  const shareText = encodeURIComponent(
    `Wetland due-diligence screening: ${risk.band} (score ${risk.score}/100) for ${location.label}. ` +
      `${risk.headline} - verified via the NEMA Wetland Due Diligence portal.`,
  );

  return (
    <div className="card space-y-4">
      <div>
        <p className="label">Due-diligence certificate</p>
        <p className="text-sm text-slate-600">
          A 2-page stamped PDF with the buffer-ring map, statutory citations and a QR code for
          third-party verification.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={issue} disabled={busy}>
          {busy ? "Issuing..." : certId ? "Re-issue certificate" : "Issue PDF certificate"}
        </button>

        {!certId && (
          <button className="btn-ghost" onClick={() => setShowBranding((v) => !v)}>
            {showBranding ? "Hide branding" : "Add agency branding"}
          </button>
        )}
      </div>

      {showBranding && !certId && <BrandingForm value={branding} onChange={setBranding} />}

      {paywall && (
        <div className="rounded-lg border border-risk-caution/40 bg-risk-caution/5 p-3 text-xs">
          <p className="font-semibold text-risk-caution">Upgrade required</p>
          <p className="mt-1 text-slate-600">
            The free preview shows the on-screen traffic light. PDF certificates need the Instant,
            Pro Realtor or Law Firm pack.
          </p>
          <a href="/pricing" className="mt-2 inline-block font-semibold text-brand underline">
            View pricing &amp; pay with Mobile Money
          </a>
        </div>
      )}

      {error && <p className="rounded-lg bg-risk-high/5 p-3 text-xs text-risk-high">{error}</p>}

      {certId && (
        <div className="space-y-3 rounded-lg border border-risk-safe/30 bg-risk-safe/5 p-3">
          <div>
            <p className="text-xs font-semibold text-slate-700">Certificate issued</p>
            <p className="mt-1 break-all font-mono text-[11px] text-slate-600">{certId}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              className="btn-primary"
              href={certificateDownloadUrl(certId)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download PDF
            </a>
            <a
              className="btn-ghost"
              href={`https://wa.me/?text=${shareText}%20Certificate%20ID:%20${certId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Share on WhatsApp
            </a>
            <button className="btn-ghost" onClick={verify}>
              Verify registry entry
            </button>
          </div>

          {verifyResult && (
            <div className="rounded-lg bg-white p-3 text-xs">
              <p
                className={`font-semibold ${
                  verifyResult.status === "valid" ? "text-risk-safe" : "text-risk-high"
                }`}
              >
                {verifyResult.status === "valid"
                  ? "Valid - found in the official registry"
                  : verifyResult.message || "Not found in the registry"}
              </p>
              {verifyResult.assessment && (
                <p className="mt-1 text-slate-600">
                  Score {verifyResult.assessment.score}/100 - {verifyResult.assessment.band} -{" "}
                  {verifyResult.assessment.country} - issued {verifyResult.issued_at}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-slate-100 pt-3">
        <p className="label">Was this screening useful?</p>
        {feedbackSent ? (
          <p className="text-xs text-risk-safe">Thank you - feedback recorded.</p>
        ) : (
          <div className="flex gap-2">
            <input
              className="field"
              placeholder="One line of feedback..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <button className="btn-ghost" onClick={sendFeedback}>
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
