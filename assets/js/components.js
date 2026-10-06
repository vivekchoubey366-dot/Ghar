// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/components.js
// Shared UI Components / UI Runtime
// ============================================================
"use strict";
(function (window, document) {
  // ==========================================================
  // GHAR NAMESPACE
  // ==========================================================
  const GHAR =
    window.GHAR =
    window.GHAR || {};
  // ==========================================================
  // CONFIGURATION
  // ==========================================================
  const CONFIG = Object.freeze({
    appName: "GHAR",
    version:
      window.GHAR_CONFIG?.APP_VERSION ||
      window.GHAR_CONFIG?.VERSION ||
      "2.0.0",
    toastDuration:
      Number(
        window.GHAR_CONFIG?.TOAST_DURATION
      ) || 4000,
    animationDuration: 250,
    lazyImageRootMargin:
      "300px",
    maxToastCount: 5,
    modalSelector:
      ".ghar-modal.is-open, [data-modal].is-open"
  });
  // ==========================================================
  // ROLES
  // ==========================================================
  const ROLES = Object.freeze({
    GUEST: "guest",
    USER: "user",
    BUYER: "buyer",
    SELLER: "seller",
    TENANT: "tenant",
    LANDLORD: "landlord",
    AGENT: "agent",
    BROKER: "broker",
    INVESTOR: "investor",
    VERIFIER: "verifier",
    SUPPORT: "support",
    FINANCE: "finance",
    MODERATOR: "moderator",
    ADMIN: "admin",
    SUPER_ADMIN: "super_admin"
  });
  // ==========================================================
  // ROLE GROUPS
  // ==========================================================
  const ROLE_GROUPS = Object.freeze({
    PUBLIC: [
      ROLES.GUEST
    ],
    USERS: [
      ROLES.USER,
      ROLES.BUYER,
      ROLES.SELLER,
      ROLES.TENANT,
      ROLES.LANDLORD,
      ROLES.AGENT,
      ROLES.BROKER,
      ROLES.INVESTOR
    ],
    STAFF: [
      ROLES.VERIFIER,
      ROLES.SUPPORT,
      ROLES.FINANCE,
      ROLES.MODERATOR
    ],
    ADMIN: [
      ROLES.ADMIN,
      ROLES.SUPER_ADMIN
    ],
    PROPERTY_OWNERS: [
      ROLES.SELLER,
      ROLES.LANDLORD
    ],
    PROPERTY_SEEKERS: [
      ROLES.BUYER,
      ROLES.TENANT,
      ROLES.INVESTOR
    ]
  });
  // ==========================================================
  // PERMISSIONS
  // ==========================================================
  const PERMISSIONS = Object.freeze({
    VIEW_PROPERTIES:
      "properties.view",
    CREATE_PROPERTY:
      "properties.create",
    EDIT_PROPERTY:
      "properties.edit",
    DELETE_PROPERTY:
      "properties.delete",
    MANAGE_APPLICATIONS:
      "applications.manage",
    APPROVE_APPLICATIONS:
      "applications.approve",
    MANAGE_DOCUMENTS:
      "documents.manage",
    VERIFY_DOCUMENTS:
      "documents.verify",
    MANAGE_PAYMENTS:
      "payments.manage",
    MANAGE_LOANS:
      "loans.manage",
    MANAGE_USERS:
      "users.manage",
    MANAGE_ADMIN:
      "admin.manage",
    MANAGE_AI:
      "ai.manage",
    VIEW_ANALYTICS:
      "analytics.view",
    MANAGE_SUPPORT:
      "support.manage"
  });
  // ==========================================================
  // INTERNAL STATE
  // ==========================================================
  const state = {
    initialized: false,
    listenersInitialized: false,
    activeModal:
      null,
    modalPreviousFocus:
      null,
    openDropdown:
      null,
    lazyObserver:
      null,
    toastContainer:
      null,
    role:
      ROLES.GUEST,
    user:
      null,
    permissions:
      new Set(),
    reducedMotion:
      false
  };
  // ==========================================================
  // UTILITY
  // ==========================================================
  function safeCall(
    callback,
    fallback = null
  ) {
    try {
      if (
        typeof callback ===
        "function"
      ) {
        return callback();
      }
    } catch (error) {
      console.warn(
        "[GHAR Components]",
        error
      );
    }
    return fallback;
  }
  // ==========================================================
  // ROLE NORMALIZATION
  // ==========================================================
  function normalizeRole(role) {
    if (!role) {
      return ROLES.GUEST;
    }
    return String(role)
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
  }
  // ==========================================================
  // USER ROLE RESOLUTION
  // ==========================================================
  function resolveUserRole(user) {
    if (!user) {
      return ROLES.GUEST;
    }
    const candidates = [
      user.role,
      user.userRole,
      user.accountRole,
      user.type
    ];
    for (
      const candidate of candidates
    ) {
      const role =
        normalizeRole(candidate);
      if (
        Object.values(ROLES)
          .includes(role)
      ) {
        return role;
      }
    }
    if (
      Array.isArray(user.roles)
    ) {
      for (
        const candidate
        of user.roles
      ) {
        const role =
          normalizeRole(candidate);
        if (
          Object.values(ROLES)
            .includes(role)
        ) {
          return role;
        }
      }
    }
    return ROLES.USER;
  }
  // ==========================================================
  // GET CURRENT USER
  // ==========================================================
  function getCurrentUser() {
    try {
      if (
        GHAR.Auth &&
        typeof GHAR.Auth.getUser ===
        "function"
      ) {
        return GHAR.Auth.getUser();
      }
      if (
        window.GHAR_AUTH &&
        typeof window.GHAR_AUTH.getUser ===
        "function"
      ) {
        return window.GHAR_AUTH.getUser();
      }
    } catch (error) {
      console.warn(
        "[GHAR] Unable to resolve current user.",
        error
      );
    }
    return null;
  }
  // ==========================================================
  // AUTHENTICATION
  // ==========================================================
  function isAuthenticated() {
    try {
      if (
        GHAR.Auth &&
        typeof GHAR.Auth.isAuthenticated ===
        "function"
      ) {
        return Boolean(
          GHAR.Auth.isAuthenticated()
        );
      }
      if (
        window.GHAR_AUTH &&
        typeof window.GHAR_AUTH.isAuthenticated ===
        "function"
      ) {
        return Boolean(
          window.GHAR_AUTH.isAuthenticated()
        );
      }
    } catch (error) {
      console.warn(
        "[GHAR] Authentication check failed.",
        error
      );
    }
    return Boolean(
      state.user
    );
  }
  // ==========================================================
  // PERMISSION RESOLUTION
  // ==========================================================
  function resolvePermissions(user) {
    state.permissions.clear();
    if (!user) {
      return;
    }
    const role =
      resolveUserRole(user);
    // Role based defaults
    if (
      ROLE_GROUPS.USERS.includes(role)
    ) {
      state.permissions.add(
        PERMISSIONS.VIEW_PROPERTIES
      );
    }
    if (
      ROLE_GROUPS.PROPERTY_OWNERS.includes(role)
    ) {
      state.permissions.add(
        PERMISSIONS.CREATE_PROPERTY
      );
      state.permissions.add(
        PERMISSIONS.EDIT_PROPERTY
      );
    }
    if (
      ROLE_GROUPS.PROPERTY_SEEKERS.includes(role)
    ) {
      state.permissions.add(
        PERMISSIONS.MANAGE_APPLICATIONS
      );
    }
    if (
      ROLE_GROUPS.STAFF.includes(role)
    ) {
      state.permissions.add(
        PERMISSIONS.MANAGE_APPLICATIONS
      );
      state.permissions.add(
        PERMISSIONS.MANAGE_DOCUMENTS
      );
    }
    if (
      [
        ROLES.VERIFIER
      ].includes(role)
    ) {
      state.permissions.add(
        PERMISSIONS.VERIFY_DOCUMENTS
      );
    }
    if (
      [
        ROLES.FINANCE
      ].includes(role)
    ) {
      state.permissions.add(
        PERMISSIONS.MANAGE_PAYMENTS
      );
      state.permissions.add(
        PERMISSIONS.MANAGE_LOANS
      );
    }
    if (
      ROLE_GROUPS.ADMIN.includes(role)
    ) {
      Object.values(PERMISSIONS)
        .forEach(permission => {
          state.permissions.add(
            permission
          );
        });
    }
    // Explicit permissions from backend
    const explicit =
      user.permissions;
    if (
      Array.isArray(explicit)
    ) {
      explicit.forEach(
        permission => {
          if (permission) {
            state.permissions.add(
              String(permission)
            );
          }
        }
      );
    }
  }
  // ==========================================================
  // ACCESS CHECK
  // ==========================================================
  function hasRole(
    role
  ) {
    return (
      state.role ===
      normalizeRole(role)
    );
  }
  function hasAnyRole(
    roles = []
  ) {
    return roles
      .map(normalizeRole)
      .includes(
        state.role
      );
  }
  function hasPermission(
    permission
  ) {
    if (
      [
        ROLES.ADMIN,
        ROLES.SUPER_ADMIN
      ].includes(state.role)
    ) {
      return true;
    }
    return state.permissions
      .has(
        String(permission)
      );
  }
  // ==========================================================
  // GLOBAL COMPONENTS
  // ==========================================================
  const GHARComponents = {
    config: CONFIG,
    roles: ROLES,
    roleGroups: ROLE_GROUPS,
    permissions: PERMISSIONS,
    state,
    // ========================================================
    // INIT
    // ========================================================
    init() {
      if (state.initialized) {
        return this;
      }
      state.initialized = true;
      this.initializeIdentity();
      this.initializeReducedMotion();
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
      this.initLoadingStates();
      this.initRoleVisibility();
      this.initPermissionVisibility();
      this.initKeyboardAccessibility();
      this.emit(
        "ghar:components-ready",
        {
          version:
            CONFIG.version,
          role:
            state.role,
          authenticated:
            isAuthenticated()
        }
      );
      return this;
    },
    // ========================================================
    // IDENTITY
    // ========================================================
    initializeIdentity() {
      state.user =
        getCurrentUser();
      state.role =
        resolveUserRole(
          state.user
        );
      resolvePermissions(
        state.user
      );
      if (
        GHAR.Role &&
        typeof GHAR.Role.setFromUser ===
        "function"
      ) {
        safeCall(
          () =>
            GHAR.Role.setFromUser(
              state.user
            )
        );
      }
      if (
        GHAR.Permissions &&
        typeof GHAR.Permissions.setUser ===
        "function"
      ) {
        safeCall(
          () =>
            GHAR.Permissions.setUser(
              state.user
            )
        );
      }
      document.documentElement
        .dataset.gharRole =
        state.role;
    },
    // ========================================================
    // REDUCED MOTION
    // ========================================================
    initializeReducedMotion() {
      state.reducedMotion =
        window.matchMedia?.(
          "(prefers-reduced-motion: reduce)"
        )?.matches ||
        false;
      if (
        state.reducedMotion
      ) {
        document.documentElement
          .classList.add(
            "ghar-reduced-motion"
          );
      }
    },
    // ========================================================
    // GLOBAL
    // ========================================================
    initGlobalComponents() {
      this.renderCurrentYear();
      this.markActiveNavigation();
      this.updateAuthUI();
      this.updateRoleUI();
      this.updatePermissionUI();
    },
    // ========================================================
    // YEAR
    // ========================================================
    renderCurrentYear() {
      const year =
        new Date()
          .getFullYear();
      document
        .querySelectorAll(
          "[data-current-year]"
        )
        .forEach(
          element => {
            element.textContent =
              year;
          }
        );
    },
    // ========================================================
    // NAVIGATION
    // ========================================================
    markActiveNavigation() {
      const currentPath =
        window.location.pathname
          .replace(/\/+$/, "")
          .toLowerCase();
      document
        .querySelectorAll(
          "[data-nav-link]"
        )
        .forEach(link => {
          const href =
            link.getAttribute(
              "href"
            );
          if (!href) {
            return;
          }
          try {
            const linkPath =
              new URL(
                href,
                window.location.origin
              )
                .pathname
                .replace(
                  /\/+$/,
                  ""
                )
                .toLowerCase();
            const active =
              linkPath ===
                currentPath ||
              (
                linkPath &&
                currentPath.startsWith(
                  linkPath + "/"
                )
              );
            link.classList.toggle(
              "is-active",
              active
            );
            if (active) {
              link.setAttribute(
                "aria-current",
                "page"
              );
            } else {
              link.removeAttribute(
                "aria-current"
              );
            }
          } catch {
            // Ignore invalid URLs
          }
        });
    },
    // ========================================================
    // AUTH UI
    // ========================================================
    updateAuthUI() {
      const authenticated =
        isAuthenticated();
      document
        .querySelectorAll(
          "[data-auth-only]"
        )
        .forEach(
          element =>
            element.hidden =
              !authenticated
        );
      document
        .querySelectorAll(
          "[data-guest-only]"
        )
        .forEach(
          element =>
            element.hidden =
              authenticated
        );
      document
        .querySelectorAll(
          "[data-auth-state]"
        )
        .forEach(element => {
          element.dataset
            .authState =
            authenticated
              ? "authenticated"
              : "guest";
        });
    },
    // ========================================================
    // ROLE UI
    // ========================================================
    updateRoleUI() {
      document
        .querySelectorAll(
          "[data-role]"
        )
        .forEach(element => {
          const allowed =
            String(
              element.dataset.role ||
              ""
            )
              .split(",")
              .map(normalizeRole)
              .filter(Boolean);
          element.hidden =
            !allowed.includes(
              state.role
            );
        });
      document
        .querySelectorAll(
          "[data-role-not]"
        )
        .forEach(element => {
          const blocked =
            String(
              element.dataset.roleNot ||
              ""
            )
              .split(",")
              .map(normalizeRole)
              .filter(Boolean);
          element.hidden =
            blocked.includes(
              state.role
            );
        });
    },
    // ========================================================
    // PERMISSION UI
    // ========================================================
    updatePermissionUI() {
      document
        .querySelectorAll(
          "[data-permission]"
        )
        .forEach(element => {
          const permissions =
            String(
              element.dataset.permission ||
              ""
            )
              .split(",")
              .map(value =>
                value.trim()
              )
              .filter(Boolean);
          const allowed =
            permissions.some(
              permission =>
                hasPermission(
                  permission
                )
            );
          element.hidden =
            !allowed;
        });
    },
    // ========================================================
    // PUBLIC ROLE API
    // ========================================================
    getRole() {
      return state.role;
    },
    getUser() {
      return state.user;
    },
    isAuthenticated() {
      return isAuthenticated();
    },
    hasRole,
    hasAnyRole,
    hasPermission,
    // ========================================================
    // REFRESH IDENTITY
    // ========================================================
    refreshIdentity() {
      this.initializeIdentity();
      this.updateAuthUI();
      this.updateRoleUI();
      this.updatePermissionUI();
      this.emit(
        "ghar:identity-change",
        {
          user:
            state.user,
          role:
            state.role,
          authenticated:
            isAuthenticated()
        }
      );
      return state.user;
    },
    // ========================================================
    // BUTTONS
    // ========================================================
    initButtons() {
      if (
        state.listenersInitialized
      ) {
        return;
      }
      document.addEventListener(
        "click",
        event => {
          const button =
            event.target.closest(
              "[data-action]"
            );
          if (!button) {
            return;
          }
          this.handleAction(
            button.dataset.action,
            button,
            event
          );
        }
      );
    },
    // ========================================================
    // ACTION HANDLER
    // ========================================================
    handleAction(
      action,
      element,
      event
    ) {
      switch (
        String(action || "")
          .trim()
          .toLowerCase()
      ) {
        case "back":
          window.history.back();
          break;
        case "forward":
          window.history.forward();
          break;
        case "reload":
          window.location.reload();
          break;
        case "open-modal":
          this.openModal(
            element.dataset.modal
          );
          break;
        case "close-modal":
          this.closeModal(
            element.dataset.modal
          );
          break;
        case "logout":
          this.logout();
          break;
        case "login":
          this.navigate(
            element.dataset.href ||
            "/login.html"
          );
          break;
        case "go-dashboard":
          this.navigate(
            element.dataset.href ||
            "/dashboard.html"
          );
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
    // NAVIGATE
    // ========================================================
    navigate(path) {
      if (
        !path
      ) {
        return;
      }
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
    // ========================================================
    // LOGOUT
    // ========================================================
    async logout() {
      try {
        if (
          GHAR.Auth &&
          typeof GHAR.Auth.logout ===
          "function"
        ) {
          await GHAR.Auth.logout();
        } else if (
          window.GHAR_AUTH &&
          typeof window.GHAR_AUTH.logout ===
          "function"
        ) {
          await window.GHAR_AUTH.logout();
        }
      } catch (error) {
        console.error(
          "[GHAR] Logout failed:",
          error
        );
      } finally {
        state.user =
          null;
        state.role =
          ROLES.GUEST;
        state.permissions.clear();
        this.updateAuthUI();
        this.updateRoleUI();
        this.updatePermissionUI();
        this.emit(
          "ghar:logout",
          {}
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
          if (!form) {
            return;
          }
          if (
            form.dataset.validate !==
            "false"
          ) {
            if (
              !this.validateForm(form)
            ) {
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
    // ========================================================
    // VALIDATE FORM
    // ========================================================
    validateForm(form) {
      if (!form) {
        return false;
      }
      let valid = true;
      form
        .querySelectorAll(
          "input, select, textarea"
        )
        .forEach(field => {
          field.classList.remove(
            "is-invalid"
          );
          field.removeAttribute(
            "aria-invalid"
          );
          const value =
            String(
              field.value ?? ""
            ).trim();
          const required =
            field.hasAttribute(
              "required"
            );
          if (
            required &&
            !value
          ) {
            this.invalidateField(
              field,
              "This field is required."
            );
            valid = false;
            return;
          }
          if (
            field.type ===
              "email" &&
            value
          ) {
            const pattern =
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (
              !pattern.test(value)
            ) {
              this.invalidateField(
                field,
                "Please enter a valid email address."
              );
              valid = false;
            }
          }
          if (
            field.minLength > 0 &&
            value.length <
              field.minLength
          ) {
            this.invalidateField(
              field,
              `Minimum ${field.minLength} characters required.`
            );
            valid = false;
          }
          if (
            field.pattern &&
            value
          ) {
            try {
              const regex =
                new RegExp(
                  field.pattern
                );
              if (
                !regex.test(value)
              ) {
                this.invalidateField(
                  field,
                  "Please enter a valid value."
                );
                valid = false;
              }
            } catch {
              // Ignore invalid custom pattern
            }
          }
        });
      return valid;
    },
    // ========================================================
    // INVALID FIELD
    // ========================================================
    invalidateField(
      field,
      message
    ) {
      field.classList.add(
        "is-invalid"
      );
      field.setAttribute(
        "aria-invalid",
        "true"
      );
      if (message) {
        field.setAttribute(
          "aria-describedby",
          `${field.id || field.name || "field"}-error`
        );
      }
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
            return;
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
            return;
          }
          const backdrop =
            event.target.closest(
              "[data-modal-backdrop]"
            );
          if (
            backdrop &&
            backdrop.dataset.closeOnBackdrop !==
              "false"
          ) {
            this.closeModal(
              backdrop.dataset.modalBackdrop
            );
          }
        }
      );
      document.addEventListener(
        "keydown",
        event => {
          if (
            event.key ===
            "Escape"
          ) {
            this.closeTopModal();
          }
          if (
            event.key ===
              "Tab" &&
            state.activeModal
          ) {
            this.trapFocus(
              event,
              state.activeModal
            );
          }
        }
      );
    },
    // ========================================================
    // OPEN MODAL
    // ========================================================
    openModal(id) {
      if (!id) {
        return null;
      }
      const modal =
        document.getElementById(
          id
        );
      if (!modal) {
        return null;
      }
      state.modalPreviousFocus =
        document.activeElement;
      state.activeModal =
        modal;
      modal.hidden =
        false;
      modal.classList.add(
        "is-open"
      );
      modal.setAttribute(
        "aria-hidden",
        "false"
      );
      document.body.classList.add(
        "modal-open"
      );
      const focusable =
        modal.querySelector(
          [
            "button:not([disabled])",
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            "a[href]",
            "[tabindex]:not([tabindex='-1'])"
          ].join(",")
        );
      focusable?.focus();
      this.emit(
        "ghar:modal-open",
        {
          modal
        }
      );
      return modal;
    },
    // ========================================================
    // CLOSE MODAL
    // ========================================================
    closeModal(id) {
      if (!id) {
        return;
      }
      const modal =
        document.getElementById(
          id
        );
      if (!modal) {
        return;
      }
      modal.classList.remove(
        "is-open"
      );
      modal.hidden =
        true;
      modal.setAttribute(
        "aria-hidden",
        "true"
      );
      if (
        state.activeModal ===
        modal
      ) {
        state.activeModal =
          null;
      }
      if (
        !document.querySelector(
          CONFIG.modalSelector
        )
      ) {
        document.body.classList.remove(
          "modal-open"
        );
        if (
          state.modalPreviousFocus &&
          typeof state.modalPreviousFocus.focus ===
          "function"
        ) {
          state.modalPreviousFocus.focus();
        }
        state.modalPreviousFocus =
          null;
      }
      this.emit(
        "ghar:modal-close",
        {
          modal
        }
      );
    },
    // ========================================================
    // CLOSE TOP MODAL
    // ========================================================
    closeTopModal() {
      const modal =
        state.activeModal ||
        document.querySelector(
          CONFIG.modalSelector
        );
      if (
        modal
      ) {
        this.closeModal(
          modal.id
        );
      }
    },
    // ========================================================
    // CLOSE ALL MODALS
    // ========================================================
    closeAllModals() {
      document
        .querySelectorAll(
          CONFIG.modalSelector
        )
        .forEach(
          modal => {
            modal.classList.remove(
              "is-open"
            );
            modal.hidden =
              true;
            modal.setAttribute(
              "aria-hidden",
              "true"
            );
          }
        );
      state.activeModal =
        null;
      document.body.classList.remove(
        "modal-open"
      );
    },
    // ========================================================
    // FOCUS TRAP
    // ========================================================
    trapFocus(
      event,
      modal
    ) {
      const focusable =
        Array.from(
          modal.querySelectorAll(
            [
              "button:not([disabled])",
              "input:not([disabled])",
              "select:not([disabled])",
              "textarea:not([disabled])",
              "a[href]",
              "[tabindex]:not([tabindex='-1'])"
            ].join(",")
          )
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
        document.activeElement ===
          first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement ===
          last
      ) {
        event.preventDefault();
        first.focus();
      }
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
          if (!tab) {
            return;
          }
          event.preventDefault();
          const group =
            tab.closest(
              "[data-tabs]"
            );
          if (!group) {
            return;
          }
          const targetId =
            tab.dataset.tabTarget;
          group
            .querySelectorAll(
              "[data-tab-target]"
            )
            .forEach(
              item => {
                const active =
                  item === tab;
                item.classList.toggle(
                  "is-active",
                  active
                );
                item.setAttribute(
                  "aria-selected",
                  String(active)
                );
                item.setAttribute(
                  "tabindex",
                  active
                    ? "0"
                    : "-1"
                );
              }
            );
          group
            .querySelectorAll(
              "[data-tab-panel]"
            )
            .forEach(panel => {
              const active =
                panel.dataset.tabPanel ===
                targetId;
              panel.hidden =
                !active;
              panel.setAttribute(
                "aria-hidden",
                String(!active)
              );
            });
          this.emit(
            "ghar:tab-change",
            {
              tab,
              targetId
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
              trigger.dataset
                .dropdownToggle;
            const dropdown =
              document.getElementById(
                id
              );
            if (!dropdown) {
              return;
            }
            if (
              state.openDropdown &&
              state.openDropdown !==
                dropdown
            ) {
              this.closeDropdowns();
            }
            const open =
              dropdown.classList.toggle(
                "is-open"
              );
            trigger.setAttribute(
              "aria-expanded",
              String(open)
            );
            state.openDropdown =
              open
                ? dropdown
                : null;
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
        .forEach(
          dropdown =>
            dropdown.classList.remove(
              "is-open"
            )
        );
      document
        .querySelectorAll(
          "[data-dropdown-toggle]"
        )
        .forEach(
          trigger =>
            trigger.setAttribute(
              "aria-expanded",
              "false"
            )
        );
      state.openDropdown =
        null;
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
          if (!trigger) {
            return;
          }
          const accordion =
            trigger.closest(
              "[data-accordion]"
            );
          if (!accordion) {
            return;
          }
          const panel =
            accordion.querySelector(
              "[data-accordion-panel]"
            );
          if (!panel) {
            return;
          }
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
    // ALERTS
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
          window.setTimeout(
            () => {
              alert.classList.add(
                "is-hidden"
              );
              window.setTimeout(
                () =>
                  alert.remove(),
                CONFIG.animationDuration
              );
            },
            timeout
          );
        });
    },
    // ========================================================
    // TOAST CONTAINER
    // ========================================================
    getToastContainer() {
      if (
        state.toastContainer &&
        document.body.contains(
          state.toastContainer
        )
      ) {
        return state.toastContainer;
      }
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
        container.setAttribute(
          "aria-atomic",
          "true"
        );
        document.body.appendChild(
          container
        );
      }
      state.toastContainer =
        container;
      return container;
    },
    // ========================================================
    // TOAST
    // ========================================================
    showToast(
      message,
      type = "info",
      duration = CONFIG.toastDuration
    ) {
      const container =
        this.getToastContainer();
      while (
        container.children.length >=
        CONFIG.maxToastCount
      ) {
        container.firstElementChild
          ?.remove();
      }
      const toast =
        document.createElement(
          "div"
        );
      const normalizedType =
        [
          "success",
          "error",
          "warning",
          "info"
        ].includes(type)
          ? type
          : "info";
      toast.className =
        `ghar-toast ghar-toast-${normalizedType}`;
      toast.setAttribute(
        "role",
        normalizedType === "error"
          ? "alert"
          : "status"
      );
      toast.setAttribute(
        "aria-live",
        normalizedType === "error"
          ? "assertive"
          : "polite"
      );
      toast.textContent =
        String(
          message ?? ""
        );
      container.appendChild(
        toast
      );
      requestAnimationFrame(
        () =>
          toast.classList.add(
            "is-visible"
          )
      );
      const close =
        () => {
          toast.classList.remove(
            "is-visible"
          );
          window.setTimeout(
            () =>
              toast.remove(),
            CONFIG.animationDuration
          );
        };
      const timeout =
        Math.max(
          1000,
          Number(duration) ||
          CONFIG.toastDuration
        );
      window.setTimeout(
        close,
        timeout
      );
      return toast;
    },
    // ========================================================
    // LOADING
    // ========================================================
    initLoadingStates() {
      document.addEventListener(
        "click",
        event => {
          const element =
            event.target.closest(
              "[data-loading]"
            );
          if (!element) {
            return;
          }
          this.setLoading(
            element,
            true
          );
        }
      );
    },
    setLoading(
      element,
      loading = true,
      text = null
    ) {
      if (!element) {
        return;
      }
      if (loading) {
        if (
          !element.dataset.originalText
        ) {
          element.dataset
            .originalText =
            element.textContent;
        }
        element.classList.add(
          "is-loading"
        );
        element.setAttribute(
          "aria-busy",
          "true"
        );
        if (
          "disabled" in element
        ) {
          element.disabled =
            true;
        }
        if (text) {
          element.textContent =
            text;
        }
      } else {
        element.classList.remove(
          "is-loading"
        );
        element.setAttribute(
          "aria-busy",
          "false"
        );
        if (
          "disabled" in element
        ) {
          element.disabled =
            false;
        }
        if (
          element.dataset.originalText
        ) {
          element.textContent =
            element.dataset.originalText;
          delete element.dataset
            .originalText;
        }
      }
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
          if (!element) {
            return;
          }
          if (
            !element.getAttribute(
              "aria-label"
            )
          ) {
            element.setAttribute(
              "aria-label",
              element.dataset.tooltip
            );
          }
          if (
            !element.getAttribute(
              "title"
            )
          ) {
            element.setAttribute(
              "title",
              element.dataset.tooltip
            );
          }
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
      if (!images.length) {
        return;
      }
      if (
        "IntersectionObserver" in
        window
      ) {
        state.lazyObserver =
          new IntersectionObserver(
            entries => {
              entries.forEach(
                entry => {
                  if (
                    !entry.isIntersecting
                  ) {
                    return;
                  }
                  this.loadImage(
                    entry.target
                  );
                  state.lazyObserver
                    .unobserve(
                      entry.target
                    );
                }
              );
            },
            {
              rootMargin:
                CONFIG.lazyImageRootMargin
            }
          );
        images.forEach(
          image =>
            state.lazyObserver
              .observe(image)
        );
      } else {
        images.forEach(
          image =>
            this.loadImage(
              image
            )
        );
      }
    },
    // ========================================================
    // LOAD IMAGE
    // ========================================================
    loadImage(image) {
      if (!image) {
        return;
      }
      const source =
        image.dataset.src;
      if (!source) {
        return;
      }
      image.classList.add(
        "is-loading"
      );
      image.src =
        source;
      image.addEventListener(
        "load",
        () => {
          image.classList.remove(
            "is-loading"
          );
          image.classList.add(
            "is-loaded"
          );
        },
        {
          once: true
        }
      );
      image.addEventListener(
        "error",
        () => {
          image.classList.remove(
            "is-loading"
          );
          image.classList.add(
            "is-error"
          );
        },
        {
          once: true
        }
      );
      image.removeAttribute(
        "data-src"
      );
    },
    // ========================================================
    // COPY
    // ========================================================
    initCopyButtons() {
      document.addEventListener(
        "click",
        async event => {
          const button =
            event.target.closest(
              "[data-copy]"
            );
          if (!button) {
            return;
          }
          event.preventDefault();
          const value =
            button.dataset.copy;
          if (!value) {
            return;
          }
          try {
            await this.copyText(
              value
            );
            this.showToast(
              button.dataset.copySuccess ||
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
    async copyText(
      value
    ) {
      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        return navigator
          .clipboard
          .writeText(
            String(value)
          );
      }
      const textarea =
        document.createElement(
          "textarea"
        );
      textarea.value =
        String(value);
      textarea.style.position =
        "fixed";
      textarea.style.opacity =
        "0";
      document.body.appendChild(
        textarea
      );
      textarea.select();
      const success =
        document.execCommand(
          "copy"
        );
      textarea.remove();
      if (!success) {
        throw new Error(
          "Copy failed"
        );
      }
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
          if (!button) {
            return;
          }
          const selector =
            button.dataset
              .togglePassword;
          const input =
            document.querySelector(
              selector
            );
          if (!input) {
            return;
          }
          const visible =
            input.type ===
            "text";
          input.type =
            visible
              ? "password"
              : "text";
          button.setAttribute(
            "aria-pressed",
            String(!visible)
          );
          button.setAttribute(
            "aria-label",
            visible
              ? "Show password"
              : "Hide password"
          );
        }
      );
    },
    // ========================================================
    // ROLE VISIBILITY
    // ========================================================
    initRoleVisibility() {
      this.updateRoleUI();
    },
    // ========================================================
    // PERMISSION VISIBILITY
    // ========================================================
    initPermissionVisibility() {
      this.updatePermissionUI();
    },
    // ========================================================
    // KEYBOARD ACCESSIBILITY
    // ========================================================
    initKeyboardAccessibility() {
      document.addEventListener(
        "keydown",
        event => {
          if (
            event.key !==
            "Enter"
          ) {
            return;
          }
          const element =
            event.target.closest(
              "[data-keyboard-action]"
            );
          if (!element) {
            return;
          }
          event.preventDefault();
          this.handleAction(
            element.dataset
              .keyboardAction,
            element,
            event
          );
        }
      );
    },
    // ========================================================
    // ESCAPE HTML
    // ========================================================
    escapeHTML(value) {
      const div =
        document.createElement(
          "div"
        );
      div.textContent =
        String(
          value ?? ""
        );
      return div.innerHTML;
    },
    // ========================================================
    // QUERY SELECTOR
    // ========================================================
    qs(
      selector,
      parent = document
    ) {
      return parent.querySelector(
        selector
      );
    },
    // ========================================================
    // QUERY SELECTORS
    // ========================================================
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
    // ========================================================
    // CREATE ELEMENT
    // ========================================================
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
      if (
        text !== undefined &&
        text !== null
      ) {
        element.textContent =
          text;
      }
      return element;
    },
    // ========================================================
    // EVENT EMITTER
    // ========================================================
    emit(
      eventName,
      detail = {}
    ) {
      if (!eventName) {
        return;
      }
      document.dispatchEvent(
        new CustomEvent(
          eventName,
          {
            detail
          }
        )
      );
    },
    // ========================================================
    // EVENT LISTENER
    // ========================================================
    on(
      eventName,
      callback,
      options = {}
    ) {
      if (
        !eventName ||
        typeof callback !==
        "function"
      ) {
        return () => {};
      }
      document.addEventListener(
        eventName,
        callback,
        options
      );
      return () => {
        document.removeEventListener(
          eventName,
          callback,
          options
        );
      };
    },
    // ========================================================
    // ONE-TIME EVENT
    // ========================================================
    once(
      eventName,
      callback
    ) {
      return this.on(
        eventName,
        callback,
        {
          once: true
        }
      );
    },
    // ========================================================
    // PAGE
    // ========================================================
    getPage() {
      return (
        document.body?.dataset.page ||
        document.body?.dataset.module ||
        null
      );
    },
    // ========================================================
    // UPDATE EVERYTHING
    // ========================================================
    refresh() {
      this.renderCurrentYear();
      this.markActiveNavigation();
      this.updateAuthUI();
      this.updateRoleUI();
      this.updatePermissionUI();
      return this;
    }
  };
  // ==========================================================
  // EXPORT
  // ==========================================================
  GHAR.Components =
    GHARComponents;
  window.GHARComponents =
    GHARComponents;
  // Backward compatibility
  window.GHAR_COMPONENTS =
    GHARComponents;
  // ==========================================================
  // READY INITIALIZATION
  // ==========================================================
  function initialize() {
    GHARComponents.init();
  }
  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      {
        once: true
      }
    );
  } else {
    initialize();
  }
})(window, document);

What this upgraded version adds

Your original file mainly handled UI widgets. This version makes components.js a proper GHAR frontend runtime layer.

Roles included:

guest
user
buyer
seller
tenant
landlord
agent
broker
investor
verifier
support
finance
moderator
admin
super_admin

Role groups:

PUBLIC
USERS
STAFF
ADMIN
PROPERTY_OWNERS
PROPERTY_SEEKERS

Permission system:

properties.view
properties.create
properties.edit
properties.delete
applications.manage
applications.approve
documents.manage
documents.verify
payments.manage
loans.manage
users.manage
admin.manage
ai.manage
analytics.view
support.manage

Role-based HTML now works

For example:

<div data-role="admin,super_admin">
    Admin controls
</div>

Only admins see it.

<div data-role="seller,landlord">
    Add Property
</div>

Only property owners see it.

<div data-role="buyer,tenant">
    Apply for Property
</div>

Only buyers/tenants see it.

You can also hide something from specific roles:

<div data-role-not="admin,super_admin">
    Normal user content
</div>

Permission-based HTML

<button
    data-permission="properties.create"
>
    Add Property
</button>

Or:

<section
    data-permission="analytics.view"
>
    Analytics
</section>

Important integration with your app.js

Your upgraded app.js can now use:

GHAR.Components.getRole();
GHAR.Components.getUser();
GHAR.Components.isAuthenticated();
GHAR.Components.hasRole("seller");
GHAR.Components.hasAnyRole([
    "buyer",
    "tenant"
]);
GHAR.Components.hasPermission(
    "properties.create"
);

And after login/logout:

GHAR.Components.refreshIdentity();

This is important because your GHAR architecture has multiple roles and dashboards; the UI should not have to reload just to reflect a changed authentication/role state.

Also added

* Modal focus restoration
* Modal focus trap
* Escape-to-close modal
* Dropdown management
* Accessible tabs
* aria-selected
* aria-hidden
* aria-invalid
* Loading states
* Reduced-motion detection
* Better lazy image handling
* Clipboard fallback
* Toast queue limit
* Authentication UI
* Role UI
* Permission UI
* Identity refresh
* Event unsubscribe functions
* One-time events
* Password accessibility
* Keyboard actions
* Navigation handling
* Backward-compatible GHARComponents
* Backward-compatible GHAR_COMPONENTS
* GHAR.Components namespace integration
* Automatic initialization
* Existing GHAR Auth, Role, Permissions, and Navigation compatibility

One architectural point: keep authorization enforcement on the backend. data-role and data-permission only control the frontend UI; they must never be treated as security boundaries.