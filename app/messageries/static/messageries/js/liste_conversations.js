// static/messageries/js/liste_conversations.js
(function() {
  // Configuration spécifique à la liste
  const CONFIG = {
    SEARCH_DEBOUNCE: 300,
    FILTER_ANIMATION_DURATION: 300,
    STATS_UPDATE_INTERVAL: 5000
  };

  // Éléments DOM de la liste
  const elements = {
    conversationRows: null,
    searchInput: null,
    statutFilter: null,
    dateSort: null,
    conversationsList: null,
    statsContainer: null,
    filterSummary: null,
    resetFiltersBtn: null
  };

  // États de la liste
  const state = {
    currentFilters: {
      statut: 'all',
      dateSort: 'date-desc',
      search: ''
    },
    visibleCount: 0,
    stats: {
      total: 0,
      en_attente: 0,
      acceptee: 0,
      refusee: 0
    }
  };

  // Initialisation de la liste
  function initListe() {
    cacheElementsListe();
    setupEventListenersListe();
    updateAllStats();
    applyAllFilters();
    setupAutoRefresh();
  }

  function cacheElementsListe() {
    elements.conversationRows = document.querySelectorAll('.conversation-row, .conversation-card');
    elements.searchInput = document.getElementById('search-conversations');
    elements.statutFilter = document.getElementById('statut-filter');
    elements.dateSort = document.getElementById('date-sort');
    elements.conversationsList = document.getElementById('conversationsList');
    elements.statsContainer = document.querySelector('.stats-container');
    elements.filterSummary = document.getElementById('filterSummary');
    elements.resetFiltersBtn = document.getElementById('resetFilters');
  }

  function setupEventListenersListe() {
    // Recherche
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', debounce(handleSearchInput, CONFIG.SEARCH_DEBOUNCE));
    }

    // Filtres
    if (elements.statutFilter) {
      elements.statutFilter.addEventListener('change', handleStatutFilterChange);
    }

    if (elements.dateSort) {
      elements.dateSort.addEventListener('change', handleDateSortChange);
    }

    // Réinitialisation
    if (elements.resetFiltersBtn) {
      elements.resetFiltersBtn.addEventListener('click', resetAllFilters);
    }

    // Raccourcis clavier
    document.addEventListener('keydown', handleKeyboardShortcutsListe);
  }

  function handleSearchInput(event) {
    state.currentFilters.search = event.target.value.toLowerCase().trim();
    applyAllFilters();
  }

  function handleStatutFilterChange(event) {
    state.currentFilters.statut = event.target.value;
    applyAllFilters();
    animateFilterChange(event.target);
  }

  function handleDateSortChange(event) {
    state.currentFilters.dateSort = event.target.value;
    applySortingListe();
    animateFilterChange(event.target);
  }

  function handleKeyboardShortcutsListe(event) {
    // Échap pour réinitialiser la recherche
    if (event.key === 'Escape' && elements.searchInput) {
      elements.searchInput.value = '';
      state.currentFilters.search = '';
      applyAllFilters();
    }

    // Ctrl+R pour réinitialiser tous les filtres
    if (event.ctrlKey && event.key === 'r') {
      event.preventDefault();
      resetAllFilters();
    }
  }

  function resetAllFilters() {
    if (elements.statutFilter) elements.statutFilter.value = 'all';
    if (elements.dateSort) elements.dateSort.value = 'date-desc';
    if (elements.searchInput) elements.searchInput.value = '';

    state.currentFilters = {
      statut: 'all',
      dateSort: 'date-desc',
      search: ''
    };

    applyAllFilters();
    showToast('Tous les filtres ont été réinitialisés', 'success');
  }

  function applyAllFilters() {
    let visibleItems = 0;
    const statutCounts = {
      en_attente: 0,
      acceptee: 0,
      refusee: 0
    };

    elements.conversationRows.forEach(row => {
      const matchesStatut = state.currentFilters.statut === 'all' ||
                          row.getAttribute('data-statut') === state.currentFilters.statut;

      const matchesSearch = state.currentFilters.search === '' ||
                         matchesSearchTerm(row, state.currentFilters.search);

      const shouldShow = matchesStatut && matchesSearch;

      if (shouldShow) {
        row.style.display = 'flex';
        row.style.opacity = '1';
        visibleItems++;

        // Comptage par statut
        const statut = row.getAttribute('data-statut');
        if (statutCounts[statut] !== undefined) {
          statutCounts[statut]++;
        }

        animateRowAppearance(row);
      } else {
        row.style.display = 'none';
      }
    });

    // Application du tri
    applySortingListe();

    // Mise à jour des statistiques
    updateStatsListe(visibleItems, statutCounts);

    // Mise à jour du résumé
    updateFilterSummary(visibleItems);

    // Gestion de l'état vide
    handleEmptyStateListe(visibleItems);
  }

  function matchesSearchTerm(row, searchTerm) {
    const user = row.getAttribute('data-user') || '';
    const offre = row.getAttribute('data-offre') || '';
    const statut = row.querySelector('.statut-badge')?.textContent.toLowerCase() || '';

    return user.includes(searchTerm) ||
           offre.includes(searchTerm) ||
           statut.includes(searchTerm);
  }

  function applySortingListe() {
    const visibleRows = Array.from(elements.conversationRows).filter(row =>
      row.style.display !== 'none'
    );

    if (visibleRows.length === 0) return;

    visibleRows.sort((a, b) => {
      const dateA = new Date(a.getAttribute('data-date'));
      const dateB = new Date(b.getAttribute('data-date'));

      switch(state.currentFilters.dateSort) {
        case 'date-desc':
          return dateB - dateA;
        case 'date-asc':
          return dateA - dateB;
        default:
          return 0;
      }
    });

    animateSortingListe(visibleRows);
  }

  function animateSortingListe(sortedRows) {
    if (!elements.conversationsList) return;

    // Masquer temporairement
    sortedRows.forEach(row => {
      row.style.opacity = '0';
      row.style.transform = 'translateX(-20px)';
    });

    // Réorganiser
    sortedRows.forEach(row => {
      elements.conversationsList.appendChild(row);
    });

    // Réafficher avec animation
    setTimeout(() => {
      sortedRows.forEach((row, index) => {
        setTimeout(() => {
          row.style.opacity = '1';
          row.style.transform = 'translateX(0)';
          row.style.transition = `opacity ${CONFIG.FILTER_ANIMATION_DURATION}ms ease, transform ${CONFIG.FILTER_ANIMATION_DURATION}ms ease`;
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
      row.style.transition = `opacity ${CONFIG.FILTER_ANIMATION_DURATION}ms ease, transform ${CONFIG.FILTER_ANIMATION_DURATION}ms ease`;
    }, 50);
  }

  function animateFilterChange(element) {
    element.style.transform = 'scale(1.02)';
    element.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';

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

    elements.conversationRows.forEach(row => {
      const statut = row.getAttribute('data-statut');
      if (statutCounts[statut] !== undefined) {
        statutCounts[statut]++;
      }
    });

    updateStatsListe(elements.conversationRows.length, statutCounts);
  }

  function updateStatsListe(totalCount, statutCounts = { en_attente: 0, acceptee: 0, refusee: 0 }) {
    // Animation des compteurs
    animateCounter(document.getElementById('total-conversations'), totalCount);
    animateCounter(document.getElementById('en-attente-count'), statutCounts.en_attente);
    animateCounter(document.getElementById('acceptee-count'), statutCounts.acceptee);
    animateCounter(document.getElementById('refusee-count'), statutCounts.refusee);

    // Stocker pour le rafraîchissement automatique
    state.stats = {
      total: totalCount,
      en_attente: statutCounts.en_attente,
      acceptee: statutCounts.acceptee,
      refusee: statutCounts.refusee
    };
  }

  function animateCounter(element, newValue) {
    if (!element) return;

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

  function updateFilterSummary(visibleCount) {
    state.visibleCount = visibleCount;

    const visibleCountElement = document.getElementById('visibleCount');
    if (visibleCountElement) {
      animateCounter(visibleCountElement, visibleCount);
    }

    // Afficher/masquer le résumé
    const hasActiveFilters = state.currentFilters.statut !== 'all' ||
                           state.currentFilters.dateSort !== 'date-desc' ||
                           state.currentFilters.search !== '';

    if (elements.filterSummary) {
      if (hasActiveFilters) {
        elements.filterSummary.style.display = 'block';
        animateFilterSummaryAppearance();
      } else {
        elements.filterSummary.style.display = 'none';
      }
    }
  }

  function animateFilterSummaryAppearance() {
    if (elements.filterSummary) {
      elements.filterSummary.style.opacity = '0';
      elements.filterSummary.style.transform = 'translateY(-10px)';

      setTimeout(() => {
        elements.filterSummary.style.opacity = '1';
        elements.filterSummary.style.transform = 'translateY(0)';
        elements.filterSummary.style.transition = `opacity ${CONFIG.FILTER_ANIMATION_DURATION}ms ease, transform ${CONFIG.FILTER_ANIMATION_DURATION}ms ease`;
      }, 100);
    }
  }

  function handleEmptyStateListe(visibleCount) {
    const emptyState = document.querySelector('.empty-state');
    const tableContainer = document.querySelector('.table-container');

    if (visibleCount === 0 && elements.conversationRows.length > 0) {
      if (!emptyState || !emptyState.classList.contains('filtered-empty-state')) {
        createFilteredEmptyState();
      }
      if (tableContainer) tableContainer.style.display = 'none';
      if (elements.filterSummary) elements.filterSummary.style.display = 'none';
    } else if (emptyState && emptyState.classList.contains('filtered-empty-state')) {
      emptyState.remove();
      if (tableContainer) tableContainer.style.display = 'block';
      if (elements.filterSummary && (state.currentFilters.statut !== 'all' || state.currentFilters.search !== '')) {
        elements.filterSummary.style.display = 'block';
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
      <h3>Aucune conversation trouvée</h3>
      <p>Aucune conversation ne correspond à vos critères de recherche.</p>
      <div class="empty-actions">
        <button id="clear-search-filters" class="btn btn-primary">
          <i class="fas fa-redo"></i>
          Effacer les filtres
        </button>
      </div>
    `;

    const container = document.querySelector('.container');
    const tableContainer = document.querySelector('.table-container');
    if (container && tableContainer) {
      container.insertBefore(emptyState, tableContainer);
    }

    // Animation
    emptyState.style.opacity = '0';
    emptyState.style.transform = 'translateY(20px)';

    // Gestionnaire d'événements
    document.getElementById('clear-search-filters')?.addEventListener('click', resetAllFilters);

    setTimeout(() => {
      emptyState.style.opacity = '1';
      emptyState.style.transform = 'translateY(0)';
      emptyState.style.transition = `opacity ${CONFIG.FILTER_ANIMATION_DURATION}ms ease, transform ${CONFIG.FILTER_ANIMATION_DURATION}ms ease`;
    }, 100);
  }

  function setupAutoRefresh() {
    // Rafraîchissement automatique des statistiques
    setInterval(() => {
      updateAllStats();
    }, CONFIG.STATS_UPDATE_INTERVAL);
  }

  // Utilities partagées
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

  function showToast(message, type = "info") {
    // Implémentation basique de toast
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  // Export des fonctions pour une utilisation externe
  window.listeConversationsManager = {
    resetAllFilters,
    applyAllFilters,
    updateStatsListe,
    getCurrentFilters: () => state.currentFilters
  };

  // Initialisation
  document.addEventListener("DOMContentLoaded", initListe);

})();