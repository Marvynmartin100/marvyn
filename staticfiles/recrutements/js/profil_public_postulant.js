// --------------------------------------------------------------
//  Script : profil_public_postulant.js
//  Description : Ouvre/ferme le modal et envoie le formulaire de recommandation
// --------------------------------------------------------------
console.log("profil_public_postulant.js chargé ✅");

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modalRecommandation');
  const openBtn = document.getElementById('ouvrirRecommandation');
  const closeBtn = document.getElementById('fermerRecommandation');
  const form = modal.querySelector('form');

  // Créer un élément pour afficher les messages
  const messageBox = document.createElement('p');
  messageBox.classList.add('message');
  form.appendChild(messageBox);

  // Récupérer le token CSRF
  const getCSRFToken = () => document.querySelector('[name=csrfmiddlewaretoken]').value;

  // ✅ Ouvrir le modal
  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      modal.classList.add('active');
      modal.style.display = 'flex'; // <-- Affiche le modal
      messageBox.textContent = '';
    });
  }

  // ❌ Fermer le modal
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      modal.style.display = 'none'; // <-- Cache le modal
      messageBox.textContent = '';
    });
  }

  // 📨 Envoi AJAX du formulaire
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const csrfToken = getCSRFToken();

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          messageBox.textContent = data.message;
          messageBox.style.color = 'green';
          setTimeout(() => {
            modal.classList.remove('active');
            modal.style.display = 'none'; // <-- Ferme le modal
            messageBox.textContent = '';
          }, 1500);
        } else {
          messageBox.textContent = data.message || "Une erreur s'est produite.";
          messageBox.style.color = 'red';
        }
      } catch (error) {
        console.error("Erreur AJAX :", error);
        messageBox.textContent = "Erreur de connexion au serveur.";
        messageBox.style.color = 'red';
      }
    });
  }

  // 🕳️ Fermer le modal si clic à l’extérieur
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      modal.style.display = 'none'; // <-- Ferme le modal
      messageBox.textContent = '';
    }
  });
});
