try:
    from celery import Celery
    from app.core.config import settings

    celery_app = Celery(
        "tasks",
        broker=settings.REDIS_URL,
        backend=settings.REDIS_URL
    )

    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
    )
except ImportError:
    # Celery not installed locally — provide a no-op stub so the module imports cleanly
    class _StubCelery:
        def task(self, *args, **kwargs):
            return lambda f: f
        def conf(self):
            pass
    celery_app = _StubCelery()  # type: ignore
