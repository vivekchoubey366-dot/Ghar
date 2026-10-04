/* GHAR Admin/Documents frontend foundation */
window.GHAR = window.GHAR || {};
GHAR.config = GHAR.config || {};
GHAR.utils = GHAR.utils || {};

GHAR.utils.api = GHAR.utils.api || async function (url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const error = new Error(`API request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const type = response.headers.get("content-type") || "";
  return type.includes("application/json") ? response.json() : response.text();
};

GHAR.utils.emit = GHAR.utils.emit || function (name, detail = {}) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
};

GHAR.utils.on = GHAR.utils.on || function (name, handler) {
  document.addEventListener(name, handler);
  return () => document.removeEventListener(name, handler);
};

/**
 * GHAR — Admin
 * Module: audit-logs
 *
 * This module exposes an explicit init() lifecycle so pages can load
 * modules independently while sharing the GHAR frontend foundation.
 */
window.GHAR = window.GHAR || {};
GHAR.admin = GHAR.admin || {};
GHAR.admin["audit-logs"] = GHAR.admin["audit-logs"] || {};

GHAR.admin["audit-logs"].state = {
  initialized: false,
  loading: false,
  error: null
};

GHAR.admin["audit-logs"].init = async function (options = {}) {
  const state = GHAR.admin["audit-logs"].state;
  if (state.initialized) return state;

  state.loading = true;
  state.error = null;

  try {
    // Page-specific hooks can be supplied without changing the module API.
    if (typeof options.onInit === "function") {
      await options.onInit({ module: "audit-logs", role: "Admin" });
    }

    state.initialized = true;
    GHAR.utils.emit("ghar:admin:audit-logs:ready", { module: "audit-logs" });
    return state;
  } catch (error) {
    state.error = error;
    GHAR.utils.emit("ghar:admin:audit-logs:error", { error });
    throw error;
  } finally {
    state.loading = false;
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    GHAR.admin["audit-logs"].init().catch(() => {});
  }, { once: true });
} else {
  GHAR.admin["audit-logs"].init().catch(() => {});
}
