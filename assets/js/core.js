// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/core.js
// Core Application Controller
// ============================================================

"use strict";

(function (window, document) {

  // ==========================================================
  // GHAR NAMESPACE
  // ==========================================================

  const GHAR = window.GHAR || {};

  const CONFIG =
    GHAR.config || {};

  const CONSTANTS =
    GHAR.constants || {};

  const STORAGE =
    GHAR.storage || {};

  const API =
    GHAR.api || {};

  const AUTH =
    GHAR.auth || {};

  // ==========================================================
  // CORE CONFIGURATION
  // ==========================================================

  const CORE_CONFIG = {

    appName:
      CONFIG.appName ||
      "GHAR",

    version:
      CONFIG.version ||
      "1.0.0",

    environment:
      CONFIG.environment ||
      "production",

    apiBaseUrl:
      CONFIG.apiBaseUrl ||
      "/api",

    defaultPage:
      "/index.html",

    loginPage:
      CONFIG.routes?.login ||
      "/login.html",

    errorPage:
      "/404.html",

    offlinePage:
      "/offline.html"

  };

  // ==========================================================
  // APPLICATION STATE
  // ==========================================================

  const state = {

    initialized: false,

    ready: false,

    online:
      navigator.onLine,

    loading: false,

    currentPage:
      window.location.pathname,

    currentUser:
      null,

    role:
      null,

    lastError:
      null,

    navigation:
      null,

    device: {
      mobile:
        window.matchMedia(
          "(max-width: 767px)"
        ).matches,

      tablet:
        window.matchMedia(
          "(min-width: 768px) and (max-width: 1024px)"
        ).matches,

      desktop:
        window.matchMedia(
          "(min-width: 1025px)"
        ).matches
    }

  };

  // ==========================================================
  // UTILITIES
  // ==========================================================

  function isFunction(value) {

    return (
      typeof value ===
      "function"
    );

  }

  function isObject(value) {

    return (
      value !== null &&
      typeof value ===
      "object" &&
      !Array.isArray(value)
    );

  }

  function safeJsonParse(
    value,
    fallback = null
  ) {

    if (
      typeof value !==
      "string"
    ) {

      return value;

    }

    try {

      return JSON.parse(
        value
      );

    } catch (_) {

      return fallback;

    }

  }

  function debounce(
    callback,
    delay = 250
  ) {

    let timer = null;

    return function (...args) {

      clearTimeout(timer);

      timer =
        setTimeout(
          () => {
            callback.apply(
              this,
              args
            );
          },
          delay
        );

    };

  }

  function throttle(
    callback,
    delay = 250
  ) {

    let waiting = false;

    return function (...args) {

      if (
        waiting
      ) {

        return;

      }

      callback.apply(
        this,
        args
      );

      waiting = true;

      setTimeout(
        () => {
          waiting = false;
        },
        delay
      );

    };

  }

  function generateId(
    prefix = "ghar"
  ) {

    return (
      `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`
    );

  }

  // ==========================================================
  // DOM HELPERS
  // ==========================================================

  function $(selector, root = document) {

    return root.querySelector(
      selector
    );

  }

  function $$(selector, root = document) {

    return Array.from(
      root.querySelectorAll(
        selector
      )
    );

  }

  function createElement(
    tag,
    options = {}
  ) {

    const element =
      document.createElement(
        tag
      );

    if (
      options.className
    ) {

      element.className =
        options.className;

    }

    if (
      options.id
    ) {

      element.id =
        options.id;

    }

    if (
      options.text
    ) {

      element.textContent =
        options.text;

    }

    if (
      options.html
    ) {

      element.innerHTML =
        options.html;

    }

    if (
      isObject(options.attributes)
    ) {

      Object.entries(
        options.attributes
      ).forEach(
        ([key, value]) => {

          element.setAttribute(
            key,
            value
          );

        }
      );

    }

    return element;

  }

  // ==========================================================
  // PAGE INFORMATION
  // ==========================================================

  function getCurrentPage() {

    return {
      path:
        window.location.pathname,

      search:
        window.location.search,

      hash:
        window.location.hash,

      url:
        window.location.href
    };

  }

  function getQueryParams() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const result = {};

    params.forEach(
      (value, key) => {

        result[key] =
          value;

      }
    );

    return result;

  }

  function getQueryParam(
    name,
    fallback = null
  ) {

    const value =
      new URLSearchParams(
        window.location.search
      ).get(name);

    return (
      value === null
        ? fallback
        : value
    );

  }

  // ==========================================================
  // EVENT BUS
  // ==========================================================

  const events = {};

  function on(
    event,
    handler
  ) {

    if (
      !isFunction(handler)
    ) {

      return () => {};

    }

    if (
      !events[event]
    ) {

      events[event] = [];

    }

    events[event].push(
      handler
    );

    return () =>
      off(
        event,
        handler
      );

  }

  function off(
    event,
    handler
  ) {

    if (
      !events[event]
    ) {

      return;

    }

    events[event] =
      events[event].filter(
        item =>
          item !== handler
      );

  }

  function emit(
    event,
    detail = {}
  ) {

    if (
      events[event]
    ) {

      events[event].forEach(
        handler => {

          try {

            handler(
              detail
            );

          } catch (error) {

            console.error(
              `[GHAR EVENT] ${event}`,
              error
            );

          }

        }
      );

    }

    try {

      window.dispatchEvent(
        new CustomEvent(
          `ghar:${event}`,
          {
            detail
          }
        )
      );

    } catch (_) {}

  }

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  function setLoading(
    loading,
    message = ""
  ) {

    state.loading =
      Boolean(
        loading
      );

    document.documentElement
      .classList.toggle(
        "ghar-loading",
        state.loading
      );

    const indicators =
      $$(
        "[data-ghar-loading]"
      );

    indicators.forEach(
      element => {

        element.hidden =
          !state.loading;

        if (
          message
        ) {

          element.textContent =
            message;

        }

      }
    );

    emit(
      "loading",
      {
        loading:
          state.loading,

        message
      }
    );

  }

  // ==========================================================
  // NOTIFICATION SYSTEM
  // ==========================================================

  function notify(
    message,
    type = "info",
    options = {}
  ) {

    const duration =
      Number(
        options.duration ||
        4000
      );

    let container =
      $(
        "[data-ghar-notifications]"
      );

    if (
      !container
    ) {

      container =
        createElement(
          "div",
          {
            className:
              "ghar-notification-container",

            attributes: {
              "data-ghar-notifications":
                "true",

              "aria-live":
                "polite",

              "aria-atomic":
                "true"
            }
          }
        );

      document.body.appendChild(
        container
      );

    }

    const item =
      createElement(
        "div",
        {
          className:
            `ghar-notification ghar-notification-${type}`,

          attributes: {
            role:
              type === "error"
                ? "alert"
                : "status"
          }
        }
      );

    const content =
      createElement(
        "div",
        {
          className:
            "ghar-notification-content",

          text:
            String(message)
        }
      );

    const close =
      createElement(
        "button",
        {
          className:
            "ghar-notification-close",

          text:
            "×",

          attributes: {
            type:
              "button",

            "aria-label":
              "Close notification"
          }
        }
      );

    close.addEventListener(
      "click",
      () => {

        item.remove();

      }
    );

    item.append(
      content,
      close
    );

    container.appendChild(
      item
    );

    if (
      duration > 0
    ) {

      setTimeout(
        () => {

          if (
            item.isConnected
          ) {

            item.remove();

          }

        },
        duration
      );

    }

    emit(
      "notification",
      {
        message,
        type
      }
    );

    return item;

  }

  // ==========================================================
  // ERROR HANDLING
  // ==========================================================

  function handleError(
    error,
    options = {}
  ) {

    const message =
      error?.message ||
      String(error) ||
      "Something went wrong.";

    state.lastError =
      error;

    console.error(
      "[GHAR ERROR]",
      error
    );

    if (
      options.notify !== false
    ) {

      notify(
        message,
        "error"
      );

    }

    emit(
      "error",
      {
        error,
        message
      }
    );

    return error;

  }

  // ==========================================================
  // ONLINE / OFFLINE
  // ==========================================================

  function updateNetworkState(
    online
  ) {

    state.online =
      Boolean(
        online
      );

    document.documentElement
      .classList.toggle(
        "ghar-online",
        state.online
      );

    document.documentElement
      .classList.toggle(
        "ghar-offline",
        !state.online
      );

    emit(
      state.online
        ? "online"
        : "offline",
      {
        online:
          state.online
      }
    );

  }

  function handleOnline() {

    updateNetworkState(
      true
    );

    notify(
      "Internet connection restored.",
      "success"
    );

  }

  function handleOffline() {

    updateNetworkState(
      false
    );

    notify(
      "You are offline. Some GHAR features may be unavailable.",
      "warning",
      {
        duration:
          6000
      }
    );

  }

  // ==========================================================
  // RESPONSIVE STATE
  // ==========================================================

  function updateDeviceState() {

    const width =
      window.innerWidth;

    state.device = {

      mobile:
        width < 768,

      tablet:
        width >= 768 &&
        width <= 1024,

      desktop:
        width > 1024

    };

    document.documentElement
      .classList.toggle(
        "ghar-mobile",
        state.device.mobile
      );

    document.documentElement
      .classList.toggle(
        "ghar-tablet",
        state.device.tablet
      );

    document.documentElement
      .classList.toggle(
        "ghar-desktop",
        state.device.desktop
      );

    emit(
      "responsive",
      {
        ...state.device
      }
    );

  }

  // ==========================================================
  // AUTH STATE
  // ==========================================================

  function syncAuthState(
    detail = null
  ) {

    let authState =
      detail;

    if (
      !authState &&
      AUTH &&
      isFunction(
        AUTH.getAuthState
      )
    ) {

      authState =
        AUTH.getAuthState();

    }

    if (
      authState
    ) {

      state.currentUser =
        authState.user ||
        null;

      state.role =
        authState.role ||
        null;

    }

    document.documentElement
      .classList.toggle(
        "ghar-authenticated",
        Boolean(
          state.currentUser
        )
      );

    if (
      state.role
    ) {

      document.documentElement
        .setAttribute(
          "data-ghar-role",
          state.role
        );

    } else {

      document.documentElement
        .removeAttribute(
          "data-ghar-role"
        );

    }

    emit(
      "auth-state",
      {
        user:
          state.currentUser,

        role:
          state.role
      }
    );

  }

  // ==========================================================
  // PAGE PROTECTION
  // ==========================================================

  function protectPage(
    options = {}
  ) {

    if (
      !AUTH ||
      !isFunction(
        AUTH.requireAuth
      )
    ) {

      return true;

    }

    return AUTH.requireAuth(
      options
    );

  }

  // ==========================================================
  // ROLE ACCESS
  // ==========================================================

  function hasRole(
    role
  ) {

    if (
      AUTH &&
      isFunction(
        AUTH.hasRole
      )
    ) {

      return AUTH.hasRole(
        role
      );

    }

    return (
      state.role ===
      String(role)
        .toLowerCase()
    );

  }

  function hasAnyRole(
    roles
  ) {

    if (
      AUTH &&
      isFunction(
        AUTH.hasAnyRole
      )
    ) {

      return AUTH.hasAnyRole(
        roles
      );

    }

    return (
      Array.isArray(roles) &&
      roles.includes(
        state.role
      )
    );

  }

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  function navigate(
    url,
    options = {}
  ) {

    if (
      !url
    ) {

      return;

    }

    if (
      options.replace
    ) {

      window.location.replace(
        url
      );

    } else {

      window.location.href =
        url;

    }

  }

  function goBack(
    fallback = CORE_CONFIG.defaultPage
  ) {

    if (
      document.referrer &&
      document.referrer !==
        window.location.href
    ) {

      window.history.back();

      return;

    }

    navigate(
      fallback
    );

  }

  function reload() {

    window.location.reload();

  }

  // ==========================================================
  // INTERNAL LINKS
  // ==========================================================

  function initializeLinks() {

    document.addEventListener(
      "click",
      event => {

        const link =
          event.target.closest(
            "a"
          );

        if (
          !link
        ) {

          return;

        }

        const href =
          link.getAttribute(
            "href"
          );

        if (
          !href ||
          href.startsWith(
            "#"
          ) ||
          href.startsWith(
            "mailto:"
          ) ||
          href.startsWith(
            "tel:"
          ) ||
          href.startsWith(
            "javascript:"
          )
        ) {

          return;

        }

        try {

          const url =
            new URL(
              href,
              window.location.href
            );

          if (
            url.origin ===
            window.location.origin
          ) {

            emit(
              "navigation",
              {
                href:
                  url.href,

                path:
                  url.pathname
              }
            );

          }

        } catch (_) {}

      }
    );

  }

  // ==========================================================
  // FORM HELPERS
  // ==========================================================

  function serializeForm(
    form
  ) {

    if (
      !form
    ) {

      return {};

    }

    const data = {};

    const fields =
      Array.from(
        form.elements
      );

    fields.forEach(
      field => {

        if (
          !field.name ||
          field.disabled
        ) {

          return;

        }

        if (
          field.type ===
          "checkbox"
        ) {

          data[field.name] =
            field.checked;

          return;

        }

        if (
          field.type ===
          "radio"
        ) {

          if (
            field.checked
          ) {

            data[field.name] =
              field.value;

          }

          return;

        }

        data[field.name] =
          field.value;

      }
    );

    return data;

  }

  function populateForm(
    form,
    data = {}
  ) {

    if (
      !form ||
      !isObject(data)
    ) {

      return;

    }

    Object.entries(
      data
    ).forEach(
      ([name, value]) => {

        const field =
          form.elements[name];

        if (
          !field
        ) {

          return;

        }

        if (
          field.type ===
          "checkbox"
        ) {

          field.checked =
            Boolean(
              value
            );

        } else {

          field.value =
            value ?? "";

        }

      }
    );

  }

  function initializeForms() {

    $$(
      "form[data-ghar-prevent-submit]"
    ).forEach(
      form => {

        form.addEventListener(
          "submit",
          event => {

            event.preventDefault();

          }
        );

      }
    );

  }

  // ==========================================================
  // API WRAPPER
  // ==========================================================

  async function apiRequest(
    method,
    endpoint,
    body = null,
    options = {}
  ) {

    if (
      !API
    ) {

      throw new Error(
        "GHAR API module is unavailable."
      );

    }

    const methodName =
      String(method)
        .toLowerCase();

    if (
      isFunction(
        API[methodName]
      )
    ) {

      return API[
        methodName
      ](
        endpoint,
        body,
        options
      );

    }

    throw new Error(
      `API method ${method} is not available.`
    );

  }

  // ==========================================================
  // LOCAL STATE
  // ==========================================================

  function setState(
    key,
    value
  ) {

    state[key] =
      value;

    emit(
      "state-change",
      {
        key,
        value
      }
    );

  }

  function getState() {

    return {
      ...state,
      device: {
        ...state.device
      }
    };

  }

  // ==========================================================
  // THEME
  // ==========================================================

  function setTheme(
    theme
  ) {

    if (
      !theme
    ) {

      return;

    }

    document.documentElement
      .setAttribute(
        "data-theme",
        theme
      );

    try {

      if (
        STORAGE &&
        isFunction(
          STORAGE.set
        )
      ) {

        STORAGE.set(
          "ghar_theme",
          theme
        );

      } else {

        localStorage.setItem(
          "ghar_theme",
          theme
        );

      }

    } catch (_) {}

    emit(
      "theme-change",
      {
        theme
      }
    );

  }

  function initializeTheme() {

    let theme = null;

    try {

      if (
        STORAGE &&
        isFunction(
          STORAGE.get
        )
      ) {

        theme =
          STORAGE.get(
            "ghar_theme"
          );

      } else {

        theme =
          localStorage.getItem(
            "ghar_theme"
          );

      }

    } catch (_) {}

    if (
      !theme
    ) {

      theme =
        document.documentElement
          .getAttribute(
            "data-theme"
          ) ||
        "light";

    }

    setTheme(
      theme
    );

  }

  // ==========================================================
  // ACCESSIBILITY
  // ==========================================================

  function initializeAccessibility() {

    document.documentElement
      .classList.add(
        "ghar-accessibility-ready"
      );

    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Escape"
        ) {

          emit(
            "escape",
            {}
          );

        }

      }
    );

  }

  // ==========================================================
  // PAGE INITIALIZATION
  // ==========================================================

  function markPageReady() {

    state.ready =
      true;

    document.documentElement
      .classList.add(
        "ghar-ready"
      );

    document.body?.classList.add(
      "ghar-page-ready"
    );

    emit(
      "ready",
      getState()
    );

  }

  // ==========================================================
  // GLOBAL ERROR LISTENERS
  // ==========================================================

  function initializeErrorHandlers() {

    window.addEventListener(
      "error",
      event => {

        console.error(
          "[GHAR WINDOW ERROR]",
          event.error ||
          event.message
        );

      }
    );

    window.addEventListener(
      "unhandledrejection",
      event => {

        console.error(
          "[GHAR PROMISE ERROR]",
          event.reason
        );

      }
    );

  }

  // ==========================================================
  // AUTH EVENT LISTENERS
  // ==========================================================

  function initializeAuthListeners() {

    window.addEventListener(
      "ghar:auth:login",
      event => {

        syncAuthState(
          event.detail
        );

      }
    );

    window.addEventListener(
      "ghar:auth:logout",
      event => {

        syncAuthState(
          event.detail
        );

      }
    );

    window.addEventListener(
      "ghar:auth:refresh",
      event => {

        syncAuthState(
          event.detail
        );

      }
    );

    window.addEventListener(
      "ghar:auth:initialized",
      event => {

        syncAuthState(
          event.detail
        );

      }
    );

  }

  // ==========================================================
  // NETWORK LISTENERS
  // ==========================================================

  function initializeNetworkListeners() {

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

  }

  // ==========================================================
  // RESPONSIVE LISTENERS
  // ==========================================================

  function initializeResponsiveListeners() {

    window.addEventListener(
      "resize",
      debounce(
        updateDeviceState,
        150
      )
    );

  }

  // ==========================================================
  // DOCUMENT READY
  // ==========================================================

  function domReady() {

    return new Promise(
      resolve => {

        if (
          document.readyState !==
          "loading"
        ) {

          resolve();

          return;

        }

        document.addEventListener(
          "DOMContentLoaded",
          resolve,
          {
            once: true
          }
        );

      }
    );

  }

  // ==========================================================
  // CORE INITIALIZATION
  // ==========================================================

  async function initialize() {

    if (
      state.initialized
    ) {

      return getState();

    }

    state.initialized =
      true;

    document.documentElement
      .classList.add(
        "ghar-initializing"
      );

    try {

      updateNetworkState(
        navigator.onLine
      );

      updateDeviceState();

      initializeTheme();

      initializeAccessibility();

      initializeNetworkListeners();

      initializeResponsiveListeners();

      initializeErrorHandlers();

      initializeAuthListeners();

      initializeLinks();

      await domReady();

      initializeForms();

      if (
        AUTH &&
        isFunction(
          AUTH.initialize
        )
      ) {

        try {

          await AUTH.initialize();

        } catch (error) {

          console.warn(
            "[GHAR CORE] Auth initialization failed:",
            error
          );

        }

      }

      syncAuthState();

      document.documentElement
        .classList.remove(
          "ghar-initializing"
        );

      markPageReady();

      return getState();

    } catch (error) {

      document.documentElement
        .classList.remove(
          "ghar-initializing"
        );

      handleError(
        error
      );

      throw error;

    }

  }

  // ==========================================================
  // PUBLIC CORE API
  // ==========================================================

  GHAR.core = {

    config:
      CORE_CONFIG,

    state,

    initialize,

    getState,

    setState,

    $,

    $$,

    createElement,

    getCurrentPage,

    getQueryParams,

    getQueryParam,

    navigate,

    goBack,

    reload,

    notify,

    handleError,

    setLoading,

    debounce,

    throttle,

    generateId,

    serializeForm,

    populateForm,

    apiRequest,

    protectPage,

    hasRole,

    hasAnyRole,

    setTheme,

    on,

    off,

    emit,

    updateNetworkState,

    updateDeviceState

  };

  // ==========================================================
  // GLOBAL NAMESPACE
  // ==========================================================

  window.GHAR =
    GHAR;

  // ==========================================================
  // AUTO INITIALIZATION
  // ==========================================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () => {

        initialize()
          .catch(
            error => {

              console.error(
                "[GHAR CORE] Initialization failed:",
                error
              );

            }
          );

      },
      {
        once: true
      }
    );

  } else {

    initialize()
      .catch(
        error => {

          console.error(
            "[GHAR CORE] Initialization failed:",
            error
          );

        }
      );

  }

})(window, document);