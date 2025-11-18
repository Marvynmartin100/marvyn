from django.contrib.auth.views import LogoutView
from django.urls import path
from . import views
from .views import complete_espace_postulant

urlpatterns = [
    path('inscription', views.inscription, name='inscription'),
    path('postulant_step1/', views.postulant_step1, name='postulant_step1'),
    path('postulant_step2/', views.postulant_step2, name='postulant_step2'),

    path('employeur_step1/', views.employeur_step1, name='employeur_step1'),
    path('employeur_step2/', views.employeur_step2, name='employeur_step2'),
    path('employeur_step3/', views.employeur_step3, name='employeur_step3'),


    path('espace_postulant/',views.espace_postulant,name='espace_postulant'),
    path('complete_espace_postulant/',views.complete_espace_postulant,name='complete_espace_postulant'),



    path('espace_employeur/',views.espace_employeur,name='espace_employeur'),
    path('complete_espace_employeur/',views.complete_espace_employeur,name='complete_espace_employeur'),





    path('connexion/',views.connexion,name='connexion'),
    path('deconnexion/', LogoutView.as_view(next_page='accueil'), name='deconnexion'),

]
