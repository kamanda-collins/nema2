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
 * Professional reports remain unavailable until dataset and reviewer controls
 * are operational. The public product is a preliminary screening, not a
 * clearance or transferable certificate.
 */
export default function CertificateActions({ result }: { result: AssessPlotResponse }) {
  const reportIssuanceAvailable = false;
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
    `Preliminary plot screen for ${location.label}. ${risk.headline} ` +
      `This is not a clearance or survey.`,
  );

  return (
    <section className="card space-y-4 p-5">
      <div>
        <p className="text-xs text-muted">Professional report</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Downloadable reports are paused while verified-source coverage, reviewer workflow and
          privacy controls are completed. Save this screening and use it to brief a registered
          surveyor, environmental practitioner or the relevant authority.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="btn-primary"
          onClick={issue}
          disabled={busy || !reportIssuanceAvailable}
          title="Reports are not available during the pilot"
        >
          Report coming soon
        </button>

        {!certId && (
          <button className="btn-secondary" onClick={() => setShowBranding((v) => !v)}>
            {showBranding ? "Hide branding" : "Add agency branding"}
          </button>
        )}
      </div>

      {showBranding && !certId && <BrandingForm value={branding} onChange={setBranding} />}

      {paywall && (
        <div className="card p-3 text-xs">
          <p className="font-medium text-ink">Upgrade required</p>
          <p className="mt-1 text-muted">
            Professional reports are not yet available for self-service purchase.
          </p>
          <a href="/pricing" className="mt-2 inline-block underline hover:text-ink">
            View pilot access information
          </a>
        </div>
      )}

      {error && <p className="text-xs text-risk-high">{error}</p>}

      {certId && (
        <div className="space-y-3 rounded-md border border-line bg-raised p-3">
          <div>
            <p className="text-xs font-medium text-ink">Report issued</p>
            <p className="mt-1 break-all font-mono text-[11px] text-muted">{certId}</p>
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
              className="btn-secondary"
              href={`https://wa.me/?text=${shareText}%20Report%20ID:%20${certId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Share on WhatsApp
            </a>
            <button className="btn-secondary" onClick={verify}>
              Verify registry entry
            </button>
          </div>

          {verifyResult && (
            <div className="rounded-md bg-white p-3 text-xs">
              <p
                className={`font-medium ${
                  verifyResult.status === "valid" ? "text-risk-safe" : "text-risk-high"
                }`}
              >
                {verifyResult.status === "valid"
                  ? "Valid, found in the official registry"
                  : verifyResult.message || "Not found in the registry"}
              </p>
              {verifyResult.assessment && (
                <p className="tnum mt-1 text-muted">
                  Score {verifyResult.assessment.score}/100 · {verifyResult.assessment.band} ·{" "}
                  {verifyResult.assessment.country}, issued {verifyResult.issued_at}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-rule pt-3">
        <p className="mb-2 text-xs text-muted">Was this screening useful?</p>
        {feedbackSent ? (
          <p className="text-xs text-risk-safe">Thank you, feedback recorded.</p>
        ) : (
          <div className="flex gap-2">
            <input
              className="field"
              placeholder="One line of feedback…"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <button className="btn-secondary" onClick={sendFeedback}>
              Send
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
