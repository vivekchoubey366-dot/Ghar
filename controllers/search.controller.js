'use strict';

/**
 * ============================================================
 * GHAR - Search Controller
 * ============================================================
 *
 * Handles:
 * - Global search
 * - Property search
 * - Location search
 * - User search
 * - Marketplace search
 * - Saved searches
 * - Search suggestions
 * - Search history
 * - Nearby properties
 * - Advanced property filters
 *
 * Business logic:
 *     services/search.service.js
 *
 * Database logic:
 *     repositories/search.repository.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE
   ============================================================ */

function getSearchService() {
  try {
    return require('../services/search.service');
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
   BOOLEAN
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
      .map(item =>
        String(item).trim()
      )
      .filter(Boolean);
  }

  return String(value)
    .split(',')
    .map(item =>
      item.trim()
    )
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
        'search',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.['user-agent'] ||
        null
    });
  } catch (error) {
    console.error(
      '[SEARCH AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   SEARCH FILTER BUILDER
   ============================================================ */

function buildSearchFilters(req) {
  const query =
    req.query || {};

  return {
    q:
      query.q ||
      query.query ||
      null,

    city:
      query.city ||
      null,

    state:
      query.state ||
      null,

    country:
      query.country ||
      'India',

    pincode:
      query.pincode ||
      null,

    locality:
      query.locality ||
      query.location ||
      null,

    propertyType:
      query.propertyType ||
      null,

    listingType:
      query.listingType ||
      null,

    status:
      query.status ||
      'published',

    minPrice:
      parseNumber(
        query.minPrice
      ),

    maxPrice:
      parseNumber(
        query.maxPrice
      ),

    minBedrooms:
      parseNumber(
        query.minBedrooms
      ),

    maxBedrooms:
      parseNumber(
        query.maxBedrooms
      ),

    minBathrooms:
      parseNumber(
        query.minBathrooms
      ),

    maxBathrooms:
      parseNumber(
        query.maxBathrooms
      ),

    minArea:
      parseNumber(
        query.minArea
      ),

    maxArea:
      parseNumber(
        query.maxArea
      ),

    furnishing:
      query.furnishing ||
      null,

    parking:
      query.parking ||
      null,

    facing:
      query.facing ||
      null,

    possessionStatus:
      query.possessionStatus ||
      null,

    amenities:
      parseArray(
        query.amenities
      ),

    features:
      parseArray(
        query.features
      ),

    verifiedOnly:
      parseBoolean(
        query.verifiedOnly
      ),

    featuredOnly:
      parseBoolean(
        query.featuredOnly
      ),

    latitude:
      parseNumber(
        query.latitude
      ),

    longitude:
      parseNumber(
        query.longitude
      ),

    radius:
      parseNumber(
        query.radius
      ),

    sort:
      query.sort ||
      'relevance'
  };
}

/* ============================================================
   1. GLOBAL SEARCH
   ============================================================ */

/**
 * GET /api/search
 */

async function search(
  req,
  res
) {
  try {
    const service =
      getSearchService();

    const method =
      service?.search ||
      service?.globalSearch;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Global search is not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const filters =
      buildSearchFilters(req);

    const result =
      await method.call(
        service,
        {
          userId:
            getUserId(req) ||
            null,

          filters,

          page:
            pagination.page,

          limit:
            pagination.limit
        }
      );

    await createAuditLog(
      req,
      'SEARCH_PERFORMED',
      {
        query:
          filters.q
      }
    );

    return success(
      res,
      result,
      'Search completed successfully.'
    );
  } catch (error) {
    console.error(
      '[SEARCH] Global search error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to perform search.',
      error
    );
  }
}

/* ============================================================
   2. PROPERTY SEARCH
   ============================================================ */

/**
 * GET /api/search/properties
 */

async function searchProperties(
  req,
  res
) {
  try {
    const service =
      getSearchService();

    const method =
      service?.searchProperties ||
      service?.propertySearch;

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

    const filters =
      buildSearchFilters(req);

    const result =
      await method.call(
        service,
        {
          userId:
            getUserId(req) ||
            null,

          filters,

          page:
            pagination.page,

          limit:
            pagination.limit
        }
      );

    return success(
      res,
      result,
      'Property search completed successfully.'
    );
  } catch (error) {
    console.error(
      '[SEARCH] Property search error:',
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
   3. LOCATION SEARCH
   ============================================================ */

/**
 * GET /api/search/locations
 */

async function searchLocations(
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

    if (!query) {
      return failure(
        res,
        400,
        'Location search query is required.'
      );
    }

    const service =
      getSearchService();

    const method =
      service?.searchLocations ||
      service?.locationSearch;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Location search is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          query,

          country:
            req.query?.country ||
            'India',

          state:
            req.query?.state ||
            null,

          limit:
            Math.min(
              parseInt(
                req.query?.limit,
                10
              ) || 10,
              50
            )
        }
      );

    return success(
      res,
      result,
      'Locations retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SEARCH] Location search error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to search locations.',
      error
    );
  }
}

/* ============================================================
   4. SEARCH SUGGESTIONS
   ============================================================ */

/**
 * GET /api/search/suggestions
 */

async function getSuggestions(
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

    if (!query) {
      return success(
        res,
        [],
        'No search suggestions.'
      );
    }

    const service =
      getSearchService();

    const method =
      service?.getSuggestions ||
      service?.searchSuggestions;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Search suggestions are not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          query,

          userId:
            getUserId(req) ||
            null,

          type:
            req.query?.type ||
            'all',

          limit:
            Math.min(
              parseInt(
                req.query?.limit,
                10
              ) || 10,
              50
            )
        }
      );

    return success(
      res,
      result,
      'Search suggestions retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SEARCH] Suggestions error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve search suggestions.',
      error
    );
  }
}

/* ============================================================
   5. NEARBY SEARCH
   ============================================================ */

/**
 * GET /api/search/nearby
 */

async function searchNearby(
  req,
  res
) {
  try {
    const latitude =
      parseNumber(
        req.query?.latitude
      );

    const longitude =
      parseNumber(
        req.query?.longitude
      );

    if (
      latitude === null ||
      longitude === null
    ) {
      return failure(
        res,
        400,
        'Latitude and longitude are required.'
      );
    }

    const service =
      getSearchService();

    const method =
      service?.searchNearby ||
      service?.nearbySearch;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Nearby search is not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          userId:
            getUserId(req) ||
            null,

          latitude,

          longitude,

          radius:
            parseNumber(
              req.query?.radius
            ) || 10,

          propertyType:
            req.query?.propertyType ||
            null,

          listingType:
            req.query?.listingType ||
            null,

          minPrice:
            parseNumber(
              req.query?.minPrice
            ),

          maxPrice:
            parseNumber(
              req.query?.maxPrice
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
      'Nearby properties retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SEARCH] Nearby error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to search nearby properties.',
      error
    );
  }
}

/* ============================================================
   6. ADVANCED SEARCH
   ============================================================ */

/**
 * POST /api/search/advanced
 */

async function advancedSearch(
  req,
  res
) {
  try {
    const service =
      getSearchService();

    const method =
      service?.advancedSearch ||
      service?.search;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Advanced search is not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const body =
      req.body || {};

    const filters = {
      ...body,

      minPrice:
        parseNumber(
          body.minPrice
        ),

      maxPrice:
        parseNumber(
          body.maxPrice
        ),

      minBedrooms:
        parseNumber(
          body.minBedrooms
        ),

      maxBedrooms:
        parseNumber(
          body.maxBedrooms
        ),

      minBathrooms:
        parseNumber(
          body.minBathrooms
        ),

      maxBathrooms:
        parseNumber(
          body.maxBathrooms
        ),

      minArea:
        parseNumber(
          body.minArea
        ),

      maxArea:
        parseNumber(
          body.maxArea
        ),

      latitude:
        parseNumber(
          body.latitude
        ),

      longitude:
        parseNumber(
          body.longitude
        ),

      radius:
        parseNumber(
          body.radius
        ),

      amenities:
        parseArray(
          body.amenities
        ),

      features:
        parseArray(
          body.features
        )
    };

    const result =
      await method.call(
        service,
        {
          userId:
            getUserId(req) ||
            null,

          filters,

          page:
            pagination.page,

          limit:
            pagination.limit
        }
      );

    await createAuditLog(
      req,
      'ADVANCED_SEARCH_PERFORMED',
      {
        filters
      }
    );

    return success(
      res,
      result,
      'Advanced search completed successfully.'
    );
  } catch (error) {
    console.error(
      '[SEARCH] Advanced search error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to perform advanced search.',
      error
    );
  }
}

/* ============================================================
   7. SAVE SEARCH
   ============================================================ */

/**
 * POST /api/search/saved
 */

async function saveSearch(
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

    const name =
      String(
        req.body?.name ||
        ''
      ).trim();

    if (!name) {
      return failure(
        res,
        400,
        'Saved search name is required.'
      );
    }

    const service =
      getSearchService();

    const method =
      service?.saveSearch ||
      service?.createSavedSearch;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Saved search functionality is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          name,

          filters:
            req.body?.filters ||
            {},

          notify:
            parseBoolean(
              req.body?.notify
            ) ?? true,

          notificationFrequency:
            req.body?.notificationFrequency ||
            'daily'
        }
      );

    await createAuditLog(
      req,
      'SEARCH_SAVED',
      {
        savedSearchId:
          result?.id ||
          result?.savedSearchId ||
          null
      }
    );

    return success(
      res,
      result,
      'Search saved successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[SEARCH] Save search error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to save search.',
      error
    );
  }
}

/* ============================================================
   8. GET SAVED SEARCHES
   ============================================================ */

/**
 * GET /api/search/saved
 */

async function getSavedSearches(
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
      getSearchService();

    const method =
      service?.getSavedSearches ||
      service?.listSavedSearches;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Saved search retrieval is not implemented.'
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
      'Saved searches retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SEARCH] Saved searches error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve saved searches.',
      error
    );
  }
}

/* ============================================================
   9. GET SAVED SEARCH
   ============================================================ */

/**
 * GET /api/search/saved/:searchId
 */

async function getSavedSearch(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const searchId =
      req.params?.searchId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!searchId) {
      return failure(
        res,
        400,
        'Saved search ID is required.'
      );
    }

    const service =
      getSearchService();

    const method =
      service?.getSavedSearch;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Saved search retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          searchId,

          userId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Saved search not found.'
      );
    }

    return success(
      res,
      result,
      'Saved search retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SEARCH] Get saved search error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve saved search.',
      error
    );
  }
}

/* ============================================================
   10. UPDATE SAVED SEARCH
   ============================================================ */

/**
 * PATCH /api/search/saved/:searchId
 */

async function updateSavedSearch(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const searchId =
      req.params?.searchId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!searchId) {
      return failure(
        res,
        400,
        'Saved search ID is required.'
      );
    }

    const service =
      getSearchService();

    const method =
      service?.updateSavedSearch;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Saved search update is not implemented.'
      );
    }

    const updates = {
      name:
        req.body?.name,

      filters:
        req.body?.filters,

      notify:
        parseBoolean(
          req.body?.notify
        ),

      notificationFrequency:
        req.body?.notificationFrequency
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
          searchId,

          userId,

          updates:
            cleanUpdates
        }
      );

    return success(
      res,
      result,
      'Saved search updated successfully.'
    );
  } catch (error) {
    console.error(
      '[SEARCH] Update saved search error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update saved search.',
      error
    );
  }
}

/* ============================================================
   11. DELETE SAVED SEARCH
   ============================================================ */

/**
 * DELETE /api/search/saved/:searchId
 */

async function deleteSavedSearch(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const searchId =
      req.params?.searchId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!searchId) {
      return failure(
        res,
        400,
        'Saved search ID is required.'
      );
    }

    const service =
      getSearchService();

    const method =
      service?.deleteSavedSearch;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Saved search deletion is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          searchId,

          userId
        }
      );

    await createAuditLog(
      req,
      'SAVED_SEARCH_DELETED',
      {
        searchId
      }
    );

    return success(
      res,
      result,
      'Saved search deleted successfully.'
    );
  } catch (error) {
    console.error(
      '[SEARCH] Delete saved search error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to delete saved search.',
      error
    );
  }
}

/* ============================================================
   12. SEARCH HISTORY
   ============================================================ */

/**
 * GET /api/search/history
 */

async function getSearchHistory(
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
      getSearchService();

    const method =
      service?.getSearchHistory ||
      service?.getHistory;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Search history is not implemented.'
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
      'Search history retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SEARCH] History error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve search history.',
      error
    );
  }
}

/* ============================================================
   13. CLEAR SEARCH HISTORY
   ============================================================ */

/**
 * DELETE /api/search/history
 */

async function clearSearchHistory(
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
      getSearchService();

    const method =
      service?.clearSearchHistory ||
      service?.clearHistory;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Search history clearing is not implemented.'
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
      'SEARCH_HISTORY_CLEARED'
    );

    return success(
      res,
      result,
      'Search history cleared successfully.'
    );
  } catch (error) {
    console.error(
      '[SEARCH] Clear history error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to clear search history.',
      error
    );
  }
}

/* ============================================================
   14. SEARCH USERS
   ============================================================ */

/**
 * GET /api/search/users
 *
 * Intended primarily for authenticated/admin use.
 */

async function searchUsers(
  req,
  res
) {
  try {
    const service =
      getSearchService();

    const method =
      service?.searchUsers ||
      service?.userSearch;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'User search is not implemented.'
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

          role:
            req.query?.role ||
            null,

          city:
            req.query?.city ||
            null,

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
      'Users retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SEARCH] User search error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to search users.',
      error
    );
  }
}

/* ============================================================
   15. MARKETPLACE SEARCH
   ============================================================ */

/**
 * GET /api/search/marketplace
 */

async function searchMarketplace(
  req,
  res
) {
  try {
    const service =
      getSearchService();

    const method =
      service?.searchMarketplace ||
      service?.marketplaceSearch;

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

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          userId:
            getUserId(req) ||
            null,

          query:
            req.query?.q ||
            req.query?.query ||
            null,

          category:
            req.query?.category ||
            null,

          minPrice:
            parseNumber(
              req.query?.minPrice
            ),

          maxPrice:
            parseNumber(
              req.query?.maxPrice
            ),

          location:
            req.query?.location ||
            null,

          condition:
            req.query?.condition ||
            null,

          sort:
            req.query?.sort ||
            'relevance',

          page:
            pagination.page,

          limit:
            pagination.limit
        }
      );

    return success(
      res,
      result,
      'Marketplace search completed successfully.'
    );
  } catch (error) {
    console.error(
      '[SEARCH] Marketplace search error:',
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
   16. MAP / GEO SEARCH
   ============================================================ */

/**
 * POST /api/search/map
 */

async function mapSearch(
  req,
  res
) {
  try {
    const service =
      getSearchService();

    const method =
      service?.mapSearch ||
      service?.geoSearch;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Map search is not implemented.'
      );
    }

    const body =
      req.body || {};

    const result =
      await method.call(
        service,
        {
          userId:
            getUserId(req) ||
            null,

          north:
            parseNumber(
              body.north
            ),

          south:
            parseNumber(
              body.south
            ),

          east:
            parseNumber(
              body.east
            ),

          west:
            parseNumber(
              body.west
            ),

          latitude:
            parseNumber(
              body.latitude
            ),

          longitude:
            parseNumber(
              body.longitude
            ),

          zoom:
            parseNumber(
              body.zoom
            ),

          filters:
            body.filters ||
            {}
        }
      );

    return success(
      res,
      result,
      'Map search completed successfully.'
    );
  } catch (error) {
    console.error(
      '[SEARCH] Map search error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to perform map search.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  search,

  searchProperties,

  searchLocations,

  getSuggestions,

  searchNearby,

  advancedSearch,

  saveSearch,

  getSavedSearches,

  getSavedSearch,

  updateSavedSearch,

  deleteSavedSearch,

  getSearchHistory,

  clearSearchHistory,

  searchUsers,

  searchMarketplace,

  mapSearch
};