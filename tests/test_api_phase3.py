"""
tests/test_api_phase3.py

API-level tests for the Phase 3 monetization features:
- Billing plans + API key registration endpoints (Phase 3.2)
- Quota enforcement (401/402/429) on assess & report endpoints (Phase 3.2)
- Payment initiation/status/activation flow (Phase 3.1)
- Flood risk endpoint (Phase 3.3)
"""

import sqlite3

import pytest
from fastapi.testclient import TestClient

import storage
import payments as payment_gateway
from main import app
from api import routes as api_routes

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolated_db(monkeypatch, tmp_path):
    """Point the SQLite layer at a throwaway database for every test."""
    db_path = str(tmp_path / "app_data.db")
    monkeypatch.setattr(storage, "DEFAULT_DB_PATH", db_path)
    yield db_path


# --- Billing catalog & keys ---------------------------------------------------------

def test_billing_plans_endpoint():
    resp = client.get("/api/v1/billing/plans")
    assert resp.status_code == 200
    plans = resp.json()["plans"]
    assert set(plans.keys()) == {"free", "instant", "pro", "law_firm"}
    assert plans["instant"]["certificates"] is True


def test_data_coverage_endpoint_reports_provenance():
    resp = client.get("/api/v1/data-coverage")
    assert resp.status_code == 200
    data = resp.json()
    assert data["coverage_status"] in {"verified", "community_or_unverified"}
    assert "notice" in data
    assert "sources" in data


def test_register_api_key_only_allows_free_tier():
    resp = client.post(
        "/api/v1/billing/api-keys",
        json={"name": "Test Agency", "tier": "pro"},
    )
    assert resp.status_code == 403

    free = client.post("/api/v1/billing/api-keys", json={"name": "Test Agency", "tier": "free"})
    assert free.status_code == 200
    record = free.json()["api_key"]
    assert record["key"].startswith("nema_")
    assert record["tier"] == "free"


def test_register_api_key_rejects_unknown_tier():
    resp = client.post("/api/v1/billing/api-keys", json={"name": "XY", "tier": "diamond"})
    assert resp.status_code == 400


def test_invalid_api_key_is_401():
    resp = client.post(
        "/api/v1/assess-plot",
        json={"lat": 0.35, "lon": 32.6},
        headers={"X-API-Key": "nema_unknown"},
    )
    assert resp.status_code == 401


# --- Quota enforcement ----------------------------------------------------------------

def _make_exhausted_key(db_path, tier="free", used=10_000):
    record = storage.create_api_key("Exhausted", tier=tier, db_path=db_path)
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            "UPDATE api_keys SET requests_used = ? WHERE key = ?",
            (used, record["key"]),
        )
    return record["key"]


def test_assess_plot_blocks_exhausted_key_with_429(isolated_db):
    key = _make_exhausted_key(isolated_db, tier="free", used=5)  # free limit = 5
    resp = client.post(
        "/api/v1/assess-plot",
        json={"lat": 0.35, "lon": 32.6},
        headers={"X-API-Key": key},
    )
    assert resp.status_code == 429
    assert "quota" in resp.json()["detail"].lower()


def test_assess_plot_allows_within_quota_and_records_usage(isolated_db):
    record = storage.create_api_key("Counter", tier="free", db_path=isolated_db)
    resp = client.post(
        "/api/v1/assess-plot",
        json={"lat": 0.35, "lon": 32.6},
        headers={"X-API-Key": record["key"]},
    )
    assert resp.status_code == 200
    fetched = storage.get_api_key(record["key"], db_path=isolated_db)
    assert fetched["requests_used"] == 1


def test_usage_endpoint_reports_quota(isolated_db):
    record = storage.create_api_key("Dashboard", tier="pro", db_path=isolated_db)
    client.post(
        "/api/v1/assess-plot",
        json={"lat": 0.35, "lon": 32.6},
        headers={"X-API-Key": record["key"]},
    )
    resp = client.get("/api/v1/billing/usage", headers={"X-API-Key": record["key"]})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["tier"] == "pro"
    assert data["requests_used"] == 1
    assert data["remaining"] == 29
    assert data["last_used_at"] is not None


def test_usage_endpoint_rejects_unknown_key():
    resp = client.get("/api/v1/billing/usage", headers={"X-API-Key": "nema_nope"})
    assert resp.status_code == 401


def test_reports_are_disabled_by_default(isolated_db):
    record = storage.create_api_key("Freebie", tier="free", db_path=isolated_db)
    resp = client.post(
        "/api/v1/reports/generate",
        json={"lat": 0.3476, "lon": 32.5825},
        headers={"X-API-Key": record["key"]},
    )
    assert resp.status_code == 503


def test_pro_tier_can_generate_reports_when_explicitly_enabled(isolated_db, monkeypatch):
    monkeypatch.setenv("ENABLE_PROFESSIONAL_REPORTS", "true")
    record = storage.create_api_key("Pro User", tier="pro", db_path=isolated_db)
    resp = client.post(
        "/api/v1/reports/generate",
        json={"lat": 0.3476, "lon": 32.5825},
        headers={"X-API-Key": record["key"]},
    )
    assert resp.status_code == 200
    assert resp.json()["certificate_id"].startswith("NEMA-")
    fetched = storage.get_api_key(record["key"], db_path=isolated_db)
    assert fetched["requests_used"] == 1


# --- Pay-per-certificate entitlement (credit-based 'instant' tier) -----------------------

def test_instant_tier_is_not_quota_blocked(isolated_db):
    """
    Regression: 'instant' is pay-per-certificate (reports_per_month = 0), which
    was being read as "zero requests allowed" and returned 429 for every call —
    blocking the very product the customer paid for.
    """
    record = storage.create_api_key("Instant Buyer", tier="instant", db_path=isolated_db)
    resp = client.post(
        "/api/v1/assess-plot",
        json={"lat": 0.35, "lon": 32.6},
        headers={"X-API-Key": record["key"]},
    )
    assert resp.status_code == 200


def test_instant_tier_without_credits_is_refused_not_quota_blocked(isolated_db, monkeypatch):
    monkeypatch.setenv("ENABLE_PROFESSIONAL_REPORTS", "true")
    record = storage.create_api_key("Instant Buyer", tier="instant", db_path=isolated_db)
    resp = client.post(
        "/api/v1/reports/generate",
        json={"lat": 0.3476, "lon": 32.5825},
        headers={"X-API-Key": record["key"]},
    )
    # 402 (buy a credit) — not 429 (monthly quota), which is unactionable here.
    assert resp.status_code == 402
    assert "credits" in resp.json()["detail"].lower()


def test_instant_tier_spends_one_credit_per_certificate(isolated_db, monkeypatch):
    monkeypatch.setenv("ENABLE_PROFESSIONAL_REPORTS", "true")
    record = storage.create_api_key(
        "Instant Buyer", tier="instant", db_path=isolated_db, certificate_credits=1
    )
    headers = {"X-API-Key": record["key"]}

    first = client.post("/api/v1/reports/generate", json={"lat": 0.3476, "lon": 32.5825}, headers=headers)
    assert first.status_code == 200
    assert first.json()["certificate_id"].startswith("NEMA-")
    assert storage.get_api_key(record["key"], db_path=isolated_db)["certificate_credits"] == 0

    second = client.post("/api/v1/reports/generate", json={"lat": 0.3476, "lon": 32.5825}, headers=headers)
    assert second.status_code == 402
    assert "credits" in second.json()["detail"].lower()


def test_subscription_tier_does_not_spend_credits(isolated_db, monkeypatch):
    """pro/law_firm are quota-based, so credits must be irrelevant to them."""
    monkeypatch.setenv("ENABLE_PROFESSIONAL_REPORTS", "true")
    record = storage.create_api_key("Pro User", tier="pro", db_path=isolated_db)
    resp = client.post(
        "/api/v1/reports/generate",
        json={"lat": 0.3476, "lon": 32.5825},
        headers={"X-API-Key": record["key"]},
    )
    assert resp.status_code == 200
    assert storage.get_api_key(record["key"], db_path=isolated_db)["certificate_credits"] == 0


def test_usage_endpoint_reports_credit_based_tier(isolated_db):
    record = storage.create_api_key(
        "Instant Buyer", tier="instant", db_path=isolated_db, certificate_credits=4
    )
    resp = client.get("/api/v1/billing/usage", headers={"X-API-Key": record["key"]})
    assert resp.status_code == 200
    data = resp.json()
    assert data["credit_based"] is True
    assert data["certificate_credits"] == 4
    # No monthly ceiling, so 'remaining' is meaningless for this tier.
    assert data["unlimited"] is True


def test_async_route_cannot_bypass_white_label_gate(isolated_db, monkeypatch):
    """
    The async route forwards 'branding' to the Celery worker. Gating only the
    synchronous route let a lower tier obtain agency branding by choosing
    /api/v1/reports/generate-async instead.
    """
    monkeypatch.setenv("ENABLE_PROFESSIONAL_REPORTS", "true")
    record = storage.create_api_key(
        "Instant Buyer", tier="instant", db_path=isolated_db, certificate_credits=1
    )
    resp = client.post(
        "/api/v1/reports/generate-async",
        json={"lat": 0.3476, "lon": 32.5825, "branding": {"agency_name": "Someone"}},
        headers={"X-API-Key": record["key"]},
    )
    assert resp.status_code == 402
    assert "White-label" in resp.json()["detail"]
    # The refusal must not have spent the paid credit.
    assert storage.get_api_key(record["key"], db_path=isolated_db)["certificate_credits"] == 1


# --- Payments -----------------------------------------------------------------------------

def test_payment_initiation_degrades_without_credentials():
    resp = client.post(
        "/api/v1/payments/initiate",
        json={"plan_id": "instant", "provider": "pesapal", "email": "u@x.com"},
    )
    assert resp.status_code == 503


def test_payment_initiation_is_disabled_before_validating_plan():
    resp = client.post("/api/v1/payments/initiate", json={"plan_id": "free"})
    assert resp.status_code == 503


def test_payment_initiation_does_not_accept_unknown_plan_while_disabled():
    resp = client.post("/api/v1/payments/initiate", json={"plan_id": "gold"})
    assert resp.status_code == 503


def test_payment_status_endpoint_without_credentials():
    resp = client.get("/api/v1/payments/status/pesapal/TRACK-1")
    assert resp.status_code == 200
    assert resp.json()["status"] == "not_configured"


def test_activate_refuses_unconfirmed_payment(isolated_db, monkeypatch):
    monkeypatch.setenv("ADMIN_API_TOKEN", "test-admin-token")
    record = storage.create_api_key("Late Buyer", tier="free", db_path=isolated_db)
    monkeypatch.setattr(
        payment_gateway,
        "check_payment_status",
        lambda provider, tx: {"status": "pending", "provider": provider},
    )
    resp = client.post(
        "/api/v1/billing/activate",
        params={
            "api_key": record["key"],
            "plan_id": "pro",
            "provider": "pesapal",
            "transaction_id": "TRACK-2",
        },
        headers={"X-Admin-Token": "test-admin-token"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "pending"
    assert storage.get_api_key(record["key"], db_path=isolated_db)["tier"] == "free"


def test_activate_upgrades_after_confirmed_payment(isolated_db, monkeypatch):
    monkeypatch.setenv("ADMIN_API_TOKEN", "test-admin-token")
    record = storage.create_api_key("Happy Buyer", tier="free", db_path=isolated_db)
    monkeypatch.setattr(
        payment_gateway,
        "check_payment_status",
        lambda provider, tx: {"status": "completed", "provider": provider},
    )
    resp = client.post(
        "/api/v1/billing/activate",
        params={
            "api_key": record["key"],
            "plan_id": "law_firm",
            "provider": "flutterwave",
            "transaction_id": "TX-9",
        },
        headers={"X-Admin-Token": "test-admin-token"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "activated"
    assert storage.get_api_key(record["key"], db_path=isolated_db)["tier"] == "law_firm"


def test_activate_rejects_unknown_key(isolated_db, monkeypatch):
    monkeypatch.setenv("ADMIN_API_TOKEN", "test-admin-token")
    monkeypatch.setattr(
        payment_gateway,
        "check_payment_status",
        lambda provider, tx: {"status": "completed", "provider": provider},
    )
    resp = client.post(
        "/api/v1/billing/activate",
        params={
            "api_key": "nema_nope",
            "plan_id": "pro",
            "provider": "pesapal",
            "transaction_id": "T",
        },
        headers={"X-Admin-Token": "test-admin-token"},
    )
    assert resp.status_code == 401


# --- Flood risk endpoint --------------------------------------------------------------------

def test_flood_risk_endpoint_available(monkeypatch):
    monkeypatch.setattr(
        api_routes,
        "flood_risk_assessment",
        lambda lat, lon, width_m=30.0, length_m=30.0: {
            "status": "available",
            "susceptibility_index": 22,
            "band": "Moderate",
        },
    )
    resp = client.post("/api/v1/flood-risk", json={"lat": 0.35, "lon": 32.6})
    assert resp.status_code == 200
    assert resp.json()["band"] == "Moderate"


def test_flood_risk_endpoint_unavailable_is_200(monkeypatch):
    monkeypatch.setattr(
        api_routes,
        "flood_risk_assessment",
        lambda lat, lon, width_m=30.0, length_m=30.0: {
            "status": "unavailable",
            "reason": "elevation_service_unreachable",
        },
    )
    resp = client.post("/api/v1/flood-risk", json={"lat": 0.35, "lon": 32.6})
    assert resp.status_code == 200
    assert resp.json()["status"] == "unavailable"


def test_flood_risk_endpoint_validates_input():
    resp = client.post("/api/v1/flood-risk", json={"lat": 99.0, "lon": 32.6})
    assert resp.status_code == 422  # ge constraint


# --- Ops --------------------------------------------------------------------------------------

def test_admin_cleanup_endpoint_requires_admin_token(isolated_db, monkeypatch):
    monkeypatch.setenv("ADMIN_API_TOKEN", "test-admin-token")
    storage.save_certificate("NEMA-KEEP", {"score": 80, "band": "SAFE"}, db_path=isolated_db)
    resp = client.post(
        "/api/v1/admin/cleanup-certificates",
        params={"days": 90},
        headers={"X-Admin-Token": "test-admin-token"},
    )
    assert resp.status_code == 200
    assert resp.json()["removed"] >= 0

