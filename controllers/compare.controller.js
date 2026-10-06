'use strict';

/**
 * ============================================================
 * GHAR - Property Comparison Controller
 * ============================================================
 *
 * Handles:
 * - Compare properties
 * - Compare multiple properties
 * - Compare by property IDs
 * - Save comparison
 * - Retrieve saved comparisons
 * - Delete saved comparison
 *
 * Controller responsibilities:
 * - Validate HTTP request
 * - Extract authenticated user
 * - Call comparison service
 * - Return standardized API responses
 *
 * Business logic belongs in:
 *     services/compare.service.js
 *
 * Database logic belongs in:
 *     repositories/compare.repository.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE
   ============================================================ */

function getCompareService() {
  try {
    return require('../services/compare.service');
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
   PROPERTY IDS
   ============================================================ */

function normalizePropertyIds(
  value
) {
  if (
    Array.isArray(value)
  ) {
    return value
      .map((id) =>
        String(id).trim()
      )
      .filter(Boolean);
  }

  if (
    typeof value ===
    'string'
  ) {
    return value
      .split(',')
      .map((id) =>
        id.trim()
      )
      .filter(Boolean);
  }

  return [];
}

function validatePropertyIds(
  propertyIds
) {
  if (
    !Array.isArray(propertyIds) ||
    propertyIds.length <
      2
  ) {
    return {
      valid: false,
      message:
        'At least 2 properties are required for comparison.'
    };
  }

  const maxProperties =
    Number(
      process.env.COMPARE_MAX_PROPERTIES ||
      4
    );

  if (
    propertyIds.length >
    maxProperties
  ) {
    return {
      valid: false,
      message:
        `You can compare a maximum of ${maxProperties} properties at once.`
    };
  }

  const uniqueIds =
    new Set(propertyIds);

  if (
    uniqueIds.size !==
    propertyIds.length
  ) {
    return {
      valid: false,
      message:
        'Duplicate property IDs are not allowed.'
    };
  }

  return {
    valid: true
  };
}

/* ============================================================
   AUDIT
   ============================================================ */

async function createAuditLog(
  req,
  action,
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
      userId:
        getUserId(req),

      action,

      resource:
        'property_comparison',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.[
          'user-agent'
        ] || null
    });
  } catch (error) {
    console.error(
      '[COMPARE AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. COMPARE PROPERTIES
   ============================================================ */

/**
 * POST /api/compare
 *
 * Body:
 * {
 *   "propertyIds": [
 *     "GHAR-P001",
 *     "GHAR-P002"
 *   ]
 * }
 */

async function compareProperties(
  req,
  res
) {
  try {
    const propertyIds =
      normalizePropertyIds(
        req.body?.propertyIds ||
        req.body?.properties ||
        req.body?.ids
      );

    const validation =
      validatePropertyIds(
        propertyIds
      );

    if (
      !validation.valid
    ) {
      return failure(
        res,
        400,
        validation.message
      );
    }

    const service =
      getCompareService();

    if (!service) {
      return failure(
        res,
        503,
        'Comparison service is unavailable.'
      );
    }

    const method =
      service.compareProperties ||
      service.compare;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property comparison is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyIds,

          userId:
            getUserId(req),

          options:
            req.body?.options ||
            {}
        }
      );

    await createAuditLog(
      req,
      'PROPERTIES_COMPARED',
      {
        propertyIds
      }
    );

    return success(
      res,
      result,
      'Properties compared successfully.'
    );
  } catch (error) {
    console.error(
      '[COMPARE] Compare error:',
      error
    );

    if (
      error?.code ===
      'PROPERTY_NOT_FOUND'
    ) {
      return failure(
        res,
        404,
        'One or more properties were not found.'
      );
    }

    return failure(
      res,
      500,
      'Unable to compare properties.',
      error
    );
  }
}

/* ============================================================
   2. GET COMPARISON
   ============================================================ */

/**
 * GET /api/compare?propertyIds=id1,id2,id3
 */

async function getComparison(
  req,
  res
) {
  try {
    const propertyIds =
      normalizePropertyIds(
        req.query?.propertyIds ||
        req.query?.properties ||
        req.query?.ids
      );

    const validation =
      validatePropertyIds(
        propertyIds
      );

    if (
      !validation.valid
    ) {
      return failure(
        res,
        400,
        validation.message
      );
    }

    const service =
      getCompareService();

    if (!service) {
      return failure(
        res,
        503,
        'Comparison service is unavailable.'
      );
    }

    const method =
      service.compareProperties ||
      service.getComparison ||
      service.compare;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property comparison is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyIds,

          userId:
            getUserId(req),

          options:
            req.query || {}
        }
      );

    return success(
      res,
      result,
      'Comparison retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[COMPARE] Get comparison error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve comparison.',
      error
    );
  }
}

/* ============================================================
   3. COMPARE BY PATH PARAMETERS
   ============================================================ */

/**
 * GET /api/compare/:propertyId1/:propertyId2
 */

async function compareByIds(
  req,
  res
) {
  try {
    const propertyIds =
      normalizePropertyIds([
        req.params?.propertyId1,
        req.params?.propertyId2,
        req.params?.propertyId3
      ]);

    const validation =
      validatePropertyIds(
        propertyIds
      );

    if (
      !validation.valid
    ) {
      return failure(
        res,
        400,
        validation.message
      );
    }

    const service =
      getCompareService();

    if (!service) {
      return failure(
        res,
        503,
        'Comparison service is unavailable.'
      );
    }

    const method =
      service.compareProperties ||
      service.compare;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property comparison is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyIds,

          userId:
            getUserId(req)
        }
      );

    return success(
      res,
      result,
      'Properties compared successfully.'
    );
  } catch (error) {
    console.error(
      '[COMPARE] ID comparison error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to compare properties.',
      error
    );
  }
}

/* ============================================================
   4. SAVE COMPARISON
   ============================================================ */

/**
 * POST /api/compare/save
 *
 * Authentication required.
 *
 * Body:
 * {
 *   "name": "Noida Properties",
 *   "propertyIds": [
 *     "GHAR-P001",
 *     "GHAR-P002"
 *   ]
 * }
 */

async function saveComparison(
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
        'Authentication required to save a comparison.'
      );
    }

    const propertyIds =
      normalizePropertyIds(
        req.body?.propertyIds ||
        req.body?.properties ||
        req.body?.ids
      );

    const validation =
      validatePropertyIds(
        propertyIds
      );

    if (
      !validation.valid
    ) {
      return failure(
        res,
        400,
        validation.message
      );
    }

    const service =
      getCompareService();

    if (!service) {
      return failure(
        res,
        503,
        'Comparison service is unavailable.'
      );
    }

    const method =
      service.saveComparison ||
      service.createComparison;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Saving comparisons is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          name:
            req.body?.name ||
            null,

          propertyIds,

          metadata:
            req.body?.metadata ||
            {}
        }
      );

    await createAuditLog(
      req,
      'COMPARISON_SAVED',
      {
        comparisonId:
          result?.id ||
          result?.comparisonId ||
          null,

        propertyIds
      }
    );

    return success(
      res,
      result,
      'Comparison saved successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[COMPARE] Save error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to save comparison.',
      error
    );
  }
}

/* ============================================================
   5. LIST SAVED COMPARISONS
   ============================================================ */

/**
 * GET /api/compare/saved
 */

async function listSavedComparisons(
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
      getCompareService();

    if (!service) {
      return failure(
        res,
        503,
        'Comparison service is unavailable.'
      );
    }

    const method =
      service.getSavedComparisons ||
      service.listSavedComparisons ||
      service.listComparisons;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Saved comparison listing is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          page:
            Number(
              req.query?.page
            ) || 1,

          limit:
            Math.min(
              Number(
                req.query?.limit
              ) || 20,
              100
            )
        }
      );

    return success(
      res,
      result,
      'Saved comparisons retrieved.'
    );
  } catch (error) {
    console.error(
      '[COMPARE] Saved list error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve saved comparisons.',
      error
    );
  }
}

/* ============================================================
   6. GET SAVED COMPARISON
   ============================================================ */

/**
 * GET /api/compare/saved/:id
 */

async function getSavedComparison(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const comparisonId =
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!comparisonId) {
      return failure(
        res,
        400,
        'Comparison ID is required.'
      );
    }

    const service =
      getCompareService();

    if (!service) {
      return failure(
        res,
        503,
        'Comparison service is unavailable.'
      );
    }

    const method =
      service.getSavedComparison ||
      service.getComparisonById;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Saved comparison retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          comparisonId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Saved comparison not found.'
      );
    }

    return success(
      res,
      result,
      'Saved comparison retrieved.'
    );
  } catch (error) {
    console.error(
      '[COMPARE] Get saved comparison error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve saved comparison.',
      error
    );
  }
}

/* ============================================================
   7. UPDATE SAVED COMPARISON
   ============================================================ */

/**
 * PATCH /api/compare/saved/:id
 */

async function updateSavedComparison(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const comparisonId =
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!comparisonId) {
      return failure(
        res,
        400,
        'Comparison ID is required.'
      );
    }

    const propertyIds =
      req.body?.propertyIds ||
      req.body?.properties ||
      req.body?.ids;

    let normalizedIds = null;

    if (
      propertyIds !==
      undefined
    ) {
      normalizedIds =
        normalizePropertyIds(
          propertyIds
        );

      const validation =
        validatePropertyIds(
          normalizedIds
        );

      if (
        !validation.valid
      ) {
        return failure(
          res,
          400,
          validation.message
        );
      }
    }

    const service =
      getCompareService();

    if (!service) {
      return failure(
        res,
        503,
        'Comparison service is unavailable.'
      );
    }

    const method =
      service.updateSavedComparison ||
      service.updateComparison;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Saved comparison update is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          comparisonId,

          name:
            req.body?.name,

          propertyIds:
            normalizedIds,

          metadata:
            req.body?.metadata
        }
      );

    await createAuditLog(
      req,
      'COMPARISON_UPDATED',
      {
        comparisonId
      }
    );

    return success(
      res,
      result,
      'Comparison updated successfully.'
    );
  } catch (error) {
    console.error(
      '[COMPARE] Update error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update comparison.',
      error
    );
  }
}

/* ============================================================
   8. DELETE SAVED COMPARISON
   ============================================================ */

/**
 * DELETE /api/compare/saved/:id
 */

async function deleteSavedComparison(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const comparisonId =
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!comparisonId) {
      return failure(
        res,
        400,
        'Comparison ID is required.'
      );
    }

    const service =
      getCompareService();

    if (!service) {
      return failure(
        res,
        503,
        'Comparison service is unavailable.'
      );
    }

    const method =
      service.deleteSavedComparison ||
      service.removeComparison ||
      service.deleteComparison;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Saved comparison deletion is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          comparisonId
        }
      );

    await createAuditLog(
      req,
      'COMPARISON_DELETED',
      {
        comparisonId
      }
    );

    return success(
      res,
      result,
      'Saved comparison deleted successfully.'
    );
  } catch (error) {
    console.error(
      '[COMPARE] Delete error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to delete saved comparison.',
      error
    );
  }
}

/* ============================================================
   9. PROPERTY COMPARISON SCORE
   ============================================================ */

/**
 * POST /api/compare/score
 *
 * Optional AI/ranking layer.
 */

async function getComparisonScore(
  req,
  res
) {
  try {
    const propertyIds =
      normalizePropertyIds(
        req.body?.propertyIds
      );

    const validation =
      validatePropertyIds(
        propertyIds
      );

    if (
      !validation.valid
    ) {
      return failure(
        res,
        400,
        validation.message
      );
    }

    const service =
      getCompareService();

    if (!service) {
      return failure(
        res,
        503,
        'Comparison service is unavailable.'
      );
    }

    const method =
      service.calculateScore ||
      service.getComparisonScore ||
      service.rankProperties;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Comparison scoring is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyIds,

          userId:
            getUserId(req),

          criteria:
            req.body?.criteria ||
            {},

          weights:
            req.body?.weights ||
            {}
        }
      );

    return success(
      res,
      result,
      'Comparison score calculated.'
    );
  } catch (error) {
    console.error(
      '[COMPARE] Score error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to calculate comparison score.',
      error
    );
  }
}

/* ============================================================
   10. AI COMPARISON SUMMARY
   ============================================================ */

/**
 * POST /api/compare/ai-summary
 *
 * This controller delegates AI processing to
 * compare.service.js / AI service.
 */

async function getAIComparisonSummary(
  req,
  res
) {
  try {
    const propertyIds =
      normalizePropertyIds(
        req.body?.propertyIds
      );

    const validation =
      validatePropertyIds(
        propertyIds
      );

    if (
      !validation.valid
    ) {
      return failure(
        res,
        400,
        validation.message
      );
    }

    const service =
      getCompareService();

    if (!service) {
      return failure(
        res,
        503,
        'Comparison service is unavailable.'
      );
    }

    const method =
      service.generateAISummary ||
      service.getAIComparisonSummary ||
      service.generateComparisonSummary;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'AI comparison summary is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyIds,

          userId:
            getUserId(req),

          preferences:
            req.body?.preferences ||
            {},

          question:
            req.body?.question ||
            null
        }
      );

    await createAuditLog(
      req,
      'AI_COMPARISON_SUMMARY',
      {
        propertyIds
      }
    );

    return success(
      res,
      result,
      'AI comparison summary generated.'
    );
  } catch (error) {
    console.error(
      '[COMPARE] AI summary error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to generate AI comparison summary.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  compareProperties,

  getComparison,

  compareByIds,

  saveComparison,

  listSavedComparisons,

  getSavedComparison,

  updateSavedComparison,

  deleteSavedComparison,

  getComparisonScore,

  getAIComparisonSummary
};