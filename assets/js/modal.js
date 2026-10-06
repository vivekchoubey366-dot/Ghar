// ============================================================
// GHAR - Modal.js
// Global Modal Manager
// ============================================================

"use strict";

(function (window, document) {

  const GHAR =
    window.GHAR =
    window.GHAR || {};

  const Modal = {

    activeModal: null,

    // ========================================================
    // OPEN
    // ========================================================

    open(options = {}) {

      const {
        id = `ghar-modal-${Date.now()}`,
        title = "",
        content = "",
        size = "medium",
        closable = true,
        backdropClose = true,
        escapeClose = true,
        buttons = [],
        autoFocus = true,
        restoreFocus = true,
        onOpen = null,
        onClose = null
      } = options;

      this.close();

      const previousFocus =
        document.activeElement;

      const overlay =
        document.createElement("div");

      overlay.className =
        "ghar-modal-overlay";

      overlay.dataset.modalId =
        id;

      const modal =
        document.createElement("div");

      modal.className =
        `ghar-modal ghar-modal-${size}`;

      modal.setAttribute(
        "role",
        "dialog"
      );

      modal.setAttribute(
        "aria-modal",
        "true"
      );

      modal.setAttribute(
        "aria-labelledby",
        `${id}-title`
      );

      if (title) {

        modal.innerHTML = `
          <div class="ghar-modal-header">

            <h2
              id="${id}-title"
              class="ghar-modal-title"
            ></h2>

            ${
              closable
                ? `
                  <button
                    type="button"
                    class="ghar-modal-close"
                    aria-label="Close dialog"
                  >
                    ×
                  </button>
                `
                : ""
            }

          </div>

          <div class="ghar-modal-body"></div>

          ${
            buttons.length
              ? `
                <div class="ghar-modal-footer"></div>
              `
              : ""
          }
        `;

      } else {

        modal.innerHTML = `
          <div class="ghar-modal-header">

            ${
              closable
                ? `
                  <button
                    type="button"
                    class="ghar-modal-close"
                    aria-label="Close dialog"
                  >
                    ×
                  </button>
                `
                : ""
            }

          </div>

          <div class="ghar-modal-body"></div>

          ${
            buttons.length
              ? `
                <div class="ghar-modal-footer"></div>
              `
              : ""
          }
        `;

      }

      // ======================================================
      // CONTENT
      // ======================================================

      const titleElement =
        modal.querySelector(
          ".ghar-modal-title"
        );

      if (titleElement) {
        titleElement.textContent =
          title;
      }

      const body =
        modal.querySelector(
          ".ghar-modal-body"
        );

      if (typeof content === "string") {

        body.innerHTML =
          content;

      } else if (
        content instanceof Node
      ) {

        body.appendChild(
          content
        );

      }

      // ======================================================
      // BUTTONS
      // ======================================================

      const footer =
        modal.querySelector(
          ".ghar-modal-footer"
        );

      if (footer) {

        buttons.forEach(
          (button, index) => {

            const element =
              document.createElement(
                "button"
              );

            element.type =
              button.type || "button";

            element.className =
              button.className ||
              "ghar-btn";

            element.dataset.modalAction =
              index;

            element.textContent =
              button.label ||
              "Action";

            if (button.disabled) {
              element.disabled = true;
            }

            if (button.ariaLabel) {

              element.setAttribute(
                "aria-label",
                button.ariaLabel
              );

            }

            element.addEventListener(
              "click",
              async event => {

                if (
                  typeof button.onClick ===
                  "function"
                ) {

                  await button.onClick(
                    event,
                    this,
                    modal
                  );

                }

              }
            );

            footer.appendChild(
              element
            );

          }
        );

      }

      // ======================================================
      // APPEND
      // ======================================================

      overlay.appendChild(
        modal
      );

      document.body.appendChild(
        overlay
      );

      this.activeModal = {

        id,

        overlay,

        modal,

        previousFocus,

        restoreFocus,

        onClose,

        escapeHandler: null

      };

      document.body.classList.add(
        "ghar-modal-open"
      );

      // ======================================================
      // CLOSE BUTTON
      // ======================================================

      if (closable) {

        modal
          .querySelector(
            ".ghar-modal-close"
          )
          ?.addEventListener(
            "click",
            () => this.close()
          );

      }

      // ======================================================
      // BACKDROP
      // ======================================================

      if (backdropClose) {

        overlay.addEventListener(
          "click",
          event => {

            if (
              event.target === overlay
            ) {

              this.close();

            }

          }
        );

      }

      // ======================================================
      // ESCAPE KEY
      // ======================================================

      if (escapeClose) {

        const escapeHandler =
          event => {

            if (
              event.key === "Escape" &&
              this.activeModal
            ) {

              event.preventDefault();

              this.close();

            }

          };

        this.activeModal.escapeHandler =
          escapeHandler;

        document.addEventListener(
          "keydown",
          escapeHandler
        );

      }

      // ======================================================
      // FOCUS TRAP
      // ======================================================

      modal.addEventListener(
        "keydown",
        event => {

          if (
            event.key !== "Tab"
          ) {
            return;
          }

          const focusable =
            this.getFocusableElements(
              modal
            );

          if (!focusable.length) {
            return;
          }

          const first =
            focusable[0];

          const last =
            focusable[
              focusable.length - 1
            ];

          if (
            event.shiftKey &&
            document.activeElement === first
          ) {

            event.preventDefault();

            last.focus();

          } else if (
            !event.shiftKey &&
            document.activeElement === last
          ) {

            event.preventDefault();

            first.focus();

          }

        }
      );

      // ======================================================
      // ANIMATION
      // ======================================================

      requestAnimationFrame(
        () => {

          overlay.classList.add(
            "is-open"
          );

        }
      );

      // ======================================================
      // OPEN CALLBACK
      // ======================================================

      if (
        typeof onOpen ===
        "function"
      ) {

        onOpen(
          modal,
          this
        );

      }

      document.dispatchEvent(
        new CustomEvent(
          "ghar:modal:open",
          {
            detail: {
              id,
              modal
            }
          }
        )
      );

      // ======================================================
      // AUTO FOCUS
      // ======================================================

      if (autoFocus) {

        requestAnimationFrame(
          () => {

            const focusable =
              this.getFocusableElements(
                modal
              );

            if (focusable.length) {

              focusable[0].focus();

            } else {

              modal.setAttribute(
                "tabindex",
                "-1"
              );

              modal.focus();

            }

          }
        );

      }

      return modal;

    },

    // ========================================================
    // CLOSE
    // ========================================================

    close() {

      if (
        !this.activeModal
      ) {
        return false;
      }

      const instance =
        this.activeModal;

      const {
        overlay,
        previousFocus,
        restoreFocus,
        onClose,
        escapeHandler,
        id
      } = instance;

      if (escapeHandler) {

        document.removeEventListener(
          "keydown",
          escapeHandler
        );

      }

      overlay.classList.remove(
        "is-open"
      );

      this.activeModal = null;

      setTimeout(
        () => {

          overlay.remove();

          document.body.classList.remove(
            "ghar-modal-open"
          );

          if (
            restoreFocus &&
            previousFocus &&
            typeof previousFocus.focus ===
              "function" &&
            document.contains(
              previousFocus
            )
          ) {

            previousFocus.focus();

          }

          if (
            typeof onClose ===
            "function"
          ) {

            onClose(
              this
            );

          }

          document.dispatchEvent(
            new CustomEvent(
              "ghar:modal:close",
              {
                detail: {
                  id
                }
              }
            )
          );

        },
        150
      );

      return true;

    },

    // ========================================================
    // CONFIRM
    // ========================================================

    confirm(options = {}) {

      return new Promise(
        resolve => {

          let resolved = false;

          const finish =
            value => {

              if (resolved) {
                return;
              }

              resolved = true;

              this.close();

              resolve(
                value
              );

            };

          this.open({

            title:
              options.title ||
              "Confirm Action",

            content:
              options.message ||
              "Are you sure?",

            size:
              options.size ||
              "small",

            closable:
              options.closable !== false,

            backdropClose:
              options.backdropClose !== false,

            buttons: [

              {

                label:
                  options.cancelText ||
                  "Cancel",

                className:
                  options.cancelClass ||
                  "ghar-btn ghar-btn-secondary",

                onClick:
                  () => finish(false)

              },

              {

                label:
                  options.confirmText ||
                  "Confirm",

                className:
                  options.confirmClass ||
                  "ghar-btn ghar-btn-primary",

                onClick:
                  () => finish(true)

              }

            ]

          });

        }
      );

    },

    // ========================================================
    // ALERT
    // ========================================================

    alert(options = {}) {

      return new Promise(
        resolve => {

          this.open({

            title:
              options.title ||
              "GHAR",

            content:
              options.message ||
              "",

            size:
              options.size ||
              "small",

            buttons: [

              {

                label:
                  options.buttonText ||
                  "OK",

                className:
                  options.buttonClass ||
                  "ghar-btn ghar-btn-primary",

                onClick:
                  () => {

                    this.close();

                    resolve(
                      true
                    );

                  }

              }

            ],

            onClose: () => {

              resolve(
                true
              );

            }

          });

        }
      );

    },

    // ========================================================
    // GET FOCUSABLE ELEMENTS
    // ========================================================

    getFocusableElements(
      container
    ) {

      return Array.from(
        container.querySelectorAll(
          `
          a[href],
          button:not([disabled]),
          textarea:not([disabled]),
          input:not([disabled]),
          select:not([disabled]),
          [tabindex]:not([tabindex="-1"])
          `
        )
      ).filter(
        element =>
          !element.hidden &&
          element.offsetParent !== null
      );

    },

    // ========================================================
    // IS OPEN
    // ========================================================

    isOpen() {

      return Boolean(
        this.activeModal
      );

    },

    // ========================================================
    // GET ACTIVE MODAL
    // ========================================================

    getActive() {

      return (
        this.activeModal?.modal ||
        null
      );

    }

  };

  // ==========================================================
  // GLOBAL EXPORT
  // ==========================================================

  GHAR.Modal =
    Modal;

  window.GHARModal =
    Modal;

})(window, document);