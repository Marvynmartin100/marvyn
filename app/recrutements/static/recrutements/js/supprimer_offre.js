document.addEventListener("DOMContentLoaded", function() {
  const boutons = document.querySelectorAll(".btn-supprimer");

  boutons.forEach(bouton => {
    bouton.addEventListener("click", async function() {
      const offreId = this.getAttribute("data-id");

      if (!confirm("Voulez-vous vraiment supprimer cette offre ?")) {
        return;
      }

      try {
        // ✅ URL absolue : commence par /
        const response = await fetch(`/recrutements/supprimer_offre/${offreId}/`, {
          method: "POST",
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
            "X-Requested-With": "XMLHttpRequest"
          }
        });

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            const ligne = document.getElementById(`offre-${offreId}`);
            if (ligne) ligne.remove();
            alert("Offre supprimée avec succès !");
          } else {
            alert(data.message || "Une erreur est survenue.");
          }
        } else {
          alert("Erreur serveur lors de la suppression.");
        }
      } catch (error) {
        console.error("Erreur AJAX :", error);
        alert("Impossible de supprimer l’offre.");
      }
    });
  });

  // ✅ Fonction pour récupérer le token CSRF
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
});
