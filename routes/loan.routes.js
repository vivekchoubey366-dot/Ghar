"use strict";

const express = require("express");

const router = express.Router();

/**

* ============================================================
* GHAR - LOAN ROUTES
* ============================================================
* Mounted by server.js at:
* /api/loans
* Every handler below is a real Express callback function.
* This prevents:
* Route.get() requires a callback function but got a [object Object]
* ============================================================
    */

/**

* GET /api/loans
* Returns available loan/application information.
    */
    router.get("/", async (req, res, next) => {
    try {
    return res.status(200).json({
    success: true,
    data: [],
    message: "Loan service is available.",
    requestId: req.requestId
    });
    } catch (error) {
    next(error);
    }
    });

/**

* GET /api/loans/health
    */
    router.get("/health", (req, res) => {
    return res.status(200).json({
    success: true,
    service: "GHAR Loans",
    status: "healthy",
    requestId: req.requestId
    });
    });

/**

* GET /api/loans/:id
    */
    router.get("/:id", async (req, res, next) => {
    try {
    const { id } = req.params;
    return res.status(200).json({
    success: true,
    data: null,
    loanId: id,
    message: "Loan endpoint is available.",
    requestId: req.requestId
    });
    } catch (error) {
    next(error);
    }
    });

/**

* POST /api/loans
* Creates a loan enquiry/application request.
    */
    router.post("/", async (req, res, next) => {
    try {
    const {
    propertyId = null,
    amount = null,
    tenure = null,
    employmentType = null,
    income = null
    } = req.body || {};
    return res.status(201).json({
    success: true,
    message: "Loan enquiry received.",
    data: {
    propertyId,
    amount,
    tenure,
    employmentType,
    income
    },
    requestId: req.requestId
    });
    } catch (error) {
    next(error);
    }
    });

/**

* PUT /api/loans/:id
    */
    router.put("/:id", async (req, res, next) => {
    try {
    return res.status(200).json({
    success: true,
    message: "Loan record updated.",
    loanId: req.params.id,
    data: req.body || {},
    requestId: req.requestId
    });
    } catch (error) {
    next(error);
    }
    });

/**

* DELETE /api/loans/:id
    */
    router.delete("/:id", async (req, res, next) => {
    try {
    return res.status(200).json({
    success: true,
    message: "Loan record deleted.",
    loanId: req.params.id,
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