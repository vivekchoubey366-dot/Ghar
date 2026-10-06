'use strict';

/**
 * ============================================================
 * GHAR - Referral Controller
 * ============================================================
 *
 * Handles:
 * - Create referral
 * - Get referral by ID
 * - My referrals
 * - Referral statistics
 * - Referral code
 * - Validate referral code
 * - Apply referral code
 * - Referral rewards
 * - Referral payout request
 * - Referral status
 * - Admin referral management
 *
 * Business logic:
 *     services/referral.service.js
 *
 * Database logic:
 *     repositories/referral.repository.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE
   ============================================================ */

function getReferralService() {
  try {
    return require('../services/referral.service');
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
   PARAMETER HELPERS
   ============================================================ */

function getReferralId(req) {
  return (
    req.params?.referralId ||
    req.params?.id ||
    req.body?.referralId ||
    null
  );
}

/* ============================================================
   PAGINATION
   ============================================================ */

function getPagination(req) {
  const page = Math.max(
    parseInt(req.query?.page, 10) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      parseInt(req.query?.limit, 10) || 20,
      1
    ),
    100
  );

  return {
    page,
    limit,
    offset: (page - 1) * limit
  };
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
        'referral',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.['user-agent'] ||
        null
    });
  } catch (error) {
    console.error(
      '[REFERRAL AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. CREATE REFERRAL
   ============================================================ */

/**
 * POST /api/referrals
 */

async function createReferral(
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
      getReferralService();

    const method =
      service?.createReferral;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Referral creation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          referrerId:
            userId,

          referredUserId:
            req.body?.referredUserId ||
            null,

          referralCode:
            req.body?.referralCode ||
            null,

          propertyId:
            req.body?.propertyId ||
            null,

          source:
            req.body?.source ||
            'direct',

          metadata:
            req.body?.metadata ||
            {}
        }
      );

    await createAuditLog(
      req,
      'REFERRAL_CREATED',
      {
        referralId:
          result?.id ||
          result?.referralId ||
          null
      }
    );

    return success(
      res,
      result,
      'Referral created successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[REFERRAL] Create error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to create referral.',
      error
    );
  }
}

/* ============================================================
   2. GET REFERRAL
   ============================================================ */

/**
 * GET /api/referrals/:referralId
 */

async function getReferral(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const referralId =
      getReferralId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!referralId) {
      return failure(
        res,
        400,
        'Referral ID is required.'
      );
    }

    const service =
      getReferralService();

    const method =
      service?.getReferral ||
      service?.findReferral;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Referral retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          referralId,

          userId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Referral not found.'
      );
    }

    return success(
      res,
      result,
      'Referral retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[REFERRAL] Get error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve referral.',
      error
    );
  }
}

/* ============================================================
   3. MY REFERRALS
   ============================================================ */

/**
 * GET /api/referrals/my
 */

async function getMyReferrals(
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
      getReferralService();

    const method =
      service?.getMyReferrals ||
      service?.getUserReferrals;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Referral list is not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          userId,

          status:
            req.query?.status ||
            null,

          page:
            pagination.page,

          limit:
            pagination.limit
        }
      );

    return success(
      res,
      result,
      'Your referrals retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[REFERRAL] My referrals error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve referrals.',
      error
    );
  }
}

/* ============================================================
   4. REFERRAL CODE
   ============================================================ */

/**
 * GET /api/referrals/code
 */

async function getReferralCode(
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
      getReferralService();

    const method =
      service?.getReferralCode ||
      service?.generateReferralCode;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Referral code generation is not implemented.'
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
      'Referral code retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[REFERRAL] Code error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve referral code.',
      error
    );
  }
}

/* ============================================================
   5. GENERATE NEW REFERRAL CODE
   ============================================================ */

/**
 * POST /api/referrals/code
 */

async function generateReferralCode(
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
      getReferralService();

    const method =
      service?.generateReferralCode;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Referral code generation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          preferredCode:
            req.body?.code ||
            null
        }
      );

    await createAuditLog(
      req,
      'REFERRAL_CODE_GENERATED',
      {
        code:
          result?.code ||
          null
      }
    );

    return success(
      res,
      result,
      'Referral code generated successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[REFERRAL] Generate code error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to generate referral code.',
      error
    );
  }
}

/* ============================================================
   6. VALIDATE REFERRAL CODE
   ============================================================ */

/**
 * POST /api/referrals/validate
 */

async function validateReferralCode(
  req,
  res
) {
  try {
    const code =
      String(
        req.body?.code ||
        req.query?.code ||
        ''
      )
        .trim()
        .toUpperCase();

    if (!code) {
      return failure(
        res,
        400,
        'Referral code is required.'
      );
    }

    const service =
      getReferralService();

    const method =
      service?.validateReferralCode ||
      service?.validateCode;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Referral code validation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          code,

          userId:
            getUserId(req) ||
            null
        }
      );

    return success(
      res,
      result,
      'Referral code validated successfully.'
    );
  } catch (error) {
    console.error(
      '[REFERRAL] Validate code error:',
      error
    );

    return failure(
      res,
      400,
      'Unable to validate referral code.',
      error
    );
  }
}

/* ============================================================
   7. APPLY REFERRAL CODE
   ============================================================ */

/**
 * POST /api/referrals/apply
 */

async function applyReferralCode(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const code =
      String(
        req.body?.code ||
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

    if (!code) {
      return failure(
        res,
        400,
        'Referral code is required.'
      );
    }

    const service =
      getReferralService();

    const method =
      service?.applyReferralCode ||
      service?.applyCode;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Referral code application is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          code,

          propertyId:
            req.body?.propertyId ||
            null,

          applicationId:
            req.body?.applicationId ||
            null,

          metadata:
            req.body?.metadata ||
            {}
        }
      );

    await createAuditLog(
      req,
      'REFERRAL_CODE_APPLIED',
      {
        code,

        referralId:
          result?.referralId ||
          null
      }
    );

    return success(
      res,
      result,
      'Referral code applied successfully.'
    );
  } catch (error) {
    console.error(
      '[REFERRAL] Apply code error:',
      error
    );

    return failure(
      res,
      400,
      'Unable to apply referral code.',
      error
    );
  }
}

/* ============================================================
   8. REFERRAL STATISTICS
   ============================================================ */

/**
 * GET /api/referrals/statistics
 */

async function getReferralStatistics(
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
      getReferralService();

    const method =
      service?.getReferralStatistics ||
      service?.getStatistics;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Referral statistics are not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          from:
            req.query?.from ||
            null,

          to:
            req.query?.to ||
            null
        }
      );

    return success(
      res,
      result,
      'Referral statistics retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[REFERRAL] Statistics error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve referral statistics.',
      error
    );
  }
}

/* ============================================================
   9. REFERRAL REWARDS
   ============================================================ */

/**
 * GET /api/referrals/rewards
 */

async function getReferralRewards(
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
      getReferralService();

    const method =
      service?.getReferralRewards ||
      service?.getRewards;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Referral rewards are not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          userId,

          status:
            req.query?.status ||
            null,

          page:
            pagination.page,

          limit:
            pagination.limit
        }
      );

    return success(
      res,
      result,
      'Referral rewards retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[REFERRAL] Rewards error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve referral rewards.',
      error
    );
  }
}

/* ============================================================
   10. REFERRAL PAYOUT REQUEST
   ============================================================ */

/**
 * POST /api/referrals/payout
 */

async function requestPayout(
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

    const amount =
      req.body?.amount;

    if (
      amount === undefined ||
      amount === null ||
      Number(amount) <= 0
    ) {
      return failure(
        res,
        400,
        'A valid payout amount is required.'
      );
    }

    const service =
      getReferralService();

    const method =
      service?.requestPayout ||
      service?.createPayoutRequest;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Referral payout is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          amount:
            Number(amount),

          paymentMethod:
            req.body?.paymentMethod ||
            null,

          paymentDetails:
            req.body?.paymentDetails ||
            {},

          notes:
            req.body?.notes ||
            null
        }
      );

    await createAuditLog(
      req,
      'REFERRAL_PAYOUT_REQUESTED',
      {
        amount:
          Number(amount),

        payoutId:
          result?.payoutId ||
          result?.id ||
          null
      }
    );

    return success(
      res,
      result,
      'Referral payout request submitted successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[REFERRAL] Payout error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to submit referral payout request.',
      error
    );
  }
}

/* ============================================================
   11. PAYOUT HISTORY
   ============================================================ */

/**
 * GET /api/referrals/payouts
 */

async function getPayoutHistory(
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
      getReferralService();

    const method =
      service?.getPayoutHistory ||
      service?.getPayouts;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Referral payout history is not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          userId,

          status:
            req.query?.status ||
            null,

          page:
            pagination.page,

          limit:
            pagination.limit
        }
      );

    return success(
      res,
      result,
      'Referral payout history retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[REFERRAL] Payout history error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve payout history.',
      error
    );
  }
}

/* ============================================================
   12. REFERRAL STATUS
   ============================================================ */

/**
 * GET /api/referrals/:referralId/status
 */

async function getReferralStatus(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const referralId =
      getReferralId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!referralId) {
      return failure(
        res,
        400,
        'Referral ID is required.'
      );
    }

    const service =
      getReferralService();

    const method =
      service?.getReferralStatus;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Referral status retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          referralId,

          userId
        }
      );

    return success(
      res,
      result,
      'Referral status retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[REFERRAL] Status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve referral status.',
      error
    );
  }
}

/* ============================================================
   13. CANCEL REFERRAL
   ============================================================ */

/**
 * POST /api/referrals/:referralId/cancel
 */

async function cancelReferral(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const referralId =
      getReferralId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!referralId) {
      return failure(
        res,
        400,
        'Referral ID is required.'
      );
    }

    const service =
      getReferralService();

    const method =
      service?.cancelReferral;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Referral cancellation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          referralId,

          userId,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'REFERRAL_CANCELLED',
      {
        referralId
      }
    );

    return success(
      res,
      result,
      'Referral cancelled successfully.'
    );
  } catch (error) {
    console.error(
      '[REFERRAL] Cancel error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to cancel referral.',
      error
    );
  }
}

/* ============================================================
   14. ADMIN - ALL REFERRALS
   ============================================================ */

/**
 * GET /api/referrals/admin/all
 */

async function adminGetReferrals(
  req,
  res
) {
  try {
    const service =
      getReferralService();

    const method =
      service?.adminGetReferrals ||
      service?.getAllReferrals;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Admin referral management is not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          status:
            req.query?.status ||
            null,

          userId:
            req.query?.userId ||
            null,

          from:
            req.query?.from ||
            null,

          to:
            req.query?.to ||
            null,

          page:
            pagination.page,

          limit:
            pagination.limit
        }
      );

    return success(
      res,
      result,
      'Referrals retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[REFERRAL] Admin list error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve referrals.',
      error
    );
  }
}

/* ============================================================
   15. ADMIN - UPDATE REFERRAL STATUS
   ============================================================ */

/**
 * PATCH /api/referrals/admin/:referralId/status
 */

async function adminUpdateReferralStatus(
  req,
  res
) {
  try {
    const adminId =
      getUserId(req);

    const referralId =
      getReferralId(req);

    const status =
      req.body?.status;

    if (!adminId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!referralId) {
      return failure(
        res,
        400,
        'Referral ID is required.'
      );
    }

    if (!status) {
      return failure(
        res,
        400,
        'Referral status is required.'
      );
    }

    const service =
      getReferralService();

    const method =
      service?.adminUpdateReferralStatus ||
      service?.updateReferralStatus;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Referral status management is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          referralId,

          adminId,

          status,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'ADMIN_REFERRAL_STATUS_UPDATED',
      {
        referralId,

        status
      }
    );

    return success(
      res,
      result,
      'Referral status updated successfully.'
    );
  } catch (error) {
    console.error(
      '[REFERRAL] Admin status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update referral status.',
      error
    );
  }
}

/* ============================================================
   16. ADMIN - PROCESS PAYOUT
   ============================================================ */

/**
 * POST /api/referrals/admin/payouts/:payoutId/process
 */

async function adminProcessPayout(
  req,
  res
) {
  try {
    const adminId =
      getUserId(req);

    const payoutId =
      req.params?.payoutId;

    if (!adminId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!payoutId) {
      return failure(
        res,
        400,
        'Payout ID is required.'
      );
    }

    const service =
      getReferralService();

    const method =
      service?.adminProcessPayout ||
      service?.processPayout;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Referral payout processing is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          payoutId,

          adminId,

          status:
            req.body?.status ||
            'approved',

          transactionId:
            req.body?.transactionId ||
            null,

          notes:
            req.body?.notes ||
            null
        }
      );

    await createAuditLog(
      req,
      'ADMIN_REFERRAL_PAYOUT_PROCESSED',
      {
        payoutId,

        status:
          req.body?.status ||
          'approved'
      }
    );

    return success(
      res,
      result,
      'Referral payout processed successfully.'
    );
  } catch (error) {
    console.error(
      '[REFERRAL] Admin payout error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to process referral payout.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  createReferral,

  getReferral,

  getMyReferrals,

  getReferralCode,

  generateReferralCode,

  validateReferralCode,

  applyReferralCode,

  getReferralStatistics,

  getReferralRewards,

  requestPayout,

  getPayoutHistory,

  getReferralStatus,

  cancelReferral,

  adminGetReferrals,

  adminUpdateReferralStatus,

  adminProcessPayout
};