// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/utils.js
// Global Frontend Utility & Helper Library
// Version: 2.0.0
// ============================================================

"use strict";

(function (window, document) {

  // ==========================================================
  // GHAR NAMESPACE
  // ==========================================================

  const GHAR = window.GHAR = window.GHAR || {};

  GHAR.utils = GHAR.utils || {};

  const utils = GHAR.utils;

  // ==========================================================
  // INTERNAL CONSTANTS
  // ==========================================================

  const DEFAULT_LOCALE =
    GHAR.APP?.DEFAULT_LANGUAGE === "en"
      ? "en-IN"
      : "en-IN";

  const DEFAULT_CURRENCY =
    GHAR.APP?.DEFAULT_CURRENCY || "INR";

  const DEFAULT_TIMEZONE =
    GHAR.DATE?.TIMEZONE || "Asia/Kolkata";

  const DEFAULT_PAGE =
    GHAR.PAGINATION?.DEFAULT_PAGE || 1;

  const DEFAULT_LIMIT =
    GHAR.PAGINATION?.DEFAULT_LIMIT || 20;

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

  function isBoolean(value) {
    return typeof value === "boolean";
  }

  function isFunction(value) {
    return typeof value === "function";
  }

  function isNullish(value) {
    return (
      value === null ||
      value === undefined
    );
  }

  function isEmpty(value) {

    if (isNullish(value)) {
      return true;
    }

    if (isString(value)) {
      return value.trim().length === 0;
    }

    if (isArray(value)) {
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

  function toString(value, fallback = "") {

    if (isNullish(value)) {
      return fallback;
    }

    return String(value);
  }

  function normalizeWhitespace(value) {

    if (isNullish(value)) {
      return "";
    }

    return String(value)
      .replace(/\s+/g, " ")
      .trim();
  }

  function capitalize(value) {

    const text =
      normalizeWhitespace(value);

    if (!text) {
      return "";
    }

    return (
      text.charAt(0).toUpperCase() +
      text.slice(1)
    );
  }

  function titleCase(value) {

    const text =
      normalizeWhitespace(value);

    if (!text) {
      return "";
    }

    return text
      .toLowerCase()
      .split(" ")
      .map(capitalize)
      .join(" ");
  }

  function sentenceCase(value) {

    const text =
      normalizeWhitespace(value);

    if (!text) {
      return "";
    }

    return (
      text.charAt(0).toUpperCase() +
      text.slice(1).toLowerCase()
    );
  }

  function slugify(value) {

    if (isNullish(value)) {
      return "";
    }

    return String(value)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function truncate(
    value,
    length = 100,
    suffix = "..."
  ) {

    const text =
      toString(value);

    if (
      text.length <= length
    ) {
      return text;
    }

    const safeLength =
      Math.max(
        0,
        length - suffix.length
      );

    return (
      text.slice(0, safeLength) +
      suffix
    );
  }

  function escapeHTML(value) {

    if (isNullish(value)) {
      return "";
    }

    const div =
      document.createElement("div");

    div.textContent =
      String(value);

    return div.innerHTML;
  }

  function escapeAttribute(value) {
    return escapeHTML(value);
  }

  function stripHTML(value) {

    if (isNullish(value)) {
      return "";
    }

    const div =
      document.createElement("div");

    div.innerHTML =
      String(value);

    return normalizeWhitespace(
      div.textContent ||
      div.innerText ||
      ""
    );
  }

  // ==========================================================
  // ID / RANDOM UTILITIES
  // ==========================================================

  function uuid() {

    if (
      window.crypto &&
      typeof window.crypto.randomUUID ===
        "function"
    ) {
      return window.crypto.randomUUID();
    }

    if (
      window.crypto &&
      typeof window.crypto.getRandomValues ===
        "function"
    ) {

      const bytes =
        new Uint8Array(16);

      window.crypto.getRandomValues(
        bytes
      );

      bytes[6] =
        (bytes[6] & 0x0f) |
        0x40;

      bytes[8] =
        (bytes[8] & 0x3f) |
        0x80;

      return [
        [...bytes.slice(0, 4)]
          .map(toHex)
          .join(""),

        [...bytes.slice(4, 6)]
          .map(toHex)
          .join(""),

        [...bytes.slice(6, 8)]
          .map(toHex)
          .join(""),

        [...bytes.slice(8, 10)]
          .map(toHex)
          .join(""),

        [...bytes.slice(10, 16)]
          .map(toHex)
          .join("")
      ].join("-");
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

  function toHex(value) {
    return value
      .toString(16)
      .padStart(2, "0");
  }

  function randomString(
    length = 12
  ) {

    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    if (length <= 0) {
      return "";
    }

    if (
      window.crypto &&
      typeof window.crypto.getRandomValues ===
        "function"
    ) {

      const values =
        new Uint32Array(length);

      window.crypto.getRandomValues(
        values
      );

      return Array.from(
        values,
        value =>
          chars[
            value % chars.length
          ]
      ).join("");
    }

    let result = "";

    for (
      let index = 0;
      index < length;
      index++
    ) {

      result +=
        chars.charAt(
          Math.floor(
            Math.random() *
            chars.length
          )
        );

    }

    return result;
  }

  // ==========================================================
  // NUMBER UTILITIES
  // ==========================================================

  function toNumber(
    value,
    fallback = 0
  ) {

    if (isNumber(value)) {
      return value;
    }

    if (
      typeof value === "string"
    ) {

      const cleaned =
        value
          .replace(/,/g, "")
          .replace(/[₹$€£]/g, "")
          .trim();

      if (!cleaned) {
        return fallback;
      }

      const number =
        Number(cleaned);

      return Number.isFinite(number)
        ? number
        : fallback;
    }

    return fallback;
  }

  function clamp(
    value,
    min,
    max
  ) {

    const number =
      toNumber(value, min);

    return Math.min(
      Math.max(number, min),
      max
    );
  }

  function round(
    value,
    decimals = 0
  ) {

    const number =
      toNumber(value);

    const factor =
      10 ** decimals;

    return (
      Math.round(
        (number + Number.EPSILON) *
        factor
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
      options.locale ||
        DEFAULT_LOCALE,
      {
        minimumFractionDigits:
          options.minimumFractionDigits ?? 0,

        maximumFractionDigits:
          options.maximumFractionDigits ?? 2
      }
    ).format(number);
  }

  // ==========================================================
  // CURRENCY
  // ==========================================================

  function formatCurrency(
    value,
    options = {}
  ) {

    const number =
      toNumber(value);

    return new Intl.NumberFormat(
      options.locale ||
        DEFAULT_LOCALE,
      {
        style: "currency",

        currency:
          options.currency ||
          DEFAULT_CURRENCY,

        currencyDisplay:
          options.currencyDisplay ||
          "symbol",

        minimumFractionDigits:
          options.minimumFractionDigits ?? 0,

        maximumFractionDigits:
          options.maximumFractionDigits ?? 0
      }
    ).format(number);
  }

  // ==========================================================
  // PROPERTY PRICE
  // ==========================================================

  function formatPrice(
    value,
    options = {}
  ) {

    const amount =
      toNumber(value);

    if (!Number.isFinite(amount)) {
      return "₹0";
    }

    if (
      options.compact === false
    ) {
      return formatCurrency(
        amount,
        options
      );
    }

    const decimals =
      options.decimals ?? 2;

    if (amount >= 10000000) {

      return (
        "₹" +
        round(
          amount / 10000000,
          decimals
        ) +
        " Cr"
      );
    }

    if (amount >= 100000) {

      return (
        "₹" +
        round(
          amount / 100000,
          decimals
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

    return (
      "₹" +
      formatNumber(amount)
    );
  }

  function formatPriceRange(
    min,
    max
  ) {

    return (
      `${formatPrice(min)} - ${formatPrice(max)}`
    );
  }

  // ==========================================================
  // AREA / PROPERTY HELPERS
  // ==========================================================

  function formatArea(
    value,
    unit = "sq ft"
  ) {

    const area =
      toNumber(value);

    return (
      `${formatNumber(area)} ${unit}`
    );
  }

  function formatBHK(value) {

    if (!value) {
      return "";
    }

    const text =
      String(value)
        .toUpperCase()
        .trim();

    if (text === "1RK") {
      return "1 RK";
    }

    const match =
      text.match(/^(\d+)BHK$/);

    if (match) {
      return `${match[1]} BHK`;
    }

    return titleCase(
      text.replace(/_/g, " ")
    );
  }

  function formatPercentage(
    value,
    decimals = 2
  ) {

    return (
      round(
        toNumber(value),
        decimals
      ) + "%"
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
        ? new Date(
            value.getTime()
          )
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
      options.locale ||
        DEFAULT_LOCALE,
      {
        timeZone:
          options.timeZone ||
          DEFAULT_TIMEZONE,

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
      options.locale ||
        DEFAULT_LOCALE,
      {
        timeZone:
          options.timeZone ||
          DEFAULT_TIMEZONE,

        day: "2-digit",

        month:
          options.month || "short",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit",

        hour12:
          options.hour12 ?? true
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

    if (
      Math.abs(seconds) < 60
    ) {
      return "just now";
    }

    if (
      Math.abs(minutes) < 60
    ) {

      return formatRelativeUnit(
        minutes,
        "minute"
      );
    }

    if (
      Math.abs(hours) < 24
    ) {

      return formatRelativeUnit(
        hours,
        "hour"
      );
    }

    return formatRelativeUnit(
      days,
      "day"
    );
  }

  function formatRelativeUnit(
    value,
    unit
  ) {

    const amount =
      Math.abs(value);

    const suffix =
      value < 0
        ? " ago"
        : " from now";

    return (
      amount +
      " " +
      unit +
      (amount === 1 ? "" : "s") +
      suffix
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

        if (
          Object.prototype.hasOwnProperty.call(
            result,
            key
          )
        ) {

          if (
            Array.isArray(
              result[key]
            )
          ) {

            result[key].push(value);

          } else {

            result[key] = [
              result[key],
              value
            ];

          }

        } else {

          result[key] = value;

        }

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
      isNullish(value) ||
      value === ""
    ) {

      url.searchParams.delete(
        name
      );

    } else {

      url.searchParams.set(
        name,
        value
      );

    }

    const method =
      replace
        ? "replaceState"
        : "pushState";

    window.history[method](
      {},
      "",
      url
    );

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
            !isNullish(value) &&
            value !== ""
          ) {

            if (
              Array.isArray(value)
            ) {

              value.forEach(
                item =>
                  url.searchParams.append(
                    key,
                    item
                  )
              );

            } else {

              url.searchParams.set(
                key,
                value
              );

            }

          }

        }
      );

    return url.toString();
  }

  function isExternalUrl(url) {

    try {

      const parsed =
        new URL(
          url,
          window.location.origin
        );

      return (
        parsed.origin !==
        window.location.origin
      );

    } catch {
      return false;
    }
  }

  // ==========================================================
  // DOM UTILITIES
  // ==========================================================

  function $(
    selector,
    root = document
  ) {

    return root.querySelector(
      selector
    );
  }

  function $$(
    selector,
    root = document
  ) {

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

    if (
      options.text !== undefined
    ) {
      element.textContent =
        options.text;
    }

    if (
      options.html !== undefined
    ) {
      element.innerHTML =
        options.html;
    }

    if (
      options.attributes
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
      options.dataset
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

  function show(element) {

    if (!element) {
      return;
    }

    element.hidden = false;

    element.classList.remove(
      "is-hidden"
    );

    element.style.removeProperty(
      "display"
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

  function addClass(
    element,
    ...classes
  ) {

    if (!element) {
      return;
    }

    element.classList.add(
      ...classes.filter(Boolean)
    );
  }

  function removeClass(
    element,
    ...classes
  ) {

    if (!element) {
      return;
    }

    element.classList.remove(
      ...classes.filter(Boolean)
    );
  }

  function hasClass(
    element,
    className
  ) {

    return Boolean(
      element &&
      element.classList.contains(
        className
      )
    );
  }

  function toggleClass(
    element,
    className,
    force
  ) {

    if (!element) {
      return false;
    }

    return element.classList.toggle(
      className,
      force
    );
  }

  // ==========================================================
  // EVENT UTILITIES
  // ==========================================================

  function on(
    target,
    event,
    handler,
    options
  ) {

    if (
      !target ||
      !isFunction(handler)
    ) {
      return () => {};
    }

    target.addEventListener(
      event,
      handler,
      options
    );

    return () =>
      target.removeEventListener(
        event,
        handler,
        options
      );
  }

  function once(
    target,
    event,
    handler,
    options = {}
  ) {

    return on(
      target,
      event,
      handler,
      {
        ...options,
        once: true
      }
    );
  }

  function emit(
    eventName,
    detail = {},
    target = document
  ) {

    if (!target) {
      return;
    }

    target.dispatchEvent(
      new CustomEvent(
        eventName,
        {
          detail
        }
      )
    );
  }

  // ==========================================================
  // DEBOUNCE
  // ==========================================================

  function debounce(
    callback,
    wait = 300
  ) {

    let timeout = null;

    const debounced =
      function (...args) {

        const context = this;

        clearTimeout(
          timeout
        );

        timeout =
          setTimeout(
            () => {

              callback.apply(
                context,
                args
              );

            },
            wait
          );

      };

    debounced.cancel =
      () => {

        clearTimeout(
          timeout
        );

        timeout = null;

      };

    return debounced;
  }

  // ==========================================================
  // THROTTLE
  // ==========================================================

  function throttle(
    callback,
    wait = 100
  ) {

    let lastTime = 0;
    let timeout = null;

    const throttled =
      function (...args) {

        const now =
          Date.now();

        const remaining =
          wait -
          (now - lastTime);

        if (
          remaining <= 0
        ) {

          clearTimeout(
            timeout
          );

          timeout = null;
          lastTime = now;

          callback.apply(
            this,
            args
          );

        } else if (
          !timeout
        ) {

          timeout =
            setTimeout(
              () => {

                lastTime =
                  Date.now();

                timeout = null;

                callback.apply(
                  this,
                  args
                );

              },
              remaining
            );

        }

      };

    throttled.cancel =
      () => {

        clearTimeout(
          timeout
        );

        timeout = null;
        lastTime = 0;

      };

    return throttled;
  }

  // ==========================================================
  // ASYNC UTILITIES
  // ==========================================================

  function sleep(ms) {

    return new Promise(
      resolve =>
        setTimeout(
          resolve,
          Math.max(0, ms)
        )
    );
  }

  function timeoutPromise(
    promise,
    milliseconds = 10000
  ) {

    return Promise.race([
      promise,

      new Promise(
        (_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "Operation timed out."
                )
              ),
            milliseconds
          )
      )
    ]);
  }

  // ==========================================================
  // CLIPBOARD
  // ==========================================================

  async function copyToClipboard(
    value
  ) {

    if (isNullish(value)) {
      return false;
    }

    const text =
      String(value);

    try {

      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {

        await navigator.clipboard.writeText(
          text
        );

        return true;
      }

      const textarea =
        document.createElement(
          "textarea"
        );

      textarea.value =
        text;

      textarea.setAttribute(
        "readonly",
        ""
      );

      textarea.style.position =
        "fixed";

      textarea.style.left =
        "-9999px";

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

      logError(
        "Clipboard error",
        error
      );

      return false;
    }
  }

  // ==========================================================
  // STORAGE
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

      logError(
        "localStorage.set error",
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
        localStorage.getItem(
          key
        );

      if (value === null) {
        return fallback;
      }

      return JSON.parse(
        value
      );

    } catch {
      return fallback;
    }
  }

  function storageRemove(
    key
  ) {

    try {

      localStorage.removeItem(
        key
      );

      return true;

    } catch {
      return false;
    }
  }

  function storageClear() {

    try {

      localStorage.clear();

      return true;

    } catch {
      return false;
    }
  }

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

    } catch {
      return false;
    }
  }

  function sessionGet(
    key,
    fallback = null
  ) {

    try {

      const value =
        sessionStorage.getItem(
          key
        );

      if (value === null) {
        return fallback;
      }

      return JSON.parse(
        value
      );

    } catch {
      return fallback;
    }
  }

  function sessionRemove(
    key
  ) {

    try {

      sessionStorage.removeItem(
        key
      );

      return true;

    } catch {
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

    if (
      typeof value !== "string"
    ) {
      return fallback;
    }

    try {

      return JSON.parse(
        value
      );

    } catch {

      return fallback;
    }
  }

  function safeJSONStringify(
    value,
    fallback = ""
  ) {

    try {

      return JSON.stringify(
        value
      );

    } catch {

      return fallback;
    }
  }

  function deepClone(value) {

    if (
      isNullish(value)
    ) {
      return value;
    }

    if (
      typeof structuredClone ===
      "function"
    ) {

      try {
        return structuredClone(
          value
        );
      } catch {
        // Continue to fallback.
      }
    }

    return safeJSONParse(
      safeJSONStringify(
        value
      ),
      value
    );
  }

  // ==========================================================
  // VALIDATION
  // ==========================================================

  function isValidEmail(
    value
  ) {

    return (
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    ).test(
      String(value || "")
        .trim()
        .toLowerCase()
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

    if (
      country.toUpperCase() ===
      "IN"
    ) {

      return (
        /^(?:\+91|91)?[6-9]\d{9}$/
      ).test(phone);
    }

    return (
      /^\+?[1-9]\d{7,14}$/
    ).test(phone);
  }

  function isValidPincode(
    value
  ) {

    return (
      /^[1-9][0-9]{5}$/
    ).test(
      String(value || "")
        .trim()
    );
  }

  function isValidPAN(
    value
  ) {

    return (
      /^[A-Z]{5}[0-9]{4}[A-Z]$/
    ).test(
      String(value || "")
        .trim()
        .toUpperCase()
    );
  }

  function isValidOTP(
    value,
    length = 6
  ) {

    return new RegExp(
      `^\\d{${length}}$`
    ).test(
      String(value || "")
    );
  }

  function isStrongPassword(
    value
  ) {

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

  function unique(
    array
  ) {

    if (!Array.isArray(array)) {
      return [];
    }

    return [
      ...new Set(array)
    ];
  }

  function uniqueBy(
    array,
    key
  ) {

    if (!Array.isArray(array)) {
      return [];
    }

    const seen =
      new Set();

    return array.filter(
      item => {

        const value =
          typeof key === "function"
            ? key(item)
            : item?.[key];

        if (
          seen.has(value)
        ) {
          return false;
        }

        seen.add(value);

        return true;
      }
    );
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
          typeof key === "function"
            ? key(a)
            : a?.[key];

        const second =
          typeof key === "function"
            ? key(b)
            : b?.[key];

        if (
          first === second
        ) {
          return 0;
        }

        const comparison =
          first > second
            ? 1
            : -1;

        return (
          direction.toLowerCase() ===
          "desc"
            ? -comparison
            : comparison
        );

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
          typeof key === "function"
            ? key(item)
            : item?.[key];

        const groupKey =
          isNullish(group)
            ? "undefined"
            : String(group);

        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }

        groups[groupKey].push(
          item
        );

        return groups;

      },
      {}
    );
  }

  function chunk(
    array,
    size = 1
  ) {

    if (
      !Array.isArray(array) ||
      size <= 0
    ) {
      return [];
    }

    const result = [];

    for (
      let index = 0;
      index < array.length;
      index += size
    ) {

      result.push(
        array.slice(
          index,
          index + size
        )
      );

    }

    return result;
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
      error.response?.data?.message ||
      fallback
    );
  }

  function getErrorCode(
    error,
    fallback = "GHAR_UNKNOWN_ERROR"
  ) {

    if (!error) {
      return fallback;
    }

    return (
      error.code ||
      error.data?.code ||
      error.response?.data?.code ||
      fallback
    );
  }

  function logError(
    context,
    error
  ) {

    if (
      typeof console !==
      "undefined"
    ) {

      console.error(
        `[GHAR] ${context}`,
        error
      );

    }
  }

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

  async function safeAsync(
    callback,
    ...args
  ) {

    if (!isFunction(callback)) {
      return undefined;
    }

    try {

      return await callback(
        ...args
      );

    } catch (error) {

      logError(
        "Async callback error",
        error
      );

      return undefined;
    }
  }

  // ==========================================================
  // FORM UTILITIES
  // ==========================================================

  function formToObject(
    form
  ) {

    if (
      !form ||
      !(form instanceof HTMLFormElement)
    ) {
      return {};
    }

    const data =
      new FormData(form);

    const result = {};

    for (
      const [key, value] of
      data.entries()
    ) {

      if (
        Object.prototype.hasOwnProperty.call(
          result,
          key
        )
      ) {

        if (
          Array.isArray(
            result[key]
          )
        ) {

          result[key].push(
            value
          );

        } else {

          result[key] = [
            result[key],
            value
          ];

        }

      } else {

        result[key] = value;

      }

    }

    return result;
  }

  function resetForm(
    form
  ) {

    if (
      !form ||
      !(form instanceof HTMLFormElement)
    ) {
      return false;
    }

    form.reset();

    form
      .querySelectorAll(
        ".is-invalid, .is-valid"
      )
      .forEach(
        element =>
          element.classList.remove(
            "is-invalid",
            "is-valid"
          )
      );

    return true;
  }

  // ==========================================================
  // PAGINATION
  // ==========================================================

  function normalizePagination(
    page,
    limit
  ) {

    return {

      page: Math.max(
        1,
        Math.floor(
          toNumber(
            page,
            DEFAULT_PAGE
          )
        )
      ),

      limit: clamp(
        Math.floor(
          toNumber(
            limit,
            DEFAULT_LIMIT
          )
        ),
        1,
        GHAR.PAGINATION?.MAX_LIMIT ||
          100
      )

    };
  }

  // ==========================================================
  // SAFE REDIRECT
  // ==========================================================

  function safeRedirect(
    url,
    options = {}
  ) {

    if (!url) {
      return false;
    }

    try {

      const parsed =
        new URL(
          url,
          window.location.origin
        );

      const external =
        parsed.origin !==
        window.location.origin;

      if (
        external &&
        options.allowExternal !== true
      ) {

        return false;
      }

      if (
        options.newTab
      ) {

        window.open(
          parsed.href,
          "_blank",
          "noopener,noreferrer"
        );

        return true;
      }

      window.location.assign(
        parsed.href
      );

      return true;

    } catch {

      return false;
    }
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  Object.assign(
    utils,
    {

      // Types
      isObject,
      isArray,
      isString,
      isNumber,
      isBoolean,
      isFunction,
      isNullish,
      isEmpty,

      // Strings
      toString,
      normalizeWhitespace,
      capitalize,
      titleCase,
      sentenceCase,
      slugify,
      truncate,
      escapeHTML,
      escapeAttribute,
      stripHTML,

      // IDs
      uuid,
      randomString,

      // Numbers
      toNumber,
      clamp,
      round,
      formatNumber,

      // Currency
      formatCurrency,
      formatPrice,
      formatPriceRange,

      // Property
      formatArea,
      formatBHK,
      formatPercentage,

      // Dates
      parseDate,
      formatDate,
      formatDateTime,
      relativeTime,

      // URLs
      getQueryParams,
      getQueryParam,
      setQueryParam,
      buildUrl,
      isExternalUrl,

      // DOM
      $,
      $$,
      createElement,
      show,
      hide,
      toggle,
      addClass,
      removeClass,
      hasClass,
      toggleClass,

      // Events
      on,
      once,
      emit,

      // Async
      debounce,
      throttle,
      sleep,
      timeoutPromise,

      // Clipboard
      copyToClipboard,

      // Local storage
      storageSet,
      storageGet,
      storageRemove,
      storageClear,

      // Session storage
      sessionSet,
      sessionGet,
      sessionRemove,

      // JSON
      safeJSONParse,
      safeJSONStringify,
      deepClone,

      // Validation
      isValidEmail,
      isValidPhone,
      isValidPincode,
      isValidPAN,
      isValidOTP,
      isStrongPassword,

      // Arrays
      unique,
      uniqueBy,
      sortBy,
      groupBy,
      chunk,

      // Errors
      getErrorMessage,
      getErrorCode,
      logError,
      safeCall,
      safeAsync,

      // Forms
      formToObject,
      resetForm,

      // Pagination
      normalizePagination,

      // Navigation
      safeRedirect

    }
  );

  // ==========================================================
  // BACKWARD COMPATIBILITY
  // ==========================================================

  GHAR.$ = $;
  GHAR.$$ = $$;

  // ==========================================================
  // VERSION
  // ==========================================================

  utils.VERSION = "2.0.0";

  // ==========================================================
  // DEVELOPMENT LOG
  // ==========================================================

  if (
    GHAR.APP?.ENVIRONMENT ===
    "development"
  ) {

    console.log(
      "[GHAR] utils.js loaded",
      utils.VERSION
    );

  }

})(window, document);