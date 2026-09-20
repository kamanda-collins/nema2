"""
tests/test_storage.py

Tests for the SQLite persistence layer (plan Phase 1.4): feedback, audit log
and issued certificates - including graceful degradation on unwritable paths.
"""

import os

import pytest

from storage import (
    get_certificate,
    init_db,
    log_event,
    recent_events,
    recent_feedback,
    save_certificate,
    save_feedback,
    stats,
    utc_now,
)


@pytest.fixture
def db(tmp_path):
    return str(tmp_path / "app_data.db")


# --- Setup ---------------------------------------------------------------------

def test_init_db_creates_schema(db):
    assert init_db(db) is True
    assert os.path.exists(db)


def test_init_db_is_idempotent(db):
    assert init_db(db) is True
    assert init_db(db) is True


def test_utc_now_is_iso_z():
    stamp = utc_now()
    assert stamp.endswith("Z")
    assert "T" in stamp


# --- Feedback --------------------------------------------------------------------

def test_save_and_read_feedback(db):
    row_id = save_feedback("Great tool!", contact="buyer@example.com", meta={"page": "results"}, db_path=db)
    assert row_id is not None
    rows = recent_feedback(db_path=db)
    assert len(rows) == 1
    assert rows[0]["message"] == "Great tool!"
    assert rows[0]["contact"] == "buyer@example.com"


def test_save_feedback_rejects_blank(db):
    assert save_feedback("   ", db_path=db) is None
    assert save_feedback(None, db_path=db) is None
    assert recent_feedback(db_path=db) == []


def test_recent_feedback_returns_newest_first(db):
    save_feedback("first", db_path=db)
    save_feedback("second", db_path=db)
    rows = recent_feedback(db_path=db)
    assert rows[0]["message"] == "second"
    assert rows[1]["message"] == "first"


# --- Audit log --------------------------------------------------------------------

def test_log_event_and_filter_by_type(db):
    log_event("assessment", {"score": 95}, db_path=db)
    log_event("certificate_issued", {"id": "ABC"}, db_path=db)
    assert len(recent_events(db_path=db)) == 2
    assessments = recent_events(event_type="assessment", db_path=db)
    assert len(assessments) == 1
    assert assessments[0]["event_type"] == "assessment"


def test_log_event_rejects_missing_type(db):
    assert log_event(None, db_path=db) is None
    assert recent_events(db_path=db) == []


def test_recent_events_limit(db):
    for i in range(5):
        log_event("ping", {"i": i}, db_path=db)
    assert len(recent_events(limit=2, db_path=db)) == 2


# --- Certificates --------------------------------------------------------------------

def test_save_and_get_certificate_roundtrip(db):
    payload = {"score": 95, "band": "Safe", "country": "Uganda", "lat": 0.39, "lon": 32.63}
    assert save_certificate("NEMA-2026-ABC123", payload, db_path=db) is True
    record = get_certificate("NEMA-2026-ABC123", db_path=db)
    assert record["certificate_id"] == "NEMA-2026-ABC123"
    assert record["score"] == 95
    assert record["band"] == "Safe"
    assert record["payload"]["country"] == "Uganda"


def test_get_unknown_certificate_returns_none(db):
    assert get_certificate("DOES-NOT-EXIST", db_path=db) is None


def test_certificate_verify_count_increments(db):
    save_certificate("NEMA-2026-XYZ", {"score": 80, "band": "Caution"}, db_path=db)
    get_certificate("NEMA-2026-XYZ", increment_views=True, db_path=db)
    record = get_certificate("NEMA-2026-XYZ", increment_views=True, db_path=db)
    assert record["verify_count"] == 2


def test_certificate_upsert_does_not_duplicate(db):
    save_certificate("NEMA-2026-DUP", {"score": 50, "band": "Caution"}, db_path=db)
    save_certificate("NEMA-2026-DUP", {"score": 20, "band": "High Risk"}, db_path=db)
    record = get_certificate("NEMA-2026-DUP", db_path=db)
    assert record["score"] == 20
    assert record["band"] == "High Risk"
    assert stats(db_path=db)["certificates"] == 1


def test_save_certificate_requires_id(db):
    assert save_certificate(None, {"score": 1}, db_path=db) is False


# --- Stats -----------------------------------------------------------------------------

def test_stats_aggregates_activity(db):
    save_feedback("nice", db_path=db)
    log_event("assessment", {}, db_path=db)
    save_certificate("C1", {"score": 95, "band": "Safe"}, db_path=db)
    save_certificate("C2", {"score": 30, "band": "High Risk"}, db_path=db)
    summary = stats(db_path=db)
    assert summary["feedback"] == 1
    assert summary["events"] == 1
    assert summary["certificates"] == 2
    assert summary["certificates_by_band"] == {"Safe": 1, "High Risk": 1}


# --- Graceful degradation ----------------------------------------------------------------

def test_all_writes_degrade_gracefully_on_bad_path(tmp_path):
    """A directory path as the DB target must not raise anywhere."""
    bad = str(tmp_path)  # a directory, not a file
    assert save_feedback("hello", db_path=bad) is None
    assert log_event("assessment", {}, db_path=bad) is None
    assert save_certificate("ID1", {"score": 1}, db_path=bad) is False
    assert get_certificate("ID1", db_path=bad) is None
    assert recent_feedback(db_path=bad) == []
    assert recent_events(db_path=bad) == []
    assert stats(db_path=bad)["certificates"] == 0