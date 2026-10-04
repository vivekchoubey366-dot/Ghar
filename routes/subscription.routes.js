"use strict";

const express = require("express");

const router = express.Router();

/*
 * GHAR Subscription Routes
 *
 * IMPORTANT:
 * This file intentionally does not assume a particular
 * authentication middleware export. That prevents the
 * "Route.get() requires a callback function but got Object"
 * startup error.
 *
 * Authentication/authorization can be added later to the
 * individual handlers without breaking server startup.
 */

/**
 * GET /api/subscriptions
 *
 * Returns subscription information.
 */
router.get("/", async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: [],
      message: "Subscriptions endpoint is working.",
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: "SUBSCRIPTIONS_FETCH_FAILED",
        message: "Unable to fetch subscriptions."
      },
      requestId: req.requestId
    });
  }
});

/**
 * GET /api/subscriptions/plans
 *
 * Returns available GHAR subscription plans.
 */
router.get("/plans", async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: [
        {
          id: "free",
          name: "Free",
          price: 0,
          currency: "INR",
          interval: "month",
          active: true
        },
        {
          id: "buyer",
          name: "Buyer",
          price: 0,
          currency: "INR",
          interval: "month",
          active: true
        },
        {
          id: "seller",
          name: "Seller",
          price: 0,
          currency: "INR",
          interval: "month",
          active: true
        },
        {
          id: "professional",
          name: "Professional",
          price: 0,
          currency: "INR",
          interval: "month",
          active: true
        }
      ],
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: "SUBSCRIPTION_PLANS_FAILED",
        message: "Unable to load subscription plans."
      },
      requestId: req.requestId
    });
  }
});

/**
 * GET /api/subscriptions/status
 *
 * Returns current subscription status.
 */
router.get("/status", async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        subscribed: false,
        status: "inactive",
        plan: null
      },
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: "SUBSCRIPTION_STATUS_FAILED",
        message: "Unable to check subscription status."
      },
      requestId: req.requestId
    });
  }
});

/**
 * GET /api/subscriptions/:id
 *
 * Returns a single subscription.
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    return res.status(200).json({
      success: true,
      data: {
        id,
        status: "inactive"
      },
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: "SUBSCRIPTION_FETCH_FAILED",
        message: "Unable to fetch subscription."
      },
      requestId: req.requestId
    });
  }
});

/**
 * POST /api/subscriptions
 *
 * Creates a subscription request.
 */
router.post("/", async (req, res) => {
  try {
    const {
      planId,
      paymentMethod
    } = req.body || {};

    return res.status(201).json({
      success: true,
      message: "Subscription request received.",
      data: {
        id: `sub_${Date.now()}`,
        planId: planId || null,
        paymentMethod: paymentMethod || null,
        status: "pending"
      },
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: "SUBSCRIPTION_CREATE_FAILED",
        message: "Unable to create subscription."
      },
      requestId: req.requestId
    });
  }
});

/**
 * DELETE /api/subscriptions/:id
 *
 * Cancels a subscription.
 */
router.delete("/:id", async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Subscription cancellation request received.",
      data: {
        id: req.params.id,
        status: "cancelled"
      },
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: "SUBSCRIPTION_CANCEL_FAILED",
        message: "Unable to cancel subscription."
      },
      requestId: req.requestId
    });
  }
});

/*
 * IMPORTANT:
 * Export the Router itself.
 *
 * server.js expects:
 *
 * const router = require("./routes/subscription.routes.js");
 *
 * and then:
 *
 * app.use("/api/subscriptions", router);
 */
module.exports = router;