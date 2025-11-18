document.addEventListener("DOMContentLoaded", () => {
    // --- Fonction apparition au scroll ---
    const animateOnScroll = () => {
        const elements = document.querySelectorAll(
            ".features-postulants h2, .features-postulants p, .postulant-actions li, .postulant-benefits, .note-postulant"
        );

        const windowBottom = window.innerHeight;

        elements.forEach(el => {
            const elTop = el.getBoundingClientRect().top;

            if (elTop < windowBottom - 50) { // quand l'élément est visible
                el.style.opacity = 1;
                el.style.transform = "translateY(0)";
                el.style.transition = "all 0.8s ease-out";
            }
        });
    };

    window.addEventListener("scroll", animateOnScroll);
    animateOnScroll(); // initial check

    // --- Effet hover dynamique ---
    const hoverItems = document.querySelectorAll(".postulant-actions li, .postulant-benefits li");
    hoverItems.forEach(item => {
        item.addEventListener("mouseenter", () => {
            item.style.transform = "translateY(-5px)";
            item.style.boxShadow = "0 12px 25px rgba(255, 111, 207, 0.25)";
        });
        item.addEventListener("mouseleave", () => {
            item.style.transform = "translateY(0)";
            item.style.boxShadow = "0 6px 20px rgba(255, 111, 207, 0.1)";
        });
    });

    // --- Animation CTA bouton ---
    const ctaBtn = document.querySelector(".cta-postulant .btn-postulant");
    if(ctaBtn) {
        setTimeout(() => {
            ctaBtn.animate(
                [
                    { transform: "scale(1)" },
                    { transform: "scale(1.05)" },
                    { transform: "scale(1)" }
                ],
                { duration: 800, iterations: 3, easing: "ease-in-out" }
            );
        }, 5000); // après 5s
    }

    // --- Option bonus : effet de brillance sur hover des li ---
    hoverItems.forEach(item => {
        item.addEventListener("mousemove", e => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            item.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.12), rgba(255,255,255,0.05))`;
        });
        item.addEventListener("mouseleave", () => {
            item.style.background = "rgba(255, 255, 255, 0.05)";
        });
    });

    // --- AJAX formulaire de contact ---
    const contactForm = document.querySelector(".contact-form");
    const messagesDiv = document.getElementById("messages");

    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // empêche le POST classique

            // Validation simple côté client
            const formInputs = contactForm.querySelectorAll("input, textarea");
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
                if (messagesDiv) {
                    messagesDiv.innerHTML = '<p class="error">Veuillez remplir tous les champs avant d\'envoyer le message.</p>';
                }
                return;
            }

            // Préparer l’envoi AJAX
            const formData = new FormData(contactForm);
            const csrfToken = contactForm.querySelector('[name=csrfmiddlewaretoken]').value;
            if (messagesDiv) messagesDiv.innerHTML = "";

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

                if (messagesDiv) {
                    // Injection directe du HTML renvoyé par la vue Django
                    messagesDiv.innerHTML = data.html;

                    // Si succès, vider le formulaire
                    if (data.success) contactForm.reset();
                }
            } catch (error) {
                if (messagesDiv) {
                    messagesDiv.innerHTML = '<p class="error">Une erreur est survenue. Veuillez réessayer.</p>';
                }
            }
        });
    }
});
