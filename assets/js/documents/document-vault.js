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
 * GHAR — Documents
 * Module: document-vault
 *
 * This module exposes an explicit init() lifecycle so pages can load
 * modules independently while sharing the GHAR frontend foundation.
 */
window.GHAR = window.GHAR || {};
GHAR.documents = GHAR.documents || {};
GHAR.documents["document-vault"] = GHAR.documents["document-vault"] || {};

GHAR.documents["document-vault"].state = {
  initialized: false,
  loading: false,
  error: null
};

GHAR.documents["document-vault"].init = async function (options = {}) {
  const state = GHAR.documents["document-vault"].state;
  if (state.initialized) return state;

  state.loading = true;
  state.error = null;

  try {
    // Page-specific hooks can be supplied without changing the module API.
    if (typeof options.onInit === "function") {
      await options.onInit({ module: "document-vault", role: "Documents" });
    }

    state.initialized = true;
    GHAR.utils.emit("ghar:documents:document-vault:ready", { module: "document-vault" });
    return state;
  } catch (error) {
    state.error = error;
    GHAR.utils.emit("ghar:documents:document-vault:error", { error });
    throw error;
  } finally {
    state.loading = false;
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    GHAR.documents["document-vault"].init().catch(() => {});
  }, { once: true });
} else {
  GHAR.documents["document-vault"].init().catch(() => {});
}
