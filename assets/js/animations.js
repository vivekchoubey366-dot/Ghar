// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/animations.js
// Global UI Animations & Motion System
// ============================================================

"use strict";

(function (window, document) {

  // ==========================================================
  // GHAR NAMESPACE
  // ==========================================================

  window.GHAR = window.GHAR || {};

  const GHAR = window.GHAR;

  GHAR.animations = GHAR.animations || {};

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const CONFIG = {

    selector: "[data-animate]",

    observer: {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px"
    },

    stagger: 80,

    duration: {
      instant: 0,
      fast: 180,
      normal: 300,
      medium: 400,
      slow: 500,
      page: 650
    },

    easing: {
      standard: "cubic-bezier(0.22, 1, 0.36, 1)",
      smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
      spring: "cubic-bezier(0.34, 1.56, 0.64, 1)"
    },

    parallax: {
      defaultSpeed: 0.15,
      maxSpeed: 0.5
    },

    tilt: {
      maxRotation: 8,
      perspective: 900
    },

    ripple: {
      duration: 650
    },

    counter: {
      duration: 1200
    }

  };

  GHAR.animations.config = CONFIG;

  // ==========================================================
  // INTERNAL STATE
  // ==========================================================

  const state = {

    initialized: false,

    scrollObserver: null,

    counterObserver: null,

    mutationObserver: null,

    parallaxElements: new Set(),

    tiltElements: new Set(),

    rippleElements: new Set(),

    parallaxTicking: false,

    cleanupFunctions: [],

    reducedMotionMedia: null

  };

  // ==========================================================
  // REDUCED MOTION
  // ==========================================================

  state.reducedMotionMedia =
    window.matchMedia
      ? window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        )
      : null;

  function reducedMotion() {

    return Boolean(
      state.reducedMotionMedia &&
      state.reducedMotionMedia.matches
    );

  }

  // ==========================================================
  // SAFE REQUEST ANIMATION FRAME
  // ==========================================================

  function raf(callback) {

    if (
      typeof window.requestAnimationFrame ===
      "function"
    ) {

      return window.requestAnimationFrame(
        callback
      );

    }

    return window.setTimeout(
      callback,
      16
    );

  }

  function cancelRaf(id) {

    if (
      typeof window.cancelAnimationFrame ===
      "function"
    ) {

      window.cancelAnimationFrame(
        id
      );

    } else {

      window.clearTimeout(id);

    }

  }

  // ==========================================================
  // ELEMENT CHECK
  // ==========================================================

  function isElement(element) {

    return (
      element instanceof
      Element
    );

  }

  // ==========================================================
  // VISIBILITY
  // ==========================================================

  function isVisible(element) {

    if (!isElement(element)) {
      return false;
    }

    const style =
      window.getComputedStyle(
        element
      );

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );

  }

  // ==========================================================
  // REVEAL
  // ==========================================================

  function reveal(
    element,
    options = {}
  ) {

    if (!isElement(element)) {
      return;
    }

    if (reducedMotion()) {

      element.style.opacity = "1";
      element.style.transform = "none";

      element.style.removeProperty(
        "animation-duration"
      );

      element.style.removeProperty(
        "animation-delay"
      );

      element.classList.add(
        "is-visible"
      );

      element.dataset.animationState =
        "visible";

      return;

    }

    const duration =
      Number(
        options.duration ??
        CONFIG.duration.normal
      );

    const delay =
      Number(
        options.delay ??
        element.dataset.animateDelay ??
        0
      );

    const easing =
      options.easing ||
      CONFIG.easing.standard;

    const animation =
      options.animation ||
      element.dataset.animate ||
      "fade-up";

    element.style.animationDuration =
      `${Math.max(0, duration)}ms`;

    element.style.animationTimingFunction =
      easing;

    element.style.animationDelay =
      `${Math.max(0, delay)}ms`;

    element.dataset.animationState =
      "visible";

    element.classList.add(
      "gh-animate",
      `gh-animate-${animation}`,
      "is-visible"
    );

  }

  // ==========================================================
  // HIDE
  // ==========================================================

  function hide(element) {

    if (!isElement(element)) {
      return;
    }

    element.classList.remove(
      "is-visible"
    );

    element.dataset.animationState =
      "hidden";

  }

  // ==========================================================
  // RESET
  // ==========================================================

  function reset(element) {

    if (!isElement(element)) {
      return;
    }

    element.classList.remove(
      "is-visible",
      "gh-animate"
    );

    element.dataset.animationState =
      "hidden";

    element.style.removeProperty(
      "animation-duration"
    );

    element.style.removeProperty(
      "animation-delay"
    );

    element.style.removeProperty(
      "animation-timing-function"
    );

  }

  // ==========================================================
  // SCROLL ANIMATIONS
  // ==========================================================

  function initScrollAnimations(
    root = document
  ) {

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

      elements.forEach(
        element => reveal(element)
      );

      return;

    }

    if (!state.scrollObserver) {

      state.scrollObserver =
        new IntersectionObserver(
          entries => {

            entries.forEach(
              entry => {

                if (
                  !entry.isIntersecting
                ) {
                  return;
                }

                const element =
                  entry.target;

                const animation =
                  element.dataset.animate ||
                  "fade-up";

                const delay =
                  Number(
                    element.dataset.animateDelay ||
                    0
                  );

                reveal(
                  element,
                  {
                    animation,
                    delay
                  }
                );

                state.scrollObserver.unobserve(
                  element
                );

              }
            );

          },
          CONFIG.observer
        );

      GHAR.animations.scrollObserver =
        state.scrollObserver;

    }

    elements.forEach(
      element => {

        if (
          element.dataset.animationObserved ===
          "true"
        ) {
          return;
        }

        if (
          element.dataset.animationState ===
          "visible"
        ) {
          return;
        }

        element.dataset.animationObserved =
          "true";

        state.scrollObserver.observe(
          element
        );

      }
    );

  }

  // ==========================================================
  // STAGGER
  // ==========================================================

  function stagger(
    container,
    selector = ":scope > *",
    options = {}
  ) {

    if (!isElement(container)) {
      return;
    }

    const children =
      container.querySelectorAll(
        selector
      );

    const baseDelay =
      Number(
        options.delay || 0
      );

    const amount =
      Number(
        options.stagger ??
        CONFIG.stagger
      );

    children.forEach(
      (child, index) => {

        const delay =
          baseDelay +
          index * amount;

        child.style.setProperty(
          "--ghar-animation-delay",
          `${delay}ms`
        );

        child.dataset.animateDelay =
          String(delay);

        if (
          !child.dataset.animate
        ) {

          child.dataset.animate =
            options.animation ||
            "fade-up";

        }

      }
    );

    initScrollAnimations(
      container
    );

  }

  // ==========================================================
  // PAGE ENTER
  // ==========================================================

  function pageEnter() {

    if (reducedMotion()) {

      document.documentElement.classList.add(
        "ghar-page-ready"
      );

      document.body.classList.add(
        "ghar-page-entered"
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

      document.body.classList.remove(
        "ghar-page-exiting"
      );

    });

  }

  // ==========================================================
  // PAGE EXIT
  // ==========================================================

  function pageExit(
    callback
  ) {

    if (
      typeof callback !==
      "function"
    ) {
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

  // ==========================================================
  // SMOOTH SCROLL
  // ==========================================================

  function smoothScrollTo(
    target,
    options = {}
  ) {

    let element = target;

    if (
      typeof target ===
      "string"
    ) {

      try {

        element =
          document.querySelector(
            target
          );

      } catch {

        return;

      }

    }

    if (!isElement(element)) {
      return;
    }

    const offset =
      Number(
        options.offset || 0
      );

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

  // ==========================================================
  // PARALLAX
  // ==========================================================

  function initParallax(
    root = document
  ) {

    if (reducedMotion()) {
      return;
    }

    const elements =
      root.querySelectorAll(
        "[data-parallax]"
      );

    if (!elements.length) {
      return;
    }

    elements.forEach(
      element => {

        state.parallaxElements.add(
          element
        );

      }
    );

    if (
      !state.parallaxListener
    ) {

      state.parallaxListener =
        () => {

          if (
            state.parallaxTicking
          ) {
            return;
          }

          state.parallaxTicking =
            true;

          raf(
            updateParallax
          );

        };

      window.addEventListener(
        "scroll",
        state.parallaxListener,
        {
          passive: true
        }
      );

      state.cleanupFunctions.push(
        () => {

          window.removeEventListener(
            "scroll",
            state.parallaxListener
          );

        }
      );

    }

    updateParallax();

  }

  function updateParallax() {

    if (reducedMotion()) {

      state.parallaxTicking =
        false;

      return;

    }

    const viewportHeight =
      window.innerHeight;

    state.parallaxElements.forEach(
      element => {

        if (
          !element.isConnected
        ) {

          state.parallaxElements.delete(
            element
          );

          return;

        }

        const rect =
          element.getBoundingClientRect();

        const speed =
          Math.min(
            Math.max(
              Number(
                element.dataset.parallax
              ) ||
              CONFIG.parallax.defaultSpeed,
              -CONFIG.parallax.maxSpeed
            ),
            CONFIG.parallax.maxSpeed
          );

        const center =
          rect.top +
          rect.height / 2;

        const offset =
          center -
          viewportHeight / 2;

        const translate =
          offset * speed;

        element.style.transform =
          `translate3d(0, ${translate.toFixed(2)}px, 0)`;

      }
    );

    state.parallaxTicking =
      false;

  }

  // ==========================================================
  // RIPPLE
  // ==========================================================

  function createRipple(
    event,
    element
  ) {

    if (
      reducedMotion() ||
      !isElement(element)
    ) {
      return;
    }

    const rect =
      element.getBoundingClientRect();

    const ripple =
      document.createElement(
        "span"
      );

    ripple.className =
      "ghar-ripple";

    const size =
      Math.max(
        rect.width,
        rect.height
      );

    let clientX =
      event.clientX;

    let clientY =
      event.clientY;

    if (
      event.touches &&
      event.touches[0]
    ) {

      clientX =
        event.touches[0].clientX;

      clientY =
        event.touches[0].clientY;

    }

    const x =
      clientX -
      rect.left -
      size / 2;

    const y =
      clientY -
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

    ripple.setAttribute(
      "aria-hidden",
      "true"
    );

    element.appendChild(
      ripple
    );

    window.setTimeout(
      () => {

        if (
          ripple.isConnected
        ) {
          ripple.remove();
        }

      },
      CONFIG.ripple.duration
    );

  }

  function initRipples(
    root = document
  ) {

    const elements =
      root.querySelectorAll(
        "[data-ripple]"
      );

    elements.forEach(
      element => {

        if (
          element.dataset.rippleInitialized ===
          "true"
        ) {
          return;
        }

        element.dataset.rippleInitialized =
          "true";

        state.rippleElements.add(
          element
        );

        const computed =
          window.getComputedStyle(
            element
          );

        if (
          computed.position ===
          "static"
        ) {

          element.style.position =
            "relative";

        }

        if (
          computed.overflow ===
          "visible"
        ) {

          element.style.overflow =
            "hidden";

        }

        const handler =
          event => {

            createRipple(
              event,
              element
            );

          };

        element.addEventListener(
          "click",
          handler
        );

        element._gharRippleHandler =
          handler;

      }
    );

  }

  // ==========================================================
  // TILT
  // ==========================================================

  function initTilt(
    root = document
  ) {

    if (reducedMotion()) {
      return;
    }

    const elements =
      root.querySelectorAll(
        "[data-tilt]"
      );

    elements.forEach(
      element => {

        if (
          element.dataset.tiltInitialized ===
          "true"
        ) {
          return;
        }

        element.dataset.tiltInitialized =
          "true";

        state.tiltElements.add(
          element
        );

        element.style.willChange =
          "transform";

        const move =
          event => {

            if (
              event.pointerType ===
              "touch"
            ) {
              return;
            }

            const rect =
              element.getBoundingClientRect();

            if (
              rect.width === 0 ||
              rect.height === 0
            ) {
              return;
            }

            const x =
              (
                event.clientX -
                rect.left
              ) /
              rect.width;

            const y =
              (
                event.clientY -
                rect.top
              ) /
              rect.height;

            const maxRotation =
              Number(
                element.dataset.tiltMax
              ) ||
              CONFIG.tilt.maxRotation;

            const rotateY =
              (
                x - 0.5
              ) *
              maxRotation;

            const rotateX =
              (
                0.5 - y
              ) *
              maxRotation;

            element.style.transform =
              `perspective(${CONFIG.tilt.perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(0)`;

          };

        const reset =
          () => {

            element.style.transform =
              "";

          };

        element.addEventListener(
          "pointermove",
          move,
          {
            passive: true
          }
        );

        element.addEventListener(
          "pointerleave",
          reset
        );

        element._gharTiltHandlers = {
          move,
          reset
        };

      }
    );

  }

  // ==========================================================
  // COUNTERS
  // ==========================================================

  function formatNumber(
    value
  ) {

    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return "0";
    }

    if (
      Number.isInteger(number)
    ) {

      return number.toLocaleString(
        "en-IN"
      );

    }

    return number.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2
      }
    );

  }

  function animateCounter(
    element,
    options = {}
  ) {

    if (!isElement(element)) {
      return;
    }

    const target =
      Number(
        options.target ??
        element.dataset.counter ??
        element.textContent
      );

    if (
      !Number.isFinite(target)
    ) {
      return;
    }

    if (
      element.dataset.counterAnimated ===
      "true"
    ) {
      return;
    }

    element.dataset.counterAnimated =
      "true";

    if (reducedMotion()) {

      element.textContent =
        formatNumber(target);

      return;

    }

    const duration =
      Math.max(
        0,
        Number(
          options.duration ??
          CONFIG.counter.duration
        )
      );

    const start =
      Number(
        options.start ?? 0
      );

    const startTime =
      performance.now();

    function update(
      currentTime
    ) {

      const progress =
        duration === 0
          ? 1
          : Math.min(
              (
                currentTime -
                startTime
              ) /
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
        (
          target -
          start
        ) *
        eased;

      element.textContent =
        formatNumber(value);

      if (
        progress < 1
      ) {

        element._gharCounterRaf =
          requestAnimationFrame(
            update
          );

      } else {

        element.textContent =
          formatNumber(target);

        delete element._gharCounterRaf;

      }

    }

    element._gharCounterRaf =
      requestAnimationFrame(
        update
      );

  }

  function initCounters(
    root = document
  ) {

    const elements =
      root.querySelectorAll(
        "[data-counter]"
      );

    if (!elements.length) {
      return;
    }

    if (
      reducedMotion() ||
      !("IntersectionObserver" in window)
    ) {

      elements.forEach(
        element =>
          animateCounter(element)
      );

      return;

    }

    if (
      !state.counterObserver
    ) {

      state.counterObserver =
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

                state.counterObserver.unobserve(
                  entry.target
                );

              }
            );

          },
          {
            threshold: 0.4
          }
        );

      GHAR.animations.counterObserver =
        state.counterObserver;

    }

    elements.forEach(
      element => {

        if (
          element.dataset.counterAnimated ===
          "true"
        ) {
          return;
        }

        state.counterObserver.observe(
          element
        );

      }
    );

  }

  // ==========================================================
  // MODAL ANIMATION
  // ==========================================================

  function showModal(
    modal
  ) {

    if (!isElement(modal)) {
      return;
    }

    modal.hidden = false;

    if (reducedMotion()) {

      modal.classList.add(
        "is-open"
      );

      document.body.classList.add(
        "ghar-modal-open"
      );

      return;

    }

    raf(() => {

      modal.classList.add(
        "is-open"
      );

    });

    document.body.classList.add(
      "ghar-modal-open"
    );

  }

  function hideModal(
    modal
  ) {

    if (!isElement(modal)) {
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

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  function setLoading(
    element,
    loading = true
  ) {

    if (!isElement(element)) {
      return;
    }

    element.classList.toggle(
      "is-loading",
      Boolean(loading)
    );

    element.setAttribute(
      "aria-busy",
      loading
        ? "true"
        : "false"
    );

  }

  // ==========================================================
  // BUTTON LOADING
  // ==========================================================

  function buttonLoading(
    button,
    loading = true,
    text = "Processing..."
  ) {

    if (!isElement(button)) {
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

      if (text) {

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
      button.dataset.originalText !==
      undefined
    ) {

      button.textContent =
        button.dataset.originalText;

      delete button.dataset.originalText;

    }

  }

  // ==========================================================
  // AUTO ANIMATION FOR DYNAMIC CONTENT
  // ==========================================================

  function initMutationObserver() {

    if (
      !("MutationObserver" in window)
    ) {
      return;
    }

    if (
      state.mutationObserver
    ) {
      return;
    }

    state.mutationObserver =
      new MutationObserver(
        mutations => {

          mutations.forEach(
            mutation => {

              mutation.addedNodes.forEach(
                node => {

                  if (
                    node.nodeType !==
                    Node.ELEMENT_NODE
                  ) {
                    return;
                  }

                  initScrollAnimations(
                    node
                  );

                  initParallax(
                    node
                  );

                  initRipples(
                    node
                  );

                  initTilt(
                    node
                  );

                  initCounters(
                    node
                  );

                }
              );

            }
          );

        }
      );

    state.mutationObserver.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );

  }

  // ==========================================================
  // CLEANUP
  // ==========================================================

  function cleanup() {

    if (
      state.scrollObserver
    ) {

      state.scrollObserver.disconnect();

      state.scrollObserver =
        null;

    }

    if (
      state.counterObserver
    ) {

      state.counterObserver.disconnect();

      state.counterObserver =
        null;

    }

    if (
      state.mutationObserver
    ) {

      state.mutationObserver.disconnect();

      state.mutationObserver =
        null;

    }

    state.cleanupFunctions.forEach(
      cleanupFunction => {

        try {

          cleanupFunction();

        } catch (error) {

          console.error(
            "[GHAR Animations] Cleanup error:",
            error
          );

        }

      }
    );

    state.cleanupFunctions = [];

    state.parallaxElements.clear();

    state.tiltElements.clear();

    state.rippleElements.clear();

  }

  // ==========================================================
  // REFRESH
  // ==========================================================

  function refresh(
    root = document
  ) {

    initScrollAnimations(root);
    initParallax(root);
    initRipples(root);
    initTilt(root);
    initCounters(root);

  }

  // ==========================================================
  // INITIALIZE
  // ==========================================================

  function init(
    root = document
  ) {

    refresh(root);

    if (
      root === document
    ) {

      initMutationObserver();

    }

    state.initialized =
      true;

    return GHAR.animations;

  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  GHAR.animations.reveal =
    reveal;

  GHAR.animations.hide =
    hide;

  GHAR.animations.reset =
    reset;

  GHAR.animations.init =
    init;

  GHAR.animations.refresh =
    refresh;

  GHAR.animations.cleanup =
    cleanup;

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

  GHAR.animations.createRipple =
    createRipple;

  GHAR.animations.isVisible =
    isVisible;

  GHAR.animations.formatNumber =
    formatNumber;

  // Backward-compatible observer references

  Object.defineProperty(
    GHAR.animations,
    "scrollObserver",
    {
      configurable: true,
      get() {
        return state.scrollObserver;
      }
    }
  );

  Object.defineProperty(
    GHAR.animations,
    "counterObserver",
    {
      configurable: true,
      get() {
        return state.counterObserver;
      }
    }
  );

  // ==========================================================
  // DOM READY
  // ==========================================================

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