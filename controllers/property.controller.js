'use strict';

/**
 * ============================================================
 * GHAR - Property Controller
 * ============================================================
 *
 * Handles:
 * - Create property
 * - Get property
 * - Update property
 * - Delete property
 * - Publish / unpublish property
 * - Buyer property listings
 * - Seller property listings
 * - Search / filter
 * - Property status
 * - Property images
 * - Property verification
 * - Featured properties
 * - Property statistics
 *
 * Business logic:
 *     services/property.service.js
 *
 * Database logic:
 *     repositories/property.repository.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE
   ============================================================ */

function getPropertyService() {
  try {
    return require('../services/property.service');
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

function getPropertyId(req) {
  return (
    req.params?.propertyId ||
    req.params?.id ||
    req.body?.propertyId ||
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
   BOOLEAN HELPER
   ============================================================ */

function parseBoolean(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return (
    value === 'true' ||
    value === '1'
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
      userId: getUserId(req),

      action,

      resource: 'property',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.['user-agent'] ||
        null
    });
  } catch (error) {
    console.error(
      '[PROPERTY AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. CREATE PROPERTY
   ============================================================ */

/**
 * POST /api/properties
 */

async function createProperty(
  req,
  res
) {
  try {
    const ownerId =
      getUserId(req);

    if (!ownerId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const body =
      req.body || {};

    if (!body.title) {
      return failure(
        res,
        400,
        'Property title is required.'
      );
    }

    if (!body.propertyType) {
      return failure(
        res,
        400,
        'Property type is required.'
      );
    }

    const service =
      getPropertyService();

    const method =
      service?.createProperty;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property creation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          ownerId,

          title:
            body.title,

          description:
            body.description ||
            null,

          propertyType:
            body.propertyType,

          listingType:
            body.listingType ||
            'sale',

          status:
            body.status ||
            'draft',

          price:
            parseNumber(
              body.price
            ),

          monthlyRent:
            parseNumber(
              body.monthlyRent
            ),

          securityDeposit:
            parseNumber(
              body.securityDeposit
            ),

          currency:
            body.currency ||
            'INR',

          bedrooms:
            parseNumber(
              body.bedrooms
            ),

          bathrooms:
            parseNumber(
              body.bathrooms
            ),

          balconies:
            parseNumber(
              body.balconies
            ),

          builtUpArea:
            parseNumber(
              body.builtUpArea
            ),

          carpetArea:
            parseNumber(
              body.carpetArea
            ),

          plotArea:
            parseNumber(
              body.plotArea
            ),

          floor:
            body.floor ||
            null,

          totalFloors:
            parseNumber(
              body.totalFloors
            ),

          furnishing:
            body.furnishing ||
            null,

          parking:
            body.parking ||
            null,

          facing:
            body.facing ||
            null,

          age:
            body.age ||
            null,

          possessionStatus:
            body.possessionStatus ||
            null,

          address:
            body.address ||
            null,

          city:
            body.city ||
            null,

          state:
            body.state ||
            null,

          country:
            body.country ||
            'India',

          pincode:
            body.pincode ||
            null,

          latitude:
            parseNumber(
              body.latitude
            ),

          longitude:
            parseNumber(
              body.longitude
            ),

          amenities:
            body.amenities ||
            [],

          features:
            body.features ||
            [],

          images:
            body.images ||
            [],

          documents:
            body.documents ||
            [],

          metadata:
            body.metadata ||
            {}
        }
      );

    await createAuditLog(
      req,
      'PROPERTY_CREATED',
      {
        propertyId:
          result?.id ||
          result?.propertyId ||
          null
      }
    );

    return success(
      res,
      result,
      'Property created successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[PROPERTY] Create error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to create property.',
      error
    );
  }
}

/* ============================================================
   2. GET PROPERTY
   ============================================================ */

/**
 * GET /api/properties/:propertyId
 */

async function getProperty(
  req,
  res
) {
  try {
    const propertyId =
      getPropertyId(req);

    if (!propertyId) {
      return failure(
        res,
        400,
        'Property ID is required.'
      );
    }

    const service =
      getPropertyService();

    const method =
      service?.getProperty ||
      service?.findProperty;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyId,

          userId:
            getUserId(req) ||
            null,

          includePrivate:
            Boolean(
              req.user
            )
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Property not found.'
      );
    }

    return success(
      res,
      result,
      'Property retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[PROPERTY] Get error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve property.',
      error
    );
  }
}

/* ============================================================
   3. UPDATE PROPERTY
   ============================================================ */

/**
 * PATCH /api/properties/:propertyId
 */

async function updateProperty(
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

    const body =
      req.body || {};

    const service =
      getPropertyService();

    const method =
      service?.updateProperty;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property update is not implemented.'
      );
    }

    const updates = {
      title:
        body.title,

      description:
        body.description,

      propertyType:
        body.propertyType,

      listingType:
        body.listingType,

      price:
        body.price !== undefined
          ? parseNumber(body.price)
          : undefined,

      monthlyRent:
        body.monthlyRent !== undefined
          ? parseNumber(body.monthlyRent)
          : undefined,

      securityDeposit:
        body.securityDeposit !== undefined
          ? parseNumber(
              body.securityDeposit
            )
          : undefined,

      bedrooms:
        body.bedrooms !== undefined
          ? parseNumber(body.bedrooms)
          : undefined,

      bathrooms:
        body.bathrooms !== undefined
          ? parseNumber(body.bathrooms)
          : undefined,

      balconies:
        body.balconies !== undefined
          ? parseNumber(body.balconies)
          : undefined,

      builtUpArea:
        body.builtUpArea !== undefined
          ? parseNumber(body.builtUpArea)
          : undefined,

      carpetArea:
        body.carpetArea !== undefined
          ? parseNumber(body.carpetArea)
          : undefined,

      plotArea:
        body.plotArea !== undefined
          ? parseNumber(body.plotArea)
          : undefined,

      floor:
        body.floor,

      totalFloors:
        body.totalFloors !== undefined
          ? parseNumber(body.totalFloors)
          : undefined,

      furnishing:
        body.furnishing,

      parking:
        body.parking,

      facing:
        body.facing,

      possessionStatus:
        body.possessionStatus,

      address:
        body.address,

      city:
        body.city,

      state:
        body.state,

      country:
        body.country,

      pincode:
        body.pincode,

      latitude:
        body.latitude !== undefined
          ? parseNumber(body.latitude)
          : undefined,

      longitude:
        body.longitude !== undefined
          ? parseNumber(body.longitude)
          : undefined,

      amenities:
        body.amenities,

      features:
        body.features,

      images:
        body.images,

      metadata:
        body.metadata
    };

    const cleanUpdates =
      Object.fromEntries(
        Object.entries(updates)
          .filter(
            ([, value]) =>
              value !== undefined
          )
      );

    const result =
      await method.call(
        service,
        {
          propertyId,

          userId,

          updates:
            cleanUpdates
        }
      );

    await createAuditLog(
      req,
      'PROPERTY_UPDATED',
      {
        propertyId
      }
    );

    return success(
      res,
      result,
      'Property updated successfully.'
    );
  } catch (error) {
    console.error(
      '[PROPERTY] Update error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update property.',
      error
    );
  }
}

/* ============================================================
   4. DELETE PROPERTY
   ============================================================ */

/**
 * DELETE /api/properties/:propertyId
 */

async function deleteProperty(
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
      getPropertyService();

    const method =
      service?.deleteProperty;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property deletion is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyId,

          userId
        }
      );

    await createAuditLog(
      req,
      'PROPERTY_DELETED',
      {
        propertyId
      }
    );

    return success(
      res,
      result,
      'Property deleted successfully.'
    );
  } catch (error) {
    console.error(
      '[PROPERTY] Delete error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to delete property.',
      error
    );
  }
}

/* ============================================================
   5. PUBLISH PROPERTY
   ============================================================ */

/**
 * POST /api/properties/:propertyId/publish
 */

async function publishProperty(
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
      getPropertyService();

    const method =
      service?.publishProperty;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property publishing is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyId,

          userId
        }
      );

    await createAuditLog(
      req,
      'PROPERTY_PUBLISHED',
      {
        propertyId
      }
    );

    return success(
      res,
      result,
      'Property published successfully.'
    );
  } catch (error) {
    console.error(
      '[PROPERTY] Publish error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to publish property.',
      error
    );
  }
}

/* ============================================================
   6. UNPUBLISH PROPERTY
   ============================================================ */

/**
 * POST /api/properties/:propertyId/unpublish
 */

async function unpublishProperty(
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
      getPropertyService();

    const method =
      service?.unpublishProperty;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property unpublishing is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyId,

          userId
        }
      );

    await createAuditLog(
      req,
      'PROPERTY_UNPUBLISHED',
      {
        propertyId
      }
    );

    return success(
      res,
      result,
      'Property unpublished successfully.'
    );
  } catch (error) {
    console.error(
      '[PROPERTY] Unpublish error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to unpublish property.',
      error
    );
  }
}

/* ============================================================
   7. MY PROPERTIES
   ============================================================ */

/**
 * GET /api/properties/my
 */

async function getMyProperties(
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
      getPropertyService();

    const method =
      service?.getUserProperties ||
      service?.getMyProperties;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'User property retrieval is not implemented.'
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

          listingType:
            req.query?.listingType ||
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
      'Your properties retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[PROPERTY] My properties error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve your properties.',
      error
    );
  }
}

/* ============================================================
   8. SEARCH PROPERTIES
   ============================================================ */

/**
 * GET /api/properties/search
 */

async function searchProperties(
  req,
  res
) {
  try {
    const service =
      getPropertyService();

    const method =
      service?.searchProperties ||
      service?.search;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property search is not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          query:
            req.query?.q ||
            req.query?.query ||
            null,

          city:
            req.query?.city ||
            null,

          state:
            req.query?.state ||
            null,

          pincode:
            req.query?.pincode ||
            null,

          propertyType:
            req.query?.propertyType ||
            null,

          listingType:
            req.query?.listingType ||
            null,

          furnishing:
            req.query?.furnishing ||
            null,

          minPrice:
            parseNumber(
              req.query?.minPrice
            ),

          maxPrice:
            parseNumber(
              req.query?.maxPrice
            ),

          minBedrooms:
            parseNumber(
              req.query?.minBedrooms
            ),

          maxBedrooms:
            parseNumber(
              req.query?.maxBedrooms
            ),

          minArea:
            parseNumber(
              req.query?.minArea
            ),

          maxArea:
            parseNumber(
              req.query?.maxArea
            ),

          latitude:
            parseNumber(
              req.query?.latitude
            ),

          longitude:
            parseNumber(
              req.query?.longitude
            ),

          radius:
            parseNumber(
              req.query?.radius
            ),

          amenities:
            req.query?.amenities
              ? String(
                  req.query.amenities
                )
                  .split(',')
                  .map(
                    item =>
                      item.trim()
                  )
                  .filter(Boolean)
              : [],

          sort:
            req.query?.sort ||
            'created_at_desc',

          page:
            pagination.page,

          limit:
            pagination.limit
        }
      );

    return success(
      res,
      result,
      'Properties retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[PROPERTY] Search error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to search properties.',
      error
    );
  }
}

/* ============================================================
   9. PROPERTY STATUS
   ============================================================ */

/**
 * GET /api/properties/:propertyId/status
 */

async function getPropertyStatus(
  req,
  res
) {
  try {
    const propertyId =
      getPropertyId(req);

    if (!propertyId) {
      return failure(
        res,
        400,
        'Property ID is required.'
      );
    }

    const service =
      getPropertyService();

    const method =
      service?.getPropertyStatus;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property status retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyId,

          userId:
            getUserId(req) ||
            null
        }
      );

    return success(
      res,
      result,
      'Property status retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[PROPERTY] Status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve property status.',
      error
    );
  }
}

/* ============================================================
   10. CHANGE PROPERTY STATUS
   ============================================================ */

/**
 * PATCH /api/properties/:propertyId/status
 */

async function updatePropertyStatus(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const propertyId =
      getPropertyId(req);

    const status =
      req.body?.status;

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

    if (!status) {
      return failure(
        res,
        400,
        'Property status is required.'
      );
    }

    const service =
      getPropertyService();

    const method =
      service?.updatePropertyStatus;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property status update is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyId,

          userId,

          status
        }
      );

    await createAuditLog(
      req,
      'PROPERTY_STATUS_UPDATED',
      {
        propertyId,

        status
      }
    );

    return success(
      res,
      result,
      'Property status updated successfully.'
    );
  } catch (error) {
    console.error(
      '[PROPERTY] Status update error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update property status.',
      error
    );
  }
}

/* ============================================================
   11. ADD PROPERTY IMAGE
   ============================================================ */

/**
 * POST /api/properties/:propertyId/images
 */

async function addPropertyImage(
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
      getPropertyService();

    const method =
      service?.addPropertyImage ||
      service?.addImage;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property image upload is not implemented.'
      );
    }

    const file =
      req.file ||
      null;

    const result =
      await method.call(
        service,
        {
          propertyId,

          userId,

          file,

          url:
            req.body?.url ||
            null,

          caption:
            req.body?.caption ||
            null,

          isPrimary:
            parseBoolean(
              req.body?.isPrimary
            )
        }
      );

    return success(
      res,
      result,
      'Property image added successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[PROPERTY] Image add error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to add property image.',
      error
    );
  }
}

/* ============================================================
   12. DELETE PROPERTY IMAGE
   ============================================================ */

/**
 * DELETE /api/properties/:propertyId/images/:imageId
 */

async function deletePropertyImage(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const propertyId =
      getPropertyId(req);

    const imageId =
      req.params?.imageId;

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

    if (!imageId) {
      return failure(
        res,
        400,
        'Image ID is required.'
      );
    }

    const service =
      getPropertyService();

    const method =
      service?.deletePropertyImage ||
      service?.deleteImage;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property image deletion is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyId,

          imageId,

          userId
        }
      );

    return success(
      res,
      result,
      'Property image deleted successfully.'
    );
  } catch (error) {
    console.error(
      '[PROPERTY] Image delete error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to delete property image.',
      error
    );
  }
}

/* ============================================================
   13. SET PRIMARY IMAGE
   ============================================================ */

/**
 * PATCH /api/properties/:propertyId/images/:imageId/primary
 */

async function setPrimaryImage(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const propertyId =
      getPropertyId(req);

    const imageId =
      req.params?.imageId;

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

    if (!imageId) {
      return failure(
        res,
        400,
        'Image ID is required.'
      );
    }

    const service =
      getPropertyService();

    const method =
      service?.setPrimaryImage;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Primary image functionality is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyId,

          imageId,

          userId
        }
      );

    return success(
      res,
      result,
      'Primary image updated successfully.'
    );
  } catch (error) {
    console.error(
      '[PROPERTY] Primary image error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to set primary image.',
      error
    );
  }
}

/* ============================================================
   14. VERIFY PROPERTY
   ============================================================ */

/**
 * POST /api/properties/:propertyId/verify
 */

async function verifyProperty(
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
      getPropertyService();

    const method =
      service?.verifyProperty;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property verification is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyId,

          userId,

          documents:
            req.body?.documents ||
            []
        }
      );

    await createAuditLog(
      req,
      'PROPERTY_VERIFICATION_REQUESTED',
      {
        propertyId
      }
    );

    return success(
      res,
      result,
      'Property verification submitted successfully.'
    );
  } catch (error) {
    console.error(
      '[PROPERTY] Verification error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to submit property verification.',
      error
    );
  }
}

/* ============================================================
   15. FEATURED PROPERTIES
   ============================================================ */

/**
 * GET /api/properties/featured
 */

async function getFeaturedProperties(
  req,
  res
) {
  try {
    const service =
      getPropertyService();

    const method =
      service?.getFeaturedProperties;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Featured property retrieval is not implemented.'
      );
    }

    const limit = Math.min(
      Math.max(
        parseInt(
          req.query?.limit,
          10
        ) || 12,
        1
      ),
      50
    );

    const result =
      await method.call(
        service,
        {
          city:
            req.query?.city ||
            null,

          propertyType:
            req.query?.propertyType ||
            null,

          limit
        }
      );

    return success(
      res,
      result,
      'Featured properties retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[PROPERTY] Featured error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve featured properties.',
      error
    );
  }
}

/* ============================================================
   16. PROPERTY STATISTICS
   ============================================================ */

/**
 * GET /api/properties/statistics
 */

async function getPropertyStatistics(
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
      getPropertyService();

    const method =
      service?.getPropertyStatistics ||
      service?.getStatistics;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property statistics are not implemented.'
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
      'Property statistics retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[PROPERTY] Statistics error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve property statistics.',
      error
    );
  }
}

/* ============================================================
   17. PROPERTY VISIBILITY
   ============================================================ */

/**
 * PATCH /api/properties/:propertyId/visibility
 */

async function updateVisibility(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const propertyId =
      getPropertyId(req);

    const visibility =
      req.body?.visibility;

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

    if (!visibility) {
      return failure(
        res,
        400,
        'Visibility is required.'
      );
    }

    const service =
      getPropertyService();

    const method =
      service?.updateVisibility;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property visibility update is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyId,

          userId,

          visibility
        }
      );

    return success(
      res,
      result,
      'Property visibility updated successfully.'
    );
  } catch (error) {
    console.error(
      '[PROPERTY] Visibility error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update property visibility.',
      error
    );
  }
}

/* ============================================================
   18. DUPLICATE PROPERTY
   ============================================================ */

/**
 * POST /api/properties/:propertyId/duplicate
 */

async function duplicateProperty(
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
      getPropertyService();

    const method =
      service?.duplicateProperty;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property duplication is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyId,

          userId,

          title:
            req.body?.title ||
            null
        }
      );

    await createAuditLog(
      req,
      'PROPERTY_DUPLICATED',
      {
        propertyId,

        newPropertyId:
          result?.propertyId ||
          result?.id ||
          null
      }
    );

    return success(
      res,
      result,
      'Property duplicated successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[PROPERTY] Duplicate error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to duplicate property.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  createProperty,

  getProperty,

  updateProperty,

  deleteProperty,

  publishProperty,

  unpublishProperty,

  getMyProperties,

  searchProperties,

  getPropertyStatus,

  updatePropertyStatus,

  addPropertyImage,

  deletePropertyImage,

  setPrimaryImage,

  verifyProperty,

  getFeaturedProperties,

  getPropertyStatistics,

  updateVisibility,

  duplicateProperty
};