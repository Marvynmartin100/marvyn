// liste_offres_employeur.js

class OffresEmployeurManager {
    constructor() {
        this.offres = [];
        this.filtresActifs = {
            statut: 'all',
            typeContrat: 'all',
            recherche: ''
        };
        this.init();
    }

    init() {
        this.chargerOffres();
        this.initialiserFiltres();
        this.initialiserEvenements();
        this.initialiserCompteurs();
    }

    chargerOffres() {
        const elementsOffres = document.querySelectorAll('.offer-item');
        this.offres = Array.from(elementsOffres).map(offre => ({
            element: offre,
            statut: offre.dataset.statut,
            typeContrat: offre.dataset.type,
            date: offre.dataset.date,
            titre: offre.dataset.titre,
            candidatures: parseInt(offre.dataset.candidatures) || 0,
            id: offre.dataset.id || this.extraireId(offre)
        }));
    }

    extraireId(elementOffre) {
        const idMatch = elementOffre.id.match(/offre-(\d+)/);
        return idMatch ? idMatch[1] : null;
    }

    initialiserFiltres() {
        this.selecteurStatut = document.getElementById('statut-select');
        this.selecteurTypeContrat = document.getElementById('type-contrat-select');
        this.inputRecherche = document.getElementById('search-input');

        if (this.selecteurStatut) {
            this.selecteurStatut.addEventListener('change', () => this.filtrerOffres());
        }
        if (this.selecteurTypeContrat) {
            this.selecteurTypeContrat.addEventListener('change', () => this.filtrerOffres());
        }
        if (this.inputRecherche) {
            this.inputRecherche.addEventListener('input', () => this.filtrerOffres());
        }
    }

    initialiserEvenements() {
        this.initialiserSuppressions();

        // Animation au scroll
        this.observer = new IntersectionObserver(this.gestionAnimationScroll.bind(this), {
            threshold: 0.1,
            rootMargin: '50px'
        });

        document.querySelectorAll('.offer-item').forEach(offre => {
            this.observer.observe(offre);
        });
    }

    initialiserCompteurs() {
        this.mettreAJourCompteurs();
    }

    filtrerOffres() {
        this.filtresActifs = {
            statut: this.selecteurStatut ? this.selecteurStatut.value : 'all',
            typeContrat: this.selecteurTypeContrat ? this.selecteurTypeContrat.value : 'all',
            recherche: this.inputRecherche ? this.inputRecherche.value.toLowerCase() : ''
        };

        this.appliquerFiltres();
        this.mettreAJourCompteursFiltres();
    }

    appliquerFiltres() {
        let offresFiltrees = 0;

        this.offres.forEach(offre => {
            const correspond = this.offreCorrespondFiltres(offre);

            if (correspond) {
                offre.element.style.display = 'block';
                offresFiltrees++;
                this.animerApparition(offre.element);
            } else {
                offre.element.style.display = 'none';
            }
        });

        this.afficherEtatVide(offresFiltrees === 0);
    }

    offreCorrespondFiltres(offre) {
        if (this.filtresActifs.statut !== 'all' && offre.statut !== this.filtresActifs.statut) {
            return false;
        }

        if (this.filtresActifs.typeContrat !== 'all' && offre.typeContrat !== this.filtresActifs.typeContrat) {
            return false;
        }

        if (this.filtresActifs.recherche && !offre.titre.includes(this.filtresActifs.recherche)) {
            return false;
        }

        return true;
    }

    mettreAJourCompteurs() {
        const totalOffres = document.getElementById('total-offres');
        const activeCount = document.getElementById('active-count');
        const expireeCount = document.getElementById('expiree-count');
        const candidaturesCount = document.getElementById('candidatures-count');

        if (totalOffres) totalOffres.textContent = this.offres.length;

        const stats = this.calculerStats();
        if (activeCount) activeCount.textContent = stats.actives;
        if (expireeCount) expireeCount.textContent = stats.expirees;
        if (candidaturesCount) candidaturesCount.textContent = stats.totalCandidatures;
    }

    mettreAJourCompteursFiltres() {
        const offresFiltrees = this.offres.filter(offre =>
            this.offreCorrespondFiltres(offre)
        ).length;

        this.animerCompteur('total-offres', offresFiltrees);
    }

    calculerStats() {
        return this.offres.reduce((stats, offre) => {
            if (offre.statut === 'active') stats.actives++;
            if (offre.statut === 'expiree') stats.expirees++;
            stats.totalCandidatures += offre.candidatures;
            return stats;
        }, { actives: 0, expirees: 0, totalCandidatures: 0 });
    }

    initialiserSuppressions() {
        document.querySelectorAll('.btn-supprimer').forEach(bouton => {
            bouton.addEventListener('click', (e) => {
                e.preventDefault();
                this.confirmerSuppression(bouton);
            });
        });
    }

    async confirmerSuppression(bouton) {
        const offreId = bouton.getAttribute('data-id');
        const offreTitre = bouton.getAttribute('data-titre') || 'cette offre';

        if (!offreId) {
            console.error('ID de l\'offre non trouvé');
            return;
        }

        if (!confirm(`Voulez-vous vraiment supprimer l'offre "${offreTitre}" ?`)) {
            return;
        }

        await this.supprimerOffre(offreId, bouton);
    }

    async supprimerOffre(offreId, bouton) {
        const elementOffre = bouton.closest('.offer-item');

        try {
            // Afficher un indicateur de chargement
            const texteOriginal = bouton.innerHTML;
            bouton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Suppression...';
            bouton.disabled = true;

            // Animation de disparition
            this.animerDisparition(elementOffre);

            // Utiliser votre URL de suppression
            const response = await fetch(`/recrutements/supprimer_offre/${offreId}/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": this.getCSRFToken(),
                    "X-Requested-With": "XMLHttpRequest"
                }
            });

            if (response.ok) {
                const data = await response.json();

                if (data.success) {
                    // Mettre à jour la liste localement
                    this.offres = this.offres.filter(offre =>
                        offre.id !== offreId
                    );

                    // Mettre à jour les compteurs
                    this.mettreAJourCompteurs();

                    // Supprimer l'élément du DOM après l'animation
                    setTimeout(() => {
                        if (elementOffre && elementOffre.parentNode) {
                            elementOffre.remove();
                        }
                        this.verifierListeVide();
                    }, 300);

                    alert("Offre supprimée avec succès !");
                } else {
                    throw new Error(data.message || "Une erreur est survenue.");
                }
            } else {
                throw new Error("Erreur serveur lors de la suppression.");
            }

        } catch (error) {
            console.error('Erreur suppression:', error);

            // Restaurer le bouton
            bouton.innerHTML = '<i class="fas fa-trash"></i> Supprimer';
            bouton.disabled = false;

            // Annuler l'animation
            if (elementOffre) {
                elementOffre.style.transform = 'translateY(0)';
                elementOffre.style.opacity = '1';
                elementOffre.style.height = '';
                elementOffre.style.marginBottom = '';
                elementOffre.style.paddingTop = '';
                elementOffre.style.paddingBottom = '';
                elementOffre.style.border = '';
            }

            alert(error.message || "Impossible de supprimer l'offre.");
        }
    }

    getCSRFToken() {
        // Votre fonction getCookie originale
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, 10) === "csrftoken=") {
                    cookieValue = decodeURIComponent(cookie.substring(10));
                    break;
                }
            }
        }
        return cookieValue;
    }

    animerApparition(element) {
        element.style.animation = 'none';
        element.offsetHeight;
        element.style.animation = 'fadeInUp 0.6s ease forwards';
    }

    animerDisparition(element) {
        element.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        element.style.transform = 'translateX(100px)';
        element.style.opacity = '0';
        element.style.height = '0';
        element.style.marginBottom = '0';
        element.style.paddingTop = '0';
        element.style.paddingBottom = '0';
        element.style.border = 'none';
        element.style.overflow = 'hidden';
    }

    animerCompteur(elementId, nouvelleValeur) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const ancienneValeur = parseInt(element.textContent) || 0;
        const difference = nouvelleValeur - ancienneValeur;
        const duree = 500;
        const steps = 20;
        const stepTime = duree / steps;
        const stepValue = difference / steps;

        let currentStep = 0;
        const timer = setInterval(() => {
            currentStep++;
            const valeurActuelle = Math.round(ancienneValeur + (stepValue * currentStep));
            element.textContent = valeurActuelle;

            if (currentStep >= steps) {
                element.textContent = nouvelleValeur;
                clearInterval(timer);
            }
        }, stepTime);
    }

    gestionAnimationScroll(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }

    afficherEtatVide(afficher) {
        const emptyState = document.querySelector('.empty-state');
        const offersList = document.getElementById('offers-list');

        if (emptyState && offersList) {
            if (afficher) {
                emptyState.classList.add('show');
                offersList.style.display = 'none';
            } else {
                emptyState.classList.remove('show');
                offersList.style.display = 'block';
            }
        }
    }

    verifierListeVide() {
        const offresVisibles = document.querySelectorAll('.offer-item[style*="display: block"]');
        this.afficherEtatVide(offresVisibles.length === 0);
    }

    // Méthode pour réinitialiser les filtres
    reinitialiserFiltres() {
        if (this.selecteurStatut) this.selecteurStatut.value = 'all';
        if (this.selecteurTypeContrat) this.selecteurTypeContrat.value = 'all';
        if (this.inputRecherche) this.inputRecherche.value = '';
        this.filtrerOffres();
    }
}

// Initialisation quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    const offresManager = new OffresEmployeurManager();

    // Raccourcis clavier
    document.addEventListener('keydown', function(e) {
        // Ctrl + F pour focus la recherche
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.focus();
        }

        // Échap pour réinitialiser les filtres
        if (e.key === 'Escape') {
            offresManager.reinitialiserFiltres();
        }
    });
});

// Fonction getCookie globale pour compatibilité
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === name + "=") {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Fonctions utilitaires
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// --- JS pour relancer le compteur ---
document.addEventListener("DOMContentLoaded", function () {
    const relancerButtons = document.querySelectorAll(".btn-relancer");

    relancerButtons.forEach(button => {
        button.addEventListener("click", function () {
            const offreId = this.getAttribute("data-id");

            if (!offreId) {
                console.error("ID de l'offre manquant !");
                return;
            }

            const url = `/recrutements/offres/${offreId}/relancer/`;

            fetch(url, {
                method: "POST",
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRFToken": getCookie("csrftoken")
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const compteurElement = document.querySelector(`#jours-restants-${offreId}`);
                    if (compteurElement) {
                        compteurElement.textContent = `${data.remaining_days} jours restants`;
                    }
                    alert("Le compteur a bien été relancé !");
                } else {
                    alert("Une erreur est survenue.");
                }
            })
            .catch(error => {
                console.error("Erreur:", error);
                alert("Impossible de relancer le compteur.");
            });
        });
    });
});

