"""
URL configuration for Gabonworkera project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

# urls.py à la racine du projet Gabonworkera

from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    # Interface d'administration Django
    path('admin/', admin.site.urls),
    path('', include('app.accueil.urls')),

    # Gestion des comptes utilisateurs (inscription, connexion, profil, etc.)
    path('comptes/', include('app.comptes.urls')),

    # Système de notifications (alertes, rappels, etc.)
    path('notifications/', include('app.notifications.urls')),

    # Recrutement et offres d’emploi
    path('recrutements/', include('app.recrutements.urls')),

    # Historique des actions et événements utilisateur
    #path('historiques/', include('app.historiques.urls')),

    # Messagerie interne entre utilisateurs
    path('messageries/', include('app.messageries.urls')),
]


from django.conf import settings
from django.conf.urls.static import static


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)