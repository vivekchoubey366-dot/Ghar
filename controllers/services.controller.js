'use strict';

/**
 * ============================================================
 * GHAR - Services Controller
 * ============================================================
 *
 * Handles GHAR service marketplace / service requests:
 *
 * - List services
 * - Get service by ID
 * - Search services
 * - Services by category
 * - Create service request
 * - Get my service requests
 * - Get service request
 * - Update service request
 * - Cancel service request
 * - Assign service provider
 * - Update service request status
 * - Service providers
 * - Service reviews
 *
 * Business logic:
 *     services/services.service.js
 *
 * Database logic:
 *     repositories/services.repository.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE LOADER
   ============================================================ */

function getServicesService() {
  try {
    return require('../services/services.service');
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
   NUMBER
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
   ARRAY
   ============================================================ */

function parseArray(value) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map(item => String(item).trim())
      .filter(Boolean);
  }

  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
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
        'service',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.['user-agent'] ||
        null
    });
  } catch (error) {
    console.error(
      '[SERVICES AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. LIST SERVICES
   ============================================================ */

/**
 * GET /api/services
 */

async function getServices(
  req,
  res
) {
  try {
    const service =
      getServicesService();

    const method =
      service?.getServices ||
      service?.listServices;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Service listing is not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          category:
            req.query?.category ||
            null,

          city:
            req.query?.city ||
            null,

          state:
            req.query?.state ||
            null,

          status:
            req.query?.status ||
            'active',

          featured:
            req.query?.featured ||
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
      'Services retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SERVICES] List error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve services.',
      error
    );
  }
}

/* ============================================================
   2. GET SERVICE
   ============================================================ */

/**
 * GET /api/services/:serviceId
 */

async function getService(
  req,
  res
) {
  try {
    const serviceId =
      req.params?.serviceId ||
      req.params?.id;

    if (!serviceId) {
      return failure(
        res,
        400,
        'Service ID is required.'
      );
    }

    const service =
      getServicesService();

    const method =
      service?.getService ||
      service?.findService;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Service retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          serviceId,

          userId:
            getUserId(req) ||
            null
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Service not found.'
      );
    }

    return success(
      res,
      result,
      'Service retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SERVICES] Get error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve service.',
      error
    );
  }
}

/* ============================================================
   3. SEARCH SERVICES
   ============================================================ */

/**
 * GET /api/services/search
 */

async function searchServices(
  req,
  res
) {
  try {
    const query =
      String(
        req.query?.q ||
        req.query?.query ||
        ''
      ).trim();

    const service =
      getServicesService();

    const method =
      service?.searchServices ||
      service?.search;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Service search is not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          query,

          category:
            req.query?.category ||
            null,

          city:
            req.query?.city ||
            null,

          state:
            req.query?.state ||
            null,

          minPrice:
            parseNumber(
              req.query?.minPrice
            ),

          maxPrice:
            parseNumber(
              req.query?.maxPrice
            ),

          rating:
            parseNumber(
              req.query?.rating
            ),

          page:
            pagination.page,

          limit:
            pagination.limit
        }
      );

    return success(
      res,
      result,
      'Service search completed successfully.'
    );
  } catch (error) {
    console.error(
      '[SERVICES] Search error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to search services.',
      error
    );
  }
}

/* ============================================================
   4. SERVICE CATEGORIES
   ============================================================ */

/**
 * GET /api/services/categories
 */

async function getServiceCategories(
  req,
  res
) {
  try {
    const service =
      getServicesService();

    const method =
      service?.getServiceCategories ||
      service?.getCategories;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Service categories are not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          activeOnly:
            req.query?.activeOnly !==
              'false'
        }
      );

    return success(
      res,
      result,
      'Service categories retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SERVICES] Categories error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve service categories.',
      error
    );
  }
}

/* ============================================================
   5. SERVICES BY CATEGORY
   ============================================================ */

/**
 * GET /api/services/category/:category
 */

async function getServicesByCategory(
  req,
  res
) {
  try {
    const category =
      req.params?.category;

    if (!category) {
      return failure(
        res,
        400,
        'Service category is required.'
      );
    }

    const service =
      getServicesService();

    const method =
      service?.getServicesByCategory;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Category services are not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          category,

          city:
            req.query?.city ||
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
      'Category services retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SERVICES] Category error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve category services.',
      error
    );
  }
}

/* ============================================================
   6. CREATE SERVICE REQUEST
   ============================================================ */

/**
 * POST /api/services/requests
 */

async function createServiceRequest(
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

    const serviceId =
      req.body?.serviceId;

    if (!serviceId) {
      return failure(
        res,
        400,
        'Service ID is required.'
      );
    }

    const service =
      getServicesService();

    const method =
      service?.createServiceRequest;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Service request creation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          serviceId,

          propertyId:
            req.body?.propertyId ||
            null,

          description:
            req.body?.description ||
            null,

          preferredDate:
            req.body?.preferredDate ||
            null,

          preferredTime:
            req.body?.preferredTime ||
            null,

          address:
            req.body?.address ||
            null,

          city:
            req.body?.city ||
            null,

          state:
            req.body?.state ||
            null,

          pincode:
            req.body?.pincode ||
            null,

          latitude:
            parseNumber(
              req.body?.latitude
            ),

          longitude:
            parseNumber(
              req.body?.longitude
            ),

          budget:
            parseNumber(
              req.body?.budget
            ),

          metadata:
            req.body?.metadata ||
            {}
        }
      );

    await createAuditLog(
      req,
      'SERVICE_REQUEST_CREATED',
      {
        serviceId,

        requestId:
          result?.id ||
          result?.requestId ||
          null
      }
    );

    return success(
      res,
      result,
      'Service request created successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[SERVICES] Create request error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to create service request.',
      error
    );
  }
}

/* ============================================================
   7. MY SERVICE REQUESTS
   ============================================================ */

/**
 * GET /api/services/requests
 */

async function getMyServiceRequests(
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
      getServicesService();

    const method =
      service?.getMyServiceRequests ||
      service?.getServiceRequests;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Service request listing is not implemented.'
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
      'Service requests retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SERVICES] My requests error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve service requests.',
      error
    );
  }
}

/* ============================================================
   8. GET SERVICE REQUEST
   ============================================================ */

/**
 * GET /api/services/requests/:requestId
 */

async function getServiceRequest(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const requestId =
      req.params?.requestId ||
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!requestId) {
      return failure(
        res,
        400,
        'Service request ID is required.'
      );
    }

    const service =
      getServicesService();

    const method =
      service?.getServiceRequest;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Service request retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          requestId,

          userId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Service request not found.'
      );
    }

    return success(
      res,
      result,
      'Service request retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SERVICES] Get request error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve service request.',
      error
    );
  }
}

/* ============================================================
   9. UPDATE SERVICE REQUEST
   ============================================================ */

/**
 * PATCH /api/services/requests/:requestId
 */

async function updateServiceRequest(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const requestId =
      req.params?.requestId ||
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!requestId) {
      return failure(
        res,
        400,
        'Service request ID is required.'
      );
    }

    const service =
      getServicesService();

    const method =
      service?.updateServiceRequest;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Service request update is not implemented.'
      );
    }

    const allowedFields = [
      'description',
      'preferredDate',
      'preferredTime',
      'address',
      'city',
      'state',
      'pincode',
      'budget',
      'metadata'
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
      updates.budget !==
      undefined
    ) {
      updates.budget =
        parseNumber(
          updates.budget
        );
    }

    const result =
      await method.call(
        service,
        {
          requestId,

          userId,

          updates
        }
      );

    return success(
      res,
      result,
      'Service request updated successfully.'
    );
  } catch (error) {
    console.error(
      '[SERVICES] Update request error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update service request.',
      error
    );
  }
}

/* ============================================================
   10. CANCEL SERVICE REQUEST
   ============================================================ */

/**
 * POST /api/services/requests/:requestId/cancel
 */

async function cancelServiceRequest(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const requestId =
      req.params?.requestId ||
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!requestId) {
      return failure(
        res,
        400,
        'Service request ID is required.'
      );
    }

    const service =
      getServicesService();

    const method =
      service?.cancelServiceRequest;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Service request cancellation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          requestId,

          userId,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'SERVICE_REQUEST_CANCELLED',
      {
        requestId
      }
    );

    return success(
      res,
      result,
      'Service request cancelled successfully.'
    );
  } catch (error) {
    console.error(
      '[SERVICES] Cancel request error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to cancel service request.',
      error
    );
  }
}

/* ============================================================
   11. SERVICE PROVIDERS
   ============================================================ */

/**
 * GET /api/services/providers
 */

async function getServiceProviders(
  req,
  res
) {
  try {
    const service =
      getServicesService();

    const method =
      service?.getServiceProviders ||
      service?.getProviders;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Service provider listing is not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          serviceId:
            req.query?.serviceId ||
            null,

          category:
            req.query?.category ||
            null,

          city:
            req.query?.city ||
            null,

          state:
            req.query?.state ||
            null,

          minRating:
            parseNumber(
              req.query?.minRating
            ),

          page:
            pagination.page,

          limit:
            pagination.limit
        }
      );

    return success(
      res,
      result,
      'Service providers retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SERVICES] Providers error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve service providers.',
      error
    );
  }
}

/* ============================================================
   12. SERVICE PROVIDER PROFILE
   ============================================================ */

/**
 * GET /api/services/providers/:providerId
 */

async function getServiceProvider(
  req,
  res
) {
  try {
    const providerId =
      req.params?.providerId;

    if (!providerId) {
      return failure(
        res,
        400,
        'Provider ID is required.'
      );
    }

    const service =
      getServicesService();

    const method =
      service?.getServiceProvider ||
      service?.getProvider;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Service provider retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          providerId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Service provider not found.'
      );
    }

    return success(
      res,
      result,
      'Service provider retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SERVICES] Provider error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve service provider.',
      error
    );
  }
}

/* ============================================================
   13. ASSIGN PROVIDER
   ============================================================ */

/**
 * POST /api/services/requests/:requestId/assign
 */

async function assignServiceProvider(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const requestId =
      req.params?.requestId ||
      req.params?.id;

    const providerId =
      req.body?.providerId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!requestId) {
      return failure(
        res,
        400,
        'Service request ID is required.'
      );
    }

    if (!providerId) {
      return failure(
        res,
        400,
        'Provider ID is required.'
      );
    }

    const service =
      getServicesService();

    const method =
      service?.assignServiceProvider ||
      service?.assignProvider;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Provider assignment is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          requestId,

          providerId,

          assignedBy:
            userId
        }
      );

    await createAuditLog(
      req,
      'SERVICE_PROVIDER_ASSIGNED',
      {
        requestId,

        providerId
      }
    );

    return success(
      res,
      result,
      'Service provider assigned successfully.'
    );
  } catch (error) {
    console.error(
      '[SERVICES] Assign provider error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to assign service provider.',
      error
    );
  }
}

/* ============================================================
   14. UPDATE REQUEST STATUS
   ============================================================ */

/**
 * PATCH /api/services/requests/:requestId/status
 */

async function updateServiceRequestStatus(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const requestId =
      req.params?.requestId ||
      req.params?.id;

    const status =
      req.body?.status;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!requestId) {
      return failure(
        res,
        400,
        'Service request ID is required.'
      );
    }

    if (!status) {
      return failure(
        res,
        400,
        'Service request status is required.'
      );
    }

    const service =
      getServicesService();

    const method =
      service?.updateServiceRequestStatus;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Service request status update is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          requestId,

          status,

          updatedBy:
            userId,

          note:
            req.body?.note ||
            null
        }
      );

    await createAuditLog(
      req,
      'SERVICE_REQUEST_STATUS_UPDATED',
      {
        requestId,

        status
      }
    );

    return success(
      res,
      result,
      'Service request status updated successfully.'
    );
  } catch (error) {
    console.error(
      '[SERVICES] Status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update service request status.',
      error
    );
  }
}

/* ============================================================
   15. SERVICE REVIEWS
   ============================================================ */

/**
 * GET /api/services/:serviceId/reviews
 */

async function getServiceReviews(
  req,
  res
) {
  try {
    const serviceId =
      req.params?.serviceId;

    if (!serviceId) {
      return failure(
        res,
        400,
        'Service ID is required.'
      );
    }

    const service =
      getServicesService();

    const method =
      service?.getServiceReviews ||
      service?.getReviews;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Service reviews are not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          serviceId,

          page:
            pagination.page,

          limit:
            pagination.limit
        }
      );

    return success(
      res,
      result,
      'Service reviews retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SERVICES] Reviews error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve service reviews.',
      error
    );
  }
}

/* ============================================================
   16. CREATE SERVICE REVIEW
   ============================================================ */

/**
 * POST /api/services/requests/:requestId/review
 */

async function createServiceReview(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const requestId =
      req.params?.requestId ||
      req.params?.id;

    const rating =
      parseNumber(
        req.body?.rating
      );

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!requestId) {
      return failure(
        res,
        400,
        'Service request ID is required.'
      );
    }

    if (
      rating === null ||
      rating < 1 ||
      rating > 5
    ) {
      return failure(
        res,
        400,
        'Rating must be between 1 and 5.'
      );
    }

    const service =
      getServicesService();

    const method =
      service?.createServiceReview ||
      service?.createReview;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Service review creation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          requestId,

          userId,

          rating,

          review:
            req.body?.review ||
            null,

          photos:
            parseArray(
              req.body?.photos
            )
        }
      );

    await createAuditLog(
      req,
      'SERVICE_REVIEW_CREATED',
      {
        requestId,

        rating
      }
    );

    return success(
      res,
      result,
      'Service review submitted successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[SERVICES] Review error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to submit service review.',
      error
    );
  }
}

/* ============================================================
   17. SERVICE AVAILABILITY
   ============================================================ */

/**
 * GET /api/services/:serviceId/availability
 */

async function getServiceAvailability(
  req,
  res
) {
  try {
    const serviceId =
      req.params?.serviceId;

    if (!serviceId) {
      return failure(
        res,
        400,
        'Service ID is required.'
      );
    }

    const service =
      getServicesService();

    const method =
      service?.getServiceAvailability ||
      service?.getAvailability;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Service availability is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          serviceId,

          date:
            req.query?.date ||
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
      'Service availability retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SERVICES] Availability error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve service availability.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  getServices,

  getService,

  searchServices,

  getServiceCategories,

  getServicesByCategory,

  createServiceRequest,

  getMyServiceRequests,

  getServiceRequest,

  updateServiceRequest,

  cancelServiceRequest,

  getServiceProviders,

  getServiceProvider,

  assignServiceProvider,

  updateServiceRequestStatus,

  getServiceReviews,

  createServiceReview,

  getServiceAvailability
};