

from django.urls import path
from . import views

urlpatterns = [
    path('creer-conversation/<str:type_objet>/<int:objet_id>/',views.creer_conversation,name='creer_conversation'),
    path('conversation/<int:conversation_id>/', views.conversation_detail, name='conversation_detail'),
    path('envoyer-message/<int:conversation_id>/', views.envoyer_message, name='envoyer_message'),

    path('employeur_conversation/', views.liste_conversations_employeur, name='liste_conversations_employeur'),
    path('postulant_conversation/', views.liste_conversations_postulant, name='liste_conversations_postulant'),
    path('message/<int:message_id>/supprimer/', views.supprimer_message, name='supprimer_message'),

path('test-chat/', views.test_chat, name='test_chat'),



]
