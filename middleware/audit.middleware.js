'use strict';

/**
 * ============================================================
 * GHAR - AUDIT MIDDLEWARE
 * ============================================================
 *
 * Purpose:
 * - Record security-sensitive API actions
 * - Capture authenticated user information
 * - Capture IP address and user-agent
 * - Record HTTP method, route and response status
 * - Support resource/action metadata
 * - Never break the main request if audit logging fails
 *
 * Database:
 *   PostgreSQL
 *
 * Expected table:
 *   audit_logs
 *
 * Recommended usage:
 *
 * router.post(
 *   '/properties',
 *   requireAuth,
 *   auditAction('property', 'create'),
 *   propertyController.create
 * );
 *
 * ============================================================
 */

const db = require('../config/database');


/**
 * ------------------------------------------------------------
 * Sensitive fields
 * ------------------------------------------------------------
 *
 * Never store passwords, tokens, secrets or payment credentials
 * in audit metadata.
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'current_password',
  'new_password',
  'confirm_password',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'cookie',
  'secret',
  'api_key',
  'apiKey',
  'client_secret',
  'card_number',
  'cardNumber',
  'cvv',
  'cvc',
  'upi_pin',
  'otp'
]);


/**
 * ------------------------------------------------------------
 * Maximum metadata depth
 * ------------------------------------------------------------
 */

const MAX_DEPTH = 5;
const MAX_KEYS = 100;
const MAX_STRING_LENGTH = 2000;


/**
 * ------------------------------------------------------------
 * Sanitize audit data
 * ------------------------------------------------------------
 */

function sanitizeValue(
  value,
  depth = 0
) {
  if (depth > MAX_DEPTH) {
    return '[MAX_DEPTH]';
  }

  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (
    typeof value === 'string'
  ) {
    if (
      value.length > MAX_STRING_LENGTH
    ) {
      return (
        value.slice(
          0,
          MAX_STRING_LENGTH
        ) +
        '...[TRUNCATED]'
      );
    }

    return value;
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  if (
    Array.isArray(value)
  ) {
    return value
      .slice(0, MAX_KEYS)
      .map(item =>
        sanitizeValue(
          item,
          depth + 1
        )
      );
  }

  if (
    typeof value === 'object'
  ) {
    const output = {};
    const keys = Object.keys(value)
      .slice(0, MAX_KEYS);

    for (const key of keys) {
      if (
        SENSITIVE_KEYS.has(key) ||
        SENSITIVE_KEYS.has(
          key.toLowerCase()
        )
      ) {
        output[key] = '[REDACTED]';
        continue;
      }

      output[key] = sanitizeValue(
        value[key],
        depth + 1
      );
    }

    return output;
  }

  return String(value);
}


/**
 * ------------------------------------------------------------
 * Get client IP
 * ------------------------------------------------------------
 */

function getClientIp(req) {
  return (
    req.ip ||
    req.headers?.['x-forwarded-for']
      ?.split(',')[0]
      ?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
}


/**
 * ------------------------------------------------------------
 * Get user-agent
 * ------------------------------------------------------------
 */

function getUserAgent(req) {
  const userAgent =
    req.headers?.['user-agent'];

  if (
    !userAgent
  ) {
    return null;
  }

  return userAgent.slice(
    0,
    1000
  );
}


/**
 * ------------------------------------------------------------
 * Build audit metadata
 * ------------------------------------------------------------
 */

function buildAuditMetadata(
  req,
  options = {}
) {
  const metadata = {
    method: req.method,
    path: req.originalUrl ||
      req.url,

    route:
      req.route?.path ||
      null,

    ip_address:
      getClientIp(req),

    user_agent:
      getUserAgent(req),

    request_id:
      req.id ||
      req.headers?.['x-request-id'] ||
      null,

    ...options.metadata
  };

  if (
    options.includeParams &&
    req.params
  ) {
    metadata.params =
      sanitizeValue(
        req.params
      );
  }

  if (
    options.includeQuery &&
    req.query
  ) {
    metadata.query =
      sanitizeValue(
        req.query
      );
  }

  if (
    options.includeBody &&
    req.body
  ) {
    metadata.body =
      sanitizeValue(
        req.body
      );
  }

  return sanitizeValue(
    metadata
  );
}


/**
 * ------------------------------------------------------------
 * Write audit log
 * ------------------------------------------------------------
 *
 * This function intentionally does not throw into the main
 * request lifecycle.
 */

async function writeAuditLog({
  userId = null,
  action,
  resource = null,
  resourceId = null,
  metadata = {},
  ipAddress = null,
  userAgent = null
}) {
  try {
    if (!action) {
      return null;
    }

    const query = `
      INSERT INTO audit_logs (
        user_id,
        action,
        resource,
        resource_id,
        metadata,
        ip_address,
        user_agent,
        created_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5::jsonb,
        $6,
        $7,
        NOW()
      )
      RETURNING id
    `;

    const values = [
      userId,
      action,
      resource,
      resourceId
        ? String(resourceId)
        : null,
      JSON.stringify(
        sanitizeValue(metadata)
      ),
      ipAddress,
      userAgent
    ];

    const result =
      await db.query(
        query,
        values
      );

    return result.rows?.[0] || null;

  } catch (error) {
    /**
     * Audit failure must not normally make a successful
     * business operation fail.
     *
     * Log server-side only.
     */
    console.error(
      '[GHAR AUDIT] Failed to write audit log:',
      error.message
    );

    return null;
  }
}


/**
 * ------------------------------------------------------------
 * Audit successful/failed HTTP action
 * ------------------------------------------------------------
 *
 * Usage:
 *
 * auditAction('property', 'create')
 */

function auditAction(
  resource,
  action,
  options = {}
) {
  return function auditMiddleware(
    req,
    res,
    next
  ) {
    const originalEnd =
      res.end;

    let completed = false;

    res.end = function auditResponseEnd(
      ...args
    ) {
      if (!completed) {
        completed = true;

        const userId =
          req.user?.id ||
          null;

        const resourceId =
          options.getResourceId
            ? options.getResourceId(
                req,
                res
              )
            : req.params?.id ||
              req.params?.propertyId ||
              req.params?.userId ||
              null;

        const metadata =
          buildAuditMetadata(
            req,
            {
              includeParams:
                options.includeParams !== false,

              includeQuery:
                options.includeQuery === true,

              includeBody:
                options.includeBody === true,

              metadata: {
                status_code:
                  res.statusCode,

                success:
                  res.statusCode >= 200 &&
                  res.statusCode < 400,

                ...(options.metadata || {})
              }
            }
          );

        writeAuditLog({
          userId,
          action,
          resource,
          resourceId,
          metadata,
          ipAddress:
            getClientIp(req),
          userAgent:
            getUserAgent(req)
        }).catch(() => {
          // Intentionally ignored.
        });
      }

      return originalEnd.apply(
        this,
        args
      );
    };

    return next();
  };
}


/**
 * ------------------------------------------------------------
 * Audit all authenticated API requests
 * ------------------------------------------------------------
 *
 * Useful for security-sensitive routes.
 */

function auditRequest(
  options = {}
) {
  return function requestAuditMiddleware(
    req,
    res,
    next
  ) {
    const startTime =
      Date.now();

    const originalEnd =
      res.end;

    let completed = false;

    res.end = function auditRequestEnd(
      ...args
    ) {
      if (!completed) {
        completed = true;

        const duration =
          Date.now() -
          startTime;

        const metadata =
          buildAuditMetadata(
            req,
            {
              includeParams:
                options.includeParams === true,

              includeQuery:
                options.includeQuery === true,

              metadata: {
                status_code:
                  res.statusCode,

                duration_ms:
                  duration,

                success:
                  res.statusCode >= 200 &&
                  res.statusCode < 400
              }
            }
          );

        writeAuditLog({
          userId:
            req.user?.id ||
            null,

          action:
            options.action ||
            'api.request',

          resource:
            options.resource ||
            'api',

          resourceId:
            options.getResourceId
              ? options.getResourceId(
                  req,
                  res
                )
              : null,

          metadata,

          ipAddress:
            getClientIp(req),

          userAgent:
            getUserAgent(req)
        }).catch(() => {
          // Intentionally ignored.
        });
      }

      return originalEnd.apply(
        this,
        args
      );
    };

    return next();
  };
}


/**
 * ------------------------------------------------------------
 * Manually create an audit event
 * ------------------------------------------------------------
 *
 * Controllers/services can use:
 *
 * const {
 *   recordAudit
 * } = require('../middleware/audit.middleware');
 *
 * await recordAudit(req, {
 *   action: 'property.approved',
 *   resource: 'property',
 *   resourceId: property.id
 * });
 */

async function recordAudit(
  req,
  {
    action,
    resource = null,
    resourceId = null,
    metadata = {}
  } = {}
) {
  return writeAuditLog({
    userId:
      req.user?.id ||
      null,

    action,

    resource,

    resourceId,

    metadata: {
      ...metadata,

      method:
        req.method,

      path:
        req.originalUrl ||
        req.url
    },

    ipAddress:
      getClientIp(req),

    userAgent:
      getUserAgent(req)
  });
}


/**
 * ------------------------------------------------------------
 * Security event helper
 * ------------------------------------------------------------
 */

async function recordSecurityEvent(
  req,
  action,
  metadata = {}
) {
  return recordAudit(
    req,
    {
      action,
      resource: 'security',
      metadata
    }
  );
}


/**
 * ------------------------------------------------------------
 * Authentication event helper
 * ------------------------------------------------------------
 */

async function recordAuthEvent(
  req,
  action,
  metadata = {}
) {
  return recordAudit(
    req,
    {
      action,
      resource: 'authentication',
      metadata
    }
  );
}


/**
 * ------------------------------------------------------------
 * Export
 * ------------------------------------------------------------
 */

module.exports = {
  auditAction,
  auditRequest,
  recordAudit,
  recordSecurityEvent,
  recordAuthEvent,
  writeAuditLog,

  getClientIp,
  getUserAgent,
  sanitizeValue
};