'use strict';

/**
 * ============================================================
 * GHAR - AI MIDDLEWARE
 * ============================================================
 *
 * Responsibilities:
 * - Protect AI endpoints
 * - Require authentication where needed
 * - Validate AI request payloads
 * - Enforce prompt/input limits
 * - Prevent empty or oversized requests
 * - Apply basic AI request rate limiting
 * - Prevent obvious prompt-injection control fields
 *
 * Authentication is handled separately by:
 *   middleware/auth.middleware.js
 *
 * Admin authorization is handled separately by:
 *   middleware/admin.middleware.js
 *
 * ============================================================
 */

const DEFAULT_MAX_PROMPT_LENGTH = 12000;
const DEFAULT_MAX_MESSAGES = 30;
const DEFAULT_MAX_MESSAGE_LENGTH = 6000;
const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_REQUESTS = 30;


/**
 * ------------------------------------------------------------
 * Internal in-memory rate-limit store
 * ------------------------------------------------------------
 *
 * For production with multiple Render instances, replace this
 * with Redis or another shared store.
 */

const requestStore = new Map();


/**
 * ------------------------------------------------------------
 * Get configuration from environment
 * ------------------------------------------------------------
 */

function getNumberEnv(
  name,
  fallback,
  minimum = 1
) {
  const value = Number(process.env[name]);

  if (
    Number.isFinite(value) &&
    value >= minimum
  ) {
    return value;
  }

  return fallback;
}


/**
 * ------------------------------------------------------------
 * Configuration
 * ------------------------------------------------------------
 */

const AI_CONFIG = Object.freeze({
  maxPromptLength: getNumberEnv(
    'AI_MAX_PROMPT_LENGTH',
    DEFAULT_MAX_PROMPT_LENGTH
  ),

  maxMessages: getNumberEnv(
    'AI_MAX_MESSAGES',
    DEFAULT_MAX_MESSAGES
  ),

  maxMessageLength: getNumberEnv(
    'AI_MAX_MESSAGE_LENGTH',
    DEFAULT_MAX_MESSAGE_LENGTH
  ),

  rateLimitWindowMs: getNumberEnv(
    'AI_RATE_LIMIT_WINDOW_MS',
    DEFAULT_WINDOW_MS
  ),

  rateLimitMaxRequests: getNumberEnv(
    'AI_RATE_LIMIT_MAX_REQUESTS',
    DEFAULT_MAX_REQUESTS
  )
});


/**
 * ------------------------------------------------------------
 * Authorization helper
 * ------------------------------------------------------------
 */

function requireAIUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to use this AI service.'
      }
    });
  }

  if (!req.user.id) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_USER',
        message: 'Authenticated user information is invalid.'
      }
    });
  }

  if (
    req.user.status &&
    !['active'].includes(req.user.status)
  ) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'Your account is not active.'
      }
    });
  }

  return next();
}


/**
 * ------------------------------------------------------------
 * Validate prompt
 * ------------------------------------------------------------
 */

function validatePrompt(req, res, next) {
  const prompt =
    req.body?.prompt ??
    req.body?.message ??
    req.body?.query;

  if (
    typeof prompt !== 'string' ||
    !prompt.trim()
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PROMPT',
        message: 'A non-empty AI prompt is required.'
      }
    });
  }

  const normalizedPrompt = prompt.trim();

  if (
    normalizedPrompt.length >
    AI_CONFIG.maxPromptLength
  ) {
    return res.status(413).json({
      success: false,
      error: {
        code: 'PROMPT_TOO_LARGE',
        message:
          `Prompt exceeds the maximum length of ` +
          `${AI_CONFIG.maxPromptLength} characters.`
      }
    });
  }

  req.aiPrompt = normalizedPrompt;

  return next();
}


/**
 * ------------------------------------------------------------
 * Validate chat messages
 * ------------------------------------------------------------
 */

function validateMessages(req, res, next) {
  const messages = req.body?.messages;

  if (!Array.isArray(messages)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_MESSAGES',
        message: 'messages must be an array.'
      }
    });
  }

  if (
    messages.length === 0
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'EMPTY_MESSAGES',
        message: 'At least one message is required.'
      }
    });
  }

  if (
    messages.length >
    AI_CONFIG.maxMessages
  ) {
    return res.status(413).json({
      success: false,
      error: {
        code: 'TOO_MANY_MESSAGES',
        message:
          `A maximum of ${AI_CONFIG.maxMessages} messages is allowed.`
      }
    });
  }

  const allowedRoles = new Set([
    'system',
    'user',
    'assistant'
  ]);

  for (const message of messages) {
    if (
      !message ||
      typeof message !== 'object'
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MESSAGE',
          message: 'Each message must be an object.'
        }
      });
    }

    if (
      typeof message.role !== 'string' ||
      !allowedRoles.has(message.role)
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MESSAGE_ROLE',
          message:
            'Message role must be system, user, or assistant.'
        }
      });
    }

    if (
      typeof message.content !== 'string' ||
      !message.content.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MESSAGE_CONTENT',
          message:
            'Message content must be a non-empty string.'
        }
      });
    }

    if (
      message.content.length >
      AI_CONFIG.maxMessageLength
    ) {
      return res.status(413).json({
        success: false,
        error: {
          code: 'MESSAGE_TOO_LARGE',
          message:
            `Each message must be at most ` +
            `${AI_CONFIG.maxMessageLength} characters.`
        }
      });
    }
  }

  req.aiMessages = messages;

  return next();
}


/**
 * ------------------------------------------------------------
 * Validate AI request body
 * ------------------------------------------------------------
 *
 * Useful for generic AI endpoints where either prompt or
 * messages may be accepted.
 */

function validateAIRequest(req, res, next) {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST_BODY',
        message: 'A valid JSON request body is required.'
      }
    });
  }

  const hasPrompt =
    typeof req.body.prompt === 'string' &&
    req.body.prompt.trim().length > 0;

  const hasMessage =
    typeof req.body.message === 'string' &&
    req.body.message.trim().length > 0;

  const hasQuery =
    typeof req.body.query === 'string' &&
    req.body.query.trim().length > 0;

  const hasMessages =
    Array.isArray(req.body.messages) &&
    req.body.messages.length > 0;

  if (
    !hasPrompt &&
    !hasMessage &&
    !hasQuery &&
    !hasMessages
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'AI_INPUT_REQUIRED',
        message:
          'Provide prompt, message, query, or messages.'
      }
    });
  }

  return next();
}


/**
 * ------------------------------------------------------------
 * AI rate limiter
 * ------------------------------------------------------------
 */

function aiRateLimit(
  req,
  res,
  next
) {
  const identifier =
    req.user?.id
      ? `user:${req.user.id}`
      : `ip:${req.ip}`;

  const now = Date.now();

  let entry = requestStore.get(identifier);

  if (!entry) {
    entry = {
      count: 0,
      resetAt:
        now +
        AI_CONFIG.rateLimitWindowMs
    };

    requestStore.set(
      identifier,
      entry
    );
  }

  if (
    now >= entry.resetAt
  ) {
    entry.count = 0;
    entry.resetAt =
      now +
      AI_CONFIG.rateLimitWindowMs;
  }

  entry.count += 1;

  const remaining = Math.max(
    0,
    AI_CONFIG.rateLimitMaxRequests -
      entry.count
  );

  const retryAfter = Math.ceil(
    (entry.resetAt - now) / 1000
  );

  res.setHeader(
    'X-AI-RateLimit-Limit',
    AI_CONFIG.rateLimitMaxRequests
  );

  res.setHeader(
    'X-AI-RateLimit-Remaining',
    remaining
  );

  res.setHeader(
    'X-AI-RateLimit-Reset',
    Math.ceil(
      entry.resetAt / 1000
    )
  );

  if (
    entry.count >
    AI_CONFIG.rateLimitMaxRequests
  ) {
    res.setHeader(
      'Retry-After',
      retryAfter
    );

    return res.status(429).json({
      success: false,
      error: {
        code: 'AI_RATE_LIMIT_EXCEEDED',
        message:
          'Too many AI requests. Please try again later.',
        retryAfter
      }
    });
  }

  return next();
}


/**
 * ------------------------------------------------------------
 * Validate AI model
 * ------------------------------------------------------------
 *
 * Prevents clients from arbitrarily selecting internal models.
 * The actual model should normally come from config/ai.js.
 */

function validateModelSelection(req, res, next) {
  if (
    req.body?.model &&
    typeof req.body.model !== 'string'
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_MODEL',
        message: 'Invalid AI model.'
      }
    });
  }

  if (
    req.body?.model &&
    req.body.model.length > 100
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_MODEL',
        message: 'AI model name is too long.'
      }
    });
  }

  return next();
}


/**
 * ------------------------------------------------------------
 * Validate AI temperature
 * ------------------------------------------------------------
 */

function validateTemperature(req, res, next) {
  if (
    req.body?.temperature === undefined
  ) {
    return next();
  }

  const temperature =
    Number(req.body.temperature);

  if (
    !Number.isFinite(temperature) ||
    temperature < 0 ||
    temperature > 2
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TEMPERATURE',
        message:
          'Temperature must be a number between 0 and 2.'
      }
    });
  }

  req.aiTemperature = temperature;

  return next();
}


/**
 * ------------------------------------------------------------
 * Sanitize AI metadata
 * ------------------------------------------------------------
 */

function sanitizeAIMetadata(req, res, next) {
  if (
    req.body?.metadata !== undefined &&
    (
      typeof req.body.metadata !== 'object' ||
      Array.isArray(req.body.metadata) ||
      req.body.metadata === null
    )
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_AI_METADATA',
        message:
          'AI metadata must be a JSON object.'
      }
    });
  }

  if (
    req.body?.metadata
  ) {
    const metadataKeys =
      Object.keys(req.body.metadata);

    if (
      metadataKeys.length > 30
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MUCH_METADATA',
          message:
            'Too many metadata fields were supplied.'
        }
      });
    }
  }

  return next();
}


/**
 * ------------------------------------------------------------
 * Clean up expired rate-limit records
 * ------------------------------------------------------------
 */

const cleanupInterval = setInterval(
  () => {
    const now = Date.now();

    for (
      const [
        key,
        entry
      ] of requestStore.entries()
    ) {
      if (
        now >= entry.resetAt
      ) {
        requestStore.delete(key);
      }
    }
  },
  DEFAULT_WINDOW_MS
);

if (
  typeof cleanupInterval.unref === 'function'
) {
  cleanupInterval.unref();
}


/**
 * ------------------------------------------------------------
 * Export
 * ------------------------------------------------------------
 */

module.exports = {
  requireAIUser,
  validatePrompt,
  validateMessages,
  validateAIRequest,
  aiRateLimit,
  validateModelSelection,
  validateTemperature,
  sanitizeAIMetadata,

  AI_CONFIG
};