"use strict";

/**
 * ============================================================
 * GHAR - REAL ESTATE PLATFORM
 * ============================================================
 * Production Express bootstrap
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
 * CONFIGURATION
 * ============================================================
 */

const env = require("./config/env");

const { corsMiddleware } = require("./config/cors");

/**
 * Optional configuration modules.
 */

let securityConfig = null;
let storageConfig = null;
let aiConfig = null;
let paymentConfig = null;
let emailConfig = null;

function optionalRequire(file, label) {
  try {
    return require(file);
  } catch (error) {
    console.warn(
      `[GHAR] ${label} configuration could not be loaded:`,
      error.message
    );
    return null;
  }
}

securityConfig = optionalRequire(
  "./config/security",
  "Security"
);

storageConfig = optionalRequire(
  "./config/storage",
  "Storage"
);

aiConfig = optionalRequire(
  "./config/ai",
  "AI"
);

paymentConfig = optionalRequire(
  "./config/payments",
  "Payment"
);

emailConfig = optionalRequire(
  "./config/email",
  "Email"
);

/**
 * ============================================================
 * APPLICATION
 * ============================================================
 */

const app = express();
const server = http.createServer(app);

/**
 * ============================================================
 * APPLICATION SETTINGS
 * ============================================================
 */

const NODE_ENV =
  env.nodeEnv ||
  process.env.NODE_ENV ||
  "development";

const PORT =
  Number(env.port) ||
  Number(process.env.PORT) ||
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
    : `/${API_PREFIX.replace(/^\/+|\/+$/g, "")}`;

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
 * UPLOAD CATEGORIES
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

/**
 * ============================================================
 * DIRECTORY INITIALIZATION
 * ============================================================
 */

function ensureDirectory(directory) {
  fs.mkdirSync(directory, {
    recursive: true
  });
}

function ensureDirectories() {
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
}

ensureDirectories();

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

const configuredTrustProxy =
  process.env.TRUST_PROXY;

if (
  configuredTrustProxy === "true"
) {
  app.set("trust proxy", true);
} else if (
  configuredTrustProxy === "false"
) {
  app.set("trust proxy", false);
} else if (
  configuredTrustProxy !== undefined &&
  Number.isFinite(
    Number(configuredTrustProxy)
  )
) {
  app.set(
    "trust proxy",
    Number(configuredTrustProxy)
  );
} else if (
  NODE_ENV === "production"
) {
  /**
   * Render sits behind a reverse proxy.
   */
  app.set("trust proxy", 1);
}

/**
 * ============================================================
 * SECURITY
 * ============================================================
 */

if (
  securityConfig &&
  typeof securityConfig.securityMiddleware ===
    "function"
) {
  app.use(
    securityConfig.securityMiddleware
  );
} else if (
  securityConfig &&
  typeof securityConfig.helmetMiddleware ===
    "function"
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
      requestId =
        crypto.randomUUID();
    } else {
      requestId =
        requestId.trim();
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
      requestId:
        req.requestId,

      appName:
        APP_NAME,

      version:
        APP_VERSION,

      environment:
        NODE_ENV
    };

    next();
  }
);

/**
 * ============================================================
 * CORS
 * ============================================================
 */

if (
  typeof corsMiddleware ===
  "function"
) {
  app.use(corsMiddleware);
} else {
  console.warn(
    "[GHAR] corsMiddleware is not available."
  );
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

  return require(
    databasePath
  );
}

async function initializeDatabase() {
  try {
    database =
      loadDatabaseModule();

    if (!database) {
      healthState.database.status =
        "not_configured";

      if (
        NODE_ENV === "production"
      ) {
        throw new Error(
          "GHAR database configuration is required in production."
        );
      }

      console.warn(
        "[GHAR] Database module not found."
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
        "Database module loaded but no supported connection method was found. Export connectDatabase(), connect(), initialize(), or pool."
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
      error
    );

    throw error;
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
        "error",

      message:
        "No database health-check method is available."
    };
  } catch (error) {
    return {
      status:
        "error",

      ...(NODE_ENV !==
      "production"
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
          result.provider ||
          undefined,

        model:
          result.model ||
          undefined
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
          paymentConfig
            .paymentsConfig
            .enabled
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
          emailConfig
            .emailConfig
            .enabled
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
          storageConfig
            .storageConfig
            .provider
            ? "configured"
            : "not_configured",

        provider:
          storageConfig
            .storageConfig
            .provider
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

    return res
      .status(
        healthy
          ? 200
          : 503
      )
      .json({
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

    return res
      .status(
        ready
          ? 200
          : 503
      )
      .json({
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

      endpoints: {
        health:
          `${NORMALIZED_API_PREFIX}/health`,

        auth:
          `${NORMALIZED_API_PREFIX}/auth`,

        users:
          `${NORMALIZED_API_PREFIX}/users`,

        properties:
          `${NORMALIZED_API_PREFIX}/properties`,

        search:
          `${NORMALIZED_API_PREFIX}/search`,

        visits:
          `${NORMALIZED_API_PREFIX}/visits`,

        offers:
          `${NORMALIZED_API_PREFIX}/offers`,

        applications:
          `${NORMALIZED_API_PREFIX}/applications`,

        documents:
          `${NORMALIZED_API_PREFIX}/documents`,

        verification:
          `${NORMALIZED_API_PREFIX}/verification`,

        payments:
          `${NORMALIZED_API_PREFIX}/payments`,

        subscriptions:
          `${NORMALIZED_API_PREFIX}/subscriptions`,

        loans:
          `${NORMALIZED_API_PREFIX}/loans`,

        referrals:
          `${NORMALIZED_API_PREFIX}/referrals`,

        notifications:
          `${NORMALIZED_API_PREFIX}/notifications`,

        messages:
          `${NORMALIZED_API_PREFIX}/messages`,

        support:
          `${NORMALIZED_API_PREFIX}/support`,

        ai:
          `${NORMALIZED_API_PREFIX}/ai`,

        admin:
          `${NORMALIZED_API_PREFIX}/admin`,

        adminAI:
          `${NORMALIZED_API_PREFIX}/admin/ai`
      }
    });
  }
);

/**
*
============================================================
 * ROUTE LOADER
 * ============================================================
 *
 * Every route module MUST export:
 *
 * module.exports = router;
 *
 * where router is created with:
 *
 * const router = require("express").Router();
 *
 * Authentication middleware MUST be imported as a function:
 *
 * const { requireAuth } =
 *   require("../middleware/auth.middleware");
 *
 * Do NOT do:
 *
 * const auth =
 *   require("../middleware/auth.middleware");
 *
 * because that returns the entire middleware export object.
 * ============================================================
 */

function mountRoute(
  routeFile,
  basePath,
  options = {}
) {
  const {
    required = true
  } = options;

  const routePath = path.join(
    ROUTES_DIR,
    routeFile
  );

  /**
   * ----------------------------------------------------------
   * Check route file
   * ----------------------------------------------------------
   */

  if (!fs.existsSync(routePath)) {
    const message =
      `[GHAR] Route file not found: ${routePath}`;

    if (required) {
      throw new Error(message);
    }

    console.warn(
      `${message} - skipped`
    );

    return false;
  }

  /**
   * ----------------------------------------------------------
   * Load route
   * ----------------------------------------------------------
   */

  try {
    /**
     * Clear the require cache in development.
     *
     * This does not affect production startup but makes local
     * debugging easier when routes are edited repeatedly.
     */
    if (NODE_ENV !== "production") {
      delete require.cache[
        require.resolve(routePath)
      ];
    }

    const router = require(routePath);

    /**
     * --------------------------------------------------------
     * Validate Express Router
     * --------------------------------------------------------
     *
     * Express routers are functions.
     *
     * If typeof router is "object", the route file is exporting
     * the wrong thing.
     */

    if (typeof router !== "function") {
      const exportedType =
        router === null
          ? "null"
          : typeof router;

      throw new TypeError(
        [
          `[GHAR] Invalid route export in ${routeFile}.`,
          `Expected an Express Router function but received ${exportedType}.`,
          ``,
          `Correct ending:`,
          `module.exports = router;`
        ].join("\n")
      );
    }

    /**
     * --------------------------------------------------------
     * Mount route
     * --------------------------------------------------------
     */

    app.use(
      basePath,
      router
    );

    console.log(
      `[GHAR] Mounted ${basePath} -> ${routeFile}`
    );

    return true;

  } catch (error) {
    console.error(
      `[GHAR] Failed to mount ${routeFile}`
    );

    console.error(
      `[GHAR] Route path: ${routePath}`
    );

    console.error(
      `[GHAR] API path: ${basePath}`
    );

    console.error(
      error
    );

    if (required) {
      throw error;
    }

    return false;
  }
}

/**
 * ============================================================
 * ROUTES
 * ============================================================
 *
 * IMPORTANT:
 *
 * The filenames here MUST exactly match the files inside:
 *
 * /routes/
 *
 * ============================================================
 */

const ROUTES = [
  {
    file: "auth.routes.js",
    path: "/auth"
  },

  {
    file: "user.routes.js",
    path: "/users"
  },

  {
    file: "property.routes.js",
    path: "/properties"
  },

  {
    file: "search.routes.js",
    path: "/search"
  },

  {
    file: "visit.routes.js",
    path: "/visits"
  },

  {
    file: "offer.routes.js",
    path: "/offers"
  },

  {
    file: "application.routes.js",
    path: "/applications"
  },

  {
    file: "document.routes.js",
    path: "/documents"
  },

  {
    file: "verification.routes.js",
    path: "/verification"
  },

  {
    file: "payment.routes.js",
    path: "/payments"
  },

  {
    file: "subscription.routes.js",
    path: "/subscriptions"
  },

  {
    file: "loan.routes.js",
    path: "/loans"
  },

  {
    file: "referral.routes.js",
    path: "/referrals"
  },

  {
    file: "notification.routes.js",
    path: "/notifications"
  },

  {
    file: "message.routes.js",
    path: "/messages"
  },

  {
    file: "support.routes.js",
    path: "/support"
  },

  {
    file: "ai.routes.js",
    path: "/ai"
  },

  {
    file: "admin.routes.js",
    path: "/admin"
  },

  {
    file: "admin-ai.routes.js",
    path: "/admin/ai"
  }
];

/**
 * ============================================================
 * MOUNT ALL ROUTES
 * ============================================================
 */

for (const route of ROUTES) {
  mountRoute(
    route.file,
    `${NORMALIZED_API_PREFIX}${route.path}`,
    {
      required: true
    }
  );
}
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

      dotfiles: "ignore",

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
 * PUBLIC PROPERTY IMAGES
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

      dotfiles: "deny",

      fallthrough: false,

      maxAge:
        NODE_ENV === "production"
          ? "7d"
          : 0
    }
  )
);

/**
 * ============================================================
 * OPTIONAL PUBLIC PROPERTY VIDEOS
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

        dotfiles: "deny",

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
 *
 * IMPORTANT:
 *
 * "/" ALWAYS serves index.html.
 *
 * There is NO seller redirect here.
 * ============================================================
 */

app.get(
  "/",
  (req, res) => {
    return res.sendFile(
      path.join(
        ROOT_DIR,
        "index.html"
      )
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
      index: "index.html",

      dotfiles: "ignore",

      extensions: [
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
    return res
      .status(404)
      .json({
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
  <meta
    name="viewport"
    content="width=device-width,initial-scale=1"
  >
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
      Number(
        err.statusCode
      ) ||
      Number(
        err.status
      ) ||
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
          err.message,

        stack:
          NODE_ENV !==
          "production"
            ? err.stack
            : undefined
      }
    );

    if (
      err.code ===
        "CORS_ORIGIN_NOT_ALLOWED" ||
      err.message ===
        "CORS origin not allowed"
    ) {
      return res
        .status(403)
        .json({
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
      err instanceof
        SyntaxError &&
      err.status === 400 &&
      err.type ===
        "entity.parse.failed"
    ) {
      return res
        .status(400)
        .json({
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
      return res
        .status(413)
        .json({
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
      return res
        .status(429)
        .json({
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

    const exposeMessage =
      NODE_ENV !== "production" ||
      status < 500;

    return res
      .status(status)
      .json({
        success: false,

        error: {
          code:
            err.code ||
            "INTERNAL_SERVER_ERROR",

          message:
            exposeMessage
              ? (
                  err.message ||
                  "Request failed."
                )
              : "Internal server error."
        },

        requestId,

        ...(NODE_ENV !==
        "production"
          ? {
              stack:
                err.stack
            }
          : {})
      });
  }
);

/**
 * ============================================================
 * SHUTDOWN
 * ============================================================
 */

let shuttingDown = false;

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
      error
    );
  }
}

async function gracefulShutdown(
  signal,
  exitCode = 0
) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(
    `[GHAR] ${signal} received. Starting graceful shutdown...`
  );

  const shutdownTimeout =
    Number(
      process.env.SHUTDOWN_TIMEOUT_MS
    ) ||
    10_000;

  const forceShutdown =
    setTimeout(
      () => {
        console.error(
          "[GHAR] Graceful shutdown timeout exceeded."
        );

        process.exit(1);
      },
      shutdownTimeout
    );

  forceShutdown.unref();

  try {
    await new Promise(
      (resolve) => {
        if (
          !server.listening
        ) {
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
      forceShutdown
    );

    console.log(
      "[GHAR] Shutdown complete."
    );

    process.exit(exitCode);
  } catch (error) {
    console.error(
      "[GHAR] Shutdown failed:",
      error
    );

    clearTimeout(
      forceShutdown
    );

    process.exit(1);
  }
}

/**
 * ============================================================
 * PROCESS ERROR HANDLERS
 * ============================================================
 */

process.on(
  "unhandledRejection",
  (reason) => {
    console.error(
      "[GHAR] UNHANDLED REJECTION",
      reason
    );

    if (
      NODE_ENV ===
      "production"
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
      "[GHAR] UNCAUGHT EXCEPTION",
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
     * Validate environment.
     */
    if (
      typeof env.validateProductionEnvironment ===
      "function"
    ) {
      env.validateProductionEnvironment();
    }

    /**
     * Database must initialize before traffic.
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