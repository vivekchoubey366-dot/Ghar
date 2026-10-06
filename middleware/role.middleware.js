"use strict";

/**
 * ============================================================
 * GHAR - ROLE / AUTHORIZATION MIDDLEWARE
 * ============================================================
 *
 * Purpose:
 * - Restrict routes by user role
 * - Support one or multiple allowed roles
 * - Provide reusable role middleware
 * - Work with auth.middleware.js
 * - Support admin / super-admin hierarchy
 *
 * Authentication is handled by:
 *   middleware/auth.middleware.js
 *
 * Authorization is handled here.
 *
 * ============================================================
 */


/**
 * ------------------------------------------------------------
 * Standard authorization error
 * ------------------------------------------------------------
 */

function sendRoleError(
  res,
  status,
  code,
  message,
  requestId
) {
  return res.status(status).json({
    success: false,

    error: {
      code,
      message,
      requestId:
        requestId || null
    }
  });
}


/**
 * ------------------------------------------------------------
 * Normalize role
 * ------------------------------------------------------------
 */

function normalizeRole(
  role
) {
  if (
    role === undefined ||
    role === null
  ) {
    return null;
  }

  return String(role)
    .trim()
    .toLowerCase();
}


/**
 * ------------------------------------------------------------
 * Get authenticated role
 * ------------------------------------------------------------
 */

function getUserRole(
  req
) {
  return normalizeRole(
    req.user?.role
  );
}


/**
 * ------------------------------------------------------------
 * Require authentication
 * ------------------------------------------------------------
 */

function ensureAuthenticated(
  req,
  res
) {
  if (
    !req.user ||
    !req.user.id
  ) {
    sendRoleError(
      res,
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
      req.requestId
    );

    return false;
  }

  return true;
}


/**
 * ============================================================
 * REQUIRE ROLE
 * ============================================================
 *
 * Example:
 *
 * router.get(
 *   "/admin/dashboard",
 *   requireAuth,
 *   requireRole("admin"),
 *   controller
 * );
 *
 * ============================================================
 */

function requireRole(
  ...allowedRoles
) {
  const roles =
    allowedRoles
      .flat(Infinity)
      .map(normalizeRole)
      .filter(Boolean);

  if (
    roles.length === 0
  ) {
    throw new TypeError(
      "requireRole requires at least one role."
    );
  }

  return function roleMiddleware(
    req,
    res,
    next
  ) {
    if (
      !ensureAuthenticated(
        req,
        res
      )
    ) {
      return;
    }

    const userRole =
      getUserRole(req);

    if (
      !userRole
    ) {
      return sendRoleError(
        res,
        403,
        "ROLE_NOT_ASSIGNED",
        "Your account does not have an assigned role.",
        req.requestId
      );
    }

    if (
      !roles.includes(
        userRole
      )
    ) {
      return sendRoleError(
        res,
        403,
        "INSUFFICIENT_ROLE",
        "You do not have permission to perform this action.",
        req.requestId
      );
    }

    return next();
  };
}


/**
 * ============================================================
 * REQUIRE ANY ROLE
 * ============================================================
 *
 * Convenience wrapper:
 *
 * requireAnyRole("buyer", "seller", "admin")
 *
 * ============================================================
 */

function requireAnyRole(
  roles
) {
  const normalizedRoles =
    Array.isArray(roles)
      ? roles
      : Array.from(
          arguments
        );

  return requireRole(
    normalizedRoles
  );
}


/**
 * ============================================================
 * REQUIRE ALL ROLES
 * ============================================================
 *
 * Normally roles are mutually exclusive, so this should be
 * used only when your authorization model intentionally allows
 * multiple role assignments.
 *
 * ============================================================
 */

function requireAllRoles(
  ...requiredRoles
) {
  const roles =
    requiredRoles
      .flat(Infinity)
      .map(normalizeRole)
      .filter(Boolean);

  if (
    roles.length === 0
  ) {
    throw new TypeError(
      "requireAllRoles requires at least one role."
    );
  }

  return function allRolesMiddleware(
    req,
    res,
    next
  ) {
    if (
      !ensureAuthenticated(
        req,
        res
      )
    ) {
      return;
    }

    /**
     * Support either:
     *
     * req.user.roles
     *
     * or:
     *
     * req.user.role
     */

    const userRoles =
      Array.isArray(
        req.user?.roles
      )
        ? req.user.roles
            .map(normalizeRole)
        : [
            getUserRole(req)
          ].filter(Boolean);

    const hasAll =
      roles.every(
        role =>
          userRoles.includes(
            role
          )
      );

    if (
      !hasAll
    ) {
      return sendRoleError(
        res,
        403,
        "INSUFFICIENT_ROLE",
        "You do not have all required roles.",
        req.requestId
      );
    }

    return next();
  };
}


/**
 * ============================================================
 * ADMIN ROLE
 * ============================================================
 *
 * Allows:
 *
 * admin
 * super_admin
 *
 * ============================================================
 */

const requireAdmin =
  requireRole(
    "admin",
    "super_admin"
  );


/**
 * ============================================================
 * SUPER ADMIN
 * ============================================================
 */

const requireSuperAdmin =
  requireRole(
    "super_admin"
  );


/**
 * ============================================================
 * BUYER
 * ============================================================
 */

const requireBuyer =
  requireRole(
    "buyer"
  );


/**
 * ============================================================
 * SELLER
 * ============================================================
 */

const requireSeller =
  requireRole(
    "seller"
  );


/**
 * ============================================================
 * TENANT
 * ============================================================
 */

const requireTenant =
  requireRole(
    "tenant"
  );


/**
 * ============================================================
 * LANDLORD
 * ============================================================
 */

const requireLandlord =
  requireRole(
    "landlord"
  );


/**
 * ============================================================
 * AGENT
 * ============================================================
 */

const requireAgent =
  requireRole(
    "agent"
  );


/**
 * ============================================================
 * BROKER
 * ============================================================
 */

const requireBroker =
  requireRole(
    "broker"
  );


/**
 * ============================================================
 * FINANCE / LOAN OFFICER
 * ============================================================
 */

const requireLoanOfficer =
  requireRole(
    "loan_officer"
  );


/**
 * ============================================================
 * SUPPORT
 * ============================================================
 */

const requireSupport =
  requireRole(
    "support"
  );


/**
 * ============================================================
 * VERIFICATION OFFICER
 * ============================================================
 */

const requireVerificationOfficer =
  requireRole(
    "verification_officer"
  );


/**
 * ============================================================
 * PROPERTY MANAGER
 * ============================================================
 */

const requirePropertyManager =
  requireRole(
    "property_manager"
  );


/**
 * ============================================================
 * INTERNAL STAFF
 * ============================================================
 */

const requireStaff =
  requireRole(
    "admin",
    "super_admin",
    "support",
    "loan_officer",
    "verification_officer",
    "property_manager"
  );


/**
 * ============================================================
 * ADMIN CHECK
 * ============================================================
 */

function isAdmin(
  req
) {
  const role =
    getUserRole(req);

  return (
    role === "admin" ||
    role === "super_admin"
  );
}


/**
 * ============================================================
 * SUPER ADMIN CHECK
 * ============================================================
 */

function isSuperAdmin(
  req
) {
  return (
    getUserRole(req) ===
    "super_admin"
  );
}


/**
 * ============================================================
 * ROLE CHECK WITHOUT MIDDLEWARE
 * ============================================================
 *
 * Useful inside controllers/services.
 *
 * Example:
 *
 * if (hasRole(req, "seller")) {
 *   ...
 * }
 *
 * ============================================================
 */

function hasRole(
  req,
  ...roles
) {
  const userRole =
    getUserRole(req);

  if (
    !userRole
  ) {
    return false;
  }

  const normalizedRoles =
    roles
      .flat(Infinity)
      .map(normalizeRole)
      .filter(Boolean);

  return normalizedRoles.includes(
    userRole
  );
}


/**
 * ============================================================
 * HAS ANY ROLE
 * ============================================================
 */

function hasAnyRole(
  req,
  roles
) {
  const normalizedRoles =
    Array.isArray(roles)
      ? roles
      : Array.from(
          arguments
        ).slice(1);

  return hasRole(
    req,
    normalizedRoles
  );
}


/**
 * ============================================================
 * ROLE HIERARCHY
 * ============================================================
 *
 * Higher number = higher administrative privilege.
 *
 * This is useful for rules such as:
 *
 * "A user cannot modify another administrator unless they
 *  have a higher role."
 *
 * ============================================================
 */

const ROLE_LEVELS =
  Object.freeze({
    buyer: 10,
    tenant: 10,
    seller: 10,
    landlord: 10,

    agent: 20,
    broker: 20,

    support: 30,
    loan_officer: 30,
    verification_officer: 30,
    property_manager: 30,

    admin: 50,

    super_admin: 100
  });


/**
 * ------------------------------------------------------------
 * Get role level
 * ------------------------------------------------------------
 */

function getRoleLevel(
  role
) {
  const normalized =
    normalizeRole(role);

  return (
    ROLE_LEVELS[
      normalized
    ] || 0
  );
}


/**
 * ------------------------------------------------------------
 * Require minimum role level
 * ------------------------------------------------------------
 */

function requireMinimumRole(
  minimumRole
) {
  const minimumLevel =
    getRoleLevel(
      minimumRole
    );

  if (
    minimumLevel <= 0
  ) {
    throw new TypeError(
      `Unknown role: ${minimumRole}`
    );
  }

  return function minimumRoleMiddleware(
    req,
    res,
    next
  ) {
    if (
      !ensureAuthenticated(
        req,
        res
      )
    ) {
      return;
    }

    const userRole =
      getUserRole(req);

    const userLevel =
      getRoleLevel(
        userRole
      );

    if (
      userLevel <
      minimumLevel
    ) {
      return sendRoleError(
        res,
        403,
        "INSUFFICIENT_ROLE_LEVEL",
        "You do not have sufficient privileges for this action.",
        req.requestId
      );
    }

    return next();
  };
}


/**
 * ============================================================
 * PREVENT PRIVILEGE ESCALATION
 * ============================================================
 *
 * Prevent a user from assigning a role higher than their own.
 *
 * Useful on:
 *
 * POST /admin/users
 * PATCH /admin/users/:id
 *
 * ============================================================
 */

function preventPrivilegeEscalation(
  options = {}
) {
  const roleField =
    options.roleField ||
    "role";

  return function privilegeMiddleware(
    req,
    res,
    next
  ) {
    if (
      !ensureAuthenticated(
        req,
        res
      )
    ) {
      return;
    }

    const requestedRole =
      normalizeRole(
        req.body?.[
          roleField
        ]
      );

    /**
     * No role change.
     */

    if (
      !requestedRole
    ) {
      return next();
    }

    const requestedLevel =
      getRoleLevel(
        requestedRole
      );

    const currentLevel =
      getRoleLevel(
        getUserRole(req)
      );

    if (
      requestedLevel <= 0
    ) {
      return sendRoleError(
        res,
        400,
        "INVALID_ROLE",
        "The requested role is invalid.",
        req.requestId
      );
    }

    /**
     * Super admin can manage all roles.
     */

    if (
      isSuperAdmin(req)
    ) {
      return next();
    }

    /**
     * A user cannot assign a role equal to or higher than
     * their own privilege level.
     */

    if (
      requestedLevel >=
      currentLevel
    ) {
      return sendRoleError(
        res,
        403,
        "PRIVILEGE_ESCALATION_DENIED",
        "You cannot assign a role with equal or higher privileges than your own.",
        req.requestId
      );
    }

    return next();
  };
}


/**
 * ============================================================
 * PREVENT SELF ROLE ESCALATION
 * ============================================================
 */

function preventSelfRoleChange(
  options = {}
) {
  const roleField =
    options.roleField ||
    "role";

  return function selfRoleMiddleware(
    req,
    res,
    next
  ) {
    if (
      !ensureAuthenticated(
        req,
        res
      )
    ) {
      return;
    }

    const targetUserId =
      req.params?.userId ||
      req.params?.id;

    if (
      targetUserId &&
      String(targetUserId) ===
        String(req.user.id) &&
      req.body?.[
        roleField
      ] !== undefined
    ) {
      return sendRoleError(
        res,
        403,
        "SELF_ROLE_CHANGE_DENIED",
        "You cannot change your own role through this operation.",
        req.requestId
      );
    }

    return next();
  };
}


/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  ROLE_LEVELS,

  normalizeRole,

  getUserRole,

  getRoleLevel,

  requireRole,

  requireAnyRole,

  requireAllRoles,

  requireAdmin,

  requireSuperAdmin,

  requireBuyer,

  requireSeller,

  requireTenant,

  requireLandlord,

  requireAgent,

  requireBroker,

  requireLoanOfficer,

  requireSupport,

  requireVerificationOfficer,

  requirePropertyManager,

  requireStaff,

  requireMinimumRole,

  preventPrivilegeEscalation,

  preventSelfRoleChange,

  isAdmin,

  isSuperAdmin,

  hasRole,

  hasAnyRole
};