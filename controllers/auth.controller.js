'use strict';

/**
 * ============================================================
 * GHAR - Authentication Controller
 * ============================================================
 *
 * Handles:
 * - Registration
 * - Login
 * - Logout
 * - Refresh token
 * - Current user
 * - Email verification
 * - Phone verification
 * - Password reset
 * - Password change
 * - OTP
 * - Session management
 *
 * Controller = HTTP/API layer only.
 *
 * Business logic belongs in:
 *     services/auth.service.js
 *
 * Authentication middleware belongs in:
 *     middleware/auth.middleware.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE
   ============================================================ */

function getAuthService() {
  try {
    return require('../services/auth.service');
  } catch (error) {
    return null;
  }
}

/* ============================================================
   RESPONSE HELPERS
   ============================================================ */

function success(
  res,
  data = {},
  message = 'Success',
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function failure(
  res,
  statusCode,
  message,
  error = null
) {
  const response = {
    success: false,
    message
  };

  if (
    config?.env?.app?.environment !==
    'production'
  ) {
    if (error) {
      response.error =
        error.message ||
        String(error);
    }
  }

  return res
    .status(statusCode)
    .json(response);
}

/* ============================================================
   USER HELPERS
   ============================================================ */

function getUserId(req) {
  return (
    req.user?.id ||
    req.user?.userId ||
    null
  );
}

/* ============================================================
   VALIDATION
   ============================================================ */

function normalizeEmail(email) {
  if (
    typeof email !== 'string'
  ) {
    return null;
  }

  const value =
    email.trim().toLowerCase();

  return value || null;
}

function normalizePhone(phone) {
  if (
    typeof phone !== 'string'
  ) {
    return null;
  }

  const value =
    phone.trim();

  return value || null;
}

function validateEmail(email) {
  if (!email) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);
}

function validatePassword(password) {
  if (
    typeof password !== 'string'
  ) {
    return false;
  }

  const minimumLength =
    Number(
      process.env.AUTH_PASSWORD_MIN_LENGTH ||
      8
    );

  return (
    password.length >=
    minimumLength
  );
}

function validateRequired(
  body,
  fields
) {
  const missing = [];

  for (const field of fields) {
    const value =
      body?.[field];

    if (
      value === undefined ||
      value === null ||
      (
        typeof value ===
          'string' &&
        !value.trim()
      )
    ) {
      missing.push(field);
    }
  }

  return missing;
}

/* ============================================================
   AUDIT LOG
   ============================================================ */

async function createAuditLog(
  req,
  action,
  userId = null,
  metadata = {}
) {
  try {
    let auditService = null;

    try {
      auditService =
        require('../services/audit.service');
    } catch {
      return;
    }

    if (
      typeof auditService.create !==
      'function'
    ) {
      return;
    }

    await auditService.create({
      userId,

      action,

      resource: 'auth',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.['user-agent'] ||
        null
    });
  } catch (error) {
    console.error(
      '[AUTH AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. REGISTER
   ============================================================ */

/**
 * POST /api/auth/register
 *
 * Body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "phone": "+919999999999",
 *   "password": "********",
 *   "role": "buyer"
 * }
 */

async function register(
  req,
  res
) {
  try {
    const body =
      req.body || {};

    const missing =
      validateRequired(
        body,
        [
          'name',
          'password'
        ]
      );

    if (
      missing.length
    ) {
      return failure(
        res,
        400,
        `Missing required fields: ${missing.join(', ')}`
      );
    }

    const email =
      normalizeEmail(
        body.email
      );

    const phone =
      normalizePhone(
        body.phone
      );

    if (
      !email &&
      !phone
    ) {
      return failure(
        res,
        400,
        'Email or phone number is required.'
      );
    }

    if (
      email &&
      !validateEmail(email)
    ) {
      return failure(
        res,
        400,
        'Invalid email address.'
      );
    }

    if (
      !validatePassword(
        body.password
      )
    ) {
      return failure(
        res,
        400,
        `Password must contain at least ${
          process.env.AUTH_PASSWORD_MIN_LENGTH ||
          8
        } characters.`
      );
    }

    const service =
      getAuthService();

    if (!service) {
      return failure(
        res,
        503,
        'Authentication service is unavailable.'
      );
    }

    if (
      typeof service.register !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Registration service is not implemented.'
      );
    }

    const result =
      await service.register({
        name:
          body.name.trim(),

        email,

        phone,

        password:
          body.password,

        role:
          body.role ||
          'buyer',

        metadata:
          body.metadata ||
          {}
      });

    await createAuditLog(
      req,
      'AUTH_REGISTER',
      result?.user?.id ||
        result?.id ||
        null
    );

    return success(
      res,
      result,
      'Registration successful.',
      201
    );
  } catch (error) {
    console.error(
      '[AUTH] Registration error:',
      error
    );

    if (
      error?.code ===
      'USER_EXISTS'
    ) {
      return failure(
        res,
        409,
        'An account already exists.'
      );
    }

    return failure(
      res,
      500,
      'Unable to complete registration.',
      error
    );
  }
}

/* ============================================================
   2. LOGIN
   ============================================================ */

/**
 * POST /api/auth/login
 *
 * Body:
 * {
 *   "identifier": "john@example.com",
 *   "password": "********"
 * }
 */

async function login(
  req,
  res
) {
  try {
    const body =
      req.body || {};

    const identifier =
      typeof body.identifier ===
      'string'
        ? body.identifier.trim()
        : (
            normalizeEmail(
              body.email
            ) ||
            normalizePhone(
              body.phone
            )
          );

    if (!identifier) {
      return failure(
        res,
        400,
        'Email, phone number or identifier is required.'
      );
    }

    if (
      typeof body.password !==
      'string' ||
      !body.password
    ) {
      return failure(
        res,
        400,
        'Password is required.'
      );
    }

    const service =
      getAuthService();

    if (!service) {
      return failure(
        res,
        503,
        'Authentication service is unavailable.'
      );
    }

    if (
      typeof service.login !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Login service is not implemented.'
      );
    }

    const result =
      await service.login({
        identifier,

        password:
          body.password,

        rememberMe:
          Boolean(
            body.rememberMe
          ),

        ipAddress:
          req.ip || null,

        userAgent:
          req.headers?.[
            'user-agent'
          ] || null
      });

    await createAuditLog(
      req,
      'AUTH_LOGIN',
      result?.user?.id ||
        null
    );

    return success(
      res,
      result,
      'Login successful.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Login error:',
      error
    );

    if (
      error?.code ===
        'INVALID_CREDENTIALS' ||
      error?.code ===
        'AUTH_INVALID_CREDENTIALS'
    ) {
      return failure(
        res,
        401,
        'Invalid credentials.'
      );
    }

    if (
      error?.code ===
      'ACCOUNT_LOCKED'
    ) {
      return failure(
        res,
        423,
        'Account is temporarily locked.'
      );
    }

    if (
      error?.code ===
      'EMAIL_NOT_VERIFIED'
    ) {
      return failure(
        res,
        403,
        'Please verify your email address before logging in.'
      );
    }

    return failure(
      res,
      500,
      'Unable to complete login.',
      error
    );
  }
}

/* ============================================================
   3. LOGOUT
   ============================================================ */

/**
 * POST /api/auth/logout
 */

async function logout(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const service =
      getAuthService();

    if (!service) {
      return failure(
        res,
        503,
        'Authentication service is unavailable.'
      );
    }

    if (
      typeof service.logout !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Logout service is not implemented.'
      );
    }

    const result =
      await service.logout({
        userId,

        refreshToken:
          req.body?.refreshToken ||
          null,

        accessToken:
          req.headers?.authorization ||
          null
      });

    await createAuditLog(
      req,
      'AUTH_LOGOUT',
      userId
    );

    return success(
      res,
      result,
      'Logout successful.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Logout error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to complete logout.',
      error
    );
  }
}

/* ============================================================
   4. REFRESH TOKEN
   ============================================================ */

/**
 * POST /api/auth/refresh
 */

async function refreshToken(
  req,
  res
) {
  try {
    const token =
      req.body?.refreshToken;

    if (
      typeof token !==
        'string' ||
      !token.trim()
    ) {
      return failure(
        res,
        400,
        'Refresh token is required.'
      );
    }

    const service =
      getAuthService();

    if (!service) {
      return failure(
        res,
        503,
        'Authentication service is unavailable.'
      );
    }

    if (
      typeof service.refreshToken !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Token refresh service is not implemented.'
      );
    }

    const result =
      await service.refreshToken({
        refreshToken:
          token.trim()
      });

    return success(
      res,
      result,
      'Token refreshed successfully.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Refresh error:',
      error
    );

    return failure(
      res,
      401,
      'Invalid or expired refresh token.'
    );
  }
}

/* ============================================================
   5. CURRENT USER
   ============================================================ */

/**
 * GET /api/auth/me
 */

async function me(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const service =
      getAuthService();

    if (!service) {
      return failure(
        res,
        503,
        'Authentication service is unavailable.'
      );
    }

    const method =
      service.getCurrentUser ||
      service.getUser;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Current-user service is not implemented.'
      );
    }

    const user =
      await method.call(
        service,
        {
          userId
        }
      );

    if (!user) {
      return failure(
        res,
        404,
        'User account not found.'
      );
    }

    return success(
      res,
      user,
      'Current user retrieved.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Me error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve current user.',
      error
    );
  }
}

/* ============================================================
   6. VERIFY EMAIL
   ============================================================ */

/**
 * POST /api/auth/verify-email
 */

async function verifyEmail(
  req,
  res
) {
  try {
    const token =
      req.body?.token ||
      req.query?.token;

    if (
      typeof token !==
        'string' ||
      !token.trim()
    ) {
      return failure(
        res,
        400,
        'Email verification token is required.'
      );
    }

    const service =
      getAuthService();

    if (!service) {
      return failure(
        res,
        503,
        'Authentication service is unavailable.'
      );
    }

    if (
      typeof service.verifyEmail !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Email verification is not implemented.'
      );
    }

    const result =
      await service.verifyEmail({
        token:
          token.trim()
      });

    return success(
      res,
      result,
      'Email verified successfully.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Email verification error:',
      error
    );

    return failure(
      res,
      400,
      'Invalid or expired email verification token.'
    );
  }
}

/* ============================================================
   7. RESEND EMAIL VERIFICATION
   ============================================================ */

/**
 * POST /api/auth/resend-verification
 */

async function resendVerification(
  req,
  res
) {
  try {
    const email =
      normalizeEmail(
        req.body?.email
      );

    if (
      !email ||
      !validateEmail(email)
    ) {
      return failure(
        res,
        400,
        'Valid email address is required.'
      );
    }

    const service =
      getAuthService();

    if (!service) {
      return failure(
        res,
        503,
        'Authentication service is unavailable.'
      );
    }

    const method =
      service.resendVerificationEmail ||
      service.resendEmailVerification;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Email verification resend is not implemented.'
      );
    }

    await method.call(
      service,
      {
        email
      }
    );

    /*
     * Generic response helps prevent
     * account enumeration.
     */

    return success(
      res,
      {},
      'If the account exists, a verification email has been sent.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Resend verification error:',
      error
    );

    return success(
      res,
      {},
      'If the account exists, a verification email has been sent.'
    );
  }
}

/* ============================================================
   8. SEND OTP
   ============================================================ */

/**
 * POST /api/auth/send-otp
 */

async function sendOTP(
  req,
  res
) {
  try {
    const email =
      normalizeEmail(
        req.body?.email
      );

    const phone =
      normalizePhone(
        req.body?.phone
      );

    if (
      !email &&
      !phone
    ) {
      return failure(
        res,
        400,
        'Email or phone number is required.'
      );
    }

    const service =
      getAuthService();

    if (!service) {
      return failure(
        res,
        503,
        'Authentication service is unavailable.'
      );
    }

    const method =
      service.sendOTP ||
      service.sendOtp;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'OTP service is not implemented.'
      );
    }

    await method.call(
      service,
      {
        email,

        phone,

        purpose:
          req.body?.purpose ||
          'authentication'
      }
    );

    return success(
      res,
      {},
      'If the account is eligible, an OTP has been sent.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Send OTP error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to send OTP.',
      error
    );
  }
}

/* ============================================================
   9. VERIFY OTP
   ============================================================ */

/**
 * POST /api/auth/verify-otp
 */

async function verifyOTP(
  req,
  res
) {
  try {
    const otp =
      typeof req.body?.otp ===
      'string'
        ? req.body.otp.trim()
        : String(
            req.body?.otp ||
            ''
          ).trim();

    if (!otp) {
      return failure(
        res,
        400,
        'OTP is required.'
      );
    }

    const email =
      normalizeEmail(
        req.body?.email
      );

    const phone =
      normalizePhone(
        req.body?.phone
      );

    if (
      !email &&
      !phone
    ) {
      return failure(
        res,
        400,
        'Email or phone number is required.'
      );
    }

    const service =
      getAuthService();

    if (!service) {
      return failure(
        res,
        503,
        'Authentication service is unavailable.'
      );
    }

    const method =
      service.verifyOTP ||
      service.verifyOtp;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'OTP verification is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          email,

          phone,

          otp,

          purpose:
            req.body?.purpose ||
            'authentication'
        }
      );

    return success(
      res,
      result,
      'OTP verified successfully.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Verify OTP error:',
      error
    );

    return failure(
      res,
      400,
      'Invalid or expired OTP.'
    );
  }
}

/* ============================================================
   10. FORGOT PASSWORD
   ============================================================ */

/**
 * POST /api/auth/forgot-password
 */

async function forgotPassword(
  req,
  res
) {
  try {
    const email =
      normalizeEmail(
        req.body?.email
      );

    if (
      !email ||
      !validateEmail(email)
    ) {
      return failure(
        res,
        400,
        'Valid email address is required.'
      );
    }

    const service =
      getAuthService();

    if (!service) {
      return failure(
        res,
        503,
        'Authentication service is unavailable.'
      );
    }

    const method =
      service.forgotPassword ||
      service.requestPasswordReset;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Password reset service is not implemented.'
      );
    }

    await method.call(
      service,
      {
        email
      }
    );

    /*
     * Generic response prevents account enumeration.
     */

    return success(
      res,
      {},
      'If the account exists, password reset instructions have been sent.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Forgot password error:',
      error
    );

    return success(
      res,
      {},
      'If the account exists, password reset instructions have been sent.'
    );
  }
}

/* ============================================================
   11. RESET PASSWORD
   ============================================================ */

/**
 * POST /api/auth/reset-password
 */

async function resetPassword(
  req,
  res
) {
  try {
    const token =
      typeof req.body?.token ===
      'string'
        ? req.body.token.trim()
        : '';

    const password =
      req.body?.password;

    if (!token) {
      return failure(
        res,
        400,
        'Password reset token is required.'
      );
    }

    if (
      !validatePassword(
        password
      )
    ) {
      return failure(
        res,
        400,
        `Password must contain at least ${
          process.env.AUTH_PASSWORD_MIN_LENGTH ||
          8
        } characters.`
      );
    }

    const service =
      getAuthService();

    if (!service) {
      return failure(
        res,
        503,
        'Authentication service is unavailable.'
      );
    }

    const method =
      service.resetPassword;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Password reset is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          token,

          password
        }
      );

    return success(
      res,
      result,
      'Password reset successfully.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Reset password error:',
      error
    );

    return failure(
      res,
      400,
      'Invalid or expired password reset token.'
    );
  }
}

/* ============================================================
   12. CHANGE PASSWORD
   ============================================================ */

/**
 * POST /api/auth/change-password
 */

async function changePassword(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const currentPassword =
      req.body?.currentPassword;

    const newPassword =
      req.body?.newPassword;

    if (
      typeof currentPassword !==
        'string' ||
      !currentPassword
    ) {
      return failure(
        res,
        400,
        'Current password is required.'
      );
    }

    if (
      !validatePassword(
        newPassword
      )
    ) {
      return failure(
        res,
        400,
        `New password must contain at least ${
          process.env.AUTH_PASSWORD_MIN_LENGTH ||
          8
        } characters.`
      );
    }

    const service =
      getAuthService();

    if (!service) {
      return failure(
        res,
        503,
        'Authentication service is unavailable.'
      );
    }

    if (
      typeof service.changePassword !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Password change is not implemented.'
      );
    }

    const result =
      await service.changePassword({
        userId,

        currentPassword,

        newPassword
      });

    await createAuditLog(
      req,
      'AUTH_PASSWORD_CHANGED',
      userId
    );

    return success(
      res,
      result,
      'Password changed successfully.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Change password error:',
      error
    );

    if (
      error?.code ===
      'INVALID_CURRENT_PASSWORD'
    ) {
      return failure(
        res,
        401,
        'Current password is incorrect.'
      );
    }

    return failure(
      res,
      500,
      'Unable to change password.',
      error
    );
  }
}

/* ============================================================
   13. VERIFY PHONE
   ============================================================ */

/**
 * POST /api/auth/verify-phone
 */

async function verifyPhone(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const otp =
      typeof req.body?.otp ===
      'string'
        ? req.body.otp.trim()
        : String(
            req.body?.otp ||
            ''
          ).trim();

    if (!otp) {
      return failure(
        res,
        400,
        'OTP is required.'
      );
    }

    const service =
      getAuthService();

    const method =
      service?.verifyPhone ||
      service?.verifyPhoneOTP;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Phone verification is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          otp
        }
      );

    await createAuditLog(
      req,
      'AUTH_PHONE_VERIFIED',
      userId
    );

    return success(
      res,
      result,
      'Phone number verified successfully.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Phone verification error:',
      error
    );

    return failure(
      res,
      400,
      'Invalid or expired phone verification OTP.'
    );
  }
}

/* ============================================================
   14. RESEND PHONE OTP
   ============================================================ */

/**
 * POST /api/auth/resend-phone-otp
 */

async function resendPhoneOTP(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const service =
      getAuthService();

    const method =
      service?.resendPhoneOTP ||
      service?.sendPhoneOTP;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Phone OTP service is not implemented.'
      );
    }

    await method.call(
      service,
      {
        userId
      }
    );

    return success(
      res,
      {},
      'Phone verification OTP sent.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Phone OTP error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to send phone verification OTP.',
      error
    );
  }
}

/* ============================================================
   15. SESSIONS
   ============================================================ */

/**
 * GET /api/auth/sessions
 */

async function sessions(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const service =
      getAuthService();

    const method =
      service?.getSessions ||
      service?.listSessions;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Session management is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId
        }
      );

    return success(
      res,
      result,
      'Sessions retrieved.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Sessions error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve sessions.',
      error
    );
  }
}

/* ============================================================
   16. REVOKE SESSION
   ============================================================ */

/**
 * DELETE /api/auth/sessions/:id
 */

async function revokeSession(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const sessionId =
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!sessionId) {
      return failure(
        res,
        400,
        'Session ID is required.'
      );
    }

    const service =
      getAuthService();

    const method =
      service?.revokeSession ||
      service?.deleteSession;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Session revocation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          sessionId
        }
      );

    await createAuditLog(
      req,
      'AUTH_SESSION_REVOKED',
      userId,
      {
        sessionId
      }
    );

    return success(
      res,
      result,
      'Session revoked successfully.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Revoke session error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to revoke session.',
      error
    );
  }
}

/* ============================================================
   17. LOGOUT ALL SESSIONS
   ============================================================ */

/**
 * POST /api/auth/logout-all
 */

async function logoutAll(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const service =
      getAuthService();

    const method =
      service?.logoutAll ||
      service?.revokeAllSessions;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Logout-all service is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          exceptCurrent:
            Boolean(
              req.body?.exceptCurrent
            )
        }
      );

    await createAuditLog(
      req,
      'AUTH_LOGOUT_ALL',
      userId
    );

    return success(
      res,
      result,
      'All sessions have been logged out.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Logout all error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to log out all sessions.',
      error
    );
  }
}

/* ============================================================
   18. ENABLE TWO-FACTOR AUTHENTICATION
   ============================================================ */

/**
 * POST /api/auth/2fa/enable
 */

async function enable2FA(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const service =
      getAuthService();

    const method =
      service?.enable2FA ||
      service?.enableTwoFactor;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Two-factor authentication is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          method:
            req.body?.method ||
            'authenticator'
        }
      );

    return success(
      res,
      result,
      'Two-factor authentication setup initiated.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Enable 2FA error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to enable two-factor authentication.',
      error
    );
  }
}

/* ============================================================
   19. VERIFY TWO-FACTOR AUTHENTICATION
   ============================================================ */

/**
 * POST /api/auth/2fa/verify
 */

async function verify2FA(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const code =
      typeof req.body?.code ===
      'string'
        ? req.body.code.trim()
        : '';

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!code) {
      return failure(
        res,
        400,
        'Two-factor authentication code is required.'
      );
    }

    const service =
      getAuthService();

    const method =
      service?.verify2FA ||
      service?.verifyTwoFactor;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Two-factor verification is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          code
        }
      );

    await createAuditLog(
      req,
      'AUTH_2FA_VERIFIED',
      userId
    );

    return success(
      res,
      result,
      'Two-factor authentication verified.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Verify 2FA error:',
      error
    );

    return failure(
      res,
      400,
      'Invalid two-factor authentication code.'
    );
  }
}

/* ============================================================
   20. DISABLE TWO-FACTOR AUTHENTICATION
   ============================================================ */

/**
 * POST /api/auth/2fa/disable
 */

async function disable2FA(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const service =
      getAuthService();

    const method =
      service?.disable2FA ||
      service?.disableTwoFactor;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Two-factor authentication is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          password:
            req.body?.password ||
            null,

          code:
            req.body?.code ||
            null
        }
      );

    await createAuditLog(
      req,
      'AUTH_2FA_DISABLED',
      userId
    );

    return success(
      res,
      result,
      'Two-factor authentication disabled.'
    );
  } catch (error) {
    console.error(
      '[AUTH] Disable 2FA error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to disable two-factor authentication.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  register,

  login,

  logout,

  refreshToken,

  me,

  verifyEmail,

  resendVerification,

  sendOTP,

  verifyOTP,

  forgotPassword,

  resetPassword,

  changePassword,

  verifyPhone,

  resendPhoneOTP,

  sessions,

  revokeSession,

  logoutAll,

  enable2FA,

  verify2FA,

  disable2FA
};