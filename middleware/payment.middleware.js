"use strict";

/**
 * ============================================================
 * GHAR - PAYMENT MIDDLEWARE
 * ============================================================
 *
 * Responsibilities:
 * - Require authentication for payment operations
 * - Validate payment request data
 * - Validate amount/currency
 * - Prevent client-side payment amount manipulation
 * - Validate payment gateway callbacks/webhooks
 * - Prevent duplicate webhook processing
 * - Protect payment routes with idempotency keys
 * - Provide consistent payment errors
 *
 * IMPORTANT:
 * - Never trust amount values from the client for final charging.
 * - Final payable amount must be calculated/verified server-side.
 * - Never store card numbers, CVV, PIN, or other sensitive
 *   payment credentials.
 *
 * ============================================================
 */

const crypto = require("crypto");


/**
 * ------------------------------------------------------------
 * Configuration
 * ------------------------------------------------------------
 */

const PAYMENT_CONFIG = Object.freeze({
  defaultCurrency:
    process.env.PAYMENT_CURRENCY ||
    "INR",

  minAmount:
    Number(
      process.env.PAYMENT_MIN_AMOUNT || 1
    ),

  maxAmount:
    Number(
      process.env.PAYMENT_MAX_AMOUNT ||
      10000000
    ),

  idempotencyKeyMaxLength:
    128,

  webhookTimestampTolerance:
    Number(
      process.env.PAYMENT_WEBHOOK_TOLERANCE ||
      300
    )
});


/**
 * ------------------------------------------------------------
 * Payment error helper
 * ------------------------------------------------------------
 */

function sendPaymentError(
  res,
  status,
  code,
  message,
  requestId
) {
  return res.status(status).json({
    success: false,

    error: {
      code,
      message,
      requestId:
        requestId || null
    }
  });
}


/**
 * ============================================================
 * REQUIRE PAYMENT USER
 * ============================================================
 */

function requirePaymentUser(
  req,
  res,
  next
) {
  if (
    !req.user ||
    !req.user.id
  ) {
    return sendPaymentError(
      res,
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication is required for payment operations.",
      req.requestId
    );
  }

  return next();
}


/**
 * ============================================================
 * VALIDATE PAYMENT AMOUNT
 * ============================================================
 */

function validatePaymentAmount(
  req,
  res,
  next
) {
  const rawAmount =
    req.body?.amount;

  if (
    rawAmount === undefined ||
    rawAmount === null ||
    rawAmount === ""
  ) {
    return sendPaymentError(
      res,
      400,
      "PAYMENT_AMOUNT_REQUIRED",
      "Payment amount is required.",
      req.requestId
    );
  }

  const amount =
    Number(rawAmount);

  if (
    !Number.isFinite(amount)
  ) {
    return sendPaymentError(
      res,
      400,
      "INVALID_PAYMENT_AMOUNT",
      "Payment amount must be a valid number.",
      req.requestId
    );
  }

  if (
    amount <= 0
  ) {
    return sendPaymentError(
      res,
      400,
      "INVALID_PAYMENT_AMOUNT",
      "Payment amount must be greater than zero.",
      req.requestId
    );
  }

  if (
    amount < PAYMENT_CONFIG.minAmount
  ) {
    return sendPaymentError(
      res,
      400,
      "PAYMENT_AMOUNT_TOO_LOW",
      `Payment amount must be at least ${PAYMENT_CONFIG.minAmount}.`,
      req.requestId
    );
  }

  if (
    amount > PAYMENT_CONFIG.maxAmount
  ) {
    return sendPaymentError(
      res,
      400,
      "PAYMENT_AMOUNT_TOO_HIGH",
      `Payment amount cannot exceed ${PAYMENT_CONFIG.maxAmount}.`,
      req.requestId
    );
  }

  /**
   * Allow only two decimal places.
   */

  const decimalPlaces =
    String(rawAmount)
      .includes(".")
      ? String(rawAmount)
          .split(".")[1]
          .length
      : 0;

  if (
    decimalPlaces > 2
  ) {
    return sendPaymentError(
      res,
      400,
      "INVALID_PAYMENT_PRECISION",
      "Payment amount cannot contain more than two decimal places.",
      req.requestId
    );
  }

  req.payment =
    req.payment || {};

  req.payment.amount =
    Math.round(
      amount * 100
    ) / 100;

  return next();
}


/**
 * ============================================================
 * VALIDATE CURRENCY
 * ============================================================
 */

function validatePaymentCurrency(
  req,
  res,
  next
) {
  const currency =
    String(
      req.body?.currency ||
      PAYMENT_CONFIG.defaultCurrency
    )
      .trim()
      .toUpperCase();

  /**
   * GHAR currently operates primarily in INR.
   *
   * Expand this whitelist only when the payment provider and
   * accounting layer support additional currencies.
   */

  const allowedCurrencies =
    new Set([
      "INR"
    ]);

  if (
    !allowedCurrencies.has(currency)
  ) {
    return sendPaymentError(
      res,
      400,
      "UNSUPPORTED_CURRENCY",
      `Currency "${currency}" is not supported.`,
      req.requestId
    );
  }

  req.payment =
    req.payment || {};

  req.payment.currency =
    currency;

  return next();
}


/**
 * ============================================================
 * VALIDATE PAYMENT METHOD
 * ============================================================
 */

function validatePaymentMethod(
  req,
  res,
  next
) {
  if (
    req.body?.paymentMethod === undefined &&
    req.body?.payment_method === undefined
  ) {
    return next();
  }

  const method =
    String(
      req.body.paymentMethod ||
      req.body.payment_method ||
      ""
    )
      .trim()
      .toLowerCase();

  const allowedMethods =
    new Set([
      "card",
      "upi",
      "netbanking",
      "wallet"
    ]);

  if (
    !allowedMethods.has(method)
  ) {
    return sendPaymentError(
      res,
      400,
      "UNSUPPORTED_PAYMENT_METHOD",
      "The selected payment method is not supported.",
      req.requestId
    );
  }

  req.payment =
    req.payment || {};

  req.payment.method =
    method;

  return next();
}


/**
 * ============================================================
 * VALIDATE PAYMENT REQUEST
 * ============================================================
 *
 * This validates the request structure.
 *
 * It does NOT decide the final amount to charge.
 *
 * ============================================================
 */

function validatePaymentRequest(
  req,
  res,
  next
) {
  if (
    !req.body ||
    typeof req.body !== "object" ||
    Array.isArray(req.body)
  ) {
    return sendPaymentError(
      res,
      400,
      "INVALID_PAYMENT_REQUEST",
      "A valid payment request body is required.",
      req.requestId
    );
  }

  return next();
}


/**
 * ============================================================
 * SERVER-SIDE AMOUNT VERIFICATION
 * ============================================================
 *
 * IMPORTANT:
 *
 * For subscriptions, loans, applications, services, etc.,
 * the server should calculate the payable amount.
 *
 * Example:
 *
 * verifyPaymentAmount({
 *   getExpectedAmount: async (req) => {
 *     return subscriptionService.getPrice(...);
 *   }
 * })
 *
 * ============================================================
 */

function verifyPaymentAmount({
  getExpectedAmount,
  tolerance = 0
} = {}) {
  if (
    typeof getExpectedAmount !== "function"
  ) {
    throw new TypeError(
      "verifyPaymentAmount requires getExpectedAmount."
    );
  }

  return async function paymentAmountMiddleware(
    req,
    res,
    next
  ) {
    if (
      !req.payment ||
      typeof req.payment.amount !== "number"
    ) {
      return sendPaymentError(
        res,
        400,
        "PAYMENT_AMOUNT_REQUIRED",
        "A valid payment amount is required.",
        req.requestId
      );
    }

    try {
      const expectedAmount =
        Number(
          await getExpectedAmount(req)
        );

      if (
        !Number.isFinite(expectedAmount) ||
        expectedAmount < 0
      ) {
        return next(
          new Error(
            "Invalid expected payment amount."
          )
        );
      }

      const difference =
        Math.abs(
          req.payment.amount -
          expectedAmount
        );

      if (
        difference > tolerance
      ) {
        return sendPaymentError(
          res,
          400,
          "PAYMENT_AMOUNT_MISMATCH",
          "The payment amount does not match the amount calculated by GHAR.",
          req.requestId
        );
      }

      /**
       * Always use the server-calculated amount.
       */

      req.payment.amount =
        Math.round(
          expectedAmount * 100
        ) / 100;

      req.payment.expectedAmount =
        req.payment.amount;

      return next();

    } catch (error) {
      return next(error);
    }
  };
}


/**
 * ============================================================
 * IDEMPOTENCY KEY
 * ============================================================
 *
 * Payment creation should be idempotent so retrying a request
 * does not accidentally create multiple charges.
 *
 * Header:
 *
 * Idempotency-Key: <unique-value>
 *
 * ============================================================
 */

function requireIdempotencyKey(
  req,
  res,
  next
) {
  const key =
    req.get("Idempotency-Key");

  if (
    !key
  ) {
    return sendPaymentError(
      res,
      400,
      "IDEMPOTENCY_KEY_REQUIRED",
      "An Idempotency-Key header is required for this payment operation.",
      req.requestId
    );
  }

  const normalized =
    String(key).trim();

  if (
    !normalized
  ) {
    return sendPaymentError(
      res,
      400,
      "INVALID_IDEMPOTENCY_KEY",
      "The Idempotency-Key cannot be empty.",
      req.requestId
    );
  }

  if (
    normalized.length >
    PAYMENT_CONFIG.idempotencyKeyMaxLength
  ) {
    return sendPaymentError(
      res,
      400,
      "INVALID_IDEMPOTENCY_KEY",
      "The Idempotency-Key is too long.",
      req.requestId
    );
  }

  /**
   * Only safe characters.
   */

  if (
    !/^[A-Za-z0-9._:-]+$/.test(
      normalized
    )
  ) {
    return sendPaymentError(
      res,
      400,
      "INVALID_IDEMPOTENCY_KEY",
      "The Idempotency-Key contains unsupported characters.",
      req.requestId
    );
  }

  req.payment =
    req.payment || {};

  req.payment.idempotencyKey =
    normalized;

  return next();
}


/**
 * ============================================================
 * OPTIONAL IDEMPOTENCY KEY
 * ============================================================
 */

function optionalIdempotencyKey(
  req,
  res,
  next
) {
  const key =
    req.get("Idempotency-Key");

  if (!key) {
    return next();
  }

  const normalized =
    String(key).trim();

  if (
    !normalized ||
    normalized.length >
      PAYMENT_CONFIG.idempotencyKeyMaxLength ||
    !/^[A-Za-z0-9._:-]+$/.test(
      normalized
    )
  ) {
    return sendPaymentError(
      res,
      400,
      "INVALID_IDEMPOTENCY_KEY",
      "The Idempotency-Key is invalid.",
      req.requestId
    );
  }

  req.payment =
    req.payment || {};

  req.payment.idempotencyKey =
    normalized;

  return next();
}


/**
 * ============================================================
 * PAYMENT RESOURCE OWNERSHIP
 * ============================================================
 *
 * Allows a payment to be made only by the user who owns the
 * associated resource.
 *
 * The actual ownership lookup is supplied by the controller /
 * service layer.
 * ============================================================
 */

function requirePaymentOwnership({
  getOwnerId,
  allowAdmin = true
} = {}) {
  if (
    typeof getOwnerId !== "function"
  ) {
    throw new TypeError(
      "requirePaymentOwnership requires getOwnerId."
    );
  }

  return async function paymentOwnershipMiddleware(
    req,
    res,
    next
  ) {
    if (
      !req.user ||
      !req.user.id
    ) {
      return sendPaymentError(
        res,
        401,
        "AUTHENTICATION_REQUIRED",
        "Authentication is required.",
        req.requestId
      );
    }

    if (
      allowAdmin &&
      (
        req.user.role === "admin" ||
        req.user.role === "super_admin"
      )
    ) {
      return next();
    }

    try {
      const ownerId =
        await getOwnerId(req);

      if (
        ownerId === null ||
        ownerId === undefined
      ) {
        return sendPaymentError(
          res,
          404,
          "PAYMENT_RESOURCE_NOT_FOUND",
          "The payment resource was not found.",
          req.requestId
        );
      }

      if (
        String(ownerId) !==
        String(req.user.id)
      ) {
        return sendPaymentError(
          res,
          403,
          "PAYMENT_ACCESS_DENIED",
          "You do not have permission to make this payment.",
          req.requestId
        );
      }

      return next();

    } catch (error) {
      return next(error);
    }
  };
}


/**
 * ============================================================
 * WEBHOOK SIGNATURE VERIFICATION
 * ============================================================
 *
 * This middleware expects a raw request body.
 *
 * IMPORTANT:
 * Configure Express so the payment webhook route receives
 * the raw body before JSON parsing.
 *
 * Example:
 *
 * app.post(
 *   "/api/payments/webhook",
 *   express.raw({ type: "application/json" }),
 *   verifyWebhookSignature,
 *   paymentController.webhook
 * );
 *
 * The exact signature header depends on the gateway.
 *
 * ============================================================
 */

function verifyWebhookSignature({
  secret,
  signatureHeader =
    "x-payment-signature",
  timestampHeader =
    "x-payment-timestamp"
} = {}) {
  return function webhookSignatureMiddleware(
    req,
    res,
    next
  ) {
    if (!secret) {
      return next(
        new Error(
          "Payment webhook secret is not configured."
        )
      );
    }

    const signature =
      req.get(
        signatureHeader
      );

    if (
      !signature
    ) {
      return sendPaymentError(
        res,
        401,
        "WEBHOOK_SIGNATURE_REQUIRED",
        "Payment webhook signature is required.",
        req.requestId
      );
    }

    const timestamp =
      req.get(
        timestampHeader
      );

    if (
      timestamp
    ) {
      const timestampNumber =
        Number(timestamp);

      if (
        !Number.isFinite(
          timestampNumber
        )
      ) {
        return sendPaymentError(
          res,
          401,
          "INVALID_WEBHOOK_TIMESTAMP",
          "The payment webhook timestamp is invalid.",
          req.requestId
        );
      }

      const age =
        Math.abs(
          Math.floor(
            Date.now() / 1000
          ) -
          timestampNumber
        );

      if (
        age >
        PAYMENT_CONFIG.webhookTimestampTolerance
      ) {
        return sendPaymentError(
          res,
          401,
          "WEBHOOK_TIMESTAMP_EXPIRED",
          "The payment webhook timestamp is outside the allowed window.",
          req.requestId
        );
      }
    }

    const rawBody =
      Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(
            typeof req.body === "string"
              ? req.body
              : JSON.stringify(
                  req.body || {}
                )
          );

    const signedPayload =
      timestamp
        ? `${timestamp}.${rawBody.toString("utf8")}`
        : rawBody.toString("utf8");

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          secret
        )
        .update(
          signedPayload
        )
        .digest("hex");

    const supplied =
      String(signature)
        .replace(
          /^sha256=/i,
          ""
        )
        .trim();

    if (
      supplied.length !==
      expectedSignature.length
    ) {
      return sendPaymentError(
        res,
        401,
        "INVALID_WEBHOOK_SIGNATURE",
        "The payment webhook signature is invalid.",
        req.requestId
      );
    }

    const valid =
      crypto.timingSafeEqual(
        Buffer.from(
          supplied,
          "utf8"
        ),
        Buffer.from(
          expectedSignature,
          "utf8"
        )
      );

    if (!valid) {
      return sendPaymentError(
        res,
        401,
        "INVALID_WEBHOOK_SIGNATURE",
        "The payment webhook signature is invalid.",
        req.requestId
      );
    }

    req.payment =
      req.payment || {};

    req.payment.webhookVerified =
      true;

    return next();
  };
}


/**
 * ============================================================
 * WEBHOOK EVENT VALIDATION
 * ============================================================
 */

function validateWebhookEvent(
  req,
  res,
  next
) {
  const body =
    req.body;

  if (
    !body ||
    typeof body !== "object"
  ) {
    return sendPaymentError(
      res,
      400,
      "INVALID_WEBHOOK",
      "Invalid payment webhook payload.",
      req.requestId
    );
  }

  const eventId =
    body.id ||
    body.eventId ||
    body.event_id;

  const eventType =
    body.type ||
    body.event ||
    body.eventType;

  if (
    !eventId
  ) {
    return sendPaymentError(
      res,
      400,
      "WEBHOOK_EVENT_ID_REQUIRED",
      "Payment webhook event ID is required.",
      req.requestId
    );
  }

  if (
    !eventType
  ) {
    return sendPaymentError(
      res,
      400,
      "WEBHOOK_EVENT_TYPE_REQUIRED",
      "Payment webhook event type is required.",
      req.requestId
    );
  }

  req.payment =
    req.payment || {};

  req.payment.webhookEventId =
    String(eventId);

  req.payment.webhookEventType =
    String(eventType);

  return next();
}


/**
 * ============================================================
 * PAYMENT CALLBACK SANITIZATION
 * ============================================================
 *
 * Never expose or persist raw payment credentials.
 * This middleware removes common sensitive fields from the
 * request body before downstream processing.
 *
 * ============================================================
 */

function sanitizePaymentBody(
  req,
  res,
  next
) {
  if (
    !req.body ||
    typeof req.body !== "object"
  ) {
    return next();
  }

  const forbiddenFields = [
    "cvv",
    "cvc",
    "pin",
    "upiPin",
    "upi_pin",
    "cardNumber",
    "card_number",
    "cardCvv",
    "card_cvv",
    "cardPin",
    "card_pin"
  ];

  for (
    const field of forbiddenFields
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        field
      )
    ) {
      delete req.body[field];
    }
  }

  return next();
}


/**
 * ============================================================
 * PAYMENT STATUS VALIDATION
 * ============================================================
 */

function validatePaymentStatus(
  req,
  res,
  next
) {
  if (
    req.body?.status === undefined
  ) {
    return next();
  }

  const status =
    String(
      req.body.status
    )
      .trim()
      .toLowerCase();

  const allowedStatuses =
    new Set([
      "created",
      "pending",
      "processing",
      "paid",
      "failed",
      "cancelled",
      "refunded",
      "partially_refunded"
    ]);

  if (
    !allowedStatuses.has(status)
  ) {
    return sendPaymentError(
      res,
      400,
      "INVALID_PAYMENT_STATUS",
      "The supplied payment status is invalid.",
      req.requestId
    );
  }

  req.payment =
    req.payment || {};

  req.payment.status =
    status;

  return next();
}


/**
 ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  PAYMENT_CONFIG,

  requirePaymentUser,

  validatePaymentRequest,

  validatePaymentAmount,

  validatePaymentCurrency,

  validatePaymentMethod,

  validatePaymentStatus,

  verifyPaymentAmount,

  requireIdempotencyKey,

  optionalIdempotencyKey,

  requirePaymentOwnership,

  verifyWebhookSignature,

  validateWebhookEvent,

  sanitizePaymentBody,

  sendPaymentError
};