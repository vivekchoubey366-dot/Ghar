"use strict";

/**
 * ============================================================
 * GHAR - OWNERSHIP / RESOURCE ACCESS MIDDLEWARE
 * ============================================================
 *
 * Purpose:
 * - Prevent users from modifying resources they do not own
 * - Protect user-specific resources
 * - Support owner/admin access
 * - Support property ownership checks
 * - Support resources identified through route parameters
 *
 * IMPORTANT:
 * This middleware is an authorization layer.
 *
 * Authentication:
 *   middleware/auth.middleware.js
 *
 * Admin authorization:
 *   middleware/admin.middleware.js
 *
 * Ownership authorization:
 *   THIS FILE
 *
 * ============================================================
 */

const db = require("../config/database");


/**
 * ------------------------------------------------------------
 * Standard authorization error
 * ------------------------------------------------------------
 */

function sendOwnershipError(
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
 * Require authenticated user
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
    sendOwnershipError(
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
 * ------------------------------------------------------------
 * Check whether current user is administrator
 * ------------------------------------------------------------
 */

function isAdmin(req) {
  return (
    req.user?.role === "admin" ||
    req.user?.role === "super_admin"
  );
}


/**
 * ------------------------------------------------------------
 * Check whether current user is super administrator
 * ------------------------------------------------------------
 */

function isSuperAdmin(req) {
  return (
    req.user?.role === "super_admin"
  );
}


/**
 * ============================================================
 * USER OWNERSHIP
 * ============================================================
 *
 * Protect resources belonging to a specific user.
 *
 * Expected route:
 *
 * /users/:userId
 *
 * Example:
 *
 * router.get(
 *   "/users/:userId/profile",
 *   requireAuth,
 *   requireUserOwnership(),
 *   controller
 * );
 *
 * ============================================================
 */

function requireUserOwnership(
  options = {}
) {
  const parameter =
    options.parameter ||
    "userId";

  const allowAdmin =
    options.allowAdmin !== false;

  return function userOwnershipMiddleware(
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

    const requestedUserId =
      req.params?.[parameter];

    if (!requestedUserId) {
      return sendOwnershipError(
        res,
        400,
        "USER_ID_REQUIRED",
        `Route parameter "${parameter}" is required.`,
        req.requestId
      );
    }

    const currentUserId =
      String(req.user.id);

    const targetUserId =
      String(requestedUserId);

    if (
      currentUserId === targetUserId
    ) {
      return next();
    }

    if (
      allowAdmin &&
      isAdmin(req)
    ) {
      return next();
    }

    return sendOwnershipError(
      res,
      403,
      "RESOURCE_ACCESS_DENIED",
      "You do not have permission to access this user's resource.",
      req.requestId
    );
  };
}


/**
 * ============================================================
 * PROPERTY OWNERSHIP
 * ============================================================
 *
 * Checks the property owner in PostgreSQL.
 *
 * Expected route:
 *
 * /properties/:propertyId
 *
 * Expected property table:
 *
 * properties.owner_id
 *
 * ============================================================
 */

async function getPropertyOwner(
  propertyId
) {
  const query = `
    SELECT
      id,
      owner_id
    FROM properties
    WHERE id = $1
    LIMIT 1
  `;

  const result =
    await db.query(
      query,
      [propertyId]
    );

  return (
    result.rows[0] ||
    null
  );
}


/**
 * ------------------------------------------------------------
 * Require property owner
 * ------------------------------------------------------------
 */

function requirePropertyOwnership(
  options = {}
) {
  const parameter =
    options.parameter ||
    "propertyId";

  const allowAdmin =
    options.allowAdmin !== false;

  return async function propertyOwnershipMiddleware(
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

    const propertyId =
      req.params?.[parameter];

    if (!propertyId) {
      return sendOwnershipError(
        res,
        400,
        "PROPERTY_ID_REQUIRED",
        `Route parameter "${parameter}" is required.`,
        req.requestId
      );
    }

    try {
      const property =
        await getPropertyOwner(
          propertyId
        );

      if (!property) {
        return sendOwnershipError(
          res,
          404,
          "PROPERTY_NOT_FOUND",
          "The requested property was not found.",
          req.requestId
        );
      }

      const currentUserId =
        String(req.user.id);

      const ownerId =
        String(property.owner_id);

      /**
       * Owner
       */

      if (
        currentUserId === ownerId
      ) {
        req.property =
          property;

        return next();
      }

      /**
       * Administrator
       */

      if (
        allowAdmin &&
        isAdmin(req)
      ) {
        req.property =
          property;

        return next();
      }

      return sendOwnershipError(
        res,
        403,
        "PROPERTY_ACCESS_DENIED",
        "You do not have permission to modify this property.",
        req.requestId
      );

    } catch (error) {
      return next(error);
    }
  };
}


/**
 * ============================================================
 * PROPERTY OWNER OR ADMIN
 * ============================================================
 *
 * Convenience middleware.
 * ============================================================
 */

const requirePropertyOwnerOrAdmin =
  requirePropertyOwnership({
    allowAdmin: true
  });


/**
 * ============================================================
 * STRICT PROPERTY OWNER
 * ============================================================
 *
 * Even administrators cannot pass this middleware unless they
 * actually own the property.
 *
 * Useful where the business rule requires actual ownership.
 * ============================================================
 */

const requireActualPropertyOwner =
  requirePropertyOwnership({
    allowAdmin: false
  });


/**
 * ============================================================
 * GENERIC RESOURCE OWNERSHIP
 * ============================================================
 *
 * Allows controllers to provide an ownership lookup function.
 *
 * Example:
 *
 * requireOwnership({
 *   parameter: "applicationId",
 *
 *   getOwnerId: async (req) => {
 *     const application =
 *       await applicationService.findById(
 *         req.params.applicationId
 *       );
 *
 *     return application?.user_id;
 *   }
 * })
 *
 * ============================================================
 */

function requireOwnership({
  parameter = "id",
  getOwnerId,
  allowAdmin = true
} = {}) {
  if (
    typeof getOwnerId !== "function"
  ) {
    throw new TypeError(
      "requireOwnership requires a getOwnerId function."
    );
  }

  return async function ownershipMiddleware(
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

    const resourceId =
      req.params?.[parameter];

    if (!resourceId) {
      return sendOwnershipError(
        res,
        400,
        "RESOURCE_ID_REQUIRED",
        `Route parameter "${parameter}" is required.`,
        req.requestId
      );
    }

    try {
      /**
       * Administrator bypass.
       */

      if (
        allowAdmin &&
        isAdmin(req)
      ) {
        return next();
      }

      const ownerId =
        await getOwnerId(req);

      if (
        ownerId === null ||
        ownerId === undefined
      ) {
        return sendOwnershipError(
          res,
          404,
          "RESOURCE_NOT_FOUND",
          "The requested resource was not found.",
          req.requestId
        );
      }

      if (
        String(ownerId) !==
        String(req.user.id)
      ) {
        return sendOwnershipError(
          res,
          403,
          "RESOURCE_ACCESS_DENIED",
          "You do not have permission to access this resource.",
          req.requestId
        );
      }

      return next();

    } catch (error) {
      return next(error);
    }
  };
}


/**
 * ============================================================
 * RESOURCE OWNER OR SUPER ADMIN
 * ============================================================
 */

function requireOwnerOrSuperAdmin({
  parameter = "id",
  getOwnerId
} = {}) {
  return requireOwnership({
    parameter,
    getOwnerId,
    allowAdmin: false
  });
}


/**
 * ============================================================
 * BODY OWNER CHECK
 * ============================================================
 *
 * Useful for create/update requests where the owner ID comes
 * from the request body.
 *
 * Example:
 *
 * {
 *   "ownerId": "123"
 * }
 *
 * ============================================================
 */

function requireBodyOwnership(
  options = {}
) {
  const field =
    options.field ||
    "ownerId";

  const allowAdmin =
    options.allowAdmin !== false;

  return function bodyOwnershipMiddleware(
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

    const requestedOwnerId =
      req.body?.[field];

    /**
     * If owner ID isn't supplied, use the authenticated user.
     */

    if (
      requestedOwnerId === undefined ||
      requestedOwnerId === null ||
      requestedOwnerId === ""
    ) {
      req.body[field] =
        req.user.id;

      return next();
    }

    if (
      String(requestedOwnerId) ===
      String(req.user.id)
    ) {
      return next();
    }

    if (
      allowAdmin &&
      isAdmin(req)
    ) {
      return next();
    }

    return sendOwnershipError(
      res,
      403,
      "OWNER_MISMATCH",
      "You cannot assign this resource to another user.",
      req.requestId
    );
  };
}


/**
 * ============================================================
 * PREVENT USER ID SPOOFING
 * ============================================================
 *
 * Forces ownership fields to the authenticated user unless
 * the request is made by an administrator.
 *
 * Useful for:
 *
 * applications
 * favourites
 * referrals
 * messages
 * visits
 * support tickets
 *
 * ============================================================
 */

function forceAuthenticatedOwner(
  options = {}
) {
  const field =
    options.field ||
    "userId";

  const allowAdmin =
    options.allowAdmin === true;

  return function forceOwnerMiddleware(
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

    if (
      allowAdmin &&
      isAdmin(req)
    ) {
      return next();
    }

    req.body =
      req.body || {};

    req.body[field] =
      req.user.id;

    return next();
  };
}


/**
 * ============================================================
 * ADMIN-ONLY OWNERSHIP OVERRIDE
 * ============================================================
 *
 * Useful when a route explicitly allows an administrator to
 * operate on another user's resource.
 * ============================================================
 */

function requireAdminOwnershipOverride(
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

  if (
    !isAdmin(req)
  ) {
    return sendOwnershipError(
      res,
      403,
      "ADMIN_ACCESS_REQUIRED",
      "Administrator privileges are required for this operation.",
      req.requestId
    );
  }

  return next();
}


/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  requireUserOwnership,

  requirePropertyOwnership,

  requirePropertyOwnerOrAdmin,

  requireActualPropertyOwner,

  requireOwnership,

  requireOwnerOrSuperAdmin,

  requireBodyOwnership,

  forceAuthenticatedOwner,

  requireAdminOwnershipOverride,

  isAdmin,

  isSuperAdmin
};