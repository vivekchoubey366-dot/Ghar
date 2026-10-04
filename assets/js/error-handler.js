// ============================================================
// GHAR - Error-handler.js
// Global frontend error handling
// ============================================================

"use strict";

(function (window, document) {

  const GHAR = window.GHAR = window.GHAR || {};

  const ErrorHandler = {

    initialized: false,

    init() {

      if (this.initialized) {
        return;
      }

      this.initialized = true;

      window.addEventListener(
        "error",
        event => {

          this.handle(
            event.error ||
            new Error(
              event.message ||
              "Unknown error"
            ),
            {
              source:
                "window"
            }
          );

        }
      );

      window.addEventListener(
        "unhandledrejection",
        event => {

          this.handle(
            event.reason ||
            new Error(
              "Unhandled promise rejection"
            ),
            {
              source:
                "promise"
            }
          );

        }
      );

    },

    handle(error, context = {}) {

      const normalized =
        this.normalize(
          error
        );

      console.error(
        "[GHAR ERROR]",
        {
          ...normalized,
          context
        }
      );

      if (
        GHAR.Toast &&
        !context.silent
      ) {

        GHAR.Toast.error(
          context.userMessage ||
          "Something went wrong. Please try again."
        );

      }

      return normalized;
    },

    normalize(error) {

      if (
        error instanceof Error
      ) {

        return {
          name:
            error.name ||
            "Error",

          message:
            error.message ||
            "Unknown error",

          stack:
            error.stack ||
            null

        };

      }

      if (
        typeof error ===
        "object" &&
        error !== null
      ) {

        return {
          name:
            error.name ||
            "Error",

          message:
            error.message ||
            error.error ||
            "Unknown error",

          status:
            error.status ||
            error.statusCode ||
            null

        };

      }

      return {
        name: "Error",
        message: String(error)
      };
    },

    api(error) {

      return this.handle(
        error,
        {
          source: "api",
          userMessage:
            "We could not complete your request."
        }
      );

    },

    validation(error) {

      return this.handle(
        error,
        {
          source: "validation",
          userMessage:
            "Please check the information you entered."
        }
      );

    },

    silent(error) {

      return this.handle(
        error,
        {
          source: "silent",
          silent: true
        }
      );

    }
  };

  document.addEventListener(
    "DOMContentLoaded",
    () => ErrorHandler.init()
  );

  GHAR.ErrorHandler =
    ErrorHandler;

  window.GHARErrorHandler =
    ErrorHandler;

})(window, document);