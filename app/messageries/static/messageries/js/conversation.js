(function() {
  const conversationId = "{{ conversation.id }}";
  const userId = "{{ request.user.id }}";
  const loc = window.location;
  const wsProtocol = (loc.protocol === "https:") ? "wss" : "ws";
  const wsUrl = `${wsProtocol}://${loc.host}/ws/conversation/${conversationId}/`;

  let socket = null;

  function connect() {
    socket = new WebSocket(wsUrl);

    socket.onopen = function() {
      console.log("WebSocket connecté.");
    };

    socket.onmessage = function(e) {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "message" && data.message) {
          appendMessageToDOM(data.message, false);
        } else if (data.type === "error") {
          console.warn("Erreur WS:", data.message);
        }
      } catch (err) {
        console.error("Erreur parse WS:", err);
      }
    };

    socket.onclose = function(e) {
      console.log("WebSocket fermé, tentative de reconnexion dans 3s...", e.reason);
      setTimeout(connect, 3000);
    };

    socket.onerror = function(err) {
      console.error("WebSocket erreur:", err);
      socket.close();
    };
  }

  function appendMessageToDOM(message, isLocalSend) {
    const zone = document.getElementById("zone-messages");
    if (!zone) return;

    const div = document.createElement("div");
    div.className = "message " + ((message.expediteur_id == userId) ? "moi" : "autre");
    const p = document.createElement("p");
    p.className = "contenu";
    p.textContent = message.contenu;
    const small = document.createElement("small");
    small.className = "meta";
    small.textContent = `Envoyé par ${message.expediteur} le ${new Date(message.date_envoi).toLocaleString()}`;

    div.appendChild(p);
    div.appendChild(small);
    zone.appendChild(div);
    zone.scrollTop = zone.scrollHeight;
  }

  document.addEventListener("DOMContentLoaded", function() {
    connect();

    const form = document.getElementById("form-envoi-message");
    if (!form) return;

    form.addEventListener("submit", function(e) {
      e.preventDefault();
      const textarea = form.querySelector("textarea[name='contenu']");
      if (!textarea) return;
      const contenu = textarea.value.trim();
      if (!contenu) return;

      const payload = {
        type: "message",
        contenu: contenu
      };

      if (socket && socket.readyState === WebSocket.OPEN) {
        appendMessageToDOM({
          id: null,
          contenu: contenu,
          expediteur: "{{ request.user.username }}",
          expediteur_id: parseInt("{{ request.user.id }}"),
          date_envoi: new Date().toISOString(),
          conversation_id: conversationId,
          lu: false
        }, true);

        socket.send(JSON.stringify(payload));
        textarea.value = "";
      } else {
        form.removeEventListener("submit", arguments.callee);
        form.submit();
      }
    });
  });
})();
