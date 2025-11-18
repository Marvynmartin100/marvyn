// static/recrutements/js/mes_recommandations_postulant.js
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
    }

    function initActionForms() {
        const actionForms = document.querySelectorAll('.action-form');
        actionForms.forEach(form => {
            form.addEventListener('submit', handleActionFormSubmit);
        });
    }

    function handleActionFormSubmit(event) {
        const form = event.target;
        const submitButton = event.submitter;
        
        if (submitButton) {
            // Animation de confirmation
            const originalText = submitButton.innerHTML;
            const buttonType = submitButton.value === 'accepter' ? 'success' : 'danger';
            
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
            submitButton.disabled = true;
            
            // Réactiver après 2 secondes (au cas où la soumission échoue)
            setTimeout(() => {
                if (submitButton.disabled) {
                    submitButton.innerHTML = originalText;
                    submitButton.disabled = false;
                    showNotification('Erreur lors du traitement. Veuillez réessayer.', 'error');
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
        const employeur = row.getAttribute('data-employeur');
        const offre = row.getAttribute('data-offre');
        const statut = row.querySelector('.statut-badge').textContent.toLowerCase();

        return employeur.includes(searchTerm) ||
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
        element.style.boxShadow = '0 0 0 2px rgba(142, 68, 173, 0.2)';

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

        // Animation du container de statistiques
        animateStatsContainer();
    }

    function animateCounter(element, newValue) {
        const oldValue = parseInt(element.textContent) || 0;

        if (oldValue === newValue) return;

        element.style.transform = 'scale(1.2)';
        element.style.color = '#ff6b6b';

        let current = oldValue;
        const increment = newValue > oldValue ? 1 : -1;
        const stepTime = Math.max(20, Math.abs(newValue - oldValue) * 2);

        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;

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

    function showNotification(message, type = 'info') {
        // Création de la notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Styles de la notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ?
                'linear-gradient(135deg, #27ae60, #219653)' :
                type === 'error' ?
                'linear-gradient(135deg, #e74c3c, #c0392b)' :
                'linear-gradient(135deg, #8e44ad, #6c3483)',
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

    // Fonction pour confirmer les actions critiques
    function confirmAction(message) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;

            modal.innerHTML = `
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                ">
                    <h3 style="color: #2c3e50; margin-bottom: 15px;">Confirmation</h3>
                    <p style="color: #5d6d7e; margin-bottom: 25px;">${message}</p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button class="btn-confirm-cancel" style="
                            padding: 10px 20px;
                            border: 2px solid #8e44ad;
                            background: transparent;
                            color: #8e44ad;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Annuler</button>
                        <button class="btn-confirm-ok" style="
                            padding: 10px 20px;
                            background: #8e44ad;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Confirmer</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const cancelBtn = modal.querySelector('.btn-confirm-cancel');
            const okBtn = modal.querySelector('.btn-confirm-ok');

            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });

            okBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(true);
            });
        });
    }

    // Export des fonctions pour une utilisation externe
    window.recommandationsManager = {
        resetAllFilters,
        applyAllFilters,
        updateStats,
        confirmAction,
        getCurrentFilters: () => currentFilters
    };

    console.log('✅ Système de gestion des recommandations initialisé avec succès!');
});

// Gestion du redimensionnement de la fenêtre
window.addEventListener('resize', function() {
    // Réinitialiser les animations si nécessaire
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
        tableContainer.style.height = 'auto';
    }
});