"use strict";

/**
 * ============================================================
 * GHAR - VERIFICATION MIDDLEWARE
 * ============================================================
 *
 * Responsibilities:
 * - Protect verification-related routes
 * - Check authentication
 * - Check user verification status
 * - Check required verification level
 * - Support email / phone / identity / address verification
 * - Prevent users from bypassing verification requirements
 * - Provide reusable middleware for controllers/routes
 *
 * This middleware does NOT perform the actual verification.
 *
 * Actual verification flow:
 *
 * Route
 *   ↓
 * auth.middleware.js
 *   ↓
 * verification.middleware.js
 *   ↓
 * controller
 *   ↓
 * verification service / database
 *
 * ============================================================
 */


/**
 * ============================================================
 * VERIFICATION LEVELS
 * ============================================================
 *
 * Higher level includes the requirements of lower levels.
 *
 * NONE
 * EMAIL
 * PHONE
 * IDENTITY
 * ADDRESS
 * FULL
 *
 * ============================================================
 */

const VERIFICATION_LEVELS =
  Object.freeze({
    NONE: 0,
    EMAIL: 1,
    PHONE: 2,
    IDENTITY: 3,
    ADDRESS: 4,
    FULL: 5
  });


/**
 * ============================================================
 * VERIFICATION STATUS
 * ============================================================
 */

const VERIFICATION_STATUS =
  Object.freeze({
    UNVERIFIED:
      "unverified",

    PENDING:
      "pending",

    EMAIL_VERIFIED:
      "email_verified",

    PHONE_VERIFIED:
      "phone_verified",

    IDENTITY_PENDING:
      "identity_pending",

    IDENTITY_VERIFIED:
      "identity_verified",

    ADDRESS_PENDING:
      "address_pending",

    ADDRESS_VERIFIED:
      "address_verified",

    VERIFIED:
      "verified",

    REJECTED:
      "rejected",

    SUSPENDED:
      "suspended"
  });


/**
 * ============================================================
 * DOCUMENT TYPES
 * ============================================================
 */

const DOCUMENT_TYPES =
  Object.freeze([
    "aadhaar",
    "pan",
    "passport",
    "driving_license",
    "voter_id",
    "address_proof",
    "bank_statement",
    "utility_bill",
    "property_document",
    "income_proof",
    "other"
  ]);


/**
 * ============================================================
 * USER VERIFICATION OBJECT
 * ============================================================
 */

function getUserVerification(
  req
) {
  const user =
    req.user || {};

  const verification =
    user.verification ||
    req.verification ||
    {};

  return {
    status:
      verification.status ||
      user.verificationStatus ||
      "unverified",

    level:
      verification.level ||
      user.verificationLevel ||
      0,

    emailVerified:
      Boolean(
        verification.emailVerified ||
        user.emailVerified
      ),

    phoneVerified:
      Boolean(
        verification.phoneVerified ||
        user.phoneVerified
      ),

    identityVerified:
      Boolean(
        verification.identityVerified ||
        user.identityVerified
      ),

    addressVerified:
      Boolean(
        verification.addressVerified ||
        user.addressVerified
      )
  };
}


/**
 * ============================================================
 * NORMALIZE LEVEL
 * ============================================================
 */

function normalizeLevel(
  level
) {
  if (
    typeof level ===
    "number"
  ) {
    return level;
  }

  if (
    typeof level ===
    "string"
  ) {
    const normalized =
      level
        .trim()
        .toUpperCase();

    if (
      VERIFICATION_LEVELS[
        normalized
      ] !== undefined
    ) {
      return VERIFICATION_LEVELS[
        normalized
      ];
    }

    const numeric =
      Number(level);

    if (
      Number.isFinite(
        numeric
      )
    ) {
      return numeric;
    }
  }

  return 0;
}


/**
 * ============================================================
 * LEVEL NAME
 * ============================================================
 */

function getLevelName(
  level
) {
  const normalized =
    normalizeLevel(
      level
    );

  const entry =
    Object.entries(
      VERIFICATION_LEVELS
    ).find(
      ([, value]) =>
        value === normalized
    );

  return (
    entry?.[0] ||
    "NONE"
  );
}


/**
 * ============================================================
 * CHECK LEVEL
 * ============================================================
 */

function hasVerificationLevel(
  req,
  requiredLevel
) {
  const verification =
    getUserVerification(
      req
    );

  const currentLevel =
    normalizeLevel(
      verification.level
    );

  const required =
    normalizeLevel(
      requiredLevel
    );

  return (
    currentLevel >=
    required
  );
}


/**
 * ============================================================
 * CHECK STATUS
 * ============================================================
 */

function isVerificationStatusAllowed(
  req,
  allowedStatuses
) {
  const verification =
    getUserVerification(
      req
    );

  return allowedStatuses.includes(
    verification.status
  );
}


/**
 * ============================================================
 * AUTHENTICATION CHECK
 * ============================================================
 */

function ensureAuthenticated(
  req,
  res,
  next
) {
  if (
    !req.user ||
    !(
      req.auth?.authenticated ||
      req.user.userId ||
      req.user.id
    )
  ) {
    return res.status(401).json({
      success:
        false,

      error: {
        code:
          "AUTHENTICATION_REQUIRED",

        message:
          "Authentication is required for verification."
      }
    });
  }

  return next();
}


/**
 * ============================================================
 * GENERIC ERROR
 * ============================================================
 */

function sendVerificationError(
  req,
  res,
  {
    status = 403,
    code = "VERIFICATION_REQUIRED",
    message = "Additional verification is required.",
    requiredLevel = null
  } = {}
) {
  return res.status(
    status
  ).json({
    success:
      false,

    error: {
      code,

      message,

      requestId:
        req.requestId ||
        null,

      verification: {
        currentLevel:
          getUserVerification(
            req
          ).level,

        requiredLevel,

        currentStatus:
          getUserVerification(
            req
          ).status
      }
    }
  });
}


/**
 * ============================================================
 * REQUIRE VERIFICATION LEVEL
 * ============================================================
 *
 * Example:
 *
 * router.post(
 *   "/loan",
 *   requireAuth,
 *   requireVerification("IDENTITY"),
 *   loanController.create
 * );
 *
 * ============================================================
 */

function requireVerification(
  requiredLevel
) {
  const required =
    normalizeLevel(
      requiredLevel
    );

  return function verificationLevelMiddleware(
    req,
    res,
    next
  ) {
    if (
      !req.user
    ) {
      return ensureAuthenticated(
        req,
        res,
        () =>
          requireVerification(
            required
          )(
            req,
            res,
            next
          )
      );
    }

    if (
      hasVerificationLevel(
        req,
        required
      )
    ) {
      return next();
    }

    return sendVerificationError(
      req,
      res,
      {
        status:
          403,

        code:
          "VERIFICATION_REQUIRED",

        message:
          `Verification level ${getLevelName(required)} is required.`,

        requiredLevel:
          getLevelName(
            required
          )
      }
    );
  };
}


/**
 * ============================================================
 * REQUIRE EMAIL VERIFICATION
 * ============================================================
 */

function requireEmailVerification(
  req,
  res,
  next
) {
  const verification =
    getUserVerification(
      req
    );

  if (
    verification.emailVerified ||
    hasVerificationLevel(
      req,
      VERIFICATION_LEVELS.EMAIL
    )
  ) {
    return next();
  }

  return sendVerificationError(
    req,
    res,
    {
      code:
        "EMAIL_VERIFICATION_REQUIRED",

      message:
        "Please verify your email address before continuing.",

      requiredLevel:
        "EMAIL"
    }
  );
}


/**
 * ============================================================
 * REQUIRE PHONE VERIFICATION
 * ============================================================
 */

function requirePhoneVerification(
  req,
  res,
  next
) {
  const verification =
    getUserVerification(
      req
    );

  if (
    verification.phoneVerified ||
    hasVerificationLevel(
      req,
      VERIFICATION_LEVELS.PHONE
    )
  ) {
    return next();
  }

  return sendVerificationError(
    req,
    res,
    {
      code:
        "PHONE_VERIFICATION_REQUIRED",

      message:
        "Please verify your phone number before continuing.",

      requiredLevel:
        "PHONE"
    }
  );
}


/**
 * ============================================================
 * REQUIRE IDENTITY VERIFICATION
 * ============================================================
 */

function requireIdentityVerification(
  req,
  res,
  next
) {
  const verification =
    getUserVerification(
      req
    );

  if (
    verification.identityVerified ||
    hasVerificationLevel(
      req,
      VERIFICATION_LEVELS.IDENTITY
    )
  ) {
    return next();
  }

  return sendVerificationError(
    req,
    res,
    {
      code:
        "IDENTITY_VERIFICATION_REQUIRED",

      message:
        "Identity verification is required for this action.",

      requiredLevel:
        "IDENTITY"
    }
  );
}


/**
 * ============================================================
 * REQUIRE ADDRESS VERIFICATION
 * ============================================================
 */

function requireAddressVerification(
  req,
  res,
  next
) {
  const verification =
    getUserVerification(
      req
    );

  if (
    verification.addressVerified ||
    hasVerificationLevel(
      req,
      VERIFICATION_LEVELS.ADDRESS
    )
  ) {
    return next();
  }

  return sendVerificationError(
    req,
    res,
    {
      code:
        "ADDRESS_VERIFICATION_REQUIRED",

      message:
        "Address verification is required for this action.",

      requiredLevel:
        "ADDRESS"
    }
  );
}


/**
 * ============================================================
 * REQUIRE FULL VERIFICATION
 * ============================================================
 */

function requireFullVerification(
  req,
  res,
  next
) {
  if (
    hasVerificationLevel(
      req,
      VERIFICATION_LEVELS.FULL
    )
  ) {
    return next();
  }

  return sendVerificationError(
    req,
    res,
    {
      code:
        "FULL_VERIFICATION_REQUIRED",

      message:
        "Complete account verification is required for this action.",

      requiredLevel:
        "FULL"
    }
  );
}


/**
 * ============================================================
 * REQUIRE APPROVED VERIFICATION
 * ============================================================
 */

function requireApprovedVerification(
  req,
  res,
  next
) {
  const verification =
    getUserVerification(
      req
    );

  const approved =
    verification.status ===
      VERIFICATION_STATUS.VERIFIED ||
    verification.status ===
      VERIFICATION_STATUS.ADDRESS_VERIFIED;

  if (
    approved
  ) {
    return next();
  }

  return sendVerificationError(
    req,
    res,
    {
      code:
        "VERIFICATION_NOT_APPROVED",

      message:
        "Your verification must be approved before continuing."
    }
  );
}


/**
 * ============================================================
 * REJECT SUSPENDED / REJECTED USERS
 * ============================================================
 */

function rejectInvalidVerificationStatus(
  req,
  res,
  next
) {
  const verification =
    getUserVerification(
      req
    );

  if (
    verification.status ===
    VERIFICATION_STATUS.SUSPENDED
  ) {
    return sendVerificationError(
      req,
      res,
      {
        status:
          403,

        code:
          "VERIFICATION_SUSPENDED",

        message:
          "Verification access has been suspended."
      }
    );
  }

  return next();
}


/**
 ============================================================
 * REQUIRE SPECIFIC STATUS
 * ============================================================
 */

function requireVerificationStatus(
  ...allowedStatuses
) {
  return function verificationStatusMiddleware(
    req,
    res,
    next
  ) {
    if (
      allowedStatuses.length ===
      0
    ) {
      return next();
    }

    if (
      isVerificationStatusAllowed(
        req,
        allowedStatuses
      )
    ) {
      return next();
    }

    return sendVerificationError(
      req,
      res,
      {
        code:
          "INVALID_VERIFICATION_STATUS",

        message:
          "Your account verification status does not permit this action."
      }
    );
  };
}


/**
 * ============================================================
 * REQUIRE ANY VERIFICATION
 * ============================================================
 */

function requireAnyVerification(
  req,
  res,
  next
) {
  const verification =
    getUserVerification(
      req
    );

  const verified =
    verification.emailVerified ||
    verification.phoneVerified ||
    verification.identityVerified ||
    verification.addressVerified ||
    normalizeLevel(
      verification.level
    ) > 0;

  if (
    verified
  ) {
    return next();
  }

  return sendVerificationError(
    req,
    res,
    {
      code:
        "VERIFICATION_REQUIRED",

      message:
        "At least one verification method must be completed."
    }
  );
}


/**
 * ============================================================
 * DOCUMENT TYPE VALIDATION
 * ============================================================
 */

function isValidDocumentType(
  documentType
) {
  return DOCUMENT_TYPES.includes(
    String(
      documentType || ""
    )
      .trim()
      .toLowerCase()
  );
}


/**
 * ============================================================
 * REQUIRE DOCUMENT TYPE
 * ============================================================
 */

function requireDocumentType(
  ...allowedTypes
) {
  const normalized =
    allowedTypes.map(
      type =>
        String(type)
          .trim()
          .toLowerCase()
    );

  return function documentTypeMiddleware(
    req,
    res,
    next
  ) {
    const documentType =
      String(
        req.body?.documentType ||
        req.body?.type ||
        req.params?.documentType ||
        ""
      )
        .trim()
        .toLowerCase();

    if (
      !documentType
    ) {
      return res.status(400).json({
        success:
          false,

        error: {
          code:
            "DOCUMENT_TYPE_REQUIRED",

          message:
            "Document type is required.",

          requestId:
            req.requestId ||
            null
        }
      });
    }

    if (
      !isValidDocumentType(
        documentType
      )
    ) {
      return res.status(400).json({
        success:
          false,

        error: {
          code:
            "INVALID_DOCUMENT_TYPE",

          message:
            "The supplied document type is not supported.",

          requestId:
            req.requestId ||
            null
        }
      });
    }

    if (
      normalized.length > 0 &&
      !normalized.includes(
        documentType
      )
    ) {
      return res.status(400).json({
        success:
          false,

        error: {
          code:
            "DOCUMENT_TYPE_NOT_ALLOWED",

          message:
            "This document type is not allowed for this operation.",

          requestId:
            req.requestId ||
            null
        }
      });
    }

    req.verificationDocumentType =
      documentType;

    return next();
  };
}


/**
 * ============================================================
 * VERIFICATION ROUTE PROTECTION
 * ============================================================
 *
 * Use this as the common middleware chain for sensitive
 * verification operations.
 * ============================================================
 */

function protectVerificationRoute({
  level = "EMAIL",
  rejectSuspended = true
} = {}) {
  const middlewares = [
    ensureAuthenticated
  ];

  if (
    rejectSuspended
  ) {
    middlewares.push(
      rejectInvalidVerificationStatus
    );
  }

  middlewares.push(
    requireVerification(
      level
    )
  );

  return function protectedVerificationRoute(
    req,
    res,
    next
  ) {
    let index = 0;

    function runNext(
      error
    ) {
      if (
        error
      ) {
        return next(
          error
        );
      }

      if (
        index >=
        middlewares.length
      ) {
        return next();
      }

      const middleware =
        middlewares[
          index++
        ];

      return middleware(
        req,
        res,
        runNext
      );
    }

    return runNext();
  };
}


/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {

  /**
   * Constants
   */

  VERIFICATION_LEVELS,

  VERIFICATION_STATUS,

  DOCUMENT_TYPES,


  /**
   * Helpers
   */

  getUserVerification,

  normalizeLevel,

  getLevelName,

  hasVerificationLevel,

  isVerificationStatusAllowed,

  isValidDocumentType,


  /**
   * Generic middleware
   */

  ensureAuthenticated,

  requireVerification,

  requireVerificationStatus,

  requireAnyVerification,

  requireApprovedVerification,

  rejectInvalidVerificationStatus,


  /**
   * Specific verification middleware
   */

  requireEmailVerification,

  requirePhoneVerification,

  requireIdentityVerification,

  requireAddressVerification,

  requireFullVerification,


  /**
   * Document protection
   */

  requireDocumentType,

  protectVerificationRoute,


  /**
   * Response helper
   */

  sendVerificationError
};