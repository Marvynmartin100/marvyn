// static/messageries/js/conversation_detail.js
(function() {
  // Configuration améliorée
  const CONFIG = {
    RECONNECT_DELAY: 3000,
    MAX_RECONNECT_ATTEMPTS: 5,
    TYPING_TIMEOUT: 1500,
    MESSAGE_DEBOUNCE: 500,
    AUTO_SCROLL_DELAY: 100,
    NOTIFICATION_TIMEOUT: 4000,
    MESSAGE_BATCH_SIZE: 50
  };

  const conversationId = "{{ conversation.id }}";
  const userId = "{{ request.user.id }}";
  const username = "{{ request.user.username }}";
  const loc = window.location;
  const wsProtocol = (loc.protocol === "https:") ? "wss" : "ws";
  const wsUrl = `${wsProtocol}://${loc.host}/ws/conversation/${conversationId}/`;

  let socket = null;
  let reconnectAttempts = 0;
  let isTyping = false;
  let typingTimeout = null;
  let lastMessageTime = 0;
  let messageBatch = [];
  let isAtBottom = true;

  // Éléments DOM améliorés
  const elements = {
    zoneMessages: null,
    formEnvoi: null,
    textareaContenu: null,
    loadingOverlay: null,
    typingIndicator: null,
    errorBanner: null,
    conversationHeader: null,
    messagesContainer: null,
    scrollIndicator: null,
    attachmentPreview: null,
    emojiPicker: null
  };

  // États de l'application améliorés
  const state = {
    isConnected: false,
    isSubmitting: false,
    reconnectTimer: null,
    isScrolling: false,
    unreadCount: 0,
    onlineUsers: new Set(),
    messageHistory: []
  };

  // Initialisation améliorée
  function initDetail() {
    cacheElementsDetail();
    createUIElementsDetail();
    setupEventListenersDetail();
    initScrollHandler();
    loadMessageHistory();
    connect();
  }

  function cacheElementsDetail() {
    elements.zoneMessages = document.getElementById("zone-messages");
    elements.formEnvoi = document.getElementById("form-envoi-message");
    elements.textareaContenu = document.querySelector("textarea[name='contenu']");
    elements.loadingOverlay = document.getElementById("loadingOverlay");
    elements.conversationHeader = document.querySelector(".conversation-header");
    elements.messagesContainer = document.querySelector(".messages-container");
  }

  function createUIElementsDetail() {
    createTypingIndicator();
    createErrorBanner();
    createScrollIndicator();
    createAttachmentPreview();
    createToastContainer();
    createConnectionStatus();
  }

  function createTypingIndicator() {
    elements.typingIndicator = document.createElement('div');
    elements.typingIndicator.className = 'typing-indicator hidden';
    elements.typingIndicator.innerHTML = `
      <div class="typing-avatar">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <div class="typing-content">
        <span class="typing-text">Quelqu'un est en train d'écrire...</span>
        <span class="typing-users"></span>
      </div>
    `;

    if (elements.messagesContainer) {
      elements.messagesContainer.appendChild(elements.typingIndicator);
    }
  }

  function createErrorBanner() {
    elements.errorBanner = document.createElement('div');
    elements.errorBanner.className = 'error-banner hidden';
    elements.errorBanner.innerHTML = `
      <div class="error-content">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="error-details">
          <span class="error-title">Problème de connexion</span>
          <span class="error-message"></span>
        </div>
        <div class="error-actions">
          <button class="btn btn-secondary btn-sm error-retry" onclick="retryConnection()">
            <i class="fas fa-redo"></i>
            Réessayer
          </button>
          <button class="btn btn-outline btn-sm error-close" onclick="hideError()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `;

    document.body.insertBefore(elements.errorBanner, document.body.firstChild);
  }

  function createScrollIndicator() {
    elements.scrollIndicator = document.createElement('div');
    elements.scrollIndicator.className = 'scroll-indicator hidden';
    elements.scrollIndicator.innerHTML = `
      <button class="btn btn-primary btn-sm scroll-to-bottom" onclick="scrollToBottom(true)">
        <i class="fas fa-arrow-down"></i>
        Nouveaux messages
      </button>
    `;

    if (elements.messagesContainer) {
      elements.messagesContainer.appendChild(elements.scrollIndicator);
    }
  }

  function createAttachmentPreview() {
    elements.attachmentPreview = document.createElement('div');
    elements.attachmentPreview.className = 'attachment-preview hidden';
    elements.attachmentPreview.innerHTML = `
      <div class="attachment-header">
        <span>Fichier joint</span>
        <button class="btn btn-outline btn-sm remove-attachment" onclick="removeAttachment()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="attachment-content"></div>
    `;

    if (elements.formEnvoi) {
      elements.formEnvoi.insertBefore(elements.attachmentPreview, elements.formEnvoi.querySelector('button[type="submit"]'));
    }
  }

  function createToastContainer() {
    if (!document.getElementById('toastContainer')) {
      const toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  }

  function createConnectionStatus() {
    const statusElement = document.createElement('div');
    statusElement.id = 'connection-status';
    statusElement.className = 'connection-status';
    statusElement.innerHTML = `
      <div class="status-indicator"></div>
      <span class="status-text">Connexion...</span>
    `;

    if (elements.conversationHeader) {
      elements.conversationHeader.appendChild(statusElement);
    }
  }

  function setupEventListenersDetail() {
    // Gestion de la soumission du formulaire
    if (elements.formEnvoi) {
      elements.formEnvoi.addEventListener("submit", handleSubmit);
    }

    // Gestion du typing indicator
    if (elements.textareaContenu) {
      elements.textareaContenu.addEventListener('input', debounce(handleTyping, 300));
      elements.textareaContenu.addEventListener('keydown', handleKeyDown);
      elements.textareaContenu.addEventListener('focus', handleTextareaFocus);
      elements.textareaContenu.addEventListener('blur', handleTextareaBlur);
    }

    // Gestion des fichiers
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.addEventListener('change', handleFileSelect);
    }

    // Gestion de la visibilité de la page
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Gestion avant déchargement de la page
    window.addEventListener('beforeunload', cleanup);

    // Gestion du scroll
    if (elements.zoneMessages) {
      elements.zoneMessages.addEventListener('scroll', handleScroll);
    }

    // Gestion du resize
    window.addEventListener('resize', debounce(handleResize, 250));
  }

  function initScrollHandler() {
    if (elements.zoneMessages) {
      // Scroll initial en bas
      setTimeout(() => scrollToBottom(true), 100);
    }
  }

  function loadMessageHistory() {
    // Charger l'historique des messages existants
    const existingMessages = document.querySelectorAll('.message');
    state.messageHistory = Array.from(existingMessages).map(msg => ({
      id: msg.dataset.messageId,
      timestamp: msg.dataset.timestamp
    }));
  }

  // WebSocket Management amélioré
  function connect() {
    if (state.reconnectTimer) {
      clearTimeout(state.reconnectTimer);
      state.reconnectTimer = null;
    }

    showLoading(true);
    updateConnectionStatus('connecting');

    try {
      socket = new WebSocket(wsUrl);
      setupSocketHandlers();
    } catch (error) {
      console.error("Erreur création WebSocket:", error);
      handleConnectionError("Impossible de se connecter au serveur");
      showLoading(false);
    }
  }

  function setupSocketHandlers() {
    socket.onopen = function() {
      console.log("✅ WebSocket connecté");
      state.isConnected = true;
      reconnectAttempts = 0;
      hideError();
      showLoading(false);
      updateConnectionStatus('connected');
      showToast("Connecté à la conversation", "success");

      // Envoyer un événement de présence
      sendPresenceEvent('joined');
    };

    socket.onmessage = function(e) {
      try {
        const data = JSON.parse(e.data);
        handleWebSocketMessage(data);
      } catch (err) {
        console.error("❌ Erreur parsing WS:", err);
        showToast("Erreur de traitement du message", "error");
      }
    };

    socket.onclose = function(e) {
      console.log("🔌 WebSocket fermé:", e.code, e.reason);
      state.isConnected = false;
      showLoading(false);
      updateConnectionStatus('disconnected');

      if (!e.wasClean && reconnectAttempts < CONFIG.MAX_RECONNECT_ATTEMPTS) {
        scheduleReconnect();
      } else {
        handleConnectionError("Connexion perdue. Vérifiez votre connexion internet.");
      }
    };

    socket.onerror = function(err) {
      console.error("💥 WebSocket erreur:", err);
      showLoading(false);
      handleConnectionError("Erreur de connexion au serveur");
    };
  }

  function handleWebSocketMessage(data) {
    switch (data.type) {
      case "message":
        if (data.message) {
          appendMessageToDOM(data.message, false);
          playMessageSound();
          updateUnreadCount();
        }
        break;

      case "typing":
        handleTypingIndicator(data);
        break;

      case "message_read":
        updateMessageReadStatus(data);
        break;

      case "error":
        console.warn("⚠️ Erreur WS:", data.message);
        showToast(data.message, "error");
        break;

      case "user_joined":
        handleUserJoined(data);
        break;

      case "user_left":
        handleUserLeft(data);
        break;

      case "presence_update":
        handlePresenceUpdate(data);
        break;

      case "message_batch":
        handleMessageBatch(data);
        break;

      case "conversation_updated":
        handleConversationUpdate(data);
        break;

      default:
        console.log("📨 Message WS non géré:", data);
    }
  }

  // Message Handling amélioré
  function appendMessageToDOM(message, isLocalSend) {
    if (!elements.zoneMessages) return;

    const messageDiv = createMessageElement(message, isLocalSend);

    // Trouver la position d'insertion (chronologique)
    const messages = Array.from(elements.zoneMessages.children);
    let insertBefore = null;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const msgTime = new Date(msg.dataset.timestamp).getTime();
      const newMsgTime = new Date(message.date_envoi).getTime();

      if (newMsgTime < msgTime) {
        insertBefore = msg;
        break;
      }
    }

    if (insertBefore) {
      elements.zoneMessages.insertBefore(messageDiv, insertBefore);
    } else {
      elements.zoneMessages.appendChild(messageDiv);
    }

    // Animation d'entrée
    animateMessageAppearance(messageDiv);

    // Gestion du scroll
    if (isAtBottom || isLocalSend) {
      scrollToBottom(true);
    } else {
      showScrollIndicator();
    }

    // Mettre à jour l'historique
    state.messageHistory.push({
      id: message.id || 'temp',
      timestamp: message.date_envoi
    });

    // Marquer comme lu si c'est notre message
    if (isLocalSend) {
      markMessageAsRead(message);
    }
  }

  function createMessageElement(message, isLocalSend) {
    const div = document.createElement("div");
    const isOwnMessage = (message.expediteur_id == userId);
    const messageTime = new Date(message.date_envoi);
    const now = new Date();
    const isToday = messageTime.toDateString() === now.toDateString();

    div.className = `message ${isOwnMessage ? "message-out" : "message-in"} ${isLocalSend ? "sending" : ""}`;
    div.dataset.messageId = message.id || 'temp';
    div.dataset.timestamp = message.date_envoi;

    div.innerHTML = `
      <div class="message-content">
        <div class="message-bubble">
          <p class="message-text">${escapeHtml(message.contenu)}</p>
          ${message.fichier ? `
            <div class="message-attachment">
              <i class="fas fa-paperclip"></i>
              <span>Fichier joint</span>
            </div>
          ` : ''}
        </div>
        <div class="message-meta">
          <span class="message-time">
            ${isToday ? 
              messageTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) :
              messageTime.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' +
              messageTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            }
          </span>
          ${isOwnMessage ? `
            <span class="message-status">
              ${message.lu ? '<i class="fas fa-check-double read"></i>' : '<i class="fas fa-check unread"></i>'}
            </span>
          ` : ''}
        </div>
      </div>
    `;

    return div;
  }

  function animateMessageAppearance(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';

    requestAnimationFrame(() => {
      element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });

    // Supprimer la transition après l'animation
    setTimeout(() => {
      element.style.transition = '';
    }, 300);
  }

  // Typing Indicator amélioré
  function handleTyping() {
    if (!isTyping) {
      isTyping = true;
      sendTypingStatus(true);
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      isTyping = false;
      sendTypingStatus(false);
    }, CONFIG.TYPING_TIMEOUT);
  }

  function sendTypingStatus(typing) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "typing",
        typing: typing,
        user_id: userId,
        username: username
      }));
    }
  }

  function handleTypingIndicator(data) {
    if (!elements.typingIndicator || data.user_id == userId) return;

    if (data.typing) {
      elements.typingIndicator.classList.remove('hidden');
      const usersElement = elements.typingIndicator.querySelector('.typing-users');
      if (usersElement) {
        usersElement.textContent = data.username;
      }
    } else {
      elements.typingIndicator.classList.add('hidden');
    }
  }

  // Gestion du scroll améliorée
  function handleScroll() {
    if (!elements.zoneMessages) return;

    const { scrollTop, scrollHeight, clientHeight } = elements.zoneMessages;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    isAtBottom = distanceFromBottom < 100;

    if (isAtBottom) {
      hideScrollIndicator();
    }

    // Charger plus de messages en remontant
    if (scrollTop < 100 && state.messageHistory.length > CONFIG.MESSAGE_BATCH_SIZE) {
      loadMoreMessages();
    }
  }

  function scrollToBottom(instant = false) {
    if (!elements.zoneMessages) return;

    if (instant) {
      elements.zoneMessages.scrollTop = elements.zoneMessages.scrollHeight;
    } else {
      elements.zoneMessages.scrollTo({
        top: elements.zoneMessages.scrollHeight,
        behavior: 'smooth'
      });
    }

    hideScrollIndicator();
    isAtBottom = true;
  }

  function showScrollIndicator() {
    if (elements.scrollIndicator) {
      elements.scrollIndicator.classList.remove('hidden');
    }
  }

  function hideScrollIndicator() {
    if (elements.scrollIndicator) {
      elements.scrollIndicator.classList.add('hidden');
    }
  }

  // Form Handling amélioré
  function handleSubmit(e) {
    e.preventDefault();

    const now = Date.now();
    if (now - lastMessageTime < CONFIG.MESSAGE_DEBOUNCE) {
      showToast("Veuillez patienter entre les messages", "warning");
      return;
    }

    lastMessageTime = now;

    if (!elements.textareaContenu) return;
    const contenu = elements.textareaContenu.value.trim();

    if (!contenu) {
      showToast("Le message ne peut pas être vide", "warning");
      elements.textareaContenu.focus();
      return;
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      sendMessage(contenu);
    } else {
      showToast("Connexion perdue, tentative d'envoi classique...", "warning");
      fallbackSubmit();
    }
  }

  function sendMessage(contenu) {
    state.isSubmitting = true;
    updateSubmitButton(true);

    const tempMessage = {
      id: 'temp-' + Date.now(),
      contenu: contenu,
      expediteur: username,
      expediteur_id: parseInt(userId),
      date_envoi: new Date().toISOString(),
      conversation_id: conversationId,
      lu: false
    };

    // Ajouter le message localement immédiatement
    appendMessageToDOM(tempMessage, true);

    const payload = {
      type: "message",
      contenu: contenu,
      timestamp: Date.now(),
      temp_id: tempMessage.id
    };

    socket.send(JSON.stringify(payload));

    // Réinitialiser le formulaire
    elements.textareaContenu.value = "";
    resetTextareaHeight();
    state.isSubmitting = false;
    updateSubmitButton(false);

    // Arrêter l'indicateur de frappe
    if (isTyping) {
      isTyping = false;
      sendTypingStatus(false);
      clearTimeout(typingTimeout);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }

    // Auto-resize du textarea
    if (e.key === 'Enter' && e.shiftKey) {
      setTimeout(() => {
        autoResizeTextarea();
      }, 0);
    }
  }

  function handleTextareaFocus() {
    document.addEventListener('keydown', handleGlobalKeyDown);
  }

  function handleTextareaBlur() {
    document.removeEventListener('keydown', handleGlobalKeyDown);
  }

  function handleGlobalKeyDown(e) {
    // Raccourci global Ctrl+Enter pour envoyer
    if (e.ctrlKey && e.key === 'Enter') {
      handleSubmit(e);
    }
  }

  function autoResizeTextarea() {
    if (elements.textareaContenu) {
      elements.textareaContenu.style.height = 'auto';
      elements.textareaContenu.style.height = Math.min(elements.textareaContenu.scrollHeight, 150) + 'px';
    }
  }

  function resetTextareaHeight() {
    if (elements.textareaContenu) {
      elements.textareaContenu.style.height = 'auto';
    }
  }

  // Gestion des fichiers
  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast("Le fichier est trop volumineux (max 10MB)", "error");
      return;
    }

    showAttachmentPreview(file);
  }

  function showAttachmentPreview(file) {
    if (!elements.attachmentPreview) return;

    const content = elements.attachmentPreview.querySelector('.attachment-content');
    content.innerHTML = `
      <div class="attachment-info">
        <i class="fas fa-file"></i>
        <div class="attachment-details">
          <span class="attachment-name">${file.name}</span>
          <span class="attachment-size">${formatFileSize(file.size)}</span>
        </div>
      </div>
    `;

    elements.attachmentPreview.classList.remove('hidden');
  }

  function removeAttachment() {
    if (elements.attachmentPreview) {
      elements.attachmentPreview.classList.add('hidden');
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }

  // Error Handling amélioré
  function handleConnectionError(message) {
    showError(message);
    updateConnectionStatus('error');
    showLoading(false);
  }

  function showError(message) {
    if (elements.errorBanner) {
      elements.errorBanner.querySelector('.error-message').textContent = message;
      elements.errorBanner.classList.remove('hidden');
    }
  }

  function hideError() {
    if (elements.errorBanner) {
      elements.errorBanner.classList.add('hidden');
    }
  }

  function showToast(message, type = "info") {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

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

    toastContainer.appendChild(toast);

    // Animation d'entrée
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto-suppression
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, CONFIG.NOTIFICATION_TIMEOUT);
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

  // Utilities améliorées
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

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function scheduleReconnect() {
    reconnectAttempts++;
    const delay = CONFIG.RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts - 1);

    showToast(`Reconnexion dans ${delay/1000}s... (${reconnectAttempts}/${CONFIG.MAX_RECONNECT_ATTEMPTS})`, "warning");

    state.reconnectTimer = setTimeout(() => {
      console.log(`🔄 Tentative de reconnexion ${reconnectAttempts}/${CONFIG.MAX_RECONNECT_ATTEMPTS}`);
      connect();
    }, delay);
  }

  function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    if (!statusElement) return;

    const statusConfig = {
      connecting: { text: 'Connexion...', class: 'connecting', icon: 'fas fa-sync fa-spin' },
      connected: { text: 'En ligne', class: 'connected', icon: 'fas fa-circle' },
      disconnected: { text: 'Hors ligne', class: 'disconnected', icon: 'fas fa-circle' },
      error: { text: 'Erreur', class: 'error', icon: 'fas fa-exclamation-circle' }
    };

    const config = statusConfig[status] || statusConfig.disconnected;

    statusElement.className = `connection-status ${config.class}`;
    statusElement.innerHTML = `
      <div class="status-indicator">
        <i class="${config.icon}"></i>
      </div>
      <span class="status-text">${config.text}</span>
    `;
  }

  function updateSubmitButton(submitting) {
    const submitButton = elements.formEnvoi?.querySelector('button[type="submit"]');
    if (submitButton) {
      if (submitting) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
        submitButton.classList.add('loading');
      } else {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer';
        submitButton.classList.remove('loading');
      }
    }
  }

  function showLoading(show) {
    if (elements.loadingOverlay) {
      if (show) {
        elements.loadingOverlay.classList.add('active');
      } else {
        elements.loadingOverlay.classList.remove('active');
      }
    }
  }

  function handleVisibilityChange() {
    if (!document.hidden && !state.isConnected) {
      // Reconnecter quand la page redevient visible
      connect();
    }
  }

  function handleResize() {
    if (isAtBottom) {
      scrollToBottom(true);
    }
  }

  function playMessageSound() {
    // Implémenter une notification sonore discrète
    try {
      const audio = new Audio('/static/sounds/message-notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {
      // Ignorer les erreurs audio
    }
  }

  function markMessageAsRead(message) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "mark_read",
        message_id: message.id,
        user_id: userId
      }));
    }
  }

  function updateMessageReadStatus(data) {
    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
    if (messageElement) {
      const statusElement = messageElement.querySelector('.message-status');
      if (statusElement) {
        statusElement.innerHTML = '<i class="fas fa-check-double read"></i>';
      }
    }
  }

  function updateUnreadCount() {
    state.unreadCount++;
    // Mettre à jour le badge dans l'UI si nécessaire
  }

  function handleUserJoined(data) {
    state.onlineUsers.add(data.user_id);
    showToast(`${data.username} a rejoint la conversation`, "info");
    updateOnlineIndicator();
  }

  function handleUserLeft(data) {
    state.onlineUsers.delete(data.user_id);
    showToast(`${data.username} a quitté la conversation`, "info");
    updateOnlineIndicator();
  }

  function handlePresenceUpdate(data) {
    state.onlineUsers = new Set(data.online_users);
    updateOnlineIndicator();
  }

  function handleMessageBatch(data) {
    data.messages.forEach(message => {
      appendMessageToDOM(message, false);
    });
  }

  function handleConversationUpdate(data) {
    if (data.title && elements.conversationHeader) {
      const titleElement = elements.conversationHeader.querySelector('h1');
      if (titleElement) {
        titleElement.textContent = data.title;
      }
    }
  }

  function sendPresenceEvent(action) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "presence",
        action: action,
        user_id: userId,
        username: username
      }));
    }
  }

  function updateOnlineIndicator() {
    const onlineCount = state.onlineUsers.size;
    const indicator = document.querySelector('.online-indicator');
    if (indicator) {
      indicator.textContent = `${onlineCount} en ligne`;
    }
  }

  function loadMoreMessages() {
    // Implémenter le chargement paginé des messages
    console.log('Chargement de plus de messages...');
  }

  function fallbackSubmit() {
    if (elements.formEnvoi) {
      elements.formEnvoi.removeEventListener("submit", handleSubmit);
      elements.formEnvoi.submit();
    }
  }

  function cleanup() {
    // Envoyer l'événement de départ
    sendPresenceEvent('left');

    if (socket) {
      socket.close();
    }

    if (state.reconnectTimer) {
      clearTimeout(state.reconnectTimer);
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    document.removeEventListener('keydown', handleGlobalKeyDown);
  }

  // Fonctions globales pour les handlers HTML
  window.retryConnection = function() {
    hideError();
    connect();
  };

  window.hideError = hideError;
  window.scrollToBottom = scrollToBottom;
  window.removeAttachment = removeAttachment;

  // Initialisation
  if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initDetail);
  } else {
    initDetail();
  }
})();