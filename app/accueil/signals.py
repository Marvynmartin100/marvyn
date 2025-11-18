from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import User

from app.notifications.models import Notification
from app.recrutements.models import OffreEmploi
from app.recrutements.models import Candidature
from app.messageries.models import Message

from django.db.models.signals import post_save
from django.dispatch import receiver

from app.comptes.models import Profil
from app.notifications.utils import creer_notification  # ✅ notre fonction centralisée



# =====================================================
# 🔹 Exemple 2 : Quand une candidature est soumise
# =====================================================
@receiver(post_save, sender=Candidature)
def notif_candidature_envoyee(sender, instance, created, **kwargs):
    if created:
        # Notification à l’employeur
        creer_notification(
            type='alerte',
            destinataire=instance.offre.employeur.profil.user,
            contenu=f"{instance.postulant.profil.user.username} a postulé à votre offre « {instance.offre.titre} ».",
            emetteur=instance.postulant.profil.user,
            cible=instance.offre
        )


# =====================================================
# 🔹 Exemple 3 : Quand une candidature est acceptée
# =====================================================
@receiver(post_save, sender=Candidature)
def notif_candidature_acceptee(sender, instance, **kwargs):
    if instance.statut == 'acceptée':
        creer_notification(
            type='succes',
            destinataire=instance.postulant.profil.user,
            contenu=f"Félicitations ! Votre candidature à « {instance.offre.titre} » a été acceptée.",
            emetteur=instance.offre.employeur.profil.user,
            cible=instance.offre
        )







@receiver(post_save, sender=OffreEmploi)
def notif_creation_offre_employeur(sender, instance, created, **kwargs):
    """
    Notifie uniquement l'employeur que son offre vient d'être publiée.
    """
    if created:
        employeur_obj = instance.employeur
        if employeur_obj and hasattr(employeur_obj, 'profil') and employeur_obj.profil.user:
            destinataire_user = employeur_obj.profil.user

            creer_notification(
                type='info',
                destinataire=destinataire_user,
                contenu=f"Votre offre '{instance.titre}' est maintenant en ligne.",
                emetteur=None,  # système
                cible=instance
            )
