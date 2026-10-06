// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/toast.js
// Global Notification Toast System
// ============================================================

"use strict";

(function (window, document) {

  const GHAR =
    window.GHAR =
    window.GHAR || {};

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const CONFIG = Object.freeze({

    version: "2.0.0",

    position:
      "top-right",

    maxVisible:
      5,

    defaultDuration:
      4000,

    errorDuration:
      6000,

    animationDuration:
      250,

    pauseOnHover:
      true,

    preventDuplicates:
      true,

    ariaLive:
      "polite"

  });

  // ==========================================================
  // STATE
  // ==========================================================

  const state = {

    initialized:
      false,

    container:
      null,

    toasts:
      new Map(),

    counter:
      0

  };

  // ==========================================================
  // HELPERS
  // ==========================================================

  function escapeHTML(value) {

    return String(
      value ?? ""
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }

  function createId() {

    state.counter += 1;

    return (
      `ghar-toast-${Date.now()}-${state.counter}`
    );

  }

  function getTypeClass(type) {

    const allowed = [
      "success",
      "error",
      "warning",
      "info"
    ];

    return allowed.includes(type)
      ? type
      : "info";

  }

  // ==========================================================
  // INITIALIZE
  // ==========================================================

  function init() {

    if (
      state.initialized &&
      state.container
    ) {

      return state.container;

    }

    let container =
      document.querySelector(
        ".ghar-toast-container"
      );

    if (!container) {

      container =
        document.createElement(
          "div"
        );

      container.className =
        "ghar-toast-container";

      document.body.appendChild(
        container
      );

    }

    container.dataset.position =
      CONFIG.position;

    container.setAttribute(
      "aria-live",
      CONFIG.ariaLive
    );

    container.setAttribute(
      "aria-atomic",
      "false"
    );

    container.setAttribute(
      "role",
      "region"
    );

    container.setAttribute(
      "aria-label",
      "Notifications"
    );

    state.container =
      container;

    state.initialized =
      true;

    return container;

  }

  // ==========================================================
  // SHOW TOAST
  // ==========================================================

  function show(
    message,
    options = {}
  ) {

    init();

    const {

      type = "info",

      title = "",

      duration =
        type === "error"
          ? CONFIG.errorDuration
          : CONFIG.defaultDuration,

      closable = true,

      pauseOnHover =
        CONFIG.pauseOnHover,

      id = null,

      allowDuplicate =
        !CONFIG.preventDuplicates,

      action = null,

      onClick = null,

      onClose = null,

      onShow = null

    } = options;

    const normalizedType =
      getTypeClass(type);

    const text =
      String(
        message ?? ""
      ).trim();

    if (!text) {
      return null;
    }

    // ========================================================
    // DUPLICATE PROTECTION
    // ========================================================

    if (!allowDuplicate) {

      const duplicate =
        Array.from(
          state.toasts.values()
        ).find(
          toast =>
            toast.message === text &&
            toast.type === normalizedType
        );

      if (duplicate) {

        duplicate.resetTimer();

        return duplicate;

      }

    }

    // ========================================================
    // LIMIT VISIBLE TOASTS
    // ========================================================

    while (
      state.toasts.size >=
      CONFIG.maxVisible
    ) {

      const oldest =
        state.toasts.values().next().value;

      if (!oldest) {
        break;
      }

      oldest.close();

    }

    const toastId =
      id ||
      createId();

    const toast =
      document.createElement(
        "div"
      );

    toast.className =
      `ghar-toast ghar-toast-${normalizedType}`;

    toast.dataset.toastId =
      toastId;

    toast.setAttribute(
      "role",
      normalizedType === "error"
        ? "alert"
        : "status"
    );

    toast.setAttribute(
      "tabindex",
      "0"
    );

    // ========================================================
    // CONTENT
    // ========================================================

    toast.innerHTML = `

      <div class="ghar-toast-content">

        ${
          title
            ? `
              <strong
                class="ghar-toast-title"
              >
                ${escapeHTML(title)}
              </strong>
            `
            : ""
        }

        <div
          class="ghar-toast-message"
        >
          ${escapeHTML(text)}
        </div>

        ${
          action?.label
            ? `
              <button
                type="button"
                class="ghar-toast-action"
              >
                ${escapeHTML(
                  action.label
                )}
              </button>
            `
            : ""
        }

      </div>

      ${
        closable
          ? `
            <button
              type="button"
              class="ghar-toast-close"
              aria-label="Close notification"
            >
              &times;
            </button>
          `
          : ""
      }

      ${
        duration > 0
          ? `
            <div
              class="ghar-toast-progress"
              aria-hidden="true"
            ></div>
          `
          : ""
      }

    `;

    state.container.appendChild(
      toast
    );

    // ========================================================
    // TOAST INSTANCE
    // ========================================================

    let timer = null;

    let remaining =
      duration;

    let startedAt =
      Date.now();

    let closed =
      false;

    function clearTimer() {

      if (timer) {

        clearTimeout(
          timer
        );

        timer = null;

      }

    }

    function startTimer() {

      clearTimer();

      if (
        remaining <= 0
      ) {
        return;
      }

      startedAt =
        Date.now();

      timer =
        setTimeout(
          () => close(),
          remaining
        );

    }

    function pauseTimer() {

      if (!timer) {
        return;
      }

      remaining -=
        Date.now() -
        startedAt;

      clearTimer();

    }

    function resetTimer() {

      remaining =
        duration;

      startTimer();

    }

    function close() {

      if (closed) {
        return;
      }

      closed = true;

      clearTimer();

      state.toasts.delete(
        toastId
      );

      toast.classList.remove(
        "is-visible"
      );

      toast.classList.add(
        "is-closing"
      );

      setTimeout(
        () => {

          toast.remove();

          if (
            typeof onClose ===
            "function"
          ) {

            onClose(
              toast
            );

          }

          document.dispatchEvent(
            new CustomEvent(
              "ghar:toast:close",
              {
                detail: {
                  id: toastId,
                  type:
                    normalizedType
                }
              }
            )
          );

        },
        CONFIG.animationDuration
      );

    }

    const instance = {

      id:
        toastId,

      element:
        toast,

      message:
        text,

      type:
        normalizedType,

      close,

      resetTimer,

      pause:
        pauseTimer,

      resume:
        startTimer

    };

    state.toasts.set(
      toastId,
      instance
    );

    // ========================================================
    // CLOSE BUTTON
    // ========================================================

    const closeButton =
      toast.querySelector(
        ".ghar-toast-close"
      );

    closeButton?.addEventListener(
      "click",
      close
    );

    // ========================================================
    // ACTION BUTTON
    // ========================================================

    const actionButton =
      toast.querySelector(
        ".ghar-toast-action"
      );

    actionButton?.addEventListener(
      "click",
      event => {

        if (
          typeof action?.onClick ===
          "function"
        ) {

          action.onClick(
            event,
            instance
          );

        }

        close();

      }
    );

    // ========================================================
    // TOAST CLICK
    // ========================================================

    if (
      typeof onClick ===
      "function"
    ) {

      toast.addEventListener(
        "click",
        event => {

          if (
            event.target.closest(
              ".ghar-toast-close"
            ) ||
            event.target.closest(
              ".ghar-toast-action"
            )
          ) {
            return;
          }

          onClick(
            event,
            instance
          );

        }
      );

    }

    // ========================================================
    // KEYBOARD
    // ========================================================

    toast.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Escape"
        ) {

          event.preventDefault();

          close();

        }

      }
    );

    // ========================================================
    // PAUSE ON HOVER
    // ========================================================

    if (pauseOnHover) {

      toast.addEventListener(
        "mouseenter",
        pauseTimer
      );

      toast.addEventListener(
        "mouseleave",
        startTimer
      );

    }

    // ========================================================
    // SHOW ANIMATION
    // ========================================================

    requestAnimationFrame(
      () => {

        toast.classList.add(
          "is-visible"
        );

      }
    );

    // ========================================================
    // PROGRESS BAR
    // ========================================================

    const progress =
      toast.querySelector(
        ".ghar-toast-progress"
      );

    if (
      progress &&
      duration > 0
    ) {

      progress.style.animationDuration =
        `${duration}ms`;

    }

    // ========================================================
    // START TIMER
    // ========================================================

    startTimer();

    // ========================================================
    // CALLBACK
    // ========================================================

    if (
      typeof onShow ===
      "function"
    ) {

      onShow(
        toast,
        instance
      );

    }

    // ========================================================
    // EVENT
    // ========================================================

    document.dispatchEvent(
      new CustomEvent(
        "ghar:toast:show",
        {
          detail: {
            id:
              toastId,

            type:
              normalizedType,

            message:
              text
          }
        }
      )
    );

    return instance;

  }

  // ==========================================================
  // SUCCESS
  // ==========================================================

  function success(
    message,
    options = {}
  ) {

    return show(
      message,
      {
        ...options,
        type: "success"
      }
    );

  }

  // ==========================================================
  // ERROR
  // ==========================================================

  function error(
    message,
    options = {}
  ) {

    return show(
      message,
      {
        ...options,
        type: "error",

        duration:
          options.duration ??
          CONFIG.errorDuration
      }
    );

  }

  // ==========================================================
  // WARNING
  // ==========================================================

  function warning(
    message,
    options = {}
  ) {

    return show(
      message,
      {
        ...options,
        type: "warning"
      }
    );

  }

  // ==========================================================
  // INFO
  // ==========================================================

  function info(
    message,
    options = {}
  ) {

    return show(
      message,
      {
        ...options,
        type: "info"
      }
    );

  }

  // ==========================================================
  // CLEAR ONE
  // ==========================================================

  function close(
    id
  ) {

    const toast =
      state.toasts.get(
        id
      );

    if (toast) {

      toast.close();

      return true;

    }

    return false;

  }

  // ==========================================================
  // CLEAR ALL
  // ==========================================================

  function clear() {

    Array.from(
      state.toasts.values()
    ).forEach(
      toast =>
        toast.close()
    );

  }

  // ==========================================================
  // COUNT
  // ==========================================================

  function count() {

    return state.toasts.size;

  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  const Toast = {

    version:
      CONFIG.version,

    config:
      CONFIG,

    state,

    init,

    show,

    success,

    error,

    warning,

    info,

    close,

    clear,

    count,

    escapeHTML

  };

  // ==========================================================
  // GLOBAL EXPORTS
  // ==========================================================

  GHAR.Toast =
    Toast;

  window.GHARTOAST =
    Toast;

  // ==========================================================
  // AUTO INITIALIZATION
  // ==========================================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );

  } else {

    init();

  }

})(window, document);