"use strict";

/**
 * ============================================================
 * GHAR - CORS CONFIGURATION
 * ============================================================
 *
 * Centralized Cross-Origin Resource Sharing configuration.
 *
 * Responsibilities:
 * - Parse ALLOWED_ORIGINS from environment
 * - Support multiple frontend origins
 * - Support development localhost origins
 * - Support production restrictions
 * - Protect credentialed requests
 * - Handle preflight requests
 * - Prevent accidental wildcard + credentials configuration
 * - Expose origin validation for testing
 *
 * Environment:
 *
 * ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
 *
 * Production example:
 *
 * ALLOWED_ORIGINS=https://ghar.example.com,https://www.ghar.example.com
 * ============================================================
 */

const cors = require("cors");
const env = require("./env");

/* ------------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------------ */

function normalizeOrigin(origin) {
  if (!origin) {
    return "";
  }

  return String(origin)
    .trim()
    .replace(/\/+$/, "");
}

function parseOrigins(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
}

/* ------------------------------------------------------------
 * CONFIGURED ORIGINS
 * ------------------------------------------------------------ */

const configuredOrigins = parseOrigins(
  process.env.ALLOWED_ORIGINS ||
    env.allowedOrigins ||
    env.corsOrigin ||
    ""
);

/* ------------------------------------------------------------
 * DEVELOPMENT ORIGINS
 * ------------------------------------------------------------ */

const developmentOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000"
];

/* ------------------------------------------------------------
 * PRODUCTION ORIGINS
 * ------------------------------------------------------------ */

const productionOrigins = configuredOrigins;

/* ------------------------------------------------------------
 * FINAL ORIGIN LIST
 * ------------------------------------------------------------ */

const isProduction =
  String(env.nodeEnv || process.env.NODE_ENV || "development")
    .toLowerCase() === "production";

const allowedOrigins = isProduction
  ? productionOrigins
  : [
      ...new Set([
        ...developmentOrigins,
        ...configuredOrigins
      ])
    ];

/* ------------------------------------------------------------
 * WILDCARD DETECTION
 * ------------------------------------------------------------ */

const wildcardConfigured =
  allowedOrigins.includes("*");

/*
 * Credentials cannot safely be combined with:
 *
 * Access-Control-Allow-Origin: *
 *
 * Therefore GHAR rejects wildcard CORS when credentials
 * are enabled.
 */

if (wildcardConfigured && env.credentials !== false) {
  throw new Error(
    "[GHAR CORS] Wildcard origin (*) cannot be used with credentialed requests."
  );
}

/* ------------------------------------------------------------
 * ORIGIN VALIDATION
 * ------------------------------------------------------------ */

function isAllowedOrigin(origin) {
  /*
   * Requests such as:
   *
   * curl
   * server-to-server requests
   * health checks
   *
   * may not contain an Origin header.
   */

  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  /*
   * Explicit wildcard support only when credentials
   * are disabled.
   */

  if (
    wildcardConfigured &&
    env.credentials === false
  ) {
    return true;
  }

  return allowedOrigins.includes(normalizedOrigin);
}

/* ------------------------------------------------------------
 * CORS ERROR
 * ------------------------------------------------------------ */

function createCorsError(origin) {
  const error = new Error(
    `CORS policy blocked origin: ${origin}`
  );

  error.code = "CORS_ORIGIN_NOT_ALLOWED";
  error.statusCode = 403;

  return error;
}

/* ------------------------------------------------------------
 * CORS OPTIONS
 * ------------------------------------------------------------ */

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(
      createCorsError(origin)
    );
  },

  /*
   * Cookies / Authorization credentials.
   */

  credentials:
    env.credentials !== false,

  /*
   * HTTP methods supported by GHAR API.
   */

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS"
  ],

  /*
   * Request headers accepted by the API.
   */

  allowedHeaders: [
    "Origin",
    "Accept",
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Request-ID",
    "X-CSRF-Token",
    "Cache-Control",
    "Pragma"
  ],

  /*
   * Headers that browser JavaScript is allowed
   * to read from API responses.
   */

  exposedHeaders: [
    "X-Request-ID",
    "Content-Length",
    "Content-Type"
  ],

  /*
   * Browser preflight response.
   */

  optionsSuccessStatus: 204,

  /*
   * Cache preflight responses for 24 hours.
   */

  maxAge:
    Number(process.env.CORS_MAX_AGE) ||
    86400,

  /*
   * Prevent unnecessary CORS processing for
   * successful simple requests.
   */

  preflightContinue: false
};

/* ------------------------------------------------------------
 * CORS MIDDLEWARE
 * ------------------------------------------------------------ */

const corsMiddleware = cors(corsOptions);

/* ------------------------------------------------------------
 * DEVELOPMENT DEBUGGING
 * ------------------------------------------------------------ */

function getCorsInfo() {
  return {
    environment: env.nodeEnv,

    credentials:
      corsOptions.credentials,

    allowedOrigins: [
      ...allowedOrigins
    ],

    wildcard:
      wildcardConfigured,

    methods: [
      ...corsOptions.methods
    ],

    maxAge:
      corsOptions.maxAge
  };
}

/* ------------------------------------------------------------
 * VALIDATION
 * ------------------------------------------------------------ */

function validateCorsConfiguration() {
  /*
   * Production should have an explicit allowlist.
   */

  if (
    isProduction &&
    allowedOrigins.length === 0
  ) {
    throw new Error(
      "[GHAR CORS] No ALLOWED_ORIGINS configured for production."
    );
  }

  /*
   * Validate origin formatting.
   */

  for (const origin of allowedOrigins) {
    if (
      origin !== "*" &&
      !/^https?:\/\//i.test(origin)
    ) {
      throw new Error(
        `[GHAR CORS] Invalid origin: ${origin}`
      );
    }
  }
}

validateCorsConfiguration();

/* ------------------------------------------------------------
 * EXPORTS
 * ------------------------------------------------------------ */

module.exports = {
  corsOptions,
  corsMiddleware,
  allowedOrigins,
  isAllowedOrigin,
  getCorsInfo,
  validateCorsConfiguration
};