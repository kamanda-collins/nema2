/**
 * lib/api.ts
 *
 * Typed client for the NEMA due-diligence FastAPI backend (api/routes.py).
 * Every function maps 1:1 to a backend route. Errors are normalised into
 * ApiError so the UI can react to the paywall gates (401/402/429).
 */

import type {
  AssessPlotRequest,
  AssessPlotResponse,
  BatchAssessResponse,
  BatchPlotItem,
  CadastralSearchResponse,
  FloodRisk,
  GenerateReportRequest,
  GenerateReportResponse,
  PaymentInitiateRequest,
  PaymentInitiateResponse,
  PlansResponse,
  UsageResponse,
  VerifyResponse,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail || `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }

  /** 402 — needs an upgrade (free tier cannot issue certificates / batch). */
  get isUpgradeRequired() {
    return this.status === 402;
  }

  /** 429 — monthly quota exhausted. */
  get isQuotaExceeded() {
    return this.status === 429;
  }

  /** 401 — unknown/malformed API key. */
  get isUnauthorized() {
    return this.status === 401;
  }
}

/** API key storage (browser only). */
const KEY_STORAGE = "nema_api_key";

export function getApiKey(): string | null {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_DEMO_API_KEY || null;
  }
  return window.localStorage.getItem(KEY_STORAGE) || process.env.NEXT_PUBLIC_DEMO_API_KEY || null;
}

export function setApiKey(key: string | null) {
  if (typeof window === "undefined") return;
  if (key) {
    window.localStorage.setItem(KEY_STORAGE, key);
  } else {
    window.localStorage.removeItem(KEY_STORAGE);
  }
}

function buildHeaders(withBody = false): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (withBody) headers["Content-Type"] = "application/json";
  const key = getApiKey();
  if (key) headers["X-API-Key"] = key;
  return headers;
}

async function request<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const { timeoutMs = 60000, ...rest } = init ?? {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: { ...buildHeaders(Boolean(rest.body)), ...(rest.headers || {}) },
    });

    if (!resp.ok) {
      let detail = `HTTP ${resp.status}`;
      try {
        const body = await resp.json();
        detail =
          typeof body?.detail === "string" ? body.detail : JSON.stringify(body?.detail ?? body);
      } catch {
        /* non-JSON error body */
      }
      throw new ApiError(resp.status, detail);
    }

    return (await resp.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === "AbortError") {
      throw new ApiError(408, "The screening request timed out. Please retry.");
    }
    throw new ApiError(0, `Cannot reach the screening API at ${API_BASE_URL}.`);
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ health */

export function getHealth() {
  return request<Record<string, unknown>>("/health");
}

/* --------------------------------------------------------- plot assessment */

export function assessPlot(payload: AssessPlotRequest) {
  return request<AssessPlotResponse>("/api/v1/assess-plot", {
    method: "POST",
    body: JSON.stringify({
      lat: payload.lat ?? null,
      lon: payload.lon ?? null,
      query: payload.query ?? null,
      dms: payload.dms ?? null,
      map_link: payload.map_link ?? null,
      width_m: payload.width_m ?? 30,
      length_m: payload.length_m ?? 30,
      plot_label: payload.plot_label ?? "Property Plot",
      include_flood_risk: Boolean(payload.include_flood_risk),
    }),
  });
}

export function getFloodRisk(lat: number, lon: number, width_m = 30, length_m = 30) {
  return request<FloodRisk>("/api/v1/flood-risk", {
    method: "POST",
    body: JSON.stringify({ lat, lon, width_m, length_m }),
    timeoutMs: 30000,
  });
}

/* ---------------------------------------------------------------- reports */

export function generateReport(payload: GenerateReportRequest) {
  return request<GenerateReportResponse>("/api/v1/reports/generate", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: 120000,
  });
}

export function generateReportAsync(payload: GenerateReportRequest) {
  return request<{ status: string; task_id: string; message?: string }>(
    "/api/v1/reports/generate-async",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function getTaskStatus(taskId: string) {
  return request<Record<string, unknown>>(`/api/v1/reports/task/${encodeURIComponent(taskId)}`);
}

export function certificateDownloadUrl(certificateId: string) {
  return `${API_BASE_URL}/api/v1/reports/download/${encodeURIComponent(certificateId)}`;
}

export function verifyCertificate(certificateId: string) {
  return request<VerifyResponse>(`/api/v1/verify/${encodeURIComponent(certificateId)}`);
}

export function submitFeedback(feedback_text: string, meta?: Record<string, unknown>) {
  return request<{ status: string; id: number }>("/api/v1/feedback", {
    method: "POST",
    body: JSON.stringify({ feedback_text, meta: meta ?? null }),
  });
}

/* ------------------------------------------------------ billing & payments */

export function listPlans() {
  return request<PlansResponse>("/api/v1/billing/plans");
}

export function createApiKey(name: string, tier: string) {
  return request<{ status: string; api_key: Record<string, unknown> | null; message?: string }>(
    "/api/v1/billing/api-keys",
    { method: "POST", body: JSON.stringify({ name, tier }) },
  );
}

export function getUsage() {
  return request<UsageResponse>("/api/v1/billing/usage");
}

export function activateTier(tier: string, apiKey: string) {
  return request<Record<string, unknown>>("/api/v1/billing/activate", {
    method: "POST",
    body: JSON.stringify({ tier, api_key: apiKey }),
  });
}

export function initiatePayment(payload: PaymentInitiateRequest) {
  return request<PaymentInitiateResponse>("/api/v1/payments/initiate", {
    method: "POST",
    body: JSON.stringify({
      plan_id: payload.plan_id,
      provider: payload.provider ?? "pesapal",
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      currency: payload.currency ?? "USD",
    }),
  });
}

export function getPaymentStatus(provider: string, transactionId: string) {
  return request<Record<string, unknown>>(
    `/api/v1/payments/status/${encodeURIComponent(provider)}/${encodeURIComponent(transactionId)}`,
  );
}

/* -------------------------------------------------------------- cadastral */

export function cadastralStatus() {
  return request<{ available: boolean; path: string | null; layers?: string[]; message?: string }>(
    "/api/v1/cadastral/status",
  );
}

export function cadastralSearch(block: string, plot: string) {
  const qs = new URLSearchParams({ block, plot }).toString();
  return request<CadastralSearchResponse>(`/api/v1/cadastral/search?${qs}`);
}

/* ------------------------------------------------------------------ batch */

export function batchAssess(plots: BatchPlotItem[]) {
  return request<BatchAssessResponse>("/api/v1/batch/assess", {
    method: "POST",
    body: JSON.stringify({ plots }),
    timeoutMs: 300000,
  });
}
