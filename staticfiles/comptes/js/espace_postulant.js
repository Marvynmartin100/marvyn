document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  const mainContent = document.querySelector(".main-content");

  // ✅ Ouvrir / fermer la sidebar
  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
    adjustMainMargin();
  });

  // ✅ Fermer la sidebar si on clique en dehors (uniquement sur mobile)
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
      const isClickInsideSidebar = sidebar.contains(e.target);
      const isClickOnMenu = menuToggle.contains(e.target);

      if (!isClickInsideSidebar && !isClickOnMenu && sidebar.classList.contains("active")) {
        sidebar.classList.remove("active");
      }
    }
  });

  // ✅ Ajustement automatique du contenu selon l’état de la sidebar
  const adjustMainMargin = () => {
    if (window.innerWidth > 768) {
      mainContent.style.marginLeft = sidebar.classList.contains("active") ? "260px" : "0";
    } else {
      mainContent.style.marginLeft = "0";
    }
  };

  window.addEventListener("resize", adjustMainMargin);
  adjustMainMargin();
});
