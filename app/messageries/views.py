from django.shortcuts import render

# Create your views here.

# messagerie/views.py
from django.shortcuts import get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.models import User

from .models import Conversation
from app.recrutements.models import Candidature, Recommandation  # adapte selon ton app


@login_required
def creer_conversation(request, type_objet, objet_id):
    """
    Crée une conversation entre un postulant et un employeur selon le type (candidature ou recommandation)
    """
    user = request.user

    if type_objet == "candidature":
        objet = get_object_or_404(Candidature, id=objet_id)
        postulant = objet.postulant.profil.user
        employeur = objet.offre.employeur.profil.user

    elif type_objet == "recommandation":
        objet = get_object_or_404(Recommandation, id=objet_id)
        postulant = objet.postulant.profil.user
        employeur = objet.employeur.profil.user

    else:
        messages.error(request, "Type d'objet invalide.")
        return redirect("accueil")

    # Déterminer l'interlocuteur
    if user == postulant:
        autre_utilisateur = employeur
    elif user == employeur:
        autre_utilisateur = postulant
    else:
        messages.error(request, "Vous n'êtes pas autorisé à créer cette conversation.")
        return redirect("accueil")

    # Vérifier si la conversation existe déjà
    utilisateur1 = min(user, autre_utilisateur, key=lambda u: u.id)
    utilisateur2 = max(user, autre_utilisateur, key=lambda u: u.id)

    conversation, cree = Conversation.objects.get_or_create(
        utilisateur1=utilisateur1,
        utilisateur2=utilisateur2
    )

    if cree:
        messages.success(request, "Conversation créée avec succès !")
    else:
        messages.info(request, "Une conversation existe déjà avec cet utilisateur.")

    # Redirige vers la page de conversation
    return redirect("conversation_detail", conversation_id=conversation.id)


from django.utils import timezone
from django.db.models import Q


@login_required
def conversation_detail(request, conversation_id):
    print(f"🔍 DEBUT - conversation_detail appelée pour conversation_id: {conversation_id}")
    print(f"🔍 Utilisateur: {request.user.username}")

    conversation = get_object_or_404(Conversation, id=conversation_id)
    print(f"🔍 Conversation trouvée: {conversation.id}")
    print(f"🔍 Participants: {conversation.utilisateur1.username} et {conversation.utilisateur2.username}")

    # Vérifier que l'utilisateur fait partie de la conversation
    if request.user not in [conversation.utilisateur1, conversation.utilisateur2]:
        print("❌ ERREUR: Utilisateur n'a pas accès à cette conversation")
        messages.error(request, "Vous n'avez pas accès à cette conversation.")
        return redirect('liste_conversations_employeur')

    # Déterminer l'autre utilisateur
    user = request.user
    autre_utilisateur = conversation.utilisateur2 if conversation.utilisateur1 == user else conversation.utilisateur1
    print(f"🔍 Autre utilisateur: {autre_utilisateur.username}")

    # ✅ CORRECTION : Marquer comme lus les messages de l'autre utilisateur
    messages_non_lus = Message.objects.filter(
        conversation=conversation,
        expediteur=autre_utilisateur,
        lu=False
    )

    print(f"🔍 Messages non lus trouvés: {messages_non_lus.count()}")

    if messages_non_lus.exists():
        count = messages_non_lus.count()
        print(f"✅ Marquer {count} messages comme lus")
        messages_non_lus.update(lu=True, date_lecture=timezone.now())

    # Récupérer les messages pour l'affichage
    messages_list = conversation.messages.all().order_by('date_envoi')
    print(f"🔍 Total messages dans la conversation: {messages_list.count()}")

    # Filtrer les messages supprimés
    messages_filtres = []
    for message in messages_list:
        if user == message.expediteur and not message.supprime_par_expediteur:
            messages_filtres.append(message)
        elif user != message.expediteur and not message.supprime_par_destinataire:
            messages_filtres.append(message)

    print(f"🔍 Messages après filtrage: {len(messages_filtres)}")

    context = {
        'conversation': conversation,
        'messages': messages_filtres,
        'autre_utilisateur': autre_utilisateur,
    }

    print("🔍 FIN - Rendering template")
    return render(request, 'messageries/conversation_detail.html', context)





from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Conversation, Message

@login_required
def envoyer_message(request, conversation_id):
    conversation = get_object_or_404(Conversation, id=conversation_id)

    # === DEBUG ===
    print("Headers:", request.headers)
    print("Is AJAX:", request.headers.get("x-requested-with"))
    # ==============

    # Vérifier que l'utilisateur participe à la conversation
    if request.user not in [conversation.utilisateur1, conversation.utilisateur2]:
        if request.headers.get("x-requested-with") == "XMLHttpRequest":
            return JsonResponse({"success": False, "error": "Accès interdit."}, status=403)
        messages.error(request, "Vous n'avez pas accès à cette conversation.")
        return redirect('accueil')

    if request.method == "POST":
        contenu = request.POST.get("contenu", "").strip()
        if not contenu:
            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse({"success": False, "error": "Le message ne peut pas être vide."})
            messages.warning(request, "Le message ne peut pas être vide.")
            return redirect("conversation_detail", conversation_id=conversation.id)

        message = Message.objects.create(
            contenu=contenu,
            expediteur=request.user,
            conversation=conversation
        )

        # Retour JSON si AJAX
        if request.headers.get("x-requested-with") == "XMLHttpRequest":
            return JsonResponse({
                "success": True,
                "message": {
                    "id": message.id,
                    "contenu": message.contenu,
                    "expediteur": message.expediteur.username,
                    "date_envoi": message.date_envoi.strftime("%d/%m/%Y à %H:%M"),
                    "lu": message.lu,
                }
            })

        # Optionnel : si jamais la requête n'est pas AJAX
        return redirect("conversation_detail", conversation_id=conversation.id)

    return redirect("conversation_detail", conversation_id=conversation.id)

from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db import models
from django.db.models import Q
from .models import Conversation, Message
from app.comptes.models import Profil  # si tu as besoin des infos profil


# =============================
# Liste des conversations - EMPLOYEUR
# =============================
from django.utils import timezone
from django.db.models import Count, Q, Max


@login_required
def liste_conversations_employeur(request):
    profil = getattr(request.user, 'profil', None)
    if not hasattr(profil, 'employeur'):
        messages.error(request, "Seuls les employeurs peuvent accéder à cette page.")
        return redirect('accueil')

    user = request.user

    # Récupérer les conversations avec annotations pour les fonctionnalités
    conversations = Conversation.objects.filter(
        Q(utilisateur1=user) | Q(utilisateur2=user)
    ).prefetch_related(
        'messages',
        'messages__expediteur',
        'utilisateur1__profil',
        'utilisateur2__profil'
    ).annotate(
    unread_count=Count(
        'messages',
        filter=Q(messages__lu=False) & ~Q(messages__expediteur=user)
    ),
    last_message_date=Max('messages__date_envoi')
).order_by('-last_message_date', '-updated_at')

    # Calculer le total des messages non lus
    total_unread = sum(conv.unread_count for conv in conversations)

    # Préparer les données pour chaque conversation
    for conv in conversations:
        # Déterminer l'autre utilisateur (le postulant)
        if conv.utilisateur1 == user:
            conv.autre_utilisateur = conv.utilisateur2
        else:
            conv.autre_utilisateur = conv.utilisateur1

        # Récupérer le dernier message pour l'aperçu
        conv.dernier_message = conv.messages.order_by('-date_envoi').first()

    context = {
        'conversations': conversations,
        'now': timezone.now(),
        'unread_count': total_unread,
    }
    return render(request, 'messageries/liste_conversations_employeur.html', context)




# =============================
# Liste des conversations - POSTULANT
# =============================
@login_required
def liste_conversations_postulant(request):
    profil = getattr(request.user, 'profil', None)
    if not profil or profil.role != 'postulant':
        messages.error(request, "Seuls les postulants peuvent accéder à cette page.")
        return redirect('accueil')

    user = request.user
    conversations = Conversation.objects.filter(
        Q(utilisateur1=user) | Q(utilisateur2=user)
    ).prefetch_related('messages').order_by('-updated_at')

    context = {
        'conversations': conversations
    }
    return render(request, 'messageries/liste_conversations_postulant.html', context)





from django.http import JsonResponse

@login_required
def supprimer_message(request, message_id):
    message = get_object_or_404(Message, id=message_id)

    if message.expediteur == request.user:
        message.supprime_par_expediteur = True
        message.save()
    else:
        message.supprime_par_destinataire = True
        message.save()

    return JsonResponse({'success': True})




from django.shortcuts import render

def test_chat(request):
    return render(request,'messageries/a.html')
