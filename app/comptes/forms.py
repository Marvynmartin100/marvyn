from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import Employeur, Profil, Societe
from django.contrib.auth.forms import AuthenticationForm

from ..recrutements.models import Competence



# 1er formulaire postulant


class PostulantRegister1Form(UserCreationForm):

    email = forms.EmailField(
        required=True,
        label="Adresse e-mail",
        widget=forms.EmailInput(attrs={"placeholder": "exemple@email.com"})
    )
    first_name = forms.CharField(required=True, label="Prénom")
    last_name = forms.CharField(required=True, label="Nom")


    class Meta:
        model = User

        fields = ["username", "first_name", "last_name", "email", "password1", "password2"]
        labels = {
            "username": "Nom d'utilisateur",
            "first_name": "Prénom",
            "last_name": "Nom",
            "password1": "Mot de passe",
            "password2": "Confirmez le mot de passe",
        }

# 2e formulaire Postulant


class PostulantRegister2Form(forms.ModelForm):
    class Meta:
        model = Profil
        fields = ["sexe", "date_naissance", "telephone", "nationalite", "photo"]
        widgets = {
            "date_naissance": forms.DateInput(attrs={"type": "date"}),
            "telephone": forms.TextInput(attrs={"placeholder": "Ex: 74269249"}),
        }


# 1e formulaire employeur


class EmployeurRegister1Form(UserCreationForm):

    email = forms.EmailField(
        required=True,
        label="Adresse e-mail",
        widget=forms.EmailInput(attrs={"placeholder": "exemple@email.com"})
    )
    first_name = forms.CharField(required=True, label="Prénom")
    last_name = forms.CharField(required=True, label="Nom")


    class Meta:
        model = User

        fields = ["username", "first_name", "last_name", "email", "password1", "password2"]
        labels = {
            "username": "Nom d'utilisateur",
            "first_name": "Prénom",
            "last_name": "Nom",
            "password1": "Mot de passe",
            "password2": "Confirmez le mot de passe",
        }

# 2e formulaire employeur


class EmployeurRegister2Form(forms.ModelForm):
    class Meta:
        model = Profil
        fields = ["sexe", "date_naissance", "telephone", "nationalite", "photo"]
        widgets = {
            "date_naissance": forms.DateInput(attrs={"type": "date"}),
            "telephone": forms.TextInput(attrs={"placeholder": "Ex: 74269249"}),
        }

# 3e formulaire employeur


class EmployeurRegister3Form(forms.ModelForm):
    class Meta:
        model = Employeur
        fields = ["representant_entreprise"]
        widgets = {
            "representant_entreprise": forms.RadioSelect(attrs={"class": "representant-radio"}),
        }


class EmployeurRegister4Form(forms.ModelForm):
    class Meta:
        model = Societe
        fields = [
            "nom_societe",
            "logo_societe",
            "secteur_activite",
            "adresse_societe",
            "site_web",
            "bio_societe",
        ]
        labels = {
            "nom_societe": "Nom de la société",
            "logo_societe": "Logo de la société",
            "secteur_activite": "Secteur d’activité",
            "adresse_societe": "Adresse complète",
            "site_web": "Site web",
            "bio_societe": "Présentation / description de la société",
        }
        widgets = {
            "nom_societe": forms.TextInput(attrs={
                "placeholder": "Ex : TechVision SARL",
                "class": "form-control societe-field"
            }),
            "logo_societe": forms.FileInput(attrs={"class": "form-control"}),
            "secteur_activite": forms.TextInput(attrs={
                "placeholder": "Informatique, BTP, Commerce...",
                "class": "form-control societe-field"
            }),
            "adresse_societe": forms.TextInput(attrs={
                "placeholder": "Adresse du siège ou du bureau principal",
                "class": "form-control societe-field"
            }),
            "site_web": forms.URLInput(attrs={
                "placeholder": "https://www.votresite.com",
                "class": "form-control societe-field"
            }),
            "bio_societe": forms.Textarea(attrs={
                "placeholder": "Décrivez brièvement l’activité de votre société",
                "class": "form-control societe-field",
                "rows": 4,
            }),
        }





class LoginForm(AuthenticationForm):
    username = forms.CharField(
        label="Nom d'utilisateur",
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': "Entrez votre nom d'utilisateur",
            'autofocus': True
        })
    )

    password = forms.CharField(
        label="Mot de passe",
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': "Entrez votre mot de passe"
        })
    )





from django import forms
from .models import Profil, Postulant, Employeur

# ==================== PHOTO ====================
class PhotoForm(forms.ModelForm):
    class Meta:
        model = Profil
        fields = ['photo']
        widgets = {
            'photo': forms.ClearableFileInput(attrs={'class': 'form-control-file'})
        }

# ==================== BIOGRAPHIE ====================
class BioForm(forms.ModelForm):
    class Meta:
        model = Postulant
        fields = ['bio_postulant']
        labels = {
            'bio_postulant': 'Votre biographie'
        }
        widgets = {
            'bio_postulant': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 5,
                'placeholder': 'Parlez-nous de votre parcours...'
            })
        }


# ==================== INTRODUCTION ====================
class IntroForm(forms.ModelForm):
    class Meta:
        model = Postulant
        fields = ['intro_postulant']
        labels = {
            'intro_postulant': 'Votre introduction'
        }
        widgets = {
            'intro_postulant': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 5,
                'placeholder': 'Parlez-nous de votre parcours...'
            })
        }

# ==================== COMPÉTENCES ====================

# Formulaire pour une compétence individuelle
class CompetenceForm(forms.ModelForm):
    class Meta:
        model = Competence
        fields = ['libelle', 'niveau']
        widgets = {
            'libelle': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Nom de la compétence'}),
            'niveau': forms.Select(attrs={'class': 'form-select'})
        }

# Formset pour gérer plusieurs compétences d’un postulant
CompetenceFormSet = forms.inlineformset_factory(
    Postulant,
    Competence,
    form=CompetenceForm,
    extra=1,       # Nombre de formulaires vides supplémentaires
    can_delete=True  # Permet de supprimer une compétence existante
)

# ==================== CV ====================
class CVForm(forms.ModelForm):
    class Meta:
        model = Postulant
        fields = ['cv']
        widgets = {
            'cv': forms.ClearableFileInput(attrs={'class': 'form-control-file'})
        }

# ==================== LETTRE DE MOTIVATION ====================
class LettreForm(forms.ModelForm):
    class Meta:
        model = Postulant
        fields = ['lettre_motivation']
        widgets = {
            'lettre_motivation': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 5,
                'placeholder': 'Rédigez votre lettre de motivation...'
            })
        }

# ==================== LOCALISATION ====================
class LocalisationForm(forms.ModelForm):
    class Meta:
        model = Postulant
        fields = ['province', 'arrondissement', 'quartier']
        widgets = {
            'province': forms.Select(attrs={'class': 'form-select'}),
            'arrondissement': forms.Select(attrs={'class': 'form-select'}),
            'quartier': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Votre quartier'})
        }

# ==================== TÉLÉPHONE ====================
class TelephoneForm(forms.ModelForm):
    class Meta:
        model = Profil
        fields = ['telephone']
        widgets = {
            'telephone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': '+241 XXX XXX XXX'})
        }






# ==================== BIOGRAPHIE EMMPLOYEUR ====================
class BioForm2(forms.ModelForm):
    class Meta:
        model = Employeur
        fields = ['bio_employeur']
        labels = {
            'bio_employeur': 'Votre biographie'
        }
        widgets = {
            'bio_employeur': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 5,
                'placeholder': 'Parlez-nous de votre parcours...'
            })
        }