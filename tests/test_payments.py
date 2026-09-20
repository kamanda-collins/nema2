"""
tests/test_payments.py

Tests for the payment gateway layer (plan Phase 3.1):
- Graceful "not_configured" degradation without credentials
- Mocked Pesapal flow (token -> order -> status)
- Mocked Flutterwave flow (checkout -> verify)
- Unified facade dispatch + reference format
"""

import pytest

import payments
from payments import (
    check_payment_status,
    check_flutterwave_status,
    check_pesapal_status,
    initiate_flutterwave_payment,
    initiate_payment,
    initiate_pesapal_payment,
    _new_reference,
)


@pytest.fixture(autouse=True)
def reset_token_cache():
    payments._pesapal_token_cache["token"] = None
    payments._pesapal_token_cache["expires_at"] = 0.0
    yield
    payments._pesapal_token_cache["token"] = None
    payments._pesapal_token_cache["expires_at"] = 0.0


# --- Unconfigured degradation ----------------------------------------------------------

def test_pesapal_without_credentials_degrades_gracefully(monkeypatch):
    monkeypatch.setattr(payments, "PESAPAL_CONSUMER_KEY", "")
    monkeypatch.setattr(payments, "PESAPAL_CONSUMER_SECRET", "")

    result = initiate_pesapal_payment(7, "USD", None, None, "REF1", "desc")
    assert result["status"] == "not_configured"
    assert result["provider"] == "pesapal"


def test_flutterwave_without_credentials_degrades_gracefully(monkeypatch):
    monkeypatch.setattr(payments, "FLW_SECRET_KEY", "")
    result = initiate_flutterwave_payment(7, "USD", None, None, "REF2", "desc")
    assert result["status"] == "not_configured"


def test_unsupported_provider_is_rejected():
    result = initiate_payment("instant", 7, provider="paypal")
    assert result["status"] == "error"
    assert "paypal" in result["message"]


# --- Pesapal mocked flow -----------------------------------------------------------------

def test_pesapal_happy_path(monkeypatch):
    monkeypatch.setattr(payments, "PESAPAL_CONSUMER_KEY", "key")
    monkeypatch.setattr(payments, "PESAPAL_CONSUMER_SECRET", "secret")

    calls = []

    def fake_post(url, payload, headers=None):
        calls.append(url)
        if "RequestToken" in url:
            return {"token": "tok-123", "expiryDate": "2030-01-01T00:00:00Z"}
        return {
            "status": "200",
            "order_tracking_id": "TRACK-9",
            "redirect_url": "https://pay.pesapal.example/checkout",
        }

    monkeypatch.setattr(payments, "_http_post_json", fake_post)

    result = initiate_pesapal_payment(7, "USD", "+256700000000", "b@x.com", "NEMA-REF", "desc")
    assert result["status"] == "pending"
    assert result["transaction_id"] == "TRACK-9"
    assert result["redirect_url"].startswith("https://")
    assert len(calls) == 2  # token + order

    # Token must now be cached (no extra token call on status check)
    monkeypatch.setattr(
        payments,
        "_http_get_json",
        lambda url, headers=None: {"status": "COMPLETED", "amount": 7, "currency": "USD"},
    )
    status = check_pesapal_status("TRACK-9")
    assert status["status"] == "completed"
    assert len(calls) == 2  # proves the token cache avoided a re-auth

def test_pesapal_rejected_order(monkeypatch):
    monkeypatch.setattr(payments, "PESAPAL_CONSUMER_KEY", "key")
    monkeypatch.setattr(payments, "PESAPAL_CONSUMER_SECRET", "secret")
    monkeypatch.setattr(
        payments,
        "_http_post_json",
        lambda url, payload, headers=None: (
            {"token": "t"} if "RequestToken" in url else {"status": "500", "message": "bad request"}
        ),
    )
    result = initiate_pesapal_payment(7, "USD", None, None, "R", "d")
    assert result["status"] == "error"
    assert "rejected" in result["message"]


def test_pesapal_maps_failed_status(monkeypatch):
    monkeypatch.setattr(payments, "PESAPAL_CONSUMER_KEY", "key")
    monkeypatch.setattr(payments, "PESAPAL_CONSUMER_SECRET", "secret")
    payments._pesapal_token_cache["token"] = "cached"
    payments._pesapal_token_cache["expires_at"] = float("inf")

    monkeypatch.setattr(
        payments, "_http_get_json", lambda url, headers=None: {"status": "600"}
    )
    assert check_pesapal_status("T")["status"] == "failed"


# --- Flutterwave mocked flow ---------------------------------------------------------------

def test_flutterwave_happy_path(monkeypatch):
    monkeypatch.setattr(payments, "FLW_SECRET_KEY", "flw-secret")

    monkeypatch.setattr(
        payments,
        "_http_post_json",
        lambda url, payload, headers=None: {
            "status": "success",
            "data": {"link": "https://checkout.flutterwave.example/pay"},
        },
    )
    result = initiate_flutterwave_payment(45, "USD", None, "c@x.com", "NEMA-PRO-X", "d")
    assert result["status"] == "pending"
    assert result["redirect_url"].startswith("https://")

    monkeypatch.setattr(
        payments,
        "_http_get_json",
        lambda url, headers=None: {
            "data": {"status": "successful", "amount": 45, "currency": "USD", "payment_type": "card"}
        },
    )
    status = check_flutterwave_status("NEMA-PRO-X")
    assert status["status"] == "completed"
    assert status["payment_method"] == "card"


def test_flutterwave_rejected_payment(monkeypatch):
    monkeypatch.setattr(payments, "FLW_SECRET_KEY", "flw-secret")
    monkeypatch.setattr(
        payments,
        "_http_post_json",
        lambda url, payload, headers=None: {"status": "error", "message": "invalid amount"},
    )
    result = initiate_flutterwave_payment(0, "USD", None, None, "R", "d")
    assert result["status"] == "error"


def test_flutterwave_network_error_is_contained(monkeypatch):
    monkeypatch.setattr(payments, "FLW_SECRET_KEY", "flw-secret")

    def boom(url, payload, headers=None):
        raise ConnectionError("network down")

    monkeypatch.setattr(payments, "_http_post_json", boom)
    result = initiate_flutterwave_payment(7, "USD", None, None, "R", "d")
    assert result["status"] == "error"
    assert "network down" in result["message"]


# --- Facade ---------------------------------------------------------------------------------

def test_new_reference_format():
    ref = _new_reference("instant")
    assert ref.startswith("NEMA-INSTANT-")
    assert len(ref) > len("NEMA-INSTANT-")


def test_check_payment_status_dispatch(monkeypatch):
    monkeypatch.setattr(payments, "FLW_SECRET_KEY", "flw-secret")
    monkeypatch.setattr(
        payments,
        "_http_get_json",
        lambda url, headers=None: {"data": {"status": "successful"}},
    )
    assert check_payment_status("flutterwave", "TX")["status"] == "completed"

    bad = check_payment_status("stripe", "TX")
    assert bad["status"] == "error"
