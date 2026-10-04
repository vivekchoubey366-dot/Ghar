"use strict";

/**
 * ============================================================
 * GHAR
 * EMAIL CONFIGURATION
 * ============================================================
 *
 * Central configuration for all transactional email operations.
 *
 * Used by:
 *
 *   Auth
 *     ├── Welcome
 *     ├── Email verification
 *     ├── OTP
 *     ├── Password reset
 *     └── Security alerts
 *
 *   Properties
 *     ├── Property listed
 *     ├── Property approved
 *     ├── Property rejected
 *     └── Property verification
 *
 *   Buyer / Seller / Tenant
 *     ├── Visits
 *     ├── Offers
 *     ├── Applications
 *     ├── Documents
 *     └── Notifications
 *
 *   Payments
 *     ├── Payment success
 *     ├── Payment failed
 *     ├── Refund
 *     └── Invoice
 *
 *   Subscriptions
 *     ├── Started
 *     ├── Renewed
 *     ├── Cancelled
 *     └── Expired
 *
 *   Loans
 *     ├── Application
 *     └── Status
 *
 *   Support
 *     ├── Ticket created
 *     └── Ticket updated
 *
 *   Admin
 *     └── Security / system alerts
 *
 * Provider:
 *   SMTP
 *
 * Credentials:
 *   config/env.js
 *
 * ============================================================
 */

const env = require("./env");

/* ============================================================
 * HELPERS
 * ============================================================ */

function envString(name, fallback = "") {
  const value = process.env[name];

  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return String(value).trim();
}

function envBoolean(name, fallback = false) {
  const value = process.env[name];

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  return String(value).toLowerCase() === "true";
}

function envNumber(name, fallback) {
  const value = Number(process.env[name]);

  return Number.isFinite(value)
    ? value
    : fallback;
}

/* ============================================================
 * EMAIL CONFIGURATION
 * ============================================================ */

const emailConfig = {
  /**
   * Master switch.
   *
   * Email requires SMTP credentials unless sending
   * is intentionally disabled in development.
   */
  enabled:
    envBoolean(
      "EMAIL_ENABLED",
      true
    ),

  provider:
    envString(
      "EMAIL_PROVIDER",
      "smtp"
    ),

  /* ----------------------------------------------------------
   * SMTP
   * -------------------------------------------------------- */

  smtp: {
    host:
      env.email.host || "",

    port:
      Number(env.email.port) || 587,

    secure:
      envBoolean(
        "EMAIL_SECURE",
        Number(env.email.port) === 465
      ),

    user:
      env.email.user || "",

    password:
      env.email.password || "",

    connectionTimeout:
      envNumber(
        "EMAIL_CONNECTION_TIMEOUT",
        10_000
      ),

    greetingTimeout:
      envNumber(
        "EMAIL_GREETING_TIMEOUT",
        10_000
      ),

    socketTimeout:
      envNumber(
        "EMAIL_SOCKET_TIMEOUT",
        30_000
      ),

    pool:
      envBoolean(
        "EMAIL_POOL",
        true
      ),

    maxConnections:
      envNumber(
        "EMAIL_MAX_CONNECTIONS",
        5
      ),

    maxMessages:
      envNumber(
        "EMAIL_MAX_MESSAGES",
        100
      )
  },

  /* ----------------------------------------------------------
   * SENDER
   * -------------------------------------------------------- */

  sender: {
    from:
      env.email.from ||
      envString(
        "EMAIL_FROM",
        "no-reply@example.com"
      ),

    replyTo:
      envString(
        "EMAIL_REPLY_TO",
        ""
      ),

    name:
      envString(
        "EMAIL_FROM_NAME",
        "GHAR"
      )
  },

  /* ----------------------------------------------------------
   * LIMITS
   * -------------------------------------------------------- */

  limits: {
    maxRecipients:
      envNumber(
        "EMAIL_MAX_RECIPIENTS",
        50
      ),

    maxAttachmentSize:
      envNumber(
        "EMAIL_MAX_ATTACHMENT_SIZE",
        10 * 1024 * 1024
      ),

    maxSubjectLength:
      envNumber(
        "EMAIL_MAX_SUBJECT_LENGTH",
        998
      ),

    maxBodyLength:
      envNumber(
        "EMAIL_MAX_BODY_LENGTH",
        1_000_000
      )
  },

  /* ----------------------------------------------------------
   * AUTHENTICATION EMAILS
   * -------------------------------------------------------- */

  auth: {
    welcome: true,

    verifyEmail:
      true,

    otp:
      envBoolean(
        "OTP_ENABLED",
        true
      ),

    passwordReset:
      true,

    passwordChanged:
      true,

    loginAlert:
      true,

    securityAlert:
      true
  },

  /* ----------------------------------------------------------
   * PROPERTY EMAILS
   * -------------------------------------------------------- */

  property: {
    listed: true,

    approved: true,

    rejected: true,

    updated: true,

    verification: true
  },

  /* ----------------------------------------------------------
   * VISITS
   * -------------------------------------------------------- */

  visits: {
    scheduled: true,

    reminder: true,

    cancelled: true,

    completed: true
  },

  /* ----------------------------------------------------------
   * OFFERS
   * -------------------------------------------------------- */

  offers: {
    received: true,

    accepted: true,

    rejected: true,

    counterOffer: true
  },

  /* ----------------------------------------------------------
   * APPLICATIONS
   * -------------------------------------------------------- */

  applications: {
    submitted: true,

    updated: true,

    approved: true,

    rejected: true
  },

  /* ----------------------------------------------------------
   * DOCUMENTS
   * -------------------------------------------------------- */

  documents: {
    uploaded: true,

    verified: true,

    rejected: true,

    verificationRequired: true
  },

  /* ----------------------------------------------------------
   * VERIFICATION
   * -------------------------------------------------------- */

  verification: {
    identity: true,

    phone: true,

    email: true,

    address: true,

    kyc: true,

    pan: true,

    aadhaar: true,

    ownership: true,

    completed: true
  },

  /* ----------------------------------------------------------
   * PAYMENTS
   * -------------------------------------------------------- */

  payments: {
    success: true,

    failed: true,

    refunded: true,

    invoice: true,

    paymentReminder: true
  },

  /* ----------------------------------------------------------
   * SUBSCRIPTIONS
   * -------------------------------------------------------- */

  subscriptions: {
    started: true,

    renewed: true,

    cancelled: true,

    expired: true,

    paymentFailed: true,

    renewalReminder: true
  },

  /* ----------------------------------------------------------
   * LOANS
   * -------------------------------------------------------- */

  loans: {
    application: true,

    status: true,

    approved: true,

    rejected: true
  },

  /* ----------------------------------------------------------
   * REFERRALS
   * -------------------------------------------------------- */

  referrals: {
    created: true,

    successful: true,

    reward: true
  },

  /* ----------------------------------------------------------
   * SUPPORT
   * -------------------------------------------------------- */

  support: {
    ticketCreated: true,

    ticketUpdated: true,

    ticketResolved: true
  },

  /* ----------------------------------------------------------
   * ADMIN
   * -------------------------------------------------------- */

  admin: {
    alerts: true,

    securityAlerts: true,

    systemAlerts: true,

    fraudAlerts: true,

    moderationAlerts: true
  },

  /* ----------------------------------------------------------
   * TEMPLATES
   * -------------------------------------------------------- */

  templates: {
    welcome:
      "welcome",

    verifyEmail:
      "verify-email",

    otp:
      "otp",

    passwordReset:
      "password-reset",

    passwordChanged:
      "password-changed",

    loginAlert:
      "login-alert",

    securityAlert:
      "security-alert",

    propertyListed:
      "property-listed",

    propertyApproved:
      "property-approved",

    propertyRejected:
      "property-rejected",

    propertyUpdated:
      "property-updated",

    propertyVerification:
      "property-verification",

    visitScheduled:
      "visit-scheduled",

    visitReminder:
      "visit-reminder",

    visitCancelled:
      "visit-cancelled",

    visitCompleted:
      "visit-completed",

    offerReceived:
      "offer-received",

    offerAccepted:
      "offer-accepted",

    offerRejected:
      "offer-rejected",

    counterOffer:
      "counter-offer",

    applicationSubmitted:
      "application-submitted",

    applicationUpdated:
      "application-updated",

    applicationApproved:
      "application-approved",

    applicationRejected:
      "application-rejected",

    documentUploaded:
      "document-uploaded",

    documentVerified:
      "document-verified",

    documentRejected:
      "document-rejected",

    verificationRequired:
      "verification-required",

    paymentSuccess:
      "payment-success",

    paymentFailed:
      "payment-failed",

    paymentRefunded:
      "payment-refunded",

    invoice:
      "invoice",

    subscriptionStarted:
      "subscription-started",

    subscriptionRenewed:
      "subscription-renewed",

    subscriptionCancelled:
      "subscription-cancelled",

    subscriptionExpired:
      "subscription-expired",

    subscriptionPaymentFailed:
      "subscription-payment-failed",

    loanApplication:
      "loan-application",

    loanStatus:
      "loan-status",

    loanApproved:
      "loan-approved",

    loanRejected:
      "loan-rejected",

    referral:
      "referral",

    supportTicketCreated:
      "support-ticket-created",

    supportTicketUpdated:
      "support-ticket-updated",

    supportTicketResolved:
      "support-ticket-resolved",

    adminAlert:
      "admin-alert",

    fraudAlert:
      "fraud-alert",

    moderationAlert:
      "moderation-alert"
  },

  /* ----------------------------------------------------------
   * OTP
   * -------------------------------------------------------- */

  otp: {
    enabled:
      envBoolean(
        "OTP_ENABLED",
        true
      ),

    expiresMinutes:
      envNumber(
        "OTP_EXPIRES_MINUTES",
        10
      ),

    length:
      envNumber(
        "OTP_LENGTH",
        6
      ),

    maxAttempts:
      envNumber(
        "OTP_MAX_ATTEMPTS",
        5
      ),

    resendCooldownSeconds:
      envNumber(
        "OTP_RESEND_COOLDOWN",
        60
      )
  },

  /* ----------------------------------------------------------
   * RETRY
   * -------------------------------------------------------- */

  retry: {
    enabled:
      envBoolean(
        "EMAIL_RETRY_ENABLED",
        true
      ),

    maxAttempts:
      envNumber(
        "EMAIL_MAX_RETRIES",
        3
      ),

    delayMs:
      envNumber(
        "EMAIL_RETRY_DELAY_MS",
        2_000
      )
  },

  /* ----------------------------------------------------------
   * SECURITY
   * -------------------------------------------------------- */

  security: {
    preventHeaderInjection:
      true,

    hideCredentials:
      true,

    neverLogPassword:
      true,

    neverLogOTP:
      true,

    neverLogTokens:
      true,

    neverLogSensitiveDocuments:
      true,

    neverLogMessageContent:
      true,

    allowHtml:
      envBoolean(
        "EMAIL_ALLOW_HTML",
        true
      ),

    allowExternalImages:
      envBoolean(
        "EMAIL_ALLOW_EXTERNAL_IMAGES",
        false
      ),

    requireValidRecipient:
      true,

    requireValidSender:
      true
  },

  /* ----------------------------------------------------------
   * LOGGING
   * -------------------------------------------------------- */

  logging: {
    enabled:
      envBoolean(
        "EMAIL_LOG_ENABLED",
        true
      ),

    logRecipients:
      envBoolean(
        "EMAIL_LOG_RECIPIENTS",
        true
      ),

    logMessageContent:
      false,

    logCredentials:
      false,

    logOtp:
      false,

    logTokens:
      false
  },

  /* ----------------------------------------------------------
   * DEVELOPMENT
   * -------------------------------------------------------- */

  development: {
    logEmails:
      envBoolean(
        "EMAIL_LOG_DEVELOPMENT",
        false
      ),

    disableSending:
      envBoolean(
        "EMAIL_DISABLE_SENDING",
        false
      )
  }
};

/* ============================================================
 * STATUS HELPERS
 * ============================================================ */

/**
 * Check whether SMTP credentials are available.
 *
 * @returns {boolean}
 */
function isSMTPConfigured() {
  return Boolean(
    emailConfig.smtp.host &&
    emailConfig.smtp.user &&
    emailConfig.smtp.password
  );
}

/**
 * Check whether the GHAR email service is enabled.
 *
 * @returns {boolean}
 */
function isEmailEnabled() {
  if (!emailConfig.enabled) {
    return false;
  }

  if (
    emailConfig.development.disableSending &&
    process.env.NODE_ENV === "development"
  ) {
    return false;
  }

  return isSMTPConfigured();
}

/**
 * Check whether OTP email is enabled.
 *
 * @returns {boolean}
 */
function isOTPEmailEnabled() {
  return Boolean(
    isEmailEnabled() &&
    emailConfig.otp.enabled &&
    emailConfig.auth.otp
  );
}

/* ============================================================
 * VALIDATION
 * ============================================================ */

/**
 * Basic email validation.
 *
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (
    typeof email !== "string" ||
    !email.trim()
  ) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email.trim()
  );
}

/**
 * Normalize an email address.
 *
 * @param {string} email
 * @returns {string}
 */
function normalizeEmail(email) {
  if (typeof email !== "string") {
    return "";
  }

  return email
    .trim()
    .toLowerCase();
}

/**
 * Validate recipients.
 *
 * @param {string|string[]} recipients
 * @returns {boolean}
 */
function validateRecipients(recipients) {
  const list = Array.isArray(recipients)
    ? recipients
    : [recipients];

  if (
    list.length === 0 ||
    list.length >
      emailConfig.limits.maxRecipients
  ) {
    return false;
  }

  return list.every((email) =>
    isValidEmail(email)
  );
}

/**
 * Validate email subject.
 *
 * @param {string} subject
 * @returns {boolean}
 */
function isValidSubject(subject) {
  if (typeof subject !== "string") {
    return false;
  }

  const value = subject.trim();

  if (!value) {
    return false;
  }

  if (
    value.length >
    emailConfig.limits.maxSubjectLength
  ) {
    return false;
  }

  /*
   * Prevent CRLF/header injection.
   */
  if (/[\r\n]/.test(value)) {
    return false;
  }

  return true;
}

/* ============================================================
 * TEMPLATE HELPERS
 * ============================================================ */

/**
 * Get a registered email template.
 *
 * @param {string} template
 * @returns {string|null}
 */
function getTemplate(template) {
  if (!template) {
    return null;
  }

  const normalized =
    String(template).trim();

  const templates =
    Object.values(
      emailConfig.templates
    );

  return templates.includes(normalized)
    ? normalized
    : null;
}

/**
 * Check whether a template is enabled.
 *
 * @param {string} template
 * @returns {boolean}
 */
function isTemplateEnabled(template) {
  const normalized =
    String(template || "")
      .trim();

  if (!normalized) {
    return false;
  }

  const templateMap = {
    welcome:
      emailConfig.auth.welcome,

    "verify-email":
      emailConfig.auth.verifyEmail,

    otp:
      emailConfig.auth.otp,

    "password-reset":
      emailConfig.auth.passwordReset,

    "password-changed":
      emailConfig.auth.passwordChanged,

    "login-alert":
      emailConfig.auth.loginAlert,

    "security-alert":
      emailConfig.auth.securityAlert,

    "property-listed":
      emailConfig.property.listed,

    "property-approved":
      emailConfig.property.approved,

    "property-rejected":
      emailConfig.property.rejected,

    "property-updated":
      emailConfig.property.updated,

    "property-verification":
      emailConfig.property.verification,

    "visit-scheduled":
      emailConfig.visits.scheduled,

    "visit-reminder":
      emailConfig.visits.reminder,

    "visit-cancelled":
      emailConfig.visits.cancelled,

    "visit-completed":
      emailConfig.visits.completed,

    "offer-received":
      emailConfig.offers.received,

    "offer-accepted":
      emailConfig.offers.accepted,

    "offer-rejected":
      emailConfig.offers.rejected,

    "counter-offer":
      emailConfig.offers.counterOffer,

    "application-submitted":
      emailConfig.applications.submitted,

    "application-updated":
      emailConfig.applications.updated,

    "application-approved":
      emailConfig.applications.approved,

    "application-rejected":
      emailConfig.applications.rejected,

    "document-uploaded":
      emailConfig.documents.uploaded,

    "document-verified":
      emailConfig.documents.verified,

    "document-rejected":
      emailConfig.documents.rejected,

    "verification-required":
      emailConfig.documents.verificationRequired,

    "payment-success":
      emailConfig.payments.success,

    "payment-failed":
      emailConfig.payments.failed,

    "payment-refunded":
      emailConfig.payments.refunded,

    invoice:
      emailConfig.payments.invoice,

    "subscription-started":
      emailConfig.subscriptions.started,

    "subscription-renewed":
      emailConfig.subscriptions.renewed,

    "subscription-cancelled":
      emailConfig.subscriptions.cancelled,

    "subscription-expired":
      emailConfig.subscriptions.expired,

    "subscription-payment-failed":
      emailConfig.subscriptions.paymentFailed,

    "loan-application":
      emailConfig.loans.application,

    "loan-status":
      emailConfig.loans.status,

    "loan-approved":
      emailConfig.loans.approved,

    "loan-rejected":
      emailConfig.loans.rejected,

    referral:
      emailConfig.referrals.created,

    "support-ticket-created":
      emailConfig.support.ticketCreated,

    "support-ticket-updated":
      emailConfig.support.ticketUpdated,

    "support-ticket-resolved":
      emailConfig.support.ticketResolved,

    "admin-alert":
      emailConfig.admin.alerts,

    "fraud-alert":
      emailConfig.admin.fraudAlerts,

    "moderation-alert":
      emailConfig.admin.moderationAlerts
  };

  return Boolean(
    templateMap[normalized]
  );
}

/* ============================================================
 * CONFIGURATION VALIDATION
 * ============================================================ */

/**
 * Validate email configuration.
 *
 * Does not throw when SMTP is intentionally
 * absent during development.
 *
 * @returns {Object}
 */
function validateEmailConfig() {
  const smtpConfigured =
    isSMTPConfigured();

  if (!emailConfig.enabled) {
    return {
      enabled: false,
      configured: smtpConfigured,
      provider:
        emailConfig.provider,
      message:
        "GHAR email service is disabled."
    };
  }

  if (!smtpConfigured) {
    return {
      enabled: false,
      configured: false,
      provider:
        emailConfig.provider,
      message:
        "GHAR email service is enabled but SMTP credentials are not configured."
    };
  }

  if (
    !isValidEmail(
      emailConfig.sender.from
    )
  ) {
    return {
      enabled: false,
      configured: true,
      provider:
        emailConfig.provider,
      message:
        "EMAIL_FROM is not a valid email address."
    };
  }

  return {
    enabled:
      isEmailEnabled(),

    configured:
      true,

    provider:
      emailConfig.provider,

    host:
      emailConfig.smtp.host,

    port:
      emailConfig.smtp.port,

    secure:
      emailConfig.smtp.secure,

    from:
      emailConfig.sender.from
  };
}

/* ============================================================
 * SAFE DIAGNOSTICS
 * ============================================================ */

/**
 * Return configuration suitable for
 * health checks / admin diagnostics.
 *
 * NEVER exposes SMTP credentials.
 *
 * @returns {Object}
 */
function getSafeEmailConfig() {
  return {
    enabled:
      isEmailEnabled(),

    configured:
      isSMTPConfigured(),

    provider:
      emailConfig.provider,

    host:
      emailConfig.smtp.host,

    port:
      emailConfig.smtp.port,

    secure:
      emailConfig.smtp.secure,

    userConfigured:
      Boolean(
        emailConfig.smtp.user
      ),

    passwordConfigured:
      Boolean(
        emailConfig.smtp.password
      ),

    from:
      emailConfig.sender.from,

    replyTo:
      emailConfig.sender.replyTo,

    pool:
      emailConfig.smtp.pool,

    maxConnections:
      emailConfig.smtp.maxConnections,

    otpEnabled:
      isOTPEmailEnabled()
  };
}

/* ============================================================
 * EXPORTS
 * ============================================================ */

module.exports = {
  emailConfig,

  isEmailEnabled,

  isSMTPConfigured,

  isOTPEmailEnabled,

  getSender:
    () => emailConfig.sender.from,

  isValidEmail,

  normalizeEmail,

  validateRecipients,

  isValidSubject,

  getTemplate,

  isTemplateEnabled,

  validateEmailConfig,

  getSafeEmailConfig
};