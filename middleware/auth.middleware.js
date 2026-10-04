"use strict";

/**
 * GHAR Authentication Middleware
 *
 * Responsibilities:
 * - Read Bearer JWT
 * - Verify token
 * - Attach authenticated user to req.user
 * - Reject missing/invalid/expired tokens
 *
 * Authorization is handled separately by:
 * - admin.middleware.js
 * - role.middleware.js
 * - subscription.middleware.js
 * - verification.middleware.js
 */

const jwt = require("jsonwebtoken");

const {
  getJwtSecret
} = require("../utils/jwt");

/**
 * Extract Bearer token.
 */
function extractToken(req) {
  const authorization =
    req.get("authorization") || "";

  if (!authorization) {
    return null;
  }

  const [scheme, token] =
    authorization.trim().split(/\s+/);

  if (
    scheme?.toLowerCase() !== "bearer" ||
    !token
  ) {
    return null;
  }

  return token;
}

/**
 * Send authentication error.
 */
function sendAuthError(
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
      requestId: requestId || null
    }
  });
}

/**
 * Required authentication.
 */
function requireAuth(
  req,
  res,
  next
) {
  const token =
    extractToken(req);

  if (!token) {
    return sendAuthError(
      res,
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
      req.requestId
    );
  }

  let payload;

  try {
    payload = jwt.verify(
      token,
      getJwtSecret()
    );
  } catch (error) {
    if (
      error &&
      error.name ===
        "TokenExpiredError"
    ) {
      return sendAuthError(
        res,
        401,
        "TOKEN_EXPIRED",
        "Your session has expired. Please sign in again.",
        req.requestId
      );
    }

    return sendAuthError(
      res,
      401,
      "INVALID_TOKEN",
      "The authentication token is invalid.",
      req.requestId
    );
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !payload.userId
  ) {
    return sendAuthError(
      res,
      401,
      "INVALID_TOKEN_PAYLOAD",
      "The authentication token is invalid.",
      req.requestId
    );
  }

  req.user = {
    id:
      payload.userId,

    userId:
      payload.userId,

    role:
      payload.role || null,

    verificationStatus:
      payload.verificationStatus || null,

    subscriptionPlan:
      payload.subscriptionPlan || null,

    sessionId:
      payload.sessionId || null
  };

  req.auth = {
    authenticated: true,

    tokenPayload:
      payload
  };

  return next();
}

/**
 * Optional authentication.
 */
function optionalAuth(
  req,
  res,
  next
) {
  const token =
    extractToken(req);

  if (!token) {
    req.user = null;

    req.auth = {
      authenticated: false
    };

    return next();
  }

  try {
    const payload =
      jwt.verify(
        token,
        getJwtSecret()
      );

    if (
      payload &&
      typeof payload === "object" &&
      payload.userId
    ) {
      req.user = {
        id:
          payload.userId,

        userId:
          payload.userId,

        role:
          payload.role || null,

        verificationStatus:
          payload.verificationStatus || null,

        subscriptionPlan:
          payload.subscriptionPlan || null,

        sessionId:
          payload.sessionId || null
      };

      req.auth = {
        authenticated: true,

        tokenPayload:
          payload
      };
    } else {
      req.user = null;

      req.auth = {
        authenticated: false
      };
    }
  } catch {
    req.user = null;

    req.auth = {
      authenticated: false
    };
  }

  return next();
}

/**
 * Check authentication state.
 */
function isAuthenticated(req) {
  return Boolean(
    req.auth?.authenticated &&
    req.user?.userId
  );
}

/**
 * ============================================================
 * EXPORTS
 * ============================================================
 *
 * IMPORTANT:
 *
 * `auth` is provided as an alias for `requireAuth`
 * so existing routes such as:
 *
 * const auth = require("../middleware/auth.middleware");
 *
 * continue to work.
 *
 * However, the preferred route syntax is:
 *
 * const { requireAuth } =
 *   require("../middleware/auth.middleware");
 *
 * ============================================================
 */

module.exports = {
  auth: requireAuth,
  requireAuth,
  optionalAuth,
  isAuthenticated,
  extractToken
};