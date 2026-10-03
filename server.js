// ============================================================
// FRONTEND ROUTING
// Express 5 compatible
// ============================================================

// Root
app.get("/", (req, res, next) => {
  res.sendFile(
    path.join(FRONTEND_ROOT, "index.html"),
    error => {
      if (error) {
        next(error);
      }
    }
  );
});

// ------------------------------------------------------------
// Serve existing HTML files safely
// Examples:
// /about.html
// /login.html
// /buyer/index.html
// /seller/dashboard.html
// /admin/admin-dashboard.html
// ------------------------------------------------------------
app.get(/^\/.*\.html$/, (req, res, next) => {
  const requestedPath = decodeURIComponent(req.path);

  // Prevent path traversal
  if (
    requestedPath.includes("..") ||
    requestedPath.includes("\\")
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid path"
    });
  }

  const requestedFile = path.join(
    FRONTEND_ROOT,
    requestedPath
  );

  res.sendFile(
    requestedFile,
    error => {
      if (error) {
        next();
      }
    }
  );
});

// ------------------------------------------------------------
// SPA / frontend fallback
// ------------------------------------------------------------
// This handles frontend routes that do not contain a file
// extension.
//
// Example:
// /buyer
// /seller
// /dashboard
// /properties
//
// API routes are NEVER sent to index.html.
// ------------------------------------------------------------
app.use((req, res, next) => {

  // Never interfere with API routes
  if (
    req.path === "/api" ||
    req.path.startsWith("/api/")
  ) {
    return next();
  }

  // If request has a file extension, let Express/static
  // middleware or the 404 handler deal with it.
  if (path.extname(req.path)) {
    return next();
  }

  // Only GET/HEAD requests should receive frontend HTML.
  if (
    req.method !== "GET" &&
    req.method !== "HEAD"
  ) {
    return next();
  }

  return res.sendFile(
    path.join(FRONTEND_ROOT, "index.html"),
    error => {
      if (error) {
        next(error);
      }
    }
  );
});