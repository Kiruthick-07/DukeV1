/* =========================================
   FLUXR.IN — MAIN INTERACTIONS
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  initHeroInteractions();
  initScrollReveal();
  initServiceMarquee();
  initMobileCarousel();
  initReducedMotion();

});


/* =========================================
   HERO INTERACTIONS
========================================= */

function initHeroInteractions() {

  const hero = document.querySelector(".hero");
  const illustration = document.querySelector(".growth-illustration");
  const growthLine = document.querySelector(".growth-line");


  /* Subtle mouse parallax on illustration */

  if (hero && illustration) {

    const floatingElements = illustration.querySelectorAll(
      ".icon-code, .icon-chart, .gear, .idea-box, .build-box, .grow-box"
    );

    hero.addEventListener("mousemove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      floatingElements.forEach((element, index) => {
        const strength = 3 + index * 0.3;
        element.style.transform =
          `translate(${x * strength}px, ${y * strength}px)`;
      });
    });

    hero.addEventListener("mouseleave", () => {
      floatingElements.forEach((element) => {
        element.style.transform = "translate(0, 0)";
      });
    });
  }


  /* CTA hover transition */

  const ctas = document.querySelectorAll(".main-cta, .nav-cta");

  ctas.forEach((cta) => {
    cta.addEventListener("mouseenter", () => {
      cta.style.transition = "transform 0.25s ease";
    });
  });


  /* Redraw growth line on page load */

  if (growthLine) {
    const length = growthLine.getTotalLength();
    growthLine.style.strokeDasharray = length;
    growthLine.style.strokeDashoffset = length;

    requestAnimationFrame(() => {
      growthLine.style.animation =
        "drawGrowth 2.2s 1.2s cubic-bezier(.65,0,.2,1) forwards";
    });
  }
}


/* =========================================
   SCROLL REVEAL (IntersectionObserver)
========================================= */

function initScrollReveal() {

  const reveals = document.querySelectorAll(".anim-reveal");
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {

    entries.forEach((entry) => {

      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");

        /* Stagger trusted-by names */
        const nameItems = entry.target.querySelectorAll(
          ".trusted-names > *"
        );
        nameItems.forEach((el, i) => {
          el.style.transitionDelay = `${0.08 + i * 0.05}s`;
        });

        observer.unobserve(entry.target);
      }

    });

  }, {
    threshold: 0.12,
    rootMargin: "0px 0px -40px 0px"
  });

  reveals.forEach((el) => observer.observe(el));
}


/* =========================================
   DESKTOP SERVICE MARQUEE
========================================= */

function initServiceMarquee() {

  const track = document.getElementById("marquee-track");
  const firstSet = track ? track.querySelector(".marquee-set") : null;

  if (!track || !firstSet) return;

  /* Clone the card set for seamless infinite loop */
  const clone = firstSet.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  track.appendChild(clone);

  /* Start the animation */
  requestAnimationFrame(() => {
    track.classList.add("running");
  });
}


/* =========================================
   MOBILE SCROLL-DRIVEN CAROUSEL
========================================= */

function initMobileCarousel() {

  const scrollContainer = document.querySelector(".services-scroll");
  const stickyContainer = document.querySelector(".services-sticky");
  const mobileTrack = document.getElementById("mobile-track");
  const counterEl = document.getElementById("counter-current");

  if (!scrollContainer || !mobileTrack) return;


  /* Clone cards from marquee into mobile track */

  const marqueeCards = document.querySelectorAll(
    ".marquee-set:first-child .service-card"
  );

  if (!marqueeCards.length) return;

  marqueeCards.forEach((card) => {
    mobileTrack.appendChild(card.cloneNode(true));
  });

  const cards = mobileTrack.querySelectorAll(".service-card");
  const totalCards = cards.length;

  if (!totalCards) return;


  /* Show the sticky container */

  if (stickyContainer) {
    stickyContainer.classList.add("ready");
  }


  /* State */

  let currentProgress = 0;
  let targetProgress = 0;
  let isRunning = false;


  /* Check if mobile mode */

  function isMobile() {
    return window.innerWidth <= 900;
  }


  /* rAF update loop */

  function updateCards() {

    if (!isMobile()) {
      isRunning = false;
      return;
    }

    /* Smooth interpolation */
    currentProgress += (targetProgress - currentProgress) * 0.08;

    const activeFloat = currentProgress * (totalCards - 1);
    const activeIndex = Math.round(activeFloat);

    /* Update counter */
    if (counterEl) {
      counterEl.textContent = String(activeIndex + 1).padStart(2, "0");
    }

    /* Calculate transforms */
    const cardWidth = cards[0].offsetWidth;
    const gap = 20;
    const viewportCenter = window.innerWidth / 2;

    /* Translate the entire track to center the active card */
    const trackX =
      viewportCenter - cardWidth / 2 - activeFloat * (cardWidth + gap);

    mobileTrack.style.transform = `translateX(${trackX}px)`;

    /* Per-card depth effects */
    cards.forEach((card, i) => {

      const distance = Math.abs(i - activeFloat);

      const scale = Math.max(0.85, 1 - distance * 0.06);
      const opacity = Math.max(0.2, 1 - distance * 0.35);
      const blur = Math.min(6, distance * 3);

      /* Subtle upward pop for active card */
      const popY = distance < 0.4
        ? -8 * (1 - distance / 0.4)
        : 0;

      card.style.transform =
        `scale(${scale}) translateY(${popY}px)`;
      card.style.opacity = opacity;
      card.style.filter = `blur(${blur}px)`;
    });

    requestAnimationFrame(updateCards);
  }


  /* Scroll listener */

  function onScroll() {

    if (!isMobile()) return;

    const rect = scrollContainer.getBoundingClientRect();
    const scrollTop = -rect.top;
    const scrollHeight = rect.height - window.innerHeight;

    targetProgress = Math.max(0, Math.min(1, scrollTop / scrollHeight));

    /* Start rAF loop if not already running */
    if (!isRunning) {
      isRunning = true;
      requestAnimationFrame(updateCards);
    }
  }


  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  /* Initial calculation */
  onScroll();
}


/* =========================================
   REDUCED MOTION ACCESSIBILITY
========================================= */

function initReducedMotion() {

  const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {

    document.documentElement.style.setProperty(
      "--animation-duration", "0s"
    );

    document.querySelectorAll("*").forEach((element) => {
      element.style.animationDuration = "0s";
      element.style.transitionDuration = "0s";
    });

    /* Force reveal all scroll-reveal elements */
    document.querySelectorAll(".anim-reveal").forEach((el) => {
      el.classList.add("in-view");
    });

    /* Show mobile sticky immediately */
    const sticky = document.querySelector(".services-sticky");
    if (sticky) sticky.classList.add("ready");
  }
}