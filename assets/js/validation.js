// ============================================================
// GHAR - REAL ESTATE PLATFORM
// animations.js
// Global UI animations and motion utilities
// ============================================================

"use strict";

(function (window, document) {
  // ----------------------------------------------------------
  // GHAR NAMESPACE
  // ----------------------------------------------------------

  window.GHAR = window.GHAR || {};

  const GHAR = window.GHAR;

  // ----------------------------------------------------------
  // CONFIGURATION
  // ----------------------------------------------------------

  const CONFIG = {
    selector: "[data-animate]",

    observer: {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px"
    },

    stagger: 80,

    duration: {
      fast: 180,
      normal: 300,
      slow: 500
    },

    easing: {
      standard: "cubic-bezier(0.22, 1, 0.36, 1)",
      smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
      spring: "cubic-bezier(0.34, 1.56, 0.64, 1)"
    }
  };

  GHAR.animations = GHAR.animations || {};

  GHAR.animations.config = CONFIG;

  // ----------------------------------------------------------
  // REDUCED MOTION
  // ----------------------------------------------------------

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  function reducedMotion() {
    return prefersReducedMotion.matches;
  }

  // ----------------------------------------------------------
  // SAFE RAF
  // ----------------------------------------------------------

  function raf(callback) {
    if (typeof window.requestAnimationFrame === "function") {
      return window.requestAnimationFrame(callback);
    }

    return window.setTimeout(callback, 16);
  }

  // ----------------------------------------------------------
  // ELEMENT VISIBILITY
  // ----------------------------------------------------------

  function isVisible(element) {
    if (!element) {
      return false;
    }

    const style = window.getComputedStyle(element);

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  }

  // ----------------------------------------------------------
  // REVEAL ELEMENT
  // ----------------------------------------------------------

  function reveal(element, options = {}) {
    if (!element) {
      return;
    }

    if (reducedMotion()) {
      element.style.opacity = "1";
      element.style.transform = "none";
      element.classList.add("is-visible");
      return;
    }

    const duration =
      options.duration ||
      CONFIG.duration.normal;

    const easing =
      options.easing ||
      CONFIG.easing.standard;

    const delay =
      Number(options.delay) || 0;

    const animation =
      options.animation ||
      "fade-up";

    element.style.animationDuration =
      `${duration}ms`;

    element.style.animationTimingFunction =
      easing;

    element.style.animationDelay =
      `${delay}ms`;

    element.dataset.animationState =
      "visible";

    element.classList.add(
      "gh-animate",
      `gh-animate-${animation}`,
      "is-visible"
    );
  }

  // ----------------------------------------------------------
  // HIDE ELEMENT
  // ----------------------------------------------------------

  function hide(element) {
    if (!element) {
      return;
    }

    element.classList.remove(
      "is-visible"
    );

    element.dataset.animationState =
      "hidden";
  }

  // ----------------------------------------------------------
  // INITIALIZE SCROLL ANIMATIONS
  // ----------------------------------------------------------

  function initScrollAnimations(root = document) {
    const elements =
      root.querySelectorAll(
        CONFIG.selector
      );

    if (!elements.length) {
      return;
    }

    if (
      reducedMotion() ||
      !("IntersectionObserver" in window)
    ) {
      elements.forEach(element => {
        reveal(element);
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

            const animation =
              element.dataset.animate ||
              "fade-up";

            const delay =
              element.dataset.animateDelay ||
              0;

            reveal(element, {
              animation,
              delay
            });

            observer.unobserve(element);
          });
        },
        CONFIG.observer
      );

    elements.forEach(element => {
      observer.observe(element);
    });

    GHAR.animations.scrollObserver =
      observer;
  }

  // ----------------------------------------------------------
  // STAGGER CHILDREN
  // ----------------------------------------------------------

  function stagger(
    container,
    selector = ":scope > *",
    options = {}
  ) {
    if (!container) {
      return;
    }

    const children =
      container.querySelectorAll(
        selector
      );

    const delay =
      Number(options.delay) || 0;

    children.forEach(
      (child, index) => {
        child.style.setProperty(
          "--ghar-animation-delay",
          `${delay + index * CONFIG.stagger}ms`
        );

        child.dataset.animateDelay =
          delay + index * CONFIG.stagger;

        if (
          !child.dataset.animate
        ) {
          child.dataset.animate =
            options.animation ||
            "fade-up";
        }
      }
    );
  }

  // ----------------------------------------------------------
  // PAGE LOAD ANIMATION
  // ----------------------------------------------------------

  function pageEnter() {
    if (reducedMotion()) {
      document.documentElement.classList.add(
        "ghar-page-ready"
      );

      return;
    }

    raf(() => {
      document.documentElement.classList.add(
        "ghar-page-ready"
      );

      document.body.classList.add(
        "ghar-page-entered"
      );
    });
  }

  // ----------------------------------------------------------
  // PAGE EXIT ANIMATION
  // ----------------------------------------------------------

  function pageExit(callback) {
    if (typeof callback !== "function") {
      return;
    }

    if (reducedMotion()) {
      callback();
      return;
    }

    document.body.classList.add(
      "ghar-page-exiting"
    );

    window.setTimeout(
      callback,
      CONFIG.duration.fast
    );
  }

  // ----------------------------------------------------------
  // SMOOTH SCROLL
  // ----------------------------------------------------------

  function smoothScrollTo(
    target,
    options = {}
  ) {
    let element = target;

    if (typeof target === "string") {
      element =
        document.querySelector(target);
    }

    if (!element) {
      return;
    }

    const offset =
      Number(options.offset) || 0;

    const top =
      element.getBoundingClientRect().top +
      window.pageYOffset -
      offset;

    window.scrollTo({
      top,
      behavior:
        reducedMotion()
          ? "auto"
          : "smooth"
    });
  }

  // ----------------------------------------------------------
  // PARALLAX
  // ----------------------------------------------------------

  function initParallax(root = document) {
    const elements =
      root.querySelectorAll(
        "[data-parallax]"
      );

    if (
      !elements.length ||
      reducedMotion()
    ) {
      return;
    }

    let ticking = false;

    function update() {
      const scrollY =
        window.pageYOffset;

      elements.forEach(element => {
        const speed =
          Number(
            element.dataset.parallax
          ) || 0.15;

        const rect =
          element.getBoundingClientRect();

        const offset =
          (rect.top + rect.height / 2) -
          window.innerHeight / 2;

        const translate =
          offset * speed;

        element.style.transform =
          `translate3d(0, ${translate}px, 0)`;
      });

      ticking = false;
    }

    function requestUpdate() {
      if (ticking) {
        return;
      }

      ticking = true;

      raf(update);
    }

    window.addEventListener(
      "scroll",
      requestUpdate,
      { passive: true }
    );

    update();

    GHAR.animations.parallaxCleanup =
      () => {
        window.removeEventListener(
          "scroll",
          requestUpdate
        );
      };
  }

  // ----------------------------------------------------------
  // RIPPLE EFFECT
  // ----------------------------------------------------------

  function createRipple(event, element) {
    if (
      reducedMotion() ||
      !element
    ) {
      return;
    }

    const rect =
      element.getBoundingClientRect();

    const ripple =
      document.createElement("span");

    ripple.className =
      "ghar-ripple";

    const size =
      Math.max(
        rect.width,
        rect.height
      );

    const x =
      event.clientX -
      rect.left -
      size / 2;

    const y =
      event.clientY -
      rect.top -
      size / 2;

    ripple.style.width =
      `${size}px`;

    ripple.style.height =
      `${size}px`;

    ripple.style.left =
      `${x}px`;

    ripple.style.top =
      `${y}px`;

    element.appendChild(
      ripple
    );

    window.setTimeout(
      () => {
        ripple.remove();
      },
      650
    );
  }

  function initRipples(root = document) {
    const elements =
      root.querySelectorAll(
        "[data-ripple]"
      );

    elements.forEach(element => {
      if (
        element.dataset.rippleInitialized
      ) {
        return;
      }

      element.dataset.rippleInitialized =
        "true";

      if (
        window.getComputedStyle(
          element
        ).position === "static"
      ) {
        element.style.position =
          "relative";
      }

      element.style.overflow =
        "hidden";

      element.addEventListener(
        "click",
        event => {
          createRipple(
            event,
            element
          );
        }
      );
    });
  }

  // ----------------------------------------------------------
  // HOVER TILT
  // ----------------------------------------------------------

  function initTilt(root = document) {
    const elements =
      root.querySelectorAll(
        "[data-tilt]"
      );

    if (reducedMotion()) {
      return;
    }

    elements.forEach(element => {
      if (
        element.dataset.tiltInitialized
      ) {
        return;
      }

      element.dataset.tiltInitialized =
        "true";

      element.addEventListener(
        "pointermove",
        event => {
          const rect =
            element.getBoundingClientRect();

          const x =
            (event.clientX -
              rect.left) /
            rect.width;

          const y =
            (event.clientY -
              rect.top) /
            rect.height;

          const rotateY =
            (x - 0.5) * 8;

          const rotateX =
            (0.5 - y) * 8;

          element.style.transform =
            `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
        }
      );

      element.addEventListener(
        "pointerleave",
        () => {
          element.style.transform =
            "";
        }
      );
    });
  }

  // ----------------------------------------------------------
  // COUNTER ANIMATION
  // ----------------------------------------------------------

  function animateCounter(
    element,
    options = {}
  ) {
    if (!element) {
      return;
    }

    const target =
      Number(
        options.target ??
        element.dataset.counter ??
        element.textContent
      );

    if (!Number.isFinite(target)) {
      return;
    }

    if (reducedMotion()) {
      element.textContent =
        formatNumber(target);

      return;
    }

    const duration =
      Number(
        options.duration
      ) || 1200;

    const start =
      Number(options.start) || 0;

    const startTime =
      performance.now();

    function update(currentTime) {
      const progress =
        Math.min(
          (currentTime - startTime) /
            duration,
          1
        );

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3
        );

      const value =
        start +
        (target - start) *
          eased;

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

  function formatNumber(value) {
    if (
      Number.isInteger(value)
    ) {
      return value.toLocaleString(
        "en-IN"
      );
    }

    return value.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2
      }
    );
  }

  function initCounters(root = document) {
    const elements =
      root.querySelectorAll(
        "[data-counter]"
      );

    if (
      !elements.length
    ) {
      return;
    }

    if (
      reducedMotion() ||
      !("IntersectionObserver" in window)
    ) {
      elements.forEach(
        element => {
          animateCounter(
            element
          );
        }
      );

      return;
    }

    const observer =
      new IntersectionObserver(
        entries => {
          entries.forEach(
            entry => {
              if (
                !entry.isIntersecting
              ) {
                return;
              }

              animateCounter(
                entry.target
              );

              observer.unobserve(
                entry.target
              );
            }
          );
        },
        {
          threshold: 0.4
        }
      );

    elements.forEach(
      element => {
        observer.observe(
          element
        );
      }
    );
  }

  // ----------------------------------------------------------
  // MODAL ANIMATION
  // ----------------------------------------------------------

  function showModal(modal) {
    if (!modal) {
      return;
    }

    modal.hidden = false;

    raf(() => {
      modal.classList.add(
        "is-open"
      );
    });

    document.body.classList.add(
      "ghar-modal-open"
    );
  }

  function hideModal(modal) {
    if (!modal) {
      return;
    }

    modal.classList.remove(
      "is-open"
    );

    const delay =
      reducedMotion()
        ? 0
        : CONFIG.duration.normal;

    window.setTimeout(
      () => {
        modal.hidden = true;
      },
      delay
    );

    document.body.classList.remove(
      "ghar-modal-open"
    );
  }

  // ----------------------------------------------------------
  // LOADING ANIMATION
  // ----------------------------------------------------------

  function setLoading(
    element,
    loading = true
  ) {
    if (!element) {
      return;
    }

    if (loading) {
      element.setAttribute(
        "aria-busy",
        "true"
      );

      element.classList.add(
        "is-loading"
      );

      return;
    }

    element.setAttribute(
      "aria-busy",
      "false"
    );

    element.classList.remove(
      "is-loading"
    );
  }

  // ----------------------------------------------------------
  // BUTTON LOADING
  // ----------------------------------------------------------

  function buttonLoading(
    button,
    loading = true,
    text = "Processing..."
  ) {
    if (!button) {
      return;
    }

    if (loading) {
      if (
        !button.dataset.originalText
      ) {
        button.dataset.originalText =
          button.textContent;
      }

      button.disabled = true;

      button.setAttribute(
        "aria-busy",
        "true"
      );

      button.classList.add(
        "is-loading"
      );

      if (
        text
      ) {
        button.textContent =
          text;
      }

      return;
    }

    button.disabled = false;

    button.setAttribute(
      "aria-busy",
      "false"
    );

    button.classList.remove(
      "is-loading"
    );

    if (
      button.dataset.originalText
    ) {
      button.textContent =
        button.dataset.originalText;

      delete button.dataset
        .originalText;
    }
  }

  // ----------------------------------------------------------
  // INITIALIZE ALL ANIMATIONS
  // ----------------------------------------------------------

  function init(root = document) {
    initScrollAnimations(root);
    initParallax(root);
    initRipples(root);
    initTilt(root);
    initCounters(root);
  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  GHAR.animations.reveal =
    reveal;

  GHAR.animations.hide =
    hide;

  GHAR.animations.init =
    init;

  GHAR.animations.stagger =
    stagger;

  GHAR.animations.pageEnter =
    pageEnter;

  GHAR.animations.pageExit =
    pageExit;

  GHAR.animations.smoothScrollTo =
    smoothScrollTo;

  GHAR.animations.showModal =
    showModal;

  GHAR.animations.hideModal =
    hideModal;

  GHAR.animations.setLoading =
    setLoading;

  GHAR.animations.buttonLoading =
    buttonLoading;

  GHAR.animations.animateCounter =
    animateCounter;

  GHAR.animations.reducedMotion =
    reducedMotion;

  // ----------------------------------------------------------
  // DOM READY
  // ----------------------------------------------------------

  function initialize() {
    pageEnter();
    init();
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      {
        once: true
      }
    );
  } else {
    initialize();
  }

})(window, document);