"use strict";

const router = require("express").Router();

const controller = require("../controllers/user.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.get("/", requireAuth, controller.list);

router.get("/:id", requireAuth, controller.get);

router.post("/", requireAuth, controller.create);

router.patch("/:id", requireAuth, controller.update);

router.delete("/:id", requireAuth, controller.remove);

module.exports = router;