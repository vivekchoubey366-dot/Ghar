'use strict';

/**
 * ============================================================
 * GHAR - Verification Controller
 * ============================================================
 *
 * Handles:
 * - Verification status
 * - Email verification
 * - Phone verification
 * - Identity/KYC verification
 * - Aadhaar/PAN verification requests
 * - Document verification
 * - Address verification
 * - Verification submission
 * - Verification history
 * - Verification details
 * - Resend verification OTP
 * - Verification OTP validation
 *
 * Business logic:
 *     services/verification.service.js
 *
 * Database logic:
 *     repositories/verification.repository.js
 *
 * Document storage:
 *     services/storage.service.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE LOADER
   ============================================================ */

function getVerificationService() {
  try {
    return require('../services/verification.service');
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
        'verification',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.['user-agent'] ||
        null
    });
  } catch (error) {
    console.error(
      '[VERIFICATION AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. GET VERIFICATION STATUS
   ============================================================ */

/**
 * GET /api/verification/status
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
      getVerificationService();

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
      '[VERIFICATION] Status error:',
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
   2. GET VERIFICATION DETAILS
   ============================================================ */

/**
 * GET /api/verification/:verificationId
 */

async function getVerification(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const verificationId =
      req.params?.verificationId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!verificationId) {
      return failure(
        res,
        400,
        'Verification ID is required.'
      );
    }

    const service =
      getVerificationService();

    const method =
      service?.getVerification;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Verification retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          verificationId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Verification record not found.'
      );
    }

    return success(
      res,
      result,
      'Verification details retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[VERIFICATION] Get error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve verification details.',
      error
    );
  }
}

/* ============================================================
   3. START VERIFICATION
   ============================================================ */

/**
 * POST /api/verification/start
 */

async function startVerification(
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

    const verificationType =
      String(
        req.body?.type ||
        req.body?.verificationType ||
        ''
      )
        .trim()
        .toLowerCase();

    const allowedTypes = [
      'email',
      'phone',
      'identity',
      'kyc',
      'aadhaar',
      'pan',
      'address',
      'document'
    ];

    if (!verificationType) {
      return failure(
        res,
        400,
        'Verification type is required.'
      );
    }

    if (
      !allowedTypes.includes(
        verificationType
      )
    ) {
      return failure(
        res,
        400,
        'Invalid verification type.'
      );
    }

    const service =
      getVerificationService();

    const method =
      service?.startVerification;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Verification initiation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          type:
            verificationType,

          metadata:
            req.body?.metadata ||
            {}
        }
      );

    await createAuditLog(
      req,
      'VERIFICATION_STARTED',
      {
        type:
          verificationType
      }
    );

    return success(
      res,
      result,
      'Verification process started successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[VERIFICATION] Start error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to start verification.',
      error
    );
  }
}

/* ============================================================
   4. SEND VERIFICATION OTP
   ============================================================ */

/**
 * POST /api/verification/otp/send
 */

async function sendOTP(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const type =
      String(
        req.body?.type ||
        ''
      )
        .trim()
        .toLowerCase();

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (
      !['email', 'phone']
        .includes(type)
    ) {
      return failure(
        res,
        400,
        'OTP verification type must be email or phone.'
      );
    }

    const service =
      getVerificationService();

    const method =
      service?.sendOTP ||
      service?.sendOtp;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Verification OTP service is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          type,

          destination:
            req.body?.destination ||
            null
        }
      );

    await createAuditLog(
      req,
      'VERIFICATION_OTP_SENT',
      {
        type
      }
    );

    return success(
      res,
      result,
      'Verification OTP sent successfully.'
    );
  } catch (error) {
    console.error(
      '[VERIFICATION] Send OTP error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to send verification OTP.',
      error
    );
  }
}

/* ============================================================
   5. VERIFY OTP
   ============================================================ */

/**
 * POST /api/verification/otp/verify
 */

async function verifyOTP(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const type =
      String(
        req.body?.type ||
        ''
      )
        .trim()
        .toLowerCase();

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

    if (
      !['email', 'phone']
        .includes(type)
    ) {
      return failure(
        res,
        400,
        'OTP verification type must be email or phone.'
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
      getVerificationService();

    const method =
      service?.verifyOTP ||
      service?.verifyOtp;

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
          userId,

          type,

          otp
        }
      );

    await createAuditLog(
      req,
      'VERIFICATION_OTP_VERIFIED',
      {
        type
      }
    );

    return success(
      res,
      result,
      'Verification OTP validated successfully.'
    );
  } catch (error) {
    console.error(
      '[VERIFICATION] Verify OTP error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to verify OTP.',
      error
    );
  }
}

/* ============================================================
   6. RESEND OTP
   ============================================================ */

/**
 * POST /api/verification/otp/resend
 */

async function resendOTP(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const type =
      String(
        req.body?.type ||
        ''
      )
        .trim()
        .toLowerCase();

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (
      !['email', 'phone']
        .includes(type)
    ) {
      return failure(
        res,
        400,
        'OTP verification type must be email or phone.'
      );
    }

    const service =
      getVerificationService();

    const method =
      service?.resendOTP ||
      service?.resendOtp ||
      service?.sendOTP;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'OTP resend service is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          type,

          destination:
            req.body?.destination ||
            null
        }
      );

    await createAuditLog(
      req,
      'VERIFICATION_OTP_RESENT',
      {
        type
      }
    );

    return success(
      res,
      result,
      'Verification OTP resent successfully.'
    );
  } catch (error) {
    console.error(
      '[VERIFICATION] Resend OTP error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to resend verification OTP.',
      error
    );
  }
}

/* ============================================================
   7. SUBMIT IDENTITY/KYC
   ============================================================ */

/**
 * POST /api/verification/identity
 */

async function submitIdentityVerification(
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
      getVerificationService();

    const method =
      service?.submitIdentityVerification ||
      service?.submitKYC;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Identity verification is not implemented.'
      );
    }

    const documents =
      req.files ||
      req.body?.documents ||
      [];

    const result =
      await method.call(
        service,
        {
          userId,

          firstName:
            req.body?.firstName ||
            null,

          lastName:
            req.body?.lastName ||
            null,

          dateOfBirth:
            req.body?.dateOfBirth ||
            null,

          documentType:
            req.body?.documentType ||
            null,

          documentNumber:
            req.body?.documentNumber ||
            null,

          documents
        }
      );

    await createAuditLog(
      req,
      'IDENTITY_VERIFICATION_SUBMITTED',
      {
        verificationId:
          result?.id ||
          result?.verificationId ||
          null
      }
    );

    return success(
      res,
      result,
      'Identity verification submitted successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[VERIFICATION] Identity error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to submit identity verification.',
      error
    );
  }
}

/* ============================================================
   8. SUBMIT AADHAAR VERIFICATION
   ============================================================ */

/**
 * POST /api/verification/aadhaar
 */

async function verifyAadhaar(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const aadhaarNumber =
      String(
        req.body?.aadhaarNumber ||
        ''
      ).replace(/\s+/g, '');

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (
      !/^\d{12}$/.test(
        aadhaarNumber
      )
    ) {
      return failure(
        res,
        400,
        'A valid 12-digit Aadhaar number is required.'
      );
    }

    const service =
      getVerificationService();

    const method =
      service?.verifyAadhaar ||
      service?.startAadhaarVerification;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Aadhaar verification is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          aadhaarNumber
        }
      );

    await createAuditLog(
      req,
      'AADHAAR_VERIFICATION_STARTED'
    );

    return success(
      res,
      result,
      'Aadhaar verification initiated successfully.'
    );
  } catch (error) {
    console.error(
      '[VERIFICATION] Aadhaar error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to initiate Aadhaar verification.',
      error
    );
  }
}

/* ============================================================
   9. SUBMIT PAN VERIFICATION
   ============================================================ */

/**
 * POST /api/verification/pan
 */

async function verifyPAN(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const panNumber =
      String(
        req.body?.panNumber ||
        ''
      )
        .trim()
        .toUpperCase();

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
        panNumber
      )
    ) {
      return failure(
        res,
        400,
        'A valid PAN number is required.'
      );
    }

    const service =
      getVerificationService();

    const method =
      service?.verifyPAN ||
      service?.startPANVerification;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'PAN verification is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          panNumber
        }
      );

    await createAuditLog(
      req,
      'PAN_VERIFICATION_STARTED'
    );

    return success(
      res,
      result,
      'PAN verification initiated successfully.'
    );
  } catch (error) {
    console.error(
      '[VERIFICATION] PAN error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to initiate PAN verification.',
      error
    );
  }
}

/* ============================================================
   10. ADDRESS VERIFICATION
   ============================================================ */

/**
 * POST /api/verification/address
 */

async function submitAddressVerification(
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

    const address =
      req.body?.address;

    if (
      !address ||
      typeof address !==
        'object'
    ) {
      return failure(
        res,
        400,
        'Address details are required.'
      );
    }

    const service =
      getVerificationService();

    const method =
      service?.submitAddressVerification;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Address verification is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          address,

          documents:
            req.files ||
            req.body?.documents ||
            []
        }
      );

    await createAuditLog(
      req,
      'ADDRESS_VERIFICATION_SUBMITTED'
    );

    return success(
      res,
      result,
      'Address verification submitted successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[VERIFICATION] Address error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to submit address verification.',
      error
    );
  }
}

/* ============================================================
   11. DOCUMENT VERIFICATION
   ============================================================ */

/**
 * POST /api/verification/document
 */

async function submitDocumentVerification(
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

    const documentType =
      String(
        req.body?.documentType ||
        ''
      ).trim();

    if (!documentType) {
      return failure(
        res,
        400,
        'Document type is required.'
      );
    }

    const file =
      req.file ||
      req.files?.document?.[0] ||
      req.files?.file?.[0];

    if (
      !file &&
      !req.body?.documentUrl
    ) {
      return failure(
        res,
        400,
        'Verification document is required.'
      );
    }

    const service =
      getVerificationService();

    const method =
      service?.submitDocumentVerification;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Document verification is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          documentType,

          documentNumber:
            req.body?.documentNumber ||
            null,

          file:

            file ||
            null,

          documentUrl:
            req.body?.documentUrl ||
            null
        }
      );

    await createAuditLog(
      req,
      'DOCUMENT_VERIFICATION_SUBMITTED',
      {
        documentType
      }
    );

    return success(
      res,
      result,
      'Document submitted for verification successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[VERIFICATION] Document error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to submit document verification.',
      error
    );
  }
}

/* ============================================================
   12. VERIFICATION HISTORY
   ============================================================ */

/**
 * GET /api/verification/history
 */

async function getVerificationHistory(
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
      getVerificationService();

    const method =
      service?.getVerificationHistory;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Verification history is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          type:
            req.query?.type ||
            null,

          status:
            req.query?.status ||
            null,

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
            )
        }
      );

    return success(
      res,
      result,
      'Verification history retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[VERIFICATION] History error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve verification history.',
      error
    );
  }
}

/* ============================================================
   13. CANCEL VERIFICATION
   ============================================================ */

/**
 * POST /api/verification/:verificationId/cancel
 */

async function cancelVerification(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const verificationId =
      req.params?.verificationId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!verificationId) {
      return failure(
        res,
        400,
        'Verification ID is required.'
      );
    }

    const service =
      getVerificationService();

    const method =
      service?.cancelVerification;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Verification cancellation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          verificationId,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'VERIFICATION_CANCELLED',
      {
        verificationId
      }
    );

    return success(
      res,
      result,
      'Verification cancelled successfully.'
    );
  } catch (error) {
    console.error(
      '[VERIFICATION] Cancel error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to cancel verification.',
      error
    );
  }
}

/* ============================================================
   14. ADMIN - GET VERIFICATION
   ============================================================ */

/**
 * GET /api/verification/admin/:verificationId
 *
 * This controller method is intended to be protected by:
 *
 * requireAuth
 * requireAdmin
 */

async function adminGetVerification(
  req,
  res
) {
  try {
    const verificationId =
      req.params?.verificationId;

    if (!verificationId) {
      return failure(
        res,
        400,
        'Verification ID is required.'
      );
    }

    const service =
      getVerificationService();

    const method =
      service?.adminGetVerification ||
      service?.getVerificationForAdmin;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Admin verification retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          verificationId,

          adminId:
            getUserId(req)
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Verification record not found.'
      );
    }

    return success(
      res,
      result,
      'Verification record retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[VERIFICATION ADMIN] Get error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve verification record.',
      error
    );
  }
}

/* ============================================================
   15. ADMIN - REVIEW VERIFICATION
   ============================================================ */

/**
 * PATCH /api/verification/admin/:verificationId/review
 *
 * Intended for admin middleware.
 */

async function adminReviewVerification(
  req,
  res
) {
  try {
    const verificationId =
      req.params?.verificationId;

    const decision =
      String(
        req.body?.decision ||
        ''
      )
        .trim()
        .toLowerCase();

    const allowedDecisions = [
      'approved',
      'rejected',
      'needs_review',
      'pending'
    ];

    if (!verificationId) {
      return failure(
        res,
        400,
        'Verification ID is required.'
      );
    }

    if (
      !allowedDecisions.includes(
        decision
      )
    ) {
      return failure(
        res,
        400,
        'Invalid verification decision.'
      );
    }

    const service =
      getVerificationService();

    const method =
      service?.adminReviewVerification ||
      service?.reviewVerification;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Verification review is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          verificationId,

          decision,

          notes:
            req.body?.notes ||
            null,

          adminId:
            getUserId(req)
        }
      );

    await createAuditLog(
      req,
      'VERIFICATION_REVIEWED',
      {
        verificationId,

        decision
      }
    );

    return success(
      res,
      result,
      'Verification reviewed successfully.'
    );
  } catch (error) {
    console.error(
      '[VERIFICATION ADMIN] Review error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to review verification.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  getVerificationStatus,

  getVerification,

  startVerification,

  sendOTP,

  verifyOTP,

  resendOTP,

  submitIdentityVerification,

  verifyAadhaar,

  verifyPAN,

  submitAddressVerification,

  submitDocumentVerification,

  getVerificationHistory,

  cancelVerification,

  adminGetVerification,

  adminReviewVerification
};