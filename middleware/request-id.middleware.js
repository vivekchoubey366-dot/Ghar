"use strict";

const crypto = require("crypto");

/**
 * GHAR Request ID Middleware
 *
 * Gives every HTTP request a unique ID.
 *
 * Flow:
 *
 * Client
 *   ↓
 * request-id.middleware
 *   ↓
 * auth / security / validation
 *   ↓
 * controller
 *   ↓
 * service
 *
 * The same request ID can be used in:
 * - Logs
 * - Error responses
 * - Audit records
 * - AI requests
 * - Payment requests
 * - Support tickets
 */

const REQUEST_ID_HEADER = "x-request-id";

function createRequestId() {
  return crypto.randomUUID();
}

function requestIdMiddleware(req, res, next) {
  let requestId = req.get(REQUEST_ID_HEADER);

  /*
   * Do not blindly trust an arbitrary client-supplied value.
   * Accept only a safe request-ID format.
   */
  if (
    typeof requestId !== "string" ||
    !/^[a-zA-Z0-9._:-]{8,128}$/.test(requestId)
  ) {
    requestId = createRequestId();
  }

  req.requestId = requestId;

  /*
   * Make the ID available to the client.
   */
  res.setHeader(
    REQUEST_ID_HEADER,
    requestId
  );

  /*
   * Convenience alias for application code.
   */
  res.locals.requestId = requestId;

  next();
}

function getRequestId(req) {
  return req?.requestId || null;
}

module.exports = {
  requestIdMiddleware,
  getRequestId,
  REQUEST_ID_HEADER
};