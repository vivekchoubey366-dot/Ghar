// ============================================================
// GHAR - Role.js
// Centralized user role management
// ============================================================
"use strict";
(function (window) {
  const GHAR = window.GHAR = window.GHAR || {};
  // ------------------------------------------------------------
  // ROLE DEFINITIONS
  // ------------------------------------------------------------
  const ROLES = Object.freeze({
    GUEST: "guest",
    BUYER: "buyer",
    SELLER: "seller",
    TENANT: "tenant",
    AGENT: "agent",
    ADMIN: "admin"
  });
  // ------------------------------------------------------------
  // ROLE LIST
  // ------------------------------------------------------------
  const ROLE_LIST = Object.freeze([
    ROLES.GUEST,
    ROLES.BUYER,
    ROLES.SELLER,
    ROLES.TENANT,
    ROLES.AGENT,
    ROLES.ADMIN
  ]);
  // ------------------------------------------------------------
  // ROLE HIERARCHY
  // Higher number = higher privilege
  // ------------------------------------------------------------
  const ROLE_LEVELS = Object.freeze({
    [ROLES.GUEST]: 0,
    [ROLES.BUYER]: 10,
    [ROLES.TENANT]: 10,
    [ROLES.SELLER]: 20,
    [ROLES.AGENT]: 30,
    [ROLES.ADMIN]: 100
  });
  // ------------------------------------------------------------
  // DASHBOARD ROUTES
  // ------------------------------------------------------------
  const DASHBOARD_PATHS = Object.freeze({
    [ROLES.GUEST]:
      "/index.html",
    [ROLES.BUYER]:
      "/buyer/index.html",
    [ROLES.SELLER]:
      "/seller/index.html",
    [ROLES.TENANT]:
      "/tenant/index.html",
    [ROLES.AGENT]:
      "/dashboard.html",
    [ROLES.ADMIN]:
      "/admin/admin-dashboard.html"
  });
  // ------------------------------------------------------------
  // ROLE PERMISSIONS
  // Frontend permissions are for UI/UX only.
  // Backend authorization MUST still be enforced.
  // ------------------------------------------------------------
  const PERMISSIONS = Object.freeze({
    [ROLES.GUEST]: Object.freeze([
      "property.view",
      "property.search"
    ]),
    [ROLES.BUYER]: Object.freeze([
      "property.view",
      "property.search",
      "property.favorite",
      "property.save_search",
      "property.contact",
      "property.visit",
      "offer.create",
      "application.create",
      "loan.apply",
      "message.create"
    ]),
    [ROLES.TENANT]: Object.freeze([
      "property.view",
      "property.search",
      "property.favorite",
      "property.save_search",
      "property.contact",
      "property.visit",
      "application.create",
      "message.create"
    ]),
    [ROLES.SELLER]: Object.freeze([
      "property.view",
      "property.search",
      "property.create",
      "property.update",
      "property.delete",
      "property.publish",
      "property.documents",
      "property.leads",
      "property.visits",
      "offer.view",
      "offer.respond",
      "message.create"
    ]),
    [ROLES.AGENT]: Object.freeze([
      "property.view",
      "property.search",
      "property.create",
      "property.update",
      "property.publish",
      "property.documents",
      "property.leads",
      "property.visits",
      "offer.view",
      "offer.create",
      "offer.respond",
      "application.view",
      "message.create"
    ]),
    [ROLES.ADMIN]: Object.freeze([
      "*"
    ])
  });
  // ------------------------------------------------------------
  // ROLE OBJECT
  // ------------------------------------------------------------
  const Role = {
    ROLES,
    ROLE_LIST,
    ROLE_LEVELS,
    DASHBOARD_PATHS,
    PERMISSIONS,
    current: null,
    currentRoles: [],
    // ----------------------------------------------------------
    // NORMALIZE ROLE
    // ----------------------------------------------------------
    normalize(role) {
      if (
        role === undefined ||
        role === null
      ) {
        return null;
      }
      const normalized =
        String(role)
          .trim()
          .toLowerCase();
      return normalized || null;
    },
    // ----------------------------------------------------------
    // VALIDATE ROLE
    // ----------------------------------------------------------
    isValid(role) {
      const normalized =
        this.normalize(role);
      return Boolean(
        normalized &&
        ROLE_LIST.includes(
          normalized
        )
      );
    },
    // ----------------------------------------------------------
    // SET CURRENT ROLE
    // ----------------------------------------------------------
    set(role) {
      const normalized =
        this.normalize(role);
      if (!normalized) {
        this.current = null;
        this.currentRoles = [];
        return null;
      }
      if (
        !this.isValid(normalized)
      ) {
        this.current = null;
        this.currentRoles = [];
        return null;
      }
      this.current =
        normalized;
      this.currentRoles = [
        normalized
      ];
      return this.current;
    },
    // ----------------------------------------------------------
    // SET MULTIPLE ROLES
    // ----------------------------------------------------------
    setRoles(roles = []) {
      if (!Array.isArray(roles)) {
        return this.set(
          roles
        );
      }
      const validRoles =
        roles
          .map(role =>
            this.normalize(role)
          )
          .filter(role =>
            role &&
            this.isValid(role)
          );
      this.currentRoles =
        [...new Set(validRoles)];
      this.current =
        this.currentRoles[0] ||
        null;
      return this.current;
    },
    // ----------------------------------------------------------
    // GET CURRENT ROLE
    // ----------------------------------------------------------
    get() {
      return this.current;
    },
    // ----------------------------------------------------------
    // GET ALL ROLES
    // ----------------------------------------------------------
    getAll() {
      return [
        ...this.currentRoles
      ];
    },
    // ----------------------------------------------------------
    // CHECK ROLE
    // ----------------------------------------------------------
    is(role) {
      const normalized =
        this.normalize(role);
      return Boolean(
        normalized &&
        this.current ===
          normalized
      );
    },
    // ----------------------------------------------------------
    // CHECK ANY ROLE
    // ----------------------------------------------------------
    isAny(roles = []) {
      if (!Array.isArray(roles)) {
        return this.is(
          roles
        );
      }
      return roles.some(
        role =>
          this.is(role)
      );
    },
    // ----------------------------------------------------------
    // CHECK ALL ROLES
    // ----------------------------------------------------------
    isAll(roles = []) {
      if (!Array.isArray(roles)) {
        return false;
      }
      return roles.every(
        role =>
          this.currentRoles.includes(
            this.normalize(role)
          )
      );
    },
    // ----------------------------------------------------------
    // STANDARD ROLE HELPERS
    // ----------------------------------------------------------
    isGuest() {
      return this.is(
        ROLES.GUEST
      );
    },
    isBuyer() {
      return this.is(
        ROLES.BUYER
      );
    },
    isSeller() {
      return this.is(
        ROLES.SELLER
      );
    },
    isTenant() {
      return this.is(
        ROLES.TENANT
      );
    },
    isAgent() {
      return this.is(
        ROLES.AGENT
      );
    },
    isAdmin() {
      return this.is(
        ROLES.ADMIN
      );
    },
    // ----------------------------------------------------------
    // AUTHENTICATION STATE
    // ----------------------------------------------------------
    authenticated() {
      return Boolean(
        this.current &&
        !this.isGuest()
      );
    },
    isAuthenticated() {
      return this.authenticated();
    },
    // ----------------------------------------------------------
    // ROLE LEVEL
    // ----------------------------------------------------------
    level(role = this.current) {
      const normalized =
        this.normalize(role);
      return (
        ROLE_LEVELS[
          normalized
        ] ?? -1
      );
    },
    // ----------------------------------------------------------
    // CHECK MINIMUM ROLE LEVEL
    // ----------------------------------------------------------
    hasLevel(requiredRole) {
      if (
        !this.authenticated()
      ) {
        return false;
      }
      return (
        this.level() >=
        this.level(
          requiredRole
        )
      );
    },
    // ----------------------------------------------------------
    // PERMISSION CHECK
    // ----------------------------------------------------------
    can(permission) {
      if (
        !permission ||
        !this.current
      ) {
        return false;
      }
      if (
        this.isAdmin()
      ) {
        return true;
      }
      const permissions =
        PERMISSIONS[
          this.current
        ] || [];
      return (
        permissions.includes(
          permission
        ) ||
        permissions.includes("*")
      );
    },
    // ----------------------------------------------------------
    // MULTIPLE PERMISSIONS
    // ----------------------------------------------------------
    canAny(permissions = []) {
      if (!Array.isArray(permissions)) {
        return this.can(
          permissions
        );
      }
      return permissions.some(
        permission =>
          this.can(permission)
      );
    },
    canAll(permissions = []) {
      if (!Array.isArray(permissions)) {
        return false;
      }
      return permissions.every(
        permission =>
          this.can(permission)
      );
    },
    // ----------------------------------------------------------
    // DASHBOARD PATH
    // ----------------------------------------------------------
    dashboardPath(role = this.current) {
      const normalized =
        this.normalize(role);
      return (
        DASHBOARD_PATHS[
          normalized
        ] ||
        DASHBOARD_PATHS[
          ROLES.GUEST
        ]
      );
    },
    // ----------------------------------------------------------
    // ROLE HOME
    // ----------------------------------------------------------
    homePath() {
      return this.dashboardPath();
    },
    // ----------------------------------------------------------
    // USER → ROLE
    // ----------------------------------------------------------
    setFromUser(user) {
      if (
        !user ||
        typeof user !== "object"
      ) {
        return this.set(
          ROLES.GUEST
        );
      }
      const role =
        user.role ||
        user.userRole ||
        user.user_role ||
        user.accountRole ||
        user.account_role;
      // Support optional roles array.
      if (
        Array.isArray(
          user.roles
        )
      ) {
        const roles =
          user.roles.length
            ? user.roles
            : [
                role
              ];
        this.setRoles(
          roles
        );
        if (
          !this.current
        ) {
          this.set(
            ROLES.GUEST
          );
        }
        return this.current;
      }
      return this.set(
        role ||
        ROLES.GUEST
      );
    },
    // ----------------------------------------------------------
    // CLEAR ROLE
    // ----------------------------------------------------------
    clear() {
      this.current = null;
      this.currentRoles = [];
      return null;
    },
    // ----------------------------------------------------------
    // LOGOUT RESET
    // ----------------------------------------------------------
    reset() {
      return this.clear();
    },
    // ----------------------------------------------------------
    // ROLE LABEL
    // ----------------------------------------------------------
    label(role = this.current) {
      const normalized =
        this.normalize(role);
      if (!normalized) {
        return "Guest";
      }
      return normalized
        .replace(/[-_]+/g, " ")
        .replace(
          /\b\w/g,
          char =>
            char.toUpperCase()
        );
    },
    // ----------------------------------------------------------
    // ROLE CHECK FROM USER
    // ----------------------------------------------------------
    userHasRole(
      user,
      role
    ) {
      if (
        !user ||
        typeof user !== "object"
      ) {
        return false;
      }
      const target =
        this.normalize(role);
      if (!target) {
        return false;
      }
      const userRole =
        this.normalize(
          user.role ||
          user.userRole ||
          user.user_role ||
          user.accountRole ||
          user.account_role
        );
      if (
        userRole === target
      ) {
        return true;
      }
      if (
        Array.isArray(user.roles)
      ) {
        return user.roles.some(
          item =>
            this.normalize(item) ===
            target
        );
      }
      return false;
    },
    // ----------------------------------------------------------
    // REDIRECT INFORMATION
    // ----------------------------------------------------------
    getRedirect() {
      return {
        role:
          this.current,
        authenticated:
          this.authenticated(),
        path:
          this.dashboardPath(),
        label:
          this.label()
      };
    },
    // ----------------------------------------------------------
    // SAFE STATE
    // ----------------------------------------------------------
    getState() {
      return {
        current:
          this.current,
        roles:
          this.getAll(),
        authenticated:
          this.authenticated(),
        level:
          this.level(),
        dashboard:
          this.dashboardPath()
      };
    }
  };
  // ------------------------------------------------------------
  // EXPOSE
  // ------------------------------------------------------------
  GHAR.Role = Role;
  window.GHARRole = Role;
})(window);

What this upgrade adds

Role.js
│
├── Role constants
├── Role normalization
├── Role validation
├── Single-role support
├── Multi-role support
├── Role hierarchy
├── Authentication state
├── Dashboard routing
├── Permission checking
├── can()
├── canAny()
├── canAll()
├── isAny()
├── isAll()
├── User → role mapping
├── Role labels
├── Safe state
└── Logout/reset handling

One critical point: the PERMISSIONS object is only a frontend UX/visibility layer. A user must never gain authorization merely because Role.js says can("property.delete"); your Express role.middleware.js, ownership.middleware.js, and backend controllers/services must enforce the actual authorization.