from app.comptes.models import Employeur

def nom_final(employeur: Employeur) -> str:
    try:
        return employeur.nom_entreprise if employeur.is_representant else employeur.profil.user.username
    except AttributeError:
        return "Employeur inconnu"

