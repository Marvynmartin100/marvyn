

# Create your models here.

#appele de model
from django.db import models
from django.contrib.auth.models import User
from datetime import date
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from django.core.validators import FileExtensionValidator
from phonenumber_field.modelfields import PhoneNumberField

#fin

#
from core.constants import NATIONALITE_CHOICES
from core.constants import SEXE_CHOICES
from core.constants import ROLE_CHOICES
from core.constants import CHOICE_PROVINCE
from core.constants import CHOICE_ARRONDISSEMENT
from core.constants import REPRESENTANT_CHOICES
#

class Profil(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profil"  # accès direct via user.profil
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='postulant'  # valeur par défaut
    )

    photo = models.ImageField(
        upload_to="photos/",
        blank=True,
        null=True,
        default="images/default.png"  # optionnel : image par défaut
    )


    nationalite = models.CharField(
        max_length=10,
        choices=NATIONALITE_CHOICES,
        default='GA'
    )

    sexe = models.CharField(
        max_length=5,
        choices=SEXE_CHOICES
    )

    telephone = PhoneNumberField(region='GA', blank=True, null=True)
    date_naissance = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)  # date de création du profil
    updated_at = models.DateTimeField(auto_now=True)  # dernière modif du profil

    slug = models.SlugField(max_length=150, unique=True, blank=True)

    class Meta:
        verbose_name = "Profil"
        verbose_name_plural = "Profils"
        ordering = ["-created_at"]

    def generate_unique_slug(self):
        base_slug = slugify(self.user.username)
        slug = base_slug
        counter = 1
        while self.__class__.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.generate_unique_slug()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.role}"

    @property
    def age(self):
        if self.date_naissance:
            today = date.today()
            return today.year - self.date_naissance.year - (
                    (today.month, today.day) < (self.date_naissance.month, self.date_naissance.day)
            )
        return None

    def clean(self):
        # Vérifier que l'âge est >= 16 ans
        if self.date_naissance:
            age = self.age
            if age < 16:
                raise ValidationError("L'âge du postulant doit être d'au moins 16 ans.")

    @property
    def full_name(self):
        return f"{self.user.first_name} {self.user.last_name}"




# model postulant

class Postulant(models.Model):
    profil = models.OneToOneField(
        "Profil",
        on_delete=models.CASCADE,
        related_name="postulant"
    )

    cv = models.FileField(
        upload_to="cvs/",
        blank=True,
        null=True ,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'docx'])]
    )
    lettre_motivation = models.TextField(blank=True, null=True)
    intro_postulant = models.CharField(max_length=150,blank=True, null=True)
    bio_postulant = models.TextField(blank=True, null=True)
    province = models.CharField(max_length=50, choices=CHOICE_PROVINCE,default="estuaire")
    arrondissement = models.CharField(max_length=50, choices=CHOICE_ARRONDISSEMENT,default="libreville_1")
    quartier = models.CharField(max_length=150,blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)  # suivi des modifs
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Postulant"
        verbose_name_plural = "Postulants"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.profil.user.username} - Postulant"




# model employeur

class Employeur(models.Model):
    profil = models.OneToOneField(
        "Profil",
        on_delete=models.CASCADE,
        related_name="employeur"
    )
    representant_entreprise = models.CharField(
        max_length=3,
        choices=REPRESENTANT_CHOICES,
    )

    societe = models.ForeignKey(
        "Societe",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employeurs"
    )
    bio_employeur = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Employeur"
        verbose_name_plural = "Employeurs"
        ordering = ["profil__user__username"]



    def __str__(self):
        return f"{self.profil.user.username} - Employeur"



class Societe(models.Model):
    nom_societe = models.CharField(max_length=150, blank=True, null=True)
    logo_societe = models.ImageField(upload_to="photos/", blank=True, null=True)
    secteur_activite = models.CharField(max_length=150, blank=True, null=True)
    adresse_societe = models.CharField(max_length=255, blank=True, null=True)
    site_web = models.URLField(blank=True, null=True)
    bio_societe = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Société"
        verbose_name_plural = "Sociétés"
        ordering = ["nom_societe"]

    def __str__(self):
        return self.nom_societe



class Blacklist(models.Model):
    email = models.EmailField(unique=True)
    date_ajout = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # suivi des modifications
    raison_bannissement = models.TextField(blank=True, null=True)
    admin = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='blacklist_actions'
    )

    def __str__(self):
        admin_name = self.admin.username if self.admin else 'N/A'
        return f"{self.email} - ajouté par {admin_name} ({self.raison_bannissement[:30] if self.raison_bannissement else 'N/A'})"
