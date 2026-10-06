'use strict';

/**
 * ============================================================
 * GHAR - Visit Controller
 * ============================================================
 *
 * Handles:
 * - Schedule property visits
 * - Get visit details
 * - Get buyer's visits
 * - Get seller/property visits
 * - Update visit
 * - Confirm visit
 * - Reschedule visit
 * - Cancel visit
 * - Complete visit
 * - Mark no-show
 * - Visit history
 *
 * Business logic:
 *     services/visit.service.js
 *
 * Database logic:
 *     repositories/visit.repository.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE LOADER
   ============================================================ */

function getVisitService() {
  try {
    return require('../services/visit.service');
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
        'visit',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.['user-agent'] ||
        null
    });
  } catch (error) {
    console.error(
      '[VISIT AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   DATE VALIDATION
   ============================================================ */

function isValidDate(value) {
  if (!value) {
    return false;
  }

  const date =
    new Date(value);

  return !Number.isNaN(
    date.getTime()
  );
}

/* ============================================================
   TIME VALIDATION
   ============================================================ */

function isValidTime(value) {
  if (!value) {
    return false;
  }

  return /^([01]\d|2[0-3]):[0-5]\d$/.test(
    String(value)
  );
}

/* ============================================================
   1. CREATE / SCHEDULE VISIT
   ============================================================ */

/**
 * POST /api/visits
 */

async function createVisit(
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

    const propertyId =
      req.body?.propertyId;

    const visitDate =
      req.body?.visitDate ||
      req.body?.date;

    const visitTime =
      req.body?.visitTime ||
      req.body?.time;

    if (!propertyId) {
      return failure(
        res,
        400,
        'Property ID is required.'
      );
    }

    if (
      !isValidDate(
        visitDate
      )
    ) {
      return failure(
        res,
        400,
        'A valid visit date is required.'
      );
    }

    if (
      !isValidTime(
        visitTime
      )
    ) {
      return failure(
        res,
        400,
        'A valid visit time is required in HH:MM format.'
      );
    }

    const service =
      getVisitService();

    const method =
      service?.createVisit ||
      service?.scheduleVisit;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Visit scheduling is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          propertyId,

          visitDate,

          visitTime,

          duration:
            req.body?.duration ||
            30,

          notes:
            req.body?.notes ||
            null,

          contactPhone:
            req.body?.contactPhone ||
            null,

          contactEmail:
            req.body?.contactEmail ||
            null
        }
      );

    await createAuditLog(
      req,
      'VISIT_CREATED',
      {
        visitId:
          result?.id ||
          result?.visitId ||
          null,

        propertyId
      }
    );

    return success(
      res,
      result,
      'Property visit scheduled successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[VISIT] Create error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to schedule property visit.',
      error
    );
  }
}

/* ============================================================
   2. GET VISIT DETAILS
   ============================================================ */

/**
 * GET /api/visits/:visitId
 */

async function getVisit(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const visitId =
      req.params?.visitId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!visitId) {
      return failure(
        res,
        400,
        'Visit ID is required.'
      );
    }

    const service =
      getVisitService();

    const method =
      service?.getVisit;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Visit retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          visitId,

          userId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Visit not found.'
      );
    }

    return success(
      res,
      result,
      'Visit details retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[VISIT] Get error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve visit details.',
      error
    );
  }
}

/* ============================================================
   3. GET MY VISITS
   ============================================================ */

/**
 * GET /api/visits/my
 */

async function getMyVisits(
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
      getVisitService();

    const method =
      service?.getUserVisits ||
      service?.getMyVisits;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'User visit retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          status:
            req.query?.status ||
            null,

          from:
            req.query?.from ||
            null,

          to:
            req.query?.to ||
            null,

          propertyId:
            req.query?.propertyId ||
            null,

          page:
            Math.max(
              parseInt(
                req.query?.page,
                10
              ) || 1,
              1
            ),

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
      'Your visits retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[VISIT] My visits error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve your visits.',
      error
    );
  }
}

/* ============================================================
   4. GET PROPERTY VISITS
   ============================================================ */

/**
 * GET /api/visits/property/:propertyId
 */

async function getPropertyVisits(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const propertyId =
      req.params?.propertyId;

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
      getVisitService();

    const method =
      service?.getPropertyVisits;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property visit retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyId,

          userId,

          status:
            req.query?.status ||
            null,

          from:
            req.query?.from ||
            null,

          to:
            req.query?.to ||
            null,

          page:
            Math.max(
              parseInt(
                req.query?.page,
                10
              ) || 1,
              1
            ),

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
      'Property visits retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[VISIT] Property visits error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve property visits.',
      error
    );
  }
}

/* ============================================================
   5. UPDATE VISIT
   ============================================================ */

/**
 * PATCH /api/visits/:visitId
 */

async function updateVisit(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const visitId =
      req.params?.visitId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!visitId) {
      return failure(
        res,
        400,
        'Visit ID is required.'
      );
    }

    const updates = {};

    if (
      req.body?.visitDate !==
      undefined
    ) {
      if (
        !isValidDate(
          req.body.visitDate
        )
      ) {
        return failure(
          res,
          400,
          'Invalid visit date.'
        );
      }

      updates.visitDate =
        req.body.visitDate;
    }

    if (
      req.body?.visitTime !==
      undefined
    ) {
      if (
        !isValidTime(
          req.body.visitTime
        )
      ) {
        return failure(
          res,
          400,
          'Invalid visit time.'
        );
      }

      updates.visitTime =
        req.body.visitTime;
    }

    const allowedFields = [
      'duration',
      'notes',
      'contactPhone',
      'contactEmail'
    ];

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
        'No valid visit fields were provided.'
      );
    }

    const service =
      getVisitService();

    const method =
      service?.updateVisit;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Visit update is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          visitId,

          userId,

          updates
        }
      );

    await createAuditLog(
      req,
      'VISIT_UPDATED',
      {
        visitId,

        fields:
          Object.keys(updates)
      }
    );

    return success(
      res,
      result,
      'Visit updated successfully.'
    );
  } catch (error) {
    console.error(
      '[VISIT] Update error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update visit.',
      error
    );
  }
}

/* ============================================================
   6. CONFIRM VISIT
   ============================================================ */

/**
 * POST /api/visits/:visitId/confirm
 */

async function confirmVisit(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const visitId =
      req.params?.visitId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!visitId) {
      return failure(
        res,
        400,
        'Visit ID is required.'
      );
    }

    const service =
      getVisitService();

    const method =
      service?.confirmVisit;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Visit confirmation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          visitId,

          userId
        }
      );

    await createAuditLog(
      req,
      'VISIT_CONFIRMED',
      {
        visitId
      }
    );

    return success(
      res,
      result,
      'Visit confirmed successfully.'
    );
  } catch (error) {
    console.error(
      '[VISIT] Confirm error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to confirm visit.',
      error
    );
  }
}

/* ============================================================
   7. RESCHEDULE VISIT
   ============================================================ */

/**
 * POST /api/visits/:visitId/reschedule
 */

async function rescheduleVisit(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const visitId =
      req.params?.visitId;

    const visitDate =
      req.body?.visitDate ||
      req.body?.date;

    const visitTime =
      req.body?.visitTime ||
      req.body?.time;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!visitId) {
      return failure(
        res,
        400,
        'Visit ID is required.'
      );
    }

    if (
      !isValidDate(
        visitDate
      )
    ) {
      return failure(
        res,
        400,
        'A valid new visit date is required.'
      );
    }

    if (
      !isValidTime(
        visitTime
      )
    ) {
      return failure(
        res,
        400,
        'A valid new visit time is required.'
      );
    }

    const service =
      getVisitService();

    const method =
      service?.rescheduleVisit;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Visit rescheduling is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          visitId,

          userId,

          visitDate,

          visitTime,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'VISIT_RESCHEDULED',
      {
        visitId
      }
    );

    return success(
      res,
      result,
      'Visit rescheduled successfully.'
    );
  } catch (error) {
    console.error(
      '[VISIT] Reschedule error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to reschedule visit.',
      error
    );
  }
}

/* ============================================================
   8. CANCEL VISIT
   ============================================================ */

/**
 * POST /api/visits/:visitId/cancel
 */

async function cancelVisit(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const visitId =
      req.params?.visitId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!visitId) {
      return failure(
        res,
        400,
        'Visit ID is required.'
      );
    }

    const service =
      getVisitService();

    const method =
      service?.cancelVisit;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Visit cancellation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          visitId,

          userId,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'VISIT_CANCELLED',
      {
        visitId
      }
    );

    return success(
      res,
      result,
      'Visit cancelled successfully.'
    );
  } catch (error) {
    console.error(
      '[VISIT] Cancel error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to cancel visit.',
      error
    );
  }
}

/* ============================================================
   9. COMPLETE VISIT
   ============================================================ */

/**
 * POST /api/visits/:visitId/complete
 */

async function completeVisit(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const visitId =
      req.params?.visitId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!visitId) {
      return failure(
        res,
        400,
        'Visit ID is required.'
      );
    }

    const service =
      getVisitService();

    const method =
      service?.completeVisit;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Visit completion is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          visitId,

          userId,

          feedback:
            req.body?.feedback ||
            null,

          rating:
            req.body?.rating ||
            null
        }
      );

    await createAuditLog(
      req,
      'VISIT_COMPLETED',
      {
        visitId
      }
    );

    return success(
      res,
      result,
      'Visit marked as completed successfully.'
    );
  } catch (error) {
    console.error(
      '[VISIT] Complete error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to complete visit.',
      error
    );
  }
}

/* ============================================================
   10. MARK NO-SHOW
   ============================================================ */

/**
 * POST /api/visits/:visitId/no-show
 *
 * Normally this should be restricted to:
 * - property owner/seller
 * - authorized agent
 * - admin
 */

async function markNoShow(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const visitId =
      req.params?.visitId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!visitId) {
      return failure(
        res,
        400,
        'Visit ID is required.'
      );
    }

    const service =
      getVisitService();

    const method =
      service?.markNoShow;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'No-show handling is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          visitId,

          userId,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'VISIT_MARKED_NO_SHOW',
      {
        visitId
      }
    );

    return success(
      res,
      result,
      'Visit marked as no-show successfully.'
    );
  } catch (error) {
    console.error(
      '[VISIT] No-show error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to mark visit as no-show.',
      error
    );
  }
}

/* ============================================================
   11. VISIT HISTORY
   ============================================================ */

/**
 * GET /api/visits/history
 */

async function getVisitHistory(
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
      getVisitService();

    const method =
      service?.getVisitHistory;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Visit history is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          status:
            req.query?.status ||
            null,

          page:
            Math.max(
              parseInt(
                req.query?.page,
                10
              ) || 1,
              1
            ),

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
      'Visit history retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[VISIT] History error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve visit history.',
      error
    );
  }
}

/* ============================================================
   12. GET AVAILABLE SLOTS
   ============================================================ */

/**
 * GET /api/visits/availability/:propertyId
 */

async function getAvailableSlots(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const propertyId =
      req.params?.propertyId;

    const date =
      req.query?.date;

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

    if (
      !isValidDate(date)
    ) {
      return failure(
        res,
        400,
        'A valid date is required.'
      );
    }

    const service =
      getVisitService();

    const method =
      service?.getAvailableSlots;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Visit availability is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyId,

          userId,

          date
        }
      );

    return success(
      res,
      result,
      'Available visit slots retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[VISIT] Availability error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve available visit slots.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  createVisit,

  getVisit,

  getMyVisits,

  getPropertyVisits,

  updateVisit,

  confirmVisit,

  rescheduleVisit,

  cancelVisit,

  completeVisit,

  markNoShow,

  getVisitHistory,

  getAvailableSlots
};