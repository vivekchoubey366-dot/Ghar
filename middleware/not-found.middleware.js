"use strict";

/**
 * ============================================================
 * GHAR - NOT FOUND MIDDLEWARE
 * ============================================================
 *
 * Purpose:
 * - Handle requests that do not match any registered route
 * - Return a consistent GHAR API error response
 * - Include requestId for debugging/tracing
 *
 * IMPORTANT:
 * Register this AFTER all routes and BEFORE error.middleware.js.
 *
 * ============================================================
 */


/**
 * ------------------------------------------------------------
 * Not Found Handler
 * ------------------------------------------------------------
 */

function notFoundHandler(req, res) {
  const requestId =
    req.requestId || null;

  const method =
    req.method || "UNKNOWN";

  const path =
    req.originalUrl ||
    req.url ||
    "/";


  return res.status(404).json({
    success: false,

    error: {
      code: "ROUTE_NOT_FOUND",

      message:
        `Route ${method} ${path} was not found.`,

      requestId
    }
  });
}


/**
 * ------------------------------------------------------------
 * Export
 * ------------------------------------------------------------
 */

module.exports = {
  notFoundHandler,

  // Compatibility alias
  notFound: notFoundHandler
};