from django.contrib.auth.decorators import login_required
# Create your views here.
from django.shortcuts import render, redirect, get_object_or_404


# importation 1
from django.contrib import messages
from .forms import PostulantRegister1Form, EmployeurRegister4Form, BioForm2, IntroForm

# importation 2

#from django.shortcuts import render, redirect
from django.contrib.auth.models import User
#from django.contrib import messages
from .forms import PostulantRegister2Form
#from .models import Profil
from django.contrib.auth import  logout

# importation 3

from .forms import EmployeurRegister1Form

# importation 4

from .forms import EmployeurRegister2Form

# importation 4

from .forms import EmployeurRegister3Form
from .models import Profil, Employeur

# importaiion 5


from django.contrib.auth import login
from .forms import LoginForm
from ..recrutements.models import Competence


def inscription(request):
    return render(request,'comptes/inscription.html',locals())
# # view du premier formulaire d'enregistrement postulant 1





def connexion(request):
    if request.user.is_authenticated:
        try:
            profil = Profil.objects.get(user=request.user)
            if profil.role == 'postulant':
                return redirect('espace_postulant')
            elif profil.role == 'employeur':
                return redirect('espace_employeur')
        except Profil.DoesNotExist:
            messages.error(request, "Profil introuvable.")
            return redirect('accueil')

    if request.method == 'POST':
        form = LoginForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, f"Bienvenue, {user.username} !")

            try:
                profil = Profil.objects.get(user=user)
                if profil.role == 'postulant':
                    return redirect('espace_postulant')
                elif profil.role == 'employeur':
                    return redirect('espace_employeur')
            except Profil.DoesNotExist:
                messages.error(request, "Profil introuvable.")
                return redirect('accueil')
        else:
            messages.error(request, "Nom d'utilisateur ou mot de passe incorrect.")
    else:
        form = LoginForm()

    return render(request, 'comptes/connexion.html', {'form': form})





from django.utils import timezone
from datetime import timedelta

from django.utils import timezone
from django.contrib import messages
from django.shortcuts import render, redirect
from datetime import timedelta

def postulant_step1(request):

    if request.method == "POST":
        form = PostulantRegister1Form(request.POST)

        if form.is_valid():
            data = form.cleaned_data

            email = data["email"]

            # Vérifier unicité email
            if User.objects.filter(email=email).exists():
                messages.error(request, "Cette adresse email est déjà utilisée.")
                return redirect("postulant_step1")

            # Stockage temporaire
            request.session["postulant_step1"] = {
                "email": data["email"],
                "first_name": data["first_name"],
                "last_name": data["last_name"],
                "username": data["username"],
                "password1": data["password1"],
                "timestamp": timezone.now().isoformat()
            }

            return redirect("postulant_step2")

    else:
        form = PostulantRegister1Form()

    return render(request, "comptes/postulant_register1.html", {"form": form})



# view du 2e formulaire d'enregistrement

# comptes/views.py










from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from django.contrib import messages
from django.shortcuts import render, redirect
from django.contrib.auth.hashers import make_password

def postulant_step2(request):

    try:
        data = request.session["postulant_step1"]
    except KeyError:
        messages.error(request, "Session expirée, veuillez recommencer.")
        return redirect("postulant_step1")

    # Vérification expiration 15min
    timestamp = timezone.datetime.fromisoformat(data["timestamp"])
    if timezone.now() - timestamp > timedelta(minutes=15):
        request.session.pop("postulant_step1", None)
        messages.error(request, "Temps écoulé. Recommencez l’inscription.")
        return redirect("postulant_step1")

    if request.method == "POST":
        form = PostulantRegister2Form(request.POST, request.FILES)

        if form.is_valid():

            # Création du User
            user = User(
                username=data["username"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                email=data["email"],
            )
            user.set_password(data["password1"])
            user.save()

            # Création du profil
            profil = form.save(commit=False)
            profil.user = user
            profil.role = "postulant"
            profil.save()

            # Nettoyage session
            request.session.pop("postulant_step1", None)

            messages.success(request, "Inscription complétée avec succès !")
            return redirect("connexion")

    else:
        form = PostulantRegister2Form()

    return render(request, "comptes/postulant_register2.html", {"form": form})




# comptes/views.py
from django.utils import timezone
from datetime import timedelta
from django.contrib import messages
from django.contrib.auth.models import User
from django.shortcuts import redirect, render

def employeur_step1(request):

    if request.method == "POST":
        form = EmployeurRegister1Form(request.POST)

        if form.is_valid():
            data = form.cleaned_data

            email = data["email"]

            # Unicité email
            if User.objects.filter(email=email).exists():
                messages.error(request, "Cette adresse e-mail est déjà utilisée.")
                return redirect("employeur_step1")

            # Stockage en session
            request.session["employeur_step1"] = {
                "email": data["email"],
                "first_name": data["first_name"],
                "last_name": data["last_name"],
                "username": data["username"],
                "password": data["password1"],
                "timestamp": timezone.now().isoformat()
            }

            return redirect("employeur_step2")

    else:
        form = EmployeurRegister1Form()

    return render(request, "comptes/employeur_register1.html", {"form": form})



# comptes/forms.py

# comptes/views.py


def employeur_step2(request):
    try:
        data = request.session["employeur_step1"]
    except KeyError:
        messages.error(request, "Session expirée, veuillez recommencer.")
        return redirect("employeur_step1")

    # Vérifier expiration
    timestamp = timezone.datetime.fromisoformat(data["timestamp"])
    if timezone.now() - timestamp > timedelta(minutes=15):
        request.session.pop("employeur_step1", None)
        messages.error(request, "Temps écoulé. Recommencez l’inscription.")
        return redirect("employeur_step1")

    if request.method == "POST":
        form = EmployeurRegister2Form(request.POST, request.FILES)

        if form.is_valid():
            profil_data = form.cleaned_data

            # ✅ Convertir date → string
            safe_profil_data = {}
            for k, v in profil_data.items():
                if hasattr(v, "isoformat"):
                    safe_profil_data[k] = v.isoformat()
                else:
                    safe_profil_data[k] = str(v)

            # ✅ Stockage session
            request.session["employeur_step2"] = {
                "profil": safe_profil_data,
                "timestamp": timezone.now().isoformat()
            }

            return redirect("employeur_step3")

    else:
        form = EmployeurRegister2Form()

    return render(request, "comptes/employeur_register2.html", {"form": form})




# comptes/views.py



from django.contrib.auth.hashers import make_password
from django.db import transaction

def employeur_step3(request):
    try:
        d1 = request.session["employeur_step1"]
        d2 = request.session["employeur_step2"]
    except KeyError:
        messages.error(request, "Session expirée, veuillez recommencer.")
        return redirect("employeur_step1")

    # Vérification expiration
    timestamp = timezone.datetime.fromisoformat(d1["timestamp"])
    if timezone.now() - timestamp > timedelta(minutes=15):
        request.session.pop("employeur_step1", None)
        request.session.pop("employeur_step2", None)
        messages.error(request, "Temps écoulé. Recommencez l’inscription.")
        return redirect("employeur_step1")


    if request.method == "POST":
        form_employeur = EmployeurRegister3Form(request.POST)
        form_societe = EmployeurRegister4Form(request.POST, request.FILES)

        if form_employeur.is_valid():

            representant = form_employeur.cleaned_data["representant_entreprise"].strip().lower()

            # ✅ Transaction atomique = tout ou rien
            with transaction.atomic():

                # 🔹 Création User
                user = User(
                    username=d1["username"],
                    first_name=d1["first_name"],
                    last_name=d1["last_name"],
                    email=d1["email"],
                )
                user.set_password(d1["password"])
                user.save()

                # 🔹 Création profil
                profil = Profil.objects.create(
                    user=user,
                    role="employeur",
                    **d2["profil"]
                )

                # 🔹 Création employeur
                employeur = form_employeur.save(commit=False)
                employeur.profil = profil

                # ✅ Cas 1 : Pas de société
                if representant == "non":
                    employeur.societe = None
                    employeur.save()

                # ✅ Cas 2 : Société obligatoire
                elif representant == "oui":
                    if not form_societe.is_valid():
                        messages.error(request, "Veuillez compléter les informations société.")
                        return render(
                            request,
                            "comptes/employeur_register3.html",
                            {
                                "form_employeur": form_employeur,
                                "form_societe": form_societe
                            },
                        )

                    societe = form_societe.save()
                    employeur.societe = societe
                    employeur.save()

                else:
                    messages.error(request, "Valeur non valide.")
                    return redirect("employeur_step3")

                # ✅ Nettoyage session
                request.session.pop("employeur_step1", None)
                request.session.pop("employeur_step2", None)

                messages.success(request, "Inscription terminée avec succès. Connectez-vous.")
                return redirect("connexion")

    else:
        form_employeur = EmployeurRegister3Form()
        form_societe = EmployeurRegister4Form()

    return render(
        request,
        "comptes/employeur_register3.html",
        {
            "form_employeur": form_employeur,
            "form_societe": form_societe,
        },
    )



#    il faut bien comprendre que lorsque l'on fait :
#    'if request.method == "POST":
#        form = EmployeurRegister3Form(request.POST)'
#    'EmployeurRegister3Form(request.POST)' est connecte a un modele et lorsqueon fait
#    'employeur = form.save(commit=False)' on connecte ce modele a la variable 'employeur' qui devient des lors
#    une insctance ou un object du modele en question.
#    c'est une instanciation indirecte , des lors plus besoin d'improter le modele directement plus que en fesant
#    'from .forms import EmployeurRegister3Form' on importe le formulaire et inderctement le modele associer #,



@login_required
def espace_postulant(request):
    # Récupérer le profil du user connecté
    profil = get_object_or_404(Profil, user=request.user)
    postulant, created = Postulant.objects.get_or_create(profil=profil)
    competences = postulant.competences.all()


    # Le contexte envoyé au template
    context = {

        'user': request.user,
        'profil': profil,
        'postulant': postulant,
        'competences': competences,
    }

    return render(request, 'comptes/espace_postulant.html', context)






from .forms import (
    PhotoForm, BioForm, CVForm, LettreForm,
    LocalisationForm, TelephoneForm,
    CompetenceFormSet
)
from .models import Postulant

@login_required
def complete_espace_postulant(request):
    profil = request.user.profil
    postulant, created = Postulant.objects.get_or_create(profil=profil)

    # Instanciation
    photo_form = PhotoForm(request.POST or None, request.FILES or None, instance=profil)
    intro_form = IntroForm(request.POST or None, request.FILES or None, instance=postulant)
    bio_form = BioForm(request.POST or None, instance=postulant)
    cv_form = CVForm(request.POST or None, request.FILES or None, instance=postulant)
    lettre_form = LettreForm(request.POST or None, instance=postulant)
    localisation_form = LocalisationForm(request.POST or None, instance=postulant)
    telephone_form = TelephoneForm(request.POST or None, instance=profil)

    competence_formset = CompetenceFormSet(
        request.POST or None,
        instance=postulant,
        queryset=postulant.competences.all()
    )

    # Fonction utilitaire pour répondre en JSON
    def ajax_response(success, message, errors=None):
        return JsonResponse({
            "success": success,
            "message": message,
            "errors": errors
        })

    # 🟦 Si AJAX → on renvoie un JSON
    is_ajax = (
        request.headers.get("X-Requested-With") == "XMLHttpRequest"
        or request.headers.get("HX-Request") == "true"
    )

    if request.method == 'POST':
        # PHOTO
        if 'update_photo' in request.POST:
            if photo_form.is_valid():
                photo_form.save()
                return ajax_response(True, "Photo mise à jour ✅")
            return ajax_response(False, "Erreur lors de la mise à jour.", photo_form.errors)

        # INTRO
        if 'update_introduction' in request.POST:
            if intro_form.is_valid():
                intro_form.save()
                return ajax_response(True, "Introduction mise à jour ✅")
            return ajax_response(False, "Erreur.", intro_form.errors)

        # BIO
        if 'update_biographie' in request.POST:
            if bio_form.is_valid():
                bio_form.save()
                return ajax_response(True, "Biographie mise à jour ✅")
            return ajax_response(False, "Erreur.", bio_form.errors)

        # COMPETENCES
        if 'update_competences' in request.POST:
            if competence_formset.is_valid():
                competence_formset.save()
                return ajax_response(True, "Compétences mises à jour ✅")
            return ajax_response(False, "Erreur.", competence_formset.errors)

        # CV
        if 'update_cv' in request.POST:
            if cv_form.is_valid():
                cv_form.save()
                return ajax_response(True, "CV mis à jour ✅")
            return ajax_response(False, "Erreur.", cv_form.errors)

        # LETTRE
        if 'update_lettre' in request.POST:
            if lettre_form.is_valid():
                lettre_form.save()
                return ajax_response(True, "Lettre mise à jour ✅")
            return ajax_response(False, "Erreur.", lettre_form.errors)

        # LOCALISATION
        if 'update_localisation' in request.POST:
            if localisation_form.is_valid():
                localisation_form.save()
                return ajax_response(True, "Localisation mise à jour ✅")
            return ajax_response(False, "Erreur.", localisation_form.errors)

        # TELEPHONE
        if 'update_telephone' in request.POST:
            if telephone_form.is_valid():
                telephone_form.save()
                return ajax_response(True, "Téléphone mis à jour ✅")
            return ajax_response(False, "Erreur.", telephone_form.errors)

    # Affichage normal (GET)
    context = {
        "photo_form": photo_form,
        "intro_form": intro_form,
        "bio_form": bio_form,
        "cv_form": cv_form,
        "lettre_form": lettre_form,
        "localisation_form": localisation_form,
        "telephone_form": telephone_form,
        "competence_formset": competence_formset,
        "profil": profil,
        "postulant": postulant,
    }
    return render(request, "comptes/complete_espace_postulant.html", context)











@login_required
def espace_employeur(request):
    # Récupérer le profil du user connecté
    profil = get_object_or_404(Profil, user=request.user)
    employeur, created = Employeur.objects.get_or_create(profil=profil)

    societe = None
    if employeur.representant_entreprise == 'oui':
        societe = employeur.societe


    # Le contexte envoyé au template
    context = {

        'user': request.user,
        'profil': profil,
        'employeur': employeur,
        'societe': societe,
    }

    return render(request, 'comptes/espace_employeur.html', context)



@login_required
def complete_espace_employeur(request):
    profil = request.user.profil
    employeur, created = Employeur.objects.get_or_create(profil=profil)

    # Instanciation des formulaires avec POST/FICHIERS ou données existantes
    photo_form = PhotoForm(request.POST or None, request.FILES or None, instance=profil)
    bio_form = BioForm2(request.POST or None, instance=employeur)
    telephone_form = TelephoneForm(request.POST or None, instance=profil)


    # Gestion des submissions
    if request.method == 'POST':
        # Photo
        if 'update_photo' in request.POST:
            if photo_form.is_valid():
                photo_form.save()
                messages.success(request, "Photo de profil mise à jour avec succès.", extra_tags='photo_success')
            else:
                messages.error(request, "Erreur lors de la mise à jour de la photo.", extra_tags='photo_error')

        # Biographie
        elif 'update_biographie' in request.POST:
            if bio_form.is_valid():
                bio_form.save()
                messages.success(request, "Biographie mise à jour avec succès.", extra_tags='bio_success')
            else:
                messages.error(request, "Erreur lors de la mise à jour de la biographie.", extra_tags='bio_error')


        # Téléphone
        elif 'update_telephone' in request.POST:
            if telephone_form.is_valid():
                telephone_form.save()
                messages.success(request, "Téléphone mis à jour avec succès.", extra_tags='telephone_success')
            else:
                messages.error(request, "Erreur lors de la mise à jour du téléphone.", extra_tags='telephone_error')

        # Important : on ne fait plus de redirect
        # Les messages et erreurs restent affichés avec les formulaires

    context = {
        'photo_form': photo_form,
        'bio_form': bio_form,
        'telephone_form': telephone_form,
        'profil': profil,  # ← AJOUT ESSENTIEL
        'employeur': Employeur,
    }

    return render(request, 'comptes/complete_espace_employeur.html', context)

