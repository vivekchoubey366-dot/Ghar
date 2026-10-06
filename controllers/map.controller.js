'use strict';

/**
 * ============================================================
 * GHAR - Map Controller
 * ============================================================
 *
 * Handles:
 * - Property map search
 * - Nearby properties
 * - Properties inside map bounds
 * - Location/geocoding
 * - Reverse geocoding
 * - Nearby places
 * - Property clusters
 * - Map filters
 *
 * Business logic:
 *     services/map.service.js
 *
 * Database logic:
 *     repositories/map.repository.js
 *
 * External map providers:
 *     Google Maps / Mapbox / OpenStreetMap
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE
   ============================================================ */

function getMapService() {
  try {
    return require('../services/map.service');
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
   NUMBER HELPERS
   ============================================================ */

function number(value) {
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

function validLatitude(value) {
  const lat = number(value);

  return (
    lat !== null &&
    lat >= -90 &&
    lat <= 90
  );
}

function validLongitude(value) {
  const lng = number(value);

  return (
    lng !== null &&
    lng >= -180 &&
    lng <= 180
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
        'map',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.['user-agent'] ||
        null
    });
  } catch (error) {
    console.error(
      '[MAP AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. PROPERTY MAP SEARCH
   ============================================================ */

/**
 * GET /api/map/properties
 *
 * Example:
 *
 * /api/map/properties?
 * north=28.650&
 * south=28.550&
 * east=77.450&
 * west=77.300
 */

async function getPropertiesOnMap(
  req,
  res
) {
  try {
    const north =
      number(req.query?.north);

    const south =
      number(req.query?.south);

    const east =
      number(req.query?.east);

    const west =
      number(req.query?.west);

    if (
      !validLatitude(north) ||
      !validLatitude(south) ||
      !validLongitude(east) ||
      !validLongitude(west)
    ) {
      return failure(
        res,
        400,
        'Valid map bounds are required.'
      );
    }

    if (south >= north) {
      return failure(
        res,
        400,
        'South latitude must be less than north latitude.'
      );
    }

    const service =
      getMapService();

    if (!service) {
      return failure(
        res,
        503,
        'Map service is unavailable.'
      );
    }

    const method =
      service.getPropertiesOnMap ||
      service.getMapProperties ||
      service.searchPropertiesInBounds;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Map property search is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          bounds: {
            north,
            south,
            east,
            west
          },

          propertyType:
            req.query?.propertyType ||
            null,

          listingType:
            req.query?.listingType ||
            null,

          status:
            req.query?.status ||
            'active',

          city:
            req.query?.city ||
            null,

          locality:
            req.query?.locality ||
            null,

          minPrice:
            number(
              req.query?.minPrice
            ),

          maxPrice:
            number(
              req.query?.maxPrice
            ),

          bedrooms:
            number(
              req.query?.bedrooms
            ),

          furnishing:
            req.query?.furnishing ||
            null,

          limit:
            Math.min(
              Math.max(
                number(
                  req.query?.limit
                ) || 100,
                1
              ),
              500
            )
        }
      );

    return success(
      res,
      result,
      'Map properties retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MAP] Property search error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve map properties.',
      error
    );
  }
}

/* ============================================================
   2. NEARBY PROPERTIES
   ============================================================ */

/**
 * GET /api/map/nearby
 *
 * Query:
 * latitude
 * longitude
 * radius
 */

async function getNearbyProperties(
  req,
  res
) {
  try {
    const latitude =
      number(
        req.query?.latitude ||
        req.query?.lat
      );

    const longitude =
      number(
        req.query?.longitude ||
        req.query?.lng
      );

    const radius =
      number(
        req.query?.radius
      ) || 5000;

    if (
      !validLatitude(latitude)
    ) {
      return failure(
        res,
        400,
        'Valid latitude is required.'
      );
    }

    if (
      !validLongitude(longitude)
    ) {
      return failure(
        res,
        400,
        'Valid longitude is required.'
      );
    }

    if (
      radius <= 0 ||
      radius > 100000
    ) {
      return failure(
        res,
        400,
        'Radius must be between 1 and 100000 meters.'
      );
    }

    const service =
      getMapService();

    if (!service) {
      return failure(
        res,
        503,
        'Map service is unavailable.'
      );
    }

    const method =
      service.getNearbyProperties ||
      service.findNearbyProperties;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Nearby property search is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          latitude,

          longitude,

          radius,

          propertyType:
            req.query?.propertyType ||
            null,

          listingType:
            req.query?.listingType ||
            null,

          minPrice:
            number(
              req.query?.minPrice
            ),

          maxPrice:
            number(
              req.query?.maxPrice
            ),

          bedrooms:
            number(
              req.query?.bedrooms
            ),

          limit:
            Math.min(
              Math.max(
                number(
                  req.query?.limit
                ) || 50,
                1
              ),
              200
            )
        }
      );

    return success(
      res,
      result,
      'Nearby properties retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MAP] Nearby error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve nearby properties.',
      error
    );
  }
}

/* ============================================================
   3. REVERSE GEOCODING
   ============================================================ */

/**
 * GET /api/map/reverse-geocode
 */

async function reverseGeocode(
  req,
  res
) {
  try {
    const latitude =
      number(
        req.query?.latitude ||
        req.query?.lat
      );

    const longitude =
      number(
        req.query?.longitude ||
        req.query?.lng
      );

    if (
      !validLatitude(latitude)
    ) {
      return failure(
        res,
        400,
        'Valid latitude is required.'
      );
    }

    if (
      !validLongitude(longitude)
    ) {
      return failure(
        res,
        400,
        'Valid longitude is required.'
      );
    }

    const service =
      getMapService();

    if (!service) {
      return failure(
        res,
        503,
        'Map service is unavailable.'
      );
    }

    const method =
      service.reverseGeocode ||
      service.getAddressFromCoordinates;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Reverse geocoding is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          latitude,

          longitude
        }
      );

    return success(
      res,
      result,
      'Location address retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MAP] Reverse geocode error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to resolve location.',
      error
    );
  }
}

/* ============================================================
   4. GEOCODING
   ============================================================ */

/**
 * GET /api/map/geocode
 *
 * Query:
 * ?address=Sector 18 Noida
 */

async function geocode(
  req,
  res
) {
  try {
    const address =
      typeof req.query?.address ===
      'string'
        ? req.query.address.trim()
        : '';

    if (!address) {
      return failure(
        res,
        400,
        'Address is required.'
      );
    }

    if (address.length > 500) {
      return failure(
        res,
        400,
        'Address is too long.'
      );
    }

    const service =
      getMapService();

    if (!service) {
      return failure(
        res,
        503,
        'Map service is unavailable.'
      );
    }

    const method =
      service.geocode ||
      service.getCoordinatesFromAddress;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Geocoding is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          address
        }
      );

    return success(
      res,
      result,
      'Address coordinates retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MAP] Geocode error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to geocode address.',
      error
    );
  }
}

/* ============================================================
   5. NEARBY PLACES
   ============================================================ */

/**
 * GET /api/map/places
 *
 * Query:
 * latitude
 * longitude
 * type
 * radius
 */

async function getNearbyPlaces(
  req,
  res
) {
  try {
    const latitude =
      number(
        req.query?.latitude ||
        req.query?.lat
      );

    const longitude =
      number(
        req.query?.longitude ||
        req.query?.lng
      );

    const radius =
      number(
        req.query?.radius
      ) || 5000;

    const type =
      typeof req.query?.type ===
      'string'
        ? req.query.type.trim()
        : 'all';

    if (
      !validLatitude(latitude)
    ) {
      return failure(
        res,
        400,
        'Valid latitude is required.'
      );
    }

    if (
      !validLongitude(longitude)
    ) {
      return failure(
        res,
        400,
        'Valid longitude is required.'
      );
    }

    if (
      radius <= 0 ||
      radius > 50000
    ) {
      return failure(
        res,
        400,
        'Radius must be between 1 and 50000 meters.'
      );
    }

    const service =
      getMapService();

    if (!service) {
      return failure(
        res,
        503,
        'Map service is unavailable.'
      );
    }

    const method =
      service.getNearbyPlaces ||
      service.findNearbyPlaces;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Nearby places service is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          latitude,

          longitude,

          radius,

          type,

          keyword:
            req.query?.keyword ||
            null
        }
      );

    return success(
      res,
      result,
      'Nearby places retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MAP] Nearby places error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve nearby places.',
      error
    );
  }
}

/* ============================================================
   6. PROPERTY CLUSTERS
   ============================================================ */

/**
 * GET /api/map/clusters
 */

async function getPropertyClusters(
  req,
  res
) {
  try {
    const north =
      number(req.query?.north);

    const south =
      number(req.query?.south);

    const east =
      number(req.query?.east);

    const west =
      number(req.query?.west);

    const zoom =
      number(req.query?.zoom);

    if (
      !validLatitude(north) ||
      !validLatitude(south) ||
      !validLongitude(east) ||
      !validLongitude(west)
    ) {
      return failure(
        res,
        400,
        'Valid map bounds are required.'
      );
    }

    if (
      zoom === null ||
      zoom < 0 ||
      zoom > 22
    ) {
      return failure(
        res,
        400,
        'Valid map zoom level is required.'
      );
    }

    const service =
      getMapService();

    if (!service) {
      return failure(
        res,
        503,
        'Map service is unavailable.'
      );
    }

    const method =
      service.getPropertyClusters ||
      service.getClusters ||
      service.clusterProperties;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property clustering is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          bounds: {
            north,
            south,
            east,
            west
          },

          zoom,

          propertyType:
            req.query?.propertyType ||
            null,

          listingType:
            req.query?.listingType ||
            null,

          minPrice:
            number(
              req.query?.minPrice
            ),

          maxPrice:
            number(
              req.query?.maxPrice
            )
        }
      );

    return success(
      res,
      result,
      'Property clusters retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MAP] Cluster error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve property clusters.',
      error
    );
  }
}

/* ============================================================
   7. LOCATION SEARCH
   ============================================================ */

/**
 * GET /api/map/search
 */

async function searchLocation(
  req,
  res
) {
  try {
    const query =
      typeof req.query?.q ===
      'string'
        ? req.query.q.trim()
        : '';

    if (!query) {
      return failure(
        res,
        400,
        'Location search query is required.'
      );
    }

    if (query.length > 300) {
      return failure(
        res,
        400,
        'Location search query is too long.'
      );
    }

    const service =
      getMapService();

    if (!service) {
      return failure(
        res,
        503,
        'Map service is unavailable.'
      );
    }

    const method =
      service.searchLocation ||
      service.searchPlaces ||
      service.autocompleteLocation;

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

          latitude:
            number(
              req.query?.latitude ||
              req.query?.lat
            ),

          longitude:
            number(
              req.query?.longitude ||
              req.query?.lng
            ),

          limit:
            Math.min(
              Math.max(
                number(
                  req.query?.limit
                ) || 10,
                1
              ),
              50
            )
        }
      );

    return success(
      res,
      result,
      'Location search completed successfully.'
    );
  } catch (error) {
    console.error(
      '[MAP] Location search error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to search location.',
      error
    );
  }
}

/* ============================================================
   8. SAVE USER LOCATION
   ============================================================ */

/**
 * POST /api/map/location
 *
 * Body:
 * {
 *   latitude: 28.6139,
 *   longitude: 77.2090
 * }
 */

async function saveUserLocation(
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

    const latitude =
      number(
        req.body?.latitude ||
        req.body?.lat
      );

    const longitude =
      number(
        req.body?.longitude ||
        req.body?.lng
      );

    if (
      !validLatitude(latitude) ||
      !validLongitude(longitude)
    ) {
      return failure(
        res,
        400,
        'Valid latitude and longitude are required.'
      );
    }

    const service =
      getMapService();

    if (!service) {
      return failure(
        res,
        503,
        'Map service is unavailable.'
      );
    }

    const method =
      service.saveUserLocation ||
      service.updateUserLocation;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'User location storage is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          latitude,

          longitude
        }
      );

    return success(
      res,
      result,
      'Location saved successfully.'
    );
  } catch (error) {
    console.error(
      '[MAP] Save location error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to save location.',
      error
    );
  }
}

/* ============================================================
   9. GET USER LOCATION
   ============================================================ */

/**
 * GET /api/map/location
 */

async function getUserLocation(
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
      getMapService();

    if (!service) {
      return failure(
        res,
        503,
        'Map service is unavailable.'
      );
    }

    const method =
      service.getUserLocation ||
      service.findUserLocation;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'User location retrieval is not implemented.'
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
      'User location retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MAP] Get user location error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve user location.',
      error
    );
  }
}

/* ============================================================
   10. PROPERTY LOCATION
   ============================================================ */

/**
 * GET /api/map/properties/:propertyId
 */

async function getPropertyLocation(
  req,
  res
) {
  try {
    const propertyId =
      req.params?.propertyId ||
      req.params?.id;

    if (!propertyId) {
      return failure(
        res,
        400,
        'Property ID is required.'
      );
    }

    const service =
      getMapService();

    if (!service) {
      return failure(
        res,
        503,
        'Map service is unavailable.'
      );
    }

    const method =
      service.getPropertyLocation ||
      service.getLocationForProperty;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property location service is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          propertyId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Property location not found.'
      );
    }

    return success(
      res,
      result,
      'Property location retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MAP] Property location error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve property location.',
      error
    );
  }
}

/* ============================================================
   11. DISTANCE BETWEEN TWO LOCATIONS
   ============================================================ */

/**
 * POST /api/map/distance
 *
 * Body:
 * {
 *   "origin": {
 *     "latitude": 28.6139,
 *     "longitude": 77.2090
 *   },
 *   "destination": {
 *     "latitude": 28.5355,
 *     "longitude": 77.3910
 *   }
 * }
 */

async function calculateDistance(
  req,
  res
) {
  try {
    const origin =
      req.body?.origin || {};

    const destination =
      req.body?.destination || {};

    const originLatitude =
      number(
        origin.latitude ||
        origin.lat
      );

    const originLongitude =
      number(
        origin.longitude ||
        origin.lng
      );

    const destinationLatitude =
      number(
        destination.latitude ||
        destination.lat
      );

    const destinationLongitude =
      number(
        destination.longitude ||
        destination.lng
      );

    if (
      !validLatitude(
        originLatitude
      ) ||
      !validLongitude(
        originLongitude
      ) ||
      !validLatitude(
        destinationLatitude
      ) ||
      !validLongitude(
        destinationLongitude
      )
    ) {
      return failure(
        res,
        400,
        'Valid origin and destination coordinates are required.'
      );
    }

    const service =
      getMapService();

    if (
      service &&
      typeof service.calculateDistance ===
        'function'
    ) {
      const result =
        await service.calculateDistance({
          origin: {
            latitude:
              originLatitude,

            longitude:
              originLongitude
          },

          destination: {
            latitude:
              destinationLatitude,

            longitude:
              destinationLongitude
          }
        });

      return success(
        res,
        result,
        'Distance calculated successfully.'
      );
    }

    /*
     * Haversine fallback.
     */

    const earthRadius = 6371000;

    const toRadians =
      degrees =>
        degrees *
        Math.PI /
        180;

    const dLat =
      toRadians(
        destinationLatitude -
        originLatitude
      );

    const dLng =
      toRadians(
        destinationLongitude -
        originLongitude
      );

    const lat1 =
      toRadians(
        originLatitude
      );

    const lat2 =
      toRadians(
        destinationLatitude
      );

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(dLng / 2) ** 2;

    const distance =
      earthRadius *
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return success(
      res,
      {
        distanceMeters:
          Number(
            distance.toFixed(2)
          ),

        distanceKilometers:
          Number(
            (
              distance /
              1000
            ).toFixed(2)
          )
      },
      'Distance calculated successfully.'
    );
  } catch (error) {
    console.error(
      '[MAP] Distance error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to calculate distance.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  getPropertiesOnMap,

  getNearbyProperties,

  reverseGeocode,

  geocode,

  getNearbyPlaces,

  getPropertyClusters,

  searchLocation,

  saveUserLocation,

  getUserLocation,

  getPropertyLocation,

  calculateDistance
};