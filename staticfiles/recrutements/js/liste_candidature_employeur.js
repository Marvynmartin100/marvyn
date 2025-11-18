// static/recrutements/js/liste_candidature_employeur.js

class CandidaturesEmployeurManager {
    constructor() {
        this.candidatures = [];
        this.filtresActifs = {
            offre: 'all',
            statut: 'all',
            recherche: ''
        };
        this.init();
    }

    init() {
        this.chargerCandidatures();
        this.initialiserFiltres();
        this.initialiserEvenements();
        this.initialiserCompteurs();
        this.initialiserConfirmations();
    }

    chargerCandidatures() {
        const elementsCandidatures = document.querySelectorAll('.candidature-item');
        this.candidatures = Array.from(elementsCandidatures).map(candidature => ({
            element: candidature,
            statut: candidature.dataset.statut,
            offre: candidature.dataset.offre,
            date: candidature.dataset.date,
            postulant: candidature.dataset.postulant
        }));

        this.mettreAJourCompteurs();
    }

    initialiserFiltres() {
        // Filtre par statut
        this.selecteurStatut = document.getElementById('statut-filter');
        this.inputRecherche = document.getElementById('search-candidatures');
        this.boutonReset = document.getElementById('reset-filters');

        if (this.selecteurStatut) {
            this.selecteurStatut.addEventListener('change', () => this.filtrerCandidatures());
        }

        if (this.inputRecherche) {
            this.inputRecherche.addEventListener('input', this.debounce(() => this.filtrerCandidatures(), 300));
        }

        if (this.boutonReset) {
            this.boutonReset.addEventListener('click', () => this.reinitialiserFiltres());
        }
    }

    initialiserEvenements() {
        // Animation au scroll
        this.observer = new IntersectionObserver(this.gestionAnimationScroll.bind(this), {
            threshold: 0.1,
            rootMargin: '50px'
        });

        document.querySelectorAll('.candidature-item').forEach(candidature => {
            this.observer.observe(candidature);
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => this.gestionRaccourcis(e));
    }

    initialiserCompteurs() {
        this.mettreAJourCompteurs();
    }

    initialiserConfirmations() {
        // Confirmation pour les actions accepter/refuser
        document.querySelectorAll('form.action-form').forEach(form => {
            const bouton = form.querySelector('button[type="submit"]');
            if (bouton) {
                bouton.addEventListener('click', (e) => {
                    const action = bouton.value;
                    const confirmation = this.demanderConfirmation(action);

                    if (!confirmation) {
                        e.preventDefault();
                    }
                });
            }
        });
    }

    demanderConfirmation(action) {
        const messages = {
            'accepter': 'Êtes-vous sûr de vouloir accepter cette candidature ?',
            'refuser': 'Êtes-vous sûr de vouloir refuser cette candidature ? Cette action est irréversible.'
        };

        return confirm(messages[action] || 'Confirmer cette action ?');
    }

    filtrerCandidatures() {
        // Mettre à jour les filtres actifs
        this.filtresActifs = {
            offre: this.getOffreSelectionnee(),
            statut: this.selecteurStatut ? this.selecteurStatut.value : 'all',
            recherche: this.inputRecherche ? this.inputRecherche.value.toLowerCase() : ''
        };

        this.appliquerFiltres();
        this.mettreAJourCompteursFiltres();
        this.mettreAJourResumeFiltrage();
    }

    getOffreSelectionnee() {
        const selecteurOffre = document.getElementById('offre');
        return selecteurOffre ? selecteurOffre.value : 'all';
    }

    appliquerFiltres() {
        let candidaturesFiltrees = 0;

        this.candidatures.forEach(candidature => {
            const correspond = this.candidatureCorrespondFiltres(candidature);

            if (correspond) {
                candidature.element.style.display = 'block';
                candidaturesFiltrees++;
                this.animerApparition(candidature.element);
            } else {
                candidature.element.style.display = 'none';
            }
        });

        this.afficherEtatVide(candidaturesFiltrees === 0);
    }

    candidatureCorrespondFiltres(candidature) {
        // Filtre par offre
        if (this.filtresActifs.offre !== 'all' && this.filtresActifs.offre !== '' &&
            candidature.offre !== this.filtresActifs.offre) {
            return false;
        }

        // Filtre par statut
        if (this.filtresActifs.statut !== 'all' && candidature.statut !== this.filtresActifs.statut) {
            return false;
        }

        // Filtre par recherche
        if (this.filtresActifs.recherche && !candidature.postulant.includes(this.filtresActifs.recherche)) {
            return false;
        }

        return true;
    }

    mettreAJourCompteurs() {
        const stats = this.calculerStats();

        this.animerCompteur('total-candidatures', this.candidatures.length);
        this.animerCompteur('en-attente-count', stats.en_attente);
        this.animerCompteur('acceptee-count', stats.acceptee);
        this.animerCompteur('refusee-count', stats.refusee);
    }

    mettreAJourCompteursFiltres() {
        const candidaturesFiltrees = this.candidatures.filter(candidature =>
            this.candidatureCorrespondFiltres(candidature)
        ).length;

        this.animerCompteur('total-candidatures', candidaturesFiltrees);
    }

    calculerStats() {
        return this.candidatures.reduce((stats, candidature) => {
            if (candidature.statut === 'en attente') stats.en_attente++;
            if (candidature.statut === 'acceptee') stats.acceptee++;
            if (candidature.statut === 'refusee') stats.refusee++;
            return stats;
        }, { en_attente: 0, acceptee: 0, refusee: 0 });
    }

    mettreAJourResumeFiltrage() {
        const visibleCount = document.getElementById('visible-count');
        const candidaturesFiltrees = this.candidatures.filter(candidature =>
            this.candidatureCorrespondFiltres(candidature)
        ).length;

        if (visibleCount) {
            visibleCount.textContent = candidaturesFiltrees;
        }
    }

    reinitialiserFiltres() {
        if (this.selecteurStatut) this.selecteurStatut.value = 'all';
        if (this.inputRecherche) this.inputRecherche.value = '';

        // Réinitialiser aussi le filtre d'offre si possible
        const selecteurOffre = document.getElementById('offre');
        if (selecteurOffre) {
            selecteurOffre.value = '';
        }

        this.filtrerCandidatures();
    }

    animerApparition(element) {
        element.style.animation = 'none';
        element.offsetHeight; // Trigger reflow
        element.style.animation = 'fadeInUp 0.6s ease forwards';
    }

    animerCompteur(elementId, nouvelleValeur) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const ancienneValeur = parseInt(element.textContent) || 0;

        if (ancienneValeur === nouvelleValeur) return;

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

    gestionRaccourcis(e) {
        // Ctrl + F pour focus la recherche
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            if (this.inputRecherche) {
                this.inputRecherche.focus();
            }
        }

        // Échap pour réinitialiser les filtres
        if (e.key === 'Escape') {
            this.reinitialiserFiltres();
        }
    }

    afficherEtatVide(afficher) {
        const emptyState = document.querySelector('.empty-state');
        const candidaturesList = document.getElementById('candidatures-list');
        const filterSummary = document.querySelector('.filter-summary');

        if (emptyState && candidaturesList) {
            if (afficher) {
                emptyState.style.display = 'block';
                candidaturesList.style.display = 'none';
                if (filterSummary) filterSummary.style.display = 'none';
            } else {
                emptyState.style.display = 'none';
                candidaturesList.style.display = 'block';
                if (filterSummary) filterSummary.style.display = 'block';
            }
        }
    }

    // Méthode pour exporter les candidatures
    exporterCandidatures() {
        const candidaturesFiltrees = this.candidatures.filter(candidature =>
            this.candidatureCorrespondFiltres(candidature)
        );

        const data = candidaturesFiltrees.map(candidature => {
            const element = candidature.element;
            return {
                postulant: element.querySelector('.postulant-name').textContent.trim(),
                offre: element.querySelector('.detail-item:nth-child(1) span').textContent.trim(),
                statut: element.querySelector('.statut-badge').textContent.trim(),
                date_candidature: element.querySelector('.meta-date').textContent.replace('Candidaté le ', ''),
                email: element.querySelector('.detail-item:nth-child(2) span').textContent.trim(),
                localisation: element.querySelector('.detail-item:nth-child(3) span').textContent.trim()
            };
        });

        this.genererCSV(data);
    }

    genererCSV(data) {
        const headers = ['Postulant', 'Offre', 'Statut', 'Date candidature', 'Email', 'Localisation'];
        const csvContent = [
            headers.join(','),
            ...data.map(row => [
                `"${row.postulant}"`,
                `"${row.offre}"`,
                `"${row.statut}"`,
                `"${row.date_candidature}"`,
                `"${row.email}"`,
                `"${row.localisation}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `candidatures-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Méthode utilitaire debounce
    debounce(func, wait) {
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

    // Méthode pour rafraîchir les données (utile si AJAX)
    rafraichirDonnees() {
        // Simuler un rechargement (à adapter avec une vraie requête AJAX si nécessaire)
        this.chargerCandidatures();
        this.filtrerCandidatures();

        // Afficher un feedback
        this.afficherMessage('Données rafraîchies', 'success');
    }

    afficherMessage(message, type = 'info') {
        // Créer un message temporaire
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            ${message}
        `;

        const container = document.querySelector('.messages-container') || document.body;
        container.appendChild(messageDiv);

        // Supprimer après 5 secondes
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Initialisation quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    const candidaturesManager = new CandidaturesEmployeurManager();

    // Exposer l'instance globalement pour debug
    window.candidaturesManager = candidaturesManager;


    // Ajouter un bouton de rafraîchissement
    const ajouterBoutonRafraichir = () => {
        const footerActions = document.querySelector('.footer-actions .action-group');
        if (footerActions && !document.getElementById('btn-refresh')) {
            const boutonRefresh = document.createElement('button');
            boutonRefresh.id = 'btn-refresh';
            boutonRefresh.className = 'btn btn-outline';
            boutonRefresh.innerHTML = '<i class="fas fa-redo"></i> Rafraîchir';
            boutonRefresh.addEventListener('click', () => candidaturesManager.rafraichirDonnees());
            footerActions.appendChild(boutonRefresh);
        }
    };

    // Attendre un peu avant d'ajouter les boutons supplémentaires
    setTimeout(() => {
        ajouterBoutonExport();
        ajouterBoutonRafraichir();
    }, 1000);
});

// Fonction utilitaire pour formater les dates
function formaterDate(dateString) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

// Fonction pour compter les éléments visibles
function compterElementsVisibles(selector) {
    return document.querySelectorAll(`${selector}:not([style*="display: none"])`).length;
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CandidaturesEmployeurManager };
}