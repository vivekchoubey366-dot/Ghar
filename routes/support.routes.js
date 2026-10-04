"use strict";

const express = require("express");

const router = express.Router();

/*
 * ============================================================
 * GHAR SUPPORT ROUTES
 * ============================================================
 *
 * Base URL:
 * /api/support
 *
 * IMPORTANT:
 * This file exports the Express Router directly.
 *
 * DO NOT export an object.
 *
 * Correct:
 * module.exports = router;
 * ============================================================
 */

/**
 * ============================================================
 * GET /api/support
 * ============================================================
 *
 * Support overview.
 */
router.get("/", async (req, res) => {
  try {
    return res.status(200).json({
      success: true,

      data: {
        service: "GHAR Support",
        available: true,

        channels: {
          ticket: true,
          email: true,
          phone: true,
          ai: true
        }
      },

      message: "GHAR support service is available.",

      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      error: {
        code: "SUPPORT_SERVICE_FAILED",
        message: "Unable to load support service."
      },

      requestId: req.requestId
    });
  }
});

/**
 * ============================================================
 * GET /api/support/tickets
 * ============================================================
 *
 * Returns support tickets.
 */
router.get("/tickets", async (req, res) => {
  try {
    return res.status(200).json({
      success: true,

      data: [],

      pagination: {
        page: 1,
        limit: 20,
        total: 0
      },

      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      error: {
        code: "SUPPORT_TICKETS_FAILED",
        message: "Unable to load support tickets."
      },

      requestId: req.requestId
    });
  }
});

/**
 * ============================================================
 * GET /api/support/tickets/:id
 * ============================================================
 *
 * Returns one support ticket.
 */
router.get("/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;

    return res.status(200).json({
      success: true,

      data: {
        id,
        status: "open",
        priority: "normal",
        subject: null,
        category: null,
        message: null,
        createdAt: null,
        updatedAt: null
      },

      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      error: {
        code: "SUPPORT_TICKET_FETCH_FAILED",
        message: "Unable to load support ticket."
      },

      requestId: req.requestId
    });
  }
});

/**
 * ============================================================
 * POST /api/support/tickets
 * ============================================================
 *
 * Creates a support ticket.
 */
router.post("/tickets", async (req, res) => {
  try {
    const body = req.body || {};

    const subject =
      typeof body.subject === "string"
        ? body.subject.trim()
        : "";

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : "general";

    const priority =
      typeof body.priority === "string"
        ? body.priority.trim()
        : "normal";

    if (!subject) {
      return res.status(400).json({
        success: false,

        error: {
          code: "SUPPORT_SUBJECT_REQUIRED",
          message: "Support ticket subject is required."
        },

        requestId: req.requestId
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,

        error: {
          code: "SUPPORT_MESSAGE_REQUIRED",
          message: "Support ticket message is required."
        },

        requestId: req.requestId
      });
    }

    const ticket = {
      id: `ticket_${Date.now()}`,

      subject,

      message,

      category,

      priority,

      status: "open",

      createdAt:
        new Date().toISOString()
    };

    return res.status(201).json({
      success: true,

      message: "Support ticket created successfully.",

      data: ticket,

      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      error: {
        code: "SUPPORT_TICKET_CREATE_FAILED",
        message: "Unable to create support ticket."
      },

      requestId: req.requestId
    });
  }
});

/**
 * ============================================================
 * PATCH /api/support/tickets/:id
 * ============================================================
 *
 * Updates a support ticket.
 */
router.patch("/tickets/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const body = req.body || {};

    return res.status(200).json({
      success: true,

      message: "Support ticket updated successfully.",

      data: {
        id,

        status:
          body.status ||
          "open",

        priority:
          body.priority ||
          "normal",

        updatedAt:
          new Date().toISOString()
      },

      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      error: {
        code: "SUPPORT_TICKET_UPDATE_FAILED",
        message: "Unable to update support ticket."
      },

      requestId: req.requestId
    });
  }
});

/**
 * ============================================================
 * POST /api/support/tickets/:id/messages
 * ============================================================
 *
 * Adds a message to a support ticket.
 */
router.post(
  "/tickets/:id/messages",
  async (req, res) => {
    try {
      const { id } = req.params;

      const message =
        typeof req.body?.message === "string"
          ? req.body.message.trim()
          : "";

      if (!message) {
        return res.status(400).json({
          success: false,

          error: {
            code: "SUPPORT_MESSAGE_REQUIRED",
            message: "Message is required."
          },

          requestId: req.requestId
        });
      }

      return res.status(201).json({
        success: true,

        message:
          "Support message added successfully.",

        data: {
          ticketId: id,

          messageId:
            `support_msg_${Date.now()}`,

          message,

          createdAt:
            new Date().toISOString()
        },

        requestId: req.requestId
      });
    } catch (error) {
      return res.status(500).json({
        success: false,

        error: {
          code: "SUPPORT_MESSAGE_CREATE_FAILED",
          message: "Unable to add support message."
        },

        requestId: req.requestId
      });
    }
  }
);

/**
 * ============================================================
 * DELETE /api/support/tickets/:id
 * ============================================================
 *
 * Closes/cancels a support ticket.
 */
router.delete(
  "/tickets/:id",
  async (req, res) => {
    try {
      const { id } = req.params;

      return res.status(200).json({
        success: true,

        message:
          "Support ticket closed successfully.",

        data: {
          id,

          status: "closed",

          closedAt:
            new Date().toISOString()
        },

        requestId: req.requestId
      });
    } catch (error) {
      return res.status(500).json({
        success: false,

        error: {
          code: "SUPPORT_TICKET_CLOSE_FAILED",
          message: "Unable to close support ticket."
        },

        requestId: req.requestId
      });
    }
  }
);

/**
 * ============================================================
 * GET /api/support/faq
 * ============================================================
 *
 * Basic support FAQ endpoint.
 */
router.get("/faq", async (req, res) => {
  try {
    return res.status(200).json({
      success: true,

      data: [
        {
          id: "faq_1",
          question: "How do I list a property?",
          answer:
            "Use the seller property-listing workflow from your GHAR account."
        },

        {
          id: "faq_2",
          question: "How do I schedule a property visit?",
          answer:
            "Open a property and use the visit-request workflow."
        },

        {
          id: "faq_3",
          question: "How do I contact GHAR support?",
          answer:
            "Create a support ticket through the GHAR support center."
        },

        {
          id: "faq_4",
          question: "How can I check my payment?",
          answer:
            "Payment information is available through your authorized GHAR account workflow."
        }
      ],

      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      error: {
        code: "SUPPORT_FAQ_FAILED",
        message: "Unable to load support FAQ."
      },

      requestId: req.requestId
    });
  }
});

/**
 * ============================================================
 * GET /api/support/contact
 * ============================================================
 *
 * Support contact information.
 */
router.get("/contact", async (req, res) => {
  try {
    return res.status(200).json({
      success: true,

      data: {
        email:
          process.env.SUPPORT_EMAIL ||
          "support@ghar.example",

        phone:
          process.env.SUPPORT_PHONE ||
          null,

        hours:
          process.env.SUPPORT_HOURS ||
          "Monday to Saturday, 10:00 AM to 6:00 PM"
      },

      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      error: {
        code: "SUPPORT_CONTACT_FAILED",
        message: "Unable to load support contact information."
      },

      requestId: req.requestId
    });
  }
});

/**
 * ============================================================
 * EXPORT
 * ============================================================
 */

module.exports = router;