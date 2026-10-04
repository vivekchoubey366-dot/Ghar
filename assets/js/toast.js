// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/Toast.js
// Notification Toast System
// ============================================================

"use strict";

(function (window, document) {

  const GHAR = window.GHAR = window.GHAR || {};

  const Toast = {

    container: null,

    // ----------------------------------------------------------
    // INITIALIZE
    // ----------------------------------------------------------

    init() {

      if (this.container) {
        return this.container;
      }

      this.container =
        document.createElement("div");

      this.container.className =
        "ghar-toast-container";

      this.container.setAttribute(
        "aria-live",
        "polite"
      );

      this.container.setAttribute(
        "aria-atomic",
        "true"
      );

      document.body.appendChild(
        this.container
      );

      return this.container;
    },

    // ----------------------------------------------------------
    // SHOW
    // ----------------------------------------------------------

    show(
      message,
      options = {}
    ) {

      this.init();

      const {
        type = "info",
        title = "",
        duration = 4000,
        closable = true
      } = options;

      const toast =
        document.createElement("div");

      toast.className =
        `ghar-toast ghar-toast-${type}`;

      toast.innerHTML = `

        <div class="ghar-toast-content">

          ${
            title
              ? `
                <strong class="ghar-toast-title">
                  ${this.escapeHTML(title)}
                </strong>
              `
              : ""
          }

          <div class="ghar-toast-message">
            ${this.escapeHTML(message)}
          </div>

        </div>

        ${
          closable
            ? `
              <button
                type="button"
                class="ghar-toast-close"
                aria-label="Close notification"
              >
                &times;
              </button>
            `
            : ""
        }

      `;

      this.container.appendChild(
        toast
      );

      requestAnimationFrame(() => {
        toast.classList.add(
          "is-visible"
        );
      });

      const close =
        () => {

          toast.classList.remove(
            "is-visible"
          );

          setTimeout(
            () => toast.remove(),
            250
          );

        };

      const closeButton =
        toast.querySelector(
          ".ghar-toast-close"
        );

      if (closeButton) {
        closeButton.addEventListener(
          "click",
          close
        );
      }

      if (duration > 0) {

        setTimeout(
          close,
          duration
        );

      }

      return {
        element: toast,
        close
      };

    },

    success(
      message,
      options = {}
    ) {

      return this.show(
        message,
        {
          ...options,
          type: "success"
        }
      );

    },

    error(
      message,
      options = {}
    ) {

      return this.show(
        message,
        {
          ...options,
          type: "error",
          duration:
            options.duration ??
            6000
        }
      );

    },

    warning(
      message,
      options = {}
    ) {

      return this.show(
        message,
        {
          ...options,
          type: "warning"
        }
      );

    },

    info(
      message,
      options = {}
    ) {

      return this.show(
        message,
        {
          ...options,
          type: "info"
        }
      );

    },

    clear() {

      if (!this.container) {
        return;
      }

      this.container.innerHTML = "";

    },

    escapeHTML(value) {

      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    }

  };

  GHAR.Toast = Toast;

  window.GHARTOAST = Toast;

  document.addEventListener(
    "DOMContentLoaded",
    () => Toast.init()
  );

})(window, document);