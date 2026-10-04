"use strict";

function requireOwnership(resolveResourceOwner) {
  if (typeof resolveResourceOwner !== "function") {
    throw new TypeError("requireOwnership expects a resolver function.");
  }

  return async (req, res, next) => {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required.",
          requestId: req.requestId || null
        }
      });
    }

    try {
      const ownerId = await resolveResourceOwner(req);

      if (!ownerId) {
        return res.status(404).json({
          success: false,
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "The requested resource was not found.",
            requestId: req.requestId || null
          }
        });
      }

      if (String(ownerId) !== String(req.user.userId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: "OWNERSHIP_REQUIRED",
            message: "You do not have permission to modify this resource.",
            requestId: req.requestId || null
          }
        });
      }

      req.resourceOwnerId = ownerId;
      next();
    } catch (error) {
      next(error);
    }
  };
}

function requireSelf(req, res, next) {
  const targetId = req.params.userId || req.params.id || req.body?.userId;

  if (!req.user?.userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required.",
        requestId: req.requestId || null
      }
    });
  }

  if (!targetId || String(targetId) !== String(req.user.userId)) {
    return res.status(403).json({
      success: false,
      error: {
        code: "SELF_ACCESS_REQUIRED",
        message: "You can only access your own account.",
        requestId: req.requestId || null
      }
    });
  }

  next();
}

module.exports = { requireOwnership, requireSelf };
