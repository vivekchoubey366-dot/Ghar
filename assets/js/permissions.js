// ============================================================
// GHAR - Permissions.js
// Role and permission authorization helper
// ============================================================

"use strict";

(function (window) {

  const GHAR = window.GHAR = window.GHAR || {};

  const Permissions = {

    currentUser: null,

    permissions: new Set(),

    setUser(user) {

      this.currentUser =
        user || null;

      this.permissions =
        new Set(
          Array.isArray(
            user?.permissions
          )
            ? user.permissions
            : []
        );

      return this;
    },

    setPermissions(list = []) {

      this.permissions =
        new Set(
          Array.isArray(list)
            ? list
            : []
        );

      return this;
    },

    has(permission) {
      return this.permissions.has(
        permission
      );
    },

    hasAny(list = []) {
      return list.some(
        permission =>
          this.has(permission)
      );
    },

    hasAll(list = []) {
      return list.every(
        permission =>
          this.has(permission)
      );
    },

    can(permission) {
      return this.has(permission);
    },

    canAny(list = []) {
      return this.hasAny(list);
    },

    canAll(list = []) {
      return this.hasAll(list);
    },

    require(permission) {

      if (!this.has(permission)) {
        throw new Error(
          `Permission denied: ${permission}`
        );
      }

      return true;
    },

    guard(
      permission,
      callback,
      fallback = null
    ) {

      if (this.has(permission)) {

        if (
          typeof callback ===
          "function"
        ) {
          return callback();
        }

        return true;
      }

      if (
        typeof fallback ===
        "function"
      ) {
        return fallback();
      }

      return false;
    },

    applyToDOM() {

      document
        .querySelectorAll(
          "[data-permission]"
        )
        .forEach(element => {

          const required =
            element.dataset.permission;

          if (
            !this.has(required)
          ) {
            element.hidden = true;
            element.setAttribute(
              "aria-hidden",
              "true"
            );
          }

        });

    }
  };

  GHAR.Permissions =
    Permissions;

  window.GHARPermissions =
    Permissions;

})(window);