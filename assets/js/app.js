// ============================================================
// GHAR - App.js
// Main Frontend Application Bootstrap
// ============================================================

"use strict";

(function (window, document) {

  const GHAR = window.GHAR = window.GHAR || {};

  const App = {

    version:
      "1.0.0",

    initialized:
      false,

    config:
      window.GHAR_CONFIG || {},

    async init() {

      if (this.initialized) {
        return this;
      }

      try {

        this.initialized = true;

        this.initIdentity();
        this.initUtilities();
        this.initAccessibility();
        this.initNetwork();
        this.initComponents();
        this.initNavigation();
        this.initPage();

        document.documentElement
          .classList.add(
            "ghar-app-ready"
          );

        document.dispatchEvent(
          new CustomEvent(
            "ghar:ready",
            {
              detail: {
                app: this,
                version:
                  this.version
              }
            }
          )
        );

        return this;

      } catch (error) {

        if (
          GHAR.ErrorHandler
        ) {
          GHAR.ErrorHandler.handle(
            error,
            {
              source:
                "app-init",
              userMessage:
                "GHAR could not initialize correctly."
            }
          );
        } else {
          console.error(
            "GHAR initialization error:",
            error
          );
        }

        throw error;
      }

    },

    initIdentity() {

      let user = null;

      try {

        if (
          GHAR.Auth &&
          typeof GHAR.Auth.getUser ===
          "function"
        ) {
          user =
            GHAR.Auth.getUser();
        }

      } catch (error) {
        console.warn(
          "Unable to load user:",
          error
        );
      }

      if (
        GHAR.Role
      ) {
        GHAR.Role.setFromUser(
          user
        );
      }

      if (
        GHAR.Permissions
      ) {
        GHAR.Permissions.setUser(
          user
        );
      }

    },

    initUtilities() {

      if (
        GHAR.Accessibility
      ) {
        GHAR.Accessibility.init();
      }

      if (
        GHAR.ErrorHandler
      ) {
        GHAR.ErrorHandler.init();
      }

      if (
        GHAR.Offline
      ) {
        GHAR.Offline.init();
      }

    },

    initAccessibility() {

      if (
        GHAR.Accessibility
      ) {

        GHAR.Accessibility
          .setupAccessibleImages();

        GHAR.Accessibility
          .setupSkipLinks();

      }

    },

    initNetwork() {

      if (
        GHAR.Offline
      ) {
        GHAR.Offline.updateDOM();
      }

    },

    initComponents() {

      if (
        GHAR.Components &&
        typeof GHAR.Components.init ===
        "function"
      ) {

        GHAR.Components.init();

      }

      if (
        GHAR.Toast &&
        typeof GHAR.Toast.init ===
        "function"
      ) {

        GHAR.Toast.init();

      }

    },

    initNavigation() {

      if (
        GHAR.Navigation &&
        typeof GHAR.Navigation.init ===
        "function"
      ) {

        GHAR.Navigation.init();

      }

    },

    initPage() {

      const page =
        document.body?.dataset.page ||
        document.body?.dataset.module ||
        null;

      document.documentElement
        .dataset.gharPage =
        page || "";

      document.dispatchEvent(
        new CustomEvent(
          "ghar:page:init",
          {
            detail: {
              page
            }
          }
        )
      );

    },

    getPage() {

      return (
        document.body?.dataset.page ||
        document.body?.dataset.module ||
        null
      );

    },

    getUser() {

      if (
        GHAR.Auth &&
        typeof GHAR.Auth.getUser ===
        "function"
      ) {
        return GHAR.Auth.getUser();
      }

      return null;
    },

    getRole() {

      return GHAR.Role?.get() ||
        "guest";
    },

    isAuthenticated() {

      if (
        GHAR.Auth &&
        typeof GHAR.Auth.isAuthenticated ===
        "function"
      ) {
        return GHAR.Auth.isAuthenticated();
      }

      return Boolean(
        this.getUser()
      );

    },

    navigate(path) {

      if (
        GHAR.Navigation &&
        typeof GHAR.Navigation.navigate ===
        "function"
      ) {
        return GHAR.Navigation.navigate(
          path
        );
      }

      window.location.href =
        path;

    },

    logout() {

      if (
        GHAR.Auth &&
        typeof GHAR.Auth.logout ===
        "function"
      ) {
        return GHAR.Auth.logout();
      }

      window.location.href =
        "/login.html";

    }

  };

  GHAR.App = App;

  window.GHARApp = App;

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () => App.init()
    );

  } else {

    App.init();

  }

})(window, document);