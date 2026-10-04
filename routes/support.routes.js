"use strict";

const express = require("express");

const router = express.Router();

/**

* ============================================================
* GHAR - SUPPORT ROUTES
* ============================================================
* Mounted by server.js at:
* /api/support
* ============================================================
    */

/**

* GET /api/support
* Returns support service status.
    */
    router.get("/", async (req, res, next) => {
    try {
    return res.status(200).json({
    success: true,
    service: "GHAR Support",
    status: "available",
    data: [],
    requestId: req.requestId
    });
    } catch (error) {
    next(error);
    }
    });

/**

* GET /api/support/health
    */
    router.get("/health", (req, res) => {
    return res.status(200).json({
    success: true,
    service: "GHAR Support",
    status: "healthy",
    requestId: req.requestId
    });
    });

/**

* GET /api/support/tickets
* Returns support tickets.
    */
    router.get("/tickets", async (req, res, next) => {
    try {
    return res.status(200).json({
    success: true,
    data: [],
    count: 0,
    requestId: req.requestId
    });
    } catch (error) {
    next(error);
    }
    });

/**

* GET /api/support/tickets/:id
    */
    router.get("/tickets/:id", async (req, res, next) => {
    try {
    return res.status(200).json({
    success: true,
    data: null,
    ticketId: req.params.id,
    requestId: req.requestId
    });
    } catch (error) {
    next(error);
    }
    });

/**

* POST /api/support/tickets
* Creates a support ticket.
    */
    router.post("/tickets", async (req, res, next) => {
    try {
    const {
    subject = "",
    category = "general",
    priority = "normal",
    message = ""
    } = req.body || {};
    if (!subject.trim()) {
    return res.status(400).json({
    success: false,
    error: {
    code: "SUPPORT_SUBJECT_REQUIRED",
    message: "Support subject is required."
    },
    requestId: req.requestId
    });
    }
    if (!message.trim()) {
    return res.status(400).json({
    success: false,
    error: {
    code: "SUPPORT_MESSAGE_REQUIRED",
    message: "Support message is required."
    },
    requestId: req.requestId
    });
    }
    return res.status(201).json({
    success: true,
    message: "Support ticket created.",
    data: {
    id: null,
    subject,
    category,
    priority,
    message,
    status: "open"
    },
    requestId: req.requestId
    });
    } catch (error) {
    next(error);
    }
    });

/**

* POST /api/support/contact
* General support/contact request.
    */
    router.post("/contact", async (req, res, next) => {
    try {
    const {
    name = "",
    email = "",
    phone = "",
    message = ""
    } = req.body || {};
    if (!message.trim()) {
    return res.status(400).json({
    success: false,
    error: {
    code: "MESSAGE_REQUIRED",
    message: "Message is required."
    },
    requestId: req.requestId
    });
    }
    return res.status(201).json({
    success: true,
    message: "Support request received.",
    data: {
    name,
    email,
    phone,
    message
    },
    requestId: req.requestId
    });
    } catch (error) {
    next(error);
    }
    });

/**

* PUT /api/support/tickets/:id
    */
    router.put("/tickets/:id", async (req, res, next) => {
    try {
    return res.status(200).json({
    success: true,
    message: "Support ticket updated.",
    ticketId: req.params.id,
    data: req.body || {},
    requestId: req.requestId
    });
    } catch (error) {
    next(error);
    }
    });

/**

* POST /api/support/tickets/:id/close
    */
    router.post("/tickets/:id/close", async (req, res, next) => {
    try {
    return res.status(200).json({
    success: true,
    message: "Support ticket closed.",
    ticketId: req.params.id,
    status: "closed",
    requestId: req.requestId
    });
    } catch (error) {
    next(error);
    }
    });

/**

* DELETE /api/support/tickets/:id
    */
    router.delete("/tickets/:id", async (req, res, next) => {
    try {
    return res.status(200).json({
    success: true,
    message: "Support ticket deleted.",
    ticketId: req.params.id,
    requestId: req.requestId
    });
    } catch (error) {
    next(error);
    }
    });

/**

* ============================================================
* EXPORT
* ============================================================
    */

module.exports = router;