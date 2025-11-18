from django.apps import AppConfig


class AccueilConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app.accueil'


    def ready(self):
        import app.accueil.signals  # <-- c’est ici que Django va charger les signaux




