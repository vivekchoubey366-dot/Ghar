"use strict";

const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../utils/jwt");

/**
 * ============================================================
 * GHAR - AUTHENTICATION MIDDLEWARE
 * ============================================================
 *
 * Responsibilities:
 * - Extract Bearer JWT from Authorization header
 * - Verify JWT
 * - Validate JWT payload
 * - Attach authenticated user context to req.user
 * - Attach authentication context to req.auth
 * - Support required and optional authentication
 *
 * JWT payload convention used by GHAR:
 *
 * {
 *   userId,
 *   role,
 *   verificationStatus,
 *   subscriptionPlan,
 *   sessionId
 * }
 *
 * Authentication:
 *   requireAuth
 *
 * Optional authentication:
 *   optionalAuth
 *
 * Authorization:
 *   admin.middleware.js
 *
 * ============================================================
 */


/**
 * ------------------------------------------------------------
 * Configuration
 * ------------------------------------------------------------
 */

const JWT_ISSUER =
  process.env.JWT_ISSUER || null;

const JWT_AUDIENCE =
  process.env.JWT_AUDIENCE || null;

const JWT_ALGORITHMS = (
  process.env.JWT_ALGORITHMS ||
  "HS256"
)
  .split(",")
  .map((algorithm) => algorithm.trim())
  .filter(Boolean);


/**
 * ------------------------------------------------------------
 * Extract Bearer token
 * ------------------------------------------------------------
 */

function extractToken(req) {
  const authorization =
    req.get("authorization") || "";

  if (!authorization) {
    return null;
  }

  const parts =
    authorization
      .trim()
      .split(/\s+/);

  if (
    parts.length !== 2 ||
    parts[0]?.toLowerCase() !== "bearer" ||
    !parts[1]
  ) {
    return null;
  }

  return parts[1];
}


/**
 * ------------------------------------------------------------
 * Send authentication error
 * ------------------------------------------------------------
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
 * ------------------------------------------------------------
 * JWT verification options
 * ------------------------------------------------------------
 */

function getVerifyOptions() {
  const options = {
    algorithms: JWT_ALGORITHMS
  };

  if (JWT_ISSUER) {
    options.issuer = JWT_ISSUER;
  }

  if (JWT_AUDIENCE) {
    options.audience = JWT_AUDIENCE;
  }

  return options;
}


/**
 * ------------------------------------------------------------
 * Verify JWT
 * ------------------------------------------------------------
 */

function verifyAccessToken(token) {
  return jwt.verify(
    token,
    getJwtSecret(),
    getVerifyOptions()
  );
}


/**
 * ------------------------------------------------------------
 * Validate JWT payload
 * ------------------------------------------------------------
 */

function isValidPayload(payload) {
  return Boolean(
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    payload.userId
  );
}


/**
 * ------------------------------------------------------------
 * Create req.user
 * ------------------------------------------------------------
 *
 * Keep this function centralized so every authentication
 * path creates the exact same user object.
 * ------------------------------------------------------------
 */

function buildUserFromPayload(payload) {
  return {
    id: payload.userId,

    userId: payload.userId,

    role:
      payload.role || null,

    verificationStatus:
      payload.verificationStatus || null,

    subscriptionPlan:
      payload.subscriptionPlan || null,

    sessionId:
      payload.sessionId || null
  };
}


/**
 * ------------------------------------------------------------
 * Create req.auth
 * ------------------------------------------------------------
 */

function buildAuthContext(payload) {
  return {
    authenticated: true,

    tokenPayload: payload,

    userId:
      payload.userId,

    role:
      payload.role || null,

    sessionId:
      payload.sessionId || null,

    issuedAt:
      payload.iat || null,

    expiresAt:
      payload.exp || null,

    tokenId:
      payload.jti || null
  };
}


/**
 * ------------------------------------------------------------
 * Handle JWT verification errors
 * ------------------------------------------------------------
 */

function handleJwtError(
  error,
  res,
  requestId
) {
  if (
    error &&
    error.name === "TokenExpiredError"
  ) {
    return sendAuthError(
      res,
      401,
      "TOKEN_EXPIRED",
      "Your session has expired. Please sign in again.",
      requestId
    );
  }

  if (
    error &&
    error.name === "NotBeforeError"
  ) {
    return sendAuthError(
      res,
      401,
      "TOKEN_NOT_ACTIVE",
      "The authentication token is not active yet.",
      requestId
    );
  }

  if (
    error &&
    error.name === "JsonWebTokenError"
  ) {
    return sendAuthError(
      res,
      401,
      "INVALID_TOKEN",
      "The authentication token is invalid.",
      requestId
    );
  }

  return sendAuthError(
    res,
    401,
    "TOKEN_VERIFICATION_FAILED",
    "Authentication could not be verified.",
    requestId
  );
}


/**
 * ============================================================
 * REQUIRED AUTHENTICATION
 * ============================================================
 *
 * Use on protected routes.
 *
 * Example:
 *
 * router.get(
 *   "/profile",
 *   requireAuth,
 *   userController.getProfile
 * );
 *
 * ============================================================
 */

function requireAuth(req, res, next) {
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
    payload =
      verifyAccessToken(token);
  } catch (error) {
    return handleJwtError(
      error,
      res,
      req.requestId
    );
  }

  if (
    !isValidPayload(payload)
  ) {
    return sendAuthError(
      res,
      401,
      "INVALID_TOKEN_PAYLOAD",
      "The authentication token is invalid.",
      req.requestId
    );
  }

  /**
   * ----------------------------------------------------------
   * Attach authenticated user
   * ----------------------------------------------------------
   */

  req.user =
    buildUserFromPayload(
      payload
    );

  /**
   * ----------------------------------------------------------
   * Attach authentication context
   * ----------------------------------------------------------
   */

  req.auth =
    buildAuthContext(
      payload
    );

  return next();
}


/**
 * ============================================================
 * OPTIONAL AUTHENTICATION
 * ============================================================
 *
 * Public route can continue whether or not the user has a
 * valid authentication token.
 *
 * Example:
 *
 * router.get(
 *   "/properties",
 *   optionalAuth,
 *   propertyController.list
 * );
 *
 * ============================================================
 */

function optionalAuth(
  req,
  res,
  next
) {
  const token =
    extractToken(req);

  /**
   * ----------------------------------------------------------
   * No token = guest
   * ----------------------------------------------------------
   */

  if (!token) {
    req.user = null;

    req.auth = {
      authenticated: false,
      tokenPayload: null,
      userId: null,
      role: null,
      sessionId: null,
      issuedAt: null,
      expiresAt: null,
      tokenId: null
    };

    return next();
  }

  let payload;

  try {
    payload =
      verifyAccessToken(token);
  } catch {
    /**
     * Optional authentication should not block public
     * endpoints because of an invalid/expired token.
     */

    req.user = null;

    req.auth = {
      authenticated: false,
      tokenPayload: null,
      userId: null,
      role: null,
      sessionId: null,
      issuedAt: null,
      expiresAt: null,
      tokenId: null
    };

    return next();
  }

  /**
   * ----------------------------------------------------------
   * Invalid payload = guest
   * ----------------------------------------------------------
   */

  if (
    !isValidPayload(payload)
  ) {
    req.user = null;

    req.auth = {
      authenticated: false,
      tokenPayload: null,
      userId: null,
      role: null,
      sessionId: null,
      issuedAt: null,
      expiresAt: null,
      tokenId: null
    };

    return next();
  }

  /**
   * ----------------------------------------------------------
   * Valid authenticated user
   * ----------------------------------------------------------
   */

  req.user =
    buildUserFromPayload(
      payload
    );

  req.auth =
    buildAuthContext(
      payload
    );

  return next();
}


/**
 * ============================================================
 * AUTHENTICATION STATUS
 * ============================================================
 */

function isAuthenticated(req) {
  return Boolean(
    req.auth?.authenticated === true &&
    req.user?.userId
  );
}


/**
 * ============================================================
 * REQUIRE VERIFIED USER
 * ============================================================
 *
 * This checks the verificationStatus included in the JWT.
 *
 * Supported values can be:
 *
 * verified
 * approved
 *
 * ============================================================
 */

function requireVerifiedUser(
  req,
  res,
  next
) {
  if (
    !isAuthenticated(req)
  ) {
    return sendAuthError(
      res,
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
      req.requestId
    );
  }

  const status =
    String(
      req.user.verificationStatus || ""
    ).toLowerCase();

  if (
    status !== "verified" &&
    status !== "approved"
  ) {
    return res.status(403).json({
      success: false,
      error: {
        code: "VERIFICATION_REQUIRED",
        message:
          "Account verification is required.",
        requestId:
          req.requestId || null
      }
    });
  }

  return next();
}


/**
 * ============================================================
 * REQUIRE EMAIL VERIFICATION
 * ============================================================
 *
 * This middleware expects:
 *
 * verificationStatus = verified
 *
 * If your schema later separates email and phone verification,
 * this can be extended without changing requireAuth.
 *
 * ============================================================
 */

function requireEmailVerification(
  req,
  res,
  next
) {
  if (
    !isAuthenticated(req)
  ) {
    return sendAuthError(
      res,
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
      req.requestId
    );
  }

  const status =
    String(
      req.user.verificationStatus || ""
    ).toLowerCase();

  if (
    status !== "verified" &&
    status !== "approved"
  ) {
    return res.status(403).json({
      success: false,
      error: {
        code: "EMAIL_VERIFICATION_REQUIRED",
        message:
          "Please verify your account before continuing.",
        requestId:
          req.requestId || null
      }
    });
  }

  return next();
}


/**
 * ============================================================
 * REQUIRE ACTIVE SUBSCRIPTION
 * ============================================================
 *
 * This is intentionally based only on the JWT claim.
 *
 * For payment-sensitive operations, the controller/service
 * should additionally verify the current subscription in the
 * database rather than trusting an old JWT indefinitely.
 *
 * ============================================================
 */

function requireSubscription(
  req,
  res,
  next
) {
  if (
    !isAuthenticated(req)
  ) {
    return sendAuthError(
      res,
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
      req.requestId
    );
  }

  const plan =
    String(
      req.user.subscriptionPlan || ""
    ).toLowerCase();

  if (
    !plan ||
    plan === "none" ||
    plan === "free" ||
    plan === "inactive" ||
    plan === "expired"
  ) {
    return res.status(403).json({
      success: false,
      error: {
        code: "SUBSCRIPTION_REQUIRED",
        message:
          "An active subscription is required for this feature.",
        requestId:
          req.requestId || null
      }
    });
  }

  return next();
}


/**
 * ============================================================
 * REQUIRE SPECIFIC SUBSCRIPTION
 * ============================================================
 *
 * Example:
 *
 * router.post(
 *   "/premium",
 *   requireAuth,
 *   requireSubscriptionPlan(
 *     "premium",
 *     "business"
 *   ),
 *   controller
 * );
 *
 * ============================================================
 */

function requireSubscriptionPlan(
  ...allowedPlans
) {
  const plans =
    new Set(
      allowedPlans
        .map((plan) =>
          String(plan).toLowerCase()
        )
    );

  return function subscriptionMiddleware(
    req,
    res,
    next
  ) {
    if (
      !isAuthenticated(req)
    ) {
      return sendAuthError(
        res,
        401,
        "AUTHENTICATION_REQUIRED",
        "Authentication is required.",
        req.requestId
      );
    }

    const currentPlan =
      String(
        req.user.subscriptionPlan || ""
      ).toLowerCase();

    if (
      !plans.has(currentPlan)
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: "INSUFFICIENT_SUBSCRIPTION",
          message:
            "Your subscription does not provide access to this feature.",
          requestId:
            req.requestId || null
        }
      });
    }

    return next();
  };
}


/**
 * ============================================================
 * REQUIRE SESSION
 * ============================================================
 *
 * Useful for routes where a login session must exist in the
 * JWT.
 * ============================================================
 */

function requireSession(
  req,
  res,
  next
) {
  if (
    !isAuthenticated(req)
  ) {
    return sendAuthError(
      res,
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
      req.requestId
    );
  }

  if (
    !req.user.sessionId
  ) {
    return sendAuthError(
      res,
      401,
      "SESSION_REQUIRED",
      "A valid user session is required.",
      req.requestId
    );
  }

  return next();
}


/**
 * ============================================================
 * GET CURRENT USER
 * ============================================================
 */

function getCurrentUser(req) {
  return req.user || null;
}


/**
 * ============================================================
 * GET AUTH CONTEXT
 * ============================================================
 */

function getAuthContext(req) {
  return req.auth || {
    authenticated: false
  };
}


/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  auth: requireAuth,

  requireAuth,

  optionalAuth,

  isAuthenticated,

  extractToken,

  verifyAccessToken,

  requireVerifiedUser,

  requireEmailVerification,

  requireSubscription,

  requireSubscriptionPlan,

  requireSession,

  getCurrentUser,

  getAuthContext
};