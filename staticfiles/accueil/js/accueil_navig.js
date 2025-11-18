// navigation.js
document.addEventListener('DOMContentLoaded', () => {

    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('nav ul');
    const links = document.querySelectorAll('nav ul li a');
    const nav = document.querySelector('nav');
    const sections = document.querySelectorAll('section[id]');

    // ===== MENU BURGER =====
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            menu.classList.toggle('show');
        });

        // Fermer le menu sur mobile quand on clique sur un lien
        links.forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('show');
                toggle.classList.remove('active');
            });
        });
    }

    // ===== SMOOTH SCROLL =====
    links.forEach(link => {
        link.addEventListener('click', e => {
            const targetId = link.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    const headerHeight = nav.offsetHeight;
                    const targetPos = targetSection.offsetTop - headerHeight;
                    window.scrollTo({
                        top: targetPos,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // ===== Calcul initial des positions des sections =====
    let sectionPositions = Array.from(sections).map(section => ({
        id: section.id,
        top: section.offsetTop,
        height: section.offsetHeight
    }));

    // ===== LIEN ACTIF + STICKY HEADER =====
    function updateNav() {
        const scrollY = window.pageYOffset;
        const middleScreen = scrollY + window.innerHeight / 2; // point central de la fenêtre

        // Liens actifs
        sectionPositions.forEach(pos => {
            const link = document.querySelector(`nav ul li a[href="#${pos.id}"]`);
            if (!link) return;

            if (middleScreen >= pos.top && middleScreen < pos.top + pos.height) {
                links.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });

        // Sticky header
        if(nav){
            if(scrollY > 50){
                nav.classList.add('sticky');
            } else {
                nav.classList.remove('sticky');
            }
        }
    }

    // Appel initial
    updateNav();

    // Événement scroll
    window.addEventListener('scroll', updateNav);

    // Recalcul des positions si la fenêtre change de taille
    window.addEventListener('resize', () => {
        sectionPositions = Array.from(sections).map(section => ({
            id: section.id,
            top: section.offsetTop,
            height: section.offsetHeight
        }));
        updateNav();
    });
});
