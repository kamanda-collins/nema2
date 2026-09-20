"""
payments.py

Mobile Money & card payment gateway integration (plan Phase 3.1).

Gateways:
- Pesapal     : MTN MoMo + Airtel Money (Uganda), M-Pesa + Airtel (Kenya), cards
- Flutterwave : M-Pesa (Kenya), cards and cross-border/diaspora payments

Design:
- Both adapters share one facade (initiate_payment / check_payment_status)
- Credentials come from environment variables; when missing the module degrades
  gracefully to a "not_configured" status instead of raising
- All HTTP calls use short timeouts and are funnelled through thin wrappers so
  tests can mock them without network access
"""

import os
import time
import uuid
from typing import Any, Dict, Optional

import requests

# --- Configuration -----------------------------------------------------------------

PESAPAL_CONSUMER_KEY = os.getenv("PESAPAL_CONSUMER_KEY", "")
PESAPAL_CONSUMER_SECRET = os.getenv("PESAPAL_CONSUMER_SECRET", "")
PESAPAL_ENV = os.getenv("PESAPAL_ENV", "sandbox").lower()  # sandbox | production

FLW_SECRET_KEY = os.getenv("FLW_SECRET_KEY", "")

PESAPAL_BASE = {
    "sandbox": "https://cybqa.pesapal.com/pesapalv3",
    "production": "https://pay.pesapal.com/v3",
}.get(PESAPAL_ENV, "https://cybqa.pesapal.com/pesapalv3")

FLW_BASE = "https://api.flutterwave.com"

HTTP_TIMEOUT = 10  # seconds — payments must fail fast, never hang the API

# Callback URL used for gateway redirects / IPN registration
NEMA_PAYMENT_CALLBACK = os.getenv(
    "NEMA_PAYMENT_CALLBACK",
    "https://nema.kamandalabs.me/api/v1/payments/callback",
)

_supported_providers = ("pesapal", "flutterwave")


# --- HTTP helpers (thin, so tests can monkeypatch them) ----------------------------

def _http_post_json(url: str, payload: Dict[str, Any], headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    resp = requests.post(url, json=payload, headers=headers or {}, timeout=HTTP_TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def _http_get_json(url: str, headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    resp = requests.get(url, headers=headers or {}, timeout=HTTP_TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def _not_configured(provider: str) -> Dict[str, Any]:
    return {
        "status": "not_configured",
        "provider": provider,
        "message": (
            f"{provider.capitalize()} credentials missing. Set the required "
            "environment variables to enable live payments; the API remains fully "
            "functional for free-tier assessments meanwhile."
        ),
    }


# --- Pesapal adapter ----------------------------------------------------------------

_pesapal_token_cache: Dict[str, Any] = {"token": None, "expires_at": 0.0}


def pesapal_configured() -> bool:
    return bool(PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET)

def _pesapal_token() -> Optional[str]:
    """Fetch (and cache) an OAuth bearer token from Pesapal."""
    now = time.time()
    if _pesapal_token_cache["token"] and now < _pesapal_token_cache["expires_at"]:
        return _pesapal_token_cache["token"]

    data = _http_post_json(
        f"{PESAPAL_BASE}/api/Auth/RequestToken",
        {"consumer_key": PESAPAL_CONSUMER_KEY, "consumer_secret": PESAPAL_CONSUMER_SECRET},
    )
    token = data.get("token")
    if not token:
        return None

    # Pesapal returns an ISO expiry; default to 4 minutes to be safe.
    _pesapal_token_cache["token"] = token
    _pesapal_token_cache["expires_at"] = now + 240
    if data.get("expiryDate"):
        try:
            from datetime import datetime

            dt = datetime.fromisoformat(str(data["expiryDate"]).replace("Z", "+00:00"))
            _pesapal_token_cache["expires_at"] = dt.timestamp()
        except Exception:
            pass
    return token


def initiate_pesapal_payment(
    amount: float,
    currency: str,
    phone: Optional[str],
    email: Optional[str],
    reference: str,
    description: str,
) -> Dict[str, Any]:
    """Submit an order request to Pesapal and return the checkout redirect."""
    if not pesapal_configured():
        return _not_configured("pesapal")

    token = _pesapal_token()
    if not token:
        return {"status": "error", "provider": "pesapal", "message": "Could not authenticate with Pesapal."}

    payload: Dict[str, Any] = {
        "id": reference,
        "currency": currency,
        "amount": float(amount),
        "description": description,
        "callback_url": NEMA_PAYMENT_CALLBACK,
        "notification_id": None,
        "billing_address": {
            "email_address": email or "",
            "phone_number": phone or "",
            "country_code": "UG",
        },
    }
    try:
        data = _http_post_json(
            f"{PESAPAL_BASE}/api/Transactions/SubmitOrderRequest",
            payload,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        )
    except Exception as exc:
        return {"status": "error", "provider": "pesapal", "message": f"Pesapal request failed: {exc}"}

    tracking_id = data.get("order_tracking_id")
    if data.get("status") != "200" or not tracking_id:
        return {
            "status": "error",
            "provider": "pesapal",
            "message": f"Pesapal rejected the order: {data.get('message', data)}",
        }

    return {
        "status": "pending",
        "provider": "pesapal",
        "reference": reference,
        "transaction_id": tracking_id,
        "redirect_url": data.get("redirect_url"),
        "message": "Pesapal order created. Redirect the payer to redirect_url.",
    }


def check_pesapal_status(transaction_id: str) -> Dict[str, Any]:
    """Query a Pesapal order's transaction status."""
    if not pesapal_configured():
        return _not_configured("pesapal")

    token = _pesapal_token()
    if not token:
        return {"status": "error", "provider": "pesapal", "message": "Could not authenticate with Pesapal."}

    try:
        data = _http_get_json(
            f"{PESAPAL_BASE}/api/Transactions/GetTransactionStatus"
            f"?orderTrackingId={transaction_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
    except Exception as exc:
        return {"status": "error", "provider": "pesapal", "message": f"Pesapal request failed: {exc}"}

    state = str(data.get("status", "")).upper()
    # Pesapal API status codes: 200/COMPLETED -> paid, 500/600/FAILED -> rejected
    mapped = {"COMPLETED": "completed", "200": "completed", "600": "failed", "FAILED": "failed"}.get(
        state, "pending"
    )
    return {
        "status": mapped,
        "provider": "pesapal",
        "transaction_id": transaction_id,
        "raw_status": state,
        "amount": data.get("amount"),
        "currency": data.get("currency"),
        "payment_method": data.get("payment_method"),
    }


# --- Flutterwave adapter --------------------------------------------------------------

def flutterwave_configured() -> bool:
    return bool(FLW_SECRET_KEY)


def initiate_flutterwave_payment(
    amount: float,
    currency: str,
    phone: Optional[str],
    email: Optional[str],
    reference: str,
    description: str,
) -> Dict[str, Any]:
    """Create a Flutterwave hosted checkout link (supports M-Pesa, cards, MoMo)."""
    if not flutterwave_configured():
        return _not_configured("flutterwave")

    payload: Dict[str, Any] = {
        "tx_ref": reference,
        "amount": amount,
        "currency": currency,
        "redirect_url": NEMA_PAYMENT_CALLBACK,
        "customizations": {
            "title": "NEMA Wetlands Due Diligence",
            "description": description[:200],
        },
    }
    if email:
        payload["customer"] = {"email": email}
        if phone:
            payload["customer"]["phonenumber"] = phone

    try:
        data = _http_post_json(
            f"{FLW_BASE}/v3/payments",
            payload,
            headers={
                "Authorization": f"Bearer {FLW_SECRET_KEY}",
                "Content-Type": "application/json",
            },
        )
    except Exception as exc:
        return {"status": "error", "provider": "flutterwave", "message": f"Flutterwave request failed: {exc}"}

    if data.get("status") != "success" or not data.get("data", {}).get("link"):
        return {
            "status": "error",
            "provider": "flutterwave",
            "message": f"Flutterwave rejected the payment: {data.get('message', data)}",
        }

    return {
        "status": "pending",
        "provider": "flutterwave",
        "reference": reference,
        "transaction_id": reference,  # FLW uses tx_ref until the callback returns the real id
        "redirect_url": data["data"]["link"],
        "message": "Flutterwave checkout created. Redirect the payer to redirect_url.",
    }


def check_flutterwave_status(transaction_id: str) -> Dict[str, Any]:
    """Verify a Flutterwave transaction by its id or tx_ref."""
    if not flutterwave_configured():
        return _not_configured("flutterwave")

    try:
        data = _http_get_json(
            f"{FLW_BASE}/v3/transactions/verify_by_reference?tx_ref={transaction_id}",
            headers={"Authorization": f"Bearer {FLW_SECRET_KEY}"},
        )
    except Exception as exc:
        return {"status": "error", "provider": "flutterwave", "message": f"Flutterwave request failed: {exc}"}

    payload = data.get("data", {}) or {}
    state = str(payload.get("status", "")).lower()
    mapped = {
        "successful": "completed",
        "success": "completed",
        "failed": "failed",
        "cancelled": "failed",
    }.get(state, "pending")
    return {
        "status": mapped,
        "provider": "flutterwave",
        "transaction_id": transaction_id,
        "raw_status": state,
        "amount": payload.get("amount"),
        "currency": payload.get("currency"),
        "payment_method": payload.get("payment_type") or "",
    }


# --- Unified facade -------------------------------------------------------------------

def supported_providers() -> tuple:
    """Providers this module knows how to talk to (configured or not)."""
    return _supported_providers


def _new_reference(plan_id: str) -> str:
    return f"NEMA-{plan_id.upper()}-{uuid.uuid4().hex[:10].upper()}"


def initiate_payment(
    plan_id: str,
    amount: float,
    currency: str = "USD",
    provider: str = "pesapal",
    phone: Optional[str] = None,
    email: Optional[str] = None,
    description: str = "NEMA wetland due diligence report",
) -> Dict[str, Any]:
    """
    Unified payment initiation across gateways.

    Returns a provider-shaped dict; never raises for business errors.
    """
    provider = (provider or "pesapal").lower()
    if provider not in _supported_providers:
        return {
            "status": "error",
            "provider": provider,
            "message": f"Unsupported provider '{provider}'. Choose from {list(_supported_providers)}.",
        }

    reference = _new_reference(plan_id)
    if provider == "pesapal":
        return initiate_pesapal_payment(amount, currency, phone, email, reference, description)
    return initiate_flutterwave_payment(amount, currency, phone, email, reference, description)


def check_payment_status(provider: str, transaction_id: str) -> Dict[str, Any]:
    """Unified transaction status check across gateways."""
    provider = (provider or "").lower()
    if provider == "pesapal":
        return check_pesapal_status(transaction_id)
    if provider == "flutterwave":
        return check_flutterwave_status(transaction_id)
    return {
        "status": "error",
        "provider": provider,
        "message": f"Unsupported provider '{provider}'.",
    }

