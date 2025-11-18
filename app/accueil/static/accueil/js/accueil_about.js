// ==============================
// SCRIPT POUR LA SECTION ABOUT
// ==============================
document.addEventListener("DOMContentLoaded", () => {

    // ==============================
    // SLIDER INFINI
    // ==============================
    const sliders = document.querySelectorAll(".image-slider");

    sliders.forEach(slider => {
        const track = slider.querySelector(".slider-track");
        const slides = Array.from(track.children);
        const slideWidth = slides[0].offsetWidth + parseInt(getComputedStyle(slides[0]).marginRight);

        // Cloner les slides pour effet infini
        slides.forEach(slide => {
            const clone = slide.cloneNode(true);
            track.appendChild(clone);
        });

        let scrollPos = 0;
        const speed = 0.5;

        function animateSlider() {
            scrollPos += speed;
            if(scrollPos >= track.scrollWidth / 2) {
                scrollPos = 0;
            }
            track.style.transform = `translateX(-${scrollPos}px)`;
            requestAnimationFrame(animateSlider);
        }

        animateSlider();
    });

    // ==============================
    // ANIMATION DES POINTS AU SCROLL
    // ==============================
    const aboutPoints = document.querySelectorAll(".about-point");
    const introText = document.querySelector(".about-intro p");

    function revealPoints() {
        const triggerBottom = window.innerHeight * 0.85;

        // Animation du texte introductif
        if(introText) {
            const introPos = introText.getBoundingClientRect().top;
            if(introPos < triggerBottom) {
                introText.classList.add("visible");
            }
        }

        aboutPoints.forEach(point => {
            const pointTop = point.getBoundingClientRect().top;
            if(pointTop < triggerBottom) {
                point.classList.add("visible");
            }
        });
    }

    window.addEventListener("scroll", revealPoints);
    revealPoints(); // Pour déclencher au chargement
});
