// ============================================================
// GHAR - Accessibility.js
// Accessibility helpers
// ============================================================

"use strict";

(function (window, document) {

  const GHAR = window.GHAR = window.GHAR || {};

  const Accessibility = {

    init() {

      this.setupKeyboardNavigation();
      this.setupFocusVisibility();
      this.setupSkipLinks();
      this.setupAccessibleImages();
      this.setupReducedMotion();

    },

    setupKeyboardNavigation() {

      document.addEventListener(
        "keydown",
        event => {

          if (
            event.key ===
            "Escape"
          ) {

            if (
              GHAR.Modal &&
              GHAR.Modal.activeModal
            ) {
              GHAR.Modal.close();
            }

          }

        }
      );

    },

    setupFocusVisibility() {

      document.addEventListener(
        "keydown",
        event => {

          if (
            event.key ===
            "Tab"
          ) {
            document.body.classList.add(
              "ghar-keyboard-user"
            );
          }

        }
      );

      document.addEventListener(
        "mousedown",
        () => {

          document.body.classList.remove(
            "ghar-keyboard-user"
          );

        }
      );

    },

    setupSkipLinks() {

      document
        .querySelectorAll(
          'a[href^="#"]'
        )
        .forEach(link => {

          link.addEventListener(
            "click",
            event => {

              const id =
                link.getAttribute(
                  "href"
                );

              if (
                !id ||
                id === "#"
              ) {
                return;
              }

              const target =
                document.querySelector(
                  id
                );

              if (!target) {
                return;
              }

              event.preventDefault();

              target.setAttribute(
                "tabindex",
                "-1"
              );

              target.focus({
                preventScroll:
                  false
              });

              target.scrollIntoView({
                behavior: "smooth",
                block: "start"
              });

            }
          );

        });

    },

    setupAccessibleImages() {

      document
        .querySelectorAll(
          "img"
        )
        .forEach(image => {

          if (
            !image.hasAttribute(
              "alt"
            )
          ) {
            image.setAttribute(
              "alt",
              ""
            );
          }

          image.loading =
            image.loading ||
            "lazy";

        });

    },

    setupReducedMotion() {

      const reduced =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

      if (reduced) {

        document.documentElement
          .classList.add(
            "ghar-reduced-motion"
          );

      }

    },

    announce(message) {

      let region =
        document.getElementById(
          "ghar-live-region"
        );

      if (!region) {

        region =
          document.createElement(
            "div"
          );

        region.id =
          "ghar-live-region";

        region.className =
          "ghar-visually-hidden";

        region.setAttribute(
          "aria-live",
          "polite"
        );

        region.setAttribute(
          "aria-atomic",
          "true"
        );

        document.body.appendChild(
          region
        );

      }

      region.textContent =
        String(message || "");

    },

    focus(element) {

      const target =
        typeof element ===
        "string"
          ? document.querySelector(
              element
            )
          : element;

      if (!target) {
        return false;
      }

      target.setAttribute(
        "tabindex",
        "-1"
      );

      target.focus();

      return true;
    }

  };

  document.addEventListener(
    "DOMContentLoaded",
    () => Accessibility.init()
  );

  GHAR.Accessibility =
    Accessibility;

  window.GHAccessibility =
    Accessibility;

})(window, document);