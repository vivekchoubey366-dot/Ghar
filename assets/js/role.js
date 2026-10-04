// ============================================================
// GHAR - Role.js
// User role management
// ============================================================

"use strict";

(function (window) {

  const GHAR = window.GHAR = window.GHAR || {};

  const ROLES = Object.freeze({
    GUEST: "guest",
    BUYER: "buyer",
    SELLER: "seller",
    TENANT: "tenant",
    AGENT: "agent",
    ADMIN: "admin"
  });

  const Role = {

    ROLES,

    current: null,

    set(role) {

      if (!role) {
        this.current = null;
        return null;
      }

      this.current =
        String(role)
          .toLowerCase();

      return this.current;
    },

    get() {
      return this.current;
    },

    is(role) {

      return (
        this.current ===
        String(role)
          .toLowerCase()
      );

    },

    isAny(roles = []) {

      return roles.some(
        role => this.is(role)
      );

    },

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

    authenticated() {
      return !this.isGuest() &&
        Boolean(this.current);
    },

    dashboardPath() {

      switch (this.current) {

        case ROLES.BUYER:
          return "/buyer/index.html";

        case ROLES.SELLER:
          return "/seller/index.html";

        case ROLES.TENANT:
          return "/tenant/index.html";

        case ROLES.ADMIN:
          return "/admin/admin-dashboard.html";

        case ROLES.AGENT:
          return "/dashboard.html";

        default:
          return "/index.html";
      }

    },

    setFromUser(user) {

      const role =
        user?.role ||
        user?.user_role ||
        user?.account_role;

      return this.set(
        role || ROLES.GUEST
      );
    }
  };

  GHAR.Role = Role;

  window.GHARRole = Role;

})(window);