
from django.urls import path
from . import views
urlpatterns = [
    path('creer_offre_emploi/', views.creer_offre_emploi, name='creer_offre_emploi'),
    path('offres/<slug:slug>/', views.detail_offre_emploi, name='detail_offre_emploi'),
    path('liste_offres/', views.liste_offres_employeur, name='liste_offres'),
    path('supprimer_offre/<int:offre_id>/', views.supprimer_offre, name='supprimer_offre'),


    path('liste_postulant/', views.liste_postulant, name='liste_postulant'),


    path('postulant/<slug:slug>/', views.profil_public_postulant, name='profil_public_postulant'),


    path('postulant/<int:postulant_id>/ajouter-favori/', views.ajouter_favori_postulant, name='ajouter_favori_postulant'),
    path('favoris/', views.employeur_favoris, name='employeur_favoris'),
    path('retirer-favori/<int:favori_id>/', views.retirer_favori_postulant, name='retirer_favori_postulant'),


    path("postulant/<slug:postulant_slug>/recommander/", views.recommander_postulant, name="recommander_postulant"),
    path('recrutements/get_offres_employeur/', views.get_offres_employeur, name='get_offres_employeur'),


    path("mes-recommandations/", views.mes_recommandations_employeur, name="mes_recommandations_employeur"),
    path("annuler-recommandation/<int:recommandation_id>/", views.annuler_recommandation_employeur, name="annuler_recommandation_employeur"),
    path("mes-recommandations_postulant/", views.mes_recommandations_postulant, name="mes_recommandations_postulant"),




    path('liste_offres_postulant/', views.liste_offres_actives, name='liste_offre_postulant'),
    path('offres_postulant/<slug:slug>/', views.detail_offre_postulant, name='detail_offre_postulant'),
    path('offres/<slug:slug>/postuler/', views.postuler_offre_postulant, name='postuler_offre'),
    path('mes-candidatures/', views.liste_candidatures, name='liste_candidatures'),

    path('candidatures_employeur', views.liste_candidatures_employeur, name='liste_candidatures_employeur'),

# recrutements/urls.py
    path('offres/<int:pk>/relancer/', views.relancer_offre, name='relancer_offre'),
    path('offres_employeur/<slug:slug>/', views.detail_offre_employeur, name='detail_offre_employeur'),


]