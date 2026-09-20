"""
celery_config.py

Celery configuration for the NEMA spatial task queue (plan Phase 2.4):
- Redis broker + result backend
- Task routing for certificate generation and spatial processing
- Automatic task discovery from the worker module
"""

import os

# Redis connection URL (broker and result backend share the same Redis instance)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Celery configuration
celery_app_config = {
    "broker_url": REDIS_URL,
    "result_backend": REDIS_URL,
    "task_serializer": "json",
    "result_serializer": "json",
    "accept_content": ["json"],
    "task_routes": {
        "worker.generate_certificate_task": {"queue": "certificates"},
        "worker.process_spatial_query": {"queue": "spatial"},
    },
    "task_default_queue": "default",
    "worker_prefetch_multiplier": 1,
    "task_acks_late": True,
    "worker_max_tasks_per_child": 100,
    "task_time_limit": 300,  # 5 minutes per task
    "task_soft_time_limit": 240,  # 4 minutes soft limit
    "result_expires": 3600,  # Results expire after 1 hour
    "beat_schedule": {
        "cleanup-expired-certificates": {
            "task": "worker.cleanup_expired_certificates",
            "schedule": 3600.0,  # Every hour
        },
        "refresh-cache-stats": {
            "task": "worker.refresh_cache_stats",
            "schedule": 300.0,  # Every 5 minutes
        },
    },
}