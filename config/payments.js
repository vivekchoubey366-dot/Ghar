'use strict';

/**
 * ============================================================
 * GHAR - Payment Configuration
 * ============================================================
 *
 * Central payment configuration for the GHAR backend.
 *
 * Designed for:
 * - Razorpay
 * - Stripe
 * - Future payment providers
 *
 * Responsibilities:
 * - Provider selection
 * - API credentials
 * - Currency
 * - Amount limits
 * - Checkout configuration
 * - Webhook configuration
 * - Payment verification configuration
 *
 * Actual payment operations belong in:
 *
 * services/payment.service.js
 * controllers/payment.controller.js
 * routes/payment.routes.js
 *
 * ============================================================
 */

const crypto = require('crypto');
const env = require('./env');

/* ============================================================
   1. BASIC PAYMENT CONFIGURATION
   ============================================================ */

const enabled =
  process.env.PAYMENTS_ENABLED !== 'false';

const provider =
  (
    process.env.PAYMENT_PROVIDER ||
    'razorpay'
  ).toLowerCase();

const environment =
  (
    process.env.PAYMENT_ENVIRONMENT ||
    env.app.environment ||
    'development'
  ).toLowerCase();

/* ============================================================
   2. CURRENCY
   ============================================================ */

const currency =
  (
    process.env.PAYMENT_CURRENCY ||
    'INR'
  ).toUpperCase();

/* ============================================================
   3. RAZORPAY CONFIGURATION
   ============================================================ */

const razorpay = {
  keyId:
    process.env.RAZORPAY_KEY_ID ||
    null,

  keySecret:
    process.env.RAZORPAY_KEY_SECRET ||
    null,

  webhookSecret:
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    null,

  apiUrl:
    process.env.RAZORPAY_API_URL ||
    'https://api.razorpay.com/v1',

  timeout:
    Number(
      process.env.RAZORPAY_TIMEOUT ||
      15000
    )
};

/* ============================================================
   4. STRIPE CONFIGURATION
   ============================================================ */

const stripe = {
  publishableKey:
    process.env.STRIPE_PUBLISHABLE_KEY ||
    null,

  secretKey:
    process.env.STRIPE_SECRET_KEY ||
    null,

  webhookSecret:
    process.env.STRIPE_WEBHOOK_SECRET ||
    null,

  apiVersion:
    process.env.STRIPE_API_VERSION ||
    null,

  timeout:
    Number(
      process.env.STRIPE_TIMEOUT ||
      15000
    )
};

/* ============================================================
   5. PAYMENT LIMITS
   ============================================================ */

const limits = {
  minimumAmount:
    Number(
      process.env.PAYMENT_MIN_AMOUNT ||
      1
    ),

  maximumAmount:
    Number(
      process.env.PAYMENT_MAX_AMOUNT ||
      10000000
    ),

  /*
   * Maximum amount in a single payment.
   *
   * Amounts are expressed in the configured currency.
   */

  maximumRefundAmount:
    Number(
      process.env.PAYMENT_MAX_REFUND_AMOUNT ||
      10000000
    )
};

/* ============================================================
   6. PAYMENT EXPIRY
   ============================================================ */

const expiry = {
  orderMinutes:
    Number(
      process.env.PAYMENT_ORDER_EXPIRY_MINUTES ||
      30
    ),

  checkoutMinutes:
    Number(
      process.env.PAYMENT_CHECKOUT_EXPIRY_MINUTES ||
      30
    )
};

/* ============================================================
   7. RETRY CONFIGURATION
   ============================================================ */

const retry = {
  enabled:
    process.env.PAYMENT_RETRY_ENABLED !==
    'false',

  maxAttempts:
    Number(
      process.env.PAYMENT_MAX_RETRIES ||
      3
    ),

  delayMs:
    Number(
      process.env.PAYMENT_RETRY_DELAY_MS ||
      1000
    )
};

/* ============================================================
   8. WEBHOOK CONFIGURATION
   ============================================================ */

const webhook = {
  enabled:
    process.env.PAYMENT_WEBHOOK_ENABLED !==
    'false',

  path:
    process.env.PAYMENT_WEBHOOK_PATH ||
    '/api/payments/webhook',

  timeout:
    Number(
      process.env.PAYMENT_WEBHOOK_TIMEOUT ||
      10000
    ),

  toleranceSeconds:
    Number(
      process.env.PAYMENT_WEBHOOK_TOLERANCE_SECONDS ||
      300
    )
};

/* ============================================================
   9. PAYMENT FEATURES
   ============================================================ */

const features = {
  propertyPayments:
    process.env.PAYMENT_FEATURE_PROPERTY !==
    'false',

  subscriptions:
    process.env.PAYMENT_FEATURE_SUBSCRIPTIONS !==
    'false',

  applicationFees:
    process.env.PAYMENT_FEATURE_APPLICATIONS !==
    'false',

  loanProcessingFees:
    process.env.PAYMENT_FEATURE_LOANS !==
    'false',

  bookingPayments:
    process.env.PAYMENT_FEATURE_BOOKINGS !==
    'false',

  servicePayments:
    process.env.PAYMENT_FEATURE_SERVICES !==
    'false',

  refunds:
    process.env.PAYMENT_FEATURE_REFUNDS !==
    'false',

  partialRefunds:
    process.env.PAYMENT_FEATURE_PARTIAL_REFUNDS !==
    'false',

  paymentReceipts:
    process.env.PAYMENT_FEATURE_RECEIPTS !==
    'false'
};

/* ============================================================
   10. CHECKOUT CONFIGURATION
   ============================================================ */

const checkout = {
  name:
    process.env.PAYMENT_CHECKOUT_NAME ||
    'GHAR',

  description:
    process.env.PAYMENT_CHECKOUT_DESCRIPTION ||
    'GHAR Real Estate Services',

  logo:
    process.env.PAYMENT_CHECKOUT_LOGO ||
    null,

  themeColor:
    process.env.PAYMENT_CHECKOUT_THEME_COLOR ||
    '#162D25',

  prefill:
    process.env.PAYMENT_CHECKOUT_PREFILL !==
    'false'
};

/* ============================================================
   11. RECEIPTS
   ============================================================ */

const receipts = {
  enabled:
    process.env.PAYMENT_RECEIPTS_ENABLED !==
    'false',

  prefix:
    process.env.PAYMENT_RECEIPT_PREFIX ||
    'GHAR',

  email:
    process.env.PAYMENT_RECEIPT_EMAIL !==
    'false'
};

/* ============================================================
   12. IDEMPOTENCY
   ============================================================ */

const idempotency = {
  enabled:
    process.env.PAYMENT_IDEMPOTENCY_ENABLED !==
    'false',

  ttlSeconds:
    Number(
      process.env.PAYMENT_IDEMPOTENCY_TTL_SECONDS ||
      86400
    )
};

/* ============================================================
   13. PROVIDER CHECK
   ============================================================ */

function isProviderSupported() {
  return [
    'razorpay',
    'stripe'
  ].includes(provider);
}

/* ============================================================
   14. ACTIVE PROVIDER CONFIGURATION
   ============================================================ */

function getProviderConfig() {
  switch (provider) {
    case 'razorpay':
      return razorpay;

    case 'stripe':
      return stripe;

    default:
      throw new Error(
        `Unsupported payment provider: ${provider}`
      );
  }
}

/* ============================================================
   15. PROVIDER CREDENTIAL CHECK
   ============================================================ */

function isProviderConfigured() {
  if (!enabled) {
    return false;
  }

  switch (provider) {
    case 'razorpay':
      return Boolean(
        razorpay.keyId &&
        razorpay.keySecret
      );

    case 'stripe':
      return Boolean(
        stripe.secretKey
      );

    default:
      return false;
  }
}

/* ============================================================
   16. WEBHOOK SECRET
   ============================================================ */

function getWebhookSecret() {
  switch (provider) {
    case 'razorpay':
      return razorpay.webhookSecret;

    case 'stripe':
      return stripe.webhookSecret;

    default:
      return null;
  }
}

/* ============================================================
   17. WEBHOOK SIGNATURE VERIFICATION
   ============================================================ */

/**
 * Generic HMAC-SHA256 verification helper.
 *
 * Provider-specific webhook services should use the
 * provider's exact signature-verification mechanism.
 */

function verifyHmacSignature(
  payload,
  signature,
  secret
) {
  if (
    !payload ||
    !signature ||
    !secret
  ) {
    return false;
  }

  try {
    const expected =
      crypto
        .createHmac(
          'sha256',
          secret
        )
        .update(
          payload
        )
        .digest('hex');

    const expectedBuffer =
      Buffer.from(
        expected,
        'utf8'
      );

    const signatureBuffer =
      Buffer.from(
        signature,
        'utf8'
      );

    if (
      expectedBuffer.length !==
      signatureBuffer.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      expectedBuffer,
      signatureBuffer
    );
  } catch (error) {
    return false;
  }
}

/* ============================================================
   18. AMOUNT VALIDATION
   ============================================================ */

function validateAmount(
  amount
) {
  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount
    )
  ) {
    return {
      valid: false,
      reason:
        'Payment amount must be a valid number.'
    };
  }

  if (
    numericAmount <
    limits.minimumAmount
  ) {
    return {
      valid: false,
      reason:
        `Payment amount must be at least ${limits.minimumAmount} ${currency}.`
    };
  }

  if (
    numericAmount >
    limits.maximumAmount
  ) {
    return {
      valid: false,
      reason:
        `Payment amount cannot exceed ${limits.maximumAmount} ${currency}.`
    };
  }

  return {
    valid: true,
    amount:
      numericAmount
  };
}

/* ============================================================
   19. FEATURE CHECK
   ============================================================ */

function isFeatureEnabled(
  feature
) {
  return (
    enabled &&
    features[feature] === true
  );
}

/* ============================================================
   20. PAYMENT STATUS
   ============================================================ */

const statuses = {
  created:
    'created',

  pending:
    'pending',

  authorized:
    'authorized',

  captured:
    'captured',

  failed:
    'failed',

  cancelled:
    'cancelled',

  refunded:
    'refunded',

  partiallyRefunded:
    'partially_refunded'
};

/* ============================================================
   21. PAYMENT METHODS
   ============================================================ */

const methods = {
  card:
    true,

  upi:
    true,

  netbanking:
    true,

  wallet:
    true,

  emi:
    true,

  bankTransfer:
    true
};

/* ============================================================
   22. SAFE CONFIGURATION
   ============================================================ */

function getSafeConfig() {
  return {
    enabled,

    provider,

    environment,

    currency,

    providerConfigured:
      isProviderConfigured(),

    limits: {
      minimumAmount:
        limits.minimumAmount,

      maximumAmount:
        limits.maximumAmount,

      maximumRefundAmount:
        limits.maximumRefundAmount
    },

    expiry: {
      orderMinutes:
        expiry.orderMinutes,

      checkoutMinutes:
        expiry.checkoutMinutes
    },

    retry: {
      enabled:
        retry.enabled,

      maxAttempts:
        retry.maxAttempts,

      delayMs:
        retry.delayMs
    },

    webhook: {
      enabled:
        webhook.enabled,

      path:
        webhook.path,

      toleranceSeconds:
        webhook.toleranceSeconds,

      secretConfigured:
        Boolean(
          getWebhookSecret()
        )
    },

    features: {
      ...features
    },

    checkout: {
      name:
        checkout.name,

      description:
        checkout.description,

      logoConfigured:
        Boolean(
          checkout.logo
        ),

      themeColor:
        checkout.themeColor
    },

    receipts: {
      enabled:
        receipts.enabled,

      prefix:
        receipts.prefix
    },

    idempotency: {
      enabled:
        idempotency.enabled,

      ttlSeconds:
        idempotency.ttlSeconds
    }
  };
}

/* ============================================================
   23. VALIDATION
   ============================================================ */

function validate() {
  const errors = [];
  const warnings = [];

  if (
    !isProviderSupported()
  ) {
    errors.push(
      `Unsupported PAYMENT_PROVIDER: ${provider}. Supported providers: razorpay, stripe.`
    );
  }

  if (
    limits.minimumAmount <= 0
  ) {
    errors.push(
      'PAYMENT_MIN_AMOUNT must be greater than zero.'
    );
  }

  if (
    limits.maximumAmount <
    limits.minimumAmount
  ) {
    errors.push(
      'PAYMENT_MAX_AMOUNT cannot be lower than PAYMENT_MIN_AMOUNT.'
    );
  }

  if (
    limits.maximumRefundAmount <= 0
  ) {
    errors.push(
      'PAYMENT_MAX_REFUND_AMOUNT must be greater than zero.'
    );
  }

  if (
    expiry.orderMinutes <= 0
  ) {
    errors.push(
      'PAYMENT_ORDER_EXPIRY_MINUTES must be greater than zero.'
    );
  }

  if (
    retry.maxAttempts < 0
  ) {
    errors.push(
      'PAYMENT_MAX_RETRIES cannot be negative.'
    );
  }

  if (
    webhook.toleranceSeconds < 0
  ) {
    errors.push(
      'PAYMENT_WEBHOOK_TOLERANCE_SECONDS cannot be negative.'
    );
  }

  if (
    enabled &&
    !isProviderConfigured()
  ) {
    warnings.push(
      `[GHAR PAYMENTS] ${provider} credentials are not configured.`
    );
  }

  if (
    environment === 'production' &&
    !enabled
  ) {
    warnings.push(
      '[GHAR PAYMENTS] Payments are disabled in production.'
    );
  }

  if (
    webhook.enabled &&
    !getWebhookSecret()
  ) {
    warnings.push(
      `[GHAR PAYMENTS] ${provider} webhook secret is not configured.`
    );
  }

  for (
    const warning of warnings
  ) {
    console.warn(
      warning
    );
  }

  if (
    errors.length > 0
  ) {
    throw new Error(
      `[GHAR PAYMENT CONFIG ERROR]\n- ${errors.join('\n- ')}`
    );
  }

  return true;
}

/* ============================================================
   24. EXPORT
   ============================================================ */

const payments = {
  enabled,

  provider,

  environment,

  currency,

  razorpay,

  stripe,

  limits,

  expiry,

  retry,

  webhook,

  features,

  checkout,

  receipts,

  idempotency,

  statuses,

  methods,

  isProviderSupported,

  getProviderConfig,

  isProviderConfigured,

  getWebhookSecret,

  verifyHmacSignature,

  validateAmount,

  isFeatureEnabled,

  getSafeConfig,

  validate
};

/* ============================================================
   25. VALIDATE ON LOAD
   ============================================================ */

validate();

/* ============================================================
   26. EXPORT
   ============================================================ */

module.exports = payments;