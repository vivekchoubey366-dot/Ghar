'use strict';

/**
 * ============================================================
 * GHAR - Email Configuration
 * ============================================================
 *
 * Central email/SMTP configuration for GHAR.
 *
 * Responsibilities:
 * - SMTP configuration
 * - TLS/security configuration
 * - Sender identity
 * - Connection timeouts
 * - Email feature flags
 * - Verification/reset/notification settings
 *
 * Actual email sending belongs in services/email.service.js
 * ============================================================
 */

const nodemailer = require('nodemailer');
const env = require('./env');

/* ============================================================
   1. BASIC CONFIGURATION
   ============================================================ */

const enabled =
  Boolean(
    env.email.host &&
    env.email.user &&
    env.email.password
  );

const host =
  env.email.host || null;

const port =
  Number(env.email.port) || 587;

const secure =
  Boolean(env.email.secure);

const user =
  env.email.user || null;

const password =
  env.email.password || null;

const from =
  env.email.from ||
  'GHAR <no-reply@ghar.com>';

/* ============================================================
   2. TLS CONFIGURATION
   ============================================================ */

const rejectUnauthorized =
  process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !==
  'false';

const tls = {
  rejectUnauthorized
};

/* ============================================================
   3. CONNECTION SETTINGS
   ============================================================ */

const connectionTimeout =
  Number(
    process.env.EMAIL_CONNECTION_TIMEOUT ||
    10000
  );

const greetingTimeout =
  Number(
    process.env.EMAIL_GREETING_TIMEOUT ||
    10000
  );

const socketTimeout =
  Number(
    process.env.EMAIL_SOCKET_TIMEOUT ||
    20000
  );

/* ============================================================
   4. RETRY SETTINGS
   ============================================================ */

const maxRetries =
  Number(
    process.env.EMAIL_MAX_RETRIES ||
    3
  );

const retryDelayMs =
  Number(
    process.env.EMAIL_RETRY_DELAY_MS ||
    1000
  );

/* ============================================================
   5. EMAIL FEATURES
   ============================================================ */

const features = {
  verification:
    process.env.EMAIL_FEATURE_VERIFICATION !==
    'false',

  passwordReset:
    process.env.EMAIL_FEATURE_PASSWORD_RESET !==
    'false',

  welcome:
    process.env.EMAIL_FEATURE_WELCOME !==
    'false',

  propertyAlerts:
    process.env.EMAIL_FEATURE_PROPERTY_ALERTS !==
    'false',

  applicationUpdates:
    process.env.EMAIL_FEATURE_APPLICATION_UPDATES !==
    'false',

  paymentReceipts:
    process.env.EMAIL_FEATURE_PAYMENT_RECEIPTS !==
    'false',

  loanUpdates:
    process.env.EMAIL_FEATURE_LOAN_UPDATES !==
    'false',

  adminNotifications:
    process.env.EMAIL_FEATURE_ADMIN_NOTIFICATIONS !==
    'false',

  marketing:
    process.env.EMAIL_FEATURE_MARKETING ===
    'true'
};

/* ============================================================
   6. EMAIL LIMITS
   ============================================================ */

const limits = {
  verificationExpiryMinutes:
    Number(
      process.env.EMAIL_VERIFICATION_EXPIRY_MINUTES ||
      30
    ),

  passwordResetExpiryMinutes:
    Number(
      process.env.EMAIL_PASSWORD_RESET_EXPIRY_MINUTES ||
      30
    ),

  maxRecipients:
    Number(
      process.env.EMAIL_MAX_RECIPIENTS ||
      50
    ),

  maxAttachmentSizeMB:
    Number(
      process.env.EMAIL_MAX_ATTACHMENT_SIZE_MB ||
      10
    )
};

/* ============================================================
   7. EMAIL BRANDING
   ============================================================ */

const branding = {
  applicationName:
    process.env.EMAIL_APP_NAME ||
    'GHAR',

  supportEmail:
    process.env.EMAIL_SUPPORT_ADDRESS ||
    from,

  supportName:
    process.env.EMAIL_SUPPORT_NAME ||
    'GHAR Support',

  websiteUrl:
    process.env.EMAIL_WEBSITE_URL ||
    env.app.url,

  logoUrl:
    process.env.EMAIL_LOGO_URL ||
    null,

  primaryColor:
    process.env.EMAIL_PRIMARY_COLOR ||
    '#162D25'
};

/* ============================================================
   8. CREATE SMTP TRANSPORTER
   ============================================================ */

let transporter = null;

if (enabled) {
  transporter =
    nodemailer.createTransport({
      host,

      port,

      secure,

      auth: {
        user,
        pass: password
      },

      tls,

      connectionTimeout,

      greetingTimeout,

      socketTimeout,

      pool:
        process.env.EMAIL_POOL !==
        'false',

      maxConnections:
        Number(
          process.env.EMAIL_MAX_CONNECTIONS ||
          5
        ),

      maxMessages:
        Number(
          process.env.EMAIL_MAX_MESSAGES ||
          100
        )
    });
}

/* ============================================================
   9. VERIFY SMTP CONNECTION
   ============================================================ */

async function verifyConnection() {
  if (!transporter) {
    return {
      success: false,
      configured: false,
      message:
        'Email service is not configured.'
    };
  }

  try {
    await transporter.verify();

    return {
      success: true,
      configured: true,
      message:
        'SMTP connection verified.'
    };
  } catch (error) {
    return {
      success: false,
      configured: true,
      message:
        error.message
    };
  }
}

/* ============================================================
   10. SEND EMAIL
   ============================================================ */

async function sendMail(options = {}) {
  if (!transporter) {
    throw new Error(
      'GHAR email service is not configured.'
    );
  }

  if (!options.to) {
    throw new Error(
      'Email recipient is required.'
    );
  }

  if (!options.subject) {
    throw new Error(
      'Email subject is required.'
    );
  }

  const message = {
    from:
      options.from ||
      from,

    to:
      options.to,

    cc:
      options.cc,

    bcc:
      options.bcc,

    replyTo:
      options.replyTo,

    subject:
      options.subject,

    text:
      options.text,

    html:
      options.html,

    attachments:
      options.attachments
  };

  return transporter.sendMail(
    message
  );
}

/* ============================================================
   11. FEATURE CHECK
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
   12. SAFE CONFIGURATION
   ============================================================ */

function getSafeConfig() {
  return {
    enabled,

    host,

    port,

    secure,

    configured:
      Boolean(
        host &&
        user &&
        password
      ),

    sender:
      from,

    connection: {
      connectionTimeout,

      greetingTimeout,

      socketTimeout
    },

    retry: {
      maxRetries,

      retryDelayMs
    },

    features: {
      ...features
    },

    limits: {
      ...limits
    },

    branding: {
      applicationName:
        branding.applicationName,

      supportEmail:
        branding.supportEmail,

      supportName:
        branding.supportName,

      websiteUrl:
        branding.websiteUrl,

      logoConfigured:
        Boolean(
          branding.logoUrl
        )
    }
  };
}

/* ============================================================
   13. VALIDATION
   ============================================================ */

function validate() {
  const warnings = [];
  const errors = [];

  if (!enabled) {
    warnings.push(
      '[GHAR EMAIL] SMTP email service is not configured.'
    );
  }

  if (
    env.app.environment === 'production' &&
    !enabled
  ) {
    warnings.push(
      '[GHAR EMAIL] Production email functionality will not work until SMTP credentials are configured.'
    );
  }

  if (
    port <= 0 ||
    port > 65535
  ) {
    errors.push(
      'EMAIL_PORT must be a valid TCP port.'
    );
  }

  if (
    maxRetries < 0
  ) {
    errors.push(
      'EMAIL_MAX_RETRIES cannot be negative.'
    );
  }

  if (
    limits.maxRecipients < 1
  ) {
    errors.push(
      'EMAIL_MAX_RECIPIENTS must be greater than zero.'
    );
  }

  if (
    limits.verificationExpiryMinutes <= 0
  ) {
    errors.push(
      'EMAIL_VERIFICATION_EXPIRY_MINUTES must be greater than zero.'
    );
  }

  if (
    limits.passwordResetExpiryMinutes <= 0
  ) {
    errors.push(
      'EMAIL_PASSWORD_RESET_EXPIRY_MINUTES must be greater than zero.'
    );
  }

  for (
    const warning of warnings
  ) {
    console.warn(warning);
  }

  if (
    errors.length > 0
  ) {
    throw new Error(
      `[GHAR EMAIL CONFIG ERROR]\n- ${errors.join('\n- ')}`
    );
  }

  return true;
}

/* ============================================================
   14. EXPORT
   ============================================================ */

const email = {
  enabled,

  host,

  port,

  secure,

  user,

  password,

  from,

  tls,

  connection: {
    connectionTimeout,

    greetingTimeout,

    socketTimeout
  },

  retry: {
    maxRetries,

    retryDelayMs
  },

  features,

  limits,

  branding,

  transporter,

  verifyConnection,

  sendMail,

  isFeatureEnabled,

  getSafeConfig,

  validate
};

/* ============================================================
   15. VALIDATE ON LOAD
   ============================================================ */

validate();

/* ============================================================
   16. EXPORT CONFIGURATION
   ============================================================ */

module.exports = email;