"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();

const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";

// ============================================================
// PATHS
// ============================================================

const ROOT_DIR = __dirname;

// Frontend is the project root.
// If your HTML files are inside a different folder, change this.
const FRONTEND_DIR = ROOT_DIR;

// ============================================================
// BASIC CONFIGURATION
// ============================================================

app.disable("x-powered-by");

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "GHAR API",
    status: "running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// ROOT PAGE
// ============================================================

app.get("/", (req, res) => {
  const indexPath = path.join(FRONTEND_DIR, "index.html");

  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  return res.status(404).send("GHAR index.html not found.");
});

// ============================================================
// STATIC FILES
// ============================================================

// Assets
const assetDirectories = [
  "assets",
  "css",
  "js",
  "images",
  "img",
  "uploads",
  "fonts",
];

for (const directory of assetDirectories) {
  const fullPath = path.join(ROOT_DIR, directory);

  if (fs.existsSync(fullPath)) {
    app.use(
      `/${directory}`,
      express.static(fullPath, {
        fallthrough: true,
        maxAge: process.env.NODE_ENV === "production"
          ? "1d"
          : 0,
      })
    );
  }
}

// ============================================================
// SAFE FRONTEND FILE SERVING
// ============================================================
//
// IMPORTANT:
// Do NOT use:
// app.get("/*.html", ...)
//
// Express/path-to-regexp in your current environment rejects
// that wildcard syntax.
//
// Instead, we use middleware and resolve the requested file
// safely from the filesystem.
//

app.use((req, res, next) => {
  // Only process GET/HEAD requests
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }

  // Never serve backend/internal files as frontend files
  const blockedPrefixes = [
    "/api/",
    "/server/",
    "/node_modules/",
    "/.git/",
  ];

  if (
    blockedPrefixes.some((prefix) =>
      req.path.toLowerCase().startsWith(prefix)
    )
  ) {
    return next();
  }

  let requestedPath = decodeURIComponent(req.path);

  // Remove leading slash
  requestedPath = requestedPath.replace(/^\/+/, "");

  // Root handled above
  if (!requestedPath) {
    return next();
  }

  // Prevent path traversal
  if (
    requestedPath.includes("..") ||
    requestedPath.includes("\0")
  ) {
    return res.status(400).send("Invalid path.");
  }

  const absolutePath = path.resolve(
    FRONTEND_DIR,
    requestedPath
  );

  const relativePath = path.relative(
    FRONTEND_DIR,
    absolutePath
  );

// Ensure requested file remains inside project directory
  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    return res.status(403).send("Forbidden.");
  }

  // Only serve actual files
  if (fs.existsSync(absolutePath)) {
    const stat = fs.statSync(absolutePath);

    if (stat.isFile()) {
      return res.sendFile(absolutePath);
    }
  }

  // If user requests /some/page without .html,
  // try /some/page.html
  if (!path.extname(requestedPath)) {
    const htmlPath = path.resolve(
      FRONTEND_DIR,
      `${requestedPath}.html`
    );

    const htmlRelative = path.relative(
      FRONTEND_DIR,
      htmlPath
    );

    if (
      !htmlRelative.startsWith("..") &&
      !path.isAbsolute(htmlRelative) &&
      fs.existsSync(htmlPath) &&
      fs.statSync(htmlPath).isFile()
    ) {
      return res.sendFile(htmlPath);
    }
  }

  return next();
});

// ============================================================
// API ROUTES
// ============================================================
//
// If your project already contains these route files,
// they will automatically be mounted.
// Missing route files are simply skipped.
//

function mountRoute(url, file) {
  const routePath = path.join(ROOT_DIR, file);

  if (!fs.existsSync(routePath)) {
    console.log(`[GHAR] Route skipped: ${file}`);
    return;
  }

  try {
    const router = require(routePath);

    if (typeof router === "function") {
      app.use(url, router);
      console.log(`[GHAR] Route mounted: ${url}`);
    } else {
      console.warn(
        `[GHAR] Route ${file} does not export an Express router.`
      );
    }
  } catch (error) {
    console.error(
      `[GHAR] Failed to load route ${file}:`,
      error.message
    );
  }
}

// Common GHAR route locations
mountRoute("/api/auth", "server/routes/auth.js");
mountRoute("/api/users", "server/routes/users.js");
mountRoute("/api/properties", "server/routes/properties.js");
mountRoute("/api/enquiries", "server/routes/enquiries.js");
mountRoute("/api/appointments", "server/routes/appointments.js");
mountRoute("/api/chat", "server/routes/chat.js");
mountRoute("/api/subscriptions", "server/routes/subscriptions.js");
mountRoute("/api/payments", "server/routes/payments.js");
mountRoute("/api/notifications", "server/routes/notifications.js");
mountRoute("/api/reports", "server/routes/reports.js");
mountRoute("/api/admin", "server/routes/admin.js");

// ============================================================
// FALLBACK 404
// ============================================================

app.use((req, res) => {
  // API 404
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      ok: false,
      error: "API endpoint not found",
      path: req.path,
    });
  }

  // Frontend 404
  return res.status(404).send(`
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport"
        content="width=device-width, initial-scale=1">
  <title>404 - GHAR</title>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: Arial, sans-serif;
      background:
        linear-gradient(
          135deg,
          #08140f,
          #162d25,
          #213c31
        );
      color: #f7f0df;
      padding: 24px;
    }

    .box {
      width: min(600px, 100%);
      padding: 48px;
      border-radius: 24px;
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.15);
      text-align: center;
      backdrop-filter: blur(20px);
    }

    h1 {
      font-size: 72px;
      margin: 0 0 10px;
    }

    h2 {
      margin: 0 0 16px;
    }

    p {
      opacity: .8;
      line-height: 1.6;
    }

    a {
      display: inline-block;
      margin-top: 20px;
      padding: 13px 22px;
      border-radius: 12px;
      text-decoration: none;
      background: #d8b878;
      color: #162d25;
      font-weight: 700;
    }
  </style>
</head>

<body>
  <main class="box">
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>
      The GHAR page you requested could not be found.
    </p>
    <a href="/">Return to GHAR</a>
  </main>
</body>
</html>
  `);
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error("[GHAR ERROR]", err);

  if (res.headersSent) {
    return next(err);
  }

  if (req.path.startsWith("/api/")) {
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong."
          : err.message,
    });
  }

  return res.status(500).send("Internal server error.");
});

// ============================================================
// START SERVER
// ============================================================

const server = app.listen(PORT, HOST, () => {
  console.log("========================================");
  console.log(" GHAR SERVER STARTED");
  console.log("========================================");
  console.log(`Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`Host        : ${HOST}`);
  console.log(`Port        : ${PORT}`);
  console.log(`Frontend    : ${FRONTEND_DIR}`);
  console.log("========================================");
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

function shutdown(signal) {
  console.log(`\n[GHAR] ${signal} received.`);

  server.close(() => {
    console.log("[GHAR] HTTP server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("[GHAR] Forced shutdown.");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ============================================================
// UNHANDLED ERRORS
// ============================================================

process.on("unhandledRejection", (reason) => {
  console.error("[GHAR] Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[GHAR] Uncaught Exception:", error);
});