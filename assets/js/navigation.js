// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/navigation.js
// Global Navigation System
// ============================================================

"use strict";

(function (window, document) {

  // ==========================================================
  // GHAR NAVIGATION
  // ==========================================================

  const GHARNavigation = {

    // --------------------------------------------------------
    // CONFIGURATION
    // --------------------------------------------------------

    config: {
      mobileBreakpoint: 1024,

      selectors: {
        toggle:
          "[data-nav-toggle], [data-menu-toggle]",

        navigation:
          "[data-navigation], .ghar-navigation, .ghar-nav",

        mobileNavigation:
          "[data-mobile-navigation]",

        close:
          "[data-nav-close], [data-menu-close]",

        dropdownToggle:
          "[data-nav-dropdown-toggle]",

        dropdown:
          "[data-nav-dropdown]",

        overlay:
          "[data-nav-overlay]"
      }
    },

    // ========================================================
    // INITIALIZATION
    // ========================================================

    init() {

      this.cacheElements();

      this.bindEvents();

      this.setupMobileNavigation();

      this.setupDropdowns();

      this.setupActiveLinks();

      this.setupKeyboardNavigation();

      this.setupResizeHandler();

      this.setupScrollBehavior();

      this.emit(
        "ghar:navigation-ready"
      );

      return this;

    },

    // ========================================================
    // CACHE DOM
    // ========================================================

    cacheElements() {

      this.toggleButtons =
        Array.from(
          document.querySelectorAll(
            this.config.selectors.toggle
          )
        );

      this.navigation =
        document.querySelector(
          this.config.selectors.navigation
        );

      this.mobileNavigation =
        document.querySelector(
          this.config.selectors.mobileNavigation
        );

      this.overlay =
        document.querySelector(
          this.config.selectors.overlay
        );

      this.closeButtons =
        Array.from(
          document.querySelectorAll(
            this.config.selectors.close
          )
        );

      this.dropdownToggles =
        Array.from(
          document.querySelectorAll(
            this.config.selectors.dropdownToggle
          )
        );

    },

    // ========================================================
    // EVENTS
    // ========================================================

    bindEvents() {

      this.toggleButtons.forEach(
        button => {

          button.addEventListener(
            "click",
            event => {

              event.preventDefault();

              this.toggleMobileNavigation(
                button
              );

            }
          );

        }
      );

      this.closeButtons.forEach(
        button => {

          button.addEventListener(
            "click",
            event => {

              event.preventDefault();

              this.closeMobileNavigation();

            }
          );

        }
      );

      if (this.overlay) {

        this.overlay.addEventListener(
          "click",
          () => {

            this.closeMobileNavigation();

          }
        );

      }

      document.addEventListener(
        "keydown",
        event => {

          if (
            event.key === "Escape"
          ) {

            this.closeMobileNavigation();

            this.closeAllDropdowns();

          }

        }
      );

    },

    // ========================================================
    // MOBILE NAVIGATION
    // ========================================================

    setupMobileNavigation() {

      if (!this.navigation) {
        return;
      }

      this.closeMobileNavigation();

    },

    toggleMobileNavigation(button) {

      const isOpen =
        document.body.classList.contains(
          "nav-open"
        );

      if (isOpen) {

        this.closeMobileNavigation();

      } else {

        this.openMobileNavigation(
          button
        );

      }

    },

    openMobileNavigation(button) {

      document.body.classList.add(
        "nav-open"
      );

      document.body.classList.add(
        "menu-open"
      );

      if (this.navigation) {

        this.navigation.classList.add(
          "is-open"
        );

        this.navigation.setAttribute(
          "aria-hidden",
          "false"
        );

      }

      if (this.mobileNavigation) {

        this.mobileNavigation.classList.add(
          "is-open"
        );

        this.mobileNavigation.setAttribute(
          "aria-hidden",
          "false"
        );

      }

      if (this.overlay) {

        this.overlay.classList.add(
          "is-visible"
        );

        this.overlay.hidden =
          false;

      }

      this.toggleButtons.forEach(
        toggle => {

          toggle.setAttribute(
            "aria-expanded",
            "true"
          );

          toggle.classList.add(
            "is-active"
          );

        }
      );

      if (button) {

        button.setAttribute(
          "aria-expanded",
          "true"
        );

      }

      this.emit(
        "ghar:navigation-open"
      );

    },

    closeMobileNavigation() {

      document.body.classList.remove(
        "nav-open"
      );

      document.body.classList.remove(
        "menu-open"
      );

      if (this.navigation) {

        this.navigation.classList.remove(
          "is-open"
        );

        this.navigation.setAttribute(
          "aria-hidden",
          "true"
        );

      }

      if (this.mobileNavigation) {

        this.mobileNavigation.classList.remove(
          "is-open"
        );

        this.mobileNavigation.setAttribute(
          "aria-hidden",
          "true"
        );

      }

      if (this.overlay) {

        this.overlay.classList.remove(
          "is-visible"
        );

        this.overlay.hidden =
          true;

      }

      this.toggleButtons.forEach(
        toggle => {

          toggle.setAttribute(
            "aria-expanded",
            "false"
          );

          toggle.classList.remove(
            "is-active"
          );

        }
      );

      this.emit(
        "ghar:navigation-close"
      );

    },

    // ========================================================
    // DROPDOWNS
    // ========================================================

    setupDropdowns() {

      this.dropdownToggles.forEach(
        toggle => {

          toggle.setAttribute(
            "aria-expanded",
            "false"
          );

          toggle.addEventListener(
            "click",
            event => {

              event.preventDefault();

              this.toggleDropdown(
                toggle
              );

            }
          );

        }
      );

      document.addEventListener(
        "click",
        event => {

          if (
            !event.target.closest(
              "[data-nav-dropdown]"
            ) &&
            !event.target.closest(
              "[data-nav-dropdown-toggle]"
            )
          ) {

            this.closeAllDropdowns();

          }

        }
      );

    },

    toggleDropdown(toggle) {

      const dropdownId =
        toggle.dataset.navDropdownToggle;

      let dropdown = null;

      if (dropdownId) {

        dropdown =
          document.getElementById(
            dropdownId
          );

      }

      if (!dropdown) {

        const parent =
          toggle.closest(
            "[data-nav-dropdown]"
          );

        dropdown =
          parent?.querySelector(
            "[data-nav-dropdown-menu]"
          );

      }

      if (!dropdown) {
        return;
      }

      const isOpen =
        dropdown.classList.contains(
          "is-open"
        );

      this.closeAllDropdowns();

      if (!isOpen) {

        dropdown.classList.add(
          "is-open"
        );

        toggle.classList.add(
          "is-active"
        );

        toggle.setAttribute(
          "aria-expanded",
          "true"
        );

        dropdown.hidden =
          false;

      }

    },

    closeAllDropdowns() {

      document
        .querySelectorAll(
          "[data-nav-dropdown-menu].is-open"
        )
        .forEach(
          dropdown => {

            dropdown.classList.remove(
              "is-open"
            );

            dropdown.hidden =
              true;

          }
        );

      document
        .querySelectorAll(
          "[data-nav-dropdown-toggle]"
        )
        .forEach(
          toggle => {

            toggle.classList.remove(
              "is-active"
            );

            toggle.setAttribute(
              "aria-expanded",
              "false"
            );

          }
        );

    },

    // ========================================================
    // ACTIVE LINKS
    // ========================================================

    setupActiveLinks() {

      const currentPath =
        this.normalizePath(
          window.location.pathname
        );

      const links =
        document.querySelectorAll(
          "[data-nav-link], nav a, .ghar-nav a"
        );

      links.forEach(
        link => {

          const href =
            link.getAttribute(
              "href"
            );

          if (
            !href ||
            href === "#" ||
            href.startsWith(
              "javascript:"
            )
          ) {

            return;

          }

          let targetPath;

          try {

            targetPath =
              this.normalizePath(
                new URL(
                  href,
                  window.location.origin
                ).pathname
              );

          } catch {

            return;

          }

          if (
            targetPath ===
            currentPath
          ) {

            this.activateLink(
              link
            );

          } else if (
            targetPath !== "/" &&
            currentPath.startsWith(
              targetPath + "/"
            )
          ) {

            this.activateLink(
              link
            );

          }

        }
      );

    },

    activateLink(link) {

      link.classList.add(
        "is-active"
      );

      link.setAttribute(
        "aria-current",
        "page"
      );

      const dropdown =
        link.closest(
          "[data-nav-dropdown]"
        );

      if (dropdown) {

        dropdown.classList.add(
          "is-active"
        );

        const toggle =
          dropdown.querySelector(
            "[data-nav-dropdown-toggle]"
          );

        if (toggle) {

          toggle.classList.add(
            "is-active"
          );

        }

      }

    },

    normalizePath(pathname) {

      let path =
        pathname || "/";

      path =
        path
          .split("?")[0]
          .split("#")[0];

      path =
        path.replace(
          /\/index\.html$/i,
          ""
        );

      path =
        path.replace(
          /\.html$/i,
          ""
        );

      path =
        path.replace(
          /\/+$/,
          ""
        );

      return (
        path || "/"
      ).toLowerCase();

    },

    // ========================================================
    // KEYBOARD NAVIGATION
    // ========================================================

    setupKeyboardNavigation() {

      document.addEventListener(
        "keydown",
        event => {

          const active =
            document.activeElement;

          if (!active) {
            return;
          }

          const dropdownToggle =
            active.closest(
              "[data-nav-dropdown-toggle]"
            );

          if (
            !dropdownToggle
          ) {

            return;

          }

          if (
            event.key === "ArrowDown"
          ) {

            event.preventDefault();

            this.openDropdownFromKeyboard(
              dropdownToggle
            );

          }

          if (
            event.key === "Escape"
          ) {

            event.preventDefault();

            this.closeAllDropdowns();

            dropdownToggle.focus();

          }

        }
      );

    },

    openDropdownFromKeyboard(
      toggle
    ) {

      this.toggleDropdown(
        toggle
      );

      const dropdown =
        toggle
          .closest(
            "[data-nav-dropdown]"
          )
          ?.querySelector(
            "[data-nav-dropdown-menu]"
          );

      if (!dropdown) {
        return;
      }

      const firstLink =
        dropdown.querySelector(
          "a, button, [tabindex]"
        );

      if (firstLink) {

        firstLink.focus();

      }

    },

    // ========================================================
    // RESPONSIVE BEHAVIOUR
    // ========================================================

    setupResizeHandler() {

      let resizeTimer;

      window.addEventListener(
        "resize",
        () => {

          clearTimeout(
            resizeTimer
          );

          resizeTimer =
            setTimeout(
              () => {

                if (
                  window.innerWidth >
                  this.config.mobileBreakpoint
                ) {

                  this.closeMobileNavigation();

                }

                this.emit(
                  "ghar:navigation-resize",
                  {
                    width:
                      window.innerWidth,

                    height:
                      window.innerHeight
                  }
                );

              },
              150
            );

        }
      );

    },

    // ========================================================
    // SCROLL BEHAVIOUR
    // ========================================================

    setupScrollBehavior() {

      const header =
        document.querySelector(
          "[data-site-header], header.ghar-header"
        );

      if (!header) {
        return;
      }

      let lastScroll =
        window.scrollY;

      window.addEventListener(
        "scroll",
        () => {

          const currentScroll =
            window.scrollY;

          if (
            currentScroll >
            80
          ) {

            header.classList.add(
              "is-scrolled"
            );

          } else {

            header.classList.remove(
              "is-scrolled"
            );

          }

          if (
            currentScroll >
              lastScroll &&
            currentScroll >
              160
          ) {

            header.classList.add(
              "is-scroll-down"
            );

          } else {

            header.classList.remove(
              "is-scroll-down"
            );

          }

          lastScroll =
            currentScroll;

        },
        {
          passive: true
        }
      );

    },

    // ========================================================
    // NAVIGATION HELPERS
    // ========================================================

    goTo(
      url,
      options = {}
    ) {

      if (!url) {
        return;
      }

      if (
        options.newTab
      ) {

        window.open(
          url,
          "_blank",
          "noopener,noreferrer"
        );

        return;

      }

      window.location.href =
        url;

    },

    goBack() {

      window.history.back();

    },

    // ========================================================
    // ROLE NAVIGATION
    // ========================================================

    goToRoleDashboard(
      role
    ) {

      const dashboards = {

        buyer:
          "/buyer/dashboard.html",

        seller:
          "/seller/dashboard.html",

        tenant:
          "/tenant/dashboard.html",

        admin:
          "/admin/admin-dashboard.html"

      };

      const target =
        dashboards[
          String(role)
            .toLowerCase()
        ];

      if (!target) {

        this.goTo(
          "/dashboard.html"
        );

        return;

      }

      this.goTo(
        target
      );

    },

    // ========================================================
    // AUTH NAVIGATION
    // ========================================================

    logout() {

      try {

        if (
          window.GHAR_AUTH &&
          typeof window.GHAR_AUTH.logout ===
            "function"
        ) {

          window.GHAR_AUTH.logout();

          return;

        }

      } catch (error) {

        console.error(
          "[GHAR Navigation] Logout error:",
          error
        );

      }

      this.goTo(
        "/login.html"
      );

    },

    // ========================================================
    // EVENT SYSTEM
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

    }

  };

  // ==========================================================
  // GLOBAL EXPORT
  // ==========================================================

  window.GHARNavigation =
    GHARNavigation;

  // Backward-compatible alias

  window.GHAR_NAVIGATION =
    GHARNavigation;

  // ==========================================================
  // AUTO START
  // ==========================================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () =>
        GHARNavigation.init(),
      {
        once: true
      }
    );

  } else {

    GHARNavigation.init();

  }

})(window, document);