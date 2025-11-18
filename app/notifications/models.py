from django.db import models

# Create your models here.

from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError

#
from core.constants import TYPE_CHOICES
from core.constants import STATUT4_CHOICES
from core.constants import ACTION_CHOICES


class Notification(models.Model):

    titre = models.CharField(max_length=100,blank=True, null=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    contenu = models.TextField(blank=True, null=True)
    statut = models.CharField(max_length=10, choices=STATUT4_CHOICES, default='non lu')
    date_notif = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    emetteur = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications_emise'
    )

    # Pourquoi SET_NULL ?
    # Parce que certaines notifications (ex : celles de l’admin ou automatiques) n’ont pas forcément un auteur humain identifiable.

    destinataire = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications_recu'
    )
    action_possible = models.CharField(max_length=20, choices=ACTION_CHOICES, default='aucune')

    # Generic relation pour cible
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    cible = GenericForeignKey('content_type', 'object_id')

    # explication des 3 precedentes

    # Dans la 1er ligne
    # Ce champ pointe vers le modèle ContentType de Django, qui référence tous les modèles installés dans ton projet.
    # Il permet de stocker le type de modèle auquel la notification est liée (ex : Message, Candidature, Offre, etc.).

    # Dans la 2e ligne
    # Ce champ stocke l’identifiant de l’objet cible (ex : l’ID du message ou de l’offre concernée).
    # Il est combiné avec content_type pour retrouver l’objet exact

    # Dans la 3e ligne
    # C’est une clé étrangère dynamique : elle utilise les deux champs précédents pour accéder directement à l’objet cible.
    # Par exemple, si content_type = Message et object_id = 42, alors cible te renvoie Message.objects.get(id=42).


    def clean(self):
        if (self.content_type is None) != (self.object_id is None):
            raise ValidationError("content_type et object_id doivent être tous les deux définis ou tous les deux vides")

    def __str__(self):
        return f"{self.type} → {self.destinataire.username} ({self.statut}) : {self.contenu[:30]}..."

