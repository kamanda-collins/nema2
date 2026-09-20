"use client";

import type { BrandingPayload } from "@/lib/types";

const ACCENTS = ["#0d47a1", "#1b5e20", "#6a1b9a", "#b71c1c", "#e65100", "#00695c"];
const BLANK: BrandingPayload = {
  agency_name: "",
  agency_tagline: "",
  contact_email: "",
  contact_phone: "",
  watermark_text: "",
  accent_color: ACCENTS[0],
};

/**
 * White-label branding editor (plan Phase 4.1).
 * Pro Realtor and Law Firm tiers only - the backend returns 402 otherwise.
 */
export default function BrandingForm({
  value,
  onChange,
}: {
  value: BrandingPayload | null;
  onChange: (next: BrandingPayload | null) => void;
}) {
  const current = value ?? BLANK;

  function set<K extends keyof BrandingPayload>(key: K, v: BrandingPayload[K]) {
    onChange({ ...current, [key]: v });
  }

  const watermark = (current.watermark_text || current.agency_name || "").toUpperCase();

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-700">Agency branding</p>
          <p className="text-[11px] text-slate-500">
            Stamped onto the certificate header, footer and map. Pro / Law Firm tiers only.
          </p>
        </div>
        {value && (
          <button className="text-[11px] text-brand underline" onClick={() => onChange(null)}>
            reset
          </button>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="b-agency">
            Agency name
          </label>
          <input
            id="b-agency"
            className="field"
            placeholder="Acacia Property Advocates"
            value={current.agency_name ?? ""}
            onChange={(e) => set("agency_name", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="b-tagline">
            Tagline
          </label>
          <input
            id="b-tagline"
            className="field"
            placeholder="Conveyancing & land due diligence"
            value={current.agency_tagline ?? ""}
            onChange={(e) => set("agency_tagline", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="b-email">
            Contact email
          </label>
          <input
            id="b-email"
            className="field"
            type="email"
            placeholder="deals@agency.co.ug"
            value={current.contact_email ?? ""}
            onChange={(e) => set("contact_email", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="b-phone">
            Contact phone
          </label>
          <input
            id="b-phone"
            className="field"
            placeholder="+256 700 000 000"
            value={current.contact_phone ?? ""}
            onChange={(e) => set("contact_phone", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="b-watermark">
          Watermark (optional)
        </label>
        <input
          id="b-watermark"
          className="field"
          placeholder="Defaults to the agency name"
          value={current.watermark_text ?? ""}
          onChange={(e) => set("watermark_text", e.target.value)}
        />
      </div>

      <div>
        <span className="label">Accent colour</span>
        <div className="flex items-center gap-2">
          {ACCENTS.map((hex) => (
            <button
              key={hex}
              type="button"
              aria-label={`Accent ${hex}`}
              onClick={() => set("accent_color", hex)}
              className={`h-7 w-7 rounded-full border-2 transition-transform ${
                current.accent_color === hex
                  ? "scale-110 border-slate-800"
                  : "border-white shadow-sm"
              }`}
              style={{ background: hex }}
            />
          ))}
          <input
            className="field ml-2 max-w-[120px] font-mono text-xs"
            value={current.accent_color ?? ""}
            onChange={(e) => set("accent_color", e.target.value)}
            placeholder="#0d47a1"
          />
        </div>
      </div>

      {(current.agency_name || watermark) && (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="label">Certificate preview</p>
          <p
            className="text-sm font-bold"
            style={{ color: current.accent_color || "#0d47a1" }}
          >
            {current.agency_name || "Your agency"}
          </p>
          {current.agency_tagline && (
            <p className="text-[11px] text-slate-500">{current.agency_tagline}</p>
          )}
          <p className="mt-2 text-[11px] text-slate-400">
            {watermark ? `watermark: ${watermark}` : ""}
            {current.contact_phone ? ` · ${current.contact_phone}` : ""}
            {current.contact_email ? ` · ${current.contact_email}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
