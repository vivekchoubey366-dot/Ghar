// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/components.js
// Shared UI Components
// ============================================================

"use strict";

(function (window, document) {

  // ==========================================================
  // GHAR COMPONENTS
  // ==========================================================

  const GHARComponents = {

    // --------------------------------------------------------
    // CONFIG
    // --------------------------------------------------------

    config: {
      appName: "GHAR",
      version:
        window.GHAR_CONFIG?.APP_VERSION ||
        "1.0.0"
    },

    // --------------------------------------------------------
    // INIT
    // --------------------------------------------------------

    init() {

      this.initGlobalComponents();
      this.initButtons();
      this.initForms();
      this.initModals();
      this.initTabs();
      this.initDropdowns();
      this.initAccordions();
      this.initAlerts();
      this.initTooltips();
      this.initLazyImages();
      this.initCopyButtons();
      this.initPasswordToggles();

      this.emit("ghar:components-ready");

      return this;
    },

    // ========================================================
    // GLOBAL COMPONENTS
    // ========================================================

    initGlobalComponents() {

      this.renderCurrentYear();
      this.markActiveNavigation();
      this.updateAuthUI();

    },

    // --------------------------------------------------------
    // CURRENT YEAR
    // --------------------------------------------------------

    renderCurrentYear() {

      const elements =
        document.querySelectorAll(
          "[data-current-year]"
        );

      const year =
        new Date().getFullYear();

      elements.forEach(
        element => {
          element.textContent = year;
        }
      );

    },

    // --------------------------------------------------------
    // ACTIVE NAVIGATION
    // --------------------------------------------------------

    markActiveNavigation() {

      const currentPath =
        window.location.pathname
          .replace(/\/+$/, "")
          .toLowerCase();

      const links =
        document.querySelectorAll(
          "[data-nav-link]"
        );

      links.forEach(link => {

        const href =
          link.getAttribute("href");

        if (!href) return;

        let linkPath;

        try {

          linkPath =
            new URL(
              href,
              window.location.origin
            ).pathname
              .replace(/\/+$/, "")
              .toLowerCase();

        } catch {
          return;
        }

        if (
          linkPath === currentPath ||
          (
            linkPath &&
            currentPath.startsWith(
              linkPath + "/"
            )
          )
        ) {

          link.classList.add(
            "is-active"
          );

          link.setAttribute(
            "aria-current",
            "page"
          );

        }

      });

    },

    // ========================================================
    // AUTH UI
    // ========================================================

    updateAuthUI() {

      let authenticated = false;

      try {

        if (
          window.GHAR_AUTH &&
          typeof window.GHAR_AUTH.isAuthenticated ===
            "function"
        ) {

          authenticated =
            window.GHAR_AUTH.isAuthenticated();

        }

      } catch (error) {

        console.warn(
          "[GHAR Components] Auth UI error:",
          error
        );

      }

      document
        .querySelectorAll(
          "[data-auth-only]"
        )
        .forEach(element => {

          element.hidden =
            !authenticated;

        });

      document
        .querySelectorAll(
          "[data-guest-only]"
        )
        .forEach(element => {

          element.hidden =
            authenticated;

        });

    },

    // ========================================================
    // BUTTONS
    // ========================================================

    initButtons() {

      document.addEventListener(
        "click",
        event => {

          const button =
            event.target.closest(
              "[data-action]"
            );

          if (!button) return;

          const action =
            button.dataset.action;

          this.handleAction(
            action,
            button,
            event
          );

        }
      );

    },

    // --------------------------------------------------------
    // ACTION HANDLER
    // --------------------------------------------------------

    handleAction(
      action,
      element,
      event
    ) {

      switch (action) {

        case "back":
          window.history.back();
          break;

        case "forward":
          window.history.forward();
          break;

        case "reload":
          window.location.reload();
          break;

        case "close-modal":
          this.closeModal(
            element.dataset.modal
          );
          break;

        case "open-modal":
          this.openModal(
            element.dataset.modal
          );
          break;

        case "logout":

          if (
            window.GHAR_AUTH &&
            typeof window.GHAR_AUTH.logout ===
              "function"
          ) {

            window.GHAR_AUTH.logout();

          }

          break;

        default:

          this.emit(
            `ghar:action:${action}`,
            {
              element,
              event
            }
          );

      }

    },

    // ========================================================
    // FORMS
    // ========================================================

    initForms() {

      document.addEventListener(
        "submit",
        event => {

          const form =
            event.target.closest(
              "[data-ghar-form]"
            );

          if (!form) return;

          if (
            form.dataset.validate !==
            "false"
          ) {

            const valid =
              this.validateForm(form);

            if (!valid) {

              event.preventDefault();

              this.showToast(
                "Please check the highlighted fields.",
                "error"
              );

              return;

            }

          }

          this.emit(
            "ghar:form-submit",
            {
              form,
              event
            }
          );

        }
      );

    },

    // --------------------------------------------------------
    // FORM VALIDATION
    // --------------------------------------------------------

    validateForm(form) {

      let valid = true;

      const fields =
        form.querySelectorAll(
          "input, select, textarea"
        );

      fields.forEach(field => {

        field.classList.remove(
          "is-invalid"
        );

        const required =
          field.hasAttribute(
            "required"
          );

        const value =
          field.value.trim();

        if (
          required &&
          !value
        ) {

          field.classList.add(
            "is-invalid"
          );

          valid = false;

          return;

        }

        if (
          field.type === "email" &&
          value
        ) {

          const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          if (
            !emailPattern.test(value)
          ) {

            field.classList.add(
              "is-invalid"
            );

            valid = false;

          }

        }

      });

      return valid;
    },

    // ========================================================
    // MODALS
    // ========================================================

    initModals() {

      document.addEventListener(
        "click",
        event => {

          const open =
            event.target.closest(
              "[data-open-modal]"
            );

          if (open) {

            event.preventDefault();

            this.openModal(
              open.dataset.openModal
            );

          }

          const close =
            event.target.closest(
              "[data-close-modal]"
            );

          if (close) {

            event.preventDefault();

            this.closeModal(
              close.dataset.closeModal
            );

          }

        }
      );

      document.addEventListener(
        "keydown",
        event => {

          if (
            event.key === "Escape"
          ) {

            this.closeAllModals();

          }

        }
      );

    },

    openModal(id) {

      if (!id) return;

      const modal =
        document.getElementById(id);

      if (!modal) return;

      modal.classList.add(
        "is-open"
      );

      modal.hidden = false;

      document.body.classList.add(
        "modal-open"
      );

      modal
        .querySelector(
          "button, input, select, textarea, [tabindex]"
        )
        ?.focus();

      this.emit(
        "ghar:modal-open",
        {
          modal
        }
      );

    },

    closeModal(id) {

      if (!id) return;

      const modal =
        document.getElementById(id);

      if (!modal) return;

      modal.classList.remove(
        "is-open"
      );

      modal.hidden = true;

      if (
        !document.querySelector(
          ".ghar-modal.is-open, [data-modal].is-open"
        )
      ) {

        document.body.classList.remove(
          "modal-open"
        );

      }

      this.emit(
        "ghar:modal-close",
        {
          modal
        }
      );

    },

    closeAllModals() {

      document
        .querySelectorAll(
          ".ghar-modal.is-open, [data-modal].is-open"
        )
        .forEach(modal => {

          modal.classList.remove(
            "is-open"
          );

          modal.hidden = true;

        });

      document.body.classList.remove(
        "modal-open"
      );

    },

    // ========================================================
    // TABS
    // ========================================================

    initTabs() {

      document.addEventListener(
        "click",
        event => {

          const tab =
            event.target.closest(
              "[data-tab-target]"
            );

          if (!tab) return;

          event.preventDefault();

          const targetId =
            tab.dataset.tabTarget;

          const group =
            tab.closest(
              "[data-tabs]"
            );

          if (!group) return;

          group
            .querySelectorAll(
              "[data-tab-target]"
            )
            .forEach(item => {

              item.classList.remove(
                "is-active"
              );

              item.setAttribute(
                "aria-selected",
                "false"
              );

            });

          group
            .querySelectorAll(
              "[data-tab-panel]"
            )
            .forEach(panel => {

              panel.hidden = true;

            });

          tab.classList.add(
            "is-active"
          );

          tab.setAttribute(
            "aria-selected",
            "true"
          );

          const panel =
            group.querySelector(
              `[data-tab-panel="${targetId}"]`
            );

          if (panel) {

            panel.hidden = false;

          }

          this.emit(
            "ghar:tab-change",
            {
              tab,
              panel
            }
          );

        }
      );

    },

    // ========================================================
    // DROPDOWNS
    // ========================================================

    initDropdowns() {

      document.addEventListener(
        "click",
        event => {

          const trigger =
            event.target.closest(
              "[data-dropdown-toggle]"
            );

          if (trigger) {

            event.preventDefault();

            const id =
              trigger.dataset.dropdownToggle;

            const dropdown =
              document.getElementById(id);

            if (!dropdown) return;

            const open =
              dropdown.classList.toggle(
                "is-open"
              );

            trigger.setAttribute(
              "aria-expanded",
              String(open)
            );

            return;

          }

          if (
            !event.target.closest(
              "[data-dropdown]"
            )
          ) {

            this.closeDropdowns();

          }

        }
      );

    },

    closeDropdowns() {

      document
        .querySelectorAll(
          "[data-dropdown].is-open"
        )
        .forEach(dropdown => {

          dropdown.classList.remove(
            "is-open"
          );

        });

      document
        .querySelectorAll(
          "[data-dropdown-toggle]"
        )
        .forEach(trigger => {

          trigger.setAttribute(
            "aria-expanded",
            "false"
          );

        });

    },

    // ========================================================
    // ACCORDIONS
    // ========================================================

    initAccordions() {

      document.addEventListener(
        "click",
        event => {

          const trigger =
            event.target.closest(
              "[data-accordion-toggle]"
            );

          if (!trigger) return;

          const accordion =
            trigger.closest(
              "[data-accordion]"
            );

          if (!accordion) return;

          const panel =
            accordion.querySelector(
              "[data-accordion-panel]"
            );

          if (!panel) return;

          const open =
            accordion.classList.toggle(
              "is-open"
            );

          panel.hidden =
            !open;

          trigger.setAttribute(
            "aria-expanded",
            String(open)
          );

        }
      );

    },

    // ========================================================
    // ALERTS / TOASTS
    // ========================================================

    initAlerts() {

      document
        .querySelectorAll(
          "[data-auto-dismiss]"
        )
        .forEach(alert => {

          const timeout =
            Number(
              alert.dataset.autoDismiss
            ) || 5000;

          setTimeout(
            () => {

              alert.classList.add(
                "is-hidden"
              );

            },
            timeout
          );

        });

    },

    showToast(
      message,
      type = "info",
      duration = 4000
    ) {

      let container =
        document.getElementById(
          "ghar-toast-container"
        );

      if (!container) {

        container =
          document.createElement(
            "div"
          );

        container.id =
          "ghar-toast-container";

        container.className =
          "ghar-toast-container";

        container.setAttribute(
          "aria-live",
          "polite"
        );

        document.body.appendChild(
          container
        );

      }

      const toast =
        document.createElement(
          "div"
        );

      toast.className =
        `ghar-toast ghar-toast-${type}`;

      toast.setAttribute(
        "role",
        type === "error"
          ? "alert"
          : "status"
      );

      toast.textContent =
        String(message);

      container.appendChild(
        toast
      );

      requestAnimationFrame(
        () => {

          toast.classList.add(
            "is-visible"
          );

        }
      );

      setTimeout(
        () => {

          toast.classList.remove(
            "is-visible"
          );

          setTimeout(
            () => toast.remove(),
            300
          );

        },
        duration
      );

      return toast;
    },

    // ========================================================
    // TOOLTIPS
    // ========================================================

    initTooltips() {

      document.addEventListener(
        "mouseenter",
        event => {

          const element =
            event.target.closest(
              "[data-tooltip]"
            );

          if (!element) return;

          element.setAttribute(
            "title",
            element.dataset.tooltip
          );

        },
        true
      );

    },

    // ========================================================
    // LAZY IMAGES
    // ========================================================

    initLazyImages() {

      const images =
        document.querySelectorAll(
          "img[data-src]"
        );

      if (!images.length) return;

      if (
        "IntersectionObserver" in window
      ) {

        const observer =
          new IntersectionObserver(
            entries => {

              entries.forEach(entry => {

                if (!entry.isIntersecting) {
                  return;
                }

                const image =
                  entry.target;

                image.src =
                  image.dataset.src;

                image.removeAttribute(
                  "data-src"
                );

                observer.unobserve(
                  image
                );

              });

            },
            {
              rootMargin:
                "200px"
            }
          );

        images.forEach(
          image =>
            observer.observe(image)
        );

      } else {

        images.forEach(
          image => {

            image.src =
              image.dataset.src;

            image.removeAttribute(
              "data-src"
            );

          }
        );

      }

    },

    // ========================================================
    // COPY BUTTONS
    // ========================================================

    initCopyButtons() {

      document.addEventListener(
        "click",
        async event => {

          const button =
            event.target.closest(
              "[data-copy]"
            );

          if (!button) return;

          const value =
            button.dataset.copy;

          if (!value) return;

          try {

            await navigator.clipboard.writeText(
              value
            );

            this.showToast(
              "Copied successfully.",
              "success"
            );

          } catch {

            this.showToast(
              "Unable to copy.",
              "error"
            );

          }

        }
      );

    },

    // ========================================================
    // PASSWORD TOGGLE
    // ========================================================

    initPasswordToggles() {

      document.addEventListener(
        "click",
        event => {

          const button =
            event.target.closest(
              "[data-toggle-password]"
            );

          if (!button) return;

          const selector =
            button.dataset.togglePassword;

          const input =
            document.querySelector(
              selector
            );

          if (!input) return;

          const visible =
            input.type === "text";

          input.type =
            visible
              ? "password"
              : "text";

          button.setAttribute(
            "aria-pressed",
            String(!visible)
          );

        }
      );

    },

    // ========================================================
    // HTML HELPERS
    // ========================================================

    escapeHTML(value) {

      const div =
        document.createElement(
          "div"
        );

      div.textContent =
        String(value ?? "");

      return div.innerHTML;

    },

    // ========================================================
    // DOM HELPERS
    // ========================================================

    qs(
      selector,
      parent = document
    ) {

      return parent.querySelector(
        selector
      );

    },

    qsa(
      selector,
      parent = document
    ) {

      return Array.from(
        parent.querySelectorAll(
          selector
        )
      );

    },

    createElement(
      tag,
      className = "",
      text = ""
    ) {

      const element =
        document.createElement(
          tag
        );

      if (className) {

        element.className =
          className;

      }

      if (text) {

        element.textContent =
          text;

      }

      return element;

    },

    // ========================================================
    // EVENTS
    // ========================================================

    emit(
      eventName,
      detail = {}
    ) {

      document.dispatchEvent(
        new CustomEvent(
          eventName,
          {
            detail
          }
        )
      );

    },

    on(
      eventName,
      callback
    ) {

      document.addEventListener(
        eventName,
        callback
      );

    }

  };

  // ==========================================================
  // GLOBAL EXPORT
  // ==========================================================

  window.GHARComponents =
    GHARComponents;

  // Backward-compatible alias
  window.GHAR_COMPONENTS =
    GHARComponents;

  // ==========================================================
  // AUTO INITIALIZATION
  // ==========================================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () => GHARComponents.init(),
      {
        once: true
      }
    );

  } else {

    GHARComponents.init();

  }

})(window, document);