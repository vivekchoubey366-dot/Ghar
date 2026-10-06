// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/navigation.js
// Global Navigation + Role-Aware Navigation System
// ============================================================

"use strict";

(function (window, document) {

  const GHAR = window.GHAR = window.GHAR || {};

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const CONFIG = {

    version: "2.0.0",

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

      dropdownMenu:
        "[data-nav-dropdown-menu]",

      overlay:
        "[data-nav-overlay]",

      navLink:
        "[data-nav-link], nav a, .ghar-nav a"

    },

    roles: [

      "buyer",
      "seller",
      "tenant",
      "agent",
      "business",
      "admin"

    ],

    roleAliases: {

      buy: "buyer",
      buyer: "buyer",

      sell: "seller",
      seller: "seller",
      owner: "seller",

      tenant: "tenant",
      renter: "tenant",
      rent: "tenant",

      agent: "agent",
      broker: "agent",

      business: "business",
      builder: "business",
      developer: "business",

      admin: "admin",
      administrator: "admin"

    },

    dashboards: {

      buyer:
        "/buyer/dashboard.html",

      seller:
        "/seller/dashboard.html",

      tenant:
        "/tenant/dashboard.html",

      agent:
        "/agent/dashboard.html",

      business:
        "/business/dashboard.html",

      admin:
        "/admin/admin-dashboard.html"

    },

    defaultDashboard:
      "/dashboard.html",

    login:
      "/login.html",

    forbidden:
      "/403.html"

  };


  // ==========================================================
  // STATE
  // ==========================================================

  const state = {

    initialized: false,

    mobileOpen: false,

    activeDropdown: null,

    currentRole: null,

    authenticated: false,

    lastScroll: 0

  };


  // ==========================================================
  // ROLE MANAGEMENT
  // ==========================================================

  function normalizeRole(role) {

    if (!role) {
      return null;
    }

    const value =
      String(role)
        .trim()
        .toLowerCase();

    return (
      CONFIG.roleAliases[value] ||
      (
        CONFIG.roles.includes(value)
          ? value
          : null
      )
    );

  }


  function getRole() {

    let role = null;

    // GHAR auth module

    try {

      if (
        window.GHAR_AUTH &&
        typeof window.GHAR_AUTH.getRole ===
          "function"
      ) {

        role =
          window.GHAR_AUTH.getRole();

      }

    } catch (error) {

      console.warn(
        "[GHAR Navigation] Auth role error:",
        error
      );

    }


    // GHAR Auth object

    if (!role) {

      try {

        if (
          window.GHARAuth &&
          typeof window.GHARAuth.getRole ===
            "function"
        ) {

          role =
            window.GHARAuth.getRole();

        }

      } catch (error) {

        console.warn(
          "[GHAR Navigation] GHARAuth role error:",
          error
        );

      }

    }


    // Storage

    if (!role) {

      try {

        role =
          localStorage.getItem(
            "ghar_role"
          );

      } catch {}

    }


    // User object

    if (!role) {

      try {

        const user =
          JSON.parse(
            localStorage.getItem(
              "ghar_user"
            ) || "null"
          );

        role =
          user?.role ||
          user?.userRole ||
          user?.accountType;

      } catch {}

    }


    // HTML dataset

    if (!role) {

      role =
        document.body?.dataset.role ||
        document.documentElement?.dataset.role;

    }


    return normalizeRole(role);

  }


  function setRole(role) {

    const normalized =
      normalizeRole(role);

    if (!normalized) {

      state.currentRole = null;

      return false;

    }

    state.currentRole =
      normalized;

    document.body.dataset.role =
      normalized;

    document.documentElement.dataset.role =
      normalized;

    document.body.dataset.userRole =
      normalized;

    return true;

  }


  // ==========================================================
  // AUTHENTICATION
  // ==========================================================

  function isAuthenticated() {

    try {

      if (
        window.GHAR_AUTH &&
        typeof window.GHAR_AUTH.isAuthenticated ===
          "function"
      ) {

        return Boolean(
          window.GHAR_AUTH.isAuthenticated()
        );

      }

      if (
        window.GHARAuth &&
        typeof window.GHARAuth.isAuthenticated ===
          "function"
      ) {

        return Boolean(
          window.GHARAuth.isAuthenticated()
        );

      }

    } catch {}

    try {

      const token =
        localStorage.getItem(
          "ghar_access_token"
        ) ||
        localStorage.getItem(
          "ghar_token"
        );

      return Boolean(token);

    } catch {

      return false;

    }

  }


  // ==========================================================
  // INITIALIZATION
  // ==========================================================

  init() {

    if (state.initialized) {
      return this;
    }

    this.cacheElements();

    this.detectAuthentication();

    this.detectRole();

    this.bindEvents();

    this.setupMobileNavigation();

    this.setupDropdowns();

    this.setupActiveLinks();

    this.setupRoleNavigation();

    this.setupKeyboardNavigation();

    this.setupResizeHandler();

    this.setupScrollBehavior();

    this.setupOutsideClick();

    this.emit(
      "ghar:navigation-ready",
      {
        role:
          state.currentRole,

        authenticated:
          state.authenticated

      }
    );

    state.initialized =
      true;

    return this;

  },


  // ==========================================================
  // CACHE DOM
  // ==========================================================

  cacheElements() {

    this.toggleButtons =
      Array.from(
        document.querySelectorAll(
          CONFIG.selectors.toggle
        )
      );

    this.navigation =
      document.querySelector(
        CONFIG.selectors.navigation
      );

    this.mobileNavigation =
      document.querySelector(
        CONFIG.selectors.mobileNavigation
      );

    this.overlay =
      document.querySelector(
        CONFIG.selectors.overlay
      );

    this.closeButtons =
      Array.from(
        document.querySelectorAll(
          CONFIG.selectors.close
        )
      );

    this.dropdownToggles =
      Array.from(
        document.querySelectorAll(
          CONFIG.selectors.dropdownToggle
        )
      );

  },


  // ==========================================================
  // AUTH DETECTION
  // ==========================================================

  detectAuthentication() {

    state.authenticated =
      isAuthenticated();

    document.body.dataset.authenticated =
      state.authenticated
        ? "true"
        : "false";

  },


  // ==========================================================
  // ROLE DETECTION
  // ==========================================================

  detectRole() {

    const role =
      getRole();

    if (role) {

      setRole(role);

    }

  },


  // ==========================================================
  // EVENT BINDING
  // ==========================================================

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


    // Auth changes

    document.addEventListener(
      "ghar:auth:changed",
      () => {

        this.detectAuthentication();

        this.detectRole();

        this.setupRoleNavigation();

      }
    );


    document.addEventListener(
      "ghar:auth:login",
      event => {

        state.authenticated =
          true;

        const role =
          event.detail?.role;

        if (role) {
          setRole(role);
        }

        this.setupRoleNavigation();

      }
    );


    document.addEventListener(
      "ghar:auth:logout",
      () => {

        state.authenticated =
          false;

        state.currentRole =
          null;

        this.setupRoleNavigation();

      }
    );

  },


  // ==========================================================
  // MOBILE NAVIGATION
  // ==========================================================

  setupMobileNavigation() {

    if (!this.navigation) {
      return;
    }

    this.closeMobileNavigation();

  },


  toggleMobileNavigation(
    button
  ) {

    if (
      state.mobileOpen
    ) {

      this.closeMobileNavigation();

    } else {

      this.openMobileNavigation(
        button
      );

    }

  },


  openMobileNavigation(
    button
  ) {

    state.mobileOpen =
      true;

    document.body.classList.add(
      "nav-open"
    );

    document.body.classList.add(
      "menu-open"
    );

    document.body.classList.add(
      "ghar-navigation-open"
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

    state.mobileOpen =
      false;

    document.body.classList.remove(
      "nav-open"
    );

    document.body.classList.remove(
      "menu-open"
    );

    document.body.classList.remove(
      "ghar-navigation-open"
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


  // ==========================================================
  // DROPDOWNS
  // ==========================================================

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

  },


  toggleDropdown(
    toggle
  ) {

    const dropdown =
      this.findDropdown(
        toggle
      );

    if (!dropdown) {
      return;
    }

    const isOpen =
      dropdown.classList.contains(
        "is-open"
      );

    this.closeAllDropdowns();

    if (isOpen) {
      return;
    }

    dropdown.classList.add(
      "is-open"
    );

    dropdown.hidden =
      false;

    toggle.classList.add(
      "is-active"
    );

    toggle.setAttribute(
      "aria-expanded",
      "true"
    );

    state.activeDropdown =
      dropdown;

  },


  findDropdown(
    toggle
  ) {

    const id =
      toggle.dataset.navDropdownToggle;

    if (id) {

      const target =
        document.getElementById(
          id
        );

      if (target) {
        return target;
      }

    }

    return toggle
      .closest(
        "[data-nav-dropdown]"
      )
      ?.querySelector(
        CONFIG.selectors.dropdownMenu
      );

  },


  closeAllDropdowns() {

    document
      .querySelectorAll(
        CONFIG.selectors.dropdownMenu
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
        CONFIG.selectors.dropdownToggle
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


    state.activeDropdown =
      null;

  },


  // ==========================================================
  // OUTSIDE CLICK
  // ==========================================================

  setupOutsideClick() {

    document.addEventListener(
      "click",
      event => {

        if (
          event.target.closest(
            CONFIG.selectors.dropdown
          ) ||
          event.target.closest(
            CONFIG.selectors.dropdownToggle
          )
        ) {

          return;

        }

        this.closeAllDropdowns();

      }
    );

  },


  // ==========================================================
  // ACTIVE LINKS
  // ==========================================================

  setupActiveLinks() {

    const currentPath =
      this.normalizePath(
        window.location.pathname
      );

    const links =
      document.querySelectorAll(
        CONFIG.selectors.navLink
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


  activateLink(
    link
  ) {

    link.classList.add(
      "is-active"
    );

    link.setAttribute(
      "aria-current",
      "page"
    );


    const dropdown =
      link.closest(
        CONFIG.selectors.dropdown
      );

    if (dropdown) {

      dropdown.classList.add(
        "is-active"
      );

      const toggle =
        dropdown.querySelector(
          CONFIG.selectors.dropdownToggle
        );

      if (toggle) {

        toggle.classList.add(
          "is-active"
        );

      }

    }

  },


  normalizePath(
    pathname
  ) {

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


  // ==========================================================
  // ROLE-AWARE NAVIGATION
  // ==========================================================

  setupRoleNavigation() {

    const role =
      state.currentRole;

    document
      .querySelectorAll(
        "[data-role]",
      )
      .forEach(
        element => {

          const roles =
            String(
              element.dataset.role || ""
            )
              .split(",")
              .map(
                value =>
                  normalizeRole(
                    value
                  )
              )
              .filter(Boolean);

          if (!roles.length) {
            return;
          }

          element.hidden =
            !role ||
            !roles.includes(
              role
            );

        }
      );


    document
      .querySelectorAll(
        "[data-auth-only]"
      )
      .forEach(
        element => {

          element.hidden =
            !state.authenticated;

        }
      );


    document
      .querySelectorAll(
        "[data-guest-only]"
      )
      .forEach(
        element => {

          element.hidden =
            state.authenticated;

        }
      );


    document
      .querySelectorAll(
        "[data-role-dashboard]"
      )
      .forEach(
        element => {

          const elementRole =
            normalizeRole(
              element.dataset.roleDashboard
            );

          if (
            elementRole &&
            CONFIG.dashboards[
              elementRole
            ]
          ) {

            element.href =
              CONFIG.dashboards[
                elementRole
              ];

          }

        }
      );

  },


  // ==========================================================
  // ROLE DASHBOARD
  // ==========================================================

  goToRoleDashboard(
    role
  ) {

    const normalized =
      normalizeRole(
        role ||
        state.currentRole
      );


    if (
      !normalized
    ) {

      this.goTo(
        CONFIG.login
      );

      return;

    }


    if (
      !state.authenticated
    ) {

      this.goTo(
        CONFIG.login
      );

      return;

    }


    const target =
      CONFIG.dashboards[
        normalized
      ];


    if (!target) {

      this.goTo(
        CONFIG.defaultDashboard
      );

      return;

    }


    this.goTo(
      target
    );

  },


  // ==========================================================
  // ROLE ACCESS CHECK
  // ==========================================================

  hasRole(
    requiredRole
  ) {

    const current =
      normalizeRole(
        state.currentRole ||
        getRole()
      );

    const required =
      normalizeRole(
        requiredRole
      );

    if (!current || !required) {
      return false;
    }

    // Admin has platform-wide access

    if (
      current === "admin"
    ) {

      return true;

    }

    return (
      current === required
    );

  },


  // ==========================================================
  // ROLE PROTECTION
  // ==========================================================

  protectRole(
    requiredRole
  ) {

    if (
      !state.authenticated
    ) {

      this.goTo(
        CONFIG.login
      );

      return false;

    }


    if (
      !this.hasRole(
        requiredRole
      )
    ) {

      this.goTo(
        CONFIG.forbidden
      );

      return false;

    }


    return true;

  },


  // ==========================================================
  // KEYBOARD NAVIGATION
  // ==========================================================

  setupKeyboardNavigation() {

    document.addEventListener(
      "keydown",
      event => {

        const active =
          document.activeElement;

        if (!active) {
          return;
        }


        const toggle =
          active.closest(
            CONFIG.selectors.dropdownToggle
          );

        if (!toggle) {
          return;
        }


        if (
          event.key ===
          "ArrowDown"
        ) {

          event.preventDefault();

          this.openDropdownFromKeyboard(
            toggle
          );

        }


        if (
          event.key ===
          "ArrowUp"
        ) {

          event.preventDefault();

          this.openDropdownFromKeyboard(
            toggle
          );

        }


        if (
          event.key ===
          "Escape"
        ) {

          event.preventDefault();

          this.closeAllDropdowns();

          toggle.focus();

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
      this.findDropdown(
        toggle
      );

    if (!dropdown) {
      return;
    }

    const firstFocusable =
      dropdown.querySelector(
        "a, button, input, [tabindex]"
      );

    firstFocusable?.focus();

  },


  // ==========================================================
  // RESPONSIVE
  // ==========================================================

  setupResizeHandler() {

    let timer = null;

    window.addEventListener(
      "resize",
      () => {

        clearTimeout(
          timer
        );

        timer =
          setTimeout(
            () => {

              if (
                window.innerWidth >
                CONFIG.mobileBreakpoint
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


  // ==========================================================
  // SCROLL BEHAVIOUR
  // ==========================================================

  setupScrollBehavior() {

    const header =
      document.querySelector(
        "[data-site-header], header.ghar-header"
      );

    if (!header) {
      return;
    }


    state.lastScroll =
      window.scrollY;


    window.addEventListener(
      "scroll",
      () => {

        const current =
          window.scrollY;


        header.classList.toggle(
          "is-scrolled",
          current > 80
        );


        header.classList.toggle(
          "is-scroll-down",
          current >
            state.lastScroll &&
          current >
            160
        );


        header.classList.toggle(
          "is-scroll-up",
          current <
            state.lastScroll
        );


        state.lastScroll =
          current;

      },
      {
        passive: true
      }
    );

  },


  // ==========================================================
  // NAVIGATION HELPERS
  // ==========================================================

  goTo(
    url,
    options = {}
  ) {

    if (!url) {
      return;
    }


    this.closeMobileNavigation();

    this.closeAllDropdowns();


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

    if (
      window.history.length > 1
    ) {

      window.history.back();

    } else {

      this.goTo(
        "/"
      );

    }

  },


  reload() {

    window.location.reload();

  },


  // ==========================================================
  // AUTH NAVIGATION
  // ==========================================================

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


      if (
        window.GHARAuth &&
        typeof window.GHARAuth.logout ===
          "function"
      ) {

        window.GHARAuth.logout();

        return;

      }

    } catch (error) {

      console.error(
        "[GHAR Navigation] Logout error:",
        error
      );

    }


    try {

      localStorage.removeItem(
        "ghar_access_token"
      );

      localStorage.removeItem(
        "ghar_refresh_token"
      );

      localStorage.removeItem(
        "ghar_token"
      );

      localStorage.removeItem(
        "ghar_role"
      );

      localStorage.removeItem(
        "ghar_user"
      );

    } catch {}


    state.authenticated =
      false;

    state.currentRole =
      null;


    this.goTo(
      CONFIG.login
    );

  },


  // ==========================================================
  // EVENT SYSTEM
  // ==========================================================

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


  // ==========================================================
  // PUBLIC STATE
  // ==========================================================

  getState() {

    return {
      ...state
    };

  },


  getRole() {

    return (
      state.currentRole ||
      getRole()
    );

  },


  isAuthenticated() {

    return state.authenticated;

  }

  };


  // ==========================================================
  // GLOBAL EXPORT
  // ==========================================================

  window.GHARNavigation =
    GHARNavigation;

  window.GHAR_NAVIGATION =
    GHARNavigation;

  // Backward compatibility

  GHAR.Navigation =
    GHARNavigation;


  // ==========================================================
  // AUTO START
  // ==========================================================

  function start() {

    GHARNavigation.init();

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start,
      {
        once: true
      }
    );

  } else {

    start();

  }

})(window, document);