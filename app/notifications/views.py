from django.shortcuts import render

# Create your views here.

from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.contrib import messages

from app.notifications.models import Notification  # adapte le chemin selon ton projet


@login_required
def notification_employeur(request):
    """
    Affiche la liste des notifications reçues par l'employeur connecté.
    """
    # Filtrer les notifications destinées à l'utilisateur connecté
    notifications = Notification.objects.filter(destinataire=request.user).order_by('-date_notif')

    # Pagination (10 notifications par page)
    paginator = Paginator(notifications, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'notifications': page_obj.object_list,
        'page_obj': page_obj,
        'is_paginated': page_obj.has_other_pages(),
    }
    return render(request, 'notifications/notification_employeur.html', context)


@login_required
def marquer_toutes_comme_lues_employeur(request):
    """
    Marque toutes les notifications de l'employeur connecté comme lues.
    """
    notifications_non_lues = Notification.objects.filter(destinataire=request.user, statut='non lu')
    count = notifications_non_lues.update(statut='lu')

    if count > 0:
        messages.success(request, f"{count} notification(s) marquée(s) comme lue(s).")
    else:
        messages.info(request, "Aucune nouvelle notification à marquer comme lue.")

    return redirect('notification_employeur')






@login_required
def notification_postulant(request):
    """
    Affiche la liste des notifications reçues par le postulant connecté.
    """
    # Filtrer les notifications destinées à l'utilisateur courant
    notifications = Notification.objects.filter(destinataire=request.user).order_by('-date_notif')

    # Pagination : 10 notifications par page
    paginator = Paginator(notifications, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'notifications': page_obj.object_list,
        'page_obj': page_obj,
        'is_paginated': page_obj.has_other_pages(),
    }
    return render(request, 'notifications/notification_postulant.html', context)


@login_required
def marquer_toutes_comme_lues_postulant(request):
    """
    Marque toutes les notifications du postulant connecté comme lues.
    """
    notifications_non_lues = Notification.objects.filter(destinataire=request.user, statut='non lu')
    count = notifications_non_lues.update(statut='lu')

    if count > 0:
        messages.success(request, f"{count} notification(s) marquée(s) comme lue(s).")
    else:
        messages.info(request, "Aucune nouvelle notification à marquer comme lue.")

    return redirect('notification_postulant')
