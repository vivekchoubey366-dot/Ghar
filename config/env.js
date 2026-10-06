'use strict';

/**
 * ============================================================
 * GHAR - Environment Configuration
 * ============================================================
 *
 * Centralized environment variable loading and validation.
 *
 * IMPORTANT:
 * - Never put real secrets in this file.
 * - Real values belong in .env locally / Render Environment
 *   Variables in production.
 * - Never commit .env to Git.
 * ============================================================
 */

const path = require('path');
const dotenv = require('dotenv');

/* ============================================================
   1. LOAD .ENV
   ============================================================ */

const rootDir = path.resolve(__dirname, '..');

dotenv.config({
  path: path.join(rootDir, '.env')
});

/* ============================================================
   2. HELPERS
   ============================================================ */

function getEnv(name, defaultValue = undefined) {
  const value = process.env[name];

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return defaultValue;
  }

  return value.trim();
}

function getRequiredEnv(name) {
  const value = getEnv(name);

  if (!value) {
    throw new Error(
      `[GHAR] Missing required environment variable: ${name}`
    );
  }

  return value;
}

function getBooleanEnv(name, defaultValue = false) {
  const value = getEnv(name);

  if (value === undefined) {
    return defaultValue;
  }

  return [
    'true',
    '1',
    'yes',
    'on'
  ].includes(value.toLowerCase());
}

function getNumberEnv(name, defaultValue) {
  const value = getEnv(name);

  if (value === undefined) {
    return defaultValue;
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    throw new Error(
      `[GHAR] Environment variable ${name} must be a number.`
    );
  }

  return number;
}

function getListEnv(name, defaultValue = []) {
  const value = getEnv(name);

  if (!value) {
    return defaultValue;
  }

  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

/* ============================================================
   3. APPLICATION
   ============================================================ */

const NODE_ENV = getEnv(
  'NODE_ENV',
  'development'
);

const PORT = getNumberEnv(
  'PORT',
  10000
);

const API_VERSION = getEnv(
  'API_VERSION',
  'v1'
);

const APP_NAME = getEnv(
  'APP_NAME',
  'GHAR'
);

const APP_URL = getEnv(
  'APP_URL',
  'http://localhost:10000'
);

const API_URL = getEnv(
  'API_URL',
  `${APP_URL}/api`
);

/* ============================================================
   4. CORS
   ============================================================ */

const CORS_ORIGIN = getListEnv(
  'CORS_ORIGIN',
  [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:10000'
  ]
);

const CORS_CREDENTIALS = getBooleanEnv(
  'CORS_CREDENTIALS',
  true
);

/* ============================================================
   5. SECURITY
   ============================================================ */

const JWT_SECRET = getEnv(
  'JWT_SECRET'
);

const JWT_EXPIRES_IN = getEnv(
  'JWT_EXPIRES_IN',
  '15m'
);

const REFRESH_TOKEN_SECRET = getEnv(
  'REFRESH_TOKEN_SECRET'
);

const REFRESH_TOKEN_EXPIRES_IN = getEnv(
  'REFRESH_TOKEN_EXPIRES_IN',
  '30d'
);

const SESSION_SECRET = getEnv(
  'SESSION_SECRET'
);

const COOKIE_SECRET = getEnv(
  'COOKIE_SECRET'
);

const BCRYPT_ROUNDS = getNumberEnv(
  'BCRYPT_ROUNDS',
  12
);

/* ============================================================
   6. DATABASE
   ============================================================ */

const DATABASE_URL = getEnv(
  'DATABASE_URL'
);

const DB_HOST = getEnv(
  'DB_HOST'
);

const DB_PORT = getNumberEnv(
  'DB_PORT',
  5432
);

const DB_NAME = getEnv(
  'DB_NAME'
);

const DB_USER = getEnv(
  'DB_USER'
);

const DB_PASSWORD = getEnv(
  'DB_PASSWORD'
);

const DB_SSL = getBooleanEnv(
  'DB_SSL',
  NODE_ENV === 'production'
);

const DB_POOL_MIN = getNumberEnv(
  'DB_POOL_MIN',
  2
);

const DB_POOL_MAX = getNumberEnv(
  'DB_POOL_MAX',
  10
);

const DB_IDLE_TIMEOUT = getNumberEnv(
  'DB_IDLE_TIMEOUT',
  30000
);

const DB_CONNECTION_TIMEOUT = getNumberEnv(
  'DB_CONNECTION_TIMEOUT',
  10000
);

/* ============================================================
   7. EMAIL
   ============================================================ */

const EMAIL_HOST = getEnv(
  'EMAIL_HOST'
);

const EMAIL_PORT = getNumberEnv(
  'EMAIL_PORT',
  587
);

const EMAIL_SECURE = getBooleanEnv(
  'EMAIL_SECURE',
  false
);

const EMAIL_USER = getEnv(
  'EMAIL_USER'
);

const EMAIL_PASSWORD = getEnv(
  'EMAIL_PASSWORD'
);

const EMAIL_FROM = getEnv(
  'EMAIL_FROM',
  'GHAR <no-reply@ghar.com>'
);

/* ============================================================
   8. PAYMENT
   ============================================================ */

const PAYMENT_PROVIDER = getEnv(
  'PAYMENT_PROVIDER',
  'razorpay'
);

const RAZORPAY_KEY_ID = getEnv(
  'RAZORPAY_KEY_ID'
);

const RAZORPAY_KEY_SECRET = getEnv(
  'RAZORPAY_KEY_SECRET'
);

const RAZORPAY_WEBHOOK_SECRET = getEnv(
  'RAZORPAY_WEBHOOK_SECRET'
);

/* ============================================================
   9. STORAGE
   ============================================================ */

const STORAGE_PROVIDER = getEnv(
  'STORAGE_PROVIDER',
  'local'
);

const STORAGE_BUCKET = getEnv(
  'STORAGE_BUCKET'
);

const STORAGE_REGION = getEnv(
  'STORAGE_REGION'
);

const STORAGE_ACCESS_KEY = getEnv(
  'STORAGE_ACCESS_KEY'
);

const STORAGE_SECRET_KEY = getEnv(
  'STORAGE_SECRET_KEY'
);

/* ============================================================
   10. FILE UPLOADS
   ============================================================ */

const MAX_FILE_SIZE_MB = getNumberEnv(
  'MAX_FILE_SIZE_MB',
  10
);

const MAX_FILE_SIZE_BYTES =
  MAX_FILE_SIZE_MB * 1024 * 1024;

const UPLOAD_DIR = getEnv(
  'UPLOAD_DIR',
  path.join(rootDir, 'uploads')
);

const ALLOWED_FILE_TYPES = getListEnv(
  'ALLOWED_FILE_TYPES',
  [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]
);

/* ============================================================
   11. AI
   ============================================================ */

const AI_ENABLED = getBooleanEnv(
  'AI_ENABLED',
  true
);

const AI_API_KEY = getEnv(
  'AI_API_KEY'
);

const AI_API_URL = getEnv(
  'AI_API_URL'
);

const AI_MODEL = getEnv(
  'AI_MODEL'
);

const AI_TIMEOUT = getNumberEnv(
  'AI_TIMEOUT',
  30000
);

const AI_MAX_TOKENS = getNumberEnv(
  'AI_MAX_TOKENS',
  2000
);

/* ============================================================
   12. RATE LIMITING
   ============================================================ */

const RATE_LIMIT_WINDOW_MS =
  getNumberEnv(
    'RATE_LIMIT_WINDOW_MS',
    15 * 60 * 1000
  );

const RATE_LIMIT_MAX =
  getNumberEnv(
    'RATE_LIMIT_MAX',
    100
  );

const AUTH_RATE_LIMIT_MAX =
  getNumberEnv(
    'AUTH_RATE_LIMIT_MAX',
    10
  );

/* ============================================================
   13. OTP
   ============================================================ */

const OTP_EXPIRES_MINUTES =
  getNumberEnv(
    'OTP_EXPIRES_MINUTES',
    10
  );

const OTP_LENGTH =
  getNumberEnv(
    'OTP_LENGTH',
    6
  );

/* ============================================================
   14. LOGGING
   ============================================================ */

const LOG_LEVEL = getEnv(
  'LOG_LEVEL',
  NODE_ENV === 'production'
    ? 'info'
    : 'debug'
);

const LOG_DIR = getEnv(
  'LOG_DIR',
  path.join(rootDir, 'logs')
);

/* ============================================================
   15. REDIS / CACHE
   ============================================================ */

const REDIS_URL = getEnv(
  'REDIS_URL'
);

const CACHE_ENABLED = getBooleanEnv(
  'CACHE_ENABLED',
  Boolean(REDIS_URL)
);

/* ============================================================
   16. REALTIME
   ============================================================ */

const REALTIME_ENABLED = getBooleanEnv(
  'REALTIME_ENABLED',
  true
);

/* ============================================================
   17. FRONTEND
   ============================================================ */

const FRONTEND_URL = getEnv(
  'FRONTEND_URL',
  APP_URL
);

/* ============================================================
   18. ENVIRONMENT VALIDATION
   ============================================================ */

function validateEnvironment() {
  const errors = [];
  const warnings = [];

  /*
   * Production requirements.
   */

  if (NODE_ENV === 'production') {
    if (!JWT_SECRET) {
      errors.push(
        'JWT_SECRET is required in production.'
      );
    }

    if (!REFRESH_TOKEN_SECRET) {
      errors.push(
        'REFRESH_TOKEN_SECRET is required in production.'
      );
    }

    if (!DATABASE_URL && !DB_HOST) {
      errors.push(
        'DATABASE_URL or DB_HOST is required in production.'
      );
    }

    if (
      PAYMENT_PROVIDER === 'razorpay' &&
      (
        !RAZORPAY_KEY_ID ||
        !RAZORPAY_KEY_SECRET
      )
    ) {
      warnings.push(
        'Razorpay credentials are not configured.'
      );
    }

    if (
      AI_ENABLED &&
      !AI_API_KEY
    ) {
      warnings.push(
        'AI_ENABLED=true but AI_API_KEY is not configured.'
      );
    }
  }

  /*
   * Development warnings.
   */

  if (
    NODE_ENV !== 'production' &&
    !JWT_SECRET
  ) {
    warnings.push(
      'JWT_SECRET is not configured. Authentication should configure a development secret.'
    );
  }

  if (
    NODE_ENV !== 'production' &&
    !DATABASE_URL &&
    !DB_HOST
  ) {
    warnings.push(
      'Database environment variables are not configured.'
    );
  }

  /*
   * Output warnings.
   */

  for (const warning of warnings) {
    console.warn(
      `[GHAR CONFIG WARNING] ${warning}`
    );
  }

  /*
   * Stop application for fatal configuration errors.
   */

  if (errors.length > 0) {
    throw new Error(
      `[GHAR CONFIG ERROR]\n- ${errors.join('\n- ')}`
    );
  }

  return true;
}

/* ============================================================
   19. SAFE CONFIG SUMMARY
   * Never expose secrets.
   ============================================================ */

function getSafeConfig() {
  return {
    app: {
      name: APP_NAME,
      environment: NODE_ENV,
      port: PORT,
      apiVersion: API_VERSION,
      appUrl: APP_URL,
      apiUrl: API_URL
    },

    cors: {
      origins: CORS_ORIGIN,
      credentials: CORS_CREDENTIALS
    },

    database: {
      provider: DATABASE_URL
        ? 'connection-string'
        : 'individual-settings',
      host: DB_HOST || null,
      port: DB_PORT,
      database: DB_NAME || null,
      ssl: DB_SSL,
      poolMin: DB_POOL_MIN,
      poolMax: DB_POOL_MAX
    },

    security: {
      jwtConfigured: Boolean(JWT_SECRET),
      refreshTokenConfigured:
        Boolean(REFRESH_TOKEN_SECRET),
      sessionConfigured:
        Boolean(SESSION_SECRET),
      bcryptRounds: BCRYPT_ROUNDS
    },

    email: {
      host: EMAIL_HOST || null,
      port: EMAIL_PORT,
      secure: EMAIL_SECURE,
      configured:
        Boolean(
          EMAIL_HOST &&
          EMAIL_USER &&
          EMAIL_PASSWORD
        )
    },

    payments: {
      provider: PAYMENT_PROVIDER,
      configured:
        PAYMENT_PROVIDER === 'razorpay'
          ? Boolean(
              RAZORPAY_KEY_ID &&
              RAZORPAY_KEY_SECRET
            )
          : false
    },

    storage: {
      provider: STORAGE_PROVIDER,
      bucket: STORAGE_BUCKET || null
    },

    uploads: {
      directory: UPLOAD_DIR,
      maxFileSizeMB: MAX_FILE_SIZE_MB,
      allowedFileTypes:
        ALLOWED_FILE_TYPES
    },

    ai: {
      enabled: AI_ENABLED,
      configured: Boolean(AI_API_KEY),
      model: AI_MODEL || null,
      timeout: AI_TIMEOUT
    },

    rateLimit: {
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
      authMax: AUTH_RATE_LIMIT_MAX
    },

    cache: {
      enabled: CACHE_ENABLED,
      configured: Boolean(REDIS_URL)
    },

    realtime: {
      enabled: REALTIME_ENABLED
    },

    logging: {
      level: LOG_LEVEL,
      directory: LOG_DIR
    }
  };
}

/* ============================================================
   20. EXPORT
   ============================================================ */

const env = {
  rootDir,

  app: {
    name: APP_NAME,
    environment: NODE_ENV,
    port: PORT,
    apiVersion: API_VERSION,
    url: APP_URL,
    apiUrl: API_URL
  },

  cors: {
    origin: CORS_ORIGIN,
    credentials: CORS_CREDENTIALS
  },

  security: {
    jwtSecret: JWT_SECRET,
    jwtExpiresIn: JWT_EXPIRES_IN,

    refreshTokenSecret:
      REFRESH_TOKEN_SECRET,

    refreshTokenExpiresIn:
      REFRESH_TOKEN_EXPIRES_IN,

    sessionSecret: SESSION_SECRET,
    cookieSecret: COOKIE_SECRET,

    bcryptRounds: BCRYPT_ROUNDS
  },

  database: {
    url: DATABASE_URL,

    host: DB_HOST,
    port: DB_PORT,
    name: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,

    ssl: DB_SSL,

    poolMin: DB_POOL_MIN,
    poolMax: DB_POOL_MAX,

    idleTimeout:
      DB_IDLE_TIMEOUT,

    connectionTimeout:
      DB_CONNECTION_TIMEOUT
  },

  email: {
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    user: EMAIL_USER,
    password: EMAIL_PASSWORD,
    from: EMAIL_FROM
  },

  payments: {
    provider: PAYMENT_PROVIDER,

    razorpay: {
      keyId: RAZORPAY_KEY_ID,
      keySecret: RAZORPAY_KEY_SECRET,
      webhookSecret:
        RAZORPAY_WEBHOOK_SECRET
    }
  },

  storage: {
    provider: STORAGE_PROVIDER,
    bucket: STORAGE_BUCKET,
    region: STORAGE_REGION,
    accessKey: STORAGE_ACCESS_KEY,
    secretKey: STORAGE_SECRET_KEY
  },

  upload: {
    directory: UPLOAD_DIR,
    maxFileSizeMB: MAX_FILE_SIZE_MB,
    maxFileSizeBytes:
      MAX_FILE_SIZE_BYTES,
    allowedFileTypes:
      ALLOWED_FILE_TYPES
  },

  ai: {
    enabled: AI_ENABLED,
    apiKey: AI_API_KEY,
    apiUrl: AI_API_URL,
    model: AI_MODEL,
    timeout: AI_TIMEOUT,
    maxTokens: AI_MAX_TOKENS
  },

  rateLimit: {
    windowMs:
      RATE_LIMIT_WINDOW_MS,

    max: RATE_LIMIT_MAX,

    authMax:
      AUTH_RATE_LIMIT_MAX
  },

  otp: {
    expiresMinutes:
      OTP_EXPIRES_MINUTES,

    length:
      OTP_LENGTH
  },

  logging: {
    level: LOG_LEVEL,
    directory: LOG_DIR
  },

  cache: {
    enabled: CACHE_ENABLED,
    redisUrl: REDIS_URL
  },

  realtime: {
    enabled: REALTIME_ENABLED
  },

  frontend: {
    url: FRONTEND_URL
  },

  getSafeConfig,
  validateEnvironment
};

/* ============================================================
   21. VALIDATE
   ============================================================ */

validateEnvironment();

/* ============================================================
   22. EXPORT CONFIGURATION
   ============================================================ */

module.exports = env;