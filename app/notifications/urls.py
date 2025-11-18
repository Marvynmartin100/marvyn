from django.urls import path
from . import views

urlpatterns = [
    # Notifications postulant
    path('notification_postulant/', views.notification_postulant, name='notification_postulant'),
    path('notifications/postulant/marquer-toutes/', views.marquer_toutes_comme_lues_postulant, name='marquer_toutes_comme_lues_postulant'),

    # Notifications employeur
    path('notification_employeur/', views.notification_employeur, name='notification_employeur'),
    path('notifications/employeur/marquer-toutes/', views.marquer_toutes_comme_lues_employeur, name='marquer_toutes_comme_lues_employeur'),
]
