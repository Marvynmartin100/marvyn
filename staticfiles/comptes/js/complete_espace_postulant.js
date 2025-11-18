document.addEventListener('DOMContentLoaded', function () {

    /* ============================================================
        1. Accordéon animé
    ============================================================ */
    const accordions = document.querySelectorAll('.accordion-header');

    accordions.forEach(header => {
        const content = header.nextElementSibling;

        // Initialisation
        content.style.overflow = 'hidden';
        if (header.getAttribute('aria-expanded') === 'true') {
            content.style.maxHeight = content.scrollHeight + 'px';
        } else {
            content.style.maxHeight = '0px';
        }

        header.addEventListener('click', () => {
            const expanded = header.getAttribute('aria-expanded') === 'true';

            if (expanded) {
                content.style.maxHeight = '0px';
                header.setAttribute('aria-expanded', 'false');
                setTimeout(() => content.setAttribute('hidden', ''), 250);
            } else {
                content.removeAttribute('hidden');
                header.setAttribute('aria-expanded', 'true');
                setTimeout(() => {
                    content.style.maxHeight = content.scrollHeight + 'px';
                }, 20);
            }
        });
    });

    /* ============================================================
        2. Animation douce pour <details> (conseils)
    ============================================================ */
    document.querySelectorAll('details.conseil').forEach(details => {
        const summary = details.querySelector('summary');
        const content = Array.from(details.children).find(el => el.tagName !== 'SUMMARY');

        content.style.overflow = 'hidden';
        content.style.transition = 'max-height 0.3s ease';

        if (!details.open) {
            content.style.maxHeight = '0px';
        }

        summary.addEventListener('click', (e) => {
            e.preventDefault();

            if (details.open) {
                content.style.maxHeight = '0px';
                setTimeout(() => details.open = false, 300);
            } else {
                details.open = true;
                setTimeout(() => {
                    content.style.maxHeight = content.scrollHeight + 'px';
                }, 15);
            }
        });
    });

    /* ============================================================
        3. Animation du <main>
    ============================================================ */
    const main = document.querySelector('main');
    if (main) {
        main.style.opacity = 0;
        main.style.transition = 'opacity 0.6s ease';
        setTimeout(() => main.style.opacity = 1, 150);
    }

    /* ============================================================
        4. Fonction : Récupérer le token CSRF
    ============================================================ */
    function getCSRFToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='));
        return cookieValue ? cookieValue.split('=')[1] : null;
    }

    /* ============================================================
        5. Fonction : Affichage des messages AJAX
    ============================================================ */
    function showAjaxMessage(section, htmlContent) {
        const block = document.getElementById(`messages-${section}`);
        if (!block) return;

        block.innerHTML = htmlContent;

        // Petite animation de fade-in
        block.style.opacity = 0;
        block.style.transition = 'opacity 0.4s ease';
        setTimeout(() => block.style.opacity = 1, 30);
    }

    /* ============================================================
        6. Soumission AJAX pour CHAQUE form.ajax-form
    ============================================================ */
    const ajaxForms = document.querySelectorAll('.ajax-form');

    ajaxForms.forEach(form => {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const section = form.dataset.section;
            const url = window.location.href; // même URL
            const formData = new FormData(form);

            // ✅ Ajout du champ du bouton submit pour Django
            const button = form.querySelector('button[type="submit"]');
            if (button && button.name) {
                formData.append(button.name, '1');
            }

            fetch(url, {
                method: 'POST',
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRFToken": getCSRFToken(),
                },
                body: formData
            })
                .then(response => {
                    // Si ce n'est pas du JSON, afficher le HTML complet pour debug
                    return response.text().then(text => {
                        try {
                            return JSON.parse(text);
                        } catch (err) {
                            console.error("Réponse non JSON :", text);
                            throw err;
                        }
                    });
                })
                .then(data => {

                    // Mise à jour des messages
                    if (data.message) {
                        showAjaxMessage(section, `<p class="${data.success ? 'success' : 'error'}">${data.message}</p>`);
                    }

                    // Mise à jour d'une image (photo de profil par ex)
                    if (data.updated_photo_url) {
                        const img = document.querySelector("img[alt^='Photo actuelle']");
                        if (img) img.src = data.updated_photo_url;
                    }

                })
                .catch(err => {
                    console.error("Erreur AJAX :", err);
                    showAjaxMessage(section, "<p class='error'>Une erreur est survenue. Réessayez.</p>");
                });

        });
    });

});
