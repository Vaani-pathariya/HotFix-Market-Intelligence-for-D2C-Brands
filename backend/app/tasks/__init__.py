from celery import Celery

# Celery uses Redis (already running via docker-compose)
celery_app = Celery(
    "marketsense",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0",
    include=["app.tasks.scrape_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
