"use strict";

function normalizeError(error) {
  const status = Number(error?.statusCode || error?.status) || 500;

  return {
    status: status >= 400 && status <= 599 ? status : 500,
    code: error?.code || "INTERNAL_SERVER_ERROR",
    message:
      status >= 500
        ? "An internal server error occurred."
        : error?.message || "Request failed."
  };
}

function errorMiddleware(error, req, res, next) {
  if (res.headersSent) return next(error);

  const normalized = normalizeError(error);

  if (process.env.NODE_ENV !== "test") {
    console.error(
      `[GHAR ERROR] ${req.requestId || "-"} ${req.method} ${req.originalUrl || req.url}`,
      error
    );
  }

  const response = {
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      requestId: req.requestId || null
    }
  };

  if (process.env.NODE_ENV !== "production" && error?.details) {
    response.error.details = error.details;
  }

  res.status(normalized.status).json(response);
}

module.exports = { errorMiddleware, normalizeError };
