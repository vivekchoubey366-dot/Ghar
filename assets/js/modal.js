// ============================================================
// GHAR - Modal.js
// Global Modal Manager
// ============================================================

"use strict";

(function (window, document) {

  const GHAR = window.GHAR = window.GHAR || {};

  const Modal = {

    activeModal: null,

    open(options = {}) {

      const {
        id = `ghar-modal-${Date.now()}`,
        title = "",
        content = "",
        size = "medium",
        closable = true,
        backdropClose = true,
        buttons = [],
        onOpen = null,
        onClose = null
      } = options;

      this.close();

      const overlay = document.createElement("div");

      overlay.className = "ghar-modal-overlay";
      overlay.dataset.modalId = id;

      const modal = document.createElement("div");

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

      modal.innerHTML = `
        <div class="ghar-modal-header">

          <h2 id="${id}-title">
            ${title}
          </h2>

          ${
            closable
              ? `
                <button
                  type="button"
                  class="ghar-modal-close"
                  aria-label="Close"
                >
                  ×
                </button>
              `
              : ""
          }

        </div>

        <div class="ghar-modal-body">
          ${content}
        </div>

        ${
          buttons.length
            ? `
              <div class="ghar-modal-footer">
                ${buttons.map((button, index) => `
                  <button
                    type="button"
                    class="${button.className || "ghar-btn"}"
                    data-modal-action="${index}"
                  >
                    ${button.label || "Action"}
                  </button>
                `).join("")}
              </div>
            `
            : ""
        }
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      this.activeModal = {
        id,
        overlay,
        modal,
        onClose
      };

      document.body.classList.add(
        "ghar-modal-open"
      );

      requestAnimationFrame(() => {
        overlay.classList.add("is-open");
      });

      if (closable) {

        const closeButton =
          modal.querySelector(
            ".ghar-modal-close"
          );

        closeButton?.addEventListener(
          "click",
          () => this.close()
        );

      }

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

      buttons.forEach(
        (button, index) => {

          const element =
            modal.querySelector(
              `[data-modal-action="${index}"]`
            );

          element?.addEventListener(
            "click",
            event => {

              if (
                typeof button.onClick ===
                "function"
              ) {
                button.onClick(
                  event,
                  this
                );
              }

            }
          );

        }
      );

      if (
        typeof onOpen ===
        "function"
      ) {
        onOpen(modal);
      }

      return modal;
    },

    close() {

      if (!this.activeModal) {
        return;
      }

      const {
        overlay,
        onClose
      } = this.activeModal;

      overlay.classList.remove(
        "is-open"
      );

      setTimeout(() => {

        overlay.remove();

        document.body.classList.remove(
          "ghar-modal-open"
        );

        if (
          typeof onClose ===
          "function"
        ) {
          onClose();
        }

      }, 150);

      this.activeModal = null;
    },

    confirm(options = {}) {

      return new Promise(resolve => {

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

          buttons: [

            {
              label:
                options.cancelText ||
                "Cancel",

              className:
                "ghar-btn ghar-btn-secondary",

              onClick: () => {

                this.close();
                resolve(false);

              }
            },

            {
              label:
                options.confirmText ||
                "Confirm",

              className:
                "ghar-btn ghar-btn-primary",

              onClick: () => {

                this.close();
                resolve(true);

              }
            }

          ]

        });

      });
    }
  };

  GHAR.Modal = Modal;

  window.GHARModal = Modal;

})(window, document);