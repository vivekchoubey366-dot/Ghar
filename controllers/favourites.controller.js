'use strict';

/**
 * ============================================================
 * GHAR - Favourites Controller
 * ============================================================
 *
 * Handles:
 * - Add property to favourites
 * - Remove property from favourites
 * - Toggle favourite
 * - Check favourite status
 * - List user's favourite properties
 * - Clear all favourites
 * - Get favourite count
 *
 * Business logic:
 *     services/favourites.service.js
 *
 * Database logic:
 *     repositories/favourites.repository.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE
   ============================================================ */

function getFavouritesService() {
  try {
    return require('../services/favourites.service');
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
   PROPERTY ID
   ============================================================ */

function getPropertyId(req) {
  return (
    req.params?.propertyId ||
    req.params?.id ||
    req.body?.propertyId ||
    req.query?.propertyId ||
    null
  );
}

function validatePropertyId(propertyId) {
  if (
    propertyId === undefined ||
    propertyId === null ||
    String(propertyId).trim() === ''
  ) {
    return false;
  }

  return true;
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
        'favourite',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.['user-agent'] ||
        null
    });
  } catch (error) {
    console.error(
      '[FAVOURITES AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. ADD FAVOURITE
   ============================================================ */

/**
 * POST /api/favourites
 *
 * Body:
 * {
 *   "propertyId": "GHAR-P001"
 * }
 */

async function addFavourite(
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

    if (
      !validatePropertyId(
        propertyId
      )
    ) {
      return failure(
        res,
        400,
        'Property ID is required.'
      );
    }

    const service =
      getFavouritesService();

    if (!service) {
      return failure(
        res,
        503,
        'Favourites service is unavailable.'
      );
    }

    const method =
      service.addFavourite ||
      service.addFavorite ||
      service.createFavourite ||
      service.createFavorite;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Adding favourites is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          propertyId:
            String(propertyId).trim()
        }
      );

    await createAuditLog(
      req,
      'FAVOURITE_ADDED',
      {
        propertyId
      }
    );

    return success(
      res,
      result,
      'Property added to favourites.',
      201
    );
  } catch (error) {
    console.error(
      '[FAVOURITES] Add error:',
      error
    );

    if (
      error?.code ===
      'PROPERTY_NOT_FOUND'
    ) {
      return failure(
        res,
        404,
        'Property not found.'
      );
    }

    if (
      error?.code ===
      'ALREADY_FAVOURITED'
    ) {
      return failure(
        res,
        409,
        'Property is already in your favourites.'
      );
    }

    return failure(
      res,
      500,
      'Unable to add property to favourites.',
      error
    );
  }
}

/* ============================================================
   2. REMOVE FAVOURITE
   ============================================================ */

/**
 * DELETE /api/favourites/:propertyId
 */

async function removeFavourite(
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

    if (
      !validatePropertyId(
        propertyId
      )
    ) {
      return failure(
        res,
        400,
        'Property ID is required.'
      );
    }

    const service =
      getFavouritesService();

    if (!service) {
      return failure(
        res,
        503,
        'Favourites service is unavailable.'
      );
    }

    const method =
      service.removeFavourite ||
      service.removeFavorite ||
      service.deleteFavourite ||
      service.deleteFavorite;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Removing favourites is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          propertyId:
            String(propertyId).trim()
        }
      );

    await createAuditLog(
      req,
      'FAVOURITE_REMOVED',
      {
        propertyId
      }
    );

    return success(
      res,
      result,
      'Property removed from favourites.'
    );
  } catch (error) {
    console.error(
      '[FAVOURITES] Remove error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to remove property from favourites.',
      error
    );
  }
}

/* ============================================================
   3. TOGGLE FAVOURITE
   ============================================================ */

/**
 * POST /api/favourites/toggle
 *
 * Body:
 * {
 *   "propertyId": "GHAR-P001"
 * }
 */

async function toggleFavourite(
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

    if (
      !validatePropertyId(
        propertyId
      )
    ) {
      return failure(
        res,
        400,
        'Property ID is required.'
      );
    }

    const service =
      getFavouritesService();

    if (!service) {
      return failure(
        res,
        503,
        'Favourites service is unavailable.'
      );
    }

    const method =
      service.toggleFavourite ||
      service.toggleFavorite;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Favourite toggle is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          propertyId:
            String(propertyId).trim()
        }
      );

    await createAuditLog(
      req,
      result?.isFavourite === false ||
        result?.isFavorite === false
        ? 'FAVOURITE_REMOVED'
        : 'FAVOURITE_ADDED',
      {
        propertyId
      }
    );

    return success(
      res,
      result,
      result?.isFavourite === false ||
        result?.isFavorite === false
        ? 'Property removed from favourites.'
        : 'Property added to favourites.'
    );
  } catch (error) {
    console.error(
      '[FAVOURITES] Toggle error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update favourite status.',
      error
    );
  }
}

/* ============================================================
   4. CHECK FAVOURITE STATUS
   ============================================================ */

/**
 * GET /api/favourites/:propertyId/status
 */

async function getFavouriteStatus(
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

    if (
      !validatePropertyId(
        propertyId
      )
    ) {
      return failure(
        res,
        400,
        'Property ID is required.'
      );
    }

    const service =
      getFavouritesService();

    if (!service) {
      return failure(
        res,
        503,
        'Favourites service is unavailable.'
      );
    }

    const method =
      service.isFavourite ||
      service.isFavorite ||
      service.getFavouriteStatus ||
      service.getFavoriteStatus;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Favourite status is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          propertyId:
            String(propertyId).trim()
        }
      );

    return success(
      res,
      result,
      'Favourite status retrieved.'
    );
  } catch (error) {
    console.error(
      '[FAVOURITES] Status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to check favourite status.',
      error
    );
  }
}

/* ============================================================
   5. LIST FAVOURITES
   ============================================================ */

/**
 * GET /api/favourites
 */

async function listFavourites(
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
      getFavouritesService();

    if (!service) {
      return failure(
        res,
        503,
        'Favourites service is unavailable.'
      );
    }

    const method =
      service.getFavourites ||
      service.getFavorites ||
      service.listFavourites ||
      service.listFavorites;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Favourite listing is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          page:
            Math.max(
              Number(
                req.query?.page
              ) || 1,
              1
            ),

          limit:
            Math.min(
              Math.max(
                Number(
                  req.query?.limit
                ) || 20,
                1
              ),
              100
            ),

          sort:
            req.query?.sort ||
            'created_at',

          order:
            req.query?.order ||
            'desc',

          propertyType:
            req.query?.propertyType ||
            null,

          listingType:
            req.query?.listingType ||
            null,

          city:
            req.query?.city ||
            null,

          minPrice:
            req.query?.minPrice ||
            null,

          maxPrice:
            req.query?.maxPrice ||
            null
        }
      );

    return success(
      res,
      result,
      'Favourite properties retrieved.'
    );
  } catch (error) {
    console.error(
      '[FAVOURITES] List error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve favourite properties.',
      error
    );
  }
}

/* ============================================================
   6. GET FAVOURITE BY ID
   ============================================================ */

/**
 * GET /api/favourites/:id
 */

async function getFavourite(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const favouriteId =
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!favouriteId) {
      return failure(
        res,
        400,
        'Favourite ID is required.'
      );
    }

    const service =
      getFavouritesService();

    if (!service) {
      return failure(
        res,
        503,
        'Favourites service is unavailable.'
      );
    }

    const method =
      service.getFavourite ||
      service.getFavorite;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Favourite retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          favouriteId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Favourite not found.'
      );
    }

    return success(
      res,
      result,
      'Favourite retrieved.'
    );
  } catch (error) {
    console.error(
      '[FAVOURITES] Get error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve favourite.',
      error
    );
  }
}

/* ============================================================
   7. REMOVE FAVOURITE BY ID
   ============================================================ */

/**
 * DELETE /api/favourites/id/:id
 */

async function deleteFavourite(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const favouriteId =
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!favouriteId) {
      return failure(
        res,
        400,
        'Favourite ID is required.'
      );
    }

    const service =
      getFavouritesService();

    if (!service) {
      return failure(
        res,
        503,
        'Favourites service is unavailable.'
      );
    }

    const method =
      service.deleteFavourite ||
      service.deleteFavorite ||
      service.removeFavourite ||
      service.removeFavorite;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Favourite deletion is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          favouriteId
        }
      );

    await createAuditLog(
      req,
      'FAVOURITE_DELETED',
      {
        favouriteId
      }
    );

    return success(
      res,
      result,
      'Favourite deleted successfully.'
    );
  } catch (error) {
    console.error(
      '[FAVOURITES] Delete error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to delete favourite.',
      error
    );
  }
}

/* ============================================================
   8. CLEAR ALL FAVOURITES
   ============================================================ */

/**
 * DELETE /api/favourites
 */

async function clearFavourites(
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
      getFavouritesService();

    if (!service) {
      return failure(
        res,
        503,
        'Favourites service is unavailable.'
      );
    }

    const method =
      service.clearFavourites ||
      service.clearFavorites ||
      service.deleteAllFavourites ||
      service.deleteAllFavorites;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Clearing favourites is not implemented.'
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
      'FAVOURITES_CLEARED'
    );

    return success(
      res,
      result,
      'All favourites have been cleared.'
    );
  } catch (error) {
    console.error(
      '[FAVOURITES] Clear error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to clear favourites.',
      error
    );
  }
}

/* ============================================================
   9. FAVOURITE COUNT
   ============================================================ */

/**
 * GET /api/favourites/count
 */

async function getFavouriteCount(
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
      getFavouritesService();

    if (!service) {
      return failure(
        res,
        503,
        'Favourites service is unavailable.'
      );
    }

    const method =
      service.getFavouriteCount ||
      service.getFavoriteCount ||
      service.countFavourites ||
      service.countFavorites;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Favourite count is not implemented.'
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
      'Favourite count retrieved.'
    );
  } catch (error) {
    console.error(
      '[FAVOURITES] Count error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve favourite count.',
      error
    );
  }
}

/* ============================================================
   10. CHECK MULTIPLE PROPERTIES
   ============================================================ */

/**
 * POST /api/favourites/status
 *
 * Body:
 * {
 *   "propertyIds": [
 *     "GHAR-P001",
 *     "GHAR-P002"
 *   ]
 * }
 */

async function getMultipleFavouriteStatus(
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

    const propertyIds =
      Array.isArray(
        req.body?.propertyIds
      )
        ? req.body.propertyIds
            .map(id =>
              String(id).trim()
            )
            .filter(Boolean)
        : [];

    if (!propertyIds.length) {
      return failure(
        res,
        400,
        'At least one property ID is required.'
      );
    }

    if (
      propertyIds.length >
      100
    ) {
      return failure(
        res,
        400,
        'A maximum of 100 property IDs can be checked at once.'
      );
    }

    const service =
      getFavouritesService();

    if (!service) {
      return failure(
        res,
        503,
        'Favourites service is unavailable.'
      );
    }

    const method =
      service.getMultipleFavouriteStatus ||
      service.getMultipleFavoriteStatus ||
      service.checkMultiple;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Bulk favourite status is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          propertyIds
        }
      );

    return success(
      res,
      result,
      'Favourite statuses retrieved.'
    );
  } catch (error) {
    console.error(
      '[FAVOURITES] Bulk status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve favourite statuses.',
      error
    );
  }
}

/* ============================================================
   11. SYNC FAVOURITES
   ============================================================ */

/**
 * POST /api/favourites/sync
 *
 * Useful for the GHAR mobile app when local
 * favourite state needs to be synchronized.
 *
 * Body:
 * {
 *   "propertyIds": [
 *     "GHAR-P001",
 *     "GHAR-P002"
 *   ]
 * }
 */

async function syncFavourites(
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

    const propertyIds =
      Array.isArray(
        req.body?.propertyIds
      )
        ? req.body.propertyIds
            .map(id =>
              String(id).trim()
            )
            .filter(Boolean)
        : [];

    const service =
      getFavouritesService();

    if (!service) {
      return failure(
        res,
        503,
        'Favourites service is unavailable.'
      );
    }

    const method =
      service.syncFavourites ||
      service.syncFavorites;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Favourite synchronization is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          propertyIds
        }
      );

    return success(
      res,
      result,
      'Favourites synchronized successfully.'
    );
  } catch (error) {
    console.error(
      '[FAVOURITES] Sync error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to synchronize favourites.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  addFavourite,

  removeFavourite,

  toggleFavourite,

  getFavouriteStatus,

  listFavourites,

  getFavourite,

  deleteFavourite,

  clearFavourites,

  getFavouriteCount,

  getMultipleFavouriteStatus,

  syncFavourites
};