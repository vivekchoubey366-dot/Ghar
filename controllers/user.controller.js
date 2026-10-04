"use strict";

const express = require("express");

const router = express.Router();

const controller = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");

/*
 * auth.middleware.js exports:
 * {
 *   requireAuth,
 *   optionalAuth,
 *   isAuthenticated,
 *   extractToken
 * }
 */

const auth = authMiddleware.requireAuth;

if (typeof auth !== "function") {
  throw new TypeError(
    "GHAR: authMiddleware.requireAuth must be a function"
  );
}

if (typeof controller.list !== "function") {
  throw new TypeError(
    "GHAR: controller.list must be a function"
  );
}

if (typeof controller.get !== "function") {
  throw new TypeError(
    "GHAR: controller.get must be a function"
  );
}

if (typeof controller.create !== "function") {
  throw new TypeError(
    "GHAR: controller.create must be a function"
  );
}

if (typeof controller.update !== "function") {
  throw new TypeError(
    "GHAR: controller.update must be a function"
  );
}

if (typeof controller.remove !== "function") {
  throw new TypeError(
    "GHAR: controller.remove must be a function"
  );
}

/*
 * GET /api/users
 */
router.get(
  "/",
  auth,
  controller.list
);

/*
 * GET /api/users/:id
 */
router.get(
  "/:id",
  auth,
  controller.get
);

/*
 * POST /api/users
 */
router.post(
  "/",
  auth,
  controller.create
);

/*
 * PATCH /api/users/:id
 */
router.patch(
  "/:id",
  auth,
  controller.update
);

/*
 * DELETE /api/users/:id
 */
router.delete(
  "/:id",
  auth,
  controller.remove
);

module.exports = router;