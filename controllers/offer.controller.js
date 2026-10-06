'use strict';

/**
 * ============================================================
 * GHAR - Offer Controller
 * ============================================================
 *
 * Handles:
 * - Create property offers
 * - View offers
 * - Update offers
 * - Accept offers
 * - Reject offers
 * - Withdraw offers
 * - Counter offers
 * - Offer history
 * - Buyer offers
 * - Seller received offers
 * - Offer status
 *
 * Business logic:
 *     services/offer.service.js
 *
 * Database logic:
 *     repositories/offer.repository.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE
   ============================================================ */

function getOfferService() {
  try {
    return require('../services/offer.service');
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

function getUserRole(req) {
  return (
    req.user?.role ||
    req.user?.userRole ||
    null
  );
}

/* ============================================================
   PARAMETER HELPERS
   ============================================================ */

function getOfferId(req) {
  return (
    req.params?.offerId ||
    req.params?.id ||
    req.body?.offerId ||
    null
  );
}

function getPropertyId(req) {
  return (
    req.params?.propertyId ||
    req.body?.propertyId ||
    null
  );
}

/* ============================================================
   NUMBER HELPERS
   ============================================================ */

function parseNumber(value) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

/* ============================================================
   PAGINATION
   ============================================================ */

function getPagination(req) {
  const page = Math.max(
    parseInt(
      req.query?.page,
      10
    ) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      parseInt(
        req.query?.limit,
        10
      ) || 20,
      1
    ),
    100
  );

  return {
    page,
    limit,
    offset:
      (page - 1) * limit
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
        'offer',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.['user-agent'] ||
        null
    });
  } catch (error) {
    console.error(
      '[OFFER AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. CREATE OFFER
   ============================================================ */

/**
 * POST /api/offers
 */

async function createOffer(
  req,
  res
) {
  try {
    const buyerId =
      getUserId(req);

    if (!buyerId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const propertyId =
      req.body?.propertyId;

    const amount =
      parseNumber(
        req.body?.amount
      );

    if (!propertyId) {
      return failure(
        res,
        400,
        'Property ID is required.'
      );
    }

    if (
      amount === null ||
      amount <= 0
    ) {
      return failure(
        res,
        400,
        'A valid offer amount is required.'
      );
    }

    const service =
      getOfferService();

    const method =
      service?.createOffer ||
      service?.submitOffer;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Offer creation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          buyerId,

          sellerId:
            req.body?.sellerId ||
            null,

          propertyId,

          listingId:
            req.body?.listingId ||
            null,

          amount,

          currency:
            req.body?.currency ||
            'INR',

          offerType:
            req.body?.offerType ||
            'purchase',

          validityUntil:
            req.body?.validityUntil ||
            null,

          message:
            req.body?.message ||
            null,

          terms:
            req.body?.terms ||
            {},

          financingRequired:
            Boolean(
              req.body?.financingRequired
            ),

          loanAmount:
            parseNumber(
              req.body?.loanAmount
            ),

          downPayment:
            parseNumber(
              req.body?.downPayment
            )
        }
      );

    await createAuditLog(
      req,
      'OFFER_CREATED',
      {
        offerId:
          result?.id ||
          result?.offerId ||
          null,

        propertyId
      }
    );

    return success(
      res,
      result,
      'Offer submitted successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[OFFER] Create error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to submit offer.',
      error
    );
  }
}

/* ============================================================
   2. GET OFFER
   ============================================================ */

/**
 * GET /api/offers/:offerId
 */

async function getOffer(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const offerId =
      getOfferId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!offerId) {
      return failure(
        res,
        400,
        'Offer ID is required.'
      );
    }

    const service =
      getOfferService();

    const method =
      service?.getOffer ||
      service?.findOffer;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Offer retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          offerId,

          userId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Offer not found.'
      );
    }

    return success(
      res,
      result,
      'Offer retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[OFFER] Get error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve offer.',
      error
    );
  }
}

/* ============================================================
   3. UPDATE OFFER
   ============================================================ */

/**
 * PATCH /api/offers/:offerId
 */

async function updateOffer(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const offerId =
      getOfferId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!offerId) {
      return failure(
        res,
        400,
        'Offer ID is required.'
      );
    }

    const amount =
      req.body?.amount !== undefined
        ? parseNumber(
            req.body.amount
          )
        : undefined;

    if (
      amount !== undefined &&
      (amount === null || amount <= 0)
    ) {
      return failure(
        res,
        400,
        'Offer amount must be greater than zero.'
      );
    }

    const service =
      getOfferService();

    const method =
      service?.updateOffer;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Offer update is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          offerId,

          userId,

          amount,

          message:
            req.body?.message,

          validityUntil:
            req.body?.validityUntil,

          terms:
            req.body?.terms,

          financingRequired:
            req.body?.financingRequired,

          loanAmount:
            req.body?.loanAmount !==
            undefined
              ? parseNumber(
                  req.body.loanAmount
                )
              : undefined,

          downPayment:
            req.body?.downPayment !==
            undefined
              ? parseNumber(
                  req.body.downPayment
                )
              : undefined
        }
      );

    await createAuditLog(
      req,
      'OFFER_UPDATED',
      {
        offerId
      }
    );

    return success(
      res,
      result,
      'Offer updated successfully.'
    );
  } catch (error) {
    console.error(
      '[OFFER] Update error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update offer.',
      error
    );
  }
}

/* ============================================================
   4. BUYER OFFERS
   ============================================================ */

/**
 * GET /api/offers/my
 */

async function getMyOffers(
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
      getOfferService();

    const method =
      service?.getBuyerOffers ||
      service?.getMyOffers;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Buyer offer retrieval is not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          buyerId:
            userId,

          status:
            req.query?.status ||
            null,

          propertyId:
            req.query?.propertyId ||
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
      'Your offers retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[OFFER] My offers error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve your offers.',
      error
    );
  }
}

/* ============================================================
   5. SELLER RECEIVED OFFERS
   ============================================================ */

/**
 * GET /api/offers/received
 */

async function getReceivedOffers(
  req,
  res
) {
  try {
    const sellerId =
      getUserId(req);

    if (!sellerId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const service =
      getOfferService();

    const method =
      service?.getSellerOffers ||
      service?.getReceivedOffers;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Received offer retrieval is not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          sellerId,

          status:
            req.query?.status ||
            null,

          propertyId:
            req.query?.propertyId ||
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
      'Received offers retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[OFFER] Received offers error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve received offers.',
      error
    );
  }
}

/* ============================================================
   6. PROPERTY OFFERS
   ============================================================ */

/**
 * GET /api/offers/property/:propertyId
 */

async function getPropertyOffers(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const propertyId =
      getPropertyId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!propertyId) {
      return failure(
        res,
        400,
        'Property ID is required.'
      );
    }

    const service =
      getOfferService();

    const method =
      service?.getPropertyOffers;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property offer retrieval is not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          propertyId,

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
      'Property offers retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[OFFER] Property offers error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve property offers.',
      error
    );
  }
}

/* ============================================================
   7. ACCEPT OFFER
   ============================================================ */

/**
 * POST /api/offers/:offerId/accept
 */

async function acceptOffer(
  req,
  res
) {
  try {
    const sellerId =
      getUserId(req);

    const offerId =
      getOfferId(req);

    if (!sellerId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!offerId) {
      return failure(
        res,
        400,
        'Offer ID is required.'
      );
    }

    const service =
      getOfferService();

    const method =
      service?.acceptOffer;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Offer acceptance is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          offerId,

          sellerId,

          message:
            req.body?.message ||
            null
        }
      );

    await createAuditLog(
      req,
      'OFFER_ACCEPTED',
      {
        offerId
      }
    );

    return success(
      res,
      result,
      'Offer accepted successfully.'
    );
  } catch (error) {
    console.error(
      '[OFFER] Accept error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to accept offer.',
      error
    );
  }
}

/* ============================================================
   8. REJECT OFFER
   ============================================================ */

/**
 * POST /api/offers/:offerId/reject
 */

async function rejectOffer(
  req,
  res
) {
  try {
    const sellerId =
      getUserId(req);

    const offerId =
      getOfferId(req);

    if (!sellerId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!offerId) {
      return failure(
        res,
        400,
        'Offer ID is required.'
      );
    }

    const service =
      getOfferService();

    const method =
      service?.rejectOffer;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Offer rejection is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          offerId,

          sellerId,

          reason:
            req.body?.reason ||
            null,

          message:
            req.body?.message ||
            null
        }
      );

    await createAuditLog(
      req,
      'OFFER_REJECTED',
      {
        offerId
      }
    );

    return success(
      res,
      result,
      'Offer rejected successfully.'
    );
  } catch (error) {
    console.error(
      '[OFFER] Reject error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to reject offer.',
      error
    );
  }
}

/* ============================================================
   9. WITHDRAW OFFER
   ============================================================ */

/**
 * POST /api/offers/:offerId/withdraw
 */

async function withdrawOffer(
  req,
  res
) {
  try {
    const buyerId =
      getUserId(req);

    const offerId =
      getOfferId(req);

    if (!buyerId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!offerId) {
      return failure(
        res,
        400,
        'Offer ID is required.'
      );
    }

    const service =
      getOfferService();

    const method =
      service?.withdrawOffer;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Offer withdrawal is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          offerId,

          buyerId,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'OFFER_WITHDRAWN',
      {
        offerId
      }
    );

    return success(
      res,
      result,
      'Offer withdrawn successfully.'
    );
  } catch (error) {
    console.error(
      '[OFFER] Withdraw error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to withdraw offer.',
      error
    );
  }
}

/* ============================================================
   10. COUNTER OFFER
   ============================================================ */

/**
 * POST /api/offers/:offerId/counter
 */

async function counterOffer(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const offerId =
      getOfferId(req);

    const amount =
      parseNumber(
        req.body?.amount
      );

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!offerId) {
      return failure(
        res,
        400,
        'Offer ID is required.'
      );
    }

    if (
      amount === null ||
      amount <= 0
    ) {
      return failure(
        res,
        400,
        'A valid counter offer amount is required.'
      );
    }

    const service =
      getOfferService();

    const method =
      service?.counterOffer ||
      service?.createCounterOffer;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Counter offer functionality is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          offerId,

          userId,

          amount,

          currency:
            req.body?.currency ||
            'INR',

          message:
            req.body?.message ||
            null,

          terms:
            req.body?.terms ||
            {},

          validityUntil:
            req.body?.validityUntil ||
            null
        }
      );

    await createAuditLog(
      req,
      'COUNTER_OFFER_CREATED',
      {
        offerId
      }
    );

    return success(
      res,
      result,
      'Counter offer submitted successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[OFFER] Counter error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to submit counter offer.',
      error
    );
  }
}

/* ============================================================
   11. OFFER HISTORY
   ============================================================ */

/**
 * GET /api/offers/:offerId/history
 */

async function getOfferHistory(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const offerId =
      getOfferId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!offerId) {
      return failure(
        res,
        400,
        'Offer ID is required.'
      );
    }

    const service =
      getOfferService();

    const method =
      service?.getOfferHistory ||
      service?.getHistory;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Offer history is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          offerId,

          userId
        }
      );

    return success(
      res,
      result,
      'Offer history retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[OFFER] History error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve offer history.',
      error
    );
  }
}

/* ============================================================
   12. ACCEPT COUNTER OFFER
   ============================================================ */

/**
 * POST /api/offers/:offerId/counter/:counterOfferId/accept
 */

async function acceptCounterOffer(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const offerId =
      getOfferId(req);

    const counterOfferId =
      req.params?.counterOfferId ||
      req.body?.counterOfferId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!offerId) {
      return failure(
        res,
        400,
        'Offer ID is required.'
      );
    }

    if (!counterOfferId) {
      return failure(
        res,
        400,
        'Counter offer ID is required.'
      );
    }

    const service =
      getOfferService();

    const method =
      service?.acceptCounterOffer;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Counter offer acceptance is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          offerId,

          counterOfferId,

          userId
        }
      );

    await createAuditLog(
      req,
      'COUNTER_OFFER_ACCEPTED',
      {
        offerId,

        counterOfferId
      }
    );

    return success(
      res,
      result,
      'Counter offer accepted successfully.'
    );
  } catch (error) {
    console.error(
      '[OFFER] Accept counter error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to accept counter offer.',
      error
    );
  }
}

/* ============================================================
   13. REJECT COUNTER OFFER
   ============================================================ */

/**
 * POST /api/offers/:offerId/counter/:counterOfferId/reject
 */

async function rejectCounterOffer(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const offerId =
      getOfferId(req);

    const counterOfferId =
      req.params?.counterOfferId ||
      req.body?.counterOfferId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!offerId) {
      return failure(
        res,
        400,
        'Offer ID is required.'
      );
    }

    if (!counterOfferId) {
      return failure(
        res,
        400,
        'Counter offer ID is required.'
      );
    }

    const service =
      getOfferService();

    const method =
      service?.rejectCounterOffer;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Counter offer rejection is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          offerId,

          counterOfferId,

          userId,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'COUNTER_OFFER_REJECTED',
      {
        offerId,

        counterOfferId
      }
    );

    return success(
      res,
      result,
      'Counter offer rejected successfully.'
    );
  } catch (error) {
    console.error(
      '[OFFER] Reject counter error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to reject counter offer.',
      error
    );
  }
}

/* ============================================================
   14. EXPIRE OFFER
   ============================================================ */

/**
 * POST /api/offers/:offerId/expire
 *
 * Usually intended for system/admin/cron usage.
 */

async function expireOffer(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const offerId =
      getOfferId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!offerId) {
      return failure(
        res,
        400,
        'Offer ID is required.'
      );
    }

    const service =
      getOfferService();

    const method =
      service?.expireOffer;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Offer expiration is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          offerId,

          userId
        }
      );

    await createAuditLog(
      req,
      'OFFER_EXPIRED',
      {
        offerId
      }
    );

    return success(
      res,
      result,
      'Offer expired successfully.'
    );
  } catch (error) {
    console.error(
      '[OFFER] Expire error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to expire offer.',
      error
    );
  }
}

/* ============================================================
   15. OFFER STATUS
   ============================================================ */

/**
 * GET /api/offers/:offerId/status
 */

async function getOfferStatus(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const offerId =
      getOfferId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!offerId) {
      return failure(
        res,
        400,
        'Offer ID is required.'
      );
    }

    const service =
      getOfferService();

    const method =
      service?.getOfferStatus;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Offer status retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          offerId,

          userId
        }
      );

    return success(
      res,
      result,
      'Offer status retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[OFFER] Status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve offer status.',
      error
    );
  }
}

/* ============================================================
   16. CANCEL OFFER
   ============================================================ */

/**
 * POST /api/offers/:offerId/cancel
 */

async function cancelOffer(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const offerId =
      getOfferId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!offerId) {
      return failure(
        res,
        400,
        'Offer ID is required.'
      );
    }

    const service =
      getOfferService();

    const method =
      service?.cancelOffer;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Offer cancellation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          offerId,

          userId,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'OFFER_CANCELLED',
      {
        offerId
      }
    );

    return success(
      res,
      result,
      'Offer cancelled successfully.'
    );
  } catch (error) {
    console.error(
      '[OFFER] Cancel error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to cancel offer.',
      error
    );
  }
}

/* ============================================================
   17. OFFER STATISTICS
   ============================================================ */

/**
 * GET /api/offers/statistics
 */

async function getOfferStatistics(
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
      getOfferService();

    const method =
      service?.getOfferStatistics ||
      service?.getStatistics;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Offer statistics are not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          propertyId:
            req.query?.propertyId ||
            null,

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
      'Offer statistics retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[OFFER] Statistics error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve offer statistics.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  createOffer,

  getOffer,

  updateOffer,

  getMyOffers,

  getReceivedOffers,

  getPropertyOffers,

  acceptOffer,

  rejectOffer,

  withdrawOffer,

  counterOffer,

  getOfferHistory,

  acceptCounterOffer,

  rejectCounterOffer,

  expireOffer,

  getOfferStatus,

  cancelOffer,

  getOfferStatistics
};