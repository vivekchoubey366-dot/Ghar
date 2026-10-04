"use strict";

const crypto = require("crypto");

/**
 * GHAR Security Middleware
 *
 * Responsibilities:
 * - Security response headers
 * - Basic request hardening
 * - Request sanitization checks
 * - HTTP method restrictions
 * - Suspicious request detection
 * - Content-Type enforcement for API requests
 *
 * NOTE:
 * Authentication, authorization, rate limiting and validation
 * are handled by their dedicated middleware.
 */

const DEFAULT_ALLOWED_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS"
];

const BLOCKED_PATH_PATTERNS = [
  /\.\.\//,
  /\.\.\\/,
  /<script\b/i,
  /javascript:/i,
  /vbscript:/i,
  /data:text\/html/i
];

function createSecurityNonce() {
  return crypto.randomBytes(16).toString("base64");
}

function hasSuspiciousPath(req) {
  const target = [
    req.originalUrl || "",
    req.path || "",
    req.url || ""
  ].join(" ");

  return BLOCKED_PATH_PATTERNS.some(
    (pattern) => pattern.test(target)
  );
}

function setSecurityHeaders(req, res, nonce) {
  res.setHeader(
    "X-Content-Type-Options",
    "nosniff"
  );

  res.setHeader(
    "X-Frame-Options",
    "SAMEORIGIN"
  );

  res.setHeader(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );

  res.setHeader(
    "Permissions-Policy",
    [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=(self)"
    ].join(", ")
  );

  res.setHeader(
    "Cross-Origin-Opener-Policy",
    "same-origin"
  );

  res.setHeader(
    "Cross-Origin-Resource-Policy",
    "same-site"
  );

  /*
   * HSTS should normally be enabled only when the
   * application is served entirely over HTTPS.
   */
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_HSTS === "true"
  ) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  /*
   * Nonce is made available to templates or downstream
   * application code if CSP is enabled at the server layer.
   */
  res.locals.cspNonce = nonce;
}

function securityMiddleware(options = {}) {
  const allowedMethods =
    options.allowedMethods ||
    DEFAULT_ALLOWED_METHODS;

  return (req, res, next) => {
    const nonce = createSecurityNonce();

    setSecurityHeaders(
      req,
      res,
      nonce
    );

    /*
     * Reject unsupported HTTP methods.
     */
    if (
      !allowedMethods.includes(
        req.method
      )
    ) {
      return res.status(405).json({
        success: false,
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "HTTP method is not allowed.",
          requestId: req.requestId || null
        }
      });
    }

    /*
     * Reject obvious path traversal / script payloads
     * at the URL level.
     */
    if (hasSuspiciousPath(req)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REQUEST_PATH",
          message: "The request path is invalid.",
          requestId: req.requestId || null
        }
      });
    }

    /*
     * API requests with a body should generally declare
     * their content type.
     */
    if (
      req.path.startsWith("/api/") &&
      ["POST", "PUT", "PATCH"].includes(req.method) &&
      req.body &&
      Object.keys(req.body).length > 0
    ) {
      const contentType =
        req.get("content-type") || "";

      const validContentType =
        contentType.includes(
          "application/json"
        ) ||
        contentType.includes(
          "multipart/form-data"
        ) ||
        contentType.includes(
          "application/x-www-form-urlencoded"
        );

      if (!validContentType) {
        return res.status(415).json({
          success: false,
          error: {
            code: "UNSUPPORTED_MEDIA_TYPE",
            message:
              "Unsupported request content type.",
            requestId:
              req.requestId || null
          }
        });
      }
    }

    next();
  };
}

module.exports = {
  securityMiddleware,
  createSecurityNonce
};