"use strict";

/**
 * ============================================================
 * GHAR - REAL ESTATE PLATFORM
 * PRODUCTION EXPRESS SERVER
 *
 * OVERRIDE / FAULT-TOLERANT ROUTE LOADER
 * ============================================================
 */

require("dotenv").config();

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const http = require("http");

const express = require("express");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

/**
 * ============================================================
 * CONFIG
 * ============================================================
 */

let env = {};

try {
  env = require("./config/env");
} catch (error) {
  console.warn(
    "[GHAR] config/env.js could not be loaded:",
    error.message
  );
}

let corsMiddleware = null;

try {
  const cors = require("./config/cors");

  if (typeof cors.corsMiddleware === "function") {
    corsMiddleware = cors.corsMiddleware;
  }
} catch (error) {
  console.warn(
    "[GHAR] CORS configuration could not be loaded:",
    error.message
  );
}

/**
 * Optional configuration modules.
 */

function optionalRequire(file, label) {
  try {
    return require(file);
  } catch (error) {
    console.warn(
      `[GHAR] ${label} configuration unavailable:`,
      error.message
    );

    return null;
  }
}

const securityConfig = optionalRequire(
  "./config/security",
  "Security"
);

const storageConfig = optionalRequire(
  "./config/storage",
  "Storage"
);

const aiConfig = optionalRequire(
  "./config/ai",
  "AI"
);

const paymentConfig = optionalRequire(
  "./config/payments",
  "Payments"
);

const emailConfig = optionalRequire(
  "./config/email",
  "Email"
);

/**
 * ============================================================
 * APP
 * ============================================================
 */

const app = express();
const server = http.createServer(app);

/**
 * ============================================================
 * ENVIRONMENT
 * ============================================================
 */

const NODE_ENV =
  env.nodeEnv ||
  process.env.NODE_ENV ||
  "development";

const PORT =
  Number(process.env.PORT) ||
  Number(env.port) ||
  5000;

const HOST =
  process.env.HOST ||
  "0.0.0.0";

const APP_NAME =
  env.appName ||
  process.env.APP_NAME ||
  "GHAR";

const APP_VERSION =
  process.env.APP_VERSION ||
  "1.0.0";

const APP_URL =
  env.appUrl ||
  process.env.APP_URL ||
  `http://localhost:${PORT}`;

const API_PREFIX =
  env.apiPrefix ||
  process.env.API_PREFIX ||
  "/api";

const NORMALIZED_API_PREFIX =
  API_PREFIX === "/"
    ? ""
    : `/${String(API_PREFIX).replace(/^\/+|\/+$/g, "")}`;

/**
 * ============================================================
 * PATHS
 * ============================================================
 */

const ROOT_DIR = __dirname;

const PUBLIC_DIR = ROOT_DIR;

const CONFIG_DIR = path.join(
  ROOT_DIR,
  "config"
);

const ROUTES_DIR = path.join(
  ROOT_DIR,
  "routes"
);

const ASSETS_DIR = path.join(
  ROOT_DIR,
  "assets"
);

const UPLOADS_DIR = path.join(
  ROOT_DIR,
  "uploads"
);

const LOGS_DIR = path.join(
  ROOT_DIR,
  "logs"
);

const DATA_DIR = path.join(
  ROOT_DIR,
  "data"
);

/**
 * ============================================================
 * DIRECTORIES
 * ============================================================
 */

const UPLOAD_CATEGORIES = [
  "property-images",
  "property-videos",
  "floor-plans",
  "profile-images",
  "documents",
  "agreements",
  "verification"
];

function ensureDirectory(directory) {
  try {
    fs.mkdirSync(directory, {
      recursive: true
    });
  } catch (error) {
    console.error(
      `[GHAR] Could not create directory ${directory}:`,
      error.message
    );
  }
}

[
  ASSETS_DIR,
  UPLOADS_DIR,
  LOGS_DIR,
  DATA_DIR
].forEach(ensureDirectory);

UPLOAD_CATEGORIES.forEach((category) => {
  ensureDirectory(
    path.join(
      UPLOADS_DIR,
      category
    )
  );
});

/**
 * ============================================================
 * EXPRESS SETTINGS
 * ============================================================
 */

app.disable("x-powered-by");

app.set("name", APP_NAME);
app.set("version", APP_VERSION);
app.set("env", NODE_ENV);

/**
 * ============================================================
 * TRUST PROXY
 * ============================================================
 */

if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", true);
} else if (process.env.TRUST_PROXY === "false") {
  app.set("trust proxy", false);
} else if (
  process.env.TRUST_PROXY !== undefined &&
  Number.isFinite(
    Number(process.env.TRUST_PROXY)
  )
) {
  app.set(
    "trust proxy",
    Number(process.env.TRUST_PROXY)
  );
} else if (NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

/**
 * ============================================================
 * SECURITY
 * ============================================================
 */

if (
  securityConfig &&
  typeof securityConfig.securityMiddleware === "function"
) {
  app.use(
    securityConfig.securityMiddleware
  );
} else if (
  securityConfig &&
  typeof securityConfig.helmetMiddleware === "function"
) {
  app.use(
    securityConfig.helmetMiddleware
  );
}

/**
 * ============================================================
 * REQUEST ID
 * ============================================================
 */

app.use(
  (req, res, next) => {
    let requestId =
      req.headers["x-request-id"];

    if (
      typeof requestId !== "string" ||
      requestId.length > 128 ||
      !requestId.trim()
    ) {
      requestId = crypto.randomUUID();
    } else {
      requestId = requestId.trim();
    }

    req.requestId = requestId;

    res.setHeader(
      "X-Request-ID",
      requestId
    );

    next();
  }
);

/**
 * ============================================================
 * GHAR REQUEST CONTEXT
 * ============================================================
 */

app.use(
  (req, res, next) => {
    req.ghar = {
      requestId: req.requestId,
      appName: APP_NAME,
      version: APP_VERSION,
      environment: NODE_ENV
    };

    next();
  }
);

/**
 * ============================================================
 * CORS
 * ============================================================
 */

if (typeof corsMiddleware === "function") {
  app.use(corsMiddleware);
}

/**
 * ============================================================
 * COMPRESSION
 * ============================================================
 */

app.use(
  compression({
    threshold:
      Number(
        process.env.COMPRESSION_THRESHOLD
      ) || 1024
  })
);

/**
 * ============================================================
 * BODY PARSERS
 * ============================================================
 */

app.use(
  express.json({
    limit:
      process.env.JSON_LIMIT ||
      "10mb",

    strict: true
  })
);

app.use(
  express.urlencoded({
    extended: true,

    limit:
      process.env.URLENCODED_LIMIT ||
      "10mb"
  })
);

/**
 * ============================================================
 * COOKIES
 * ============================================================
 */

app.use(
  cookieParser(
    env.sessionSecret ||
      process.env.SESSION_SECRET ||
      undefined
  )
);

/**
 * ============================================================
 * LOGGING
 * ============================================================
 */

if (
  NODE_ENV !== "test" &&
  process.env.LOG_HTTP !== "false"
) {
  app.use(
    morgan(
      NODE_ENV === "production"
        ? "combined"
        : "dev"
    )
  );
}

/**
 * ============================================================
 * RATE LIMITING
 * ============================================================
 */

const rateLimitWindow =
  Number(
    env.security &&
      env.security.rateLimitWindow
  ) ||
  Number(
    process.env.RATE_LIMIT_WINDOW_MS
  ) ||
  15 * 60 * 1000;

const rateLimitMax =
  Number(
    env.security &&
      env.security.rateLimitMax
  ) ||
  Number(
    process.env.RATE_LIMIT_MAX
  ) ||
  300;

const globalRateLimiter =
  rateLimit({
    windowMs:
      rateLimitWindow,

    max:
      rateLimitMax,

    standardHeaders:
      "draft-7",

    legacyHeaders:
      false,

    skip: (req) => {
      return (
        req.path === "/health" ||
        req.path === "/ready" ||
        req.path ===
          `${NORMALIZED_API_PREFIX}/health`
      );
    },

    handler: (req, res) => {
      return res.status(429).json({
        success: false,

        error: {
          code:
            "RATE_LIMIT_EXCEEDED",

          message:
            "Too many requests. Please try again later."
        },

        requestId:
          req.requestId
      });
    }
  });

app.use(
  NORMALIZED_API_PREFIX || "/api",
  globalRateLimiter
);

/**
 * ============================================================
 * HEALTH STATE
 * ============================================================
 */

const healthState = {
  startedAt:
    new Date().toISOString(),

  database: {
    status:
      "not_initialized"
  },

  ai: {
    status:
      "unknown"
  },

  payments: {
    status:
      "unknown"
  },

  email: {
    status:
      "unknown"
  },

  storage: {
    status:
      "unknown"
  },

  routes: {
    mounted: [],
    skipped: []
  }
};

/**
 * ============================================================
 * DATABASE
 * ============================================================
 */

let database = null;

function loadDatabaseModule() {
  const databasePath =
    path.join(
      CONFIG_DIR,
      "database.js"
    );

  if (
    !fs.existsSync(
      databasePath
    )
  ) {
    return null;
  }

  try {
    return require(databasePath);
  } catch (error) {
    console.error(
      "[GHAR] Database module load failed:",
      error.message
    );

    return null;
  }
}

async function initializeDatabase() {
  try {
    database =
      loadDatabaseModule();

    if (!database) {
      healthState.database.status =
        "not_configured";

      if (
        NODE_ENV === "production" &&
        process.env.REQUIRE_DATABASE === "true"
      ) {
        throw new Error(
          "Database configuration is required."
        );
      }

      console.warn(
        "[GHAR] Database module not available. Server will continue."
      );

      return null;
    }

    if (
      typeof database.connectDatabase ===
      "function"
    ) {
      await database.connectDatabase();
    } else if (
      typeof database.connect ===
      "function"
    ) {
      await database.connect();
    } else if (
      typeof database.initialize ===
      "function"
    ) {
      await database.initialize();
    } else if (
      database.pool &&
      typeof database.pool.connect ===
      "function"
    ) {
      const client =
        await database.pool.connect();

      client.release();
    } else {
      throw new Error(
        "No supported database connection method found."
      );
    }

    healthState.database.status =
      "connected";

    console.log(
      "[GHAR] Database connected."
    );

    return database;
  } catch (error) {
    healthState.database.status =
      "error";

    console.error(
      "[GHAR] Database initialization failed:",
      error.message
    );

    if (
      NODE_ENV === "production" &&
      process.env.REQUIRE_DATABASE === "true"
    ) {
      throw error;
    }

    return null;
  }
}

/**
 * ============================================================
 * DATABASE HEALTH
 * ============================================================
 */

async function checkDatabaseHealth() {
  if (!database) {
    return {
      status:
        healthState.database.status
    };
  }

  try {
    if (
      typeof database.healthCheck ===
      "function"
    ) {
      const result =
        await database.healthCheck();

      return {
        status:
          "connected",

        ...(result &&
        typeof result === "object"
          ? result
          : {})
      };
    }

    if (
      database.pool &&
      typeof database.pool.query ===
      "function"
    ) {
      await database.pool.query(
        "SELECT 1"
      );

      return {
        status:
          "connected"
      };
    }

    if (
      typeof database.query ===
      "function"
    ) {
      await database.query(
        "SELECT 1"
      );

      return {
        status:
          "connected"
      };
    }

    return {
      status:
        "unknown"
    };
  } catch (error) {
    return {
      status:
        "error",

      ...(NODE_ENV !== "production"
        ? {
            message:
              error.message
          }
        : {})
    };
  }
}

/**
 * ============================================================
 * SERVICE STATUS
 * ============================================================
 */

function getAIStatus() {
  try {
    if (
      aiConfig &&
      typeof aiConfig.validateAIConfig ===
      "function"
    ) {
      const result =
        aiConfig.validateAIConfig();

      return {
        status:
          result.enabled
            ? "configured"
            : "not_configured",

        provider:
          result.provider,

        model:
          result.model
      };
    }

    if (
      aiConfig &&
      aiConfig.aiConfig
    ) {
      return {
        status:
          aiConfig.aiConfig.enabled
            ? "configured"
            : "not_configured"
      };
    }

    return {
      status:
        "unknown"
    };
  } catch {
    return {
      status:
        "error"
    };
  }
}

function getPaymentStatus() {
  try {
    if (
      paymentConfig &&
      typeof paymentConfig.isPaymentsEnabled ===
      "function"
    ) {
      return {
        status:
          paymentConfig.isPaymentsEnabled()
            ? "configured"
            : "not_configured"
      };
    }

    if (
      paymentConfig &&
      paymentConfig.paymentsConfig
    ) {
      return {
        status:
          paymentConfig.paymentsConfig.enabled
            ? "configured"
            : "not_configured"
      };
    }

    return {
      status:
        "unknown"
    };
  } catch {
    return {
      status:
        "error"
    };
  }
}

function getEmailStatus() {
  try {
    if (
      emailConfig &&
      typeof emailConfig.isEmailEnabled ===
      "function"
    ) {
      return {
        status:
          emailConfig.isEmailEnabled()
            ? "configured"
            : "not_configured"
      };
    }

    if (
      emailConfig &&
      emailConfig.emailConfig
    ) {
      return {
        status:
          emailConfig.emailConfig.enabled
            ? "configured"
            : "not_configured"
      };
    }

    return {
      status:
        "unknown"
    };
  } catch {
    return {
      status:
        "error"
    };
  }
}

function getStorageStatus() {
  try {
    if (
      storageConfig &&
      storageConfig.storageConfig
    ) {
      return {
        status:
          storageConfig.storageConfig.provider
            ? "configured"
            : "not_configured",

        provider:
          storageConfig.storageConfig.provider
      };
    }

    return {
      status:
        "unknown"
    };
  } catch {
    return {
      status:
        "error"
    };
  }
}

/**
 * ============================================================
 * HEALTH
 * ============================================================
 */

app.get(
  "/health",
  async (req, res) => {
    const memory =
      process.memoryUsage();

    const db =
      await checkDatabaseHealth();

    const ai =
      getAIStatus();

    const payments =
      getPaymentStatus();

    const email =
      getEmailStatus();

    const storage =
      getStorageStatus();

    healthState.database =
      db;

    healthState.ai =
      ai;

    healthState.payments =
      payments;

    healthState.email =
      email;

    healthState.storage =
      storage;

    return res.status(200).json({
      success: true,

      service:
        APP_NAME,

      version:
        APP_VERSION,

      environment:
        NODE_ENV,

      status:
        "healthy",

      timestamp:
        new Date().toISOString(),

      uptime:
        Math.floor(
          process.uptime()
        ),

      startedAt:
        healthState.startedAt,

      memory: {
        rss:
          memory.rss,

        heapUsed:
          memory.heapUsed,

        heapTotal:
          memory.heapTotal,

        external:
          memory.external
      },

      services: {
        database:
          db.status,

        ai:
          ai.status,

        payments:
          payments.status,

        email:
          email.status,

        storage:
          storage.status
      },

      routes: {
        mounted:
          healthState.routes.mounted,

        skipped:
          healthState.routes.skipped
      },

      requestId:
        req.requestId
    });
  }
);

/**
 * ============================================================
 * API HEALTH
 * ============================================================
 */

app.get(
  `${NORMALIZED_API_PREFIX}/health`,
  async (req, res) => {
    const db =
      await checkDatabaseHealth();

    const healthy =
      db.status === "connected" ||
      NODE_ENV !== "production";

    return res.status(
      healthy
        ? 200
        : 503
    ).json({
      success:
        healthy,

      service:
        `${APP_NAME} API`,

      version:
        APP_VERSION,

      status:
        healthy
          ? "healthy"
          : "unhealthy",

      database:
        db,

      timestamp:
        new Date().toISOString(),

      uptime:
        Math.floor(
          process.uptime()
        ),

      requestId:
        req.requestId
    });
  }
);

/**
 * ============================================================
 * READINESS
 * ============================================================
 */

app.get(
  "/ready",
  async (req, res) => {
    const db =
      await checkDatabaseHealth();

    const ready =
      db.status === "connected" ||
      (
        NODE_ENV !== "production" &&
        db.status !== "error"
      );

    return res.status(
      ready
        ? 200
        : 503
    ).json({
      success:
        ready,

      ready,

      service:
        APP_NAME,

      database:
        db.status,

      timestamp:
        new Date().toISOString(),

      requestId:
        req.requestId
    });
  }
);

/**
 * ============================================================
 * API INFORMATION
 * ============================================================
 */

app.get(
  NORMALIZED_API_PREFIX || "/api",
  (req, res) => {
    return res.json({
      success: true,

      name:
        `${APP_NAME} API`,

      version:
        APP_VERSION,

      environment:
        NODE_ENV,

      apiPrefix:
        NORMALIZED_API_PREFIX,

      routes: {
        mounted:
          healthState.routes.mounted,

        skipped:
          healthState.routes.skipped
      }
    });
  }
);

/**
 * ============================================================
 * SAFE ROUTE LOADER
 *
 * IMPORTANT:
 *
 * A broken route MUST NOT crash the entire GHAR server.
 *
 * If a route has:
 *
 * router.get("/", {})
 *
 * Express will throw:
 *
 * Route.get() requires a callback function
 *
 * This loader catches that error and continues.
 * ============================================================
 */

function mountRoute(
  routeFile,
  basePath
) {
  const routePath =
    path.join(
      ROUTES_DIR,
      routeFile
    );

  if (
    !fs.existsSync(routePath)
  ) {
    console.warn(
      `[GHAR OVERRIDE] SKIPPED missing route: ${routeFile}`
    );

    healthState.routes.skipped.push({
      file:
        routeFile,

      path:
        basePath,

      reason:
        "FILE_NOT_FOUND"
    });

    return false;
  }

  try {
    if (
      NODE_ENV !== "production"
    ) {
      delete require.cache[
        require.resolve(routePath)
      ];
    }

    const exported =
      require(routePath);

    /**
     * --------------------------------------------------------
     * Handle:
     *
     * module.exports = router
     * --------------------------------------------------------
     */

    let router =
      exported;

    /**
     * --------------------------------------------------------
     * Handle:
     *
     * module.exports = { router }
     *
     * --------------------------------------------------------
     */

    if (
      router &&
      typeof router === "object" &&
      typeof router.router === "function"
    ) {
      router =
        router.router;
    }

    /**
     * --------------------------------------------------------
     * Handle:
     *
     * module.exports.default = router
     * --------------------------------------------------------
     */

    if (
      router &&
      typeof router === "object" &&
      typeof router.default === "function"
    ) {
      router =
        router.default;
    }

    /**
     * --------------------------------------------------------
     * Validate
     * --------------------------------------------------------
     */

    if (
      typeof router !== "function"
    ) {
      throw new TypeError(
        `Invalid Express Router export. Received ${typeof router}.`
      );
    }

    /**
     * --------------------------------------------------------
     * Mount
     * --------------------------------------------------------
     */

    app.use(
      basePath,
      router
    );

    console.log(
      `[GHAR] Mounted ${basePath} -> ${routeFile}`
    );

    healthState.routes.mounted.push({
      file:
        routeFile,

      path:
        basePath
    });

    return true;

  } catch (error) {
    /**
     * ========================================================
     * OVERRIDE BEHAVIOUR
     * ========================================================
     *
     * NEVER throw here.
     *
     * The server continues even if this route is broken.
     * ========================================================
     */

    console.error(
      `[GHAR OVERRIDE] Route disabled: ${routeFile}`
    );

    console.error(
      `[GHAR OVERRIDE] Path: ${basePath}`
    );

    console.error(
      `[GHAR OVERRIDE] Reason: ${error.message}`
    );

    healthState.routes.skipped.push({
      file:
        routeFile,

      path:
        basePath,

      reason:
        "ROUTE_LOAD_ERROR",

      message:
        error.message
    });

    /**
     * Create a safe endpoint instead of killing server.
     */

    app.use(
      basePath,
      (req, res) => {
        return res.status(503).json({
          success: false,

          error: {
            code:
              "ROUTE_TEMPORARILY_UNAVAILABLE",

            message:
              "This GHAR API module is temporarily unavailable."
          },

          route:
            basePath,

          requestId:
            req.requestId
        });
      }
    );

    return false;
  }
}

/**
 * ============================================================
 * ROUTES
 * ============================================================
 */

const ROUTES = [
  [
    "auth.routes.js",
    "/auth"
  ],

  [
    "user.routes.js",
    "/users"
  ],

  [
    "property.routes.js",
    "/properties"
  ],

  [
    "search.routes.js",
    "/search"
  ],

  [
    "visit.routes.js",
    "/visits"
  ],

  [
    "offer.routes.js",
    "/offers"
  ],

  [
    "application.routes.js",
    "/applications"
  ],

  [
    "document.routes.js",
    "/documents"
  ],

  [
    "verification.routes.js",
    "/verification"
  ],

  [
    "payment.routes.js",
    "/payments"
  ],

  [
    "subscription.routes.js",
    "/subscriptions"
  ],

  [
    "loan.routes.js",
    "/loans"
  ],

  [
    "referral.routes.js",
    "/referrals"
  ],

  [
    "notification.routes.js",
    "/notifications"
  ],

  [
    "message.routes.js",
    "/messages"
  ],

  [
    "support.routes.js",
    "/support"
  ],

  [
    "ai.routes.js",
    "/ai"
  ],

  [
    "admin.routes.js",
    "/admin"
  ],

  [
    "admin-ai.routes.js",
    "/admin/ai"
  ]
];

/**
 * ============================================================
 * MOUNT ROUTES
 * ============================================================
 */

for (
  const [
    file,
    routePath
  ] of ROUTES
) {
  mountRoute(
    file,
    `${NORMALIZED_API_PREFIX}${routePath}`
  );
}

/**
 * ============================================================
 * STATIC ASSETS
 * ============================================================
 */

app.use(
  "/assets",
  express.static(
    ASSETS_DIR,
    {
      index: false,

      dotfiles:
        "ignore",

      maxAge:
        NODE_ENV === "production"
          ? "7d"
          : 0,

      immutable:
        NODE_ENV === "production"
    }
  )
);

/**
 * ============================================================
 * PROPERTY MEDIA
 * ============================================================
 */

const PROPERTY_IMAGES_DIR =
  path.join(
    UPLOADS_DIR,
    "property-images"
  );

app.use(
  "/media/properties",
  express.static(
    PROPERTY_IMAGES_DIR,
    {
      index: false,

      dotfiles:
        "deny",

      maxAge:
        NODE_ENV === "production"
          ? "7d"
          : 0
    }
  )
);

/**
 * ============================================================
 * PROPERTY VIDEOS
 * ============================================================
 */

if (
  process.env.PUBLIC_PROPERTY_VIDEOS ===
  "true"
) {
  app.use(
    "/media/property-videos",
    express.static(
      path.join(
        UPLOADS_DIR,
        "property-videos"
      ),
      {
        index: false,

        dotfiles:
          "deny",

        maxAge:
          NODE_ENV === "production"
            ? "7d"
            : 0
      }
    )
  );
}

/**
 * ============================================================
 * ROOT HOMEPAGE
 * ============================================================
 */

app.get(
  "/",
  (req, res) => {
    const indexPath =
      path.join(
        ROOT_DIR,
        "index.html"
      );

    if (
      fs.existsSync(indexPath)
    ) {
      return res.sendFile(
        indexPath
      );
    }

    return res.status(404).send(
      "GHAR index.html not found."
    );
  }
);

/**
 * ============================================================
 * FRONTEND STATIC FILES
 * ============================================================
 */

app.use(
  express.static(
    PUBLIC_DIR,
    {
      index:
        "index.html",

      dotfiles:
        "ignore",

      extensions:
        [
          "html"
        ],

      maxAge:
        NODE_ENV === "production"
          ? "1d"
          : 0
    }
  )
);

/**
 * ============================================================
 * API 404
 * ============================================================
 */

app.use(
  `${NORMALIZED_API_PREFIX}/`,
  (req, res) => {
    return res.status(404).json({
      success: false,

      error: {
        code:
          "API_ROUTE_NOT_FOUND",

        message:
          `API route not found: ${req.method} ${req.originalUrl}`
      },

      requestId:
        req.requestId
    });
  }
);

/**
 * ============================================================
 * FRONTEND 404
 * ============================================================
 */

app.use(
  (req, res) => {
    const notFoundPage =
      path.join(
        ROOT_DIR,
        "404.html"
      );

    if (
      fs.existsSync(
        notFoundPage
      )
    ) {
      return res
        .status(404)
        .sendFile(
          notFoundPage
        );
    }

    return res
      .status(404)
      .type("html")
      .send(`
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>404 - GHAR</title>
</head>
<body>
<main>
<h1>404</h1>
<p>The requested GHAR page could not be found.</p>
</main>
</body>
</html>
`);
  }
);

/**
 * ============================================================
 * GLOBAL ERROR HANDLER
 * ============================================================
 */

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    void next;

    const requestId =
      req.requestId;

    const statusCode =
      Number(err.statusCode) ||
      Number(err.status) ||
      500;

    const status =
      statusCode >= 400 &&
      statusCode <= 599
        ? statusCode
        : 500;

    console.error(
      "[GHAR ERROR]",
      {
        requestId,
        method:
          req.method,
        url:
          req.originalUrl,
        status,
        code:
          err.code,
        message:
          err.message
      }
    );

    if (
      err.code ===
        "CORS_ORIGIN_NOT_ALLOWED" ||
      err.message ===
        "CORS origin not allowed"
    ) {
      return res.status(403).json({
        success: false,

        error: {
          code:
            "CORS_ERROR",

          message:
            "Request origin is not allowed."
        },

        requestId
      });
    }

    if (
      err instanceof SyntaxError &&
      err.status === 400 &&
      err.type ===
        "entity.parse.failed"
    ) {
      return res.status(400).json({
        success: false,

        error: {
          code:
            "INVALID_JSON",

          message:
            "Request contains invalid JSON."
        },

        requestId
      });
    }

    if (
      err.type ===
      "entity.too.large"
    ) {
      return res.status(413).json({
        success: false,

        error: {
          code:
            "PAYLOAD_TOO_LARGE",

          message:
            "Request payload is too large."
        },

        requestId
      });
    }

    if (
      status === 429
    ) {
      return res.status(429).json({
        success: false,

        error: {
          code:
            "RATE_LIMIT_EXCEEDED",

          message:
            "Too many requests. Please try again later."
        },

        requestId
      });
    }

    return res.status(status).json({
      success: false,

      error: {
        code:
          err.code ||
          "INTERNAL_SERVER_ERROR",

        message:
          NODE_ENV !== "production" ||
          status < 500
            ? (
                err.message ||
                "Request failed."
              )
            : "Internal server error."
      },

      requestId
    });
  }
);

/**
 * ============================================================
 * DATABASE SHUTDOWN
 * ============================================================
 */

async function closeDatabase() {
  if (!database) {
    return;
  }

  try {
    if (
      typeof database.closeDatabase ===
      "function"
    ) {
      await database.closeDatabase();
      return;
    }

    if (
      typeof database.disconnect ===
      "function"
    ) {
      await database.disconnect();
      return;
    }

    if (
      typeof database.close ===
      "function"
    ) {
      await database.close();
      return;
    }

    if (
      database.pool &&
      typeof database.pool.end ===
      "function"
    ) {
      await database.pool.end();
    }
  } catch (error) {
    console.error(
      "[GHAR] Database shutdown error:",
      error.message
    );
  }
}

/**
 * ============================================================
 * GRACEFUL SHUTDOWN
 * ============================================================
 */

let shuttingDown = false;

async function gracefulShutdown(
  signal,
  exitCode = 0
) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(
    `[GHAR] ${signal} received.`
  );

  const timeout =
    Number(
      process.env.SHUTDOWN_TIMEOUT_MS
    ) ||
    10000;

  const forceTimer =
    setTimeout(
      () => {
        console.error(
          "[GHAR] Shutdown timeout."
        );

        process.exit(1);
      },
      timeout
    );

  forceTimer.unref();

  try {
    await new Promise(
      (resolve) => {
        if (!server.listening) {
          resolve();
          return;
        }

        server.close(
          () => {
            console.log(
              "[GHAR] HTTP server closed."
            );

            resolve();
          }
        );
      }
    );

    await closeDatabase();

    clearTimeout(
      forceTimer
    );

    console.log(
      "[GHAR] Shutdown complete."
    );

    process.exit(exitCode);

  } catch (error) {
    console.error(
      "[GHAR] Shutdown failed:",
      error.message
    );

    clearTimeout(
      forceTimer
    );

    process.exit(1);
  }
}

/**
 * ============================================================
 * PROCESS ERRORS
 * ============================================================
 */

process.on(
  "unhandledRejection",
  (reason) => {
    console.error(
      "[GHAR] UNHANDLED REJECTION:",
      reason
    );

    if (
      NODE_ENV === "production"
    ) {
      void gracefulShutdown(
        "UNHANDLED_REJECTION",
        1
      );
    }
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "[GHAR] UNCAUGHT EXCEPTION:",
      error
    );

    void gracefulShutdown(
      "UNCAUGHT_EXCEPTION",
      1
    );
  }
);

/**
 * ============================================================
 * SIGNALS
 * ============================================================
 */

process.on(
  "SIGTERM",
  () => {
    void gracefulShutdown(
      "SIGTERM",
      0
    );
  }
);

process.on(
  "SIGINT",
  () => {
    void gracefulShutdown(
      "SIGINT",
      0
    );
  }
);

/**
 * ============================================================
 * START SERVER
 * ============================================================
 */

async function startServer() {
  try {
    /**
     * Validate production environment if available.
     *
     * IMPORTANT:
     * Validation errors do not automatically kill the server
     * unless REQUIRE_ENV_VALIDATION=true.
     */

    if (
      typeof env.validateProductionEnvironment ===
      "function"
    ) {
      try {
        env.validateProductionEnvironment();
      } catch (error) {
        console.error(
          "[GHAR] Environment validation warning:",
          error.message
        );

        if (
          process.env.REQUIRE_ENV_VALIDATION ===
          "true"
        ) {
          throw error;
        }
      }
    }

    /**
     * Initialize database.
     */

    await initializeDatabase();

    /**
     * Start HTTP server.
     */

    await new Promise(
      (resolve, reject) => {
        const onError =
          (error) => {
            server.removeListener(
              "listening",
              onListening
            );

            reject(error);
          };

        const onListening =
          () => {
            server.removeListener(
              "error",
              onError
            );

            resolve();
          };

        server.once(
          "error",
          onError
        );

        server.once(
          "listening",
          onListening
        );

        server.listen(
          PORT,
          HOST
        );
      }
    );

    /**
     * ========================================================
     * SERVER INFORMATION
     * ========================================================
     */

    console.log("");
    console.log(
      "============================================================"
    );

    console.log(
      `                    ${APP_NAME} SERVER`
    );

    console.log(
      "============================================================"
    );

    console.log(
      `Environment : ${NODE_ENV}`
    );

    console.log(
      `Version     : ${APP_VERSION}`
    );

    console.log(
      `Host        : ${HOST}`
    );

    console.log(
      `Port        : ${PORT}`
    );

    console.log(
      `Application : ${APP_URL}`
    );

    console.log(
      `API         : ${NORMALIZED_API_PREFIX || "/"}`
    );

    console.log(
      "------------------------------------------------------------"
    );

    console.log(
      "Homepage    : /"
    );

    console.log(
      "Health      : /health"
    );

    console.log(
      "Readiness   : /ready"
    );

    console.log(
      `API Health  : ${NORMALIZED_API_PREFIX}/health`
    );

    console.log(
      `AI API      : ${NORMALIZED_API_PREFIX}/ai`
    );

    console.log(
      `Payments    : ${NORMALIZED_API_PREFIX}/payments`
    );

    console.log(
      `Support     : ${NORMALIZED_API_PREFIX}/support`
    );

    console.log(
      `Admin       : ${NORMALIZED_API_PREFIX}/admin`
    );

    console.log(
      "------------------------------------------------------------"
    );

    console.log(
      `Database    : ${healthState.database.status}`
    );

    console.log(
      `AI          : ${getAIStatus().status}`
    );

    console.log(
      `Payments    : ${getPaymentStatus().status}`
    );

    console.log(
      `Email       : ${getEmailStatus().status}`
    );

    console.log(
      `Storage     : ${getStorageStatus().status}`
    );

    console.log(
      "------------------------------------------------------------"
    );

    console.log(
      `Routes mounted : ${healthState.routes.mounted.length}`
    );

    console.log(
      `Routes skipped : ${healthState.routes.skipped.length}`
    );

    if (
      healthState.routes.skipped.length
    ) {
      console.warn(
        "[GHAR OVERRIDE] Some routes were disabled but the server is running."
      );

      healthState.routes.skipped.forEach(
        (route) => {
          console.warn(
            `[GHAR OVERRIDE] ${route.path} -> ${route.message || route.reason}`
          );
        }
      );
    }

    console.log(
      "============================================================"
    );

    console.log("");
  } catch (error) {
    console.error(
      "[GHAR] Server startup failed:",
      error
    );

    await closeDatabase();

    process.exit(1);
  }
}

/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  app,

  server,

  startServer,

  gracefulShutdown,

  initializeDatabase,

  checkDatabaseHealth,

  healthState
};

/**
 * ============================================================
 * DIRECT EXECUTION
 * ============================================================
 */

if (
  require.main ===
  module
) {
  void startServer();
}