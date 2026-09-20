"""
billing.py

Freemium paywall & tiered plans (plan Phase 3.2):
- Catalog of the four commercial tiers from the plan pricing table
- Quota checks for API keys issued against those tiers
- Anonymous callers fall into the generous-but-limited free tier

Tiers:
- free      : Instant on-screen traffic light + basic distance (no PDF certificate)
- instant   : Pay-per-certificate credit (UGX 25,000 / KES 650)
- pro       : Pro Realtor Pass (UGX 150,000 / KES 4,500 per month, 30 reports)
- law_firm  : Law Firm / Surveyor Pack (UGX 450,000 per month, unlimited)
"""

from typing import Any, Dict, Optional

from storage import TIER_ORDER

# Payment plan catalog (plan section 3.2). Amounts are minor units where the
# provider requires integers; we keep display strings here for the API.
PAYMENT_PLANS: Dict[str, Dict[str, Any]] = {
    "free": {
        "plan_id": "free",
        "title": "Free Preview",
        "price_display": "Free",
        "currency": None,
        "amount": 0,
        "reports_per_month": 5,
        "certificates": False,
        "includes": [
            "Instant on-screen traffic light risk score",
            "Basic distance to nearest wetland",
        ],
    },
    "instant": {
        "plan_id": "instant",
        "title": "Instant Due Diligence Certificate",
        "price_display": "UGX 25,000 / KES 650 (~$7)",
        "currency": "USD",
        "amount": 7,
        "reports_per_month": 0,  # credit-based, not subscription
        "certificates": True,
        "includes": [
            "Official stamped 2-page PDF certificate",
            "Satellite context map with buffer rings",
            "QR code digital verification",
            "Legal citations (NEA 2019 / EMCA 1999)",
        ],
    },
    "pro": {
        "plan_id": "pro",
        "title": "Pro Realtor Pass",
        "price_display": "UGX 150,000 / KES 4,500 (~$45) / month",
        "currency": "USD",
        "amount": 45,
        "reports_per_month": 30,
        "certificates": True,
        "includes": [
            "30 reports per month",
            "Custom agency branding & watermark",
            "WhatsApp sharing kit",
        ],
    },
    "law_firm": {
        "plan_id": "law_firm",
        "title": "Law Firm / Surveyor Pack",
        "price_display": "UGX 450,000 (~$120) / month",
        "currency": "USD",
        "amount": 120,
        "reports_per_month": -1,  # -1 = unlimited
        "certificates": True,
        "includes": [
            "Unlimited reports",
            "Batch CSV scanning",
            "Raw GeoJSON/DXF exports",
        ],
    },
}

# Anonymous (no API key) callers are treated as a slightly restricted free tier
ANONYMOUS_MONTHLY_QUOTA = 3


def get_plan(plan_id: str) -> Optional[Dict[str, Any]]:
    """Look up a plan from the commercial catalog."""
    return PAYMENT_PLANS.get(plan_id)


def list_plans() -> Dict[str, Dict[str, Any]]:
    """Return the full pricing catalog."""
    return PAYMENT_PLANS


def quota_status(tier: str, requests_used: int) -> Dict[str, Any]:
    """
    Evaluate a key's usage against its tier limit.

    Returns a dict describing allowance. Never raises.
    """
    plan = PAYMENT_PLANS.get(tier)
    if plan is None:
        plan = PAYMENT_PLANS["free"]

    limit = plan.get("reports_per_month", 0)
    unlimited = limit == -1
    remaining = None if unlimited else max(limit - requests_used, 0)
    allowed = unlimited or requests_used < limit

    return {
        "tier": tier,
        "limit": limit,
        "unlimited": unlimited,
        "used": requests_used,
        "remaining": remaining,
        "allowed": allowed,
    }


def anonymous_quota_status(requests_used: int) -> Dict[str, Any]:
    """Quota evaluation for callers without an API key."""
    allowed = requests_used < ANONYMOUS_MONTHLY_QUOTA
    return {
        "tier": "anonymous",
        "limit": ANONYMOUS_MONTHLY_QUOTA,
        "unlimited": False,
        "used": requests_used,
        "remaining": max(ANONYMOUS_MONTHLY_QUOTA - requests_used, 0),
        "allowed": allowed,
    }


def resolve_key_quota(
    api_key_record: Optional[Dict[str, Any]],
    anonymous_used: int = 0,
) -> Dict[str, Any]:
    """
    Build the quota response for either an API key holder or an anonymous caller.

    api_key_record: full record from storage.get_api_key() (or None for anonymous)
    """
    if api_key_record is None:
        status = anonymous_quota_status(anonymous_used)
        status["api_key"] = None
        return status

    status = quota_status(
        api_key_record.get("tier", "free"),
        int(api_key_record.get("requests_used", 0) or 0),
    )
    status["api_key"] = {
        "name": api_key_record.get("name"),
        "tier": api_key_record.get("tier"),
    }
    return status


def valid_tier(tier: str) -> bool:
    """Check whether a tier id is one of the purchasable tiers."""
    return tier in TIER_ORDER and tier in PAYMENT_PLANS
