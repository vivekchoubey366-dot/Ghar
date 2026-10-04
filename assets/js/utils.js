// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/utils.js
// Global frontend utility library
// ============================================================

"use strict";

(function (window, document) {

  // ==========================================================
  // GHAR NAMESPACE
  // ==========================================================

  window.GHAR = window.GHAR || {};

  const GHAR = window.GHAR;

  GHAR.utils = GHAR.utils || {};

  // ==========================================================
  // TYPE UTILITIES
  // ==========================================================

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

  function isString(value) {
    return typeof value === "string";
  }

  function isNumber(value) {
    return (
      typeof value === "number" &&
      Number.isFinite(value)
    );
  }

  function isFunction(value) {
    return typeof value === "function";
  }

  function isEmpty(value) {
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === "string") {
      return value.trim().length === 0;
    }

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    if (isObject(value)) {
      return Object.keys(value).length === 0;
    }

    return false;
  }

  // ==========================================================
  // STRING UTILITIES
  // ==========================================================

  function escapeHTML(value) {
    if (value === null || value === undefined) {
      return "";
    }

    const div = document.createElement("div");

    div.textContent = String(value);

    return div.innerHTML;
  }

  function capitalize(value) {
    if (!value) {
      return "";
    }

    const text = String(value).trim();

    return (
      text.charAt(0).toUpperCase() +
      text.slice(1)
    );
  }

  function titleCase(value) {
    if (!value) {
      return "";
    }

    return String(value)
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map(capitalize)
      .join(" ");
  }

  function slugify(value) {
    if (!value) {
      return "";
    }

    return String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function truncate(value, length = 100) {
    if (!value) {
      return "";
    }

    const text = String(value);

    if (text.length <= length) {
      return text;
    }

    return (
      text.slice(0, Math.max(0, length - 3)) +
      "..."
    );
  }

  function normalizeWhitespace(value) {
    if (!value) {
      return "";
    }

    return String(value)
      .replace(/\s+/g, " ")
      .trim();
  }

  // ==========================================================
  // ID / RANDOM UTILITIES
  // ==========================================================

  function uuid() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return (
      "ghar-" +
      Date.now().toString(36) +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 12)
    );
  }

  function randomString(length = 12) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let result = "";

    for (let i = 0; i < length; i++) {
      result += chars.charAt(
        Math.floor(
          Math.random() * chars.length
        )
      );
    }

    return result;
  }

  // ==========================================================
  // NUMBER UTILITIES
  // ==========================================================

  function toNumber(value, fallback = 0) {
    if (isNumber(value)) {
      return value;
    }

    if (
      typeof value === "string"
    ) {
      const cleaned =
        value.replace(/,/g, "").trim();

      const number =
        Number(cleaned);

      return Number.isFinite(number)
        ? number
        : fallback;
    }

    return fallback;
  }

  function clamp(value, min, max) {
    const number = toNumber(value, min);

    return Math.min(
      Math.max(number, min),
      max
    );
  }

  function round(value, decimals = 0) {
    const factor =
      Math.pow(10, decimals);

    return (
      Math.round(
        toNumber(value) * factor
      ) / factor
    );
  }

  function formatNumber(
    value,
    options = {}
  ) {
    const number =
      toNumber(value);

    return new Intl.NumberFormat(
      options.locale || "en-IN",
      {
        maximumFractionDigits:
          options.maximumFractionDigits ?? 2,
        minimumFractionDigits:
          options.minimumFractionDigits ?? 0
      }
    ).format(number);
  }

  // ==========================================================
  // INDIAN CURRENCY
  // ==========================================================

  function formatCurrency(
    value,
    options = {}
  ) {
    const number =
      toNumber(value);

    return new Intl.NumberFormat(
      options.locale || "en-IN",
      {
        style: "currency",
        currency:
          options.currency || "INR",
        maximumFractionDigits:
          options.maximumFractionDigits ?? 0
      }
    ).format(number);
  }

  // ==========================================================
  // PROPERTY PRICE FORMAT
  // ==========================================================

  function formatPrice(
    value,
    options = {}
  ) {
    const amount =
      toNumber(value);

    const compact =
      options.compact !== false;

    if (!compact) {
      return formatCurrency(
        amount,
        options
      );
    }

    if (amount >= 10000000) {
      return (
        "₹" +
        round(
          amount / 10000000,
          2
        ) +
        " Cr"
      );
    }

    if (amount >= 100000) {
      return (
        "₹" +
        round(
          amount / 100000,
          2
        ) +
        " L"
      );
    }

    if (amount >= 1000) {
      return (
        "₹" +
        round(
          amount / 1000,
          1
        ) +
        " K"
      );
    }

    return "₹" + formatNumber(amount);
  }

  // ==========================================================
  // AREA FORMAT
  // ==========================================================

  function formatArea(
    value,
    unit = "sq ft"
  ) {
    const area =
      toNumber(value);

    return (
      formatNumber(area) +
      " " +
      unit
    );
  }

  // ==========================================================
  // PERCENTAGE
  // ==========================================================

  function formatPercentage(
    value,
    decimals = 2
  ) {
    return (
      round(
        toNumber(value),
        decimals
      ) +
      "%"
    );
  }

  // ==========================================================
  // DATE UTILITIES
  // ==========================================================

  function parseDate(value) {
    if (!value) {
      return null;
    }

    const date =
      value instanceof Date
        ? new Date(value.getTime())
        : new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null;
    }

    return date;
  }

  function formatDate(
    value,
    options = {}
  ) {
    const date =
      parseDate(value);

    if (!date) {
      return "";
    }

    return new Intl.DateTimeFormat(
      options.locale || "en-IN",
      {
        day: "2-digit",
        month:
          options.month || "short",
        year: "numeric"
      }
    ).format(date);
  }

  function formatDateTime(
    value,
    options = {}
  ) {
    const date =
      parseDate(value);

    if (!date) {
      return "";
    }

    return new Intl.DateTimeFormat(
      options.locale || "en-IN",
      {
        day: "2-digit",
        month:
          options.month || "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    ).format(date);
  }

  function relativeTime(value) {
    const date =
      parseDate(value);

    if (!date) {
      return "";
    }

    const difference =
      date.getTime() -
      Date.now();

    const seconds =
      Math.round(
        difference / 1000
      );

    const minutes =
      Math.round(
        seconds / 60
      );

    const hours =
      Math.round(
        minutes / 60
      );

    const days =
      Math.round(
        hours / 24
      );

    if (Math.abs(seconds) < 60) {
      return "just now";
    }

    if (Math.abs(minutes) < 60) {
      return (
        Math.abs(minutes) +
        " minute" +
        (Math.abs(minutes) === 1
          ? ""
          : "s") +
        (minutes < 0
          ? " ago"
          : " from now")
      );
    }

    if (Math.abs(hours) < 24) {
      return (
        Math.abs(hours) +
        " hour" +
        (Math.abs(hours) === 1
          ? ""
          : "s") +
        (hours < 0
          ? " ago"
          : " from now")
      );
    }

    return (
      Math.abs(days) +
      " day" +
      (Math.abs(days) === 1
        ? ""
        : "s") +
      (days < 0
        ? " ago"
        : " from now")
    );
  }

  // ==========================================================
  // URL UTILITIES
  // ==========================================================

  function getQueryParams() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const result = {};

    params.forEach(
      (value, key) => {
        result[key] = value;
      }
    );

    return result;
  }

  function getQueryParam(
    name,
    fallback = null
  ) {
    const params =
      new URLSearchParams(
        window.location.search
      );

    return params.has(name)
      ? params.get(name)
      : fallback;
  }

  function setQueryParam(
    name,
    value,
    replace = true
  ) {
    const url =
      new URL(
        window.location.href
      );

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      url.searchParams.delete(name);
    } else {
      url.searchParams.set(
        name,
        value
      );
    }

    if (replace) {
      window.history.replaceState(
        {},
        "",
        url
      );
    } else {
      window.history.pushState(
        {},
        "",
        url
      );
    }

    return url.toString();
  }

  function buildUrl(
    path,
    params = {}
  ) {
    const url =
      new URL(
        path,
        window.location.origin
      );

    Object.entries(params)
      .forEach(
        ([key, value]) => {
          if (
            value !== null &&
            value !== undefined &&
            value !== ""
          ) {
            url.searchParams.set(
              key,
              value
            );
          }
        }
      );

    return url.toString();
  }

  // ==========================================================
  // DOM UTILITIES
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
      document.createElement(tag);

    if (options.className) {
      element.className =
        options.className;
    }

    if (options.id) {
      element.id =
        options.id;
    }

    if (options.text !== undefined) {
      element.textContent =
        options.text;
    }

    if (options.html !== undefined) {
      element.innerHTML =
        options.html;
    }

    if (options.attributes) {
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

  function show(element) {
    if (!element) {
      return;
    }

    element.hidden = false;

    element.style.removeProperty(
      "display"
    );

    element.classList.remove(
      "is-hidden"
    );
  }

  function hide(element) {
    if (!element) {
      return;
    }

    element.hidden = true;

    element.classList.add(
      "is-hidden"
    );
  }

  function toggle(
    element,
    force
  ) {
    if (!element) {
      return false;
    }

    const visible =
      force !== undefined
        ? Boolean(force)
        : element.hidden;

    if (visible) {
      show(element);
    } else {
      hide(element);
    }

    return visible;
  }

  // ==========================================================
  // DEBOUNCE
  // ==========================================================

  function debounce(
    callback,
    wait = 300
  ) {
    let timeout = null;

    return function (...args) {
      const context = this;

      clearTimeout(timeout);

      timeout = setTimeout(
        () => {
          callback.apply(
            context,
            args
          );
        },
        wait
      );
    };
  }

  // ==========================================================
  // THROTTLE
  // ==========================================================

  function throttle(
    callback,
    wait = 100
  ) {
    let lastTime = 0;

    return function (...args) {
      const now =
        Date.now();

      if (
        now - lastTime >= wait
      ) {
        lastTime = now;

        callback.apply(
          this,
          args
        );
      }
    };
  }

  // ==========================================================
  // ASYNC DELAY
  // ==========================================================

  function sleep(ms) {
    return new Promise(
      resolve =>
        setTimeout(
          resolve,
          ms
        )
    );
  }

  // ==========================================================
  // COPY TO CLIPBOARD
  // ==========================================================

  async function copyToClipboard(
    value
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return false;
    }

    try {
      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(
          String(value)
        );

        return true;
      }

      const textarea =
        document.createElement(
          "textarea"
        );

      textarea.value =
        String(value);

      textarea.style.position =
        "fixed";

      textarea.style.opacity =
        "0";

      document.body.appendChild(
        textarea
      );

      textarea.select();

      const success =
        document.execCommand(
          "copy"
        );

      textarea.remove();

      return success;

    } catch (error) {
      console.error(
        "GHAR clipboard error:",
        error
      );

      return false;
    }
  }

  // ==========================================================
  // LOCAL STORAGE
  // ==========================================================

  function storageSet(
    key,
    value
  ) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

      return true;

    } catch (error) {
      console.error(
        "GHAR storage set error:",
        error
      );

      return false;
    }
  }

  function storageGet(
    key,
    fallback = null
  ) {
    try {
      const value =
        localStorage.getItem(key);

      if (value === null) {
        return fallback;
      }

      return JSON.parse(value);

    } catch (error) {
      return fallback;
    }
  }

  function storageRemove(key) {
    try {
      localStorage.removeItem(
        key
      );

      return true;

    } catch (error) {
      return false;
    }
  }

  // ==========================================================
  // SESSION STORAGE
  // ==========================================================

  function sessionSet(
    key,
    value
  ) {
    try {
      sessionStorage.setItem(
        key,
        JSON.stringify(value)
      );

      return true;

    } catch (error) {
      return false;
    }
  }

  function sessionGet(
    key,
    fallback = null
  ) {
    try {
      const value =
        sessionStorage.getItem(key);

      if (value === null) {
        return fallback;
      }

      return JSON.parse(value);

    } catch (error) {
      return fallback;
    }
  }

  function sessionRemove(key) {
    try {
      sessionStorage.removeItem(
        key
      );

      return true;

    } catch (error) {
      return false;
    }
  }

  // ==========================================================
  // JSON UTILITIES
  // ==========================================================

  function safeJSONParse(
    value,
    fallback = null
  ) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function deepClone(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return value;
    }

    try {
      return structuredClone(value);
    } catch (error) {
      return safeJSONParse(
        JSON.stringify(value),
        value
      );
    }
  }

  // ==========================================================
  // VALIDATION HELPERS
  // ==========================================================

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      String(value || "").trim()
    );
  }

  function isValidPhone(
    value,
    country = "IN"
  ) {
    const phone =
      String(value || "")
        .replace(/\s+/g, "")
        .replace(/-/g, "");

    if (country === "IN") {
      return /^(?:\+91|91)?[6-9]\d{9}$/.test(
        phone
      );
    }

    return /^\+?[1-9]\d{7,14}$/.test(
      phone
    );
  }

  function isValidPincode(value) {
    return /^[1-9][0-9]{5}$/.test(
      String(value || "")
    );
  }

  function isStrongPassword(value) {
    const password =
      String(value || "");

    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  }

  // ==========================================================
  // ARRAY UTILITIES
  // ==========================================================

  function unique(array) {
    if (!Array.isArray(array)) {
      return [];
    }

    return [
      ...new Set(array)
    ];
  }

  function sortBy(
    array,
    key,
    direction = "asc"
  ) {
    if (!Array.isArray(array)) {
      return [];
    }

    const result =
      [...array];

    result.sort(
      (a, b) => {
        const first =
          a?.[key];

        const second =
          b?.[key];

        if (first === second) {
          return 0;
        }

        const comparison =
          first > second
            ? 1
            : -1;

        return direction === "desc"
          ? -comparison
          : comparison;
      }
    );

    return result;
  }

  function groupBy(
    array,
    key
  ) {
    if (!Array.isArray(array)) {
      return {};
    }

    return array.reduce(
      (groups, item) => {
        const group =
          item?.[key] ??
          "undefined";

        if (!groups[group]) {
          groups[group] = [];
        }

        groups[group].push(item);

        return groups;
      },
      {}
    );
  }

  // ==========================================================
  // ERROR UTILITIES
  // ==========================================================

  function getErrorMessage(
    error,
    fallback = "Something went wrong."
  ) {
    if (!error) {
      return fallback;
    }

    if (
      typeof error === "string"
    ) {
      return error;
    }

    return (
      error.message ||
      error.error ||
      error.data?.message ||
      fallback
    );
  }

  function logError(
    context,
    error
  ) {
    console.error(
      `[GHAR] ${context}`,
      error
    );
  }

  // ==========================================================
  // SAFE CALLBACK
  // ==========================================================

  function safeCall(
    callback,
    ...args
  ) {
    if (!isFunction(callback)) {
      return undefined;
    }

    try {
      return callback(
        ...args
      );
    } catch (error) {
      logError(
        "Callback error",
        error
      );

      return undefined;
    }
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  Object.assign(
    GHAR.utils,
    {
      isObject,
      isArray,
      isString,
      isNumber,
      isFunction,
      isEmpty,

      escapeHTML,
      capitalize,
      titleCase,
      slugify,
      truncate,
      normalizeWhitespace,

      uuid,
      randomString,

      toNumber,
      clamp,
      round,
      formatNumber,
      formatCurrency,
      formatPrice,
      formatArea,
      formatPercentage,

      parseDate,
      formatDate,
      formatDateTime,
      relativeTime,

      getQueryParams,
      getQueryParam,
      setQueryParam,
      buildUrl,

      $,
      $$,
      createElement,
      show,
      hide,
      toggle,

      debounce,
      throttle,
      sleep,

      copyToClipboard,

      storageSet,
      storageGet,
      storageRemove,

      sessionSet,
      sessionGet,
      sessionRemove,

      safeJSONParse,
      deepClone,

      isValidEmail,
      isValidPhone,
      isValidPincode,
      isStrongPassword,

      unique,
      sortBy,
      groupBy,

      getErrorMessage,
      logError,
      safeCall
    }
  );

  // ==========================================================
  // BACKWARD-COMPATIBLE SHORTCUT
  // ==========================================================

  GHAR.$ = $;
  GHAR.$$ = $$;

})(window, document);