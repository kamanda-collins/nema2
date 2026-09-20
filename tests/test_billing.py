"""
tests/test_billing.py

Tests for the freemium paywall (plan Phase 3.2):
- Plan catalog completeness
- Quota evaluation for all tiers (incl. anonymous)
- API key lifecycle: create, read, usage increment, tier upgrade
"""

import pytest

import billing
import storage


@pytest.fixture
def db(tmp_path):
    return str(tmp_path / "app_data.db")


# --- Plan catalog -------------------------------------------------------------------

def test_all_four_tiers_are_listed():
    plans = billing.list_plans()
    assert set(plans.keys()) == {"free", "instant", "pro", "law_firm"}


def test_plan_pricing_matches_catalog():
    instant = billing.get_plan("instant")
    assert instant is not None
    assert instant["amount"] == 7
    assert instant["certificates"] is True

    pro = billing.get_plan("pro")
    assert pro["reports_per_month"] == 30

    law = billing.get_plan("law_firm")
    assert law["reports_per_month"] == -1  # unlimited

    assert billing.get_plan("does_not_exist") is None


def test_valid_tier_rejects_unknown():
    assert billing.valid_tier("pro") is True
    assert billing.valid_tier("enterprise") is False


# --- Quota evaluation -----------------------------------------------------------------

def test_quota_blocks_when_exhausted():
    status = billing.quota_status("free", 5)
    assert status["allowed"] is False
    assert status["remaining"] == 0


def test_quota_allows_within_limit():
    status = billing.quota_status("pro", 29)
    assert status["allowed"] is True
    assert status["remaining"] == 1


def test_law_firm_is_unlimited():
    status = billing.quota_status("law_firm", 10_000)
    assert status["unlimited"] is True
    assert status["allowed"] is True


def test_unknown_tier_falls_back_to_free():
    status = billing.quota_status("bogus", 0)
    assert status["tier"] == "bogus"
    assert status["limit"] == billing.PAYMENT_PLANS["free"]["reports_per_month"]


def test_anonymous_quota_status():
    within = billing.anonymous_quota_status(0)
    assert within["allowed"] is True
    exhausted = billing.anonymous_quota_status(billing.ANONYMOUS_MONTHLY_QUOTA)
    assert exhausted["allowed"] is False


def test_resolve_key_quota_for_key_and_anonymous():
    key_view = billing.resolve_key_quota({"name": "X", "tier": "pro", "requests_used": 1})
    assert key_view["allowed"] is True
    assert key_view["api_key"]["tier"] == "pro"

    anon_view = billing.resolve_key_quota(None, anonymous_used=2)
    assert anon_view["tier"] == "anonymous"
    assert anon_view["api_key"] is None


# --- API key persistence ---------------------------------------------------------------

def test_create_and_get_api_key(db):
    record = storage.create_api_key("Kira Estates", tier="pro", db_path=db)
    assert record is not None
    assert record["key"].startswith("nema_")

    fetched = storage.get_api_key(record["key"], db_path=db)
    assert fetched is not None
    assert fetched["tier"] == "pro"
    assert fetched["name"] == "Kira Estates"
    assert fetched["requests_used"] == 0


def test_get_api_key_rejects_bad_keys(db):
    assert storage.get_api_key(None, db_path=db) is None
    assert storage.get_api_key("", db_path=db) is None
    assert storage.get_api_key("sk-fake", db_path=db) is None  # wrong prefix
    assert storage.get_api_key("nema_" + "0" * 32, db_path=db) is None  # unknown


def test_usage_increment_persists(db):
    record = storage.create_api_key("Counter", tier="free", db_path=db)
    storage.get_api_key(record["key"], increment_usage=True, db_path=db)
    storage.get_api_key(record["key"], increment_usage=True, db_path=db)

    fetched = storage.get_api_key(record["key"], db_path=db)
    assert fetched["requests_used"] == 2
    assert fetched["last_used_at"] is not None


def test_set_api_key_tier_upgrade(db):
    record = storage.create_api_key("Upgradable", tier="free", db_path=db)
    assert storage.set_api_key_tier(record["key"], "law_firm", db_path=db) is True
    assert storage.get_api_key(record["key"], db_path=db)["tier"] == "law_firm"


def test_set_api_key_tier_rejects_bad_input(db):
    record = storage.create_api_key("X", tier="free", db_path=db)
    assert storage.set_api_key_tier(record["key"], "enterprise", db_path=db) is False
    assert storage.set_api_key_tier("nema_unknown", "pro", db_path=db) is False


def test_create_api_key_rejects_unknown_tier(db):
    assert storage.create_api_key("X", tier="not-a-tier", db_path=db) is None
