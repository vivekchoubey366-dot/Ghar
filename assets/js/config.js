/* ============================================================
   GHAR REAL ESTATE PLATFORM
   assets/js/config.js

   Central frontend configuration
   Compatible with:
   - Local development
   - Render
   - Cloudflare
   - Same-origin deployment
   - Separate API deployment

   IMPORTANT:
   Never put secret keys here.
   Frontend config is publicly visible.
   ============================================================ */

"use strict";

(function (window) {

  // ==========================================================
  // ENVIRONMENT
  // ==========================================================

  const hostname =
    window.location.hostname;

  const protocol =
    window.location.protocol;

  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1";

  const isFileProtocol =
    protocol === "file:";

  const isHttps =
    protocol === "https:";

  const isProduction =
    !isLocalhost &&
    !isFileProtocol;

  const isDevelopment =
    isLocalhost ||
    isFileProtocol;

  // ==========================================================
  // API CONFIGURATION
  // ==========================================================

  /*
   * Recommended production setup:
   *
   * Website:
   * https://yourdomain.com
   *
   * API:
   * https://yourdomain.com/api
   *
   * Because the frontend and Express server are served
   * from the same application, the default API base is
   * simply "/api".
   *
   * If API is hosted separately, set:
   *
   * window.GHAR_API_URL =
   * "https://api.yourdomain.com/api";
   *
   * BEFORE this script loads.
   */

  const configuredApiUrl =
    window.GHAR_API_URL ||
    "";

  const defaultApiBase =
    isFileProtocol
      ? "http://localhost:3000/api"
      : "/api";

  const API_BASE_URL =
    configuredApiUrl ||
    defaultApiBase;

  // ==========================================================
  // WEBSITE URL
  // ==========================================================

  const configuredSiteUrl =
    window.GHAR_SITE_URL ||
    "";

  const SITE_URL =
    configuredSiteUrl ||
    (
      isFileProtocol
        ? "http://localhost:3000"
        : `${protocol}//${hostname}`
    );

  // ==========================================================
  // API ENDPOINTS
  // ==========================================================

  const API = {

    BASE:
      API_BASE_URL,

    HEALTH:
      `${API_BASE_URL}/health`,

    AUTH:
      `${API_BASE_URL}/auth`,

    USERS:
      `${API_BASE_URL}/users`,

    PROPERTIES:
      `${API_BASE_URL}/properties`,

    SEARCH:
      `${API_BASE_URL}/search`,

    VISITS:
      `${API_BASE_URL}/visits`,

    OFFERS:
      `${API_BASE_URL}/offers`,

    APPLICATIONS:
      `${API_BASE_URL}/applications`,

    DOCUMENTS:
      `${API_BASE_URL}/documents`,

    VERIFICATION:
      `${API_BASE_URL}/verification`,

    PAYMENTS:
      `${API_BASE_URL}/payments`,

    SUBSCRIPTIONS:
      `${API_BASE_URL}/subscriptions`,

    LOANS:
      `${API_BASE_URL}/loans`,

    REFERRALS:
      `${API_BASE_URL}/referrals`,

    NOTIFICATIONS:
      `${API_BASE_URL}/notifications`,

    MESSAGES:
      `${API_BASE_URL}/messages`,

    SUPPORT:
      `${API_BASE_URL}/support`,

    AI:
      `${API_BASE_URL}/ai`,

    ADMIN:
      `${API_BASE_URL}/admin`,

    ADMIN_AI:
      `${API_BASE_URL}/admin/ai`,

    ROUTES:
      `${API_BASE_URL}/routes`

  };

  // ==========================================================
  // AI ENDPOINTS
  // ==========================================================

  const AI = {

    BASE:
      API.AI,

    HEALTH:
      `${API.AI}/health`,

    MODULES:
      `${API.AI}/modules`,

    SEARCH:
      `${API.AI}/search`,

    RECOMMENDATIONS:
      `${API.AI}/recommendations`,

    PRICE:
      `${API.AI}/price`,

    INVESTMENT:
      `${API.AI}/investment`,

    LOAN:
      `${API.AI}/loan`,

    DOCUMENTS:
      `${API.AI}/documents`,

    PROPERTY_DESCRIPTION:
      `${API.AI}/property-description`,

    RENTAL:
      `${API.AI}/rental`,

    MODERATION:
      `${API.AI}/moderation`,

    CHAT:
      `${API.AI}/chat`

  };

  // ==========================================================
  // AUTH ENDPOINTS
  // ==========================================================

  const AUTH = {

    BASE:
      API.AUTH,

    LOGIN:
      `${API.AUTH}/login`,

    REGISTER:
      `${API.AUTH}/register`,

    SIGNUP:
      `${API.AUTH}/signup`,

    LOGOUT:
      `${API.AUTH}/logout`,

    REFRESH:
      `${API.AUTH}/refresh`,

    ME:
      `${API.AUTH}/me`,

    OTP_SEND:
      `${API.AUTH}/otp/send`,

    OTP_VERIFY:
      `${API.AUTH}/otp/verify`,

    FORGOT_PASSWORD:
      `${API.AUTH}/forgot-password`,

    RESET_PASSWORD:
      `${API.AUTH}/reset-password`,

    VERIFY_EMAIL:
      `${API.AUTH}/verify-email`,

    RESEND_VERIFICATION:
      `${API.AUTH}/resend-verification`

  };

  // ==========================================================
  // PROPERTY ENDPOINTS
  // ==========================================================

  const PROPERTY = {

    BASE:
      API.PROPERTIES,

    LIST:
      API.PROPERTIES,

    DETAIL:
      id =>
        `${API.PROPERTIES}/${encodeURIComponent(id)}`,

    CREATE:
      API.PROPERTIES,

    UPDATE:
      id =>
        `${API.PROPERTIES}/${encodeURIComponent(id)}`,

    DELETE:
      id =>
        `${API.PROPERTIES}/${encodeURIComponent(id)}`,

    SEARCH:
      API.SEARCH,

    FEATURED:
      `${API.PROPERTIES}/featured`,

    POPULAR:
      `${API.PROPERTIES}/popular`,

    NEARBY:
      `${API.PROPERTIES}/nearby`,

    CATEGORIES:
      `${API.PROPERTIES}/categories`

  };

  // ==========================================================
  // USER ENDPOINTS
  // ==========================================================

  const USER = {

    BASE:
      API.USERS,

    ME:
      `${API.USERS}/me`,

    PROFILE:
      `${API.USERS}/profile`,

    UPDATE_PROFILE:
      `${API.USERS}/profile`,

    PREFERENCES:
      `${API.USERS}/preferences`,

    SETTINGS:
      `${API.USERS}/settings`

  };

  // ==========================================================
  // BUYER
  // ==========================================================

  const BUYER = {

    DASHBOARD:
      "/buyer/dashboard.html",

    PROFILE:
      "/buyer/profile.html",

    PROPERTIES:
      "/buyer/properties.html",

    SEARCH:
      "/buyer/search.html",

    SAVED:
      "/buyer/saved-properties.html",

    FAVOURITES:
      "/buyer/favourites.html",

    VISITS:
      "/buyer/visits.html",

    OFFERS:
      "/buyer/offers.html",

    APPLICATIONS:
      "/buyer/applications.html",

    DOCUMENTS:
      "/buyer/documents.html",

    PAYMENTS:
      "/buyer/payments.html",

    LOANS:
      "/buyer/loans.html",

    REFERRALS:
      "/buyer/referrals.html",

    MESSAGES:
      "/buyer/messages.html",

    NOTIFICATIONS:
      "/buyer/notifications.html",

    SUPPORT:
      "/buyer/support.html",

    SETTINGS:
      "/buyer/settings.html",

    AI: {

      ADVISOR:
        "/buyer/ai/advisor.html",

      RECOMMENDATIONS:
        "/buyer/ai/recommendations.html",

      AFFORDABILITY:
        "/buyer/ai/affordability.html",

      INVESTMENT:
        "/buyer/ai/investment.html",

      CHAT:
        "/buyer/ai/chat.html"

    }

  };

  // ==========================================================
  // SELLER
  // ==========================================================

  const SELLER = {

    DASHBOARD:
      "/seller/dashboard.html",

    PROFILE:
      "/seller/profile.html",

    LIST_PROPERTY:
      "/seller/list-property.html",

    PROPERTIES:
      "/seller/properties.html",

    PROPERTY_DETAILS:
      "/seller/property-details.html",

    EDIT_PROPERTY:
      "/seller/edit-property.html",

    PROPERTY_APPROVAL:
      "/seller/property-approval.html",

    VISITS:
      "/seller/visits.html",

    LEADS:
      "/seller/leads.html",

    OFFERS:
      "/seller/offers.html",

    APPLICATIONS:
      "/seller/applications.html",

    DOCUMENTS:
      "/seller/documents.html",

    PAYMENTS:
      "/seller/payments.html",

    REFERRALS:
      "/seller/referrals.html",

    MESSAGES:
      "/seller/messages.html",

    NOTIFICATIONS:
      "/seller/notifications.html",

    SUPPORT:
      "/seller/support.html",

    SETTINGS:
      "/seller/settings.html"

  };

  // ==========================================================
  // TENANT
  // ==========================================================

  const TENANT = {

    DASHBOARD:
      "/tenant/dashboard.html",

    PROFILE:
      "/tenant/profile.html",

    PROPERTIES:
      "/tenant/properties.html",

    PROPERTY_DETAILS:
      "/tenant/property-details.html",

    APPLICATIONS:
      "/tenant/applications.html",

    VISITS:
      "/tenant/visits.html",

    RENTAL_AGREEMENTS:
      "/tenant/rental-agreements.html",

    DOCUMENTS:
      "/tenant/documents.html",

    PAYMENTS:
      "/tenant/payments.html",

    MAINTENANCE:
      "/tenant/maintenance.html",

    MESSAGES:
      "/tenant/messages.html",

    NOTIFICATIONS:
      "/tenant/notifications.html",

    SETTINGS:
      "/tenant/settings.html",

    AI: {

      RENTAL_ADVISOR:
        "/tenant/ai/rental-advisor.html",

      RENT_ESTIMATOR:
        "/tenant/ai/rent-estimator.html",

      CHAT:
        "/tenant/ai/chat.html"

    }

  };

  // ==========================================================
  // ADMIN
  // ==========================================================

  const ADMIN = {

    LOGIN:
      "/admin/admin-login.html",

    AUTH:
      "/admin/admin-auth.html",

    DASHBOARD:
      "/admin/admin-dashboard.html",

    CONTROL_CENTER:
      "/admin/control-center.html",

    USERS:
      "/admin/users.html",

    CREATE_USER:
      "/admin/create-user.html",

    BUYERS:
      "/admin/buyers.html",

    SELLERS:
      "/admin/sellers.html",

    TENANTS:
      "/admin/tenants.html",

    PROPERTIES:
      "/admin/properties.html",

    LIST_PROPERTY:
      "/admin/list-property.html",

    EDIT_PROPERTY:
      "/admin/edit-property.html",

    PROPERTY_APPROVAL:
      "/admin/property-approval.html",

    LEADS:
      "/admin/leads.html",

    VISITS:
      "/admin/visits.html",

    OFFERS:
      "/admin/offers.html",

    APPLICATIONS:
      "/admin/applications.html",

    DOCUMENTS:
      "/admin/documents.html",

    PAYMENTS:
      "/admin/payments.html",

    REFERRALS:
      "/admin/referrals.html",

    SUPPORT:
      "/admin/support.html",

    NOTIFICATIONS:
      "/admin/notifications.html",

    REPORTS:
      "/admin/reports.html",

    ANALYTICS:
      "/admin/analytics.html",

    SETTINGS:
      "/admin/settings.html",

    SECURITY:
      "/admin/security.html",

    AUDIT_LOGS:
      "/admin/audit-logs.html",

    AI: {

      DASHBOARD:
        "/admin/ai/ai-dashboard.html",

      SETTINGS:
        "/admin/ai/ai-settings.html",

      MODELS:
        "/admin/ai/ai-models.html",

      PROMPTS:
        "/admin/ai/ai-prompts.html",

      USAGE:
        "/admin/ai/ai-usage.html",

      MODERATION:
        "/admin/ai/ai-moderation.html",

      LOGS:
        "/admin/ai/ai-logs.html"

    }

  };

  // ==========================================================
  // DOCUMENTS
  // ==========================================================

  const DOCUMENTS = {

    BASE:
      API.DOCUMENTS,

    UPLOAD:
      `${API.DOCUMENTS}/upload`,

    VERIFY:
      `${API.DOCUMENTS}/verification`,

    STATUS:
      `${API.DOCUMENTS}/status`,

    DETAILS:
      id =>
        `${API.DOCUMENTS}/${encodeURIComponent(id)}`,

    SCANNER:
      `${API.DOCUMENTS}/scanner`,

    VAULT:
      `${API.DOCUMENTS}/vault`

  };

  // ==========================================================
  // VERIFICATION
  // ==========================================================

  const VERIFICATION = {

    BASE:
      API.VERIFICATION,

    IDENTITY:
      `${API.VERIFICATION}/identity`,

    PHONE:
      `${API.VERIFICATION}/phone`,

    EMAIL:
      `${API.VERIFICATION}/email`,

    ADDRESS:
      `${API.VERIFICATION}/address`,

    KYC:
      `${API.VERIFICATION}/kyc`,

    PAN:
      `${API.VERIFICATION}/pan`,

    AADHAAR:
      `${API.VERIFICATION}/aadhaar`,

    OWNERSHIP:
      `${API.VERIFICATION}/ownership`,

    STATUS:
      `${API.VERIFICATION}/status`,

    LEVELS:
      `${API.VERIFICATION}/levels`

  };

  // ==========================================================
  // PAYMENTS
  // ==========================================================

  const PAYMENTS = {

    BASE:
      API.PAYMENTS,

    CHECKOUT:
      `${API.PAYMENTS}/checkout`,

    SUCCESS:
      `${API.PAYMENTS}/success`,

    FAILED:
      `${API.PAYMENTS}/failed`,

    HISTORY:
      `${API.PAYMENTS}/history`,

    INVOICES:
      `${API.PAYMENTS}/invoices`,

    SUBSCRIPTIONS:
      `${API.PAYMENTS}/subscriptions`

  };

  // ==========================================================
  // SUBSCRIPTIONS
  // ==========================================================

  const SUBSCRIPTIONS = {

    BASE:
      API.SUBSCRIPTIONS,

    PLANS:
      `${API.SUBSCRIPTIONS}/plans`,

    SCHEMA:
      `${API.SUBSCRIPTIONS}/schema`,

    CURRENT:
      `${API.SUBSCRIPTIONS}/current`,

    CREATE:
      `${API.SUBSCRIPTIONS}/create`,

    CANCEL:
      `${API.SUBSCRIPTIONS}/cancel`,

    UPGRADE:
      `${API.SUBSCRIPTIONS}/upgrade`,

    DOWNGRADE:
      `${API.SUBSCRIPTIONS}/downgrade`

  };

  // ==========================================================
  // LOANS
  // ==========================================================

  const LOANS = {

    BASE:
      API.LOANS,

    ELIGIBILITY:
      `${API.LOANS}/eligibility`,

    CALCULATOR:
      `${API.LOANS}/calculator`,

    APPLICATIONS:
      `${API.LOANS}/applications`,

    DETAILS:
      id =>
        `${API.LOANS}/applications/${encodeURIComponent(id)}`,

    STATUS:
      `${API.LOANS}/status`

  };

  // ==========================================================
  // VISITS
  // ==========================================================

  const VISITS = {

    BASE:
      API.VISITS,

    SCHEDULE:
      `${API.VISITS}/schedule`,

    UPCOMING:
      `${API.VISITS}/upcoming`,

    COMPLETED:
      `${API.VISITS}/completed`,

    HISTORY:
      `${API.VISITS}/history`

  };

  // ==========================================================
  // OFFERS
  // ==========================================================

  const OFFERS = {

    BASE:
      API.OFFERS,

    CREATE:
      API.OFFERS,

    DETAIL:
      id =>
        `${API.OFFERS}/${encodeURIComponent(id)}`,

    ACCEPT:
      id =>
        `${API.OFFERS}/${encodeURIComponent(id)}/accept`,

    REJECT:
      id =>
        `${API.OFFERS}/${encodeURIComponent(id)}/reject`

  };

  // ==========================================================
  // APPLICATIONS
  // ==========================================================

  const APPLICATIONS = {

    BASE:
      API.APPLICATIONS,

    CREATE:
      API.APPLICATIONS,

    DETAIL:
      id =>
        `${API.APPLICATIONS}/${encodeURIComponent(id)}`,

    STATUS:
      id =>
        `${API.APPLICATIONS}/${encodeURIComponent(id)}/status`

  };

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  const NOTIFICATIONS = {

    BASE:
      API.NOTIFICATIONS,

    LIST:
      API.NOTIFICATIONS,

    READ:
      id =>
        `${API.NOTIFICATIONS}/${encodeURIComponent(id)}/read`,

    READ_ALL:
      `${API.NOTIFICATIONS}/read-all`,

    UNREAD:
      `${API.NOTIFICATIONS}/unread`

  };

  // ==========================================================
  // MESSAGES
  // ==========================================================

  const MESSAGES = {

    BASE:
      API.MESSAGES,

    LIST:
      API.MESSAGES,

    CONVERSATIONS:
      `${API.MESSAGES}/conversations`,

    SEND:
      `${API.MESSAGES}/send`,

    CONVERSATION:
      id =>
        `${API.MESSAGES}/conversation/${encodeURIComponent(id)}`

  };

  // ==========================================================
  // SUPPORT
  // ==========================================================

  const SUPPORT = {

    BASE:
      API.SUPPORT,

    TICKETS:
      `${API.SUPPORT}/tickets`,

    CREATE:
      `${API.SUPPORT}/tickets`,

    DETAIL:
      id =>
        `${API.SUPPORT}/tickets/${encodeURIComponent(id)}`,

    KNOWLEDGE_BASE:
      `${API.SUPPORT}/knowledge-base`

  };

  // ==========================================================
  // REFERRALS
  // ==========================================================

  const REFERRALS = {

    BASE:
      API.REFERRALS,

    LIST:
      API.REFERRALS,

    CREATE:
      API.REFERRALS,

    STATUS:
      `${API.REFERRALS}/status`

  };

  // ==========================================================
  // UPLOAD CONFIG
  // ==========================================================

  const UPLOADS = {

    BASE:
      "/uploads",

    PROPERTY_IMAGES:
      "/uploads/property-images/",

    PROPERTY_VIDEOS:
      "/uploads/property-videos/",

    FLOOR_PLANS:
      "/uploads/floor-plans/",

    PROFILE_IMAGES:
      "/uploads/profile-images/",

    DOCUMENTS:
      "/uploads/documents/",

    AGREEMENTS:
      "/uploads/agreements/",

    VERIFICATION:
      "/uploads/verification/"

  };

  // ==========================================================
  // VERIFICATION LEVELS
  // ==========================================================

  const VERIFICATION_LEVELS = Object.freeze({

    UNVERIFIED:
      "UNVERIFIED",

    BASIC_VERIFIED:
      "BASIC_VERIFIED",

    OWNER_VERIFIED:
      "OWNER_VERIFIED",

    DOCUMENT_VERIFIED:
      "DOCUMENT_VERIFIED",

    PROPERTY_VERIFIED:
      "PROPERTY_VERIFIED"

  });

  // ==========================================================
  // LEAD STATUSES
  // ==========================================================

  const LEAD_STATUSES = Object.freeze({

    NEW:
      "NEW",

    CONTACTED:
      "CONTACTED",

    INTERESTED:
      "INTERESTED",

    VISIT_SCHEDULED:
      "VISIT_SCHEDULED",

    NEGOTIATION:
      "NEGOTIATION",

    CONVERTED:
      "CONVERTED",

    LOST:
      "LOST"

  });

  // ==========================================================
  // SUBSCRIPTION PLANS
  // ==========================================================

  const SUBSCRIPTION_PLANS = Object.freeze({

    FREE:
      "FREE",

    BUYER_PLUS:
      "BUYER_PLUS",

    SELLER_PRO:
      "SELLER_PRO",

    AGENT_PRO:
      "AGENT_PRO",

    BUSINESS:
      "BUSINESS"

  });

  // ==========================================================
  // SUBSCRIPTION STATUSES
  // ==========================================================

  const SUBSCRIPTION_STATUS = Object.freeze({

    ACTIVE:
      "ACTIVE",

    TRIAL:
      "TRIAL",

    PENDING:
      "PENDING",

    PAUSED:
      "PAUSED",

    CANCELLED:
      "CANCELLED",

    EXPIRED:
      "EXPIRED",

    FAILED:
      "FAILED"

  });

  // ==========================================================
  // USER ROLES
  // ==========================================================

  const ROLES = Object.freeze({

    BUYER:
      "BUYER",

    SELLER:
      "SELLER",

    TENANT:
      "TENANT",

    AGENT:
      "AGENT",

    ADMIN:
      "ADMIN",

    SUPER_ADMIN:
      "SUPER_ADMIN"

  });

  // ==========================================================
  // STORAGE KEYS
  // ==========================================================

  const STORAGE_KEYS = Object.freeze({

    ACCESS_TOKEN:
      "ghar_access_token",

    REFRESH_TOKEN:
      "ghar_refresh_token",

    USER:
      "ghar_user",

    ROLE:
      "ghar_role",

    THEME:
      "ghar_theme",

    LANGUAGE:
      "ghar_language",

    SESSION:
      "ghar_session",

    FAVOURITES:
      "ghar_favourites",

    SEARCHES:
      "ghar_searches",

    COMPARE:
      "ghar_compare",

    CART:
      "ghar_cart"

  });

  // ==========================================================
  // FRONTEND ROUTES
  // ==========================================================

  const PAGES = {

    HOME:
      "/index.html",

    ABOUT:
      "/about.html",

    PROPERTIES:
      "/properties.html",

    PROPERTY_DETAILS:
      "/property-details.html",

    MARKETPLACE:
      "/marketplace.html",

    MAP:
      "/map.html",

    COMPARE:
      "/compare.html",

    FAVOURITES:
      "/favourites.html",

    OFFERS:
      "/offers.html",

    SEARCHES:
      "/property-searches.html",

    NOTIFICATIONS:
      "/notifications.html",

    REFERRALS:
      "/referrals.html",

    DASHBOARD:
      "/dashboard.html",

    PROFILE:
      "/profile.html",

    LOGIN:
      "/login.html",

    SIGNUP:
      "/sign-up.html",

    REGISTRATION:
      "/registration.html",

    ROLE_SELECTION:
      "/role-selection.html",

    OTP_LOGIN:
      "/otp-login.html",

    FORGOT_PASSWORD:
      "/forgot-password.html",

    RESET_PASSWORD:
      "/reset-password.html",

    VERIFY_EMAIL:
      "/verify-email.html",

    AI:
      "/ai.html",

    AI_ADVISOR:
      "/ai-property-advisor.html",

    AI_SEARCH:
      "/ai-property-search.html",

    AI_PRICE:
      "/ai-price-estimator.html",

    AI_INVESTMENT:
      "/ai-investment-advisor.html",

    AI_LOAN:
      "/ai-loan-advisor.html",

    AI_DOCUMENT:
      "/ai-document-assistant.html",

    AI_DESCRIPTION:
      "/ai-property-description.html",

    AI_CHAT:
      "/ai-chat.html",

    HELP:
      "/help.html",

    HELP_CENTRE:
      "/help-centre.html",

    CONTACT:
      "/contact.html",

    EDUCATION:
      "/education.html",

    CAREERS:
      "/careers.html",

    TERMS:
      "/terms.html",

    PRIVACY:
      "/privacy.html",

    SECURITY:
      "/security.html",

    ACCESSIBILITY:
      "/accessibility.html",

    COOKIE_POLICY:
      "/cookie-policy.html",

    REFUND_POLICY:
      "/refund-policy.html",

    OFFLINE:
      "/offline.html",

    ERROR_400:
      "/400.html",

    ERROR_404:
      "/404.html"

  };

  // ==========================================================
  // APPLICATION SETTINGS
  // ==========================================================

  const SETTINGS = Object.freeze({

    APP_NAME:
      "GHAR",

    APP_VERSION:
      "1.0.0",

    DEFAULT_LANGUAGE:
      "en",

    DEFAULT_ROLE:
      "BUYER",

    REQUEST_TIMEOUT:
      30000,

    UPLOAD_TIMEOUT:
      120000,

    MAX_UPLOAD_SIZE:
      10 * 1024 * 1024,

    PROPERTY_IMAGE_MAX_SIZE:
      10 * 1024 * 1024,

    DOCUMENT_MAX_SIZE:
      20 * 1024 * 1024,

    PAGINATION_LIMIT:
      20,

    SEARCH_DEBOUNCE:
      350,

    TOKEN_REFRESH_BUFFER:
      60000

  });

  // ==========================================================
  // FEATURE FLAGS
  // ==========================================================

  const FEATURES = Object.freeze({

    AI:
      true,

    AI_CHAT:
      true,

    AI_PROPERTY_SEARCH:
      true,

    AI_RECOMMENDATIONS:
      true,

    AI_PRICE_ESTIMATION:
      true,

    AI_INVESTMENT:
      true,

    AI_LOAN:
      true,

    AI_DOCUMENTS:
      true,

    AI_PROPERTY_DESCRIPTION:
      true,

    AI_RENTAL:
      true,

    AI_MODERATION:
      true,

    AI_FRAUD_DETECTION:
      true,

    PROPERTY_SEARCH:
      true,

    PROPERTY_COMPARE:
      true,

    FAVOURITES:
      true,

    OFFERS:
      true,

    VISITS:
      true,

    DOCUMENTS:
      true,

    VERIFICATION:
      true,

    PAYMENTS:
      true,

    SUBSCRIPTIONS:
      true,

    LOANS:
      true,

    REFERRALS:
      true,

    MESSAGES:
      true,

    NOTIFICATIONS:
      true,

    SUPPORT:
      true,

    MAP:
      true,

    MARKETPLACE:
      true

  });

  // ==========================================================
  // NETWORK SETTINGS
  // ==========================================================

  const NETWORK = Object.freeze({

    CREDENTIALS:
      "include",

    RETRY_COUNT:
      2,

    RETRY_DELAY:
      1000,

    HEADERS: {

      "Accept":
        "application/json",

      "Content-Type":
        "application/json"

    }

  });

  // ==========================================================
  // GLOBAL GHAR CONFIG
  // ==========================================================

  const GHAR_CONFIG = {

    ENV: {

      NODE_ENV:
        isProduction
          ? "production"
          : "development",

      isProduction,
      isDevelopment,
      isLocalhost,
      isFileProtocol,
      isHttps,

      hostname,
      protocol

    },

    SITE_URL,

    API_BASE_URL,

    API,

    AI,

    AUTH,

    PROPERTY,

    USER,

    BUYER,

    SELLER,

    TENANT,

    ADMIN,

    DOCUMENTS,

    VERIFICATION,

    PAYMENTS,

    SUBSCRIPTIONS,

    LOANS,

    VISITS,

    OFFERS,

    APPLICATIONS,

    NOTIFICATIONS,

    MESSAGES,

    SUPPORT,

    REFERRALS,

    UPLOADS,

    PAGES,

    ROLES,

    STORAGE_KEYS,

    VERIFICATION_LEVELS,

    LEAD_STATUSES,

    SUBSCRIPTION_PLANS,

    SUBSCRIPTION_STATUS,

    SETTINGS,

    FEATURES,

    NETWORK

  };

  // ==========================================================
  // FREEZE MAIN CONFIG
  // ==========================================================

  Object.freeze(GHAR_CONFIG);

  // ==========================================================
  // GLOBAL EXPORT
  // ==========================================================

  window.GHAR =
    window.GHAR || {};

  window.GHAR.config =
    GHAR_CONFIG;

  // Compatibility alias
  window.GHAR_CONFIG =
    GHAR_CONFIG;

  // ==========================================================
  // DEBUG INFORMATION
  // ==========================================================

  if (
    !isProduction
  ) {

    console.info(
      "[GHAR] Configuration loaded"
    );

    console.info(
      "[GHAR] API:",
      API_BASE_URL
    );

    console.info(
      "[GHAR] Environment:",
      GHAR_CONFIG.ENV.NODE_ENV
    );

  }

})(window);