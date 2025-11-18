// Animation d'apparition douce au scroll
document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  const animatedElements = document.querySelectorAll(
    ".features-employeurs h2, .features-employeurs p, .features-employeurs li, .features-employeurs h3"
  );

  animatedElements.forEach((el) => {
    observer.observe(el);
  });
});
