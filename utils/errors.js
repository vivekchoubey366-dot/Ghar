class AppError extends Error {
  constructor(message, status = 500, code = 'APP_ERROR', details = undefined) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = []) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_REQUIRED');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'ACCESS_DENIED');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

function normalizeError(err) {
  if (err instanceof AppError) return err;
  const wrapped = new AppError(err?.message || 'Internal server error', err?.status || 500);
  wrapped.stack = err?.stack || wrapped.stack;
  return wrapped;
}

module.exports = {
  AppError, ValidationError, AuthenticationError,
  AuthorizationError, NotFoundError, normalizeError
};
