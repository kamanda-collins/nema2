"""
branding.py

Realtor white-label portal support (plan Phase 4.1):
- Validates per-agency branding overrides for co-branded certificates
- Generates ReportLab page-draw callbacks that stamp a rotated semi-transparent
  watermark and a co-branding footer line onto every PDF page

Design:
- Branding is validated and clamped defensively (unknown keys ignored, bad
  values fall back to defaults) so a partner payload can never break a
  certificate build
- Applied only for paid tiers (pro / law_firm) per the plan monetization table
"""

import os

from reportlab.lib.units import mm

from dataclasses import dataclass, field
from typing import Any, Dict, Optional

# Tiers allowed to apply custom branding (plan section 4.1 / pricing table)
BRANDING_ELIGIBLE_TIERS = ("pro", "law_firm")

_DEFAULT_ACCENT = "#2e7d32"
_MAX_FIELD_LEN = 80


@dataclass
class AgencyBranding:
    """Validated branding overrides for a white-label certificate."""

    agency_name: str = "KamandaLabs Environmental Analytics"
    agency_tagline: str = "Automated Due Diligence Engine v2.0"
    contact_email: str = ""
    contact_phone: str = ""
    watermark_text: str = ""
    accent_color: str = _DEFAULT_ACCENT
    disclaimer_extra: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agency_name": self.agency_name,
            "agency_tagline": self.agency_tagline,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "watermark_text": self.watermark_text,
            "accent_color": self.accent_color,
            "disclaimer_extra": self.disclaimer_extra,
        }


def _clean(value: Any, max_len: int = _MAX_FIELD_LEN) -> str:
    """Coerce to a bounded, single-line string."""
    if not isinstance(value, str):
        return ""
    return " ".join(value.split())[:max_len]


def _clean_color(value: Any, fallback: str = _DEFAULT_ACCENT) -> str:
    """Accept #RGB / #RRGGBB hex colours; anything else falls back."""
    if not isinstance(value, str):
        return fallback
    v = value.strip()
    if len(v) in (4, 7) and v.startswith("#"):
        try:
            int(v[1:], 16)
            return v
        except ValueError:
            pass
    return fallback


def validate_branding(payload: Optional[Dict[str, Any]]) -> AgencyBranding:
    """
    Build a validated AgencyBranding from an untrusted payload.

    Never raises: invalid fields are clamped or defaulted.
    """
    payload = payload or {}
    if not isinstance(payload, dict):
        return AgencyBranding()

    return AgencyBranding(
        agency_name=_clean(payload.get("agency_name")) or "KamandaLabs Environmental Analytics",
        agency_tagline=_clean(payload.get("agency_tagline")) or "Automated Due Diligence Engine v2.0",
        contact_email=_clean(payload.get("contact_email")),
        contact_phone=_clean(payload.get("contact_phone")),
        watermark_text=_clean(payload.get("watermark_text"), max_len=40).upper(),
        accent_color=_clean_color(payload.get("accent_color")),
        disclaimer_extra=_clean(payload.get("disclaimer_extra"), max_len=300),
    )


def branding_allowed(tier: Optional[str]) -> bool:
    """Check whether a pricing tier may apply custom branding."""
    return (tier or "") in BRANDING_ELIGIBLE_TIERS


def make_page_watermark(branding: AgencyBranding):
    """
    Return a ReportLab page callback stamping the watermark + co-brand line.

    Pass the result to SimpleDocTemplate(onFirstPage=..., onLaterPages=...).
    With no watermark text the callback still draws the co-branding footer.
    """
    watermark = branding.watermark_text
    accent = branding.accent_color
    footer = branding.agency_name
    if branding.contact_email or branding.contact_phone:
        contact = " | ".join(x for x in (branding.contact_email, branding.contact_phone) if x)
        footer = f"{branding.agency_name}  •  {contact}"

    def _draw(canvas, doc):  # pragma: no cover - exercised via PDF output tests
        canvas.saveState()
        try:
            if watermark:
                canvas.setFont("Helvetica-Bold", 42)
                try:
                    canvas.setFillAlpha(0.08)
                except Exception:
                    pass
                canvas.setFillColor(accent)
                # Rotate around the A4 page centre (210 x 297 mm portrait)
                canvas.translate(105 * mm, 148.5 * mm)
                canvas.rotate(35)
                canvas.drawCentredString(0, 0, watermark)
                canvas.restoreState()
                canvas.saveState()
            # Co-branding footer on every page
            canvas.setFont("Helvetica", 7)
            canvas.setFillColor("#78909c")
            canvas.drawRightString(210 * mm - 18 * mm, 10 * mm, f"Issued via {footer}")
        finally:
            canvas.restoreState()

    return _draw
