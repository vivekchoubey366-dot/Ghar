"use strict";

/**
 * In-memory rate limiter.
 * For multi-instance production deployments, use Redis/shared storage.
 */

function rateLimit(options = {}) {
  const windowMs = Number(options.windowMs) || 60_000;
  const max = Number(options.max) || 100;
  const keyGenerator =
    options.keyGenerator ||
    ((req) => req.ip || req.get("x-forwarded-for") || "unknown");

  const store = new Map();

  return (req, res, next) => {
    const key = String(keyGenerator(req));
    const now = Date.now();

    let record = store.get(key);

    if (!record || now >= record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      store.set(key, record);
    }

    record.count += 1;

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader(
      "X-RateLimit-Remaining",
      String(Math.max(0, max - record.count))
    );
    res.setHeader(
      "X-RateLimit-Reset",
      String(Math.ceil(record.resetAt / 1000))
    );

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((record.resetAt - now) / 1000),
          requestId: req.requestId || null
        }
      });
    }

    next();
  };
}

module.exports = { rateLimit };
