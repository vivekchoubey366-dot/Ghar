"use strict";

/**
 * ============================================================
 * GHAR - REQUEST ID MIDDLEWARE
 * ============================================================
 *
 * Responsibilities:
 * - Generate a unique ID for every incoming request
 * - Reuse a valid incoming request ID when appropriate
 * - Attach the ID to req.requestId
 * - Return the ID in the X-Request-Id response header
 * - Make the ID available to logging/error middleware
 *
 * Used by:
 * - error.middleware.js
 * - not-found.middleware.js
 * - audit.middleware.js
 * - application logs
 * - controllers/services when tracing requests
 *
 * ============================================================
 */

const crypto = require("crypto");


/**
 * ------------------------------------------------------------
 * Configuration
 * ------------------------------------------------------------
 */

const REQUEST_ID_HEADER =
  "X-Request-Id";

const MAX_REQUEST_ID_LENGTH =
  128;


/**
 * ------------------------------------------------------------
 * Generate request ID
 * ------------------------------------------------------------
 *
 * Node.js crypto.randomUUID() produces a UUID v4.
 *
 * Example:
 *
 * 8d9d8c9d-9e2c-4d75-a1d8-0f6b6f1a4f52
 *
 * ------------------------------------------------------------
 */

function generateRequestId() {
  if (
    typeof crypto.randomUUID ===
    "function"
  ) {
    return crypto.randomUUID();
  }

  /**
   * Fallback for environments where randomUUID()
   * is unavailable.
   */

  return [
    Date.now().toString(36),

    crypto
      .randomBytes(16)
      .toString("hex")
  ].join("-");
}


/**
 * ------------------------------------------------------------
 * Validate incoming request ID
 * ------------------------------------------------------------
 *
 * We accept an existing request ID only if it is:
 *
 * - non-empty
 * - reasonably short
 * - composed of safe characters
 *
 * This prevents arbitrary header values from becoming part of
 * application logs.
 *
 * ------------------------------------------------------------
 */

function isValidRequestId(
  value
) {
  if (
    typeof value !== "string"
  ) {
    return false;
  }

  const requestId =
    value.trim();

  if (
    !requestId
  ) {
    return false;
  }

  if (
    requestId.length >
    MAX_REQUEST_ID_LENGTH
  ) {
    return false;
  }

  /**
   * UUIDs and common distributed tracing IDs.
   *
   * Allowed:
   * - letters
   * - numbers
   * - hyphen
   * - underscore
   * - period
   */

  return /^[A-Za-z0-9._-]+$/.test(
    requestId
  );
}


/**
 * ------------------------------------------------------------
 * Get incoming request ID
 * ------------------------------------------------------------
 */

function getIncomingRequestId(
  req
) {
  const value =
    req.get(
      REQUEST_ID_HEADER
    );

  if (
    !value
  ) {
    return null;
  }

  const requestId =
    value.trim();

  if (
    !isValidRequestId(
      requestId
    )
  ) {
    return null;
  }

  return requestId;
}


/**
 * ------------------------------------------------------------
 * Main request ID middleware
 * ------------------------------------------------------------
 */

function requestId(
  req,
  res,
  next
) {
  const incomingId =
    getIncomingRequestId(
      req
    );

  /**
   * Reuse a valid upstream request ID.
   *
   * This is useful when GHAR sits behind:
   *
   * CDN
   * ↓
   * Load balancer
   * ↓
   * Render
   * ↓
   * GHAR
   */

  const requestId =
    incomingId ||
    generateRequestId();


  /**
   * Attach to request.
   */

  req.requestId =
    requestId;


  /**
   * Return it to the client.
   */

  res.set(
    REQUEST_ID_HEADER,
    requestId
  );


  /**
   * Also expose it through a convenient alias.
   */

  req.id =
    requestId;


  return next();
}


/**
 * ------------------------------------------------------------
 * Strict request ID middleware
 * ------------------------------------------------------------
 *
 * Optional version.
 *
 * If a client supplies an invalid X-Request-Id, reject it
 * instead of silently generating a new one.
 *
 * Normally the regular `requestId` middleware is preferred.
 * ------------------------------------------------------------
 */

function strictRequestId(
  req,
  res,
  next
) {
  const incomingId =
    req.get(
      REQUEST_ID_HEADER
    );

  if (
    incomingId &&
    !isValidRequestId(
      incomingId.trim()
    )
  ) {
    return res.status(400).json({
      success: false,

      error: {
        code:
          "INVALID_REQUEST_ID",

        message:
          "The supplied X-Request-Id is invalid.",

        requestId:
          null
      }
    });
  }

  return requestId(
    req,
    res,
    next
  );
}


/**
 * ------------------------------------------------------------
 * Get request ID
 * ------------------------------------------------------------
 *
 * Useful from controllers/services.
 * ------------------------------------------------------------
 */

function getRequestId(
  req
) {
  return (
    req?.requestId ||
    req?.id ||
    null
  );
}


/**
 * ------------------------------------------------------------
 * Set request ID manually
 * ------------------------------------------------------------
 *
 * Useful for internal jobs/tests.
 * ------------------------------------------------------------
 */

function setRequestId(
  req,
  res,
  value
) {
  const requestId =
    isValidRequestId(
      value
    )
      ? value.trim()
      : generateRequestId();

  req.requestId =
    requestId;

  req.id =
    requestId;

  if (
    res &&
    typeof res.set ===
      "function"
  ) {
    res.set(
      REQUEST_ID_HEADER,
      requestId
    );
  }

  return requestId;
}


/**
 * ------------------------------------------------------------
 * Exports
 * ------------------------------------------------------------
 */

module.exports = {
  requestId,

  strictRequestId,

  generateRequestId,

  getRequestId,

  setRequestId,

  isValidRequestId,

  REQUEST_ID_HEADER
};