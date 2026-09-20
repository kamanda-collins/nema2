"""
storage.py

SQLite persistence layer (plan Phase 1.4):
- Saves user feedback and contact submissions persistently
- Records audit events (assessments, queries, errors)
- Stores generated certificates and tracks digital verification lookups
- Degrades gracefully on read-only / unwritable filesystems
"""

import json
import os
import sqlite3
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), "data", "app_data.db")

# Pricing tiers (plan Phase 3.2). storage owns the list so billing.py can import
# it without a circular dependency.
TIER_ORDER = ("free", "instant", "pro", "law_firm")


def utc_now() -> str:
    """Return current UTC time in ISO format ending with Z."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _resolve_db_path(db_path: Optional[str]) -> str:
    return db_path if db_path is not None else DEFAULT_DB_PATH


def _get_connection(db_path: str):
    """Safely connect to SQLite database, creating parent directories if needed."""
    if os.path.isdir(db_path):
        raise OSError(f"Target db_path '{db_path}' is a directory, not a database file.")

    parent = os.path.dirname(db_path)
    if parent and not os.path.exists(parent):
        os.makedirs(parent, exist_ok=True)

    conn = sqlite3.connect(db_path, timeout=5)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: Optional[str] = None) -> bool:
    """Initialize database tables idempotently."""
    path = _resolve_db_path(db_path)
    try:
        with _get_connection(path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS feedback (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    message TEXT NOT NULL,
                    contact TEXT,
                    meta TEXT,
                    created_at TEXT NOT NULL
                );
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_type TEXT NOT NULL,
                    payload TEXT,
                    created_at TEXT NOT NULL
                );
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS certificates (
                    certificate_id TEXT PRIMARY KEY,
                    score INTEGER,
                    band TEXT,
                    payload TEXT,
                    created_at TEXT NOT NULL,
                    verify_count INTEGER DEFAULT 0
                );
                """
            )
            conn.commit()
            return True
    except Exception:
        return False


def save_feedback(
    message: Optional[str],
    contact: Optional[str] = None,
    meta: Optional[Dict[str, Any]] = None,
    db_path: Optional[str] = None,
) -> Optional[int]:
    """Save feedback record. Returns row ID or None on failure."""
    if not message or not isinstance(message, str) or not message.strip():
        return None

    path = _resolve_db_path(db_path)
    try:
        init_db(path)
        with _get_connection(path) as conn:
            cursor = conn.cursor()
            meta_json = json.dumps(meta) if meta is not None else None
            cursor.execute(
                """
                INSERT INTO feedback (message, contact, meta, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (message.strip(), contact.strip() if contact else None, meta_json, utc_now()),
            )
            conn.commit()
            return cursor.lastrowid
    except Exception:
        return None


def recent_feedback(limit: int = 50, db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve recent feedback entries, newest first."""
    path = _resolve_db_path(db_path)
    try:
        with _get_connection(path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, message, contact, meta, created_at FROM feedback ORDER BY id DESC LIMIT ?",
                (limit,),
            )
            rows = []
            for r in cursor.fetchall():
                meta_dict = None
                if r["meta"]:
                    try:
                        meta_dict = json.loads(r["meta"])
                    except Exception:
                        meta_dict = r["meta"]
                rows.append(
                    {
                        "id": r["id"],
                        "message": r["message"],
                        "contact": r["contact"],
                        "meta": meta_dict,
                        "created_at": r["created_at"],
                    }
                )
            return rows
    except Exception:
        return []


def log_event(
    event_type: Optional[str],
    payload: Optional[Dict[str, Any]] = None,
    db_path: Optional[str] = None,
) -> Optional[int]:
    """Log an application or audit event."""
    if not event_type or not isinstance(event_type, str) or not event_type.strip():
        return None

    path = _resolve_db_path(db_path)
    try:
        init_db(path)
        with _get_connection(path) as conn:
            cursor = conn.cursor()
            payload_json = json.dumps(payload) if payload is not None else None
            cursor.execute(
                """
                INSERT INTO events (event_type, payload, created_at)
                VALUES (?, ?, ?)
                """,
                (event_type.strip(), payload_json, utc_now()),
            )
            conn.commit()
            return cursor.lastrowid
    except Exception:
        return None


def recent_events(
    event_type: Optional[str] = None,
    limit: int = 50,
    db_path: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve recent events, newest first."""
    path = _resolve_db_path(db_path)
    try:
        with _get_connection(path) as conn:
            cursor = conn.cursor()
            if event_type:
                cursor.execute(
                    """
                    SELECT id, event_type, payload, created_at FROM events
                    WHERE event_type = ? ORDER BY id DESC LIMIT ?
                    """,
                    (event_type, limit),
                )
            else:
                cursor.execute(
                    "SELECT id, event_type, payload, created_at FROM events ORDER BY id DESC LIMIT ?",
                    (limit,),
                )

            rows = []
            for r in cursor.fetchall():
                data = None
                if r["payload"]:
                    try:
                        data = json.loads(r["payload"])
                    except Exception:
                        data = r["payload"]
                rows.append(
                    {
                        "id": r["id"],
                        "event_type": r["event_type"],
                        "payload": data,
                        "created_at": r["created_at"],
                    }
                )
            return rows
    except Exception:
        return []


def save_certificate(
    certificate_id: Optional[str],
    payload: Dict[str, Any],
    db_path: Optional[str] = None,
) -> bool:
    """Save or update a certificate record."""
    if not certificate_id or not isinstance(certificate_id, str) or not certificate_id.strip():
        return False

    path = _resolve_db_path(db_path)
    try:
        init_db(path)
        score = payload.get("score") if isinstance(payload, dict) else None
        band = payload.get("band") if isinstance(payload, dict) else None
        payload_str = json.dumps(payload)

        with _get_connection(path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO certificates (certificate_id, score, band, payload, created_at, verify_count)
                VALUES (?, ?, ?, ?, ?, 0)
                ON CONFLICT(certificate_id) DO UPDATE SET
                    score = excluded.score,
                    band = excluded.band,
                    payload = excluded.payload;
                """,
                (certificate_id.strip(), score, band, payload_str, utc_now()),
            )
            conn.commit()
            return True
    except Exception:
        return False


def get_certificate(
    certificate_id: Optional[str],
    increment_views: bool = False,
    db_path: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Retrieve certificate by ID."""
    if not certificate_id or not isinstance(certificate_id, str):
        return None

    path = _resolve_db_path(db_path)
    try:
        with _get_connection(path) as conn:
            cursor = conn.cursor()
            if increment_views:
                cursor.execute(
                    "UPDATE certificates SET verify_count = verify_count + 1 WHERE certificate_id = ?",
                    (certificate_id.strip(),),
                )
                conn.commit()

            cursor.execute(
                """
                SELECT certificate_id, score, band, payload, created_at, verify_count
                FROM certificates WHERE certificate_id = ?
                """,
                (certificate_id.strip(),),
            )
            row = cursor.fetchone()
            if not row:
                return None

            payload_data = None
            if row["payload"]:
                try:
                    payload_data = json.loads(row["payload"])
                except Exception:
                    payload_data = row["payload"]

            return {
                "certificate_id": row["certificate_id"],
                "score": row["score"],
                "band": row["band"],
                "payload": payload_data,
                "created_at": row["created_at"],
                "verify_count": row["verify_count"],
            }
    except Exception:
        return None


def stats(db_path: Optional[str] = None) -> Dict[str, Any]:
    """Return aggregated platform statistics."""
    path = _resolve_db_path(db_path)
    default_res: Dict[str, Any] = {
        "feedback": 0,
        "events": 0,
        "certificates": 0,
        "certificates_by_band": {},
    }
    try:
        with _get_connection(path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM feedback")
            fb_count = int(cursor.fetchone()[0])

            cursor.execute("SELECT COUNT(*) FROM events")
            events_count = int(cursor.fetchone()[0])

            cursor.execute("SELECT COUNT(*) FROM certificates")
            cert_count = int(cursor.fetchone()[0])

            cursor.execute(
                "SELECT band, COUNT(*) FROM certificates WHERE band IS NOT NULL GROUP BY band"
            )
            bands = {str(row[0]): int(row[1]) for row in cursor.fetchall()}

            return {
                "feedback": fb_count,
                "events": events_count,
                "certificates": cert_count,
                "certificates_by_band": bands,
            }
    except Exception:
        return default_res


def cleanup_expired_certificates(
    days: int = 90,
    db_path: Optional[str] = None,
) -> int:
    """
    Delete certificate records older than `days` (plan Phase 2.4 periodic task).

    Returns the number of records removed, or -1 on failure.
    """
    if days < 1:
        days = 1
    path = _resolve_db_path(db_path)
    try:
        init_db(path)
        with _get_connection(path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                DELETE FROM certificates
                WHERE created_at <= strftime('%Y-%m-%dT%H:%M:%SZ', 'now', ?)
                """,
                (f"-{int(days)} days",),
            )
            removed = cursor.rowcount
            conn.commit()
            return max(removed, 0)
    except Exception:
        return -1


# --- API Keys & Usage Quotas (plan Phase 3.2 Freemium Paywall) -------------------

def _init_api_keys_table(cursor) -> None:
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS api_keys (
            key TEXT PRIMARY KEY,
            name TEXT,
            tier TEXT NOT NULL DEFAULT 'free',
            requests_used INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            last_used_at TEXT
        );
        """
    )


def create_api_key(
    name: Optional[str],
    tier: str = "free",
    db_path: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Mint a new API key bound to a pricing tier.

    Returns the full key record, or None on failure.
    """
    import uuid

    if tier not in TIER_ORDER:
        return None

    path = _resolve_db_path(db_path)
    key = f"nema_{uuid.uuid4().hex}"
    try:
        init_db(path)
        with _get_connection(path) as conn:
            cursor = conn.cursor()
            _init_api_keys_table(cursor)
            cursor.execute(
                """
                INSERT INTO api_keys (key, name, tier, requests_used, created_at, last_used_at)
                VALUES (?, ?, ?, 0, ?, NULL)
                """,
                (key, name, tier, utc_now()),
            )
            conn.commit()
            return {
                "key": key,
                "name": name,
                "tier": tier,
                "requests_used": 0,
                "created_at": utc_now(),
                "last_used_at": None,
            }
    except Exception:
        return None


def get_api_key(
    key: Optional[str],
    increment_usage: bool = False,
    db_path: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Retrieve an API key record, optionally bumping its usage counter."""
    if not key or not isinstance(key, str) or not key.startswith("nema_"):
        return None

    path = _resolve_db_path(db_path)
    try:
        with _get_connection(path) as conn:
            cursor = conn.cursor()
            if increment_usage:
                cursor.execute(
                    """
                    UPDATE api_keys
                    SET requests_used = requests_used + 1, last_used_at = ?
                    WHERE key = ?
                    """,
                    (utc_now(), key.strip()),
                )
                conn.commit()
            cursor.execute(
                """
                SELECT key, name, tier, requests_used, created_at, last_used_at
                FROM api_keys WHERE key = ?
                """,
                (key.strip(),),
            )
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "key": row["key"],
                "name": row["name"],
                "tier": row["tier"],
                "requests_used": int(row["requests_used"] or 0),
                "created_at": row["created_at"],
                "last_used_at": row["last_used_at"],
            }
    except Exception:
        return None


def set_api_key_tier(
    key: Optional[str],
    tier: str,
    db_path: Optional[str] = None,
) -> bool:
    """Upgrade/downgrade an API key's pricing tier (e.g. after a payment)."""
    if not key or tier not in TIER_ORDER:
        return False

    path = _resolve_db_path(db_path)
    try:
        init_db(path)
        with _get_connection(path) as conn:
            cursor = conn.cursor()
            _init_api_keys_table(cursor)
            cursor.execute(
                "UPDATE api_keys SET tier = ? WHERE key = ?",
                (tier, key.strip()),
            )
            conn.commit()
            return cursor.rowcount > 0
    except Exception:
        return False