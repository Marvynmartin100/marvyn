from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from .models import Notification


def creer_notification(
    type,
    destinataire: User,
    contenu: str,
    emetteur: User = None,
    action_possible='aucune',
    cible=None
):
    """
    Crée une notification centralisée avec gestion des erreurs.
    """

    if not destinataire:
        raise ValueError("Un destinataire est obligatoire pour créer une notification.")

    notif_data = {
        'type': type,
        'destinataire': destinataire,
        'contenu': contenu,
        'emetteur': emetteur,
        'action_possible': action_possible
    }

    # Si une cible (objet lié) est fournie
    if cible is not None:
        try:
            notif_data['content_type'] = ContentType.objects.get_for_model(cible)
            notif_data['object_id'] = cible.pk
        except (ObjectDoesNotExist, AttributeError):
            raise ValueError("L’objet cible fourni n’est pas valide.")

    return Notification.objects.create(**notif_data)
