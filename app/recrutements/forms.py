

from django import forms
from .models import OffreEmploi

class OffreEmploiForm(forms.ModelForm):
    class Meta:
        model = OffreEmploi
        fields = [
            'titre',
            'domaine',
            'description',
            'type_contrat',
            'province_emploie',
            'arrondissement_emploie',
            'quartier_emploie',
            'horaire',
            'salaire_propose',
            'prerequi_postulant',

        ]

        widgets = {
            'titre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': "Intitulé du poste (ex: Développeur web)"
            }),
            'domaine': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': "Secteur d'activité (ex: Informatique, BTP, Santé...)"
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 5,
                'placeholder': "Décrivez les missions et les responsabilités du poste"
            }),
            'type_contrat': forms.Select(attrs={
                'class': 'form-select'
            }),
            'province_emploie': forms.Select(attrs={
                'class': 'form-select'
            }),
            'arrondissement_emploie': forms.Select(attrs={
                'class': 'form-select'
            }),
            'quartier_emploie': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': "Quartier ou zone de travail"
            }),
            'horaire': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': "Ex: Temps plein, 8h-16h, horaires flexibles..."
            }),
            'salaire_propose': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': "Ex: 250000 (en FCFA)"
            }),
            'prerequi_postulant': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': "Ex: Bac+2 en informatique, 1 an d'expérience, maîtrise de Python..."
            }),
            'statut': forms.Select(attrs={
                'class': 'form-select'
            }),
        }

        labels = {
            'titre': "Titre du poste",
            'domaine': "Domaine d’activité",
            'description': "Description du poste",
            'type_contrat': "Type de contrat",
            'province_emploie': "Province",
            'arrondissement_emploie': "Arrondissement",
            'quartier_emploie': "Quartier",
            'horaire': "Horaires de travail",
            'salaire_propose': "Salaire proposé",
            'prerequi_postulant': "Prérequis / Profil recherché",
            'statut': "Statut de l’offre",
        }
