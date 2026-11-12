"use client";

import { useEffect, useState } from "react";
import {
  API_BASE_URL,
  ApiError,
  createApiKey,
  getApiKey,
  getUsage,
  setApiKey,
} from "@/lib/api";
import type { UsageResponse } from "@/lib/types";

/**
 * Backend connectivity plus API-key / quota state, rendered as a quiet block.
 * Sits at the bottom of the desktop sidebar and inside the phone menu sheet.
 * Free/anonymous users can screen plots but cannot issue certificates.
 */
export default function ApiKeyBar() {
  const [key, setKey] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = getApiKey();
    setKey(existing);
    fetch(`${API_BASE_URL}/health`)
      .then((r) => setOnline(r.ok))
      .catch(() => setOnline(false));
  }, []);

  useEffect(() => {
    if (!key) {
      setUsage(null);
      return;
    }
    getUsage()
      .then(setUsage)
      .catch(() => setUsage(null));
  }, [key]);

  function save() {
    setError(null);
    const trimmed = draft.trim();
    if (trimmed && trimmed.length < 8) {
      setError("API keys are at least 8 characters.");
      return;
    }
    setApiKey(trimmed || null);
    setKey(trimmed || null);
    setDraft("");
    setOpen(false);
  }

  function clear() {
    setApiKey(null);
    setKey(null);
    setOpen(false);
  }

  async function mint(tier: string) {
    setBusy(true);
    setError(null);
    try {
      const resp = await createApiKey(name.trim() || "Web app user", tier);
      const minted = (resp.api_key?.key as string) || "";
      if (!minted) {
        setError(resp.message || "The server did not return a key.");
        return;
      }
      setApiKey(minted);
      setKey(minted);
      setName("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not create an API key.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md border border-line bg-white p-3 text-xs">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            online === null ? "bg-control" : online ? "bg-risk-safe" : "bg-risk-high"
          }`}
        />
        <span className="min-w-0 flex-1 truncate text-muted">
          {online === null
            ? "Checking screening API…"
            : online
              ? "Screening API online"
              : "Screening API unreachable"}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {key ? (
          <>
            <span className="font-medium text-ink">
              {usage ? `${usage.tier} tier` : "keyed"}
            </span>
            {usage && (
              <span className="tnum text-muted">
                {usage.credit_based
                  ? `${usage.requests_used} screens used · ${usage.certificate_credits} credit${
                      usage.certificate_credits === 1 ? "" : "s"
                    } left`
                  : usage.unlimited
                    ? `${usage.requests_used} reports used · unlimited`
                    : `${usage.requests_used}/${usage.limit} used · ${usage.remaining} left`}
              </span>
            )}
            <button onClick={clear} className="underline hover:text-ink">
              sign out
            </button>
          </>
        ) : (
          <>
            <span className="text-muted">Anonymous free preview</span>
            <button onClick={() => setOpen((v) => !v)} className="font-medium underline hover:text-ink">
              {open ? "cancel" : "add API key"}
            </button>
          </>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-rule pt-3">
          <div>
            <label className="label" htmlFor="api-key">
              Existing API key
            </label>
            <input
              id="api-key"
              className="field"
              placeholder="paste your X-API-Key"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button className="btn-primary mt-2 w-full" onClick={save} disabled={busy}>
              Use key
            </button>
          </div>

          <div>
            <label className="label" htmlFor="key-name">
              …or mint a free key
            </label>
            <input
              id="key-name"
              className="field"
              placeholder="agency or app name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="btn-secondary mt-2 w-full" onClick={() => mint("free")} disabled={busy}>
              {busy ? "Creating…" : "Create free key"}
            </button>
          </div>

          {error && <p className="text-risk-high">{error}</p>}
        </div>
      )}
    </div>
  );
}
