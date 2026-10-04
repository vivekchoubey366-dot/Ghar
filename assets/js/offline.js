// ============================================================
// GHAR - Offline.js
// Network status and offline support
// ============================================================

"use strict";

(function (window, document) {

  const GHAR = window.GHAR = window.GHAR || {};

  const Offline = {

    online:
      navigator.onLine,

    initialized: false,

    init() {

      if (this.initialized) {
        return;
      }

      this.initialized = true;

      this.online =
        navigator.onLine;

      window.addEventListener(
        "online",
        () => this.setStatus(true)
      );

      window.addEventListener(
        "offline",
        () => this.setStatus(false)
      );

      this.updateDOM();

    },

    setStatus(status) {

      this.online =
        Boolean(status);

      this.updateDOM();

      if (
        this.online
      ) {

        GHAR.Toast?.success(
          "Internet connection restored."
        );

      } else {

        GHAR.Toast?.warning(
          "You are offline. Some features may be unavailable.",
          {
            duration: 6000
          }
        );

      }

      GHAR.Accessibility?.announce(
        this.online
          ? "Internet connection restored."
          : "You are now offline."
      );

    },

    isOnline() {
      return this.online;
    },

    isOffline() {
      return !this.online;
    },

    updateDOM() {

      document.documentElement
        .classList.toggle(
          "ghar-offline",
          !this.online
        );

      document.documentElement
        .classList.toggle(
          "ghar-online",
          this.online
        );

      const indicators =
        document.querySelectorAll(
          "[data-network-status]"
        );

      indicators.forEach(
        element => {

          element.textContent =
            this.online
              ? "Online"
              : "Offline";

          element.dataset.status =
            this.online
              ? "online"
              : "offline";

        }
      );

    },

    requireOnline(
      callback
    ) {

      if (
        !this.online
      ) {

        GHAR.Toast?.warning(
          "This action requires an internet connection."
        );

        return false;
      }

      if (
        typeof callback ===
        "function"
      ) {
        return callback();
      }

      return true;
    }
  };

  document.addEventListener(
    "DOMContentLoaded",
    () => Offline.init()
  );

  GHAR.Offline = Offline;

  window.GHAROffline = Offline;

})(window, document);