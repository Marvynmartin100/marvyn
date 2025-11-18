from django.db import models

# Create your models here.

from django.contrib.auth.models import User

class Historique(models.Model):
    action = models.CharField(max_length=150)
    details = models.TextField(blank=True, null=True)
    date_action = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # suivi des modifications
    utilisateur = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='historiques'
    )

    def __str__(self):
        return f"{self.utilisateur.username} : {self.action[:50]} ({self.date_action})"

