'use strict';

/**
 * ============================================================
 * GHAR - CORS Configuration
 * ============================================================
 *
 * Central CORS configuration for the GHAR API.
 *
 * Responsibilities:
 * - Control allowed frontend origins
 * - Support local development
 * - Support Render / production frontend
 * - Handle credentials
 * - Handle preflight requests
 * - Reject unauthorized browser origins
 *
 * ============================================================
 */

const cors = require('cors');
const env = require('./env');

/* ============================================================
   1. ALLOWED ORIGINS
   ============================================================ */

const configuredOrigins = Array.isArray(
  env.cors.origin
)
  ? env.cors.origin
  : [];

/*
 * Remove empty values and normalize origins.
 */
const allowedOrigins = [
  ...new Set(
    configuredOrigins
      .map(origin =>
        typeof origin === 'string'
          ? origin.trim().replace(/\/$/, '')
          : ''
      )
      .filter(Boolean)
  )
];

/* ============================================================
   2. DEVELOPMENT ORIGINS
   ============================================================ */

const developmentOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

/* ============================================================
   3. COMBINED ORIGINS
   ============================================================ */

const allAllowedOrigins = [
  ...new Set([
    ...allowedOrigins,

    ...(env.app.environment !== 'production'
      ? developmentOrigins
      : [])
  ])
];

/* ============================================================
   4. ORIGIN VALIDATION
   ============================================================ */

function isOriginAllowed(origin) {
  /*
   * Requests such as:
   *
   * curl
   * server-to-server API requests
   * health checks
   *
   * may not contain an Origin header.
   *
   * They should be allowed.
   */

  if (!origin) {
    return true;
  }

  const normalizedOrigin =
    origin
      .trim()
      .replace(/\/$/, '');

  /*
   * Exact match.
   */

  if (
    allAllowedOrigins.includes(
      normalizedOrigin
    )
  ) {
    return true;
  }

  /*
   * Development-only localhost handling.
   */

  if (
    env.app.environment !== 'production'
  ) {
    try {
      const url =
        new URL(normalizedOrigin);

      if (
        (
          url.hostname === 'localhost' ||
          url.hostname === '127.0.0.1'
        ) &&
        (
          url.protocol === 'http:' ||
          url.protocol === 'https:'
        )
      ) {
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  return false;
}

/* ============================================================
   5. CORS OPTIONS
   ============================================================ */

const corsOptions = {
  origin: function (
    origin,
    callback
  ) {
    if (
      isOriginAllowed(origin)
    ) {
      /*
       * Passing the original origin allows CORS
       * to return the correct Access-Control-Allow-Origin.
       */

      callback(null, origin || true);

      return;
    }

    const error =
      new Error(
        `CORS blocked origin: ${origin}`
      );

    error.statusCode = 403;
    error.code = 'CORS_ORIGIN_NOT_ALLOWED';

    callback(error);
  },

  credentials:
    Boolean(env.cors.credentials),

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],

  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Accept',
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-CSRF-Token',
    'X-API-Key'
  ],

  exposedHeaders: [
    'X-Request-ID',
    'Content-Length',
    'Content-Type'
  ],

  optionsSuccessStatus: 204,

  maxAge:
    env.app.environment === 'production'
      ? 86400
      : 3600
};

/* ============================================================
   6. CORS MIDDLEWARE
   ============================================================ */

const corsMiddleware =
  cors(corsOptions);

/* ============================================================
   7. PREFLIGHT
   ============================================================ */

/*
 * Do not use:
 *
 * app.options('*', ...)
 *
 * because newer path-to-regexp versions can throw:
 *
 * PathError: Missing parameter name at index 1: *
 *
 * The cors middleware itself handles preflight requests.
 */

/* ============================================================
   8. CORS ERROR HANDLER
   ============================================================ */

function corsErrorHandler(
  error,
  req,
  res,
  next
) {
  if (
    error &&
    error.code ===
      'CORS_ORIGIN_NOT_ALLOWED'
  ) {
    return res.status(403).json({
      success: false,
      error: 'CORS origin not allowed',
      code: 'CORS_ORIGIN_NOT_ALLOWED'
    });
  }

  return next(error);
}

/* ============================================================
   9. SECURITY HEADERS
   ============================================================ */

function applyCorsSecurityHeaders(
  req,
  res,
  next
) {
  /*
   * Tell browsers that the API expects the
   * Origin header to be respected.
   */

  res.setHeader(
    'Vary',
    'Origin'
  );

  next();
}

/* ============================================================
   10. SAFE CONFIGURATION
   ============================================================ */

function getCorsConfig() {
  return {
    environment:
      env.app.environment,

    allowedOrigins:
      [...allAllowedOrigins],

    credentials:
      Boolean(env.cors.credentials),

    methods:
      [...corsOptions.methods],

    allowedHeaders:
      [...corsOptions.allowedHeaders],

    exposedHeaders:
      [...corsOptions.exposedHeaders],

    maxAge:
      corsOptions.maxAge
  };
}

/* ============================================================
   11. EXPORT
   ============================================================ */

module.exports = corsMiddleware;

/*
 * Additional exports are available for modules that
 * need direct access to CORS configuration.
 */

module.exports.cors = corsMiddleware;
module.exports.options = corsOptions;
module.exports.isOriginAllowed =
  isOriginAllowed;
module.exports.corsErrorHandler =
  corsErrorHandler;
module.exports.applyCorsSecurityHeaders =
  applyCorsSecurityHeaders;
module.exports.getCorsConfig =
  getCorsConfig;
module.exports.allowedOrigins =
  allAllowedOrigins;