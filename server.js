'use strict';

/**
 * ============================================================
 * GHAR - Real Estate Platform
 * Main Express Server
 * ============================================================
 *
 * Responsibilities:
 * - Load environment configuration
 * - Configure Express
 * - Security middleware
 * - Request IDs
 * - Request logging
 * - Rate limiting
 * - API routes
 * - Static frontend
 * - Uploads
 * - Health/readiness endpoints
 * - 404 handling
 * - Global error handling
 * - Graceful shutdown
 *
 * ============================================================
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');

const app = express();
const server = http.createServer(app);

/* ============================================================
   1. ENVIRONMENT
   ============================================================ */

require('dotenv').config();

const PORT = Number(process.env.PORT || 10000);
const NODE_ENV = process.env.NODE_ENV || 'development';

const ROOT_DIR = __dirname;
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const LOGS_DIR = path.join(ROOT_DIR, 'logs');

/* ============================================================
   2. DIRECTORY INITIALIZATION
   ============================================================ */

const requiredDirectories = [
  UPLOADS_DIR,
  LOGS_DIR,

  path.join(UPLOADS_DIR, 'agreements'),
  path.join(UPLOADS_DIR, 'documents'),
  path.join(UPLOADS_DIR, 'floor-plans'),
  path.join(UPLOADS_DIR, 'profiles'),
  path.join(UPLOADS_DIR, 'profile-images'),
  path.join(UPLOADS_DIR, 'properties'),
  path.join(UPLOADS_DIR, 'property-images'),
  path.join(UPLOADS_DIR, 'property-videos'),
  path.join(UPLOADS_DIR, 'verifications'),
  path.join(UPLOADS_DIR, 'temp')
];

for (const directory of requiredDirectories) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true
    });
  }
}

/* ============================================================
   3. BASIC APPLICATION SETTINGS
   ============================================================ */

app.disable('x-powered-by');

app.set('trust proxy', 1);

app.set('json spaces', NODE_ENV === 'development' ? 2 : 0);

/* ============================================================
   4. LOGGER
   ============================================================ */

let logger;

try {
  logger = require('./utils/logger');
} catch (error) {
  logger = {
    info: (...args) => console.log('[INFO]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    debug: (...args) => {
      if (NODE_ENV === 'development') {
        console.debug('[DEBUG]', ...args);
      }
    }
  };

  console.warn(
    '[GHAR] utils/logger.js not available. Using console logger.'
  );
}

/* ============================================================
   5. REQUEST ID
   ============================================================ */

let requestIdMiddleware;

try {
  requestIdMiddleware = require('./middleware/request-id.middleware');

  if (typeof requestIdMiddleware === 'function') {
    app.use(requestIdMiddleware);
  } else if (
    requestIdMiddleware &&
    typeof requestIdMiddleware.requestId === 'function'
  ) {
    app.use(requestIdMiddleware.requestId);
  }
} catch (error) {
  logger.warn(
    '[GHAR] request-id.middleware.js unavailable:',
    error.message
  );
}

/* ============================================================
   6. BODY PARSERS
   ============================================================ */

app.use(
  express.json({
    limit: process.env.JSON_BODY_LIMIT || '2mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.URLENCODED_BODY_LIMIT || '2mb'
  })
);

/* ============================================================
   7. SECURITY
   ============================================================ */

try {
  const helmet = require('helmet');

  app.use(
    helmet({
      contentSecurityPolicy:
        NODE_ENV === 'production'
          ? undefined
          : false,

      crossOriginResourcePolicy: {
        policy: 'cross-origin'
      }
    })
  );
} catch (error) {
  logger.warn(
    '[GHAR] helmet not available:',
    error.message
  );
}

/* ============================================================
   8. CORS
   ============================================================ */

try {
  const corsMiddleware = require('./config/cors');

  if (typeof corsMiddleware === 'function') {
    app.use(corsMiddleware);
  } else if (
    corsMiddleware &&
    typeof corsMiddleware.cors === 'function'
  ) {
    app.use(corsMiddleware.cors);
  } else {
    logger.warn(
      '[GHAR] config/cors.js does not export a valid middleware.'
    );
  }
} catch (error) {
  logger.warn(
    '[GHAR] CORS configuration unavailable:',
    error.message
  );

  /*
   * Development fallback.
   * Production should use config/cors.js.
   */
  const cors = require('cors');

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',')
        : true,

      credentials: true
    })
  );
}

/* ============================================================
   9. REQUEST LOGGING
   ============================================================ */

app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();

    const durationMs =
      Number(end - start) / 1_000_000;

    const requestId =
      req.requestId ||
      req.id ||
      res.getHeader('X-Request-ID') ||
      '-';

    logger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(
        2
      )}ms requestId=${requestId}`
    );
  });

  next();
});

/* ============================================================
   10. SECURITY MIDDLEWARE
   ============================================================ */

try {
  const securityMiddleware = require(
    './middleware/security.middleware'
  );

  if (typeof securityMiddleware === 'function') {
    app.use(securityMiddleware);
  } else if (
    securityMiddleware &&
    typeof securityMiddleware.security === 'function'
  ) {
    app.use(securityMiddleware.security);
  }
} catch (error) {
  logger.warn(
    '[GHAR] security.middleware.js unavailable:',
    error.message
  );
}

/* ============================================================
   11. RATE LIMITING
   ============================================================ */

try {
  const rateLimitMiddleware = require(
    './middleware/rate-limit.middleware'
  );

  if (typeof rateLimitMiddleware === 'function') {
    app.use('/api', rateLimitMiddleware);
  } else if (
    rateLimitMiddleware &&
    typeof rateLimitMiddleware.apiRateLimiter === 'function'
  ) {
    app.use(
      '/api',
      rateLimitMiddleware.apiRateLimiter
    );
  }
} catch (error) {
  logger.warn(
    '[GHAR] rate-limit.middleware.js unavailable:',
    error.message
  );
}

/* ============================================================
   12. STATIC UPLOADS
   ============================================================ */

app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    fallthrough: false,
    index: false,
    maxAge: NODE_ENV === 'production'
      ? '1d'
      : 0
  })
);

/* ============================================================
   13. API HEALTH CHECKS
   ============================================================ */

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'GHAR API',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'GHAR API',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/ready', async (req, res) => {
  try {
    let databaseHealthy = true;

    try {
      const database = require('./config/database');

      if (
        database &&
        typeof database.healthCheck === 'function'
      ) {
        databaseHealthy =
          await database.healthCheck();
      } else if (
        database &&
        database.pool &&
        typeof database.pool.query === 'function'
      ) {
        await database.pool.query('SELECT 1');
      }
    } catch (error) {
      databaseHealthy = false;

      logger.error(
        '[GHAR] Database readiness check failed:',
        error.message
      );
    }

    if (!databaseHealthy) {
      return res.status(503).json({
        success: false,
        status: 'not_ready',
        database: 'unavailable',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      status: 'not_ready',
      timestamp: new Date().toISOString()
    });
  }
});

/* ============================================================
   14. DATABASE INITIALIZATION
   ============================================================ */

async function initializeDatabase() {
  try {
    const database = require('./config/database');

    if (!database) {
      logger.warn(
        '[GHAR] Database module returned nothing.'
      );

      return;
    }

    if (typeof database.connectDatabase === 'function') {
      await database.connectDatabase();

      logger.info(
        '[GHAR] Database connected.'
      );

      return;
    }

    if (typeof database.initializeDatabase === 'function') {
      await database.initializeDatabase();

      logger.info(
        '[GHAR] Database initialized.'
      );

      return;
    }

    if (typeof database.connect === 'function') {
      await database.connect();

      logger.info(
        '[GHAR] Database connected.'
      );

      return;
    }

    if (
      database.pool &&
      typeof database.pool.query === 'function'
    ) {
      await database.pool.query('SELECT 1');

      logger.info(
        '[GHAR] Database connection verified.'
      );

      return;
    }

    logger.warn(
      '[GHAR] No recognized database initialization method found.'
    );
  } catch (error) {
    logger.error(
      '[GHAR] Database initialization failed:',
      error
    );

    throw error;
  }
}

/* ============================================================
   15. ROUTE LOADER
   ============================================================ */

/*
 * Every route in the plan lives inside /routes.
 *
 * Important:
 * We DO NOT use:
 *
 * app.use('*', ...)
 *
 * because Express/path-to-regexp versions can throw:
 *
 * PathError: Missing parameter name at index 1: *
 *
 * Instead, routes are explicitly mounted.
 */

function loadRouter(routeFile) {
  const routePath = path.join(
    ROOT_DIR,
    'routes',
    routeFile
  );

  if (!fs.existsSync(routePath)) {
    logger.warn(
      `[GHAR] Route file not found: ${routeFile}`
    );

    return null;
  }

  try {
    const imported = require(routePath);

    let router = imported;

    /*
     * Support:
     *
     * module.exports = router
     *
     * and:
     *
     * module.exports = { router }
     *
     * and:
     *
     * module.exports = { default: router }
     */

    if (
      imported &&
      imported.default
    ) {
      router = imported.default;
    }

    if (
      imported &&
      imported.router
    ) {
      router = imported.router;
    }

    if (typeof router !== 'function') {
      throw new TypeError(
        `${routeFile} does not export a valid Express router.`
      );
    }

    return router;
  } catch (error) {
    logger.error(
      `[GHAR] Failed to load ${routeFile}:`,
      error
    );

    /*
     * Fail fast for route configuration errors.
     *
     * This prevents the application from appearing healthy
     * while a critical API route is broken.
     */
    throw error;
  }
}

/* ============================================================
   16. API ROUTES
   ============================================================ */

const API_ROUTES = [
  {
    prefix: '/api/auth',
    file: 'auth.routes.js'
  },
  {
    prefix: '/api/users',
    file: 'user.routes.js'
  },
  {
    prefix: '/api/properties',
    file: 'property.routes.js'
  },
  {
    prefix: '/api/search',
    file: 'search.routes.js'
  },
  {
    prefix: '/api/applications',
    file: 'application.routes.js'
  },
  {
    prefix: '/api/documents',
    file: 'document.routes.js'
  },
  {
    prefix: '/api/loans',
    file: 'loan.routes.js'
  },
  {
    prefix: '/api/payments',
    file: 'payment.routes.js'
  },
  {
    prefix: '/api/subscriptions',
    file: 'subscription.routes.js'
  },
  {
    prefix: '/api/offers',
    file: 'offer.routes.js'
  },
  {
    prefix: '/api/visits',
    file: 'visit.routes.js'
  },
  {
    prefix: '/api/messages',
    file: 'message.routes.js'
  },
  {
    prefix: '/api/referrals',
    file: 'referral.routes.js'
  },
  {
    prefix: '/api/services',
    file: 'services.routes.js'
  },
  {
    prefix: '/api/compare',
    file: 'compare.routes.js'
  },
  {
    prefix: '/api/favourites',
    file: 'favourites.routes.js'
  },
  {
    prefix: '/api/map',
    file: 'map.routes.js'
  },
  {
    prefix: '/api/marketplace',
    file: 'marketplace.routes.js'
  },
  {
    prefix: '/api/verification',
    file: 'verification.routes.js'
  },
  {
    prefix: '/api/admin',
    file: 'admin.routes.js'
  },
  {
    prefix: '/api/admin/ai',
    file: 'admin-ai.routes.js'
  },
  {
    prefix: '/api/ai',
    file: 'ai.routes.js'
  },
  {
    prefix: '/api/offline',
    file: 'offline.routes.js'
  }
];

/* ============================================================
   17. MOUNT ROUTES
   ============================================================ */

function mountRoutes() {
  for (const route of API_ROUTES) {
    const router = loadRouter(route.file);

    if (!router) {
      continue;
    }

    app.use(route.prefix, router);

    logger.info(
      `[GHAR] Mounted ${route.prefix} -> ${route.file}`
    );
  }
}

/* ============================================================
   18. API INFORMATION
   ============================================================ */

app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'GHAR API',
    version: process.env.API_VERSION || 'v1',
    environment: NODE_ENV,
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      properties: '/api/properties',
      search: '/api/search',
      applications: '/api/applications',
      documents: '/api/documents',
      loans: '/api/loans',
      payments: '/api/payments',
      subscriptions: '/api/subscriptions',
      offers: '/api/offers',
      visits: '/api/visits',
      messages: '/api/messages',
      referrals: '/api/referrals',
      services: '/api/services',
      compare: '/api/compare',
      favourites: '/api/favourites',
      map: '/api/map',
      marketplace: '/api/marketplace',
      verification: '/api/verification',
      ai: '/api/ai',
      admin: '/api/admin'
    }
  });
});

/* ============================================================
   19. FRONTEND STATIC FILES
   ============================================================ */

const FRONTEND_DIR = ROOT_DIR;

const staticOptions = {
  index: false,
  fallthrough: true,
  maxAge: NODE_ENV === 'production'
    ? '1d'
    : 0
};

app.use(
  express.static(
    FRONTEND_DIR,
    staticOptions
  )
);

/* ============================================================
   20. FRONTEND ROUTES
   ============================================================ */

/*
 * Do not use app.get('*', ...).
 *
 * Explicitly serve the main entry page instead.
 */

app.get('/', (req, res) => {
  res.sendFile(
    path.join(ROOT_DIR, 'index.html')
  );
});

/* ============================================================
   21. ERROR HANDLING
   ============================================================ */

try {
  const notFoundMiddleware = require(
    './middleware/not-found.middleware'
  );

  if (typeof notFoundMiddleware === 'function') {
    app.use(notFoundMiddleware);
  } else if (
    notFoundMiddleware &&
    typeof notFoundMiddleware.notFound === 'function'
  ) {
    app.use(
      notFoundMiddleware.notFound
    );
  }
} catch (error) {
  /*
   * Fallback 404 handler.
   *
   * This is deliberately registered without '*'.
   */
  app.use((req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        path: req.originalUrl
      });
    }

    return res.status(404).sendFile(
      path.join(ROOT_DIR, '404.html')
    );
  });
}

/* ============================================================
   22. GLOBAL ERROR HANDLER
   ============================================================ */

try {
  const errorMiddleware = require(
    './middleware/error.middleware'
  );

  if (typeof errorMiddleware === 'function') {
    app.use(errorMiddleware);
  } else if (
    errorMiddleware &&
    typeof errorMiddleware.errorHandler === 'function'
  ) {
    app.use(
      errorMiddleware.errorHandler
    );
  }
} catch (error) {
  /*
   * Final fallback error handler.
   */

  app.use(
    (error, req, res, next) => {
      logger.error(
        '[GHAR] Unhandled application error:',
        error
      );

      if (res.headersSent) {
        return next(error);
      }

      const statusCode =
        Number(error.statusCode) ||
        Number(error.status) ||
        500;

      return res.status(
        statusCode >= 400 &&
        statusCode < 600
          ? statusCode
          : 500
      ).json({
        success: false,
        error:
          NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message,
        requestId:
          req.requestId ||
          req.id ||
          null
      });
    }
  );
}

/* ============================================================
   23. UNHANDLED PROMISE REJECTIONS
   ============================================================ */

process.on(
  'unhandledRejection',
  (reason) => {
    logger.error(
      '[GHAR] Unhandled Promise Rejection:',
      reason
    );
  }
);

/* ============================================================
   24. UNCAUGHT EXCEPTIONS
   ============================================================ */

process.on(
  'uncaughtException',
  (error) => {
    logger.error(
      '[GHAR] Uncaught Exception:',
      error
    );

    /*
     * An uncaught exception can leave the process
     * in an unsafe state. Close gracefully.
     */
    gracefulShutdown('uncaughtException');
  }
);

/* ============================================================
   25. GRACEFUL SHUTDOWN
   ============================================================ */

let shuttingDown = false;

async function gracefulShutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  logger.info(
    `[GHAR] ${signal} received. Starting graceful shutdown...`
  );

  server.close(async () => {
    try {
      const database =
        require('./config/database');

      if (
        database &&
        typeof database.closeDatabase === 'function'
      ) {
        await database.closeDatabase();
      } else if (
        database &&
        typeof database.disconnect === 'function'
      ) {
        await database.disconnect();
      } else if (
        database &&
        database.pool &&
        typeof database.pool.end === 'function'
      ) {
        await database.pool.end();
      }

      logger.info(
        '[GHAR] Database connection closed.'
      );
    } catch (error) {
      logger.error(
        '[GHAR] Error closing database:',
        error
      );
    }

    logger.info(
      '[GHAR] Server shutdown complete.'
    );

    process.exit(0);
  });

  /*
   * Force shutdown if something refuses to close.
   */
  setTimeout(() => {
    logger.error(
      '[GHAR] Forced shutdown after timeout.'
    );

    process.exit(1);
  }, 10_000).unref();
}

process.on(
  'SIGTERM',
  () => gracefulShutdown('SIGTERM')
);

process.on(
  'SIGINT',
  () => gracefulShutdown('SIGINT')
);

/* ============================================================
   26. START SERVER
   ============================================================ */

async function startServer() {
  try {
    logger.info(
      '================================================'
    );

    logger.info(
      'GHAR Backend Starting'
    );

    logger.info(
      '================================================'
    );

    logger.info(
      `[GHAR] Environment: ${NODE_ENV}`
    );

    logger.info(
      `[GHAR] Node.js: ${process.version}`
    );

    logger.info(
      `[GHAR] Root directory: ${ROOT_DIR}`
    );

    /*
     * Initialize database before accepting traffic.
     */
    await initializeDatabase();

    /*
     * Mount API routes after configuration/database
     * initialization.
     */
    mountRoutes();

    /*
     * Start HTTP server.
     */
    server.listen(
      PORT,
      '0.0.0.0',
      () => {
        logger.info(
          '================================================'
        );

        logger.info(
          `[GHAR] Server running on port ${PORT}`
        );

        logger.info(
          `[GHAR] Environment: ${NODE_ENV}`
        );

        logger.info(
          `[GHAR] Health: /health`
        );

        logger.info(
          `[GHAR] API: /api`
        );

        logger.info(
          '================================================'
        );
      }
    );
  } catch (error) {
    logger.error(
      '[GHAR] Server startup failed:',
      error
    );

    process.exit(1);
  }
}

/* ============================================================
   27. START
   ============================================================ */

startServer();

/* ============================================================
   28. EXPORTS
   ============================================================ */

module.exports = {
  app,
  server,
  startServer
};