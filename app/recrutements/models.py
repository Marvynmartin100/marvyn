

# Create your models here.
#
from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.core.validators import MinValueValidator
from django.utils import timezone
#
from core.constants import STATUS_CHOICES
from core.constants import NIVEAU_CHOICES
from core.constants import TYPE_CONTRAT_CHOICES
from core.constants import STATUT2_CHOICES
from core.constants import STATUT3_CHOICES
from core.constants import STATUT5_CHOICES
#
from core.fonction_reutilisables import nom_final
# model Abonnement

class Abonnement(models.Model):
    postulant = models.ForeignKey(
        'comptes.Postulant',
        on_delete=models.CASCADE,
        related_name='abonnements'
    )
    employeur = models.ForeignKey(
        'comptes.Employeur',
        on_delete=models.CASCADE,
        related_name='abonnements_postulants'
    )
    date_abonnement = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='actif')

    class Meta:
        constraints = [
        models.UniqueConstraint(
            fields=['postulant', 'employeur'], name='unique_postulant_employeur'
        )
    ]
        ordering = ['-date_abonnement']

    def __str__(self):
        statut = dict(STATUS_CHOICES).get(self.status, self.status).capitalize()
        nom_employeur = nom_final(self.employeur)
        nom_postulant = self.postulant.profil.user.username
        return f"{nom_postulant} → {nom_employeur} ({statut})"


# model Competence

class Competence(models.Model):
    libelle = models.CharField(max_length=100)
    niveau = models.CharField(
    max_length=50,
    choices=NIVEAU_CHOICES,
    default='debutant'
)
    postulant = models.ForeignKey(
        'comptes.Postulant',
        on_delete=models.CASCADE,
        related_name='competences'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
        models.UniqueConstraint(
            fields=['postulant', 'libelle'],
            name='unique_postulant_competence'
        )
    ]
        ordering = ['libelle']
    def __str__(self):
        return f"{self.libelle} ({self.niveau}) - {self.postulant.profil.user.username}"



# model

from core.constants import CHOICE_PROVINCE
from core.constants import CHOICE_ARRONDISSEMENT

from datetime import timedelta
from django.utils import timezone


class OffreEmploi(models.Model):

    titre = models.CharField(max_length=200)
    domaine = models.CharField(max_length=150, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    type_contrat = models.CharField(max_length=20, choices=TYPE_CONTRAT_CHOICES)

    date_publication = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    province_emploie = models.CharField(max_length=50, choices=CHOICE_PROVINCE, default="estuaire")
    arrondissement_emploie = models.CharField(max_length=50, choices=CHOICE_ARRONDISSEMENT, default="libreville_1")
    quartier_emploie = models.CharField(max_length=150,blank=True, null=True)

    statut = models.CharField(max_length=20, choices=STATUT2_CHOICES, default='active')

    prerequi_postulant = models.CharField(max_length=400,blank=True, null=True)
    horaire = models.CharField(max_length=100, blank=True, null=True)
    salaire_propose = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)]
    )
    nombre_vues = models.PositiveIntegerField(default=0)

    employeur = models.ForeignKey(
        'comptes.Employeur',
        on_delete=models.CASCADE,
        related_name='offres'
    )
    slug = models.SlugField(max_length=200, unique=True, blank=True)

    def generate_unique_slug(self):
        nom_employeur = nom_final(self.employeur)
        base_slug = slugify(f"{self.titre}-{nom_employeur}")
        slug = base_slug
        counter = 1
        while OffreEmploi.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.generate_unique_slug()
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Offre d'emploi"
        verbose_name_plural = "Offres d'emploi"
        ordering = ['-date_publication']

    def is_expired(self):
        return self.statut == 'expiree' or (timezone.now() - self.date_publication).days > 7

    @property
    def date_expiration(self):
        """L'offre expire automatiquement 30 jours après sa publication."""
        return (self.updated_at + timedelta(days=7)).date()

    @property
    def jours_restants(self):
        """Retourne le nombre de jours restants avant expiration."""
        today = timezone.now().date()
        expiration = self.date_expiration
        remaining = (expiration - today).days
        return max(remaining, 0)

    def __str__(self):
        nom_employeur = nom_final(self.employeur)
        return f"{self.titre} - {nom_employeur}"



# model candidature

class Candidature(models.Model):

    date_candidature = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    statut = models.CharField(max_length=20, choices=STATUT3_CHOICES, default='en attente')
    postulant = models.ForeignKey(
        'comptes.Postulant',
        on_delete=models.CASCADE,
        related_name='candidatures'
    )
    offre = models.ForeignKey(
        'OffreEmploi',
        on_delete=models.CASCADE,
        related_name='candidatures'
    )

    class Meta:
        constraints = [
        models.UniqueConstraint(
            fields=['postulant', 'offre'],
            name='unique_postulant_offre'
        )
    ]
        ordering = ['-date_candidature']
    def __str__(self):
        return f"{self.postulant.profil.user.username} → {self.offre.titre} ({self.statut})"



# model FavoriOffre

class FavoriOffre(models.Model):
    postulant = models.ForeignKey(
        'comptes.Postulant',
        on_delete=models.CASCADE,
        related_name='favoris_offres'
    )
    offre = models.ForeignKey(
        'OffreEmploi',
        on_delete=models.CASCADE,
        related_name='favoris'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
        models.UniqueConstraint(
            fields=['postulant', 'offre'],
            name='unique_postulant_offre_favori'
        )
    ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.postulant.profil.user.username} → {self.offre.titre}"



# model FavoriCandidat

class FavoriCandidat(models.Model):
    employeur = models.ForeignKey(
        'comptes.Employeur',
        on_delete=models.CASCADE,
        related_name='favoris_candidats'
    )
    postulant = models.ForeignKey(
        'comptes.Postulant',
        on_delete=models.CASCADE,
        related_name='favoris_par_employeurs'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
        models.UniqueConstraint(
            fields=['employeur', 'postulant'],
            name='unique_employeur_postulant_favori'
        )
    ]
        ordering = ['-created_at']

    def __str__(self):
        nom_employeur=nom_final(self.employeur)
        return f"{nom_employeur} → {self.postulant.profil.user.username}"



class Recommandation(models.Model):


    employeur = models.ForeignKey(
        "comptes.Employeur", on_delete=models.CASCADE, related_name="recommandations"
    )
    postulant = models.ForeignKey(
        "comptes.Postulant", on_delete=models.CASCADE, related_name="recommandations_recues"
    )
    offre = models.ForeignKey(
        "OffreEmploi", on_delete=models.CASCADE, related_name="recommandations"
    )
    statut = models.CharField(max_length=20, choices=STATUT5_CHOICES, default="en_attente")
    date_envoi = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["employeur", "postulant", "offre"],
                name="unique_recommandation"
        )
    ]
    ordering = ["-date_envoi"]

    def __str__(self):
        nom_employeur = nom_final(self.employeur)
        return f"{nom_employeur} → {self.postulant.profil.user.username} ({self.offre.titre})"




