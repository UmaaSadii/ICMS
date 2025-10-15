from django.apps import AppConfig

class AcademicsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "academics"

    def ready(self):
        from . import signals_updated
