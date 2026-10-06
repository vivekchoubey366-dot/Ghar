'use strict';

/**
 * ============================================================
 * GHAR - Security Configuration
 * ============================================================
 *
 * Central security configuration for the GHAR backend.
 *
 * Responsibilities:
 * - Security headers
 * - JWT configuration
 * - Password hashing configuration
 * - Cookie configuration
 * - CSRF configuration
 * - Rate-limit settings
 * - Request security limits
 * - Sensitive-data protection
 *
 * Authentication logic belongs in middleware/services.
 * ============================================================
 */

const helmet = require('helmet');
const env = require('./env');

/* ============================================================
   1. ENVIRONMENT
   ============================================================ */

const isProduction =
  env.app.environment === 'production';

/* ============================================================
   2. SECURITY SETTINGS
   ============================================================ */

const settings = {
  trustProxy: isProduction,

  hidePoweredBy: true,

  helmet: {
    enabled: true,

    contentSecurityPolicy:
      isProduction,

    crossOriginEmbedderPolicy:
      false,

    crossOriginOpenerPolicy:
      true,

    crossOriginResourcePolicy:
      'cross-origin',

    dnsPrefetchControl:
      true,

    frameguard:
      'deny',

    hsts:
      isProduction,

    ieNoOpen:
      true,

    noSniff:
      true,

    originAgentCluster:
      true,

    permittedCrossDomainPolicies:
      'none',

    referrerPolicy:
      'strict-origin-when-cross-origin',

    xssFilter:
      true
  },

  jwt: {
    algorithm:
      process.env.JWT_ALGORITHM ||
      'HS256',

    issuer:
      process.env.JWT_ISSUER ||
      'GHAR',

    audience:
      process.env.JWT_AUDIENCE ||
      'GHAR_USERS'
  },

  password: {
    bcryptRounds:
      env.security.bcryptRounds,

    minLength:
      Number(
        process.env.PASSWORD_MIN_LENGTH ||
        8
      ),

    maxLength:
      Number(
        process.env.PASSWORD_MAX_LENGTH ||
        128
      )
  },

  cookies: {
    httpOnly:
      true,

    secure:
      isProduction,

    sameSite:
      process.env.COOKIE_SAME_SITE ||
      'lax',

    maxAge:
      Number(
        process.env.COOKIE_MAX_AGE ||
        30 * 24 * 60 * 60 * 1000
      ),

    path:
      '/',

    domain:
      process.env.COOKIE_DOMAIN ||
      undefined
  },

  csrf: {
    enabled:
      process.env.CSRF_ENABLED === 'true',

    cookieName:
      process.env.CSRF_COOKIE_NAME ||
      'ghar_csrf',

    headerName:
      process.env.CSRF_HEADER_NAME ||
      'X-CSRF-Token'
  },

  requests: {
    maxBodySize:
      process.env.MAX_BODY_SIZE ||
      '2mb',

    maxParameterLimit:
      Number(
        process.env.MAX_PARAMETER_LIMIT ||
        100
      ),

    requestTimeout:
      Number(
        process.env.REQUEST_TIMEOUT ||
        30000
      )
  },

  bruteForce: {
    enabled:
      process.env.BRUTE_FORCE_PROTECTION !==
      'false',

    maxAttempts:
      Number(
        process.env.LOGIN_MAX_ATTEMPTS ||
        5
      ),

    windowMinutes:
      Number(
        process.env.LOGIN_ATTEMPT_WINDOW_MINUTES ||
        15
      ),

    lockoutMinutes:
      Number(
        process.env.LOGIN_LOCKOUT_MINUTES ||
        30
      )
  },

  securityHeaders: {
    cacheControl:
      true,

    pragma:
      true,

    noStore:
      isProduction
  }
};

/* ============================================================
   3. HELMET CONFIGURATION
   ============================================================ */

const helmetOptions = {
  contentSecurityPolicy:
    settings.helmet.contentSecurityPolicy
      ? {
          directives: {
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

            scriptSrc: [
              "'self'"
            ],

            styleSrc: [
              "'self'",
              "'unsafe-inline'"
            ],

            imgSrc: [
              "'self'",
              'data:',
              'blob:',
              'https:'
            ],

            fontSrc: [
              "'self'",
              'data:',
              'https:'
            ],

            connectSrc: [
              "'self'",
              'https:'
            ],

            mediaSrc: [
              "'self'",
              'https:',
              'blob:'
            ],

            workerSrc: [
              "'self'",
              'blob:'
            ],

            formAction: [
              "'self'"
            ],

            upgradeInsecureRequests:
              []
          }
        }
      : false,

  crossOriginEmbedderPolicy:
    settings.helmet.crossOriginEmbedderPolicy,

  crossOriginOpenerPolicy:
    settings.helmet.crossOriginOpenerPolicy
      ? {
          policy:
            'same-origin'
        }
      : false,

  crossOriginResourcePolicy:
    {
      policy:
        settings.helmet.crossOriginResourcePolicy
    },

  dnsPrefetchControl:
    {
      allow:
        false
    },

  frameguard:
    {
      action:
        settings.helmet.frameguard
    },

  hsts:
    settings.helmet.hsts
      ? {
          maxAge:
            31536000,

          includeSubDomains:
            true,

          preload:
            true
        }
      : false,

  ieNoOpen:
    settings.helmet.ieNoOpen,

  noSniff:
    settings.helmet.noSniff,

  originAgentCluster:
    settings.helmet.originAgentCluster,

  permittedCrossDomainPolicies:
    {
      permittedPolicies:
        settings.helmet.permittedCrossDomainPolicies
    },

  referrerPolicy:
    {
      policy:
        settings.helmet.referrerPolicy
    }
};

/* ============================================================
   4. SECURITY HEADERS MIDDLEWARE
   ============================================================ */

const securityHeaders =
  helmet(helmetOptions);

/* ============================================================
   5. ADDITIONAL SECURITY HEADERS
   ============================================================ */

function additionalSecurityHeaders(
  req,
  res,
  next
) {
  /*
   * Prevent MIME sniffing.
   */

  res.setHeader(
    'X-Content-Type-Options',
    'nosniff'
  );

  /*
   * Prevent clickjacking.
   */

  res.setHeader(
    'X-Frame-Options',
    'DENY'
  );

  /*
   * Control browser referrer information.
   */

  res.setHeader(
    'Referrer-Policy',
    settings.helmet.referrerPolicy
  );

  /*
   * Prevent caching of sensitive API responses.
   */

  if (
    settings.securityHeaders.noStore &&
    req.path.startsWith('/api/')
  ) {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private'
    );

    res.setHeader(
      'Pragma',
      'no-cache'
    );

    res.setHeader(
      'Expires',
      '0'
    );
  }

  /*
   * Disable legacy browser features.
   */

  res.setHeader(
    'X-Permitted-Cross-Domain-Policies',
    'none'
  );

  next();
}

/* ============================================================
   6. JWT CONFIGURATION
   ============================================================ */

function getJwtConfig() {
  return {
    secret:
      env.security.jwtSecret,

    expiresIn:
      env.security.jwtExpiresIn,

    algorithm:
      settings.jwt.algorithm,

    issuer:
      settings.jwt.issuer,

    audience:
      settings.jwt.audience
  };
}

/* ============================================================
   7. REFRESH TOKEN CONFIGURATION
   ============================================================ */

function getRefreshTokenConfig() {
  return {
    secret:
      env.security.refreshTokenSecret,

    expiresIn:
      env.security.refreshTokenExpiresIn,

    algorithm:
      settings.jwt.algorithm,

    issuer:
      settings.jwt.issuer,

    audience:
      settings.jwt.audience
  };
}

/* ============================================================
   8. PASSWORD CONFIGURATION
   ============================================================ */

function getPasswordConfig() {
  return {
    bcryptRounds:
      settings.password.bcryptRounds,

    minLength:
      settings.password.minLength,

    maxLength:
      settings.password.maxLength
  };
}

/* ============================================================
   9. COOKIE CONFIGURATION
   ============================================================ */

function getCookieConfig() {
  return {
    ...settings.cookies
  };
}

/* ============================================================
   10. CSRF CONFIGURATION
   ============================================================ */

function getCsrfConfig() {
  return {
    enabled:
      settings.csrf.enabled,

    cookieName:
      settings.csrf.cookieName,

    headerName:
      settings.csrf.headerName
  };
}

/* ============================================================
   11. REQUEST SECURITY CONFIGURATION
   ============================================================ */

function getRequestSecurityConfig() {
  return {
    maxBodySize:
      settings.requests.maxBodySize,

    maxParameterLimit:
      settings.requests.maxParameterLimit,

    requestTimeout:
      settings.requests.requestTimeout
  };
}

/* ============================================================
   12. LOGIN PROTECTION
   ============================================================ */

function getBruteForceConfig() {
  return {
    enabled:
      settings.bruteForce.enabled,

    maxAttempts:
      settings.bruteForce.maxAttempts,

    windowMinutes:
      settings.bruteForce.windowMinutes,

    lockoutMinutes:
      settings.bruteForce.lockoutMinutes
  };
}

/* ============================================================
   13. SECURITY VALIDATION
   ============================================================ */

function validate() {
  const errors = [];
  const warnings = [];

  /*
   * Production JWT validation.
   */

  if (
    isProduction &&
    !env.security.jwtSecret
  ) {
    errors.push(
      'JWT_SECRET is required in production.'
    );
  }

  if (
    isProduction &&
    !env.security.refreshTokenSecret
  ) {
    errors.push(
      'REFRESH_TOKEN_SECRET is required in production.'
    );
  }

  /*
   * Password validation.
   */

  if (
    settings.password.bcryptRounds < 10
  ) {
    warnings.push(
      'BCRYPT_ROUNDS is below the recommended production level.'
    );
  }

  if (
    settings.password.minLength < 8
  ) {
    warnings.push(
      'PASSWORD_MIN_LENGTH is less than 8 characters.'
    );
  }

  /*
   * Cookie validation.
   */

  if (
    isProduction &&
    !settings.cookies.secure
  ) {
    errors.push(
      'Secure cookies must be enabled in production.'
    );
  }

  /*
   * SameSite validation.
   */

  const validSameSiteValues = [
    'strict',
    'lax',
    'none'
  ];

  if (
    !validSameSiteValues.includes(
      settings.cookies.sameSite
    )
  ) {
    errors.push(
      'COOKIE_SAME_SITE must be strict, lax, or none.'
    );
  }

  /*
   * SameSite=None requires Secure.
   */

  if (
    settings.cookies.sameSite === 'none' &&
    !settings.cookies.secure
  ) {
    errors.push(
      'SameSite=None requires secure cookies.'
    );
  }

  /*
   * Request timeout validation.
   */

  if (
    settings.requests.requestTimeout < 1000
  ) {
    warnings.push(
      'REQUEST_TIMEOUT is unusually low.'
    );
  }

  for (
    const warning of warnings
  ) {
    console.warn(
      `[GHAR SECURITY WARNING] ${warning}`
    );
  }

  if (
    errors.length > 0
  ) {
    throw new Error(
      `[GHAR SECURITY CONFIG ERROR]\n- ${errors.join('\n- ')}`
    );
  }

  return true;
}

/* ============================================================
   14. SAFE CONFIGURATION
   ============================================================ */

function getSafeConfig() {
  return {
    environment:
      env.app.environment,

    helmet:
      settings.helmet,

    jwt: {
      algorithm:
        settings.jwt.algorithm,

      issuer:
        settings.jwt.issuer,

      audience:
        settings.jwt.audience,

      secretConfigured:
        Boolean(env.security.jwtSecret),

      refreshSecretConfigured:
        Boolean(
          env.security.refreshTokenSecret
        )
    },

    password: {
      bcryptRounds:
        settings.password.bcryptRounds,

      minLength:
        settings.password.minLength,

      maxLength:
        settings.password.maxLength
    },

    cookies: {
      httpOnly:
        settings.cookies.httpOnly,

      secure:
        settings.cookies.secure,

      sameSite:
        settings.cookies.sameSite,

      maxAge:
        settings.cookies.maxAge,

      domain:
        settings.cookies.domain
          ? '[configured]'
          : null
    },

    csrf: {
      enabled:
        settings.csrf.enabled,

      cookieName:
        settings.csrf.cookieName,

      headerName:
        settings.csrf.headerName
    },

    requests:
      settings.requests,

    bruteForce:
      settings.bruteForce
  };
}

/* ============================================================
   15. EXPORT
   ============================================================ */

const security = {
  settings,

  helmetOptions,

  securityHeaders,

  additionalSecurityHeaders,

  getJwtConfig,

  getRefreshTokenConfig,

  getPasswordConfig,

  getCookieConfig,

  getCsrfConfig,

  getRequestSecurityConfig,

  getBruteForceConfig,

  getSafeConfig,

  validate
};

/* ============================================================
   16. VALIDATE ON LOAD
   ============================================================ */

validate();

/* ============================================================
   17. EXPORT
   ============================================================ */

module.exports = security;