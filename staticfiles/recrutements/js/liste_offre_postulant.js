// templates/postulant/js/liste_offres.js
document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const offerItems = document.querySelectorAll('.offer-item');
    const typeContratSelect = document.getElementById('type-contrat-select');
    const provinceSelect = document.getElementById('province-select');
    const arrondissementSelect = document.getElementById('arrondissement-select');
    const sortSelect = document.getElementById('sort-select');
    const searchInput = document.getElementById('search-input');
    const offersList = document.getElementById('offers-list');
    const emptyState = document.querySelector('.empty-state');

    // Éléments de statistiques
    const totalOffresElement = document.getElementById('total-offres');
    const cdiCountElement = document.getElementById('cdi-count');
    const cddCountElement = document.getElementById('cdd-count');
    const stageCountElement = document.getElementById('stage-count');
    const freelanceCountElement = document.getElementById('freelance-count');

    // État actuel des filtres
    let currentFilters = {
        type: 'all',
        province: 'all',
        arrondissement: 'all',
        sort: 'date-desc',
        search: ''
    };

    // Initialisation
    initEventListeners();
    updateAllStats();
    initScrollAnimations();
    initAutoDismissMessages(); // Nouvelle fonction pour les messages Django

    function initEventListeners() {
        // Filtrage par type de contrat
        typeContratSelect.addEventListener('change', handleTypeContratChange);

        // Filtrage par localisation
        provinceSelect.addEventListener('change', handleProvinceChange);
        arrondissementSelect.addEventListener('change', handleArrondissementChange);

        // Tri des offres
        sortSelect.addEventListener('change', handleSortChange);

        // Recherche en temps réel
        searchInput.addEventListener('input', handleSearchInput);

        // Réinitialisation avec double-clic sur les selects
        [typeContratSelect, provinceSelect, arrondissementSelect, sortSelect].forEach(select => {
            select.addEventListener('dblclick', resetSingleFilter);
        });

        // Réinitialisation avec Ctrl+R
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }



    // FONCTION : Configurer l'auto-dismiss pour un message
    function setupMessageAutoDismiss(messageElement, delay) {
        // Marquer comme déjà configuré pour éviter les doublons
        messageElement.setAttribute('data-auto-dismiss-setup', 'true');

        // Ajouter un style pour le rendre cliquable
        messageElement.style.cursor = 'pointer';
        messageElement.style.transition = 'all 0.5s ease';

        console.log(`⏰ Configuration auto-dismiss pour: "${messageElement.textContent.substring(0, 30)}..."`);

        // Fermeture automatique après le délai
        const autoCloseTimer = setTimeout(() => {
            console.log('🕒 Auto-fermeture du message');
            dismissMessageElement(messageElement);
        }, delay);

        // Fermeture manuelle au clic
        messageElement.addEventListener('click', function() {
            console.log('🖱️ Fermeture manuelle du message');
            clearTimeout(autoCloseTimer);
            dismissMessageElement(messageElement);
        });

        // Fermeture manuelle avec la touche Échap
        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                console.log('⌨️ Fermeture par Échap');
                clearTimeout(autoCloseTimer);
                dismissMessageElement(messageElement);
                document.removeEventListener('keydown', handler);
            }
        });
    }

    // FONCTION : Fermer un élément message avec animation
    function dismissMessageElement(element) {
        console.log('❌ Fermeture du message en cours...');

        // Animation de disparition
        element.style.opacity = '0';
        element.style.transform = 'translateY(-20px)';
        element.style.maxHeight = '0';
        element.style.margin = '0';
        element.style.padding = '0';
        element.style.overflow = 'hidden';
        element.style.transition = 'all 0.5s ease';

        // Suppression après l'animation
        setTimeout(() => {
            if (element.parentNode) {
                console.log('🗑️ Suppression du DOM');
                element.parentNode.removeChild(element);
            }
        }, 500);
    }

    function handleTypeContratChange(event) {
        currentFilters.type = event.target.value;
        applyAllFilters();
        animateFilterChange(typeContratSelect);
    }

    function handleProvinceChange(event) {
        currentFilters.province = event.target.value;
        applyAllFilters();
        animateFilterChange(provinceSelect);
    }

    function handleArrondissementChange(event) {
        currentFilters.arrondissement = event.target.value;
        applyAllFilters();
        animateFilterChange(arrondissementSelect);
    }

    function handleSortChange(event) {
        currentFilters.sort = event.target.value;
        applySorting();
        animateFilterChange(sortSelect);
    }

    function handleSearchInput(event) {
        currentFilters.search = event.target.value.toLowerCase().trim();
        applyAllFilters();
    }

    function handleKeyboardShortcuts(event) {
        // Ctrl+R pour réinitialiser tous les filtres
        if (event.ctrlKey && event.key === 'r') {
            event.preventDefault();
            resetAllFilters();
        }

        // Échap pour réinitialiser la recherche
        if (event.key === 'Escape') {
            searchInput.value = '';
            currentFilters.search = '';
            applyAllFilters();
        }
    }

    function resetSingleFilter(event) {
        const select = event.target;
        select.value = 'all';

        switch(select.id) {
            case 'type-contrat-select':
                currentFilters.type = 'all';
                break;
            case 'province-select':
                currentFilters.province = 'all';
                break;
            case 'arrondissement-select':
                currentFilters.arrondissement = 'all';
                break;
            case 'sort-select':
                currentFilters.sort = 'date-desc';
                break;
        }

        applyAllFilters();
        showNotification(`Filtre ${getSelectLabel(select)} réinitialisé`, 'info');
    }

    function getSelectLabel(select) {
        const labels = {
            'type-contrat-select': 'type de contrat',
            'province-select': 'province',
            'arrondissement-select': 'arrondissement',
            'sort-select': 'tri'
        };
        return labels[select.id] || 'filtre';
    }

    function resetAllFilters() {
        // Réinitialisation des valeurs
        typeContratSelect.value = 'all';
        provinceSelect.value = 'all';
        arrondissementSelect.value = 'all';
        sortSelect.value = 'date-desc';
        searchInput.value = '';

        // Réinitialisation de l'état
        currentFilters = {
            type: 'all',
            province: 'all',
            arrondissement: 'all',
            sort: 'date-desc',
            search: ''
        };

        applyAllFilters();
        showNotification('Tous les filtres ont été réinitialisés', 'success');
    }

    function applyAllFilters() {
        let visibleItems = 0;
        const typeCounts = { cdi: 0, cdd: 0, stage: 0, freelance: 0 };

        offerItems.forEach(item => {
            const matchesType = currentFilters.type === 'all' ||
                              item.getAttribute('data-type') === currentFilters.type;

            const matchesProvince = currentFilters.province === 'all' ||
                                  item.getAttribute('data-province').includes(currentFilters.province);

            const matchesArrondissement = currentFilters.arrondissement === 'all' ||
                                        item.getAttribute('data-arrondissement').includes(currentFilters.arrondissement);

            const matchesSearch = currentFilters.search === '' ||
                                matchesSearchTerm(item, currentFilters.search);

            const shouldShow = matchesType && matchesProvince && matchesArrondissement && matchesSearch;

            if (shouldShow) {
                item.style.display = 'block';
                visibleItems++;

                // Comptage par type pour les statistiques
                const type = item.getAttribute('data-type');
                if (typeCounts[type] !== undefined) {
                    typeCounts[type]++;
                }

                animateItemAppearance(item);
            } else {
                item.style.display = 'none';
            }
        });

        // Application du tri sur les éléments visibles
        applySorting();

        // Mise à jour des statistiques
        updateStats(visibleItems, typeCounts);

        // Gestion de l'état vide
        handleEmptyState(visibleItems);

        // Mise à jour du compteur total initial
        if (totalOffresElement) {
            totalOffresElement.textContent = visibleItems;
        }
    }

    function matchesSearchTerm(item, searchTerm) {
        const titre = item.getAttribute('data-titre');
        const domaine = item.getAttribute('data-domaine');
        const province = item.getAttribute('data-province');
        const arrondissement = item.getAttribute('data-arrondissement');
        const description = item.querySelector('.offer-description').textContent.toLowerCase();

        return titre.includes(searchTerm) ||
               domaine.includes(searchTerm) ||
               province.includes(searchTerm) ||
               arrondissement.includes(searchTerm) ||
               description.includes(searchTerm);
    }

    function applySorting() {
        const visibleItems = Array.from(offerItems).filter(item =>
            item.style.display !== 'none'
        );

        if (visibleItems.length === 0) return;

        visibleItems.sort((a, b) => {
            switch(currentFilters.sort) {
                case 'date-desc':
                    return new Date(b.getAttribute('data-date')) - new Date(a.getAttribute('data-date'));
                case 'date-asc':
                    return new Date(a.getAttribute('data-date')) - new Date(b.getAttribute('data-date'));
                case 'salaire-desc':
                    return parseFloat(b.getAttribute('data-salaire')) - parseFloat(a.getAttribute('data-salaire'));
                case 'salaire-asc':
                    return parseFloat(a.getAttribute('data-salaire')) - parseFloat(b.getAttribute('data-salaire'));
                case 'alphabetic':
                    return a.getAttribute('data-titre').localeCompare(b.getAttribute('data-titre'));
                default:
                    return 0;
            }
        });

        // Réorganisation des éléments dans le DOM avec animation
        animateSorting(visibleItems);
    }

    function animateSorting(sortedItems) {
        // Masquer temporairement les éléments pendant le réarrangement
        sortedItems.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
        });

        // Réorganiser les éléments
        sortedItems.forEach(item => {
            offersList.appendChild(item);
        });

        // Réafficher avec animation
        setTimeout(() => {
            sortedItems.forEach((item, index) => {
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateX(0)';
                    item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                }, index * 50);
            });
        }, 100);
    }

    function animateItemAppearance(item) {
        item.style.opacity = '0';
        item.style.transform = 'translateY(10px)';

        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
            item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        }, 50);
    }

    function animateFilterChange(element) {
        element.style.transform = 'scale(1.02)';
        element.style.boxShadow = '0 0 0 2px rgba(59, 59, 103, 0.2)';

        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.boxShadow = '';
        }, 300);
    }

    function updateAllStats() {
        const typeCounts = { cdi: 0, cdd: 0, stage: 0, freelance: 0 };

        offerItems.forEach(item => {
            const type = item.getAttribute('data-type');
            if (typeCounts[type] !== undefined) {
                typeCounts[type]++;
            }
        });

        updateStats(offerItems.length, typeCounts);
    }

    function updateStats(visibleCount, typeCounts = { cdi: 0, cdd: 0, stage: 0, freelance: 0 }) {
        // Animation du compteur total
        if (totalOffresElement) {
            animateCounter(totalOffresElement, visibleCount);
        }

        // Mise à jour des compteurs par type
        if (cdiCountElement) animateCounter(cdiCountElement, typeCounts.cdi);
        if (cddCountElement) animateCounter(cddCountElement, typeCounts.cdd);
        if (stageCountElement) animateCounter(stageCountElement, typeCounts.stage);
        if (freelanceCountElement) animateCounter(freelanceCountElement, typeCounts.freelance);

        // Animation des statistiques
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

    function handleEmptyState(visibleCount) {
        if (visibleCount === 0 && emptyState) {
            emptyState.classList.add('show');
            offersList.style.display = 'none';
            animateEmptyState();
        } else if (emptyState) {
            emptyState.classList.remove('show');
            offersList.style.display = 'block';
        }
    }

    function animateEmptyState() {
        if (emptyState) {
            emptyState.style.opacity = '0';
            emptyState.style.transform = 'translateY(20px)';

            setTimeout(() => {
                emptyState.style.opacity = '1';
                emptyState.style.transform = 'translateY(0)';
                emptyState.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            }, 300);
        }
    }

    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.target.style.display !== 'none') {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        offerItems.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(item);
        });
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ?
                'linear-gradient(135deg, #4ecdc4, #3dbeb6)' :
                'linear-gradient(135deg, #3b3b67, #2c2c54)',
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

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        const autoClose = setTimeout(() => {
            closeNotification(notification);
        }, 3000);

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

    window.offresManager = {
        resetAllFilters,
        applyAllFilters,
        updateStats,
        getCurrentFilters: () => currentFilters
    };

    console.log('✅ Système de filtrage des offres initialisé avec succès!');
});

window.addEventListener('resize', function() {
    const offersList = document.getElementById('offers-list');
    if (offersList) {
        offersList.style.height = 'auto';
    }
});