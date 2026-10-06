"use strict";

/**
 * ============================================================
 * GHAR - SECURITY MIDDLEWARE
 * ============================================================
 *
 * Responsibilities:
 * - Apply HTTP security headers
 * - Protect against common browser-based attacks
 * - Prevent clickjacking
 * - Prevent MIME sniffing
 * - Configure Content Security Policy
 * - Control referrer information
 * - Apply HSTS in production
 * - Disable unnecessary technology disclosure
 * - Validate basic request characteristics
 * - Reject suspiciously large headers
 *
 * NOTE:
 * This middleware complements config/security.js.
 *
 * config/security.js
 *     → security configuration
 *
 * middleware/security.middleware.js
 *     → applies security controls to requests
 *
 * ============================================================
 */

const crypto = require("crypto");


/**
 * ------------------------------------------------------------
 * Configuration
 * ------------------------------------------------------------
 */

const NODE_ENV =
  process.env.NODE_ENV || "development";

const IS_PRODUCTION =
  NODE_ENV === "production";

const SECURITY_CONFIG =
  Object.freeze({
    maxHeaderBytes:
      Number(
        process.env.SECURITY_MAX_HEADER_BYTES ||
        32768
      ),

    hstsMaxAge:
      Number(
        process.env.SECURITY_HSTS_MAX_AGE ||
        31536000
      ),

    hstsSubdomains:
      process.env.SECURITY_HSTS_SUBDOMAINS !==
      "false",

    hstsPreload:
      process.env.SECURITY_HSTS_PRELOAD ===
      "true",

    enableCsp:
      process.env.SECURITY_ENABLE_CSP !==
      "false",

    enableHsts:
      process.env.SECURITY_ENABLE_HSTS !==
      "false"
  });


/**
 * ============================================================
 * CONTENT SECURITY POLICY
 * ============================================================
 *
 * Keep this deliberately restrictive.
 *
 * If your frontend requires additional external resources,
 * add only the exact domains required by the application.
 *
 * ============================================================
 */

function buildContentSecurityPolicy(
  options = {}
) {
  const directives = {
    defaultSrc: [
      "'self'"
    ],

    baseUri: [
      "'self'"
    ],

    objectSrc: [
      "'none'"
    ],

    frameAncestors: [
      "'none'"
    ],

    formAction: [
      "'self'"
    ],

    scriptSrc: [
      "'self'"
    ],

    styleSrc: [
      "'self'",
      "'unsafe-inline'"
    ],

    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https:"
    ],

    fontSrc: [
      "'self'",
      "data:",
      "https:"
    ],

    connectSrc: [
      "'self'",
      "https:"
    ],

    mediaSrc: [
      "'self'",
      "https:",
      "blob:"
    ],

    frameSrc: [
      "'self'",
      "https:"
    ],

    workerSrc: [
      "'self'",
      "blob:"
    ],

    manifestSrc: [
      "'self'"
    ],

    ...options
  };

  return Object.entries(
    directives
  )
    .map(
      ([directive, sources]) => {
        if (
          !Array.isArray(
            sources
          )
        ) {
          return directive;
        }

        return [
          directive,
          ...sources
        ].join(" ");
      }
    )
    .join("; ");
}


/**
 * ============================================================
 * NONCE GENERATOR
 * ============================================================
 *
 * Useful when the frontend needs controlled inline scripts.
 *
 * The generated nonce is available as:
 *
 * req.securityNonce
 *
 * ============================================================
 */

function generateNonce() {
  return crypto
    .randomBytes(16)
    .toString("base64");
}


/**
 * ============================================================
 * SECURITY HEADERS
 * ============================================================
 */

function applySecurityHeaders(
  req,
  res
) {
  /**
   * Prevent MIME-type sniffing.
   */

  res.set(
    "X-Content-Type-Options",
    "nosniff"
  );


  /**
   * Prevent legacy browser information leakage.
   */

  res.set(
    "X-Download-Options",
    "noopen"
  );


  /**
   * Prevent clickjacking.
   */

  res.set(
    "X-Frame-Options",
    "DENY"
  );


  /**
   * Referrer policy.
   */

  res.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );


  /**
   * Restrict browser capabilities.
   */

  res.set(
    "Permissions-Policy",
    [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=(self)",
      "usb=()",
      "bluetooth=()",
      "serial=()"
    ].join(", ")
  );


  /**
   * Prevent cross-domain policy files.
   */

  res.set(
    "X-Permitted-Cross-Domain-Policies",
    "none"
  );


  /**
   * Cross-Origin Resource Policy.
   *
   * Same-origin is the safest default for GHAR.
   */

  res.set(
    "Cross-Origin-Resource-Policy",
    "same-origin"
  );


  /**
   * Cross-Origin Opener Policy.
   */

  res.set(
    "Cross-Origin-Opener-Policy",
    "same-origin"
  );


  /**
   * HSTS should only be enabled over HTTPS.
   */

  if (
    IS_PRODUCTION &&
    SECURITY_CONFIG.enableHsts
  ) {
    let value =
      `max-age=${SECURITY_CONFIG.hstsMaxAge}`;

    if (
      SECURITY_CONFIG.hstsSubdomains
    ) {
      value +=
        "; includeSubDomains";
    }

    if (
      SECURITY_CONFIG.hstsPreload
    ) {
      value +=
        "; preload";
    }

    res.set(
      "Strict-Transport-Security",
      value
    );
  }


  /**
   * Content Security Policy.
   */

  if (
    SECURITY_CONFIG.enableCsp
  ) {
    const nonce =
      generateNonce();

    req.securityNonce =
      nonce;

    const csp =
      buildContentSecurityPolicy({
        scriptSrc: [
          "'self'",
          `'nonce-${nonce}'`
        ]
      });

    res.set(
      "Content-Security-Policy",
      csp
    );
  }


  /**
   * Remove Express fingerprinting.
   */

  res.removeHeader(
    "X-Powered-By"
  );
}


/**
 * ============================================================
 * REQUEST SIZE / HEADER VALIDATION
 * ============================================================
 *
 * Express/body-parser should also have explicit body limits.
 * This middleware focuses on headers.
 *
 * ============================================================
 */

function validateRequestHeaders(
  req,
  res,
  next
) {
  let totalBytes = 0;

  for (
    const [
      name,
      value
    ] of Object.entries(
      req.headers || {}
    )
  ) {
    totalBytes +=
      Buffer.byteLength(
        String(name),
        "utf8"
      );

    totalBytes +=
      Buffer.byteLength(
        String(value),
        "utf8"
      );
  }

  if (
    totalBytes >
    SECURITY_CONFIG.maxHeaderBytes
  ) {
    return res.status(431).json({
      success: false,

      error: {
        code:
          "REQUEST_HEADERS_TOO_LARGE",

        message:
          "Request headers are too large.",

        requestId:
          req.requestId || null
      }
    });
  }

  return next();
}


/**
 * ============================================================
 * HTTP METHOD VALIDATION
 * ============================================================
 */

function validateHttpMethod(
  allowedMethods
) {
  const methods =
    Array.isArray(
      allowedMethods
    )
      ? allowedMethods.map(
          method =>
            String(
              method
            ).toUpperCase()
        )
      : null;

  return function methodMiddleware(
    req,
    res,
    next
  ) {
    if (
      methods &&
      !methods.includes(
        req.method.toUpperCase()
      )
    ) {
      res.set(
        "Allow",
        methods.join(", ")
      );

      return res.status(405).json({
        success: false,

        error: {
          code:
            "METHOD_NOT_ALLOWED",

          message:
            `HTTP method ${req.method} is not allowed.`,

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
 * BLOCK SUSPICIOUS PATHS
 * ============================================================
 *
 * This is deliberately conservative.
 *
 * Do NOT implement aggressive regex-based "hack detection"
 * here because legitimate URLs, search queries, property names,
 * and encoded data can trigger false positives.
 *
 * ============================================================
 */

function blockSuspiciousPaths(
  req,
  res,
  next
) {
  const path =
    String(
      req.path ||
      ""
    );

  /**
   * Reject null bytes.
   */

  if (
    path.includes(
      "\0"
    )
  ) {
    return res.status(400).json({
      success: false,

      error: {
        code:
          "INVALID_REQUEST_PATH",

        message:
          "The request path is invalid.",

        requestId:
          req.requestId || null
      }
    });
  }

  return next();
}


/**
 * ============================================================
 * SECURE COOKIE OPTIONS
 * ============================================================
 *
 * Use this when setting authentication/session cookies.
 *
 * Example:
 *
 * res.cookie(
 *   "ghar_session",
 *   token,
 *   secureCookieOptions()
 * );
 *
 * ============================================================
 */

function secureCookieOptions(
  options = {}
) {
  return {
    httpOnly:
      true,

    secure:
      IS_PRODUCTION,

    sameSite:
      "lax",

    path:
      "/",

    ...options
  };
}


/**
 * ============================================================
 * SECURITY MIDDLEWARE
 * ============================================================
 *
 * Main middleware used by server.js.
 *
 * ============================================================
 */

function securityMiddleware(
  req,
  res,
  next
) {
  applySecurityHeaders(
    req,
    res
  );

  return next();
}


/**
 * ============================================================
 * STRICT SECURITY STACK
 * ============================================================
 *
 * Use this if you want one middleware to apply the complete
 * request-level security stack.
 *
 * ============================================================
 */

function strictSecurityMiddleware(
  req,
  res,
  next
) {
  applySecurityHeaders(
    req,
    res
  );

  return validateRequestHeaders(
    req,
    res,
    () =>
      blockSuspiciousPaths(
        req,
        res,
        next
      )
  );
}


/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  SECURITY_CONFIG,

  securityMiddleware,

  strictSecurityMiddleware,

  applySecurityHeaders,

  buildContentSecurityPolicy,

  generateNonce,

  validateRequestHeaders,

  validateHttpMethod,

  blockSuspiciousPaths,

  secureCookieOptions
};