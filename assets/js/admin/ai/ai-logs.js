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
 * GHAR — Admin AI
 * Module: ai-logs
 *
 * This module exposes an explicit init() lifecycle so pages can load
 * modules independently while sharing the GHAR frontend foundation.
 */
window.GHAR = window.GHAR || {};
GHAR.adminAI = GHAR.adminAI || {};
GHAR.adminAI["ai-logs"] = GHAR.adminAI["ai-logs"] || {};

GHAR.adminAI["ai-logs"].state = {
  initialized: false,
  loading: false,
  error: null
};

GHAR.adminAI["ai-logs"].init = async function (options = {}) {
  const state = GHAR.adminAI["ai-logs"].state;
  if (state.initialized) return state;

  state.loading = true;
  state.error = null;

  try {
    // Page-specific hooks can be supplied without changing the module API.
    if (typeof options.onInit === "function") {
      await options.onInit({ module: "ai-logs", role: "Admin AI" });
    }

    state.initialized = true;
    GHAR.utils.emit("ghar:adminAI:ai-logs:ready", { module: "ai-logs" });
    return state;
  } catch (error) {
    state.error = error;
    GHAR.utils.emit("ghar:adminAI:ai-logs:error", { error });
    throw error;
  } finally {
    state.loading = false;
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    GHAR.adminAI["ai-logs"].init().catch(() => {});
  }, { once: true });
} else {
  GHAR.adminAI["ai-logs"].init().catch(() => {});
}
