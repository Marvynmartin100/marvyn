document.addEventListener("DOMContentLoaded", () => {
  // ===== Animation au scroll pour les sections =====
  const sections = document.querySelectorAll(".section");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("animate");
      });
    },
    { threshold: 0.2 }
  );
  sections.forEach(section => observer.observe(section));

  // ===== Effet focus sur formulaire =====
  const formInputs = document.querySelectorAll(".contact-form input, .contact-form textarea");
  formInputs.forEach(input => {
    input.addEventListener("focus", () => input.style.boxShadow = "0 0 10px rgba(255,184,108,0.8)");
    input.addEventListener("blur", () => input.style.boxShadow = "");
  });

  // ===== Animation sociale icons =====
  const socialLinks = document.querySelectorAll(".social-links li");
  socialLinks.forEach(link => {
    link.addEventListener("mouseenter", () => {
      link.style.transform = "scale(1.3) rotate(-5deg)";
      link.style.boxShadow = "0 10px 30px rgba(255,184,108,0.5)";
    });
    link.addEventListener("mouseleave", () => {
      link.style.transform = "scale(1) rotate(0deg)";
      link.style.boxShadow = "0 6px 20px rgba(255,184,108,0.3)";
    });
  });

  // ===== Validation + Envoi AJAX du formulaire =====
  const contactForm = document.querySelector(".contact-form");
  const messagesDiv = document.getElementById("messages");

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // Empêche le POST classique

      // Validation simple côté client
      let valid = true;
      formInputs.forEach(input => {
        if(input.value.trim() === "") {
          valid = false;
          input.style.border = "2px solid #ff5555";
        } else {
          input.style.border = "";
        }
      });

      if (!valid) {
        if(messagesDiv) messagesDiv.innerHTML = '<p class="error">Veuillez remplir tous les champs avant d\'envoyer le message.</p>';
        return;
      }

      // Préparer l’envoi AJAX
      const formData = new FormData(contactForm);
      const csrfToken = contactForm.querySelector('[name=csrfmiddlewaretoken]').value;
      messagesDiv.innerHTML = "";

      try {
        const response = await fetch(window.location.href, {
          method: "POST",
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRFToken": csrfToken
          },
          body: formData
        });

        const data = await response.json();

        if(messagesDiv) {
          // Injecter le HTML reçu directement depuis la vue Django
          // La vue doit renvoyer "html": '<p class="success">...</p>' ou '<p class="error">...</p>'
          messagesDiv.innerHTML = data.html;

          // Réinitialiser le formulaire si succès
          if (data.success) contactForm.reset();
        }
      } catch(error) {
        if(messagesDiv) {
          messagesDiv.innerHTML = '<p class="error">Une erreur est survenue. Veuillez réessayer.</p>';
        }
      }
    });
  }

  // ===== Apparition progressive des contact-info =====
  const contactInfoItems = document.querySelectorAll(".contact-info p");
  contactInfoItems.forEach((item, index) => {
    item.style.opacity = 0;
    setTimeout(() => {
      item.style.transition = "all 0.6s ease";
      item.style.opacity = 1;
      item.style.transform = "translateY(0)";
    }, index * 150);
  });
});
