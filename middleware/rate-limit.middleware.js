"use strict";

/**
 * ============================================================
 * GHAR - RATE LIMIT MIDDLEWARE
 * ============================================================
 *
 * Responsibilities:
 * - Protect APIs against excessive requests
 * - Provide different limits for different endpoint types
 * - Protect authentication endpoints aggressively
 * - Protect payment and webhook endpoints
 * - Support configurable limits through environment variables
 * - Return consistent GHAR error responses
 *
 * NOTE:
 * This implementation uses an in-memory store.
 *
 * For a multi-instance Render deployment, replace the store
 * with Redis so limits are shared between instances.
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


const CONFIG = Object.freeze({
  windowMs:
    Number(
      process.env.RATE_LIMIT_WINDOW_MS ||
      15 * 60 * 1000
    ),

  max:
    Number(
      process.env.RATE_LIMIT_MAX ||
      300
    ),

  authWindowMs:
    Number(
      process.env.AUTH_RATE_LIMIT_WINDOW_MS ||
      15 * 60 * 1000
    ),

  authMax:
    Number(
      process.env.AUTH_RATE_LIMIT_MAX ||
      10
    ),

  apiWindowMs:
    Number(
      process.env.API_RATE_LIMIT_WINDOW_MS ||
      15 * 60 * 1000
    ),

  apiMax:
    Number(
      process.env.API_RATE_LIMIT_MAX ||
      300
    ),

  paymentWindowMs:
    Number(
      process.env.PAYMENT_RATE_LIMIT_WINDOW_MS ||
      15 * 60 * 1000
    ),

  paymentMax:
    Number(
      process.env.PAYMENT_RATE_LIMIT_MAX ||
      30
    ),

  uploadWindowMs:
    Number(
      process.env.UPLOAD_RATE_LIMIT_WINDOW_MS ||
      15 * 60 * 1000
    ),

  uploadMax:
    Number(
      process.env.UPLOAD_RATE_LIMIT_MAX ||
      20
    ),

  searchWindowMs:
    Number(
      process.env.SEARCH_RATE_LIMIT_WINDOW_MS ||
      60 * 1000
    ),

  searchMax:
    Number(
      process.env.SEARCH_RATE_LIMIT_MAX ||
      60
    ),

  aiWindowMs:
    Number(
      process.env.AI_RATE_LIMIT_WINDOW_MS ||
      60 * 60 * 1000
    ),

  aiMax:
    Number(
      process.env.AI_RATE_LIMIT_MAX ||
      30
    ),

  cleanupIntervalMs:
    Number(
      process.env.RATE_LIMIT_CLEANUP_MS ||
      5 * 60 * 1000
    )
});


/**
 ------------------------------------------------------------
 * In-memory rate-limit store
 * ------------------------------------------------------------
 */

const store =
  new Map();


/**
 * ------------------------------------------------------------
 * Generate client identifier
 * ------------------------------------------------------------
 *
 * Authenticated users are primarily identified by user ID.
 *
 * Anonymous users are identified using IP address.
 *
 * IMPORTANT:
 * req.ip depends on Express's trust-proxy configuration.
 * Configure `app.set("trust proxy", 1)` when appropriate
 * behind Render's proxy.
 * ------------------------------------------------------------
 */

function getClientIdentifier(
  req
) {
  if (
    req.user?.id
  ) {
    return `user:${String(
      req.user.id
    )}`;
  }

  const ip =
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown";

  return `ip:${ip}`;
}


/**
 * ------------------------------------------------------------
 * Hash long/custom keys
 * ------------------------------------------------------------
 */

function hashKey(
  value
) {
  return crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex");
}


/**
 * ------------------------------------------------------------
 * Build rate-limit key
 * ------------------------------------------------------------
 */

function createRateLimitKey(
  req,
  namespace
) {
  const client =
    getClientIdentifier(req);

  return `${namespace}:${client}`;
}


/**
 * ------------------------------------------------------------
 * Get/create bucket
 * ------------------------------------------------------------
 */

function getBucket(
  key,
  windowMs
) {
  const now =
    Date.now();

  let bucket =
    store.get(key);

  if (
    !bucket ||
    now >= bucket.resetAt
  ) {
    bucket = {
      count: 0,
      resetAt:
        now + windowMs
    };

    store.set(
      key,
      bucket
    );
  }

  return bucket;
}


/**
 * ------------------------------------------------------------
 * Format Retry-After
 * ------------------------------------------------------------
 */

function getRetryAfterSeconds(
  resetAt
) {
  return Math.max(
    1,
    Math.ceil(
      (resetAt - Date.now()) /
        1000
    )
  );
}


/**
 * ------------------------------------------------------------
 * Standard rate-limit response
 * ------------------------------------------------------------
 */

function sendRateLimitError(
  req,
  res,
  bucket,
  limit
) {
  const retryAfter =
    getRetryAfterSeconds(
      bucket.resetAt
    );

  res.set(
    "Retry-After",
    String(retryAfter)
  );

  res.set(
    "X-RateLimit-Limit",
    String(limit)
  );

  res.set(
    "X-RateLimit-Remaining",
    "0"
  );

  res.set(
    "X-RateLimit-Reset",
    String(
      Math.ceil(
        bucket.resetAt / 1000
      )
    )
  );

  return res.status(429).json({
    success: false,

    error: {
      code:
        "RATE_LIMIT_EXCEEDED",

      message:
        "Too many requests. Please try again later.",

      requestId:
        req.requestId || null,

      retryAfter
    }
  });
}


/**
 * ------------------------------------------------------------
 * Create generic limiter
 * ------------------------------------------------------------
 */

function createRateLimiter({
  windowMs =
    CONFIG.windowMs,

  max =
    CONFIG.max,

  namespace =
    "api",

  keyGenerator
} = {}) {
  if (
    !Number.isFinite(windowMs) ||
    windowMs <= 0
  ) {
    throw new TypeError(
      "Rate-limit windowMs must be greater than zero."
    );
  }

  if (
    !Number.isFinite(max) ||
    max <= 0
  ) {
    throw new TypeError(
      "Rate-limit max must be greater than zero."
    );
  }

  return function rateLimitMiddleware(
    req,
    res,
    next
  ) {
    const key =
      typeof keyGenerator ===
      "function"
        ? keyGenerator(req)
        : createRateLimitKey(
            req,
            namespace
          );

    const bucket =
      getBucket(
        key,
        windowMs
      );

    bucket.count += 1;

    const remaining =
      Math.max(
        0,
        max - bucket.count
      );

    res.set(
      "X-RateLimit-Limit",
      String(max)
    );

    res.set(
      "X-RateLimit-Remaining",
      String(remaining)
    );

    res.set(
      "X-RateLimit-Reset",
      String(
        Math.ceil(
          bucket.resetAt / 1000
        )
      )
    );

    if (
      bucket.count > max
    ) {
      return sendRateLimitError(
        req,
        res,
        bucket,
        max
      );
    }

    return next();
  };
}


/**
 * ============================================================
 * GENERAL API LIMITER
 * ============================================================
 */

const apiRateLimiter =
  createRateLimiter({
    windowMs:
      CONFIG.apiWindowMs,

    max:
      CONFIG.apiMax,

    namespace:
      "api"
  });


/**
 * ============================================================
 * AUTHENTICATION LIMITER
 * ============================================================
 *
 * Use for:
 *
 * POST /login
 * POST /register
 * POST /forgot-password
 * POST /reset-password
 * POST /verify-otp
 *
 * ============================================================
 */

const authRateLimiter =
  createRateLimiter({
    windowMs:
      CONFIG.authWindowMs,

    max:
      CONFIG.authMax,

    namespace:
      "auth",

    /**
     * Authentication endpoints should primarily be limited
     * by IP because the attacker may not have a user ID.
     */

    keyGenerator(req) {
      const ip =
        req.ip ||
        req.socket?.remoteAddress ||
        "unknown";

      return `auth:${ip}`;
    }
  });


/**
 * ============================================================
 * PAYMENT LIMITER
 * ============================================================
 */

const paymentRateLimiter =
  createRateLimiter({
    windowMs:
      CONFIG.paymentWindowMs,

    max:
      CONFIG.paymentMax,

    namespace:
      "payment"
  });


/**
 * ============================================================
 * UPLOAD LIMITER
 * ============================================================
 */

const uploadRateLimiter =
  createRateLimiter({
    windowMs:
      CONFIG.uploadWindowMs,

    max:
      CONFIG.uploadMax,

    namespace:
      "upload"
  });


/**
 * ============================================================
 * SEARCH LIMITER
 * ============================================================
 */

const searchRateLimiter =
  createRateLimiter({
    windowMs:
      CONFIG.searchWindowMs,

    max:
      CONFIG.searchMax,

    namespace:
      "search"
  });


/**
 * ============================================================
 * AI LIMITER
 * ============================================================
 *
 * AI requests are intentionally stricter because they may
 * consume an external AI API and incur cost.
 *
 * ============================================================
 */

const aiRateLimiter =
  createRateLimiter({
    windowMs:
      CONFIG.aiWindowMs,

    max:
      CONFIG.aiMax,

    namespace:
      "ai"
  });


/**
 * ============================================================
 * USER-SPECIFIC LIMITER
 * ============================================================
 *
 * Useful for sensitive authenticated operations.
 * ============================================================
 */

function userRateLimiter({
  windowMs =
    15 * 60 * 1000,

  max =
    100,

  namespace =
    "user"
} = {}) {
  return createRateLimiter({
    windowMs,
    max,
    namespace,

    keyGenerator(req) {
      if (
        req.user?.id
      ) {
        return `${namespace}:user:${String(
          req.user.id
        )}`;
      }

      const ip =
        req.ip ||
        req.socket?.remoteAddress ||
        "unknown";

      return `${namespace}:ip:${ip}`;
    }
  });
}


/**
 * ============================================================
 * IP-SPECIFIC LIMITER
 * ============================================================
 */

function ipRateLimiter({
  windowMs =
    15 * 60 * 1000,

  max =
    100,

  namespace =
    "ip"
} = {}) {
  return createRateLimiter({
    windowMs,
    max,
    namespace,

    keyGenerator(req) {
      const ip =
        req.ip ||
        req.socket?.remoteAddress ||
        "unknown";

      return `${namespace}:${ip}`;
    }
  });
}


/**
 * ============================================================
 * CUSTOM KEY LIMITER
 * ============================================================
 *
 * Useful for:
 * - Email
 * - Phone
 * - OTP
 * - External IDs
 *
 * ============================================================
 */

function customKeyRateLimiter({
  getKey,

  windowMs =
    15 * 60 * 1000,

  max =
    20,

  namespace =
    "custom"
} = {}) {
  if (
    typeof getKey !==
    "function"
  ) {
    throw new TypeError(
      "customKeyRateLimiter requires getKey."
    );
  }

  return createRateLimiter({
    windowMs,
    max,
    namespace,

    keyGenerator(req) {
      const value =
        getKey(req);

      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        const ip =
          req.ip ||
          req.socket?.remoteAddress ||
          "unknown";

        return `${namespace}:ip:${ip}`;
      }

      return `${namespace}:${hashKey(
        value
      )}`;
    }
  });
}


/**
 * ============================================================
 * OTP LIMITER
 * ============================================================
 */

const otpRateLimiter =
  customKeyRateLimiter({
    windowMs:
      10 * 60 * 1000,

    max:
      5,

    namespace:
      "otp",

    getKey(req) {
      return (
        req.body?.email ||
        req.body?.phone ||
        req.body?.mobile ||
        req.ip
      );
    }
  });


/**
 * ============================================================
 * PASSWORD RESET LIMITER
 * ============================================================
 */

const passwordResetRateLimiter =
  customKeyRateLimiter({
    windowMs:
      15 * 60 * 1000,

    max:
      5,

    namespace:
      "password-reset",

    getKey(req) {
      return (
        req.body?.email ||
        req.body?.phone ||
        req.ip
      );
    }
  });


/**
 * ============================================================
 * LOGIN FAILURE LIMITER
 * ============================================================
 *
 * This should be combined with authentication logic.
 *
 * It does not replace password verification.
 * ============================================================
 */

const loginRateLimiter =
  customKeyRateLimiter({
    windowMs:
      15 * 60 * 1000,

    max:
      10,

    namespace:
      "login",

    getKey(req) {
      const email =
        req.body?.email ||
        req.body?.username ||
        req.body?.phone ||
        "";

      const ip =
        req.ip ||
        req.socket?.remoteAddress ||
        "";

      return `${email}:${ip}`;
    }
  });


/**
 * ============================================================
 * HEALTH CHECK EXEMPTION
 * ============================================================
 *
 * Health endpoints normally should remain available for Render
 * health checks.
 *
 * Use this only when appropriate.
 * ============================================================
 */

function skipHealthChecks(
  middleware
) {
  if (
    typeof middleware !==
    "function"
  ) {
    throw new TypeError(
      "skipHealthChecks requires a middleware function."
    );
  }

  return function healthAwareRateLimiter(
    req,
    res,
    next
  ) {
    const path =
      req.path ||
      req.originalUrl ||
      "";

    if (
      path === "/health" ||
      path === "/healthz" ||
      path === "/ready" ||
      path === "/readiness"
    ) {
      return next();
    }

    return middleware(
      req,
      res,
      next
    );
  };
}


/**
 * ============================================================
 * CLEANUP
 * ============================================================
 *
 * Prevents expired buckets from remaining in memory forever.
 * ============================================================
 */

const cleanupTimer =
  setInterval(
    () => {
      const now =
        Date.now();

      for (
        const [
          key,
          bucket
        ] of store.entries()
      ) {
        if (
          !bucket ||
          now >= bucket.resetAt
        ) {
          store.delete(key);
        }
      }
    },
    CONFIG.cleanupIntervalMs
  );


/**
 * Do not keep Node alive solely because of this timer.
 */

if (
  typeof cleanupTimer.unref ===
  "function"
) {
  cleanupTimer.unref();
}


/**
 * ============================================================
 * CLEAR STORE
 * ============================================================
 *
 * Useful for tests and controlled shutdown.
 * ============================================================
 */

function clearRateLimitStore() {
  store.clear();
}


/**
 * ============================================================
 * GET STORE SIZE
 * ============================================================
 *
 * Primarily useful for diagnostics/tests.
 * ============================================================
 */

function getRateLimitStoreSize() {
  return store.size;
}


/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  CONFIG,

  createRateLimiter,

  apiRateLimiter,

  authRateLimiter,

  paymentRateLimiter,

  uploadRateLimiter,

  searchRateLimiter,

  aiRateLimiter,

  otpRateLimiter,

  loginRateLimiter,

  passwordResetRateLimiter,

  userRateLimiter,

  ipRateLimiter,

  customKeyRateLimiter,

  skipHealthChecks,

  clearRateLimitStore,

  getRateLimitStoreSize
};