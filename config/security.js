"use strict";

/**
 * ============================================================
 * GHAR
 * Security Configuration
 * ============================================================
 *
 * Central security configuration for the GHAR application.
 *
 * Responsibilities:
 * - HTTP security headers
 * - Helmet configuration
 * - Content Security Policy
 * - HSTS
 * - Clickjacking protection
 * - MIME sniffing protection
 * - Referrer policy
 * - Permissions policy
 * - Request/body limits
 * - Trusted proxy configuration
 * - Authentication security settings
 * - Cookie security
 * - Password policy
 * - OTP security
 * - CSRF configuration
 * - Production security validation
 *
 * IMPORTANT:
 * Secrets are NEVER stored in this file.
 * Secrets must come from .env through config/env.js.
 * ============================================================
 */

const helmet = require("helmet");
const env = require("./env");

/* ============================================================
 * ENVIRONMENT
 * ============================================================
 */

const isProduction =
  env.nodeEnv === "production";

const isDevelopment =
  env.nodeEnv === "development";

const isTest =
  env.nodeEnv === "test";

/* ============================================================
 * TRUST PROXY
 * ============================================================
 *
 * Required when GHAR is behind:
 *
 * - Nginx
 * - Cloudflare
 * - Render
 * - Railway
 * - AWS
 * - Load balancer
 *
 * TRUST_PROXY=1 is recommended for a single reverse proxy.
 */

const trustProxy = Number(
  process.env.TRUST_PROXY || 0
);

/* ============================================================
 * SECURITY CONFIGURATION
 * ============================================================
 */

const securityConfig = {
  environment: {
    production: isProduction,
    development: isDevelopment,
    test: isTest,

    trustProxy
  },

  /* ----------------------------------------------------------
   * HTTP SECURITY HEADERS
   * ---------------------------------------------------------- */

  helmet: {
    enabled: true,

    contentSecurityPolicy: {
      enabled:
        process.env.CSP_ENABLED !== "false",

      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: [
          "'self'",
          ...(isDevelopment
            ? ["'unsafe-inline'"]
            : [])
        ],

        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],

        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "data:"
        ],

        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:"
        ],

        connectSrc: [
          "'self'",
          ...(isDevelopment
            ? [
                "http://localhost:*",
                "ws://localhost:*",
                "http://127.0.0.1:*",
                "ws://127.0.0.1:*"
              ]
            : [])
        ],

        mediaSrc: [
          "'self'",
          "blob:",
          "https:"
        ],

        objectSrc: [
          "'none'"
        ],

        frameSrc: [
          "'self'"
        ],

        frameAncestors: [
          "'self'"
        ],

        baseUri: [
          "'self'"
        ],

        formAction: [
          "'self'"
        ],

        workerSrc: [
          "'self'",
          "blob:"
        ]
      }
    },

    crossOriginEmbedderPolicy:
      process.env.CROSS_ORIGIN_EMBEDDER_POLICY ===
      "true",

    crossOriginOpenerPolicy: {
      policy:
        process.env.CROSS_ORIGIN_OPENER_POLICY ||
        "same-origin-allow-popups"
    },

    crossOriginResourcePolicy: {
      policy:
        process.env.CROSS_ORIGIN_RESOURCE_POLICY ||
        "cross-origin"
    },

    dnsPrefetchControl: {
      allow: false
    },

    frameguard: {
      action: "deny"
    },

    hidePoweredBy: true,

    hsts: {
      enabled:
        process.env.HSTS_ENABLED !== "false",

      maxAge:
        Number(process.env.HSTS_MAX_AGE) ||
        31536000,

      includeSubDomains: true,

      preload:
        process.env.HSTS_PRELOAD === "true"
    },

    ieNoOpen: true,

    noSniff: true,

    originAgentCluster: true,

    permittedCrossDomainPolicies: {
      permittedPolicies: "none"
    },

    referrerPolicy: {
      policy:
        process.env.REFERRER_POLICY ||
        "strict-origin-when-cross-origin"
    },

    xssFilter: false
  },

  /* ----------------------------------------------------------
   * REQUEST LIMITS
   * ---------------------------------------------------------- */

  request: {
    jsonLimit:
      process.env.JSON_BODY_LIMIT ||
      "5mb",

    urlEncodedLimit:
      process.env.URLENCODED_BODY_LIMIT ||
      "5mb",

    parameterLimit:
      Number(process.env.PARAMETER_LIMIT) ||
      100,

    maxHeaderSize:
      Number(process.env.MAX_HEADER_SIZE) ||
      16384
  },

  /* ----------------------------------------------------------
   * AUTHENTICATION
   * ---------------------------------------------------------- */

  authentication: {
    jwt: {
      algorithm:
        process.env.JWT_ALGORITHM ||
        "HS256",

      expiresIn:
        env.jwtExpiresIn || "7d",

      issuer:
        process.env.JWT_ISSUER ||
        "GHAR",

      audience:
        process.env.JWT_AUDIENCE ||
        "GHAR_CLIENT"
    },

    session: {
      enabled:
        process.env.SESSION_ENABLED !== "false",

      cookieName:
        process.env.SESSION_COOKIE_NAME ||
        "ghar.sid",

      httpOnly: true,

      secure:
        isProduction,

      sameSite:
        process.env.SESSION_SAME_SITE ||
        "lax",

      maxAge:
        Number(process.env.SESSION_MAX_AGE) ||
        7 * 24 * 60 * 60 * 1000
    },

    password: {
      minimumLength:
        Number(
          process.env.PASSWORD_MIN_LENGTH
        ) || 8,

      maximumLength:
        Number(
          process.env.PASSWORD_MAX_LENGTH
        ) || 128,

      bcryptRounds:
        Number(
          process.env.BCRYPT_ROUNDS
        ) || 12,

      requireUppercase:
        process.env.PASSWORD_REQUIRE_UPPERCASE !==
        "false",

      requireLowercase:
        process.env.PASSWORD_REQUIRE_LOWERCASE !==
        "false",

      requireNumber:
        process.env.PASSWORD_REQUIRE_NUMBER !==
        "false",

      requireSpecialCharacter:
        process.env.PASSWORD_REQUIRE_SPECIAL !==
        "false"
    }
  },

  /* ----------------------------------------------------------
   * OTP SECURITY
   * ---------------------------------------------------------- */

  otp: {
    enabled:
      process.env.OTP_ENABLED !== "false",

    expiresMinutes:
      Number(
        process.env.OTP_EXPIRES_MINUTES
      ) || 10,

    length:
      Number(
        process.env.OTP_LENGTH
      ) || 6,

    maximumAttempts:
      Number(
        process.env.OTP_MAX_ATTEMPTS
      ) || 5,

    resendCooldownSeconds:
      Number(
        process.env.OTP_RESEND_COOLDOWN
      ) || 60,

    hashBeforeStorage: true,

    invalidateAfterVerification: true
  },

  /* ----------------------------------------------------------
   * CSRF
   * ----------------------------------------------------------
   *
   * GHAR uses JWT Authorization headers for API
   * authentication. CSRF protection is primarily
   * required when authentication credentials are
   * automatically attached by the browser, such as
   * cookies.
   */

  csrf: {
    enabled:
      process.env.CSRF_ENABLED !== "false",

    headerName:
      process.env.CSRF_HEADER_NAME ||
      "X-CSRF-Token",

    cookieName:
      process.env.CSRF_COOKIE_NAME ||
      "ghar.csrf",

    cookieHttpOnly: false,

    cookieSecure:
      isProduction,

    sameSite:
      process.env.CSRF_SAME_SITE ||
      "lax",

    ignoredMethods: [
      "GET",
      "HEAD",
      "OPTIONS"
    ]
  },

  /* ----------------------------------------------------------
   * COOKIES
   * ---------------------------------------------------------- */

  cookies: {
    secure:
      isProduction,

    httpOnly: true,

    sameSite:
      process.env.COOKIE_SAME_SITE ||
      "lax",

    path: "/"
  },

  /* ----------------------------------------------------------
   * PASSWORD RESET
   * ---------------------------------------------------------- */

  passwordReset: {
    tokenExpiryMinutes:
      Number(
        process.env.PASSWORD_RESET_EXPIRY_MINUTES
      ) || 30,

    maximumAttempts:
      Number(
        process.env.PASSWORD_RESET_MAX_ATTEMPTS
      ) || 5,

    invalidateAfterUse: true
  },

  /* ----------------------------------------------------------
   * RATE LIMITING
   * ---------------------------------------------------------- */

  rateLimit: {
    enabled:
      process.env.RATE_LIMIT_ENABLED !==
      "false",

    windowMs:
      Number(
        process.env.RATE_LIMIT_WINDOW_MS
      ) || 15 * 60 * 1000,

    max:
      Number(
        process.env.RATE_LIMIT_MAX
      ) || 100,

    authMax:
      Number(
        process.env.AUTH_RATE_LIMIT_MAX
      ) || 10,

    aiMax:
      Number(
        process.env.AI_REQUESTS_PER_MINUTE
      ) || 30,

    paymentMax:
      Number(
        process.env.PAYMENT_RATE_LIMIT_MAX
      ) || 30,

    uploadMax:
      Number(
        process.env.UPLOAD_RATE_LIMIT_MAX
      ) || 20,

    standardMessage:
      "Too many requests. Please try again later."
  },

  /* ----------------------------------------------------------
   * FILE SECURITY
   * ---------------------------------------------------------- */

  uploads: {
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",

      "application/pdf",

      "video/mp4",
      "video/webm"
    ],

    allowedExtensions: [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".avif",
      ".pdf",
      ".mp4",
      ".webm"
    ],

    blockExecutableFiles: true,

    blockDoubleExtensions: true,

    sanitizeFileNames: true,

    preserveOriginalName:
      false,

    maxFileSize:
      Number(
        process.env.UPLOAD_MAX_SIZE
      ) || 10 * 1024 * 1024
  },

  /* ----------------------------------------------------------
   * API SECURITY
   * ---------------------------------------------------------- */

  api: {
    requireRequestId:
      process.env.REQUIRE_REQUEST_ID !==
      "false",

    requestIdHeader:
      "X-Request-ID",

    authorizationHeader:
      "Authorization",

    bearerPrefix:
      "Bearer",

    rejectMalformedAuthorization:
      true,

    preventParameterPollution:
      true
  },

  /* ----------------------------------------------------------
   * LOGGING
   * ---------------------------------------------------------- */

  logging: {
    logSecurityEvents: true,

    logAuthenticationFailures: true,

    logAuthorizationFailures: true,

    logRateLimitViolations: true,

    logCORSFailures: true,

    logSensitiveData: false,

    redactTokens: true,

    redactPasswords: true,

    redactCookies: true,

    redactAuthorizationHeaders: true
  },

  /* ----------------------------------------------------------
   * SECURITY FEATURES
   * ---------------------------------------------------------- */

  features: {
    preventUserEnumeration: true,

    preventTimingAttacks: true,

    sanitizeInput: true,

    validateInput: true,

    sanitizeHTML: true,

    preventSQLInjection: true,

    preventXSS: true,

    preventClickjacking: true,

    preventMimeSniffing: true,

    secureHeaders: true,

    secureCookies:
      isProduction,

    auditSecurityEvents: true
  }
};

/* ============================================================
 * HELMET MIDDLEWARE
 * ============================================================
 */

function createHelmetMiddleware() {
  if (!securityConfig.helmet.enabled) {
    return (_req, _res, next) => next();
  }

  const directives =
    securityConfig.helmet
      .contentSecurityPolicy
      .directives;

  return helmet({
    contentSecurityPolicy:
      securityConfig.helmet
        .contentSecurityPolicy.enabled
        ? {
            directives
          }
        : false,

    crossOriginEmbedderPolicy:
      securityConfig.helmet
        .crossOriginEmbedderPolicy,

    crossOriginOpenerPolicy:
      securityConfig.helmet
        .crossOriginOpenerPolicy,

    crossOriginResourcePolicy:
      securityConfig.helmet
        .crossOriginResourcePolicy,

    dnsPrefetchControl:
      securityConfig.helmet
        .dnsPrefetchControl,

    frameguard:
      securityConfig.helmet.frameguard,

    hidePoweredBy:
      securityConfig.helmet.hidePoweredBy,

    hsts:
      securityConfig.helmet.hsts.enabled
        ? {
            maxAge:
              securityConfig.helmet.hsts.maxAge,

            includeSubDomains:
              securityConfig.helmet.hsts
                .includeSubDomains,

            preload:
              securityConfig.helmet.hsts.preload
          }
        : false,

    ieNoOpen:
      securityConfig.helmet.ieNoOpen,

    noSniff:
      securityConfig.helmet.noSniff,

    originAgentCluster:
      securityConfig.helmet
        .originAgentCluster,

    permittedCrossDomainPolicies:
      securityConfig.helmet
        .permittedCrossDomainPolicies,

    referrerPolicy:
      securityConfig.helmet.referrerPolicy
  });
}

/* ============================================================
 * PASSWORD VALIDATION
 * ============================================================
 */

function validatePassword(password) {
  if (
    typeof password !== "string"
  ) {
    return {
      valid: false,
      errors: [
        "Password must be a string."
      ]
    };
  }

  const errors = [];

  const policy =
    securityConfig.authentication.password;

  if (
    password.length <
    policy.minimumLength
  ) {
    errors.push(
      `Password must contain at least ${policy.minimumLength} characters.`
    );
  }

  if (
    password.length >
    policy.maximumLength
  ) {
    errors.push(
      `Password cannot exceed ${policy.maximumLength} characters.`
    );
  }

  if (
    policy.requireUppercase &&
    !/[A-Z]/.test(password)
  ) {
    errors.push(
      "Password must contain an uppercase letter."
    );
  }

  if (
    policy.requireLowercase &&
    !/[a-z]/.test(password)
  ) {
    errors.push(
      "Password must contain a lowercase letter."
    );
  }

  if (
    policy.requireNumber &&
    !/[0-9]/.test(password)
  ) {
    errors.push(
      "Password must contain a number."
    );
  }

  if (
    policy.requireSpecialCharacter &&
    !/[^A-Za-z0-9]/.test(password)
  ) {
    errors.push(
      "Password must contain a special character."
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/* ============================================================
 * PRODUCTION VALIDATION
 * ============================================================
 */

function validateSecurityConfig() {
  const errors = [];

  if (!isProduction) {
    return {
      valid: true,
      errors
    };
  }

  if (
    !env.jwtSecret ||
    env.jwtSecret.length < 32
  ) {
    errors.push(
      "JWT_SECRET must be at least 32 characters in production."
    );
  }

  if (
    !env.sessionSecret ||
    env.sessionSecret.length < 32
  ) {
    errors.push(
      "SESSION_SECRET must be at least 32 characters in production."
    );
  }

  if (
    env.jwtSecret &&
    env.sessionSecret &&
    env.jwtSecret === env.sessionSecret
  ) {
    errors.push(
      "JWT_SECRET and SESSION_SECRET must be different."
    );
  }

  if (
    securityConfig.cookies.secure !== true
  ) {
    errors.push(
      "Secure cookies must be enabled in production."
    );
  }

  if (
    securityConfig.helmet.hsts.enabled !==
    true
  ) {
    errors.push(
      "HSTS should be enabled in production."
    );
  }

  if (
    securityConfig.features.secureHeaders !==
    true
  ) {
    errors.push(
      "Secure HTTP headers must be enabled."
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/* ============================================================
 * STARTUP VALIDATION
 * ============================================================
 */

const securityValidation =
  validateSecurityConfig();

if (
  isProduction &&
  !securityValidation.valid
) {
  throw new Error(
    `GHAR security configuration error:\n- ${securityValidation.errors.join(
      "\n- "
    )}`
  );
}

/* ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  securityConfig,

  createHelmetMiddleware,

  validatePassword,

  validateSecurityConfig,

  securityValidation,

  trustProxy,

  isProduction
};