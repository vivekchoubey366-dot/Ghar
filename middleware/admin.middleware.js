"use strict";

/**
 * GHAR Admin Authorization Middleware
 *
 * Authentication:
 *   auth.middleware.js
 *
 * Authorization:
 *   admin.middleware.js
 *
 * Expected flow:
 *
 * Request
 *   ↓
 * request-id
 *   ↓
 * security
 *   ↓
 * auth
 *   ↓
 * admin
 *   ↓
 * controller
 */

const ADMIN_ROLES = new Set([
  "admin",
  "super_admin"
]);

function sendForbidden(res, req, code, message) {
  return res.status(403).json({
    success: false,
    error: {
      code,
      message,
      requestId: req.requestId || null
    }
  });
}

/**
 * Require an authenticated administrator.
 */
function requireAdmin(req, res, next) {
  if (!req.user?.userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required.",
        requestId: req.requestId || null
      }
    });
  }

  const role = String(
    req.user.role || ""
  ).toLowerCase();

  if (!ADMIN_ROLES.has(role)) {
    return sendForbidden(
      res,
      req,
      "ADMIN_ACCESS_REQUIRED",
      "Administrator access is required."
    );
  }

  req.admin = {
    isAdmin: true,
    isSuperAdmin: role === "super_admin",
    role
  };

  next();
}

/**
 * Require Super Admin privileges.
 *
 * Use for high-risk operations such as:
 * - Security configuration
 * - AI model configuration
 * - User privilege changes
 * - Audit-log administration
 * - Critical system settings
 */
function requireSuperAdmin(req, res, next) {
  if (!req.user?.userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required.",
        requestId: req.requestId || null
      }
    });
  }

  const role = String(
    req.user.role || ""
  ).toLowerCase();

  if (role !== "super_admin") {
    return sendForbidden(
      res,
      req,
      "SUPER_ADMIN_ACCESS_REQUIRED",
      "Super administrator access is required."
    );
  }

  req.admin = {
    isAdmin: true,
    isSuperAdmin: true,
    role
  };

  next();
}

/**
 * Check admin status without blocking the request.
 */
function isAdmin(req) {
  const role = String(
    req.user?.role || ""
  ).toLowerCase();

  return ADMIN_ROLES.has(role);
}

/**
 * Check Super Admin status.
 */
function isSuperAdmin(req) {
  return (
    String(
      req.user?.role || ""
    ).toLowerCase() === "super_admin"
  );
}

module.exports = {
  requireAdmin,
  requireSuperAdmin,
  isAdmin,
  isSuperAdmin,
  ADMIN_ROLES
};