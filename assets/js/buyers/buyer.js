/**
 * GHAR Buyer Module
 * Initializes buyer-specific frontend behavior.
 */
"use strict";

const Buyer = (() => {
  const state = { initialized: false };

  function init() {
    if (state.initialized) return;
    state.initialized = true;
    document.dispatchEvent(new CustomEvent("ghar:buyer-ready"));
  }

  return { init, state };
})();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", Buyer.init, { once: true });
} else {
  Buyer.init();
}

window.GHARBuyer = Buyer;
