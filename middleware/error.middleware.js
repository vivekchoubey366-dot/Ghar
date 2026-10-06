"use strict";

/**
 * ============================================================
 * GHAR - GLOBAL ERROR MIDDLEWARE
 * ============================================================
 *
 * Responsibilities:
 * - Handle all unhandled Express errors
 * - Return one consistent API error format
 * - Prevent internal error details from leaking in production
 * - Preserve requestId for debugging/tracing
 * - Handle common PostgreSQL / JWT / validation errors
 * - Log unexpected server errors
 *
 * IMPORTANT:
 * This middleware must be registered LAST in server.js.
 *
 * ============================================================
 */


/**
 * ------------------------------------------------------------
 * Environment
 * ------------------------------------------------------------
 */

const NODE_ENV =
  process.env.NODE_ENV || "development";

const IS_PRODUCTION =
  NODE_ENV === "production";


/**
 * ------------------------------------------------------------
 * Safe error logging
 * ------------------------------------------------------------
 */

function logError(
  error,
  req
) {
  const requestId =
    req?.requestId || null;

  const method =
    req?.method || "UNKNOWN";

  const path =
    req?.originalUrl ||
    req?.url ||
    "UNKNOWN";

  console.error(
    "[GHAR ERROR]",
    {
      requestId,
      method,
      path,
      name: error?.name,
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    }
  );
}


/**
 * ------------------------------------------------------------
 * Build standard error response
 * ------------------------------------------------------------
 */

function sendError(
  res,
  {
    status = 500,
    code = "INTERNAL_SERVER_ERROR",
    message = "An unexpected error occurred.",
    requestId = null,
    details = undefined
  }
) {
  const response = {
    success: false,

    error: {
      code,
      message,
      requestId
    }
  };

  /**
   * Do not expose internal details in production unless they
   * are explicitly safe.
   */
  if (
    details !== undefined &&
    !IS_PRODUCTION
  ) {
    response.error.details = details;
  }

  return res
    .status(status)
    .json(response);
}


/**
 * ------------------------------------------------------------
 * PostgreSQL error handler
 * ------------------------------------------------------------
 */

function handleDatabaseError(
  error,
  req,
  res
) {
  /**
   * PostgreSQL unique_violation
   */
  if (
    error?.code === "23505"
  ) {
    return sendError(
      res,
      {
        status: 409,
        code: "DUPLICATE_RESOURCE",
        message:
          "A resource with the supplied information already exists.",
        requestId:
          req.requestId
      }
    );
  }


  /**
   * PostgreSQL foreign_key_violation
   */
  if (
    error?.code === "23503"
  ) {
    return sendError(
      res,
      {
        status: 409,
        code: "REFERENCE_CONSTRAINT_FAILED",
        message:
          "The requested operation references a resource that does not exist or cannot be changed.",
        requestId:
          req.requestId
      }
    );
  }


  /**
   * PostgreSQL not_null_violation
   */
  if (
    error?.code === "23502"
  ) {
    return sendError(
      res,
      {
        status: 400,
        code: "REQUIRED_FIELD_MISSING",
        message:
          "A required field is missing.",
        requestId:
          req.requestId
      }
    );
  }


  /**
   * PostgreSQL check_violation
   */
  if (
    error?.code === "23514"
  ) {
    return sendError(
      res,
      {
        status: 400,
        code: "DATABASE_VALIDATION_FAILED",
        message:
          "The supplied information does not satisfy the required constraints.",
        requestId:
          req.requestId
      }
    );
  }


  /**
   * PostgreSQL invalid_text_representation
   */
  if (
    error?.code === "22P02"
  ) {
    return sendError(
      res,
      {
        status: 400,
        code: "INVALID_DATABASE_VALUE",
        message:
          "One or more supplied values are invalid.",
        requestId:
          req.requestId
      }
    );
  }


  /**
   * PostgreSQL undefined_table
   */
  if (
    error?.code === "42P01"
  ) {
    return sendError(
      res,
      {
        status: 500,
        code: "DATABASE_CONFIGURATION_ERROR",
        message:
          "A database configuration error occurred.",
        requestId:
          req.requestId
      }
    );
  }


  return null;
}


/**
 * ------------------------------------------------------------
 * JWT error handler
 * ------------------------------------------------------------
 */

function handleJwtError(
  error,
  req,
  res
) {
  if (
    error?.name === "TokenExpiredError"
  ) {
    return sendError(
      res,
      {
        status: 401,
        code: "TOKEN_EXPIRED",
        message:
          "Your session has expired. Please sign in again.",
        requestId:
          req.requestId
      }
    );
  }


  if (
    error?.name === "JsonWebTokenError"
  ) {
    return sendError(
      res,
      {
        status: 401,
        code: "INVALID_TOKEN",
        message:
          "The authentication token is invalid.",
        requestId:
          req.requestId
      }
    );
  }


  if (
    error?.name === "NotBeforeError"
  ) {
    return sendError(
      res,
      {
        status: 401,
        code: "TOKEN_NOT_ACTIVE",
        message:
          "The authentication token is not active yet.",
        requestId:
          req.requestId
      }
    );
  }


  return null;
}


/**
 * ------------------------------------------------------------
 * Validation error handler
 * ------------------------------------------------------------
 */

function handleValidationError(
  error,
  req,
  res
) {
  /**
   * Common custom validation error:
   *
   * error.status = 400
   * error.code = "VALIDATION_ERROR"
   */

  if (
    error?.code === "VALIDATION_ERROR" ||
    error?.name === "ValidationError"
  ) {
    return sendError(
      res,
      {
        status:
          error.status || 400,

        code:
          error.code === "VALIDATION_ERROR"
            ? "VALIDATION_ERROR"
            : "INVALID_REQUEST",

        message:
          error.message ||
          "The supplied information is invalid.",

        requestId:
          req.requestId,

        details:
          error.details ||
          error.errors
      }
    );
  }


  /**
   * express-validator style errors
   */

  if (
    Array.isArray(error?.errors)
  ) {
    return sendError(
      res,
      {
        status: 400,

        code:
          "VALIDATION_ERROR",

        message:
          "One or more fields contain invalid values.",

        requestId:
          req.requestId,

        details:
          error.errors
      }
    );
  }


  return null;
}


/**
 * ------------------------------------------------------------
 * Multer upload error handler
 * ------------------------------------------------------------
 */

function handleUploadError(
  error,
  req,
  res
) {
  if (
    error?.name !== "MulterError"
  ) {
    return null;
  }


  if (
    error.code === "LIMIT_FILE_SIZE"
  ) {
    return sendError(
      res,
      {
        status: 413,
        code: "FILE_TOO_LARGE",
        message:
          "The uploaded file exceeds the allowed size.",
        requestId:
          req.requestId
      }
    );
  }


  if (
    error.code === "LIMIT_FILE_COUNT"
  ) {
    return sendError(
      res,
      {
        status: 413,
        code: "TOO_MANY_FILES",
        message:
          "Too many files were uploaded.",
        requestId:
          req.requestId
      }
    );
  }


  if (
    error.code === "LIMIT_UNEXPECTED_FILE"
  ) {
    return sendError(
      res,
      {
        status: 400,
        code: "UNEXPECTED_FILE",
        message:
          "An unexpected file was uploaded.",
        requestId:
          req.requestId
      }
    );
  }


  return sendError(
    res,
    {
      status: 400,
      code: "UPLOAD_ERROR",
      message:
        "The file upload could not be processed.",
      requestId:
        req.requestId
    }
  );
}


/**
 * ------------------------------------------------------------
 * HTTP status error handler
 * ------------------------------------------------------------
 */

function handleHttpError(
  error,
  req,
  res
) {
  const status =
    Number(error?.status) ||
    Number(error?.statusCode);

  if (
    !Number.isInteger(status) ||
    status < 400 ||
    status > 599
  ) {
    return null;
  }


  /**
   * Never allow a middleware error to return a 2xx status.
   */

  const safeStatus =
    status >= 400 &&
    status <= 599
      ? status
      : 500;


  return sendError(
    res,
    {
      status: safeStatus,

      code:
        error.code ||
        getDefaultHttpCode(
          safeStatus
        ),

      message:
        getSafeHttpMessage(
          error,
          safeStatus
        ),

      requestId:
        req.requestId
    }
  );
}


/**
 * ------------------------------------------------------------
 * Default HTTP error codes
 * ------------------------------------------------------------
 */

function getDefaultHttpCode(
  status
) {
  const codes = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    415: "UNSUPPORTED_MEDIA_TYPE",
    422: "UNPROCESSABLE_ENTITY",
    429: "TOO_MANY_REQUESTS",
    500: "INTERNAL_SERVER_ERROR",
    502: "BAD_GATEWAY",
    503: "SERVICE_UNAVAILABLE",
    504: "GATEWAY_TIMEOUT"
  };

  return (
    codes[status] ||
    "HTTP_ERROR"
  );
}


/**
 * ------------------------------------------------------------
 * Safe error message
 * ------------------------------------------------------------
 */

function getSafeHttpMessage(
  error,
  status
) {
  /**
   * In production, don't expose arbitrary 5xx error messages.
   */

  if (
    IS_PRODUCTION &&
    status >= 500
  ) {
    return "An unexpected server error occurred.";
  }

  return (
    error?.message ||
    "The request could not be processed."
  );
}


/**
 * ------------------------------------------------------------
 * 404 Not Found middleware
 * ------------------------------------------------------------
 *
 * This is NOT the final error middleware.
 * Register it immediately before errorHandler.
 * ------------------------------------------------------------
 */

function notFoundHandler(
  req,
  res
) {
  return sendError(
    res,
    {
      status: 404,
      code: "ROUTE_NOT_FOUND",
      message:
        `Route ${req.method} ${req.originalUrl} was not found.`,
      requestId:
        req.requestId
    }
  );
}


/**
 * ------------------------------------------------------------
 * Main global error handler
 * ------------------------------------------------------------
 *
 * Express recognizes this as an error middleware because
 * it has four parameters.
 * ------------------------------------------------------------
 */

function errorHandler(
  error,
  req,
  res,
  next
) {
  /**
   * If headers were already sent, delegate to Express's
   * default error handler.
   */

  if (
    res.headersSent
  ) {
    return next(error);
  }


  /**
   * Always log the original server-side error.
   */

  logError(
    error,
    req
  );


  /**
   * PostgreSQL
   */

  const databaseResponse =
    handleDatabaseError(
      error,
      req,
      res
    );

  if (
    databaseResponse
  ) {
    return databaseResponse;
  }


  /**
   * JWT
   */

  const jwtResponse =
    handleJwtError(
      error,
      req,
      res
    );

  if (
    jwtResponse
  ) {
    return jwtResponse;
  }


  /**
   * Validation
   */

  const validationResponse =
    handleValidationError(
      error,
      req,
      res
    );

  if (
    validationResponse
  ) {
    return validationResponse;
  }


  /**
   * File uploads
   */

  const uploadResponse =
    handleUploadError(
      error,
      req,
      res
    );

  if (
    uploadResponse
  ) {
    return uploadResponse;
  }


  /**
   * Explicit HTTP errors
   */

  const httpResponse =
    handleHttpError(
      error,
      req,
      res
    );

  if (
    httpResponse
  ) {
    return httpResponse;
  }


  /**
   * ----------------------------------------------------------
   * Unknown/unhandled error
   * ----------------------------------------------------------
   */

  return sendError(
    res,
    {
      status: 500,

      code:
        error?.code ===
        "ECONNREFUSED"
          ? "SERVICE_CONNECTION_ERROR"
          : "INTERNAL_SERVER_ERROR",

      message:
        IS_PRODUCTION
          ? "An unexpected server error occurred."
          : (
              error?.message ||
              "An unexpected server error occurred."
            ),

      requestId:
        req.requestId,

      details:
        IS_PRODUCTION
          ? undefined
          : {
              name:
                error?.name,

              stack:
                error?.stack
            }
    }
  );
}


/**
 * ------------------------------------------------------------
 * Async error wrapper
 * ------------------------------------------------------------
 *
 * Useful if you don't use an Express async-error package.
 *
 * Example:
 *
 * router.get(
 *   "/",
 *   asyncHandler(controller.getSomething)
 * );
 * ------------------------------------------------------------
 */

function asyncHandler(
  handler
) {
  return function wrappedHandler(
    req,
    res,
    next
  ) {
    Promise
      .resolve(
        handler(
          req,
          res,
          next
        )
      )
      .catch(next);
  };
}


/**
 * ------------------------------------------------------------
 * Export
 * ------------------------------------------------------------
 */

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  sendError
};