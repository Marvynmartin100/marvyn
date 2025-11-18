// static/recrutements/js/mes_recommandations_employeur.js

document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const recommandationRows = document.querySelectorAll('.recommandation-row');
    const statutFilter = document.getElementById('statut-filter');
    const dateSort = document.getElementById('date-sort');
    const searchInput = document.getElementById('search-recommandations');
    const recommandationsBody = document.getElementById('recommandations-body');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const filterSummary = document.getElementById('filter-summary');
    const visibleCount = document.getElementById('visible-count');

    // Éléments de statistiques
    const totalRecommandations = document.getElementById('total-recommandations');
    const enAttenteCount = document.getElementById('en-attente-count');
    const accepteeCount = document.getElementById('acceptee-count');
    const refuseeCount = document.getElementById('refusee-count');
    const tauxAcceptation = document.getElementById('taux-acceptation');

    // État actuel des filtres
    let currentFilters = {
        statut: 'all',
        dateSort: 'date-desc',
        search: ''
    };

    // Initialisation
    initEventListeners();
    updateAllStats();
    applyAllFilters();
    setupModalHandlers();

    function initEventListeners() {
        // Filtrage par statut
        statutFilter.addEventListener('change', handleStatutFilterChange);

        // Tri par date
        dateSort.addEventListener('change', handleDateSortChange);

        // Recherche en temps réel
        searchInput.addEventListener('input', handleSearchInput);

        // Réinitialisation des filtres
        resetFiltersBtn.addEventListener('click', resetAllFilters);

        // Raccourci clavier : Échap pour réinitialiser la recherche
        document.addEventListener('keydown', handleKeyboardShortcuts);

        // Gestion des formulaires d'action
        initActionForms();

        // Gestion des boutons de profil postulant
        initProfileButtons();
    }

    function initActionForms() {
        const actionForms = document.querySelectorAll('.action-form');
        actionForms.forEach(form => {
            form.addEventListener('submit', handleActionFormSubmit);
        });
    }

    function initProfileButtons() {
        const profileButtons = document.querySelectorAll('.view-profile-btn');
        profileButtons.forEach(button => {
            button.addEventListener('click', handleProfileButtonClick);
        });
    }

    function handleProfileButtonClick(event) {
        event.preventDefault();
        const postulantId = this.getAttribute('data-postulant-id');
        showPostulantProfile(postulantId);
    }

    function handleActionFormSubmit(event) {
        const form = event.target;
        const submitButton = event.submitter;

        if (submitButton && submitButton.value === 'annuler') {
            // Animation spécifique pour l'annulation
            const originalText = submitButton.innerHTML;

            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Annulation...';
            submitButton.disabled = true;
            submitButton.style.opacity = '0.7';

            // Réactiver après 2 secondes (au cas où la soumission échoue)
            setTimeout(() => {
                if (submitButton.disabled) {
                    submitButton.innerHTML = originalText;
                    submitButton.disabled = false;
                    submitButton.style.opacity = '1';
                    showNotification('Erreur lors de l\'annulation. Veuillez réessayer.', 'error');
                }
            }, 2000);
        }
    }

    function handleStatutFilterChange(event) {
        currentFilters.statut = event.target.value;
        applyAllFilters();
        animateFilterChange(statutFilter);
    }

    function handleDateSortChange(event) {
        currentFilters.dateSort = event.target.value;
        applySorting();
        animateFilterChange(dateSort);
    }

    function handleSearchInput(event) {
        currentFilters.search = event.target.value.toLowerCase().trim();
        applyAllFilters();
    }

    function handleKeyboardShortcuts(event) {
        // Échap pour réinitialiser la recherche
        if (event.key === 'Escape') {
            searchInput.value = '';
            currentFilters.search = '';
            applyAllFilters();
        }

        // Ctrl+R pour réinitialiser tous les filtres
        if (event.ctrlKey && event.key === 'r') {
            event.preventDefault();
            resetAllFilters();
        }
    }

    function resetAllFilters() {
        // Réinitialisation des valeurs
        statutFilter.value = 'all';
        dateSort.value = 'date-desc';
        searchInput.value = '';

        // Réinitialisation de l'état
        currentFilters = {
            statut: 'all',
            dateSort: 'date-desc',
            search: ''
        };

        applyAllFilters();
        showNotification('Tous les filtres ont été réinitialisés', 'success');
    }

    function applyAllFilters() {
        let visibleItems = 0;
        const statutCounts = {
            en_attente: 0,
            acceptee: 0,
            refusee: 0
        };

        recommandationRows.forEach(row => {
            const matchesStatut = currentFilters.statut === 'all' ||
                                row.getAttribute('data-statut') === currentFilters.statut;

            const matchesSearch = currentFilters.search === '' ||
                               matchesSearchTerm(row, currentFilters.search);

            const shouldShow = matchesStatut && matchesSearch;

            if (shouldShow) {
                row.style.display = 'table-row';
                visibleItems++;

                // Comptage par statut pour les statistiques
                const statut = row.getAttribute('data-statut');
                if (statutCounts[statut] !== undefined) {
                    statutCounts[statut]++;
                }

                animateRowAppearance(row);
            } else {
                row.style.display = 'none';
            }
        });

        // Application du tri sur les éléments visibles
        applySorting();

        // Mise à jour des statistiques
        updateStats(visibleItems, statutCounts);

        // Mise à jour du résumé de filtrage
        updateFilterSummary(visibleItems);

        // Gestion de l'état vide
        handleEmptyState(visibleItems);
    }

    function matchesSearchTerm(row, searchTerm) {
        const postulant = row.getAttribute('data-postulant');
        const offre = row.getAttribute('data-offre');
        const statut = row.querySelector('.statut-badge').textContent.toLowerCase();

        return postulant.includes(searchTerm) ||
               offre.includes(searchTerm) ||
               statut.includes(searchTerm);
    }

    function applySorting() {
        const visibleRows = Array.from(recommandationRows).filter(row =>
            row.style.display !== 'none'
        );

        if (visibleRows.length === 0) return;

        visibleRows.sort((a, b) => {
            const dateA = new Date(a.getAttribute('data-date'));
            const dateB = new Date(b.getAttribute('data-date'));

            switch(currentFilters.dateSort) {
                case 'date-desc':
                    return dateB - dateA;
                case 'date-asc':
                    return dateA - dateB;
                default:
                    return 0;
            }
        });

        // Réorganisation des éléments dans le DOM avec animation
        animateSorting(visibleRows);
    }

    function animateSorting(sortedRows) {
        // Masquer temporairement les éléments pendant le réarrangement
        sortedRows.forEach(row => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(-20px)';
        });

        // Réorganiser les éléments
        sortedRows.forEach(row => {
            recommandationsBody.appendChild(row);
        });

        // Réafficher avec animation
        setTimeout(() => {
            sortedRows.forEach((row, index) => {
                setTimeout(() => {
                    row.style.opacity = '1';
                    row.style.transform = 'translateX(0)';
                    row.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                }, index * 50);
            });
        }, 100);
    }

    function animateRowAppearance(row) {
        row.style.opacity = '0';
        row.style.transform = 'translateY(10px)';

        setTimeout(() => {
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
            row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        }, 50);
    }

    function animateFilterChange(element) {
        element.style.transform = 'scale(1.02)';
        element.style.boxShadow = '0 0 0 2px rgba(52, 152, 219, 0.2)';

        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.boxShadow = '';
        }, 300);
    }

    function updateAllStats() {
        const statutCounts = {
            en_attente: 0,
            acceptee: 0,
            refusee: 0
        };

        recommandationRows.forEach(row => {
            const statut = row.getAttribute('data-statut');
            if (statutCounts[statut] !== undefined) {
                statutCounts[statut]++;
            }
        });

        updateStats(recommandationRows.length, statutCounts);
    }

    function updateStats(totalCount, statutCounts = { en_attente: 0, acceptee: 0, refusee: 0 }) {
        // Animation des compteurs
        animateCounter(totalRecommandations, totalCount);
        animateCounter(enAttenteCount, statutCounts.en_attente);
        animateCounter(accepteeCount, statutCounts.acceptee);
        animateCounter(refuseeCount, statutCounts.refusee);

        // Calcul et animation du taux d'acceptation
        const taux = totalCount > 0 ? Math.round((statutCounts.acceptee / totalCount) * 100) : 0;
        animateCounter(tauxAcceptation, taux, true);

        // Animation du container de statistiques
        animateStatsContainer();
    }

    function animateCounter(element, newValue, isPercentage = false) {
        if (!element) return;

        const oldValue = parseInt(element.textContent) || 0;

        if (oldValue === newValue) return;

        element.style.transform = 'scale(1.2)';
        element.style.color = '#3498db';

        let current = oldValue;
        const increment = newValue > oldValue ? 1 : -1;
        const stepTime = Math.max(20, Math.abs(newValue - oldValue) * 2);

        const timer = setInterval(() => {
            current += increment;
            element.textContent = isPercentage ? current + '%' : current;

            if (current === newValue) {
                clearInterval(timer);
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                    element.style.color = '';
                }, 300);
            }
        }, stepTime);
    }

    function animateStatsContainer() {
        const statsContainer = document.querySelector('.stats-container');
        if (statsContainer) {
            statsContainer.style.transform = 'translateY(-5px)';
            setTimeout(() => {
                statsContainer.style.transform = 'translateY(0)';
            }, 300);
        }
    }

    function updateFilterSummary(visibleCountValue) {
        if (visibleCount) {
            animateCounter(visibleCount, visibleCountValue);
        }

        // Afficher/masquer le résumé selon les filtres actifs
        const hasActiveFilters = currentFilters.statut !== 'all' ||
                               currentFilters.dateSort !== 'date-desc' ||
                               currentFilters.search !== '';

        if (filterSummary) {
            if (hasActiveFilters) {
                filterSummary.style.display = 'block';
                animateFilterSummaryAppearance();
            } else {
                filterSummary.style.display = 'none';
            }
        }
    }

    function animateFilterSummaryAppearance() {
        if (filterSummary) {
            filterSummary.style.opacity = '0';
            filterSummary.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                filterSummary.style.opacity = '1';
                filterSummary.style.transform = 'translateY(0)';
                filterSummary.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            }, 100);
        }
    }

    function handleEmptyState(visibleCount) {
        const emptyState = document.querySelector('.empty-state');
        const tableContainer = document.querySelector('.table-container');
        const filterSummaryElement = document.querySelector('.filter-summary');

        if (visibleCount === 0 && recommandationRows.length > 0) {
            // Afficher l'état vide filtré
            if (!emptyState || !emptyState.classList.contains('filtered-empty-state')) {
                createFilteredEmptyState();
            }
            if (tableContainer) tableContainer.style.display = 'none';
            if (filterSummaryElement) filterSummaryElement.style.display = 'none';
        } else if (emptyState && emptyState.classList.contains('filtered-empty-state')) {
            // Supprimer l'état vide filtré
            emptyState.remove();
            if (tableContainer) tableContainer.style.display = 'block';
            if (filterSummaryElement && (currentFilters.statut !== 'all' || currentFilters.search !== '')) {
                filterSummaryElement.style.display = 'block';
            }
        }
    }

    function createFilteredEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state filtered-empty-state';
        emptyState.innerHTML = `
            <div class="empty-icon">
                <i class="fas fa-search"></i>
            </div>
            <h3>Aucune recommandation trouvée</h3>
            <p>Aucune recommandation ne correspond à vos critères de recherche.</p>
            <div class="empty-actions">
                <button id="clear-search-filters" class="btn btn-primary">
                    <i class="fas fa-redo"></i>
                    Effacer les filtres
                </button>
            </div>
        `;

        const container = document.querySelector('.container');
        const tableContainer = document.querySelector('.table-container');
        container.insertBefore(emptyState, tableContainer);

        // Animation d'apparition
        emptyState.style.opacity = '0';
        emptyState.style.transform = 'translateY(20px)';

        // Gestionnaire pour le bouton d'effacement
        document.getElementById('clear-search-filters').addEventListener('click', resetAllFilters);

        // Animation d'apparition
        setTimeout(() => {
            emptyState.style.opacity = '1';
            emptyState.style.transform = 'translateY(0)';
            emptyState.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        }, 100);
    }

    function setupModalHandlers() {
        const modal = document.getElementById('postulant-modal');
        const closeModal = document.querySelector('.close-modal');

        if (modal && closeModal) {
            closeModal.addEventListener('click', () => {
                modal.style.display = 'none';
            });

            // Fermer la modal en cliquant à l'extérieur
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });

            // Fermer avec la touche Échap
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && modal.style.display === 'block') {
                    modal.style.display = 'none';
                }
            });
        }
    }

    function showPostulantProfile(postulantId) {
        const modal = document.getElementById('postulant-modal');
        const modalBody = document.getElementById('modal-body');

        if (!modal || !modalBody) return;

        // Afficher un indicateur de chargement
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin fa-2x" style="color: #3498db;"></i>
                <p style="margin-top: 15px; color: #5d6d7e;">Chargement du profil...</p>
            </div>
        `;

        modal.style.display = 'block';

        // Simulation du chargement des données (à remplacer par un appel AJAX réel)
        setTimeout(() => {
            modalBody.innerHTML = `
                <h3 style="color: #2c3e50; margin-bottom: 20px;">Profil du Postulant</h3>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p><strong>ID Postulant:</strong> ${postulantId}</p>
                    <p><strong>Statut:</strong> Disponible</p>
                    <p><strong>Dernière activité:</strong> Il y a 2 jours</p>
                </div>
                <p>Fonctionnalité en cours de développement...</p>
            `;
        }, 1000);
    }

    function showNotification(message, type = 'info') {
        // Création de la notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Styles de la notification (thème bleu employeur)
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ?
                'linear-gradient(135deg, #27ae60, #219653)' :
                type === 'error' ?
                'linear-gradient(135deg, #e74c3c, #c0392b)' :
                'linear-gradient(135deg, #3498db, #2980b9)',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '1000',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: '500'
        });

        // Bouton de fermeture
        const closeBtn = notification.querySelector('.notification-close');
        Object.assign(closeBtn.style, {
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '0',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'background-color 0.2s ease'
        });

        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        });

        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.backgroundColor = 'transparent';
        });

        document.body.appendChild(notification);

        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Fermeture automatique après 3 secondes
        const autoClose = setTimeout(() => {
            closeNotification(notification);
        }, 3000);

        // Fermeture manuelle
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoClose);
            closeNotification(notification);
        });
    }

    function closeNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Export des fonctions pour une utilisation externe
    window.employeurRecommandationsManager = {
        resetAllFilters,
        applyAllFilters,
        updateStats,
        showPostulantProfile,
        getCurrentFilters: () => currentFilters
    };

    console.log('✅ Système de gestion des recommandations employeur initialisé avec succès!');
});

// Gestion du redimensionnement de la fenêtre
window.addEventListener('resize', function() {
    // Réinitialiser les animations si nécessaire
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
        tableContainer.style.height = 'auto';
    }
});