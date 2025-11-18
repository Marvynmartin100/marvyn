from django.shortcuts import render

# Create your views here.

from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required

from .forms import OffreEmploiForm
from .models import OffreEmploi


from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages



@login_required
def creer_offre_emploi(request):
    """
    Permet à un employeur connecté de créer une nouvelle offre d'emploi.
    Vérifie que l'utilisateur est bien un employeur et que son profil
    possède un objet Employeur valide.
    """

    # Vérifier que l'utilisateur a un profil
    try:
        profil = request.user.profil
    except Profil.DoesNotExist:
        messages.error(request, "Profil introuvable. Impossible de créer une offre.")
        return redirect('accueil')

    # Vérifier que l'utilisateur est un employeur
    if profil.role != 'employeur':
        messages.error(request, "Vous n'avez pas les droits pour créer une offre.")
        return redirect('accueil')

    # Vérifier que le profil a un objet Employeur lié
    employeur_obj = getattr(profil, 'employeur', None)
    if not employeur_obj:
        messages.error(request, "Profil employeur introuvable. Veuillez contacter l'administrateur.")
        return redirect('accueil')

    if request.method == 'POST':
        form = OffreEmploiForm(request.POST)
        if form.is_valid():
            # Sauvegarder l'offre sans l'enregistrer encore
            offre = form.save(commit=False)
            offre.employeur = employeur_obj
            offre.save()  # ici le signal post_save sera déclenché

            messages.success(request, "Votre offre d'emploi a été publiée avec succès ! 🎉")
            return redirect('espace_employeur')  # redirection vers la page des offres
        else:
            messages.error(request, "Veuillez corriger les erreurs dans le formulaire.")
    else:
        form = OffreEmploiForm()

    context = {
        'form': form,
        'titre_page': "Publier une nouvelle offre d'emploi"
    }

    return render(request, 'recrutements/creer_offre_emploi.html', context)








from django.shortcuts import render, get_object_or_404
from .models import OffreEmploi

def detail_offre_emploi(request, slug):
    """
    Affiche les informations détaillées d'une offre d'emploi spécifique.
    Accessible via son 'slug'.
    """
    offre = get_object_or_404(OffreEmploi, slug=slug)

    # Incrémenter le compteur de vues
    offre.nombre_vues += 1
    offre.save(update_fields=['nombre_vues'])

    context = {
        'offre': offre,
        'titre_page': f"Détails de l'offre : {offre.titre}",
    }

    return render(request, 'recrutements/detail_offre_emploi.html', context)





@login_required
def liste_offres_employeur(request):
    """
    Affiche la liste de toutes les offres d'emploi
    créées par l'employeur actuellement connecté.
    """
    employeur = request.user.profil.employeur

    # Filtre les offres liées à cet employeur
    offres = OffreEmploi.objects.filter(employeur=employeur).order_by('-date_publication')
    # Si au contraire, il est lié à un modèle 'Societe', on peut utiliser :
    # societe = getattr(request.user, 'societe', None)
    # offres = OffreEmploi.objects.filter(employeur=societe).order_by('-date_publication')

    for offre in offres:
        offre.nombre_candidatures = offre.candidatures.count()

    context = {
        'offres': offres,
    }
    return render(request, 'recrutements/liste_offres.html', context)



@login_required
def relancer_offre(request, pk):
    if request.method != "POST":
        return JsonResponse({'error': 'Méthode non autorisée'}, status=405)

    try:
        offre = OffreEmploi.objects.get(pk=pk, employeur=request.user.profil.employeur)
    except OffreEmploi.DoesNotExist:
        return JsonResponse({'error': 'Offre introuvable'}, status=404)

    # On remet la date à maintenant
    offre.update_at = timezone.now()
    offre.save()

    remaining_days = 7

    return JsonResponse({
        'success': True,
        'message': 'Compte à rebours relancé.',
        'remaining_days': remaining_days
    })



from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from app.recrutements.models import OffreEmploi

@login_required
def supprimer_offre(request, offre_id):
    """
    Supprime une offre d’emploi appartenant à l’employeur connecté.
    Fonctionne uniquement avec une requête AJAX.
    """
    # ✅ Vérifie que c’est bien une requête POST ou DELETE
    if request.method not in ['POST', 'DELETE']:
        return JsonResponse({
            "success": False,
            "message": "Méthode non autorisée."
        }, status=405)

    try:
        # ✅ Vérifie que l'utilisateur est un employeur
        employeur = request.user.profil.employeur
    except Exception:
        return JsonResponse({
            "success": False,
            "message": "Seuls les employeurs peuvent supprimer des offres."
        }, status=403)

    # ✅ Récupère l’offre
    offre = get_object_or_404(OffreEmploi, id=offre_id, employeur=employeur)

    # ✅ Supprime l’offre
    offre.delete()

    return JsonResponse({
        "success": True,
        "message": "Offre supprimée avec succès ✅"
    }, status=200)



from django.http import JsonResponse
from django.utils import timezone



from app.comptes.models import Postulant
from django.db.models import Q, F, Value
from django.db.models.functions import Concat
from datetime import date
from dateutil.relativedelta import relativedelta  # À installer: pip install python-dateutil
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.contrib.auth.decorators import login_required
from django.shortcuts import render

# Importez vos constantes depuis le fichier constants.py
from core.constants import NATIONALITE_CHOICES, CHOICE_PROVINCE, CHOICE_ARRONDISSEMENT, SEXE_CHOICES


@login_required
def liste_postulant(request):
    """
    Vue qui affiche la liste de tous les postulants disponibles,
    avec filtres avancés et recherche. Le tri est géré côté JavaScript.
    """
    # Récupère tous les postulants
    postulants = (
        Postulant.objects
        .select_related('profil', 'profil__user')
        .annotate(
            full_name=Concat(
                'profil__user__first_name',
                Value(' '),
                'profil__user__last_name'
            )
        )
    )

    # RECHERCHE
    query = request.GET.get('q', '').strip()
    if query:
        postulants = postulants.filter(
            Q(profil__user__first_name__icontains=query) |
            Q(profil__user__last_name__icontains=query) |
            Q(intro_postulant__icontains=query) |
            Q(profil__competences__icontains=query) |
            Q(province__icontains=query) |
            Q(arrondissement__icontains=query) |
            Q(quartier__icontains=query)
        )

    # FILTRES (gardez tous vos filtres existants)
    genre = request.GET.get('genre')
    if genre and genre != 'all':
        postulants = postulants.filter(profil__sexe=genre)

    age_filter = request.GET.get('age')
    if age_filter and age_filter != 'all':
        today = date.today()

        if age_filter == '18-25':
            min_date = today - relativedelta(years=25)
            max_date = today - relativedelta(years=18, days=1)
            postulants = postulants.filter(
                profil__date_naissance__range=(min_date, max_date)
            )
        elif age_filter == '26-35':
            min_date = today - relativedelta(years=35)
            max_date = today - relativedelta(years=26, days=1)
            postulants = postulants.filter(
                profil__date_naissance__range=(min_date, max_date)
            )
        elif age_filter == '36-45':
            min_date = today - relativedelta(years=45)
            max_date = today - relativedelta(years=36, days=1)
            postulants = postulants.filter(
                profil__date_naissance__range=(min_date, max_date)
            )
        elif age_filter == '46-55':
            min_date = today - relativedelta(years=55)
            max_date = today - relativedelta(years=46, days=1)
            postulants = postulants.filter(
                profil__date_naissance__range=(min_date, max_date)
            )
        elif age_filter == '55+':
            min_date = today - relativedelta(years=100)
            max_date = today - relativedelta(years=55, days=1)
            postulants = postulants.filter(
                profil__date_naissance__range=(min_date, max_date)
            )

    # Filtre par nationalité
    nationalite = request.GET.get('nationalite')
    if nationalite and nationalite != 'all':
        postulants = postulants.filter(profil__nationalite=nationalite)

    # Filtre par province
    province = request.GET.get('province')
    if province and province != 'all':
        postulants = postulants.filter(province=province)

    # Filtre par arrondissement
    arrondissement = request.GET.get('arrondissement')
    if arrondissement and arrondissement != 'all':
        postulants = postulants.filter(arrondissement=arrondissement)

    # ⚠️ SUPPRIMEZ TOUTE LA PARTIE TRI SERVEUR ⚠️
    # NE FAITES PAS de order_by() - le tri sera géré par JavaScript
    # postulants = postulants.order_by('-created_at')  # ❌ SUPPRIMÉ

    # PAGINATION - Augmentez le nombre d'éléments pour le JS
    paginator = Paginator(postulants, 100)  # 100 éléments pour plus de données JS
    page_number = request.GET.get('page', 1)

    try:
        postulants_page = paginator.page(page_number)
    except PageNotAnInteger:
        postulants_page = paginator.page(1)
    except EmptyPage:
        postulants_page = paginator.page(paginator.num_pages)

    # Préparation du contexte
    context = {
        'postulants': postulants_page,
        'NATIONALITE_CHOICES': NATIONALITE_CHOICES,
        'CHOICE_PROVINCE': CHOICE_PROVINCE,
        'CHOICE_ARRONDISSEMENT': CHOICE_ARRONDISSEMENT,
        'SEXE_CHOICES': SEXE_CHOICES,
        'current_filters': {
            'q': query,
            'genre': genre if genre and genre != 'all' else '',
            'age': age_filter if age_filter and age_filter != 'all' else '',
            'nationalite': nationalite if nationalite and nationalite != 'all' else '',
            'province': province if province and province != 'all' else '',
            'arrondissement': arrondissement if arrondissement and arrondissement != 'all' else '',
            'tri': request.GET.get('tri', 'recent'),  # Gardé pour l'URL mais pas utilisé
        }
    }

    return render(request, 'recrutements/liste_postulant.html', context)

from django.shortcuts import render, get_object_or_404
from app.comptes.models import Postulant, Profil

def profil_public_postulant(request, slug):
    """
    Vue publique pour afficher le profil complet d’un postulant,
    accessible par les employeurs.
    """
    # On récupère le profil via le slug
    profil = get_object_or_404(Profil, slug=slug, role='postulant')

    # On récupère le postulant lié à ce profil
    postulant = get_object_or_404(Postulant, profil=profil)

    # Si tu as un modèle 'Competence' lié au postulant
    # Exemple : Competence.objects.filter(postulant=postulant)
    competences = getattr(postulant, 'competence_set', []).all() if hasattr(postulant, 'competence_set') else []
    offres = OffreEmploi.objects.filter(employeur=request.user.profil.employeur)
    context = {
        'profil': profil,
        'postulant': postulant,
        'competences': competences,
        "offres": offres,  # ✅ toutes les offres déjà disponibles
    }

    return render(request, 'recrutements/profil_public_postulant.html', context)







from django.shortcuts import get_object_or_404, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from app.recrutements.models import  FavoriCandidat

@login_required
def ajouter_favori_postulant(request, postulant_id):
    """
    Permet à un employeur connecté d'ajouter un postulant à ses favoris.
    """
    # Vérifier que l'utilisateur connecté est bien un employeur
    try:
        employeur = request.user.profil.employeur
    except employeur.DoesNotExist:
        messages.error(request, "Seuls les employeurs peuvent ajouter des favoris.")
        return redirect('liste_postulants')  # ou une autre page adaptée

    # Récupérer le postulant cible
    postulant = get_object_or_404(Postulant, id=postulant_id)

    # Vérifier si ce postulant est déjà dans les favoris
    favori_existe = FavoriCandidat.objects.filter(employeur=employeur, postulant=postulant).exists()

    if favori_existe:
        messages.info(request, f"{postulant.profil.user.get_full_name()} est déjà dans vos favoris.")
    else:
        FavoriCandidat.objects.create(employeur=employeur, postulant=postulant)
        messages.success(request, f"{postulant.profil.user.get_full_name()} a été ajouté à vos favoris ✅")

    # Rediriger vers le profil du postulant (ou vers la liste)
    return redirect('profil_public_postulant', slug=postulant.profil.slug)


@login_required
def employeur_favoris(request):
    # On récupère l'employeur connecté
    employeur = request.user.profil.employeur

    # On récupère tous les favoris de cet employeur
    favoris = FavoriCandidat.objects.filter(employeur=employeur).select_related('postulant__profil__user')

    # On envoie les favoris au template
    context = {
        'favoris': favoris
    }
    return render(request, 'recrutements/employeur_favoris.html', context)



@login_required
def retirer_favori_postulant(request, favori_id):
    favori = get_object_or_404(FavoriCandidat, id=favori_id, employeur=request.user.profil.employeur)
    favori.delete()
    messages.success(request, "Le postulant a été retiré de vos favoris.")
    return redirect('employeur_favoris')









from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from app.comptes.models import Postulant, Employeur, Profil
from app.recrutements.models import OffreEmploi, Recommandation




@login_required
def recommander_postulant(request, postulant_slug):
    """
    Permet à un employeur de recommander un postulant à l’une de ses offres d’emploi.
    """
    # Vérifier que l'utilisateur connecté est un employeur
    try:
        employeur = request.user.profil.employeur
    except Employeur.DoesNotExist:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({"success": False, "message": "Seuls les employeurs peuvent recommander un postulant."}, status=403)
        messages.error(request, "Seuls les employeurs peuvent recommander un postulant.")
        return redirect('liste_postulants')

    # Récupérer le profil du postulant et son objet Postulant
    profil = get_object_or_404(Profil, slug=postulant_slug, role='postulant')
    postulant = get_object_or_404(Postulant, profil=profil)

    if request.method == "POST":
        # Vérifier qu'on est bien en AJAX
        if request.headers.get('x-requested-with') != 'XMLHttpRequest':
            return JsonResponse({"success": False, "message": "Requête non autorisée."}, status=400)

        # Récupérer l'offre sélectionnée
        offre_id = request.POST.get("offre_id")
        if not offre_id:
            return JsonResponse({"success": False, "message": "Aucune offre sélectionnée."}, status=400)

        # Vérifier que l'offre appartient à l'employeur
        offre = get_object_or_404(OffreEmploi, id=offre_id, employeur=employeur)

        # Vérifier si la recommandation existe déjà
        if Recommandation.objects.filter(employeur=employeur, postulant=postulant, offre=offre).exists():
            return JsonResponse({"success": False, "message": "Cette recommandation existe déjà."}, status=409)

        # Créer la recommandation
        Recommandation.objects.create(
            employeur=employeur,
            postulant=postulant,
            offre=offre
        )

        return JsonResponse({"success": True, "message": "Recommandation envoyée avec succès ✅"})

    # Requête GET → renvoyer la page normale ou données AJAX pour le modal
    offres = OffreEmploi.objects.filter(employeur=employeur)
    context = {
        "postulant": postulant,
        "offres": offres,
    }

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            "success": True,
            "offres": list(offres.values("id", "titre")),
        })

    return render(request, "recrutements/profil_public_postulant.html", context)



@login_required
def get_offres_employeur(request):
    employeur = request.user.profil.employeur
    offres = OffreEmploi.objects.filter(employeur=employeur)
    data = {
        "success": True,
        "offres": list(offres.values("id", "titre"))
    }
    return JsonResponse(data)






@login_required
def mes_recommandations_employeur(request):
    """
    Permet à un employeur de consulter la liste de ses recommandations.
    """
    try:
        employeur = request.user.profil.employeur
    except Employeur.DoesNotExist:
        messages.error(request, "Accès réservé aux employeurs.")
        return redirect('accueil')

    recommandations = Recommandation.objects.filter(
        employeur=employeur
    ).select_related("postulant__profil", "offre")

    context = {"recommandations": recommandations}

    # Réponse JSON si AJAX
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        data = [
            {
                "id": r.id,
                "postulant": r.postulant.profil.user.username,
                "offre": r.offre.titre,
                "statut": r.statut,
                "date_envoi": r.date_envoi.strftime("%d/%m/%Y %H:%M"),
            }
            for r in recommandations
        ]
        return JsonResponse({"success": True, "recommandations": data})

    return render(request, "recrutements/mes_recommandations_employeur.html", context)


@login_required
def annuler_recommandation_employeur(request, recommandation_id):
    """
    Permet à un employeur d’annuler une de ses recommandations (via POST ou AJAX).
    """
    try:
        employeur = request.user.profil.employeur
    except Employeur.DoesNotExist:
        return JsonResponse({"success": False, "message": "Accès refusé."}, status=403)

    recommandation = get_object_or_404(Recommandation, id=recommandation_id, employeur=employeur)

    if recommandation.statut != "en_attente":
        return JsonResponse({"success": False, "message": "Impossible d'annuler une recommandation déjà traitée."}, status=400)

    recommandation.statut = "annulée"
    recommandation.save(update_fields=["statut", "updated_at"])

    return JsonResponse({"success": True, "message": "Recommandation annulée avec succès ✅"})


@login_required
def mes_recommandations_postulant(request):
    """
    Permet à un postulant connecté de consulter la liste de ses recommandations reçues.
    Il peut voir leur statut et éventuellement les accepter ou les refuser.
    """

    # Vérifier que l'utilisateur est bien un postulant
    profil = getattr(request.user, "profil", None)
    postulant = profil.postulant



    # Récupérer toutes les recommandations reçues
    recommandations = postulant.recommandations_recues.select_related(
        "employeur__profil__user", "offre"
    ).order_by("-date_envoi")

    # Traitement d'une action (facultatif)
    if request.method == "POST":
        recommandation_id = request.POST.get("recommandation_id")
        action = request.POST.get("action")

        try:
            recommandation = recommandations.get(id=recommandation_id)
        except Recommandation.DoesNotExist:
            messages.error(request, "Recommandation introuvable.")
            return redirect("mes_recommandations_postulant")

        if action == "accepter":
            recommandation.statut = "acceptee"
            recommandation.save()
            messages.success(request, "Recommandation acceptée.")
        elif action == "refuser":
            recommandation.statut = "refusee"
            recommandation.save()
            messages.warning(request, "Recommandation refusée.")
        else:
            messages.error(request, "Action non reconnue.")

        return redirect("mes_recommandations_postulant")

    context = {
        "recommandations": recommandations,
    }
    return render(request, "recrutements/mes_recommandations_postulant.html", context)


# vues_postulant.py (ou dans views.py selon ton organisation)
from django.shortcuts import render
from .models import OffreEmploi


@login_required
def liste_offres_actives(request):
    # Récupère uniquement les offres dont le statut est "active"
    offres = OffreEmploi.objects.filter(statut='active').order_by('-date_publication')

    # Vérifie si l'utilisateur est un postulant
    profil = getattr(request.user, 'profil', None)
    postulant = getattr(profil, 'postulant', None) if profil else None

    # Pour chaque offre, vérifie si le postulant a déjà postulé
    for offre in offres:
        if postulant:
            # Vérifie s'il existe une candidature pour cette offre et ce postulant
            offre.deja_postule = Candidature.objects.filter(
                postulant=postulant,
                offre=offre
            ).exists()
        else:
            offre.deja_postule = False

    # Envoie la liste au template
    context = {
        'offres': offres
    }
    return render(request, 'recrutements/liste_offre_postulant.html', context)





# vues_postulant.py (ou dans views.py)
from django.shortcuts import render, get_object_or_404
from django.http import Http404
from .models import OffreEmploi

def detail_offre_postulant(request, slug):
    """
    Vue détail d'une offre pour un postulant.
    - Récupère l'offre via le slug.
    - Ne retourne l'offre que si son statut est 'active' et qu'elle n'est pas expirée.
    - Sinon, renvoie une 404.
    """
    # Cherche l'offre avec le slug et statut actif
    offre = get_object_or_404(OffreEmploi, slug=slug, statut='active')

    # Vérification supplémentaire : si la méthode is_expired() dit qu'elle est expirée -> 404
    if hasattr(offre, "is_expired") and offre.is_expired():
        raise Http404("Offre introuvable ou expirée.")

    context = {
        'offre': offre
    }
    return render(request, 'recrutements/detail_offre_postulant.html', context)


from .models import OffreEmploi, Candidature

@login_required
def postuler_offre_postulant(request, slug):
    """
    Vue permettant à un postulant connecté de postuler à une offre.
    - Crée une candidature si elle n’existe pas déjà.
    - Empêche la duplication.
    - Envoie un message de confirmation ou d’avertissement.
    """
    offre = get_object_or_404(OffreEmploi, slug=slug, statut='active')

    # Vérifie que l'utilisateur connecté est bien un postulant
    profil = getattr(request.user, 'profil', None)
    if not hasattr(profil, 'postulant'):
        messages.error(request, "Seuls les postulants peuvent postuler à une offre.")
        return redirect('detail_offre_postulant', slug=slug)

    postulant = profil.postulant

    # Vérifie s’il existe déjà une candidature pour cette offre
    candidature_existante = Candidature.objects.filter(postulant=postulant, offre=offre).exists()

    if candidature_existante:
        messages.warning(request, "Vous avez déjà postulé à cette offre.")
    else:
        Candidature.objects.create(postulant=postulant, offre=offre)
        messages.success(request, "Votre candidature a été envoyée avec succès !")

    return redirect('detail_offre_postulant', slug=slug)






# vues_postulant.py (ou views.py)
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Candidature

@login_required
def liste_candidatures(request):
    """
    Affiche toutes les candidatures du postulant connecté et permet d'annuler une candidature.
    """
    profil = getattr(request.user, 'profil', None)
    if not hasattr(profil, 'postulant'):
        return render(request, 'recrutements/liste_candidature.html', {
            'candidatures': [],
            'error': "Seuls les postulants peuvent voir leurs candidatures."
        })

    postulant = profil.postulant

    # Gestion de l'annulation si formulaire POST
    if request.method == 'POST':
        candidature_id = request.POST.get('candidature_id')
        if candidature_id:
            candidature = get_object_or_404(Candidature, id=candidature_id, postulant=postulant)
            candidature.delete()
            messages.success(request, "Votre candidature a été annulée avec succès.")
            return redirect('liste_candidatures')

    # Récupère toutes les candidatures du postulant
    candidatures = Candidature.objects.filter(postulant=postulant).select_related('offre', 'offre__employeur')

    context = {
        'candidatures': candidatures
    }

    return render(request, 'recrutements/liste_candidature.html', context)





# views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import OffreEmploi, Candidature

@login_required
def liste_candidatures_employeur(request):
    """
    Affiche et gère toutes les candidatures reçues pour les offres de l'employeur connecté.
    Permet le filtrage par offre et la modification du statut des candidatures.
    """
    profil = getattr(request.user, 'profil', None)
    if not hasattr(profil, 'employeur'):
        messages.error(request, "Seuls les employeurs peuvent accéder à cette page.")
        return redirect('accueil')

    employeur = profil.employeur

    # --- Filtrage par offre ---
    offre_id = request.GET.get('offre')
    if offre_id:
        candidatures = Candidature.objects.filter(offre__id=offre_id, offre__employeur=employeur).select_related('offre', 'postulant', 'postulant__profil')
    else:
        candidatures = Candidature.objects.filter(offre__employeur=employeur).select_related('offre', 'postulant', 'postulant__profil')

    # --- Récupération des offres de l'employeur pour le menu de filtre ---
    offres = OffreEmploi.objects.filter(employeur=employeur)

    # --- Traitement de la mise à jour du statut ---
    if request.method == 'POST':
        candidature_id = request.POST.get('candidature_id')
        action = request.POST.get('action')

        candidature = get_object_or_404(Candidature, id=candidature_id, offre__employeur=employeur)

        if action == 'accepter':
            candidature.statut = 'acceptee'
            messages.success(request, f"La candidature de {candidature.postulant.profil.user.username} a été acceptée.")
        elif action == 'refuser':
            candidature.statut = 'refusee'
            messages.warning(request, f"La candidature de {candidature.postulant.profil.user.username} a été refusée.")
        candidature.save()
        return redirect('liste_candidatures_employeur')

    context = {
        'candidatures': candidatures,
        'offres': offres,
        'offre_selectionnee': offre_id,
    }

    return render(request, 'recrutements/liste_candidature_employeur.html', context)




def detail_offre_employeur(request, slug):
    """
    Vue détail d'une offre pour un postulant.
    - Récupère l'offre via le slug.
    - Ne retourne l'offre que si son statut est 'active' et qu'elle n'est pas expirée.
    - Sinon, renvoie une 404.
    """
    # Cherche l'offre avec le slug et statut actif
    offre = get_object_or_404(OffreEmploi, slug=slug)

    # Vérification supplémentaire : si la méthode is_expired() dit qu'elle est expirée -> 404

    context = {
        'offre': offre
    }
    return render(request, 'recrutements/detail_offre_employeur_liste.html', context)
