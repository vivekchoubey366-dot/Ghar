// ============================================================
// GHAR - REAL ESTATE PLATFORM
// animations.js
// Global UI animations and interaction effects
// ============================================================

"use strict";

window.GHAR = window.GHAR || {};

GHAR.animations = (() => {

  // ----------------------------------------------------------
  // CONFIG
  // ----------------------------------------------------------

  const CONFIG = {
    observerThreshold: 0.12,
    observerRootMargin: "0px 0px -40px 0px",
    transitionClass: "ghar-animate-visible"
  };

  // ----------------------------------------------------------
  // INITIALIZE
  // ----------------------------------------------------------

  function init() {
    setupRevealAnimations();
    setupHoverEffects();
    setupCounterAnimations();
    setupProgressAnimations();
    setupLazyAnimations();
    setupReducedMotion();
  }

  // ----------------------------------------------------------
  // REVEAL ANIMATIONS
  // ----------------------------------------------------------

  function setupRevealAnimations() {

    const elements = document.querySelectorAll(
      "[data-animate], " +
      ".animate-on-scroll, " +
      ".reveal, " +
      ".fade-in, " +
      ".slide-up"
    );

    if (!elements.length) return;

    if (
      window.matchMedia &&
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      elements.forEach(element => {
        element.classList.add(
          CONFIG.transitionClass
        );
      });

      return;
    }

    if (!("IntersectionObserver" in window)) {
      elements.forEach(element => {
        element.classList.add(
          CONFIG.transitionClass
        );
      });

      return;
    }

    const observer =
      new IntersectionObserver(
        entries => {

          entries.forEach(entry => {

            if (!entry.isIntersecting) {
              return;
            }

            const element =
              entry.target;

            const delay =
              element.dataset.animationDelay ||
              element.dataset.delay;

            if (delay) {
              element.style.animationDelay =
                `${Number(delay)}ms`;
            }

            element.classList.add(
              CONFIG.transitionClass
            );

            observer.unobserve(element);

          });

        },
        {
          threshold:
            CONFIG.observerThreshold,

          rootMargin:
            CONFIG.observerRootMargin
        }
      );

    elements.forEach(element => {
      observer.observe(element);
    });
  }

  // ----------------------------------------------------------
  // HOVER EFFECTS
  // ----------------------------------------------------------

  function setupHoverEffects() {

    const cards =
      document.querySelectorAll(
        "[data-hover-lift], " +
        ".property-card, " +
        ".ghar-card"
      );

    cards.forEach(card => {

      card.addEventListener(
        "mouseenter",
        () => {

          if (
            prefersReducedMotion()
          ) {
            return;
          }

          card.classList.add(
            "ghar-hover-active"
          );

        }
      );

      card.addEventListener(
        "mouseleave",
        () => {

          card.classList.remove(
            "ghar-hover-active"
          );

        }
      );

    });
  }

  // ----------------------------------------------------------
  // COUNTER ANIMATIONS
  // ----------------------------------------------------------

  function setupCounterAnimations() {

    const counters =
      document.querySelectorAll(
        "[data-counter]"
      );

    if (!counters.length) {
      return;
    }

    counters.forEach(counter => {

      const target =
        Number(
          counter.dataset.counter
        );

      if (!Number.isFinite(target)) {
        return;
      }

      const duration =
        Number(
          counter.dataset.duration
        ) || 1200;

      if (prefersReducedMotion()) {

        counter.textContent =
          formatNumber(target);

        return;
      }

      animateCounter(
        counter,
        target,
        duration
      );

    });
  }

  function animateCounter(
    element,
    target,
    duration
  ) {

    const startTime =
      performance.now();

    function update(currentTime) {

      const elapsed =
        currentTime - startTime;

      const progress =
        Math.min(
          elapsed / duration,
          1
        );

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3
        );

      const value =
        target * eased;

      element.textContent =
        formatNumber(value);

      if (progress < 1) {
        requestAnimationFrame(
          update
        );
      }

    }

    requestAnimationFrame(
      update
    );
  }

  // ----------------------------------------------------------
  // PROGRESS ANIMATIONS
  // ----------------------------------------------------------

  function setupProgressAnimations() {

    const progressBars =
      document.querySelectorAll(
        "[data-progress]"
      );

    progressBars.forEach(bar => {

      const value =
        Math.max(
          0,
          Math.min(
            100,
            Number(
              bar.dataset.progress
            ) || 0
          )
        );

      if (
        prefersReducedMotion()
      ) {

        setProgress(
          bar,
          value
        );

        return;
      }

      requestAnimationFrame(() => {

        setProgress(
          bar,
          value
        );

      });

    });
  }

  function setProgress(
    element,
    value
  ) {

    element.style.width =
      `${value}%`;

    element.setAttribute(
      "aria-valuenow",
      String(value)
    );
  }

  // ----------------------------------------------------------
  // LAZY ANIMATION SUPPORT
  // ----------------------------------------------------------

  function setupLazyAnimations() {

    const elements =
      document.querySelectorAll(
        "[data-animation]"
      );

    elements.forEach(element => {

      const animation =
        element.dataset.animation;

      if (!animation) {
        return;
      }

      element.classList.add(
        `ghar-animation-${animation}`
      );

    });
  }

  // ----------------------------------------------------------
  // REDUCED MOTION
  // ----------------------------------------------------------

  function setupReducedMotion() {

    if (!window.matchMedia) {
      return;
    }

    const media =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

    applyReducedMotion(
      media.matches
    );

    if (
      typeof media.addEventListener ===
      "function"
    ) {

      media.addEventListener(
        "change",
        event => {
          applyReducedMotion(
            event.matches
          );
        }
      );

    }

  }

  function applyReducedMotion(
    enabled
  ) {

    document.documentElement
      .classList.toggle(
        "ghar-reduced-motion",
        enabled
      );
  }

  // ----------------------------------------------------------
  // UTILITY
  // ----------------------------------------------------------

  function prefersReducedMotion() {

    return (
      window.matchMedia &&
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    );
  }

  function formatNumber(
    value
  ) {

    return Math.round(value)
      .toLocaleString("en-IN");
  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  return {

    init,

    reveal(element) {

      if (!element) {
        return;
      }

      element.classList.add(
        CONFIG.transitionClass
      );

    },

    animateCounter,

    setProgress,

    prefersReducedMotion

  };

})();

// ============================================================
// AUTO INITIALIZE
// ============================================================

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      GHAR.animations.init();
    },
    {
      once: true
    }
  );

} else {

  GHAR.animations.init();

}