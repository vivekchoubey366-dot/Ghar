'use strict';

/**
 * ============================================================
 * GHAR - ADMIN AUTHORIZATION MIDDLEWARE
 * ============================================================
 *
 * Purpose:
 * - Protect admin-only routes
 * - Verify authenticated user
 * - Verify administrator role
 * - Support admin / super_admin roles
 * - Prevent deleted, inactive or suspended accounts
 *
 * Expected auth middleware:
 *   req.user = {
 *     id,
 *     role,
 *     status,
 *     email
 *   }
 *
 * Usage:
 *
 * const { requireAdmin } = require('../middleware/admin.middleware');
 *
 * router.get(
 *   '/dashboard',
 *   requireAdmin,
 *   adminController.dashboard
 * );
 *
 * ============================================================
 */

const ADMIN_ROLES = new Set([
  'admin',
  'super_admin'
]);

const ALLOWED_ADMIN_STATUSES = new Set([
  'active'
]);


/**
 * ------------------------------------------------------------
 * Helper: Create authorization error
 * ------------------------------------------------------------
 */

function authorizationError(
  res,
  status,
  code,
  message
) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message
    }
  });
}


/**
 * ------------------------------------------------------------
 * Require authenticated administrator
 * ------------------------------------------------------------
 *
 * Requires auth.middleware.js to run before this middleware.
 */

function requireAdmin(req, res, next) {
  try {
    if (!req.user) {
      return authorizationError(
        res,
        401,
        'AUTHENTICATION_REQUIRED',
        'Authentication is required.'
      );
    }

    const {
      id,
      role,
      status
    } = req.user;

    if (!id) {
      return authorizationError(
        res,
        401,
        'INVALID_USER',
        'Authenticated user information is invalid.'
      );
    }

    if (
      status &&
      !ALLOWED_ADMIN_STATUSES.has(status)
    ) {
      return authorizationError(
        res,
        403,
        'ACCOUNT_NOT_ACTIVE',
        'Your account is not active.'
      );
    }

    if (!ADMIN_ROLES.has(role)) {
      return authorizationError(
        res,
        403,
        'ADMIN_ACCESS_REQUIRED',
        'Administrator privileges are required.'
      );
    }

    req.admin = req.user;

    return next();

  } catch (error) {
    return next(error);
  }
}


/**
 * ------------------------------------------------------------
 * Require super administrator
 * ------------------------------------------------------------
 */

function requireSuperAdmin(req, res, next) {
  try {
    if (!req.user) {
      return authorizationError(
        res,
        401,
        'AUTHENTICATION_REQUIRED',
        'Authentication is required.'
      );
    }

    if (!req.user.id) {
      return authorizationError(
        res,
        401,
        'INVALID_USER',
        'Authenticated user information is invalid.'
      );
    }

    if (
      req.user.status &&
      !ALLOWED_ADMIN_STATUSES.has(req.user.status)
    ) {
      return authorizationError(
        res,
        403,
        'ACCOUNT_NOT_ACTIVE',
        'Your account is not active.'
      );
    }

    if (req.user.role !== 'super_admin') {
      return authorizationError(
        res,
        403,
        'SUPER_ADMIN_ACCESS_REQUIRED',
        'Super administrator privileges are required.'
      );
    }

    req.admin = req.user;

    return next();

  } catch (error) {
    return next(error);
  }
}


/**
 * ------------------------------------------------------------
 * Require one of the supplied roles
 * ------------------------------------------------------------
 *
 * Example:
 *
 * requireRole('admin', 'super_admin')
 *
 * or:
 *
 * requireRole('admin', 'manager', 'super_admin')
 */

function requireRole(...roles) {
  const allowedRoles = new Set(roles);

  return function roleMiddleware(req, res, next) {
    try {
      if (!req.user) {
        return authorizationError(
          res,
          401,
          'AUTHENTICATION_REQUIRED',
          'Authentication is required.'
        );
      }

      if (!req.user.id) {
        return authorizationError(
          res,
          401,
          'INVALID_USER',
          'Authenticated user information is invalid.'
        );
      }

      if (
        req.user.status &&
        !ALLOWED_ADMIN_STATUSES.has(req.user.status)
      ) {
        return authorizationError(
          res,
          403,
          'ACCOUNT_NOT_ACTIVE',
          'Your account is not active.'
        );
      }

      if (!allowedRoles.has(req.user.role)) {
        return authorizationError(
          res,
          403,
          'INSUFFICIENT_PRIVILEGES',
          'You do not have permission to access this resource.'
        );
      }

      req.admin = req.user;

      return next();

    } catch (error) {
      return next(error);
    }
  };
}


/**
 * ------------------------------------------------------------
 * Require admin OR super_admin
 * ------------------------------------------------------------
 */

const requireAdminOrSuperAdmin = requireRole(
  'admin',
  'super_admin'
);


/**
 * ------------------------------------------------------------
 * Export middleware
 * ------------------------------------------------------------
 */

module.exports = {
  requireAdmin,
  requireSuperAdmin,
  requireRole,
  requireAdminOrSuperAdmin,

  ADMIN_ROLES,
  ALLOWED_ADMIN_STATUSES
};