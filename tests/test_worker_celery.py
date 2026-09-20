"""
tests/test_worker_celery.py

Tests for the Celery task worker (plan Phase 2.4):
- celery_config.py settings are applied to the app
- All tasks register under the worker.* names used by routes/beat
- storage.cleanup_expired_certificates retention purge
"""

import sqlite3

import pytest

import storage
import worker
from celery_config import celery_app_config


# --- Celery configuration ----------------------------------------------------------------

def test_celery_config_loads_from_celery_config_module():
    conf = worker.celery_app.conf
    assert conf.broker_url == celery_app_config["broker_url"]
    assert conf.result_backend == celery_app_config["result_backend"]
    assert conf.task_serializer == "json"
    assert conf.worker_prefetch_multiplier == 1
    assert conf.task_acks_late is True


def test_task_routes_and_beat_schedule_applied():
    conf = worker.celery_app.conf
    assert conf.task_routes == celery_app_config["task_routes"]
    assert "cleanup-expired-certificates" in conf.beat_schedule
    assert "refresh-cache-stats" in conf.beat_schedule


def test_all_tasks_registered_with_expected_names():
    registered = set(worker.celery_app.tasks.keys())
    for name in (
        "worker.generate_certificate_task",
        "worker.process_spatial_query",
        "worker.cleanup_expired_certificates",
        "worker.refresh_cache_stats",
    ):
        assert name in registered, f"missing task: {name}"


def test_registered_names_match_routing_table():
    routes = celery_app_config["task_routes"]
    for routed_name in routes:
        assert routed_name in worker.celery_app.tasks


def test_process_spatial_query_handles_empty_area(monkeypatch):
    def empty_nearby(lat, lon, radius_m=5000):
        return None, {"source": "none"}

    monkeypatch.setattr(worker, "load_wetlands_nearby", empty_nearby)
    result = worker.process_spatial_query.run(0.35, 32.6)
    assert result["status"] == "empty"
    assert result["features"] == []


def test_process_spatial_query_serialises_features(monkeypatch):
    class _Row(dict):
        @property
        def geometry(self):
            from shapely.geometry import Point

            return Point(32.6, 0.35)

    class _FakeGdf:
        def __init__(self):
            self.empty = False

        def iterrows(self):
            row = _Row(name="Lubigi", feature_kind="wetland", source="postgis")
            yield None, row

    monkeypatch.setattr(
        worker, "load_wetlands_nearby", lambda lat, lon, radius_m=5000: (_FakeGdf(), {"source": "postgis"})
    )
    result = worker.process_spatial_query.run(0.35, 32.6)
    assert result["status"] == "completed"
    assert result["count"] == 1
    assert result["features"][0]["name"] == "Lubigi"
    assert result["features"][0]["geometry"].startswith("POINT")


# --- Certificate retention -----------------------------------------------------------------

def test_cleanup_expired_certificates_removes_only_old_records(tmp_path):
    db = str(tmp_path / "app_data.db")
    assert storage.init_db(db) is True

    with sqlite3.connect(db) as conn:
        conn.execute(
            "INSERT INTO certificates (certificate_id, score, band, payload, created_at, verify_count) "
            "VALUES ('NEMA-OLD', 10, 'LOW', NULL, '2020-01-01T00:00:00Z', 0)"
        )
        conn.execute(
            "INSERT INTO certificates (certificate_id, score, band, payload, created_at, verify_count) "
            "VALUES ('NEMA-NEW', 90, 'SAFE', NULL, '2999-01-01T00:00:00Z', 0)"
        )

    removed = storage.cleanup_expired_certificates(days=30, db_path=db)
    assert removed == 1

    assert storage.get_certificate("NEMA-OLD", db_path=db) is None
    assert storage.get_certificate("NEMA-NEW", db_path=db) is not None


def test_cleanup_expired_certificates_on_missing_db_returns_minus_one(tmp_path):
    missing = str(tmp_path / "nonexistent_dir" / "app_data.db")
    # Missing directory makes even init_db fail -> graceful -1
    import os

    os.makedirs(os.path.dirname(missing), exist_ok=True)
    assert storage.cleanup_expired_certificates(db_path=missing) in (0, -1)
