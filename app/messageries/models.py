from django.core.validators import MaxLengthValidator
from django.db import models

# Create your models here.

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


class Conversation(models.Model):
    utilisateur1 = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='conversation1'
    )
    utilisateur2 = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='conversation2'
    )



    date_creation = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['utilisateur1', 'utilisateur2'],
                name='unique_conversation'
            )
        ]

    def __str__(self):
        return f"Conversation {self.id} : {self.utilisateur1.username} ↔ {self.utilisateur2.username}"

    def clean(self):
        if self.utilisateur1 == self.utilisateur2:
            raise ValidationError("Une conversation ne peut pas être créée avec soi-même.")

    def save(self, *args, **kwargs):
        # Empêche la création d'une conversation inverse
        if self.utilisateur1.id > self.utilisateur2.id:
            self.utilisateur1, self.utilisateur2 = self.utilisateur2, self.utilisateur1
        super().save(*args, **kwargs)


# model Message

class Message(models.Model):
    contenu = models.TextField(validators=[MaxLengthValidator(5000)])
    date_envoi = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # suivi des modifications
    lu = models.BooleanField(default=False)
    date_lecture = models.DateTimeField(null=True, blank=True)
    supprime_par_expediteur = models.BooleanField(default=False)
    supprime_par_destinataire = models.BooleanField(default=False)
    expediteur = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='messages_envoyes'
    )
    conversation = models.ForeignKey(
        'Conversation',
        on_delete=models.CASCADE,
        related_name='messages'
    )

    class Meta:
        ordering = ['date_envoi']

    def __str__(self):
        return f"{self.expediteur.username} : {self.contenu[:30]}..."

    def clean(self):
        if not self.contenu.strip():
            raise ValidationError("Le message ne peut pas être vide")

    def save(self, *args, **kwargs):
        self.full_clean()  # appelle clean() avant save
        super().save(*args, **kwargs)




