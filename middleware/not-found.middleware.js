"use strict";

function notFoundMiddleware(req, res) {
  const isApi =
    req.path === "/api" || req.path.startsWith("/api/");

  if (isApi) {
    return res.status(404).json({
      success: false,
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "API route not found.",
        path: req.originalUrl || req.url,
        requestId: req.requestId || null
      }
    });
  }

  return res.status(404).send("Page not found.");
}

module.exports = { notFoundMiddleware };
