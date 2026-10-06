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

  const CONFIG = GHAR.config || {};
  const CONSTANTS = GHAR.constants || {};
  const STORAGE = GHAR.storage || {};
  const API = GHAR.api || {};
  const AUTH = GHAR.auth || {};

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
      CONFIG.routes?.home ||
      "/index.html",

    loginPage:
      CONFIG.routes?.login ||
      "/login.html",

    signupPage:
      CONFIG.routes?.signup ||
      "/sign-up.html",

    roleSelectionPage:
      CONFIG.routes?.roleSelection ||
      "/role-selection.html",

    errorPage:
      CONFIG.routes?.error ||
      "/404.html",

    offlinePage:
      CONFIG.routes?.offline ||
      "/offline.html",

    dashboardPages: {

      buyer:
        "/buyer/index.html",

      seller:
        "/seller/index.html",

      tenant:
        "/tenant/index.html",

      admin:
        "/admin/admin-dashboard.html"

    },

    storageKeys: {

      theme:
        CONSTANTS.STORAGE_KEYS?.THEME ||
        "ghar_theme",

      language:
        CONSTANTS.STORAGE_KEYS?.LANGUAGE ||
        "ghar_language",

      lastPage:
        CONSTANTS.STORAGE_KEYS?.LAST_PAGE ||
        "ghar_last_page"

    }

  };

  // ==========================================================
  // APPLICATION STATE
  // ==========================================================

  const state = {

    initialized:
      false,

    ready:
      false,

    loading:
      false,

    online:
      navigator.onLine,

    currentPage:
      window.location.pathname,

    currentUser:
      null,

    role:
      null,

    authenticated:
      false,

    lastError:
      null,

    navigation:
      null,

    theme:
      null,

    language:
      null,

    device: {

      mobile:
        false,

      tablet:
        false,

      desktop:
        false

    }

  };

  // ==========================================================
  // INTERNAL FLAGS
  // ==========================================================

  let initializationPromise = null;

  let authListenersInitialized =
    false;

  let networkListenersInitialized =
    false;

  let responsiveListenersInitialized =
    false;

  let globalErrorListenersInitialized =
    false;

  let linksInitialized =
    false;

  let formsInitialized =
    false;

  // ==========================================================
  // UTILITY HELPERS
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
      typeof value === "object" &&
      !Array.isArray(value)
    );

  }

  function isArray(value) {

    return Array.isArray(value);

  }

  function safeJsonParse(
    value,
    fallback = null
  ) {

    if (
      typeof value !== "string"
    ) {

      return value;

    }

    try {

      return JSON.parse(value);

    } catch (_) {

      return fallback;

    }

  }

  function safeString(
    value,
    fallback = ""
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return fallback;

    }

    return String(value);

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

    let waiting =
      false;

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

      waiting =
        true;

      setTimeout(
        () => {

          waiting =
            false;

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

  function $(
    selector,
    root = document
  ) {

    if (
      !selector
    ) {

      return null;

    }

    return root.querySelector(
      selector
    );

  }

  function $$(
    selector,
    root = document
  ) {

    if (
      !selector
    ) {

      return [];

    }

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
      options.text !== undefined
    ) {

      element.textContent =
        String(
          options.text
        );

    }

    if (
      options.html !== undefined
    ) {

      element.innerHTML =
        String(
          options.html
        );

    }

    if (
      isObject(
        options.attributes
      )
    ) {

      Object.entries(
        options.attributes
      ).forEach(
        ([key, value]) => {

          if (
            value !== null &&
            value !== undefined
          ) {

            element.setAttribute(
              key,
              String(value)
            );

          }

        }
      );

    }

    if (
      isObject(
        options.dataset
      )
    ) {

      Object.entries(
        options.dataset
      ).forEach(
        ([key, value]) => {

          element.dataset[key] =
            String(value);

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
        window.location.href,

      title:
        document.title

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

  const events = Object.create(null);

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

    return function unsubscribe() {

      off(
        event,
        handler
      );

    };

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

    const handlers =
      events[event] || [];

    handlers.forEach(
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

        message:
          String(message)

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
        options.duration ??
        4000
      );

    const safeType =
      [
        "info",
        "success",
        "warning",
        "error"
      ].includes(type)
        ? type
        : "info";

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

      if (
        document.body
      ) {

        document.body.appendChild(
          container
        );

      }

    }

    if (
      !container
    ) {

      return null;

    }

    const item =
      createElement(
        "div",
        {

          className:
            `ghar-notification ghar-notification-${safeType}`,

          attributes: {

            role:
              safeType === "error"
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
            safeString(
              message,
              "Notification"
            )

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

      window.setTimeout(
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

        message:
          safeString(message),

        type:
          safeType

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
      safeString(
        error,
        "Something went wrong."
      );

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
        "error",
        options
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
  // NETWORK STATE
  // ==========================================================

  function updateNetworkState(
    online
  ) {

    const next =
      Boolean(
        online
      );

    const changed =
      state.online !== next;

    state.online =
      next;

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

    if (
      changed
    ) {

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

  }

  function handleOnline() {

    const wasOffline =
      !state.online;

    updateNetworkState(
      true
    );

    if (
      wasOffline
    ) {

      notify(
        "Internet connection restored.",
        "success"
      );

    }

  }

  function handleOffline() {

    const wasOnline =
      state.online;

    updateNetworkState(
      false
    );

    if (
      wasOnline
    ) {

      notify(
        "You are offline. Some GHAR features may be unavailable.",
        "warning",
        {
          duration:
            6000
        }
      );

    }

  }

  // ==========================================================
  // RESPONSIVE STATE
  // ==========================================================

  function updateDeviceState() {

    const width =
      window.innerWidth;

    const nextState = {

      mobile:
        width < 768,

      tablet:
        width >= 768 &&
        width <= 1024,

      desktop:
        width > 1024

    };

    const changed =
      JSON.stringify(
        state.device
      ) !==
      JSON.stringify(
        nextState
      );

    state.device =
      nextState;

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

    if (
      changed
    ) {

      emit(
        "responsive",
        {
          ...state.device
        }
      );

    }

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

      try {

        authState =
          AUTH.getAuthState();

      } catch (error) {

        console.warn(
          "[GHAR CORE] Unable to read auth state:",
          error
        );

      }

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

      state.authenticated =
        Boolean(
          authState.authenticated ??
          authState.token
        );

    } else {

      state.authenticated =
        Boolean(
          state.currentUser
        );

    }

    document.documentElement
      .classList.toggle(
        "ghar-authenticated",
        state.authenticated
      );

    document.documentElement
      .classList.toggle(
        "ghar-guest",
        !state.authenticated
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
          state.role,

        authenticated:
          state.authenticated

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

      console.warn(
        "[GHAR CORE] Auth guard unavailable."
      );

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
      safeString(
        role
      )
        .trim()
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

    if (
      !Array.isArray(roles)
    ) {

      return false;

    }

    const normalized =
      roles.map(
        role =>
          safeString(
            role
          )
            .trim()
            .toLowerCase()
      );

    return normalized.includes(
      state.role
    );

  }

  function hasAllRoles(
    roles
  ) {

    if (
      !Array.isArray(roles)
    ) {

      return false;

    }

    return roles.every(
      role =>
        hasRole(
          role
        )
    );

  }

  function isAuthenticated() {

    if (
      AUTH &&
      isFunction(
        AUTH.isAuthenticated
      )
    ) {

      return AUTH.isAuthenticated();

    }

    return Boolean(
      state.authenticated
    );

  }

  function getUser() {

    if (
      AUTH &&
      isFunction(
        AUTH.getUser
      )
    ) {

      return AUTH.getUser();

    }

    return state.currentUser;

  }

  function getRole() {

    if (
      AUTH &&
      isFunction(
        AUTH.getRole
      )
    ) {

      return AUTH.getRole();

    }

    return state.role;

  }

  // ==========================================================
  // DASHBOARD / ROLE ROUTING
  // ==========================================================

  function getDashboardForRole(
    role
  ) {

    const normalized =
      AUTH &&
      isFunction(
        AUTH.normalizeRole
      )
        ? AUTH.normalizeRole(
            role
          )
        : safeString(
            role
          )
            .trim()
            .toLowerCase();

    if (
      AUTH &&
      isFunction(
        AUTH.getDashboardForRole
      )
    ) {

      return AUTH.getDashboardForRole(
        normalized
      );

    }

    return (
      CORE_CONFIG.dashboardPages[
        normalized
      ] ||
      CORE_CONFIG.defaultPage
    );

  }

  function redirectByRole(
    role = null
  ) {

    const targetRole =
      role ||
      getRole();

    const destination =
      getDashboardForRole(
        targetRole
      );

    navigate(
      destination
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

      return false;

    }

    const destination =
      String(url);

    state.navigation = {

      from:
        window.location.href,

      to:
        destination,

      timestamp:
        Date.now()

    };

    try {

      if (
        options.replace
      ) {

        window.location.replace(
          destination
        );

      } else {

        window.location.href =
          destination;

      }

      return true;

    } catch (error) {

      handleError(
        error
      );

      return false;

    }

  }

  function goBack(
    fallback =
      CORE_CONFIG.defaultPage
  ) {

    if (
      document.referrer &&
      document.referrer !==
        window.location.href
    ) {

      window.history.back();

      return true;

    }

    return navigate(
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

    if (
      linksInitialized
    ) {

      return;

    }

    linksInitialized =
      true;

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

        if (
          link.target &&
          link.target !== "_self"
        ) {

          return;

        }

        if (
          link.hasAttribute(
            "download"
          )
        ) {

          return;

        }

        const href =
          link.getAttribute(
            "href"
          );

        if (
          !href ||
          href.startsWith("#") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:") ||
          href.startsWith("javascript:")
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

            state.currentPage =
              url.pathname;

            try {

              if (
                STORAGE &&
                isFunction(
                  STORAGE.set
                )
              ) {

                STORAGE.set(
                  CORE_CONFIG.storageKeys.lastPage,
                  url.pathname
                );

              }

            } catch (_) {}

            emit(
              "navigation",
              {

                href:
                  url.href,

                path:
                  url.pathname,

                search:
                  url.search

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

    Array.from(
      form.elements || []
    ).forEach(
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

        if (
          field.type ===
          "file"
        ) {

          data[field.name] =
            field.files;

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

      return false;

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
            Boolean(value);

        } else if (
          field.type ===
          "radio"
        ) {

          const radios =
            form.querySelectorAll(
              `[name="${CSS.escape(name)}"]`
            );

          radios.forEach(
            radio => {

              radio.checked =
                String(
                  radio.value
                ) ===
                String(
                  value
                );

            }
          );

        } else if (
          field.type !==
          "file"
        ) {

          field.value =
            value ?? "";

        }

      }
    );

    return true;

  }

  function initializeForms() {

    if (
      formsInitialized
    ) {

      return;

    }

    formsInitialized =
      true;

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
        .trim()
        .toLowerCase();

    if (
      !isFunction(
        API[methodName]
      )
    ) {

      throw new Error(
        `API method ${method} is not available.`
      );

    }

    return API[
      methodName
    ](
      endpoint,
      body,
      options
    );

  }

  // ==========================================================
  // LOCAL STATE
  // ==========================================================

  function setState(
    key,
    value
  ) {

    if (
      !key
    ) {

      return false;

    }

    state[key] =
      value;

    emit(
      "state-change",
      {

        key,

        value

      }
    );

    return true;

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

      return false;

    }

    const normalized =
      String(
        theme
      )
        .trim()
        .toLowerCase();

    state.theme =
      normalized;

    document.documentElement
      .setAttribute(
        "data-theme",
        normalized
      );

    try {

      if (
        STORAGE &&
        isFunction(
          STORAGE.set
        )
      ) {

        STORAGE.set(
          CORE_CONFIG.storageKeys.theme,
          normalized
        );

      } else {

        localStorage.setItem(
          CORE_CONFIG.storageKeys.theme,
          normalized
        );

      }

    } catch (_) {}

    emit(
      "theme-change",
      {

        theme:
          normalized

      }
    );

    return true;

  }

  function getTheme() {

    return state.theme;

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
            CORE_CONFIG.storageKeys.theme
          );

      } else {

        theme =
          localStorage.getItem(
            CORE_CONFIG.storageKeys.theme
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
  // LANGUAGE
  // ==========================================================

  function setLanguage(
    language
  ) {

    if (
      !language
    ) {

      return false;

    }

    const normalized =
      String(
        language
      )
        .trim()
        .toLowerCase();

    state.language =
      normalized;

    document.documentElement
      .setAttribute(
        "lang",
        normalized
      );

    try {

      if (
        STORAGE &&
        isFunction(
          STORAGE.set
        )
      ) {

        STORAGE.set(
          CORE_CONFIG.storageKeys.language,
          normalized
        );

      } else {

        localStorage.setItem(
          CORE_CONFIG.storageKeys.language,
          normalized
        );

      }

    } catch (_) {}

    emit(
      "language-change",
      {

        language:
          normalized

      }
    );

    return true;

  }

  function getLanguage() {

    return state.language;

  }

  function initializeLanguage() {

    let language = null;

    try {

      if (
        STORAGE &&
        isFunction(
          STORAGE.get
        )
      ) {

        language =
          STORAGE.get(
            CORE_CONFIG.storageKeys.language
          );

      } else {

        language =
          localStorage.getItem(
            CORE_CONFIG.storageKeys.language
          );

      }

    } catch (_) {}

    if (
      !language
    ) {

      language =
        document.documentElement
          .getAttribute(
            "lang"
          ) ||
        "en";

    }

    setLanguage(
      language
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
  // PAGE READY
  // ==========================================================

  function markPageReady() {

    state.ready =
      true;

    document.documentElement
      .classList.add(
        "ghar-ready"
      );

    document.documentElement
      .classList.remove(
        "ghar-initializing"
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

    if (
      globalErrorListenersInitialized
    ) {

      return;

    }

    globalErrorListenersInitialized =
      true;

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

    if (
      authListenersInitialized
    ) {

      return;

    }

    authListenersInitialized =
      true;

    const authEvents = [

      "login",

      "logout",

      "refresh",

      "register",

      "initialized"

    ];

    authEvents.forEach(
      type => {

        window.addEventListener(
          `ghar:auth:${type}`,
          event => {

            syncAuthState(
              event.detail
            );

            emit(
              `auth:${type}`,
              event.detail || {}
            );

          }
        );

      }
    );

  }

  // ==========================================================
  // NETWORK LISTENERS
  // ==========================================================

  function initializeNetworkListeners() {

    if (
      networkListenersInitialized
    ) {

      return;

    }

    networkListenersInitialized =
      true;

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

    if (
      responsiveListenersInitialized
    ) {

      return;

    }

    responsiveListenersInitialized =
      true;

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

    if (
      document.readyState !==
      "loading"
    ) {

      return Promise.resolve();

    }

    return new Promise(
      resolve => {

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
      initializationPromise
    ) {

      return initializationPromise;

    }

    initializationPromise =
      (async function () {

        if (
          state.initialized &&
          state.ready
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

          initializeLanguage();

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

          state.currentPage =
            window.location.pathname;

          markPageReady();

          return getState();

        } catch (error) {

          state.initialized =
            false;

          document.documentElement
            .classList.remove(
              "ghar-initializing"
            );

          handleError(
            error
          );

          throw error;

        }

      })();

    return initializationPromise;

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

    hasAllRoles,

    isAuthenticated,

    getUser,

    getRole,

    getDashboardForRole,

    redirectByRole,

    setTheme,

    getTheme,

    setLanguage,

    getLanguage,

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