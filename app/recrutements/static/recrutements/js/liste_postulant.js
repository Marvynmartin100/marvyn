// static/recrutements/js/liste_postulant.js

// Configuration globale
const CONFIG = {
    debounceDelay: 300,
    itemsPerPage: 50,
    animationDuration: 500,
    resetAnimationDuration: 300
};

// État de l'application
const APP_STATE = {
    currentView: 'grid',
    currentPage: 1,
    totalPages: 1,
    allPostulants: [],
    filteredPostulants: [],
    filters: {
        search: '',
        genre: 'all',
        age: 'all',
        nationalite: 'all',
        province: 'all',
        arrondissement: 'all',
        tri: 'recent'
    }
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    initializePostulantsData();
});

function initializeApp() {
    console.log('🔄 Initialisation de l\'application...');
    initializePostulantsData();
    applyViewMode();
    updateResultsCount();
}

function initializePostulantsData() {
    const talentCards = document.querySelectorAll('.talent-card');

    APP_STATE.allPostulants = Array.from(talentCards).map(card => {
        return {
            element: card,
            data: {
                id: card.dataset.postulantId,
                age: parseInt(card.dataset.age) || 0,
                gender: card.dataset.gender,
                nationalite: card.dataset.nationalite,
                province: card.dataset.province,
                arrondissement: card.dataset.arrondissement,
                created: parseInt(card.dataset.created),
                name: card.dataset.name,
                bio: card.dataset.bio
            }
        };
    });

    APP_STATE.filteredPostulants = [...APP_STATE.allPostulants];
    APP_STATE.totalPages = Math.ceil(APP_STATE.filteredPostulants.length / CONFIG.itemsPerPage);

    const paginationContainer = document.querySelector('.pagination-container');
    if (paginationContainer) {
        paginationContainer.style.display = 'none';
    }

    console.log(`📊 ${APP_STATE.allPostulants.length} postulants chargés`);
}

function setupEventListeners() {
    console.log('🔧 Configuration des écouteurs d\'événements...');

    // Recherche globale
    const globalSearch = document.getElementById('global-search');
    const searchBtn = document.getElementById('search-button');

    if (globalSearch && searchBtn) {
        globalSearch.addEventListener('input', debounce(handleSearch, CONFIG.debounceDelay));
        globalSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
        searchBtn.addEventListener('click', handleSearch);
    }

    // Filtres avec application automatique
    const setupFilterListener = (id, filterKey) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', (e) => {
                console.log(`🔄 Filtre ${filterKey} changé:`, e.target.value);
                APP_STATE.filters[filterKey] = e.target.value;
                applyAllFilters();
            });
        }
    };

    setupFilterListener('filter-gender', 'genre');
    setupFilterListener('filter-age', 'age');
    setupFilterListener('filter-nationality', 'nationalite');
    setupFilterListener('filter-province', 'province');
    setupFilterListener('filter-arrondissement', 'arrondissement');

    // TRI DYNAMIQUE - application immédiate
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            console.log('🔄 Tri changé:', e.target.value);
            APP_STATE.filters.tri = e.target.value;

            // Appliquer le tri directement sur les résultats filtrés actuels
            applySorting();
            updateUI();
            updateURL();

            showNotification(`Tri appliqué: ${getSortLabel(e.target.value)}`, 'success');
        });
        console.log('✅ Écouteur de tri dynamique configuré');
    }

    // Options de vue
    document.querySelectorAll('.view-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            switchView(view);
        });
    });

    // Bouton Réinitialiser avec animation réduite
    const resetButtons = [
        document.getElementById('reset-filters'),
        document.getElementById('reset-all-filters'),
        document.getElementById('reset-filters-btn')
    ];

    resetButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', resetAllFilters);
        }
    });

    // Pagination
    setupPaginationListeners();
    setupImageErrorHandling();

    console.log('✅ Tous les écouteurs configurés avec succès');
}

function getSortLabel(sortValue) {
    const labels = {
        'recent': 'Plus récents',
        'name-asc': 'Nom A-Z',
        'name-desc': 'Nom Z-A',
        'age-asc': 'Âge croissant',
        'age-desc': 'Âge décroissant'
    };
    return labels[sortValue] || sortValue;
}

function handleSearch() {
    const searchTerm = document.getElementById('global-search').value.toLowerCase().trim();
    console.log('🔍 Recherche:', searchTerm);
    APP_STATE.filters.search = searchTerm;
    applyAllFilters();
}

function applyAllFilters() {
    console.log('🎯 Application de tous les filtres et du tri...', APP_STATE.filters);

    // Appliquer les filtres
    applyFilters();

    // Appliquer le tri sur les résultats filtrés
    applySorting();

    // Mettre à jour l'interface
    updateUI();
    updateURL();
}

function applyFilters() {
    console.log('🔍 Application des filtres...', APP_STATE.filters);

    let filtered = APP_STATE.allPostulants.filter(postulant => {
        const data = postulant.data;

        // Filtre de recherche
        if (APP_STATE.filters.search) {
            const searchFields = [
                data.name,
                data.bio,
                data.province,
                data.arrondissement
            ].join(' ').toLowerCase();

            if (!searchFields.includes(APP_STATE.filters.search)) {
                return false;
            }
        }

        // Filtre genre
        if (APP_STATE.filters.genre !== 'all' && data.gender !== APP_STATE.filters.genre) {
            return false;
        }

        // Filtre âge
        if (APP_STATE.filters.age !== 'all') {
            const age = data.age;
            switch (APP_STATE.filters.age) {
                case '18-25':
                    if (age < 18 || age > 25) return false;
                    break;
                case '26-35':
                    if (age < 26 || age > 35) return false;
                    break;
                case '36-45':
                    if (age < 36 || age > 45) return false;
                    break;
                case '46-55':
                    if (age < 46 || age > 55) return false;
                    break;
                case '55+':
                    if (age < 55) return false;
                    break;
            }
        }

        // Filtre nationalité
        if (APP_STATE.filters.nationalite !== 'all' &&
            data.nationalite !== APP_STATE.filters.nationalite) {
            return false;
        }

        // Filtre province
        if (APP_STATE.filters.province !== 'all' && data.province !== APP_STATE.filters.province) {
            return false;
        }

        // Filtre arrondissement
        if (APP_STATE.filters.arrondissement !== 'all' &&
            data.arrondissement !== APP_STATE.filters.arrondissement) {
            return false;
        }

        return true;
    });

    console.log(`📊 Filtrage: ${APP_STATE.allPostulants.length} → ${filtered.length} résultats`);
    APP_STATE.filteredPostulants = filtered;
    APP_STATE.currentPage = 1;
    APP_STATE.totalPages = Math.ceil(filtered.length / CONFIG.itemsPerPage);
}

function applySorting() {
    console.log('📊 Application du tri...', APP_STATE.filters.tri);
    console.log(`📋 Éléments à trier: ${APP_STATE.filteredPostulants.length}`);

    if (APP_STATE.filteredPostulants.length === 0) {
        console.log('ℹ️ Aucun élément à trier');
        return;
    }

    // Animation de tri
    animateSortTransition();

    APP_STATE.filteredPostulants.sort((a, b) => {
        const dataA = a.data;
        const dataB = b.data;

        let result;
        switch (APP_STATE.filters.tri) {
            case 'recent':
                result = dataB.created - dataA.created;
                break;
            case 'name-asc':
                result = dataA.name.localeCompare(dataB.name, 'fr', { sensitivity: 'base' });
                break;
            case 'name-desc':
                result = dataB.name.localeCompare(dataA.name, 'fr', { sensitivity: 'base' });
                break;
            case 'age-asc':
                result = dataA.age - dataB.age;
                break;
            case 'age-desc':
                result = dataB.age - dataA.age;
                break;
            default:
                result = 0;
        }
        return result;
    });

    // Afficher les premiers résultats pour vérifier le tri
    const firstThree = APP_STATE.filteredPostulants.slice(0, 3).map(p => p.data.name);
    console.log('✅ Tri appliqué. Premiers éléments:', firstThree);
}

function updateUI() {
    updateResultsCount();
    renderPostulants();
    updatePagination();
    updateEmptyState();
    animateResults();
}

function updateResultsCount() {
    const countElement = document.querySelector('.results-count');
    const count = APP_STATE.filteredPostulants.length;

    if (countElement) {
        countElement.textContent = `(${count} résultat${count !== 1 ? 's' : ''})`;
    }

    const statNumber = document.querySelector('.stat-number');
    if (statNumber) {
        animateCounter(statNumber, parseInt(statNumber.textContent), count);
    }
}

function renderPostulants() {
    const container = document.getElementById('postulants-container');
    if (!container) return;

    console.log(`🎨 Rendu de ${APP_STATE.filteredPostulants.length} postulants`);

    // VIDER le conteneur avant de réinsérer les éléments dans le nouvel ordre
    container.innerHTML = '';

    // Afficher les éléments selon la pagination
    const startIndex = (APP_STATE.currentPage - 1) * CONFIG.itemsPerPage;
    const endIndex = startIndex + CONFIG.itemsPerPage;
    const postulantsToShow = APP_STATE.filteredPostulants.slice(startIndex, endIndex);

    console.log(`📄 Page ${APP_STATE.currentPage}: ${startIndex}-${endIndex} (${postulantsToShow.length} éléments)`);

    // RÉINSÉRER les éléments dans le nouvel ordre
    postulantsToShow.forEach((postulant, index) => {
        container.appendChild(postulant.element);
        postulant.element.style.display = 'block';
        postulant.element.style.animationDelay = `${index * 0.05}s`;
    });

    applyViewMode();
}

function switchView(view) {
    if (APP_STATE.currentView === view) return;

    APP_STATE.currentView = view;

    document.querySelectorAll('.view-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    applyViewMode();
    animateViewTransition();
}

function applyViewMode() {
    const container = document.getElementById('postulants-container');
    if (!container) return;

    const isListView = APP_STATE.currentView === 'list';

    if (isListView) {
        container.classList.add('list-view');
        container.classList.remove('postulants-grid');
        container.classList.add('postulants-list');
    } else {
        container.classList.remove('list-view');
        container.classList.remove('postulants-list');
        container.classList.add('postulants-grid');
    }
}

function updateEmptyState() {
    const emptyState = document.querySelector('.empty-state');
    const hasResults = APP_STATE.filteredPostulants.length > 0;

    if (emptyState) {
        emptyState.style.display = hasResults ? 'none' : 'flex';
    }
}

// PAGINATION
function setupPaginationListeners() {
    const paginationContainer = document.querySelector('.pagination-container');
    if (!paginationContainer) return;

    paginationContainer.addEventListener('click', (e) => {
        const paginationBtn = e.target.closest('.pagination-btn');
        if (!paginationBtn || paginationBtn.classList.contains('active')) return;

        if (paginationBtn.dataset.page) {
            goToPage(parseInt(paginationBtn.dataset.page));
        } else if (paginationBtn.querySelector('.fa-chevron-left')) {
            goToPage(APP_STATE.currentPage - 1);
        } else if (paginationBtn.querySelector('.fa-chevron-right')) {
            goToPage(APP_STATE.currentPage + 1);
        }
    });
}

function goToPage(page) {
    if (page < 1 || page > APP_STATE.totalPages) return;

    APP_STATE.currentPage = page;
    renderPostulants();
    updatePagination();
    scrollToTop();
}

function updatePagination() {
    const paginationContainer = document.querySelector('.pagination-container');
    if (!paginationContainer) return;

    if (APP_STATE.totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'block';

    const paginationBtns = document.querySelectorAll('.pagination-btn');
    paginationBtns.forEach(btn => {
        if (btn.dataset.page) {
            const pageNum = parseInt(btn.dataset.page);
            btn.classList.toggle('active', pageNum === APP_STATE.currentPage);
        }
    });
}

function resetAllFilters() {
    console.log('🔄 Réinitialisation de tous les filtres et du tri...');

    const resetBtn = document.getElementById('reset-filters') ||
                     document.getElementById('reset-all-filters') ||
                     document.getElementById('reset-filters-btn');

    if (resetBtn) {
        const originalHTML = resetBtn.innerHTML;
        resetBtn.classList.add('loading');
        resetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>Réinitialisation...';
        resetBtn.disabled = true;

        // Animation réduite à 300ms seulement
        setTimeout(() => {
            // Réinitialiser les valeurs des filtres
            APP_STATE.filters = {
                search: '',
                genre: 'all',
                age: 'all',
                nationalite: 'all',
                province: 'all',
                arrondissement: 'all',
                tri: 'recent'
            };

            // Réinitialiser tous les inputs
            document.getElementById('global-search').value = '';
            document.getElementById('filter-gender').value = 'all';
            document.getElementById('filter-age').value = 'all';
            document.getElementById('filter-nationality').value = 'all';
            document.getElementById('filter-province').value = 'all';
            document.getElementById('filter-arrondissement').value = 'all';
            document.getElementById('sort-by').value = 'recent';

            // Réappliquer tous les filtres
            applyAllFilters();

            // Remettre le bouton à son état normal IMMÉDIATEMENT
            resetBtn.classList.remove('loading');
            resetBtn.disabled = false;
            resetBtn.innerHTML = originalHTML;

            showNotification('Tous les filtres et le tri ont été réinitialisés', 'info');
        }, 300); // Seulement 300ms au total
    } else {
        // Si pas de bouton trouvé, appliquer quand même la réinitialisation
        APP_STATE.filters = {
            search: '',
            genre: 'all',
            age: 'all',
            nationalite: 'all',
            province: 'all',
            arrondissement: 'all',
            tri: 'recent'
        };

        document.getElementById('global-search').value = '';
        document.getElementById('filter-gender').value = 'all';
        document.getElementById('filter-age').value = 'all';
        document.getElementById('filter-nationality').value = 'all';
        document.getElementById('filter-province').value = 'all';
        document.getElementById('filter-arrondissement').value = 'all';
        document.getElementById('sort-by').value = 'recent';

        applyAllFilters();
        showNotification('Tous les filtres et le tri ont été réinitialisés', 'info');
    }
}

// ANIMATIONS
function animateResults() {
    const cards = document.querySelectorAll('.talent-card[style*="display: block"]');

    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.05}s`;
        card.classList.add('animate-in');
    });
}

function animateViewTransition() {
    const container = document.getElementById('postulants-container');
    container?.classList.add('view-transition');

    setTimeout(() => {
        container?.classList.remove('view-transition');
    }, CONFIG.animationDuration);
}

function animateSortTransition() {
    const container = document.getElementById('postulants-container');
    if (container) {
        container.style.opacity = '0.7';
        container.style.transition = 'opacity 0.2s ease';

        setTimeout(() => {
            container.style.opacity = '1';
        }, 200);
    }
}

function animateCounter(element, from, to) {
    const duration = 800;
    const startTime = performance.now();

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(from + (to - from) * easeOutQuart);

        element.textContent = currentValue;

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = to;
        }
    }

    requestAnimationFrame(updateCounter);
}

// UTILITAIRES
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

function scrollToTop() {
    const scrollContainer = document.querySelector('.postulants-scroll-container');
    if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function updateURL() {
    const params = new URLSearchParams();

    Object.entries(APP_STATE.filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
            params.set(key, value);
        }
    });

    const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
}

function setupImageErrorHandling() {
    document.addEventListener('error', (e) => {
        if (e.target.tagName === 'IMG' && e.target.classList.contains('profile-avatar')) {
            e.target.style.display = 'none';
            const placeholder = e.target.nextElementSibling;
            if (placeholder && placeholder.classList.contains('avatar-placeholder')) {
                placeholder.style.display = 'flex';
            }
        }
    }, true);
}

// NOTIFICATIONS
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        border-left: 4px solid #3b82f6;
        transform: translateX(400px);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1000;
        max-width: 400px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    `;

    if (type === 'success') {
        notification.style.borderLeftColor = '#10b981';
    } else if (type === 'error') {
        notification.style.borderLeftColor = '#ef4444';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    const autoCloseTimeout = setTimeout(() => {
        hideNotification(notification);
    }, 3000);

    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(autoCloseTimeout);
        hideNotification(notification);
    });
}

function hideNotification(notification) {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Fonction de débogage pour tester le tri
function testTri() {
    console.log('🧪 TEST du tri manuel...');
    APP_STATE.filters.tri = 'name-asc';
    applyAllFilters();
}

// Exposer la fonction de test globalement
window.testTri = testTri;

console.log('🚀 JavaScript des postulants initialisé avec succès!');
console.log('💡 Pour tester le tri, tapez testTri() dans la console');