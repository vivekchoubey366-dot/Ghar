"use strict";

const express = require("express");

const router = express.Router();

const controller = require("../controllers/search.controller");
const authMiddleware = require("../middleware/auth.middleware");

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

router.get("/", auth, controller.list);

router.get("/:id", auth, controller.get);

router.post("/", auth, controller.create);

router.patch("/:id", auth, controller.update);

router.delete("/:id", auth, controller.remove);

module.exports = router;