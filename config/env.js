"use strict";

/**
 * ============================================================
 * GHAR - Environment Configuration
 * ============================================================
 *
 * Centralized configuration for:
 * - Application
 * - API
 * - Database
 * - Authentication
 * - Sessions
 * - CORS
 * - Uploads
 * - AI
 * - Payments
 * - Email
 * - Storage
 * - Security
 * - Rate limiting
 * - Realtime
 * - Logging
 *
 * IMPORTANT:
 * Never commit .env to Git.
 * Use .env.example as the template.
 * ============================================================
 */

const path = require("path");
const dotenv = require("dotenv");

// ------------------------------------------------------------
// Load .env
// ------------------------------------------------------------

dotenv.config({
  path: path.resolve(process.cwd(), ".env")
});

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function getString(name, fallback = "") {
  const value = process.env[name];

  if (value === undefined || value === null) {
    return fallback;
  }

  return String(value).trim();
}

function getRequiredString(name) {
  const value = getString(name);

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

function getNumber(name, fallback) {
  const value = process.env[name];

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(
      `Environment variable ${name} must be a valid number.`
    );
  }

  return parsed;
}

function getBoolean(name, fallback = false) {
  const value = process.env[name];

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  return [
    "true",
    "1",
    "yes",
    "on"
  ].includes(String(value).toLowerCase());
}

function getList(name, fallback = []) {
  const value = process.env[name];

  if (
    value === undefined ||
    value === null ||
    value.trim() === ""
  ) {
    return fallback;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

// ------------------------------------------------------------
// Environment
// ------------------------------------------------------------

const nodeEnv = getString(
  "NODE_ENV",
  "development"
).toLowerCase();

const isProduction = nodeEnv === "production";
const isDevelopment = nodeEnv === "development";
const isTest = nodeEnv === "test";

// ------------------------------------------------------------
// Main configuration
// ------------------------------------------------------------

const env = {
  // ----------------------------------------------------------
  // Application
  // ----------------------------------------------------------

  nodeEnv,

  isProduction,
  isDevelopment,
  isTest,

  appName: getString(
    "APP_NAME",
    "GHAR"
  ),

  appVersion: getString(
    "APP_VERSION",
    "1.0.0"
  ),

  appUrl: getString(
    "APP_URL",
    "http://localhost:5000"
  ),

  port: getNumber(
    "PORT",
    5000
  ),

  host: getString(
    "HOST",
    "0.0.0.0"
  ),

  trustProxy: getBoolean(
    "TRUST_PROXY",
    false
  ),

  // ----------------------------------------------------------
  // API
  // ----------------------------------------------------------

  api: {
    prefix: getString(
      "API_PREFIX",
      "/api"
    ),

    version: getString(
      "API_VERSION",
      "v1"
    ),

    enableDocs: getBoolean(
      "ENABLE_API_DOCS",
      !isProduction
    )
  },

  // ----------------------------------------------------------
  // Database
  // ----------------------------------------------------------

  database: {
    url: getString(
      "DATABASE_URL",
      ""
    ),

    host: getString(
      "DB_HOST",
      "localhost"
    ),

    port: getNumber(
      "DB_PORT",
      5432
    ),

    name: getString(
      "DB_NAME",
      "ghar"
    ),

    user: getString(
      "DB_USER",
      "postgres"
    ),

    password: getString(
      "DB_PASSWORD",
      ""
    ),

    ssl: getBoolean(
      "DB_SSL",
      isProduction
    ),

    poolMin: getNumber(
      "DB_POOL_MIN",
      2
    ),

    poolMax: getNumber(
      "DB_POOL_MAX",
      10
    ),

    idleTimeoutMs: getNumber(
      "DB_IDLE_TIMEOUT_MS",
      30000
    ),

    connectionTimeoutMs: getNumber(
      "DB_CONNECTION_TIMEOUT_MS",
      10000
    )
  },

  // ----------------------------------------------------------
  // Authentication
  // ----------------------------------------------------------

  auth: {
    jwtSecret: getString(
      "JWT_SECRET",
      ""
    ),

    jwtExpiresIn: getString(
      "JWT_EXPIRES_IN",
      "7d"
    ),

    jwtIssuer: getString(
      "JWT_ISSUER",
      "GHAR"
    ),

    jwtAudience: getString(
      "JWT_AUDIENCE",
      "GHAR_USERS"
    ),

    refreshTokenSecret: getString(
      "REFRESH_TOKEN_SECRET",
      ""
    ),

    refreshTokenExpiresIn: getString(
      "REFRESH_TOKEN_EXPIRES_IN",
      "30d"
    ),

    sessionSecret: getString(
      "SESSION_SECRET",
      ""
    ),

    bcryptRounds: getNumber(
      "BCRYPT_ROUNDS",
      12
    ),

    otpLength: getNumber(
      "OTP_LENGTH",
      6
    ),

    otpExpiresInMinutes: getNumber(
      "OTP_EXPIRES_MINUTES",
      10
    ),

    maxLoginAttempts: getNumber(
      "MAX_LOGIN_ATTEMPTS",
      5
    )
  },

  // ----------------------------------------------------------
  // CORS
  // ----------------------------------------------------------

  cors: {
    origin: getString(
      "CORS_ORIGIN",
      "http://localhost:5000"
    ),

    origins: getList(
      "CORS_ORIGINS",
      [
        "http://localhost:5000"
      ]
    ),

    credentials: getBoolean(
      "CORS_CREDENTIALS",
      true
    )
  },

  // ----------------------------------------------------------
  // Uploads
  // ----------------------------------------------------------

  uploads: {
    directory: getString(
      "UPLOAD_DIR",
      path.join(
        process.cwd(),
        "uploads"
      )
    ),

    maxFileSize: getNumber(
      "MAX_FILE_SIZE",
      10 * 1024 * 1024
    ),

    maxPropertyImages: getNumber(
      "MAX_PROPERTY_IMAGES",
      30
    ),

    maxPropertyVideos: getNumber(
      "MAX_PROPERTY_VIDEOS",
      5
    ),

    maxDocuments: getNumber(
      "MAX_DOCUMENTS",
      20
    ),

    allowedImageTypes: getList(
      "ALLOWED_IMAGE_TYPES",
      [
        "image/jpeg",
        "image/png",
        "image/webp"
      ]
    ),

    allowedDocumentTypes: getList(
      "ALLOWED_DOCUMENT_TYPES",
      [
        "application/pdf",
        "image/jpeg",
        "image/png"
      ]
    )
  },

  // ----------------------------------------------------------
  // AI
  // ----------------------------------------------------------

  ai: {
    enabled: getBoolean(
      "AI_ENABLED",
      true
    ),

    provider: getString(
      "AI_PROVIDER",
      ""
    ),

    apiKey: getString(
      "AI_API_KEY",
      ""
    ),

    apiUrl: getString(
      "AI_API_URL",
      ""
    ),

    model: getString(
      "AI_MODEL",
      ""
    ),

    organization: getString(
      "AI_ORGANIZATION",
      ""
    ),

    timeout: getNumber(
      "AI_TIMEOUT",
      60000
    ),

    maxTokens: getNumber(
      "AI_MAX_TOKENS",
      4000
    ),

    temperature: getNumber(
      "AI_TEMPERATURE",
      0.3
    ),

    enableChat: getBoolean(
      "AI_CHAT_ENABLED",
      true
    ),

    enableSearch: getBoolean(
      "AI_SEARCH_ENABLED",
      true
    ),

    enableRecommendations: getBoolean(
      "AI_RECOMMENDATIONS_ENABLED",
      true
    ),

    enablePricing: getBoolean(
      "AI_PRICING_ENABLED",
      true
    ),

    enableInvestment: getBoolean(
      "AI_INVESTMENT_ENABLED",
      true
    ),

    enableLoans: getBoolean(
      "AI_LOANS_ENABLED",
      true
    ),

    enableDocuments: getBoolean(
      "AI_DOCUMENTS_ENABLED",
      true
    ),

    enableRental: getBoolean(
      "AI_RENTAL_ENABLED",
      true
    ),

    enableModeration: getBoolean(
      "AI_MODERATION_ENABLED",
      true
    ),

    enableFraudDetection: getBoolean(
      "AI_FRAUD_DETECTION_ENABLED",
      true
    )
  },

  // ----------------------------------------------------------
  // Payments
  // ----------------------------------------------------------

  payments: {
    enabled: getBoolean(
      "PAYMENTS_ENABLED",
      false
    ),

    provider: getString(
      "PAYMENT_PROVIDER",
      ""
    ),

    keyId: getString(
      "PAYMENT_KEY_ID",
      ""
    ),

    keySecret: getString(
      "PAYMENT_KEY_SECRET",
      ""
    ),

    webhookSecret: getString(
      "PAYMENT_WEBHOOK_SECRET",
      ""
    ),

    currency: getString(
      "PAYMENT_CURRENCY",
      "INR"
    )
  },

  // ----------------------------------------------------------
  // Email
  // ----------------------------------------------------------

  email: {
    enabled: getBoolean(
      "EMAIL_ENABLED",
      false
    ),

    host: getString(
      "EMAIL_HOST",
      ""
    ),

    port: getNumber(
      "EMAIL_PORT",
      587
    ),

    secure: getBoolean(
      "EMAIL_SECURE",
      false
    ),

    user: getString(
      "EMAIL_USER",
      ""
    ),

    password: getString(
      "EMAIL_PASSWORD",
      ""
    ),

    from: getString(
      "EMAIL_FROM",
      ""
    ),

    replyTo: getString(
      "EMAIL_REPLY_TO",
      ""
    )
  },

  // ----------------------------------------------------------
  // SMS / OTP
  // ----------------------------------------------------------

  sms: {
    enabled: getBoolean(
      "SMS_ENABLED",
      false
    ),

    provider: getString(
      "SMS_PROVIDER",
      ""
    ),

    apiKey: getString(
      "SMS_API_KEY",
      ""
    ),

    apiSecret: getString(
      "SMS_API_SECRET",
      ""
    ),

    senderId: getString(
      "SMS_SENDER_ID",
      "GHAR"
    )
  },

  // ----------------------------------------------------------
  // Storage
  // ----------------------------------------------------------

  storage: {
    provider: getString(
      "STORAGE_PROVIDER",
      "local"
    ),

    bucket: getString(
      "STORAGE_BUCKET",
      ""
    ),

    region: getString(
      "STORAGE_REGION",
      ""
    ),

    endpoint: getString(
      "STORAGE_ENDPOINT",
      ""
    ),

    accessKey: getString(
      "STORAGE_ACCESS_KEY",
      ""
    ),

    secretKey: getString(
      "STORAGE_SECRET_KEY",
      ""
    )
  },

  // ----------------------------------------------------------
  // Security
  // ----------------------------------------------------------

  security: {
    helmetEnabled: getBoolean(
      "HELMET_ENABLED",
      true
    ),

    csrfEnabled: getBoolean(
      "CSRF_ENABLED",
      false
    ),

    rateLimitWindowMs: getNumber(
      "RATE_LIMIT_WINDOW",
      15 * 60 * 1000
    ),

    rateLimitMax: getNumber(
      "RATE_LIMIT_MAX",
      100
    ),

    authRateLimitMax: getNumber(
      "AUTH_RATE_LIMIT_MAX",
      10
    ),

    aiRateLimitMax: getNumber(
      "AI_RATE_LIMIT_MAX",
      30
    ),

    maxRequestBodySize: getString(
      "MAX_REQUEST_BODY_SIZE",
      "5mb"
    )
  },

  // ----------------------------------------------------------
  // Realtime
  // ----------------------------------------------------------

  realtime: {
    enabled: getBoolean(
      "REALTIME_ENABLED",
      false
    ),

    provider: getString(
      "REALTIME_PROVIDER",
      "socket.io"
    ),

    url: getString(
      "REALTIME_URL",
      ""
    )
  },

  // ----------------------------------------------------------
  // Maps
  // ----------------------------------------------------------

  maps: {
    provider: getString(
      "MAP_PROVIDER",
      ""
    ),

    apiKey: getString(
      "MAP_API_KEY",
      ""
    )
  },

  // ----------------------------------------------------------
  // Logging
  // ----------------------------------------------------------

  logging: {
    level: getString(
      "LOG_LEVEL",
      isProduction ? "info" : "debug"
    ),

    directory: getString(
      "LOG_DIR",
      path.join(
        process.cwd(),
        "logs"
      )
    ),

    enableFileLogging: getBoolean(
      "ENABLE_FILE_LOGGING",
      true
    )
  },

  // ----------------------------------------------------------
  // Feature Flags
  // ----------------------------------------------------------

  features: {
    marketplace: getBoolean(
      "FEATURE_MARKETPLACE",
      true
    ),

    referrals: getBoolean(
      "FEATURE_REFERRALS",
      true
    ),

    loans: getBoolean(
      "FEATURE_LOANS",
      true
    ),

    payments: getBoolean(
      "FEATURE_PAYMENTS",
      false
    ),

    subscriptions: getBoolean(
      "FEATURE_SUBSCRIPTIONS",
      true
    ),

    verification: getBoolean(
      "FEATURE_VERIFICATION",
      true
    ),

    realtime: getBoolean(
      "FEATURE_REALTIME",
      false
    ),

    ai: getBoolean(
      "FEATURE_AI",
      true
    )
  }
};

// ============================================================
// Production validation
// ============================================================

function validateProductionEnvironment() {
  if (!isProduction) {
    return;
  }

  const required = [
    ["JWT_SECRET", env.auth.jwtSecret],
    [
      "REFRESH_TOKEN_SECRET",
      env.auth.refreshTokenSecret
    ],
    [
      "SESSION_SECRET",
      env.auth.sessionSecret
    ],
    [
      "DATABASE_URL",
      env.database.url
    ]
  ];

  const missing = required
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`
    );
  }

  if (
    env.auth.jwtSecret.length < 32
  ) {
    throw new Error(
      "JWT_SECRET must contain at least 32 characters in production."
    );
  }

  if (
    env.auth.refreshTokenSecret.length < 32
  ) {
    throw new Error(
      "REFRESH_TOKEN_SECRET must contain at least 32 characters in production."
    );
  }

  if (
    env.auth.sessionSecret.length < 32
  ) {
    throw new Error(
      "SESSION_SECRET must contain at least 32 characters in production."
    );
  }

  if (
    env.cors.origins.includes("*")
  ) {
    throw new Error(
      "Wildcard CORS (*) is not allowed in production."
    );
  }
}

// ============================================================
// Configuration validation
// ============================================================

function validateConfiguration() {
  if (
    env.port < 1 ||
    env.port > 65535
  ) {
    throw new Error(
      "PORT must be between 1 and 65535."
    );
  }

  if (
    env.auth.bcryptRounds < 10 ||
    env.auth.bcryptRounds > 16
  ) {
    throw new Error(
      "BCRYPT_ROUNDS must be between 10 and 16."
    );
  }

  if (
    env.auth.otpLength < 4 ||
    env.auth.otpLength > 8
  ) {
    throw new Error(
      "OTP_LENGTH must be between 4 and 8."
    );
  }

  if (
    env.database.poolMin < 0 ||
    env.database.poolMax < env.database.poolMin
  ) {
    throw new Error(
      "Invalid database connection pool configuration."
    );
  }

  if (
    env.ai.temperature < 0 ||
    env.ai.temperature > 2
  ) {
    throw new Error(
      "AI_TEMPERATURE must be between 0 and 2."
    );
  }
}

// ============================================================
// Run validation
// ============================================================

validateConfiguration();
validateProductionEnvironment();

// ============================================================
// Safe configuration summary
// ============================================================

function getSafeConfig() {
  return {
    app: {
      name: env.appName,
      version: env.appVersion,
      environment: env.nodeEnv,
      port: env.port
    },

    api: env.api,

    database: {
      configured: Boolean(
        env.database.url ||
        env.database.host
      ),
      host: env.database.host,
      port: env.database.port,
      name: env.database.name
    },

    ai: {
      enabled: env.ai.enabled,
      provider: env.ai.provider,
      model: env.ai.model
    },

    payments: {
      enabled: env.payments.enabled,
      provider: env.payments.provider,
      currency: env.payments.currency
    },

    email: {
      enabled: env.email.enabled,
      host: env.email.host,
      port: env.email.port
    },

    storage: {
      provider: env.storage.provider
    },

    realtime: {
      enabled: env.realtime.enabled,
      provider: env.realtime.provider
    }
  };
}

env.getSafeConfig = getSafeConfig;

// ============================================================
// Export
// ============================================================

module.exports = env;