// static/messageries/js/liste_conversations_employeur.js
(function() {
  // Configuration spécifique à la liste des conversations employeur
  const CONFIG = {
    SEARCH_DEBOUNCE: 300,
    FILTER_ANIMATION_DURATION: 300,
    STATS_UPDATE_INTERVAL: 30000, // 30 secondes
    MODAL_ANIMATION_DURATION: 200
  };

  // Éléments DOM de la liste
  const elements = {
    conversationCards: null,
    searchInput: null,
    sortSelect: null,
    conversationsList: null,
    statsOverview: null,
    filterSummary: null,
    resetFiltersBtn: null
  };

  // États de la liste
  const state = {
    currentFilters: {
      sort: 'recent',
      search: ''
    },
    visibleCount: 0,
    favorites: new Set(),
    currentStats: {
      totalUnread: 0,
      visibleCount: 0,
      totalConversations: 0
    }
  };

  // Initialisation de la liste
  function initListe() {
    cacheElementsListe();
    setupEventListenersListe();
    loadUserPreferences();
    calculateInitialStats();
    applyAllFilters();
    setupAutoRefresh();
  }

  function cacheElementsListe() {
    elements.conversationCards = document.querySelectorAll('.conversation-card');
    elements.searchInput = document.getElementById('searchConversations');
    elements.sortSelect = document.getElementById('sortConversations');
    elements.conversationsList = document.getElementById('conversationsList');
    elements.statsOverview = document.querySelector('.stats-overview');
    elements.filterSummary = document.getElementById('filterSummary');
    elements.resetFiltersBtn = document.getElementById('resetFilters');
  }

  function setupEventListenersListe() {
    // Recherche
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', debounce(handleSearchInput, CONFIG.SEARCH_DEBOUNCE));
      elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
      });
    }

    // Recherche par bouton
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', handleSearch);
    }

    // Tri
    if (elements.sortSelect) {
      elements.sortSelect.addEventListener('change', handleSortChange);
    }

    // Réinitialisation
    if (elements.resetFiltersBtn) {
      elements.resetFiltersBtn.addEventListener('click', resetAllFilters);
    }

    // Boutons d'actions
    setupActionButtons();

    // Raccourcis clavier
    document.addEventListener('keydown', handleKeyboardShortcutsListe);
  }

  function setupActionButtons() {
    // Boutons favoris
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', handleFavoriteClick);
    });
  }

  function calculateInitialStats() {
    let totalUnread = 0;

    elements.conversationCards.forEach(card => {
      const unreadCount = parseInt(card.getAttribute('data-unread') || '0');
      totalUnread += unreadCount;
    });

    state.currentStats = {
      totalUnread: totalUnread,
      visibleCount: elements.conversationCards.length,
      totalConversations: elements.conversationCards.length
    };
  }

  function handleSearchInput(event) {
    state.currentFilters.search = event.target.value.toLowerCase().trim();
    applyAllFilters();
  }

  function handleSearch() {
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    state.currentFilters.search = searchTerm;
    applyAllFilters();
  }

  function handleSortChange(event) {
    state.currentFilters.sort = event.target.value;
    applySortingListe();
    animateFilterChange(event.target);
  }

  function handleFavoriteClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const convId = this.getAttribute('data-conv-id');
    const icon = this.querySelector('i');

    if (state.favorites.has(convId)) {
      state.favorites.delete(convId);
      icon.className = 'far fa-star';
      showToast('Conversation retirée des favoris', 'info');
    } else {
      state.favorites.add(convId);
      icon.className = 'fas fa-star';
      showToast('Conversation ajoutée aux favoris', 'success');
    }

    saveUserPreferences();
  }

  function handleKeyboardShortcutsListe(event) {
    // Échap pour réinitialiser la recherche
    if (event.key === 'Escape') {
      if (elements.searchInput && elements.searchInput.value) {
        elements.searchInput.value = '';
        state.currentFilters.search = '';
        applyAllFilters();
      }
    }

    // Ctrl+F pour focus la recherche
    if (event.ctrlKey && event.key === 'f') {
      event.preventDefault();
      if (elements.searchInput) {
        elements.searchInput.focus();
      }
    }
  }

  function resetAllFilters() {
    if (elements.sortSelect) elements.sortSelect.value = 'recent';
    if (elements.searchInput) elements.searchInput.value = '';

    state.currentFilters = {
      sort: 'recent',
      search: ''
    };

    applyAllFilters();
    showToast('Tous les filtres ont été réinitialisés', 'success');
  }

  function applyAllFilters() {
    let visibleItems = 0;
    let totalUnread = 0;

    elements.conversationCards.forEach(card => {
      const matchesSearch = state.currentFilters.search === '' ||
                         matchesSearchTerm(card, state.currentFilters.search);

      const shouldShow = matchesSearch;

      if (shouldShow) {
        card.style.display = 'flex';
        visibleItems++;

        // Compter les messages non lus
        const unreadCount = parseInt(card.getAttribute('data-unread') || '0');
        totalUnread += unreadCount;

        animateCardAppearance(card);
      } else {
        card.style.display = 'none';
      }
    });

    // Mettre à jour les stats courantes
    state.currentStats.visibleCount = visibleItems;
    state.currentStats.totalUnread = totalUnread;

    // Application du tri
    applySortingListe();

    // Mise à jour des statistiques
    updateStatsListe(visibleItems, totalUnread);

    // Mise à jour du résumé
    updateFilterSummary(visibleItems);

    // Gestion de l'état vide
    handleEmptyStateListe(visibleItems);
  }

  function matchesSearchTerm(card, searchTerm) {
    const user = card.getAttribute('data-user') || '';
    const lastMessage = card.querySelector('.message-content')?.textContent.toLowerCase() || '';
    const username = card.querySelector('.username')?.textContent.toLowerCase() || '';

    return user.includes(searchTerm) ||
           lastMessage.includes(searchTerm) ||
           username.includes(searchTerm);
  }

  function applySortingListe() {
    const visibleCards = Array.from(elements.conversationCards).filter(card =>
      card.style.display !== 'none'
    );

    if (visibleCards.length === 0) return;

    visibleCards.sort((a, b) => {
      const dateA = new Date(a.getAttribute('data-last-activity'));
      const dateB = new Date(b.getAttribute('data-last-activity'));
      const unreadA = parseInt(a.getAttribute('data-unread') || '0');
      const unreadB = parseInt(b.getAttribute('data-unread') || '0');
      const userA = a.getAttribute('data-user') || '';
      const userB = b.getAttribute('data-user') || '';

      switch(state.currentFilters.sort) {
        case 'recent':
          return dateB - dateA;
        case 'ancien':
          return dateA - dateB;
        case 'unread':
          if (unreadB !== unreadA) return unreadB - unreadA;
          return dateB - dateA;
        case 'read':
          if (unreadA !== unreadB) return unreadA - unreadB;
          return dateB - dateA;
        default:
          return dateB - dateA;
      }
    });

    animateSortingListe(visibleCards);
  }

  function animateSortingListe(sortedCards) {
    if (!elements.conversationsList) return;

    // Masquer temporairement
    sortedCards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateX(-20px)';
    });

    // Réorganiser
    sortedCards.forEach(card => {
      elements.conversationsList.appendChild(card);
    });

    // Réafficher avec animation
    setTimeout(() => {
      sortedCards.forEach((card, index) => {
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateX(0)';
          card.style.transition = `opacity ${CONFIG.FILTER_ANIMATION_DURATION}ms ease, transform ${CONFIG.FILTER_ANIMATION_DURATION}ms ease`;
        }, index * 50);
      });
    }, 100);
  }

  function animateCardAppearance(card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(10px)';

    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
      card.style.transition = `opacity ${CONFIG.FILTER_ANIMATION_DURATION}ms ease, transform ${CONFIG.FILTER_ANIMATION_DURATION}ms ease`;
    }, 50);
  }

  function animateFilterChange(element) {
    element.style.transform = 'scale(1.02)';
    element.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';

    setTimeout(() => {
      element.style.transform = 'scale(1)';
      element.style.boxShadow = '';
    }, 300);
  }

  function updateStatsListe(visibleCount, totalUnread) {
    // Mise à jour des compteurs avec animation - seulement si les valeurs changent
    const activeConversationsElement = document.getElementById('active-conversations');
    const totalUnreadElement = document.getElementById('total-unread');
    const candidatesCountElement = document.getElementById('candidates-count');

    if (activeConversationsElement && parseInt(activeConversationsElement.textContent) !== visibleCount) {
      animateCounter(activeConversationsElement, visibleCount);
    }

    if (totalUnreadElement && parseInt(totalUnreadElement.textContent) !== totalUnread) {
      animateCounter(totalUnreadElement, totalUnread);
    }

    if (candidatesCountElement && parseInt(candidatesCountElement.textContent) !== visibleCount) {
      animateCounter(candidatesCountElement, visibleCount);
    }

    // Mise à jour du header
    const unreadCountElement = document.getElementById('unread-count');
    if (unreadCountElement && parseInt(unreadCountElement.textContent) !== totalUnread) {
      animateCounter(unreadCountElement, totalUnread);
    }

    // Mise à jour du compteur total (ne change pas avec les filtres)
    const totalConversationsElement = document.querySelector('.conversation-stats .stat:first-child');
    if (totalConversationsElement) {
      const totalCount = elements.conversationCards.length;
      // Ne mettre à jour que si le contenu est différent
      const currentText = totalConversationsElement.textContent.trim();
      const expectedText = `${totalCount} conversation${totalCount !== 1 ? 's' : ''}`;

      if (!currentText.includes(expectedText)) {
        totalConversationsElement.innerHTML = `<i class="fas fa-comments"></i> ${totalCount} conversation${totalCount !== 1 ? 's' : ''}`;
      }
    }
  }

  function animateCounter(element, newValue) {
    if (!element) return;

    const oldValue = parseInt(element.textContent) || 0;

    // Si la valeur est la même, ne pas animer
    if (oldValue === newValue) return;

    element.style.transform = 'scale(1.2)';
    element.style.color = '#3b82f6';

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
      // Mettre à jour seulement si la valeur change
      if (parseInt(visibleCountElement.textContent) !== visibleCount) {
        visibleCountElement.textContent = visibleCount;
      }
    }

    // Afficher/masquer le résumé selon les filtres actifs
    const hasActiveFilters = state.currentFilters.sort !== 'recent' ||
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
    const conversationsContainer = document.querySelector('.conversations-container');

    if (visibleCount === 0 && elements.conversationCards.length > 0) {
      if (!emptyState || !emptyState.classList.contains('filtered-empty-state')) {
        createFilteredEmptyState();
      }
    } else if (emptyState && emptyState.classList.contains('filtered-empty-state')) {
      emptyState.remove();
    }
  }

  function createFilteredEmptyState() {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state filtered-empty-state';
    emptyState.innerHTML = `
      <div class="empty-icon">
        <i class="fas fa-search"></i>
      </div>
      <h2 class="empty-title">Aucune conversation trouvée</h2>
      <p class="empty-message">Aucune conversation ne correspond à vos critères de recherche.</p>
      <div class="empty-actions">
        <button id="clear-search-filters" class="cta-button primary">
          <i class="fas fa-redo"></i>
          Effacer les filtres
        </button>
      </div>
    `;

    const container = document.querySelector('.container');
    const mainElement = document.querySelector('main');
    if (container && mainElement) {
      container.insertBefore(emptyState, mainElement);
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

  function loadUserPreferences() {
    // Charger les préférences depuis le localStorage
    const savedFavorites = localStorage.getItem('employeur_conversations_favorites');

    if (savedFavorites) {
      state.favorites = new Set(JSON.parse(savedFavorites));
    }

    // Mettre à jour l'UI avec les préférences chargées
    updateUIWithPreferences();
  }

  function saveUserPreferences() {
    // Sauvegarder les préférences dans le localStorage
    localStorage.setItem('employeur_conversations_favorites', JSON.stringify([...state.favorites]));
  }

  function updateUIWithPreferences() {
    // Mettre à jour les icônes des favoris
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      const convId = btn.getAttribute('data-conv-id');
      const icon = btn.querySelector('i');

      if (state.favorites.has(convId)) {
        icon.className = 'fas fa-star';
      } else {
        icon.className = 'far fa-star';
      }
    });
  }

  function setupAutoRefresh() {
    // Rafraîchissement automatique des statistiques - MAINTIENT les valeurs actuelles
    setInterval(() => {
      if (elements.conversationCards.length > 0) {
        // Ne pas remettre à zéro, mais recalculer si nécessaire
        recalculateStatsIfNeeded();
      }
    }, CONFIG.STATS_UPDATE_INTERVAL);
  }

  function recalculateStatsIfNeeded() {
    // Cette fonction peut être utilisée pour recalculer les stats
    // si vous avez des mises à jour en temps réel
    // Pour l'instant, on garde les stats existantes
    updateStatsListe(state.currentStats.visibleCount, state.currentStats.totalUnread);
  }

  // Utilities
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
    // Créer un conteneur de toast s'il n'existe pas
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-${getToastIcon(type)}"></i>
        <span>${message}</span>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    toast.style.cssText = `
      background: ${getToastColor(type)};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      min-width: 300px;
      transform: translateX(400px);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    toastContainer.appendChild(toast);

    // Animation d'entrée
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);

    // Fermeture automatique
    const autoCloseTimeout = setTimeout(() => {
      toast.style.transform = 'translateX(400px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 4000);

    // Fermeture manuelle
    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(autoCloseTimeout);
      toast.style.transform = 'translateX(400px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    });
  }

  function getToastIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  function getToastColor(type) {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    return colors[type] || '#3b82f6';
  }

  // Export des fonctions pour une utilisation externe
  window.employeurConversationsManager = {
    resetAllFilters,
    applyAllFilters,
    getCurrentFilters: () => state.currentFilters,
    getFavorites: () => [...state.favorites],
    // Fonction pour forcer une mise à jour manuelle des stats si nécessaire
    refreshStats: () => {
      calculateInitialStats();
      updateStatsListe(state.currentStats.visibleCount, state.currentStats.totalUnread);
    },
    // Fonction pour mettre à jour les stats après une action (comme lire un message)
    updateUnreadCount: (conversationId, newUnreadCount) => {
      const card = document.querySelector(`.conversation-card[data-conversation-id="${conversationId}"]`);
      if (card) {
        card.setAttribute('data-unread', newUnreadCount);
        const unreadBadge = card.querySelector('.unread-badge');
        if (unreadBadge) {
          if (newUnreadCount > 0) {
            unreadBadge.innerHTML = `<i class="fas fa-envelope"></i> ${newUnreadCount}`;
            unreadBadge.style.display = 'inline-flex';
          } else {
            unreadBadge.style.display = 'none';
          }
        }

        // Recalculer les stats
        calculateInitialStats();
        applyAllFilters();
      }
    }
  };

  // Initialisation
  document.addEventListener("DOMContentLoaded", initListe);

})();