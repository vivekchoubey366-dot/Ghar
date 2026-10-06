/* GHAR Frontend Shared Runtime */
window.GHAR = window.GHAR || {};
GHAR.config = GHAR.config || {};
GHAR.utils = GHAR.utils || {};

GHAR.utils.api = GHAR.utils.api || async function (url, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.body instanceof FormData ? {} : {"Content-Type": "application/json"}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(
      typeof payload === "object" && payload?.message
        ? payload.message
        : `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

GHAR.utils.emit = GHAR.utils.emit || function (eventName, detail = {}) {
  document.dispatchEvent(new CustomEvent(eventName, { detail }));
};

GHAR.utils.on = GHAR.utils.on || function (eventName, handler) {
  document.addEventListener(eventName, handler);
  return () => document.removeEventListener(eventName, handler);
};

GHAR.utils.getJSON = GHAR.utils.getJSON || function (key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
};

GHAR.utils.setJSON = GHAR.utils.setJSON || function (key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
};

/**
 * GHAR — Support Module
 * File: assets/js/support/create-ticket.js
 *
 * Provides:
 * - deterministic module state
 * - init/destroy lifecycle
 * - API access through GHAR.utils.api()
 * - DOM event integration
 * - page-specific hooks through options
 */
window.GHAR = window.GHAR || {};
GHAR.support = GHAR.support || {};

const GHAR_SUPPORT_CREATE_TICKET = {
  name: "create-ticket",
  group: "support",
  state: {
    initialized: false,
    loading: false,
    error: null,
    data: null
  },

  async init(options = {}) {
    if (this.state.initialized) return this.state;

    this.state.loading = true;
    this.state.error = null;

    try {
      if (typeof options.load === "function") {
        this.state.data = await options.load(this);
      }

      if (typeof options.bind === "function") {
        options.bind(this);
      }

      this.state.initialized = true;

      GHAR.utils.emit("ghar:support:create-ticket:ready", {
        module: this.name,
        data: this.state.data
      });

      return this.state;
    } catch (error) {
      this.state.error = error;

      GHAR.utils.emit("ghar:support:create-ticket:error", {
        module: this.name,
        error
      });

      throw error;
    } finally {
      this.state.loading = false;
    }
  },

  async request(url, options = {}) {
    return GHAR.utils.api(url, options);
  },

  destroy() {
    GHAR.utils.emit("ghar:support:create-ticket:destroy", {
      module: this.name
    });

    this.state.initialized = false;
    this.state.data = null;
    this.state.error = null;
  }
};

GHAR.support["create-ticket"] = GHAR_SUPPORT_CREATE_TICKET;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    GHAR.support["create-ticket"].init().catch(() => {});
  }, { once: true });
} else {
  GHAR.support["create-ticket"].init().catch(() => {});
}
