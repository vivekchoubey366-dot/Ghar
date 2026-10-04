"use strict";

/**
 * GHAR Role Authorization Middleware
 *
 * Authentication:
 *   auth.middleware.js
 *
 * Authorization:
 *   role.middleware.js
 *
 * Supported application roles:
 *
 * - buyer
 * - seller
 * - tenant
 * - agent
 * - admin
 * - super_admin
 * - business
 *
 * Example:
 *
 * router.get(
 *   "/buyer/dashboard",
 *   requireAuth,
 *   requireRole("buyer"),
 *   controller.dashboard
 * );
 */

const ROLES = Object.freeze({
  BUYER: "buyer",
  SELLER: "seller",
  TENANT: "tenant",
  AGENT: "agent",
  BUSINESS: "business",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin"
});

const ALL_ROLES = new Set(
  Object.values(ROLES)
);

function normalizeRole(role) {
  if (!role) {
    return null;
  }

  return String(role)
    .trim()
    .toLowerCase();
}

function sendUnauthorized(req, res) {
  return res.status(401).json({
    success: false,
    error: {
      code: "AUTHENTICATION_REQUIRED",
      message: "Authentication is required.",
      requestId: req.requestId || null
    }
  });
}

function sendForbidden(req, res, requiredRoles) {
  return res.status(403).json({
    success: false,
    error: {
      code: "INSUFFICIENT_ROLE",
      message: "You do not have permission to access this resource.",
      requiredRoles,
      requestId: req.requestId || null
    }
  });
}

/**
 * Require one or more roles.
 *
 * Usage:
 *
 * requireRole("buyer")
 *
 * or:
 *
 * requireRole(["buyer", "agent"])
 */
function requireRole(roles) {
  const allowedRoles = Array.isArray(roles)
    ? roles.map(normalizeRole).filter(Boolean)
    : [normalizeRole(roles)];

  return (req, res, next) => {
    if (!req.user?.userId) {
      return sendUnauthorized(req, res);
    }

    const userRole = normalizeRole(
      req.user.role
    );

    if (
      !userRole ||
      !allowedRoles.includes(userRole)
    ) {
      return sendForbidden(
        req,
        res,
        allowedRoles
      );
    }

    next();
  };
}

/**
 * Require any authenticated application role.
 */
function requireAnyRole(req, res, next) {
  if (!req.user?.userId) {
    return sendUnauthorized(req, res);
  }

  const userRole = normalizeRole(
    req.user.role
  );

  if (!ALL_ROLES.has(userRole)) {
    return sendForbidden(
      req,
      res,
      Array.from(ALL_ROLES)
    );
  }

  next();
}

/**
 * Allow multiple roles.
 *
 * Alias useful when route definitions read better
 * with explicit naming.
 */
function allowRoles(...roles) {
  return requireRole(roles);
}

/**
 * Check the current user's role.
 */
function hasRole(req, role) {
  const userRole = normalizeRole(
    req.user?.role
  );

  return userRole === normalizeRole(role);
}

/**
 * Check whether the current user has any of
 * the supplied roles.
 */
function hasAnyRole(req, roles) {
  const userRole = normalizeRole(
    req.user?.role
  );

  if (!userRole || !Array.isArray(roles)) {
    return false;
  }

  return roles
    .map(normalizeRole)
    .includes(userRole);
}

module.exports = {
  ROLES,
  ALL_ROLES,
  normalizeRole,
  requireRole,
  requireAnyRole,
  allowRoles,
  hasRole,
  hasAnyRole
};