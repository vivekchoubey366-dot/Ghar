'use strict';

/**
 * ============================================================
 * GHAR - Marketplace Controller
 * ============================================================
 *
 * Handles:
 * - Marketplace listings
 * - Property discovery
 * - Property listing creation
 * - Listing details
 * - Listing updates
 * - Listing publishing
 * - Listing removal
 * - Marketplace search
 * - Featured listings
 * - Recommended listings
 * - Seller listings
 * - Listing statistics
 * - Marketplace categories
 *
 * Business logic:
 *     services/marketplace.service.js
 *
 * Database logic:
 *     repositories/marketplace.repository.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE
   ============================================================ */

function getMarketplaceService() {
  try {
    return require('../services/marketplace.service');
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

function getListingId(req) {
  return (
    req.params?.listingId ||
    req.params?.id ||
    req.body?.listingId ||
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

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
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
        'marketplace',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.['user-agent'] ||
        null
    });
  } catch (error) {
    console.error(
      '[MARKETPLACE AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. MARKETPLACE HOME
   ============================================================ */

/**
 * GET /api/marketplace
 */

async function getMarketplace(
  req,
  res
) {
  try {
    const service =
      getMarketplaceService();

    if (!service) {
      return failure(
        res,
        503,
        'Marketplace service is unavailable.'
      );
    }

    const method =
      service.getMarketplace ||
      service.getMarketplaceHome;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Marketplace service is not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          userId:
            getUserId(req),

          page:
            pagination.page,

          limit:
            pagination.limit,

          city:
            req.query?.city ||
            null,

          locality:
            req.query?.locality ||
            null,

          listingType:
            req.query?.listingType ||
            null,

          propertyType:
            req.query?.propertyType ||
            null,

          minPrice:
            parseNumber(
              req.query?.minPrice
            ),

          maxPrice:
            parseNumber(
              req.query?.maxPrice
            )
        }
      );

    return success(
      res,
      result,
      'Marketplace retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MARKETPLACE] Home error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to load marketplace.',
      error
    );
  }
}

/* ============================================================
   2. SEARCH MARKETPLACE
   ============================================================ */

/**
 * GET /api/marketplace/search
 */

async function searchMarketplace(
  req,
  res
) {
  try {
    const query =
      typeof req.query?.q ===
      'string'
        ? req.query.q.trim()
        : '';

    const pagination =
      getPagination(req);

    const service =
      getMarketplaceService();

    if (!service) {
      return failure(
        res,
        503,
        'Marketplace service is unavailable.'
      );
    }

    const method =
      service.searchMarketplace ||
      service.searchListings ||
      service.search;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Marketplace search is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId:
            getUserId(req),

          query,

          page:
            pagination.page,

          limit:
            pagination.limit,

          city:
            req.query?.city ||
            null,

          locality:
            req.query?.locality ||
            null,

          state:
            req.query?.state ||
            null,

          pincode:
            req.query?.pincode ||
            null,

          listingType:
            req.query?.listingType ||
            null,

          propertyType:
            req.query?.propertyType ||
            null,

          minPrice:
            parseNumber(
              req.query?.minPrice
            ),

          maxPrice:
            parseNumber(
              req.query?.maxPrice
            ),

          minArea:
            parseNumber(
              req.query?.minArea
            ),

          maxArea:
            parseNumber(
              req.query?.maxArea
            ),

          bedrooms:
            parseNumber(
              req.query?.bedrooms
            ),

          bathrooms:
            parseNumber(
              req.query?.bathrooms
            ),

          furnishing:
            req.query?.furnishing ||
            null,

          sort:
            req.query?.sort ||
            'newest'
        }
      );

    return success(
      res,
      result,
      'Marketplace search completed successfully.'
    );
  } catch (error) {
    console.error(
      '[MARKETPLACE] Search error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to search marketplace.',
      error
    );
  }
}

/* ============================================================
   3. GET LISTING
   ============================================================ */

/**
 * GET /api/marketplace/listings/:id
 */

async function getListing(
  req,
  res
) {
  try {
    const listingId =
      getListingId(req);

    if (!listingId) {
      return failure(
        res,
        400,
        'Listing ID is required.'
      );
    }

    const service =
      getMarketplaceService();

    if (!service) {
      return failure(
        res,
        503,
        'Marketplace service is unavailable.'
      );
    }

    const method =
      service.getListing ||
      service.getMarketplaceListing ||
      service.findListing;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Listing retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          listingId,

          userId:
            getUserId(req)
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Marketplace listing not found.'
      );
    }

    return success(
      res,
      result,
      'Marketplace listing retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MARKETPLACE] Get listing error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve marketplace listing.',
      error
    );
  }
}

/* ============================================================
   4. CREATE LISTING
   ============================================================ */

/**
 * POST /api/marketplace/listings
 */

async function createListing(
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
      getMarketplaceService();

    if (!service) {
      return failure(
        res,
        503,
        'Marketplace service is unavailable.'
      );
    }

    const method =
      service.createListing ||
      service.createMarketplaceListing;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Listing creation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          propertyId:
            req.body?.propertyId ||
            null,

          title:
            req.body?.title ||
            null,

          description:
            req.body?.description ||
            null,

          listingType:
            req.body?.listingType ||
            req.body?.transactionType ||
            'sale',

          propertyType:
            req.body?.propertyType ||
            null,

          price:
            parseNumber(
              req.body?.price
            ),

          securityDeposit:
            parseNumber(
              req.body?.securityDeposit
            ),

          monthlyRent:
            parseNumber(
              req.body?.monthlyRent
            ),

          maintenance:
            parseNumber(
              req.body?.maintenance
            ),

          area:
            parseNumber(
              req.body?.area
            ),

          builtUpArea:
            parseNumber(
              req.body?.builtUpArea
            ),

          carpetArea:
            parseNumber(
              req.body?.carpetArea
            ),

          bedrooms:
            parseNumber(
              req.body?.bedrooms
            ),

          bathrooms:
            parseNumber(
              req.body?.bathrooms
            ),

          furnishing:
            req.body?.furnishing ||
            null,

          floor:
            parseNumber(
              req.body?.floor
            ),

          totalFloors:
            parseNumber(
              req.body?.totalFloors
            ),

          parking:
            req.body?.parking ||
            null,

          city:
            req.body?.city ||
            null,

          locality:
            req.body?.locality ||
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

          amenities:
            req.body?.amenities ||
            [],

          features:
            req.body?.features ||
            [],

          images:
            req.body?.images ||
            [],

          status:
            req.body?.status ||
            'draft'
        }
      );

    await createAuditLog(
      req,
      'MARKETPLACE_LISTING_CREATED',
      {
        listingId:
          result?.id ||
          result?.listingId ||
          null,

        propertyId:
          req.body?.propertyId ||
          null
      }
    );

    return success(
      res,
      result,
      'Marketplace listing created successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[MARKETPLACE] Create listing error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to create marketplace listing.',
      error
    );
  }
}

/* ============================================================
   5. UPDATE LISTING
   ============================================================ */

/**
 * PATCH /api/marketplace/listings/:id
 */

async function updateListing(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const listingId =
      getListingId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!listingId) {
      return failure(
        res,
        400,
        'Listing ID is required.'
      );
    }

    const service =
      getMarketplaceService();

    const method =
      service?.updateListing ||
      service?.updateMarketplaceListing;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Listing update is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          listingId,

          userId,

          title:
            req.body?.title,

          description:
            req.body?.description,

          listingType:
            req.body?.listingType,

          propertyType:
            req.body?.propertyType,

          price:
            parseNumber(
              req.body?.price
            ),

          monthlyRent:
            parseNumber(
              req.body?.monthlyRent
            ),

          securityDeposit:
            parseNumber(
              req.body?.securityDeposit
            ),

          maintenance:
            parseNumber(
              req.body?.maintenance
            ),

          area:
            parseNumber(
              req.body?.area
            ),

          builtUpArea:
            parseNumber(
              req.body?.builtUpArea
            ),

          carpetArea:
            parseNumber(
              req.body?.carpetArea
            ),

          bedrooms:
            parseNumber(
              req.body?.bedrooms
            ),

          bathrooms:
            parseNumber(
              req.body?.bathrooms
            ),

          furnishing:
            req.body?.furnishing,

          floor:
            parseNumber(
              req.body?.floor
            ),

          totalFloors:
            parseNumber(
              req.body?.totalFloors
            ),

          parking:
            req.body?.parking,

          city:
            req.body?.city,

          locality:
            req.body?.locality,

          state:
            req.body?.state,

          pincode:
            req.body?.pincode,

          latitude:
            parseNumber(
              req.body?.latitude
            ),

          longitude:
            parseNumber(
              req.body?.longitude
            ),

          amenities:
            req.body?.amenities,

          features:
            req.body?.features,

          images:
            req.body?.images
        }
      );

    await createAuditLog(
      req,
      'MARKETPLACE_LISTING_UPDATED',
      {
        listingId
      }
    );

    return success(
      res,
      result,
      'Marketplace listing updated successfully.'
    );
  } catch (error) {
    console.error(
      '[MARKETPLACE] Update listing error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update marketplace listing.',
      error
    );
  }
}

/* ============================================================
   6. PUBLISH LISTING
   ============================================================ */

/**
 * POST /api/marketplace/listings/:id/publish
 */

async function publishListing(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const listingId =
      getListingId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!listingId) {
      return failure(
        res,
        400,
        'Listing ID is required.'
      );
    }

    const service =
      getMarketplaceService();

    const method =
      service?.publishListing ||
      service?.publishMarketplaceListing;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Listing publishing is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          listingId,

          userId
        }
      );

    await createAuditLog(
      req,
      'MARKETPLACE_LISTING_PUBLISHED',
      {
        listingId
      }
    );

    return success(
      res,
      result,
      'Marketplace listing published successfully.'
    );
  } catch (error) {
    console.error(
      '[MARKETPLACE] Publish error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to publish marketplace listing.',
      error
    );
  }
}

/* ============================================================
   7. UNPUBLISH LISTING
   ============================================================ */

/**
 * POST /api/marketplace/listings/:id/unpublish
 */

async function unpublishListing(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const listingId =
      getListingId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!listingId) {
      return failure(
        res,
        400,
        'Listing ID is required.'
      );
    }

    const service =
      getMarketplaceService();

    const method =
      service?.unpublishListing ||
      service?.unpublishMarketplaceListing;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Listing unpublishing is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          listingId,

          userId
        }
      );

    await createAuditLog(
      req,
      'MARKETPLACE_LISTING_UNPUBLISHED',
      {
        listingId
      }
    );

    return success(
      res,
      result,
      'Marketplace listing unpublished successfully.'
    );
  } catch (error) {
    console.error(
      '[MARKETPLACE] Unpublish error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to unpublish marketplace listing.',
      error
    );
  }
}

/* ============================================================
   8. DELETE LISTING
   ============================================================ */

/**
 * DELETE /api/marketplace/listings/:id
 */

async function deleteListing(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const listingId =
      getListingId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!listingId) {
      return failure(
        res,
        400,
        'Listing ID is required.'
      );
    }

    const service =
      getMarketplaceService();

    const method =
      service?.deleteListing ||
      service?.removeListing;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Listing deletion is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          listingId,

          userId,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'MARKETPLACE_LISTING_DELETED',
      {
        listingId
      }
    );

    return success(
      res,
      result,
      'Marketplace listing removed successfully.'
    );
  } catch (error) {
    console.error(
      '[MARKETPLACE] Delete listing error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to remove marketplace listing.',
      error
    );
  }
}

/* ============================================================
   9. MY LISTINGS
   ============================================================ */

/**
 * GET /api/marketplace/my-listings
 */

async function getMyListings(
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
      getMarketplaceService();

    const method =
      service?.getUserListings ||
      service?.getMyListings ||
      service?.listSellerListings;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Seller listing retrieval is not implemented.'
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
      'Your marketplace listings retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MARKETPLACE] My listings error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve your listings.',
      error
    );
  }
}

/* ============================================================
   10. FEATURED LISTINGS
   ============================================================ */

/**
 * GET /api/marketplace/featured
 */

async function getFeaturedListings(
  req,
  res
) {
  try {
    const service =
      getMarketplaceService();

    const method =
      service?.getFeaturedListings ||
      service?.getFeatured;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Featured listings are not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          userId:
            getUserId(req),

          page:
            pagination.page,

          limit:
            pagination.limit,

          city:
            req.query?.city ||
            null,

          propertyType:
            req.query?.propertyType ||
            null
        }
      );

    return success(
      res,
      result,
      'Featured listings retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MARKETPLACE] Featured error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve featured listings.',
      error
    );
  }
}

/* ============================================================
   11. RECOMMENDED LISTINGS
   ============================================================ */

/**
 * GET /api/marketplace/recommended
 */

async function getRecommendedListings(
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
      getMarketplaceService();

    const method =
      service?.getRecommendedListings ||
      service?.getRecommendations;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Listing recommendations are not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          userId,

          page:
            pagination.page,

          limit:
            pagination.limit
        }
      );

    return success(
      res,
      result,
      'Recommended listings retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MARKETPLACE] Recommendations error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve recommendations.',
      error
    );
  }
}

/* ============================================================
   12. LISTINGS BY PROPERTY
   ============================================================ */

/**
 * GET /api/marketplace/properties/:propertyId
 */

async function getPropertyListings(
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
      getMarketplaceService();

    const method =
      service?.getPropertyListings ||
      service?.listPropertyListings;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property marketplace listings are not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyId,

          userId:
            getUserId(req)
        }
      );

    return success(
      res,
      result,
      'Property marketplace listings retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MARKETPLACE] Property listings error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve property listings.',
      error
    );
  }
}

/* ============================================================
   13. LISTING VIEWS
   ============================================================ */

/**
 * POST /api/marketplace/listings/:id/view
 */

async function recordListingView(
  req,
  res
) {
  try {
    const listingId =
      getListingId(req);

    if (!listingId) {
      return failure(
        res,
        400,
        'Listing ID is required.'
      );
    }

    const service =
      getMarketplaceService();

    const method =
      service?.recordListingView ||
      service?.recordView;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Listing view tracking is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          listingId,

          userId:
            getUserId(req),

          sessionId:
            req.body?.sessionId ||
            req.headers?.[
              'x-session-id'
            ] ||
            null,

          ipAddress:
            req.ip ||
            null
        }
      );

    return success(
      res,
      result,
      'Listing view recorded successfully.'
    );
  } catch (error) {
    console.error(
      '[MARKETPLACE] View error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to record listing view.',
      error
    );
  }
}

/* ============================================================
   14. LISTING STATISTICS
   ============================================================ */

/**
 * GET /api/marketplace/listings/:id/stats
 */

async function getListingStats(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const listingId =
      getListingId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!listingId) {
      return failure(
        res,
        400,
        'Listing ID is required.'
      );
    }

    const service =
      getMarketplaceService();

    const method =
      service?.getListingStats ||
      service?.getMarketplaceListingStats;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Listing statistics are not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          listingId,

          userId
        }
      );

    return success(
      res,
      result,
      'Listing statistics retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MARKETPLACE] Stats error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve listing statistics.',
      error
    );
  }
}

/* ============================================================
   15. CATEGORIES
   ============================================================ */

/**
 * GET /api/marketplace/categories
 */

async function getCategories(
  req,
  res
) {
  try {
    const service =
      getMarketplaceService();

    const method =
      service?.getCategories ||
      service?.getMarketplaceCategories;

    if (
      typeof method !==
      'function'
    ) {
      return success(
        res,
        {
          propertyTypes: [
            'apartment',
            'villa',
            'house',
            'plot',
            'commercial',
            'office',
            'shop',
            'warehouse',
            'farmhouse',
            'land'
          ],

          listingTypes: [
            'sale',
            'rent',
            'lease',
            'pg'
          ]
        },
        'Marketplace categories retrieved successfully.'
      );
    }

    const result =
      await method.call(
        service
      );

    return success(
      res,
      result,
      'Marketplace categories retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MARKETPLACE] Categories error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve marketplace categories.',
      error
    );
  }
}

/* ============================================================
   16. MARK LISTING AS SOLD / RENTED
   ============================================================ */

/**
 * POST /api/marketplace/listings/:id/close
 */

async function closeListing(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const listingId =
      getListingId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!listingId) {
      return failure(
        res,
        400,
        'Listing ID is required.'
      );
    }

    const service =
      getMarketplaceService();

    const method =
      service?.closeListing ||
      service?.markListingClosed;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Listing closing is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          listingId,

          userId,

          status:
            req.body?.status ||
            'closed',

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'MARKETPLACE_LISTING_CLOSED',
      {
        listingId
      }
    );

    return success(
      res,
      result,
      'Marketplace listing closed successfully.'
    );
  } catch (error) {
    console.error(
      '[MARKETPLACE] Close listing error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to close marketplace listing.',
      error
    );
  }
}

/* ============================================================
   17. REPORT LISTING
   ============================================================ */

/**
 * POST /api/marketplace/listings/:id/report
 */

async function reportListing(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const listingId =
      getListingId(req);

    const reason =
      typeof req.body?.reason ===
      'string'
        ? req.body.reason.trim()
        : '';

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!listingId) {
      return failure(
        res,
        400,
        'Listing ID is required.'
      );
    }

    if (!reason) {
      return failure(
        res,
        400,
        'A report reason is required.'
      );
    }

    const service =
      getMarketplaceService();

    const method =
      service?.reportListing ||
      service?.createListingReport;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Listing reporting is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          listingId,

          userId,

          reason,

          description:
            req.body?.description ||
            null
        }
      );

    await createAuditLog(
      req,
      'MARKETPLACE_LISTING_REPORTED',
      {
        listingId
      }
    );

    return success(
      res,
      result,
      'Listing report submitted successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[MARKETPLACE] Report error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to report listing.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  getMarketplace,

  searchMarketplace,

  getListing,

  createListing,

  updateListing,

  publishListing,

  unpublishListing,

  deleteListing,

  getMyListings,

  getFeaturedListings,

  getRecommendedListings,

  getPropertyListings,

  recordListingView,

  getListingStats,

  getCategories,

  closeListing,

  reportListing
};