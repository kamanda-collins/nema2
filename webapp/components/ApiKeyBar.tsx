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
 * Header strip showing backend connectivity plus API-key / quota state.
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
    <div className="border-t border-slate-100 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-1.5 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              online === null ? "bg-slate-400" : online ? "bg-risk-safe" : "bg-risk-high"
            }`}
          />
          <span className="text-slate-500">
            {online === null
              ? "Checking screening API…"
              : online
                ? "Screening API online"
                : "Screening API unreachable"}
          </span>
        </span>

        <span className="text-slate-300">|</span>

        {key ? (
          <>
            <span className="font-medium text-slate-600">
              {usage ? `${usage.tier} tier` : "keyed"}
            </span>
            {usage && (
              <span className="text-slate-500">
                {usage.unlimited
                  ? `${usage.requests_used} reports used · unlimited`
                  : `${usage.requests_used}/${usage.limit} used · ${usage.remaining} left this month`}
              </span>
            )}
            <button onClick={clear} className="text-brand underline">
              sign out
            </button>
          </>
        ) : (
          <>
            <span className="text-slate-500">Anonymous free preview</span>
            <button onClick={() => setOpen((v) => !v)} className="font-medium text-brand underline">
              {open ? "cancel" : "add API key"}
            </button>
          </>
        )}
      </div>

      {open && (
        <div className="mx-auto max-w-6xl space-y-2 px-4 pb-3 text-xs">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1">
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
            </div>
            <button className="btn-primary" onClick={save} disabled={busy}>
              Use key
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-2 border-t border-slate-200 pt-2">
            <div className="min-w-[220px] flex-1">
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
            </div>
            <button className="btn-ghost" onClick={() => mint("free")} disabled={busy}>
              {busy ? "Creating…" : "Create free key"}
            </button>
          </div>

          {error && <p className="text-risk-high">{error}</p>}
        </div>
      )}
    </div>
  );
}
