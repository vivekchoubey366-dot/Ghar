'use strict';

/**
 * ============================================================
 * GHAR - User Controller
 * ============================================================
 *
 * Handles:
 * - Current user profile
 * - User profile updates
 * - Public user profiles
 * - User preferences
 * - Notification preferences
 * - Privacy settings
 * - Account verification
 * - Change phone number
 * - Change email
 * - Change password
 * - Profile image
 * - User activity
 * - User statistics
 * - Delete/deactivate account
 *
 * Business logic:
 *     services/user.service.js
 *
 * Database logic:
 *     repositories/user.repository.js
 *
 * Authentication:
 *     middleware/auth.middleware.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE LOADER
   ============================================================ */

function getUserService() {
  try {
    return require('../services/user.service');
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
    config?.env?.app?.environment !== 'production' &&
    error
  ) {
    response.error =
      error.message ||
      String(error);
  }

  return res
    .status(statusCode)
    .json(response);
}

/* ============================================================
   USER
   ============================================================ */

function getUserId(req) {
  return (
    req.user?.id ||
    req.user?.userId ||
    null
  );
}

/* ============================================================
   AUDIT LOG
   ============================================================ */

async function createAuditLog(
  req,
  action,
  metadata = {}
) {
  try {
    let auditService;

    try {
      auditService =
        require('../services/audit.service');
    } catch {
      return;
    }

    if (
      typeof auditService?.create !==
      'function'
    ) {
      return;
    }

    await auditService.create({
      userId:
        getUserId(req),

      action,

      resource:
        'user',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.['user-agent'] ||
        null
    });
  } catch (error) {
    console.error(
      '[USER AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. GET CURRENT USER
   ============================================================ */

/**
 * GET /api/users/me
 */

async function getMe(
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
      getUserService();

    const method =
      service?.getMe ||
      service?.getUserById;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'User retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'User not found.'
      );
    }

    return success(
      res,
      result,
      'User profile retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Get me error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve user profile.',
      error
    );
  }
}

/* ============================================================
   2. GET USER BY ID
   ============================================================ */

/**
 * GET /api/users/:userId
 */

async function getUserById(
  req,
  res
) {
  try {
    const userId =
      req.params?.userId;

    if (!userId) {
      return failure(
        res,
        400,
        'User ID is required.'
      );
    }

    const service =
      getUserService();

    const method =
      service?.getUserById;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'User retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          requesterId:
            getUserId(req) ||
            null,

          publicOnly:
            getUserId(req) !==
            userId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'User not found.'
      );
    }

    return success(
      res,
      result,
      'User retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Get user error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve user.',
      error
    );
  }
}

/* ============================================================
   3. UPDATE PROFILE
   ============================================================ */

/**
 * PATCH /api/users/me
 */

async function updateProfile(
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

    const allowedFields = [
      'firstName',
      'lastName',
      'displayName',
      'dateOfBirth',
      'gender',
      'bio',
      'occupation',
      'company',
      'alternatePhone',
      'address',
      'city',
      'state',
      'country',
      'pincode'
    ];

    const updates = {};

    for (
      const field of allowedFields
    ) {
      if (
        req.body?.[field] !==
        undefined
      ) {
        updates[field] =
          req.body[field];
      }
    }

    if (
      Object.keys(updates)
        .length === 0
    ) {
      return failure(
        res,
        400,
        'No profile fields were provided.'
      );
    }

    const service =
      getUserService();

    const method =
      service?.updateProfile;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Profile update is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          updates
        }
      );

    await createAuditLog(
      req,
      'USER_PROFILE_UPDATED',
      {
        fields:
          Object.keys(updates)
      }
    );

    return success(
      res,
      result,
      'Profile updated successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Update profile error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update profile.',
      error
    );
  }
}

/* ============================================================
   4. PROFILE PREFERENCES
   ============================================================ */

/**
 * GET /api/users/me/preferences
 */

async function getPreferences(
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
      getUserService();

    const method =
      service?.getPreferences;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'User preferences are not implemented.'
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
      'User preferences retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Preferences error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve user preferences.',
      error
    );
  }
}

/* ============================================================
   5. UPDATE PREFERENCES
   ============================================================ */

/**
 * PATCH /api/users/me/preferences
 */

async function updatePreferences(
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
      getUserService();

    const method =
      service?.updatePreferences;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'User preference update is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          preferences:
            req.body || {}
        }
      );

    await createAuditLog(
      req,
      'USER_PREFERENCES_UPDATED'
    );

    return success(
      res,
      result,
      'User preferences updated successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Update preferences error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update user preferences.',
      error
    );
  }
}

/* ============================================================
   6. NOTIFICATION PREFERENCES
   ============================================================ */

/**
 * GET /api/users/me/notification-preferences
 */

async function getNotificationPreferences(
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
      getUserService();

    const method =
      service?.getNotificationPreferences;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Notification preferences are not implemented.'
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
      'Notification preferences retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Notification preferences error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve notification preferences.',
      error
    );
  }
}

/* ============================================================
   7. UPDATE NOTIFICATION PREFERENCES
   ============================================================ */

/**
 * PATCH /api/users/me/notification-preferences
 */

async function updateNotificationPreferences(
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
      getUserService();

    const method =
      service?.updateNotificationPreferences;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Notification preference update is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          preferences:
            req.body || {}
        }
      );

    await createAuditLog(
      req,
      'USER_NOTIFICATION_PREFERENCES_UPDATED'
    );

    return success(
      res,
      result,
      'Notification preferences updated successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Update notification preferences error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update notification preferences.',
      error
    );
  }
}

/* ============================================================
   8. PRIVACY SETTINGS
   ============================================================ */

/**
 * GET /api/users/me/privacy
 */

async function getPrivacySettings(
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
      getUserService();

    const method =
      service?.getPrivacySettings;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Privacy settings are not implemented.'
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
      'Privacy settings retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Privacy settings error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve privacy settings.',
      error
    );
  }
}

/* ============================================================
   9. UPDATE PRIVACY SETTINGS
   ============================================================ */

/**
 * PATCH /api/users/me/privacy
 */

async function updatePrivacySettings(
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
      getUserService();

    const method =
      service?.updatePrivacySettings;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Privacy setting update is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          settings:
            req.body || {}
        }
      );

    await createAuditLog(
      req,
      'USER_PRIVACY_SETTINGS_UPDATED'
    );

    return success(
      res,
      result,
      'Privacy settings updated successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Update privacy error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update privacy settings.',
      error
    );
  }
}

/* ============================================================
   10. CHANGE EMAIL
   ============================================================ */

/**
 * POST /api/users/me/change-email
 */

async function changeEmail(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const email =
      String(
        req.body?.email ||
        ''
      ).trim();

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!email) {
      return failure(
        res,
        400,
        'New email address is required.'
      );
    }

    const service =
      getUserService();

    const method =
      service?.changeEmail;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Email change is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          email,

          password:
            req.body?.password ||
            null
        }
      );

    await createAuditLog(
      req,
      'USER_EMAIL_CHANGE_REQUESTED'
    );

    return success(
      res,
      result,
      'Email change request processed successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Change email error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to change email address.',
      error
    );
  }
}

/* ============================================================
   11. CHANGE PHONE
   ============================================================ */

/**
 * POST /api/users/me/change-phone
 */

async function changePhone(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const phone =
      String(
        req.body?.phone ||
        ''
      ).trim();

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!phone) {
      return failure(
        res,
        400,
        'New phone number is required.'
      );
    }

    const service =
      getUserService();

    const method =
      service?.changePhone;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Phone change is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          phone,

          password:
            req.body?.password ||
            null
        }
      );

    await createAuditLog(
      req,
      'USER_PHONE_CHANGE_REQUESTED'
    );

    return success(
      res,
      result,
      'Phone change request processed successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Change phone error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to change phone number.',
      error
    );
  }
}

/* ============================================================
   12. CHANGE PASSWORD
   ============================================================ */

/**
 * POST /api/users/me/change-password
 */

async function changePassword(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const currentPassword =
      req.body?.currentPassword;

    const newPassword =
      req.body?.newPassword;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!currentPassword) {
      return failure(
        res,
        400,
        'Current password is required.'
      );
    }

    if (!newPassword) {
      return failure(
        res,
        400,
        'New password is required.'
      );
    }

    if (
      String(newPassword).length <
      8
    ) {
      return failure(
        res,
        400,
        'New password must contain at least 8 characters.'
      );
    }

    const service =
      getUserService();

    const method =
      service?.changePassword;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Password change is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          currentPassword,

          newPassword
        }
      );

    await createAuditLog(
      req,
      'USER_PASSWORD_CHANGED'
    );

    return success(
      res,
      result,
      'Password changed successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Change password error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to change password.',
      error
    );
  }
}

/* ============================================================
   13. UPLOAD PROFILE IMAGE
   ============================================================ */

/**
 * POST /api/users/me/avatar
 */

async function updateAvatar(
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

    const file =
      req.file ||
      req.files?.avatar?.[0] ||
      req.files?.file?.[0];

    if (!file) {
      return failure(
        res,
        400,
        'Profile image is required.'
      );
    }

    const service =
      getUserService();

    const method =
      service?.updateAvatar ||
      service?.uploadAvatar;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Profile image update is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          file
        }
      );

    await createAuditLog(
      req,
      'USER_AVATAR_UPDATED'
    );

    return success(
      res,
      result,
      'Profile image updated successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Avatar error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update profile image.',
      error
    );
  }
}

/* ============================================================
   14. REMOVE PROFILE IMAGE
   ============================================================ */

/**
 * DELETE /api/users/me/avatar
 */

async function removeAvatar(
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
      getUserService();

    const method =
      service?.removeAvatar;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Profile image removal is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId
        }
      );

    await createAuditLog(
      req,
      'USER_AVATAR_REMOVED'
    );

    return success(
      res,
      result,
      'Profile image removed successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Remove avatar error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to remove profile image.',
      error
    );
  }
}

/* ============================================================
   15. VERIFICATION STATUS
   ============================================================ */

/**
 * GET /api/users/me/verification
 */

async function getVerificationStatus(
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
      getUserService();

    const method =
      service?.getVerificationStatus;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Verification status is not implemented.'
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
      'Verification status retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Verification status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve verification status.',
      error
    );
  }
}

/* ============================================================
   16. VERIFY EMAIL
   ============================================================ */

/**
 * POST /api/users/me/verify-email
 */

async function verifyEmail(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const token =
      req.body?.token;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!token) {
      return failure(
        res,
        400,
        'Verification token is required.'
      );
    }

    const service =
      getUserService();

    const method =
      service?.verifyEmail;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Email verification is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          token
        }
      );

    await createAuditLog(
      req,
      'USER_EMAIL_VERIFIED'
    );

    return success(
      res,
      result,
      'Email verified successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Verify email error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to verify email.',
      error
    );
  }
}

/* ============================================================
   17. VERIFY PHONE
   ============================================================ */

/**
 * POST /api/users/me/verify-phone
 */

async function verifyPhone(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const otp =
      String(
        req.body?.otp ||
        ''
      ).trim();

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!otp) {
      return failure(
        res,
        400,
        'OTP is required.'
      );
    }

    const service =
      getUserService();

    const method =
      service?.verifyPhone;

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
      'USER_PHONE_VERIFIED'
    );

    return success(
      res,
      result,
      'Phone verified successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Verify phone error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to verify phone.',
      error
    );
  }
}

/* ============================================================
   18. USER ACTIVITY
   ============================================================ */

/**
 * GET /api/users/me/activity
 */

async function getActivity(
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
      getUserService();

    const method =
      service?.getActivity ||
      service?.getUserActivity;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'User activity is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          limit:
            Math.min(
              Math.max(
                parseInt(
                  req.query?.limit,
                  10
                ) || 20,
                1
              ),
              100
            ),

          type:
            req.query?.type ||
            null
        }
      );

    return success(
      res,
      result,
      'User activity retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Activity error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve user activity.',
      error
    );
  }
}

/* ============================================================
   19. USER STATISTICS
   ============================================================ */

/**
 * GET /api/users/me/statistics
 */

async function getStatistics(
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
      getUserService();

    const method =
      service?.getStatistics ||
      service?.getUserStatistics;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'User statistics are not implemented.'
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
      'User statistics retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Statistics error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve user statistics.',
      error
    );
  }
}

/* ============================================================
   20. DEACTIVATE ACCOUNT
   ============================================================ */

/**
 * POST /api/users/me/deactivate
 */

async function deactivateAccount(
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
      getUserService();

    const method =
      service?.deactivateAccount;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Account deactivation is not implemented.'
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

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'USER_ACCOUNT_DEACTIVATED'
    );

    return success(
      res,
      result,
      'Account deactivated successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Deactivate account error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to deactivate account.',
      error
    );
  }
}

/* ============================================================
   21. DELETE ACCOUNT
   ============================================================ */

/**
 * DELETE /api/users/me
 */

async function deleteAccount(
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
      getUserService();

    const method =
      service?.deleteAccount;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Account deletion is not implemented.'
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

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'USER_ACCOUNT_DELETED'
    );

    return success(
      res,
      result,
      'Account deletion processed successfully.'
    );
  } catch (error) {
    console.error(
      '[USER] Delete account error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to delete account.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  getMe,

  getUserById,

  updateProfile,

  getPreferences,

  updatePreferences,

  getNotificationPreferences,

  updateNotificationPreferences,

  getPrivacySettings,

  updatePrivacySettings,

  changeEmail,

  changePhone,

  changePassword,

  updateAvatar,

  removeAvatar,

  getVerificationStatus,

  verifyEmail,

  verifyPhone,

  getActivity,

  getStatistics,

  deactivateAccount,

  deleteAccount
};