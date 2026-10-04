"use strict";

/**
 * ============================================================
 * GHAR
 * PAYMENT CONFIGURATION
 * ============================================================
 *
 * Location:
 *   /config/payments.js
 *
 * Responsibilities:
 * - Payment provider configuration
 * - One-time payments
 * - Property booking payments
 * - Property purchase payments
 * - Rent / maintenance payments
 * - Subscription payments
 * - Refund configuration
 * - Webhook configuration
 * - Idempotency configuration
 * - Payment validation
 *
 * Architecture:
 *
 * Frontend
 *    ↓
 * /api/payments
 *    ↓
 * payment.routes.js
 *    ↓
 * payment.controller.js
 *    ↓
 * payment service
 *    ↓
 * payment provider
 *    ↓
 * Razorpay / Other Provider
 *
 * IMPORTANT:
 * Never expose keySecret, webhookSecret or other
 * private credentials to frontend code.
 */

const env = require("./env");

/* ============================================================
 * HELPERS
 * ============================================================ */

function numberEnv(value, fallback) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function booleanEnv(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value).toLowerCase() === "true";
}

function stringEnv(value, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }

  return String(value).trim();
}

/* ============================================================
 * BASIC PROVIDER CONFIGURATION
 * ============================================================ */

const provider = stringEnv(
  env.payments?.provider ||
    process.env.PAYMENT_PROVIDER,
  "razorpay"
).toLowerCase();

const keyId = stringEnv(
  env.payments?.keyId ||
    process.env.PAYMENT_KEY_ID
);

const keySecret = stringEnv(
  env.payments?.keySecret ||
    process.env.PAYMENT_KEY_SECRET
);

const webhookSecret = stringEnv(
  process.env.PAYMENT_WEBHOOK_SECRET
);

const paymentMode = stringEnv(
  process.env.PAYMENT_MODE,
  "test"
).toLowerCase();

/* ============================================================
 * ENABLEMENT
 * ============================================================ */

const providerConfigured =
  Boolean(keyId && keySecret);

const paymentsEnabled =
  booleanEnv(
    process.env.PAYMENTS_ENABLED,
    true
  ) && providerConfigured;

/* ============================================================
 * MAIN CONFIG
 * ============================================================ */

const paymentsConfig = {

  enabled: paymentsEnabled,

  provider,

  mode:
    paymentMode === "live"
      ? "live"
      : "test",

  currency: stringEnv(
    process.env.PAYMENT_CURRENCY,
    "INR"
  ).toUpperCase(),

  keyId,

  keySecret,

  webhookSecret,

  apiUrl: stringEnv(
    process.env.PAYMENT_API_URL,
    provider === "razorpay"
      ? "https://api.razorpay.com/v1"
      : ""
  ),

  timeout: numberEnv(
    process.env.PAYMENT_TIMEOUT,
    30_000
  ),

  maxRetries: numberEnv(
    process.env.PAYMENT_MAX_RETRIES,
    2
  ),

  /* ==========================================================
   * AMOUNT CONFIGURATION
   * ========================================================== */

  amount: {

    /**
     * Application-level amounts are represented
     * in major currency units.
     *
     * Example:
     *
     * ₹1,000
     * =
     * 1000 INR
     */

    minimum: numberEnv(
      process.env.PAYMENT_MIN_AMOUNT,
      1
    ),

    maximum: numberEnv(
      process.env.PAYMENT_MAX_AMOUNT,
      100_000_000
    ),

    decimalPlaces: 2,

    /**
     * Razorpay and many payment gateways expect
     * the smallest currency unit.
     *
     * INR:
     *
     * ₹100
     * → 10000 paise
     */

    smallestUnitMultiplier: 100
  },

  /* ==========================================================
   * PAYMENT PURPOSES
   * ========================================================== */

  purposes: {

    propertyPurchase:
      "property_purchase",

    propertyBooking:
      "property_booking",

    subscription:
      "subscription",

    rent:
      "rent",

    maintenance:
      "maintenance",

    loanApplication:
      "loan_application",

    serviceFee:
      "service_fee",

    verificationFee:
      "verification_fee",

    platformFee:
      "platform_fee",

    documentVerification:
      "document_verification",

    listingFee:
      "listing_fee",

    visitFee:
      "visit_fee",

    referral:
      "referral"
  },

  /* ==========================================================
   * PAYMENT STATUS
   * ========================================================== */

  statuses: {

    created:
      "created",

    pending:
      "pending",

    authorized:
      "authorized",

    captured:
      "captured",

    failed:
      "failed",

    cancelled:
      "cancelled",

    refunded:
      "refunded",

    partiallyRefunded:
      "partially_refunded",

    expired:
      "expired",

    disputed:
      "disputed"
  },

  /* ==========================================================
   * PAYMENT METHODS
   * ========================================================== */

  methods: {

    card:
      "card",

    upi:
      "upi",

    netbanking:
      "netbanking",

    wallet:
      "wallet",

    bankTransfer:
      "bank_transfer",

    emi:
      "emi",

    other:
      "other"
  },

  /* ==========================================================
   * SUBSCRIPTION PLANS
   * ========================================================== */

  plans: {

    free: {
      code: "FREE",
      name: "Free",
      billing: "none",
      interval: null,
      active: true
    },

    buyerPlus: {
      code: "BUYER_PLUS",
      name: "Buyer Plus",
      billing: "subscription",
      interval: "monthly",
      active: true
    },

    sellerPro: {
      code: "SELLER_PRO",
      name: "Seller Pro",
      billing: "subscription",
      interval: "monthly",
      active: true
    },

    agentPro: {
      code: "AGENT_PRO",
      name: "Agent Pro",
      billing: "subscription",
      interval: "monthly",
      active: true
    },

    business: {
      code: "BUSINESS",
      name: "Business",
      billing: "subscription",
      interval: "monthly",
      active: true
    }
  },

  /* ==========================================================
   * SUBSCRIPTION SETTINGS
   * ========================================================== */

  subscriptions: {

    enabled:
      booleanEnv(
        process.env.SUBSCRIPTION_ENABLED,
        true
      ),

    defaultPlan:
      stringEnv(
        process.env.DEFAULT_SUBSCRIPTION_PLAN,
        "FREE"
      ).toUpperCase(),

    autoRenew:
      booleanEnv(
        process.env.SUBSCRIPTION_AUTO_RENEW,
        true
      ),

    gracePeriodDays:
      numberEnv(
        process.env.SUBSCRIPTION_GRACE_PERIOD_DAYS,
        3
      )
  },

  /* ==========================================================
   * REFUNDS
   * ========================================================== */

  refunds: {

    enabled:
      booleanEnv(
        process.env.REFUNDS_ENABLED,
        true
      ),

    maximumDays:
      numberEnv(
        process.env.REFUND_MAX_DAYS,
        7
      ),

    requireAdminApproval:
      booleanEnv(
        process.env.REFUND_REQUIRE_ADMIN,
        true
      ),

    allowPartialRefund:
      booleanEnv(
        process.env.REFUND_ALLOW_PARTIAL,
        true
      ),

    maximumAmount:
      numberEnv(
        process.env.REFUND_MAX_AMOUNT,
        100_000_000
      )
  },

  /* ==========================================================
   * WEBHOOK
   * ========================================================== */

  webhook: {

    enabled:
      booleanEnv(
        process.env.PAYMENT_WEBHOOK_ENABLED,
        true
      ),

    path:
      stringEnv(
        process.env.PAYMENT_WEBHOOK_PATH,
        "/api/payments/webhook"
      ),

    verifySignature:
      true,

    secretConfigured:
      Boolean(webhookSecret),

    maxBodySize:
      stringEnv(
        process.env.PAYMENT_WEBHOOK_BODY_LIMIT,
        "1mb"
      )
  },

  /* ==========================================================
   * IDEMPOTENCY
   * ========================================================== */

  idempotency: {

    enabled:
      booleanEnv(
        process.env.PAYMENT_IDEMPOTENCY_ENABLED,
        true
      ),

    header:
      stringEnv(
        process.env.PAYMENT_IDEMPOTENCY_HEADER,
        "Idempotency-Key"
      ),

    ttlSeconds:
      numberEnv(
        process.env.PAYMENT_IDEMPOTENCY_TTL,
        86_400
      )
  },

  /* ==========================================================
   * SECURITY
   * ========================================================== */

  security: {

    neverExposeSecrets:
      true,

    verifyWebhookSignature:
      true,

    preventDuplicateCapture:
      true,

    preventDuplicateRefund:
      true,

    requireAuthenticatedUser:
      true,

    requireOwnership:
      true,

    logSensitivePaymentData:
      false,

    storeCardDetails:
      false,

    storeCVV:
      false,

    storeRawPaymentCredentials:
      false
  },

  /* ==========================================================
   * INVOICE
   * ========================================================== */

  invoices: {

    enabled:
      booleanEnv(
        process.env.INVOICES_ENABLED,
        true
      ),

    prefix:
      stringEnv(
        process.env.INVOICE_PREFIX,
        "GHAR-INV"
      ),

    includeTax:
      booleanEnv(
        process.env.INVOICE_INCLUDE_TAX,
        true
      )
  },

  /* ==========================================================
   * TAX
   * ========================================================== */

  tax: {

    enabled:
      booleanEnv(
        process.env.PAYMENT_TAX_ENABLED,
        false
      ),

    rate:
      numberEnv(
        process.env.PAYMENT_TAX_RATE,
        0
      )
  },

  /* ==========================================================
   * RECEIPTS
   * ========================================================== */

  receipts: {

    enabled:
      booleanEnv(
        process.env.PAYMENT_RECEIPTS_ENABLED,
        true
      ),

    email:
      booleanEnv(
        process.env.PAYMENT_RECEIPT_EMAIL,
        true
      )
  },

  /* ==========================================================
   * AUDIT
   * ========================================================== */

  audit: {

    enabled: true,

    logCreation: true,

    logAuthorization: true,

    logCapture: true,

    logFailure: true,

    logRefund: true,

    logWebhook: true
  }
};

/* ============================================================
 * VALIDATE AMOUNT
 * ============================================================ */

/**
 * Validate payment amount in INR.
 *
 * @param {number|string} amount
 * @returns {boolean}
 */
function validateAmount(amount) {

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return false;
  }

  if (
    numericAmount <
    paymentsConfig.amount.minimum
  ) {
    return false;
  }

  if (
    numericAmount >
    paymentsConfig.amount.maximum
  ) {
    return false;
  }

  /**
   * Prevent negative / invalid decimal precision.
   */
  const rounded =
    Number(
      numericAmount.toFixed(
        paymentsConfig.amount.decimalPlaces
      )
    );

  return rounded === numericAmount;
}

/* ============================================================
 * CONVERT TO SMALLEST CURRENCY UNIT
 * ============================================================ */

/**
 * Convert INR into paise.
 *
 * Example:
 *
 * 100 INR → 10000 paise
 *
 * @param {number|string} amount
 * @returns {number}
 */
function toSmallestUnit(amount) {

  if (!validateAmount(amount)) {
    throw new Error(
      "Invalid payment amount."
    );
  }

  return Math.round(
    Number(amount) *
      paymentsConfig.amount.smallestUnitMultiplier
  );
}

/* ============================================================
 * CONVERT FROM SMALLEST UNIT
 * ============================================================ */

/**
 * Convert paise into INR.
 *
 * Example:
 *
 * 10000 paise → 100 INR
 *
 * @param {number|string} amount
 * @returns {number}
 */
function fromSmallestUnit(amount) {

  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount
    ) ||
    numericAmount < 0
  ) {
    throw new Error(
      "Invalid smallest-unit amount."
    );
  }

  return (
    numericAmount /
    paymentsConfig.amount.smallestUnitMultiplier
  );
}

/* ============================================================
 * GET SUBSCRIPTION PLAN
 * ============================================================ */

/**
 * @param {string} planCode
 * @returns {Object|null}
 */
function getPlan(planCode) {

  if (!planCode) {
    return null;
  }

  const normalized =
    String(planCode)
      .trim()
      .toUpperCase();

  const plan =
    Object.values(
      paymentsConfig.plans
    ).find(
      (item) =>
        item.code === normalized
    );

  return plan || null;
}

/* ============================================================
 * CHECK PLAN
 * ============================================================ */

function isValidPlan(planCode) {
  return Boolean(
    getPlan(planCode)
  );
}

/* ============================================================
 * CHECK PAYMENT PURPOSE
 * ============================================================ */

function isValidPurpose(purpose) {

  if (!purpose) {
    return false;
  }

  return Object.values(
    paymentsConfig.purposes
  ).includes(
    String(purpose)
      .trim()
      .toLowerCase()
  );
}

/* ============================================================
 * CHECK PAYMENT STATUS
 * ============================================================ */

function isValidPaymentStatus(status) {

  if (!status) {
    return false;
  }

  return Object.values(
    paymentsConfig.statuses
  ).includes(
    String(status)
      .trim()
      .toLowerCase()
  );
}

/* ============================================================
 * PAYMENT CONFIG STATUS
 * ============================================================ */

function getPaymentStatus() {

  return {

    enabled:
      paymentsConfig.enabled,

    provider:
      paymentsConfig.provider,

    mode:
      paymentsConfig.mode,

    currency:
      paymentsConfig.currency,

    providerConfigured:
      providerConfigured,

    webhookConfigured:
      Boolean(
        paymentsConfig.webhookSecret
      ),

    subscriptionsEnabled:
      paymentsConfig.subscriptions.enabled
  };
}

/* ============================================================
 * PRODUCTION VALIDATION
 * ============================================================ */

function validateProductionPayments() {

  if (
    env.nodeEnv !==
    "production"
  ) {
    return;
  }

  if (
    !paymentsConfig.enabled
  ) {
    throw new Error(
      "Payments are not properly configured for production."
    );
  }

  if (
    !paymentsConfig.keyId ||
    !paymentsConfig.keySecret
  ) {
    throw new Error(
      "Missing payment provider credentials."
    );
  }

  if (
    paymentsConfig.webhook.enabled &&
    !paymentsConfig.webhookSecret
  ) {
    throw new Error(
      "PAYMENT_WEBHOOK_SECRET is required when payment webhooks are enabled."
    );
  }

  if (
    paymentsConfig.mode ===
    "test"
  ) {
    console.warn(
      "[GHAR] WARNING: Payment system is running in TEST mode."
    );
  }
}

/* ============================================================
 * RUN VALIDATION
 * ============================================================ */

validateProductionPayments();

/* ============================================================
 * EXPORTS
 * ============================================================ */

module.exports = {

  paymentsConfig,

  isPaymentsEnabled:
    () =>
      paymentsConfig.enabled,

  getPlan,

  isValidPlan,

  validateAmount,

  toSmallestUnit,

  fromSmallestUnit,

  isValidPurpose,

  isValidPaymentStatus,

  getPaymentStatus
};