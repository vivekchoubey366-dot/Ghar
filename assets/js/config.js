/* ============================================================
   GHAR REAL ESTATE PLATFORM
   assets/js/config.js
   CENTRAL FRONTEND CONFIGURATION
   ------------------------------------------------------------
   Supports:
   - Local development
   - File:// development
   - Render
   - Cloudflare
   - Same-origin API
   - Separate API deployment
   - Buyer
   - Seller
   - Tenant
   - Agent
   - Admin
   - Super Admin
   - AI
   - Payments
   - Loans
   - Documents
   - Verification
   - Messaging
   - Notifications
   - Support
   - Subscriptions
   SECURITY:
   NEVER place:
   - API secrets
   - JWT secrets
   - database credentials
   - payment secret keys
   - AI provider secret keys
   - admin tokens
   - private encryption keys
   Frontend configuration is PUBLIC.
   ============================================================ */
"use strict";
(function (window) {
  /* ==========================================================
     ROOT
     ========================================================== */
  const GHAR = window.GHAR || {};
  /* ==========================================================
     ENVIRONMENT
     ========================================================== */
  const hostname =
    String(window.location.hostname || "").toLowerCase();
  const protocol =
    String(window.location.protocol || "");
  const port =
    String(window.location.port || "");
  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1";
  const isFileProtocol =
    protocol === "file:";
  const isHttps =
    protocol === "https:";
  const isHttp =
    protocol === "http:";
  const isProduction =
    !isLocalhost &&
    !isFileProtocol;
  const isDevelopment =
    isLocalhost ||
    isFileProtocol;
  const environment =
    isProduction
      ? "production"
      : "development";
  /* ==========================================================
     URL HELPERS
     ========================================================== */
  function cleanUrl(value) {
    return String(value || "")
      .trim()
      .replace(/\/+$/, "");
  }
  function joinUrl(base, path) {
    const cleanBase =
      cleanUrl(base);
    const cleanPath =
      String(path || "")
        .replace(/^\/+/, "");
    if (!cleanBase) {
      return `/${cleanPath}`;
    }
    return `${cleanBase}/${cleanPath}`;
  }
  function apiPath(path) {
    return joinUrl(
      API_BASE_URL,
      path
    );
  }
  function pagePath(path) {
    const cleanPath =
      String(path || "")
        .replace(/^\/+/, "");
    return `/${cleanPath}`;
  }
  /* ==========================================================
     API BASE URL
     ========================================================== */
  /*
   * You can define these BEFORE config.js:
   *
   * window.GHAR_API_URL = "https://api.example.com/api";
   * window.GHAR_SITE_URL = "https://example.com";
   *
   * Recommended same-origin production:
   *
   * https://ghar.example.com
   * API:
   * https://ghar.example.com/api
   */
  const configuredApiUrl =
    cleanUrl(
      window.GHAR_API_URL
    );
  const defaultApiBase =
    isFileProtocol
      ? "http://localhost:3000/api"
      : "/api";
  const API_BASE_URL =
    configuredApiUrl ||
    defaultApiBase;
  /* ==========================================================
     SITE URL
     ========================================================== */
  const configuredSiteUrl =
    cleanUrl(
      window.GHAR_SITE_URL
    );
  const SITE_URL =
    configuredSiteUrl ||
    (
      isFileProtocol
        ? "http://localhost:3000"
        : `${protocol}//${hostname}${port ? `:${port}` : ""}`
    );
  /* ==========================================================
     APPLICATION IDENTITY
     ========================================================== */
  const APP = Object.freeze({
    NAME:
      "GHAR",
    FULL_NAME:
      "GHAR Real Estate Platform",
    VERSION:
      "2.0.0",
    BUILD:
      "production",
    DESCRIPTION:
      "Premium real estate marketplace and property management platform",
    WEBSITE:
      SITE_URL,
    API:
      API_BASE_URL
  });
  /* ==========================================================
     API RESOURCE BASES
     ========================================================== */
  const API = Object.freeze({
    BASE:
      API_BASE_URL,
    HEALTH:
      apiPath("health"),
    AUTH:
      apiPath("auth"),
    USERS:
      apiPath("users"),
    PROPERTIES:
      apiPath("properties"),
    SEARCH:
      apiPath("search"),
    VISITS:
      apiPath("visits"),
    OFFERS:
      apiPath("offers"),
    APPLICATIONS:
      apiPath("applications"),
    DOCUMENTS:
      apiPath("documents"),
    VERIFICATION:
      apiPath("verification"),
    PAYMENTS:
      apiPath("payments"),
    SUBSCRIPTIONS:
      apiPath("subscriptions"),
    LOANS:
      apiPath("loans"),
    REFERRALS:
      apiPath("referrals"),
    NOTIFICATIONS:
      apiPath("notifications"),
    MESSAGES:
      apiPath("messages"),
    SUPPORT:
      apiPath("support"),
    AI:
      apiPath("ai"),
    ADMIN:
      apiPath("admin"),
    ADMIN_AI:
      apiPath("admin/ai"),
    SERVICES:
      apiPath("services"),
    ROUTES:
      apiPath("routes"),
    MAINTENANCE:
      apiPath("maintenance"),
    ANALYTICS:
      apiPath("analytics"),
    REPORTS:
      apiPath("reports"),
    SETTINGS:
      apiPath("settings")
  });
  /* ==========================================================
     AUTHENTICATION
     ========================================================== */
  const AUTH = Object.freeze({
    BASE:
      API.AUTH,
    LOGIN:
      apiPath("auth/login"),
    REGISTER:
      apiPath("auth/register"),
    SIGNUP:
      apiPath("auth/signup"),
    LOGOUT:
      apiPath("auth/logout"),
    REFRESH:
      apiPath("auth/refresh"),
    ME:
      apiPath("auth/me"),
    SESSION:
      apiPath("auth/session"),
    OTP_SEND:
      apiPath("auth/otp/send"),
    OTP_VERIFY:
      apiPath("auth/otp/verify"),
    PASSWORD_CHANGE:
      apiPath("auth/change-password"),
    FORGOT_PASSWORD:
      apiPath("auth/forgot-password"),
    RESET_PASSWORD:
      apiPath("auth/reset-password"),
    VERIFY_EMAIL:
      apiPath("auth/verify-email"),
    RESEND_VERIFICATION:
      apiPath("auth/resend-verification"),
    VERIFY_PHONE:
      apiPath("auth/verify-phone"),
    TWO_FACTOR:
      apiPath("auth/2fa"),
    TWO_FACTOR_ENABLE:
      apiPath("auth/2fa/enable"),
    TWO_FACTOR_DISABLE:
      apiPath("auth/2fa/disable")
  });
  /* ==========================================================
     USER API
     ========================================================== */
  const USER = Object.freeze({
    BASE:
      API.USERS,
    ME:
      apiPath("users/me"),
    PROFILE:
      apiPath("users/profile"),
    UPDATE_PROFILE:
      apiPath("users/profile"),
    PREFERENCES:
      apiPath("users/preferences"),
    SETTINGS:
      apiPath("users/settings"),
    SECURITY:
      apiPath("users/security"),
    SESSIONS:
      apiPath("users/sessions"),
    ACTIVITY:
      apiPath("users/activity"),
    VERIFICATION:
      apiPath("users/verification"),
    DELETE_ACCOUNT:
      apiPath("users/account")
  });
  /* ==========================================================
     PROPERTY API
     ========================================================== */
  const PROPERTY = Object.freeze({
    BASE:
      API.PROPERTIES,
    LIST:
      API.PROPERTIES,
    CREATE:
      API.PROPERTIES,
    DETAIL:
      id =>
        apiPath(
          `properties/${encodeURIComponent(id)}`
        ),
    UPDATE:
      id =>
        apiPath(
          `properties/${encodeURIComponent(id)}`
        ),
    DELETE:
      id =>
        apiPath(
          `properties/${encodeURIComponent(id)}`
        ),
    SEARCH:
      API.SEARCH,
    FEATURED:
      apiPath("properties/featured"),
    POPULAR:
      apiPath("properties/popular"),
    NEARBY:
      apiPath("properties/nearby"),
    CATEGORIES:
      apiPath("properties/categories"),
    TYPES:
      apiPath("properties/types"),
    LOCATIONS:
      apiPath("properties/locations"),
    AMENITIES:
      apiPath("properties/amenities"),
    AVAILABILITY:
      apiPath("properties/availability"),
    VERIFY:
      apiPath("properties/verification"),
    APPROVAL:
      apiPath("properties/approval"),
    ANALYTICS:
      apiPath("properties/analytics"),
    MEDIA:
      apiPath("properties/media")
  });
  /* ==========================================================
     SEARCH
     ========================================================== */
  const SEARCH = Object.freeze({
    BASE:
      API.SEARCH,
    PROPERTY:
      apiPath("search/properties"),
    SUGGESTIONS:
      apiPath("search/suggestions"),
    LOCATIONS:
      apiPath("search/locations"),
    FILTERS:
      apiPath("search/filters"),
    RECENT:
      apiPath("search/recent"),
    SAVED:
      apiPath("search/saved"),
    SAVE:
      apiPath("search/saved"),
    DELETE:
      id =>
        apiPath(
          `search/saved/${encodeURIComponent(id)}`
        )
  });
  /* ==========================================================
     AI API
     ========================================================== */
  const AI = Object.freeze({
    BASE:
      API.AI,
    HEALTH:
      apiPath("ai/health"),
    MODULES:
      apiPath("ai/modules"),
    CHAT:
      apiPath("ai/chat"),
    SEARCH:
      apiPath("ai/search"),
    RECOMMENDATIONS:
      apiPath("ai/recommendations"),
    PROPERTY:
      apiPath("ai/property"),
    PROPERTY_DESCRIPTION:
      apiPath("ai/property-description"),
    PRICE:
      apiPath("ai/price"),
    RENTAL:
      apiPath("ai/rental"),
    INVESTMENT:
      apiPath("ai/investment"),
    LOAN:
      apiPath("ai/loan"),
    AFFORDABILITY:
      apiPath("ai/affordability"),
    DOCUMENTS:
      apiPath("ai/documents"),
    MODERATION:
      apiPath("ai/moderation"),
    FRAUD:
      apiPath("ai/fraud"),
    LOCATION:
      apiPath("ai/location"),
    MARKET:
      apiPath("ai/market")
  });
  /* ==========================================================
     DOCUMENTS
     ========================================================== */
  const DOCUMENTS = Object.freeze({
    BASE:
      API.DOCUMENTS,
    UPLOAD:
      apiPath("documents/upload"),
    DOWNLOAD:
      id =>
        apiPath(
          `documents/${encodeURIComponent(id)}/download`
        ),
    DETAIL:
      id =>
        apiPath(
          `documents/${encodeURIComponent(id)}`
        ),
    DELETE:
      id =>
        apiPath(
          `documents/${encodeURIComponent(id)}`
        ),
    VERIFY:
      apiPath("documents/verification"),
    STATUS:
      apiPath("documents/status"),
    SCANNER:
      apiPath("documents/scanner"),
    VAULT:
      apiPath("documents/vault"),
    SHARED:
      apiPath("documents/shared"),
    AGREEMENTS:
      apiPath("documents/agreements")
  });
  /* ==========================================================
     VERIFICATION / KYC
     ========================================================== */
  const VERIFICATION = Object.freeze({
    BASE:
      API.VERIFICATION,
    IDENTITY:
      apiPath("verification/identity"),
    PHONE:
      apiPath("verification/phone"),
    EMAIL:
      apiPath("verification/email"),
    ADDRESS:
      apiPath("verification/address"),
    KYC:
      apiPath("verification/kyc"),
    PAN:
      apiPath("verification/pan"),
    AADHAAR:
      apiPath("verification/aadhaar"),
    OWNERSHIP:
      apiPath("verification/ownership"),
    PROPERTY:
      apiPath("verification/property"),
    STATUS:
      apiPath("verification/status"),
    LEVELS:
      apiPath("verification/levels")
  });
  /* ==========================================================
     PAYMENTS
     ========================================================== */
  const PAYMENTS = Object.freeze({
    BASE:
      API.PAYMENTS,
    CHECKOUT:
      apiPath("payments/checkout"),
    CREATE:
      apiPath("payments/create"),
    SUCCESS:
      apiPath("payments/success"),
    FAILED:
      apiPath("payments/failed"),
    VERIFY:
      apiPath("payments/verify"),
    HISTORY:
      apiPath("payments/history"),
    INVOICES:
      apiPath("payments/invoices"),
    REFUNDS:
      apiPath("payments/refunds"),
    SUBSCRIPTIONS:
      apiPath("payments/subscriptions")
  });
  /* ==========================================================
     SUBSCRIPTIONS
     ========================================================== */
  const SUBSCRIPTIONS = Object.freeze({
    BASE:
      API.SUBSCRIPTIONS,
    PLANS:
      apiPath("subscriptions/plans"),
    CURRENT:
      apiPath("subscriptions/current"),
    CREATE:
      apiPath("subscriptions/create"),
    CANCEL:
      apiPath("subscriptions/cancel"),
    UPGRADE:
      apiPath("subscriptions/upgrade"),
    DOWNGRADE:
      apiPath("subscriptions/downgrade"),
    RENEW:
      apiPath("subscriptions/renew"),
    HISTORY:
      apiPath("subscriptions/history"),
    INVOICES:
      apiPath("subscriptions/invoices")
  });
  /* ==========================================================
     LOANS
     ========================================================== */
  const LOANS = Object.freeze({
    BASE:
      API.LOANS,
    ELIGIBILITY:
      apiPath("loans/eligibility"),
    CALCULATOR:
      apiPath("loans/calculator"),
    APPLICATIONS:
      apiPath("loans/applications"),
    CREATE:
      apiPath("loans/applications"),
    DETAILS:
      id =>
        apiPath(
          `loans/applications/${encodeURIComponent(id)}`
        ),
    STATUS:
      apiPath("loans/status"),
    OFFERS:
      apiPath("loans/offers")
  });
  /* ==========================================================
     VISITS
     ========================================================== */
  const VISITS = Object.freeze({
    BASE:
      API.VISITS,
    SCHEDULE:
      apiPath("visits/schedule"),
    CREATE:
      apiPath("visits"),
    UPCOMING:
      apiPath("visits/upcoming"),
    COMPLETED:
      apiPath("visits/completed"),
    HISTORY:
      apiPath("visits/history"),
    CANCEL:
      id =>
        apiPath(
          `visits/${encodeURIComponent(id)}/cancel`
        ),
    RESCHEDULE:
      id =>
        apiPath(
          `visits/${encodeURIComponent(id)}/reschedule`
        )
  });
  /* ==========================================================
     OFFERS
     ========================================================== */
  const OFFERS = Object.freeze({
    BASE:
      API.OFFERS,
    LIST:
      API.OFFERS,
    CREATE:
      API.OFFERS,
    DETAIL:
      id =>
        apiPath(
          `offers/${encodeURIComponent(id)}`
        ),
    UPDATE:
      id =>
        apiPath(
          `offers/${encodeURIComponent(id)}`
        ),
    ACCEPT:
      id =>
        apiPath(
          `offers/${encodeURIComponent(id)}/accept`
        ),
    REJECT:
      id =>
        apiPath(
          `offers/${encodeURIComponent(id)}/reject`
        ),
    WITHDRAW:
      id =>
        apiPath(
          `offers/${encodeURIComponent(id)}/withdraw`
        )
  });
  /* ==========================================================
     APPLICATIONS
     ========================================================== */
  const APPLICATIONS = Object.freeze({
    BASE:
      API.APPLICATIONS,
    LIST:
      API.APPLICATIONS,
    CREATE:
      API.APPLICATIONS,
    DETAIL:
      id =>
        apiPath(
          `applications/${encodeURIComponent(id)}`
        ),
    UPDATE:
      id =>
        apiPath(
          `applications/${encodeURIComponent(id)}`
        ),
    STATUS:
      id =>
        apiPath(
          `applications/${encodeURIComponent(id)}/status`
        ),
    CANCEL:
      id =>
        apiPath(
          `applications/${encodeURIComponent(id)}/cancel`
        )
  });
  /* ==========================================================
     NOTIFICATIONS
     ========================================================== */
  const NOTIFICATIONS = Object.freeze({
    BASE:
      API.NOTIFICATIONS,
    LIST:
      API.NOTIFICATIONS,
    UNREAD:
      apiPath("notifications/unread"),
    READ:
      id =>
        apiPath(
          `notifications/${encodeURIComponent(id)}/read`
        ),
    READ_ALL:
      apiPath("notifications/read-all"),
    DELETE:
      id =>
        apiPath(
          `notifications/${encodeURIComponent(id)}`
        ),
    PREFERENCES:
      apiPath("notifications/preferences")
  });
  /* ==========================================================
     MESSAGES
     ========================================================== */
  const MESSAGES = Object.freeze({
    BASE:
      API.MESSAGES,
    LIST:
      API.MESSAGES,
    CONVERSATIONS:
      apiPath("messages/conversations"),
    SEND:
      apiPath("messages/send"),
    CONVERSATION:
      id =>
        apiPath(
          `messages/conversation/${encodeURIComponent(id)}`
        ),
    MARK_READ:
      id =>
        apiPath(
          `messages/${encodeURIComponent(id)}/read`
        ),
    DELETE:
      id =>
        apiPath(
          `messages/${encodeURIComponent(id)}`
        )
  });
  /* ==========================================================
     SUPPORT
     ========================================================== */
  const SUPPORT = Object.freeze({
    BASE:
      API.SUPPORT,
    TICKETS:
      apiPath("support/tickets"),
    CREATE:
      apiPath("support/tickets"),
    DETAIL:
      id =>
        apiPath(
          `support/tickets/${encodeURIComponent(id)}`
        ),
    UPDATE:
      id =>
        apiPath(
          `support/tickets/${encodeURIComponent(id)}`
        ),
    KNOWLEDGE_BASE:
      apiPath("support/knowledge-base"),
    FAQ:
      apiPath("support/faq")
  });
  /* ==========================================================
     REFERRALS
     ========================================================== */
  const REFERRALS = Object.freeze({
    BASE:
      API.REFERRALS,
    LIST:
      API.REFERRALS,
    CREATE:
      API.REFERRALS,
    DETAIL:
      id =>
        apiPath(
          `referrals/${encodeURIComponent(id)}`
        ),
    STATUS:
      apiPath("referrals/status"),
    REWARDS:
      apiPath("referrals/rewards")
  });
  /* ==========================================================
     ADMIN API
     ========================================================== */
  const ADMIN_API = Object.freeze({
    BASE:
      API.ADMIN,
    DASHBOARD:
      apiPath("admin/dashboard"),
    USERS:
      apiPath("admin/users"),
    BUYERS:
      apiPath("admin/buyers"),
    SELLERS:
      apiPath("admin/sellers"),
    TENANTS:
      apiPath("admin/tenants"),
    AGENTS:
      apiPath("admin/agents"),
    PROPERTIES:
      apiPath("admin/properties"),
    PROPERTY_APPROVAL:
      apiPath("admin/property-approval"),
    LEADS:
      apiPath("admin/leads"),
    VISITS:
      apiPath("admin/visits"),
    OFFERS:
      apiPath("admin/offers"),
    APPLICATIONS:
      apiPath("admin/applications"),
    DOCUMENTS:
      apiPath("admin/documents"),
    PAYMENTS:
      apiPath("admin/payments"),
    SUBSCRIPTIONS:
      apiPath("admin/subscriptions"),
    LOANS:
      apiPath("admin/loans"),
    REFERRALS:
      apiPath("admin/referrals"),
    SUPPORT:
      apiPath("admin/support"),
    NOTIFICATIONS:
      apiPath("admin/notifications"),
    REPORTS:
      apiPath("admin/reports"),
    ANALYTICS:
      apiPath("admin/analytics"),
    SECURITY:
      apiPath("admin/security"),
    AUDIT_LOGS:
      apiPath("admin/audit-logs"),
    SETTINGS:
      apiPath("admin/settings")
  });
  /* ==========================================================
     ADMIN AI API
     ========================================================== */
  const ADMIN_AI = Object.freeze({
    BASE:
      API.ADMIN_AI,
    DASHBOARD:
      apiPath("admin/ai/dashboard"),
    SETTINGS:
      apiPath("admin/ai/settings"),
    MODELS:
      apiPath("admin/ai/models"),
    PROMPTS:
      apiPath("admin/ai/prompts"),
    USAGE:
      apiPath("admin/ai/usage"),
    MODERATION:
      apiPath("admin/ai/moderation"),
    FRAUD:
      apiPath("admin/ai/fraud"),
    LOGS:
      apiPath("admin/ai/logs")
  });
  /* ==========================================================
     ROLE DEFINITIONS
     ========================================================== */
  const ROLES = Object.freeze({
    GUEST:
      "GUEST",
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
  /* ==========================================================
     ROLE GROUPS
     ========================================================== */
  const ROLE_GROUPS = Object.freeze({
    PUBLIC:
      Object.freeze([
        ROLES.GUEST
      ]),
    CUSTOMER:
      Object.freeze([
        ROLES.BUYER,
        ROLES.TENANT
      ]),
    PROPERTY_OWNER:
      Object.freeze([
        ROLES.SELLER
      ]),
    PROFESSIONAL:
      Object.freeze([
        ROLES.AGENT
      ]),
    ADMINISTRATIVE:
      Object.freeze([
        ROLES.ADMIN,
        ROLES.SUPER_ADMIN
      ]),
    AUTHENTICATED:
      Object.freeze([
        ROLES.BUYER,
        ROLES.SELLER,
        ROLES.TENANT,
        ROLES.AGENT,
        ROLES.ADMIN,
        ROLES.SUPER_ADMIN
      ]),
    ALL:
      Object.freeze([
        ROLES.GUEST,
        ROLES.BUYER,
        ROLES.SELLER,
        ROLES.TENANT,
        ROLES.AGENT,
        ROLES.ADMIN,
        ROLES.SUPER_ADMIN
      ])
  });
  /* ==========================================================
     ROLE INFORMATION
     ========================================================== */
  const ROLE_META = Object.freeze({
    BUYER: Object.freeze({
      key: ROLES.BUYER,
      label: "Buyer",
      description: "Find, compare and purchase property",
      dashboard: "/buyer/dashboard.html",
      home: "/buyer/dashboard.html"
    }),
    SELLER: Object.freeze({
      key: ROLES.SELLER,
      label: "Seller",
      description: "List, manage and sell properties",
      dashboard: "/seller/dashboard.html",
      home: "/seller/dashboard.html"
    }),
    TENANT: Object.freeze({
      key: ROLES.TENANT,
      label: "Tenant",
      description: "Find and manage rental properties",
      dashboard: "/tenant/dashboard.html",
      home: "/tenant/dashboard.html"
    }),
    AGENT: Object.freeze({
      key: ROLES.AGENT,
      label: "Agent",
      description: "Manage clients, listings and leads",
      dashboard: "/agent/dashboard.html",
      home: "/agent/dashboard.html"
    }),
    ADMIN: Object.freeze({
      key: ROLES.ADMIN,
      label: "Administrator",
      description: "Manage the GHAR platform",
      dashboard: "/admin/admin-dashboard.html",
      home: "/admin/admin-dashboard.html"
    }),
    SUPER_ADMIN: Object.freeze({
      key: ROLES.SUPER_ADMIN,
      label: "Super Administrator",
      description: "Full platform administration",
      dashboard: "/admin/super-admin-dashboard.html",
      home: "/admin/super-admin-dashboard.html"
    })
  });
  /* ==========================================================
     ROLE ROUTES
     ========================================================== */
  const ROLE_ROUTES = Object.freeze({
    BUYER: Object.freeze({
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
      COMPARE:
        "/buyer/compare.html",
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
      AI:
        "/buyer/ai/advisor.html"
    }),
    SELLER: Object.freeze({
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
    }),
    TENANT: Object.freeze({
      DASHBOARD:
        "/tenant/dashboard.html",
      PROFILE:
        "/tenant/profile.html",
      PROPERTIES:
        "/tenant/properties.html",
      PROPERTY_DETAILS:
        "/tenant/property-details.html",
      SEARCH:
        "/tenant/search.html",
      SAVED:
        "/tenant/saved-properties.html",
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
      SUPPORT:
        "/tenant/support.html",
      SETTINGS:
        "/tenant/settings.html",
      AI:
        "/tenant/ai/rental-advisor.html"
    }),
    AGENT: Object.freeze({
      DASHBOARD:
        "/agent/dashboard.html",
      PROFILE:
        "/agent/profile.html",
      CLIENTS:
        "/agent/clients.html",
      PROPERTIES:
        "/agent/properties.html",
      LIST_PROPERTY:
        "/agent/list-property.html",
      EDIT_PROPERTY:
        "/agent/edit-property.html",
      LEADS:
        "/agent/leads.html",
      VISITS:
        "/agent/visits.html",
      OFFERS:
        "/agent/offers.html",
      APPLICATIONS:
        "/agent/applications.html",
      DOCUMENTS:
        "/agent/documents.html",
      PAYMENTS:
        "/agent/payments.html",
      COMMISSIONS:
        "/agent/commissions.html",
      REFERRALS:
        "/agent/referrals.html",
      MESSAGES:
        "/agent/messages.html",
      NOTIFICATIONS:
        "/agent/notifications.html",
      SUPPORT:
        "/agent/support.html",
      SETTINGS:
        "/agent/settings.html"
    }),
    ADMIN: Object.freeze({
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
      AGENTS:
        "/admin/agents.html",
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
      SUBSCRIPTIONS:
        "/admin/subscriptions.html",
      LOANS:
        "/admin/loans.html",
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
        "/admin/audit-logs.html"
    }),
    SUPER_ADMIN: Object.freeze({
      DASHBOARD:
        "/admin/super-admin-dashboard.html",
      CONTROL_CENTER:
        "/admin/control-center.html",
      USERS:
        "/admin/users.html",
      ROLES:
        "/admin/roles.html",
      PERMISSIONS:
        "/admin/permissions.html",
      PROPERTIES:
        "/admin/properties.html",
      PAYMENTS:
        "/admin/payments.html",
      SUBSCRIPTIONS:
        "/admin/subscriptions.html",
      LOANS:
        "/admin/loans.html",
      AI:
        "/admin/ai/ai-dashboard.html",
      SECURITY:
        "/admin/security.html",
      AUDIT_LOGS:
        "/admin/audit-logs.html",
      SYSTEM:
        "/admin/system.html",
      SETTINGS:
        "/admin/settings.html"
    })
  });
  /* ==========================================================
     ROLE HELPERS
     ========================================================== */
  const ROLE_HELPERS = Object.freeze({
    isValid(role) {
      return ROLE_GROUPS.ALL.includes(
        String(role || "").toUpperCase()
      );
    },
    normalize(role) {
      const normalized =
        String(role || "")
          .trim()
          .toUpperCase();
      return this.isValid(normalized)
        ? normalized
        : null;
    },
    isAdmin(role) {
      const normalized =
        this.normalize(role);
      return (
        normalized === ROLES.ADMIN ||
        normalized === ROLES.SUPER_ADMIN
      );
    },
    isSuperAdmin(role) {
      return (
        this.normalize(role) ===
        ROLES.SUPER_ADMIN
      );
    },
    isCustomer(role) {
      const normalized =
        this.normalize(role);
      return ROLE_GROUPS.CUSTOMER.includes(
        normalized
      );
    },
    isProfessional(role) {
      const normalized =
        this.normalize(role);
      return (
        normalized === ROLES.AGENT ||
        normalized === ROLES.SELLER
      );
    },
    dashboard(role) {
      const normalized =
        this.normalize(role);
      if (!normalized) {
        return "/login.html";
      }
      return (
        ROLE_META[normalized]?.dashboard ||
        "/dashboard.html"
      );
    },
    home(role) {
      return this.dashboard(role);
    }
  });
  /* ==========================================================
     BUYER ROUTES
     ========================================================== */
  const BUYER =
    ROLE_ROUTES.BUYER;
  /* ==========================================================
     SELLER ROUTES
     ========================================================== */
  const SELLER =
    ROLE_ROUTES.SELLER;
  /* ==========================================================
     TENANT ROUTES
     ========================================================== */
  const TENANT =
    ROLE_ROUTES.TENANT;
  /* ==========================================================
     AGENT ROUTES
     ========================================================== */
  const AGENT =
    ROLE_ROUTES.AGENT;
  /* ==========================================================
     ADMIN ROUTES
     ========================================================== */
  const ADMIN =
    ROLE_ROUTES.ADMIN;
  /* ==========================================================
     SUPER ADMIN ROUTES
     ========================================================== */
  const SUPER_ADMIN =
    ROLE_ROUTES.SUPER_ADMIN;
  /* ==========================================================
     USER PERMISSIONS
     ========================================================== */
  const PERMISSIONS = Object.freeze({
    VIEW_PROPERTIES:
      "VIEW_PROPERTIES",
    SEARCH_PROPERTIES:
      "SEARCH_PROPERTIES",
    SAVE_PROPERTIES:
      "SAVE_PROPERTIES",
    COMPARE_PROPERTIES:
      "COMPARE_PROPERTIES",
    SCHEDULE_VISIT:
      "SCHEDULE_VISIT",
    MAKE_OFFER:
      "MAKE_OFFER",
    APPLY_PROPERTY:
      "APPLY_PROPERTY",
    BUY_PROPERTY:
      "BUY_PROPERTY",
    RENT_PROPERTY:
      "RENT_PROPERTY",
    LIST_PROPERTY:
      "LIST_PROPERTY",
    EDIT_PROPERTY:
      "EDIT_PROPERTY",
    DELETE_PROPERTY:
      "DELETE_PROPERTY",
    MANAGE_LEADS:
      "MANAGE_LEADS",
    MANAGE_CLIENTS:
      "MANAGE_CLIENTS",
    MANAGE_VISITS:
      "MANAGE_VISITS",
    MANAGE_OFFERS:
      "MANAGE_OFFERS",
    UPLOAD_DOCUMENTS:
      "UPLOAD_DOCUMENTS",
    VERIFY_DOCUMENTS:
      "VERIFY_DOCUMENTS",
    APPLY_LOAN:
      "APPLY_LOAN",
    MAKE_PAYMENT:
      "MAKE_PAYMENT",
    MANAGE_SUBSCRIPTION:
      "MANAGE_SUBSCRIPTION",
    SEND_MESSAGES:
      "SEND_MESSAGES",
    CREATE_TICKET:
      "CREATE_TICKET",
    USE_AI:
      "USE_AI",
    MANAGE_USERS:
      "MANAGE_USERS",
    MANAGE_PROPERTIES:
      "MANAGE_PROPERTIES",
    APPROVE_PROPERTIES:
      "APPROVE_PROPERTIES",
    MANAGE_PAYMENTS:
      "MANAGE_PAYMENTS",
    MANAGE_LOANS:
      "MANAGE_LOANS",
    MANAGE_SUBSCRIPTIONS:
      "MANAGE_SUBSCRIPTIONS",
    VIEW_ANALYTICS:
      "VIEW_ANALYTICS",
    VIEW_REPORTS:
      "VIEW_REPORTS",
    MANAGE_AI:
      "MANAGE_AI",
    MANAGE_SECURITY:
      "MANAGE_SECURITY",
    VIEW_AUDIT_LOGS:
      "VIEW_AUDIT_LOGS",
    MANAGE_SYSTEM:
      "MANAGE_SYSTEM"
  });
  /* ==========================================================
     ROLE PERMISSIONS
     ========================================================== */
  const ROLE_PERMISSIONS = Object.freeze({
    BUYER: Object.freeze([
      PERMISSIONS.VIEW_PROPERTIES,
      PERMISSIONS.SEARCH_PROPERTIES,
      PERMISSIONS.SAVE_PROPERTIES,
      PERMISSIONS.COMPARE_PROPERTIES,
      PERMISSIONS.SCHEDULE_VISIT,
      PERMISSIONS.MAKE_OFFER,
      PERMISSIONS.APPLY_PROPERTY,
      PERMISSIONS.BUY_PROPERTY,
      PERMISSIONS.UPLOAD_DOCUMENTS,
      PERMISSIONS.APPLY_LOAN,
      PERMISSIONS.MAKE_PAYMENT,
      PERMISSIONS.MANAGE_SUBSCRIPTION,
      PERMISSIONS.SEND_MESSAGES,
      PERMISSIONS.CREATE_TICKET,
      PERMISSIONS.USE_AI
    ]),
    SELLER: Object.freeze([
      PERMISSIONS.VIEW_PROPERTIES,
      PERMISSIONS.SEARCH_PROPERTIES,
      PERMISSIONS.LIST_PROPERTY,
      PERMISSIONS.EDIT_PROPERTY,
      PERMISSIONS.DELETE_PROPERTY,
      PERMISSIONS.MANAGE_LEADS,
      PERMISSIONS.MANAGE_VISITS,
      PERMISSIONS.MANAGE_OFFERS,
      PERMISSIONS.UPLOAD_DOCUMENTS,
      PERMISSIONS.MAKE_PAYMENT,
      PERMISSIONS.MANAGE_SUBSCRIPTION,
      PERMISSIONS.SEND_MESSAGES,
      PERMISSIONS.CREATE_TICKET,
      PERMISSIONS.USE_AI
    ]),
    TENANT: Object.freeze([
      PERMISSIONS.VIEW_PROPERTIES,
      PERMISSIONS.SEARCH_PROPERTIES,
      PERMISSIONS.SAVE_PROPERTIES,
      PERMISSIONS.COMPARE_PROPERTIES,
      PERMISSIONS.SCHEDULE_VISIT,
      PERMISSIONS.RENT_PROPERTY,
      PERMISSIONS.APPLY_PROPERTY,
      PERMISSIONS.UPLOAD_DOCUMENTS,
      PERMISSIONS.MAKE_PAYMENT,
      PERMISSIONS.SEND_MESSAGES,
      PERMISSIONS.CREATE_TICKET,
      PERMISSIONS.USE_AI
    ]),
    AGENT: Object.freeze([
      PERMISSIONS.VIEW_PROPERTIES,
      PERMISSIONS.SEARCH_PROPERTIES,
      PERMISSIONS.LIST_PROPERTY,
      PERMISSIONS.EDIT_PROPERTY,
      PERMISSIONS.MANAGE_LEADS,
      PERMISSIONS.MANAGE_CLIENTS,
      PERMISSIONS.MANAGE_VISITS,
      PERMISSIONS.MANAGE_OFFERS,
      PERMISSIONS.UPLOAD_DOCUMENTS,
      PERMISSIONS.MAKE_PAYMENT,
      PERMISSIONS.MANAGE_SUBSCRIPTION,
      PERMISSIONS.SEND_MESSAGES,
      PERMISSIONS.CREATE_TICKET,
      PERMISSIONS.USE_AI
    ]),
    ADMIN: Object.freeze([
      PERMISSIONS.VIEW_PROPERTIES,
      PERMISSIONS.SEARCH_PROPERTIES,
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.MANAGE_PROPERTIES,
      PERMISSIONS.APPROVE_PROPERTIES,
      PERMISSIONS.MANAGE_LEADS,
      PERMISSIONS.MANAGE_VISITS,
      PERMISSIONS.MANAGE_OFFERS,
      PERMISSIONS.VERIFY_DOCUMENTS,
      PERMISSIONS.MANAGE_PAYMENTS,
      PERMISSIONS.MANAGE_LOANS,
      PERMISSIONS.MANAGE_SUBSCRIPTIONS,
      PERMISSIONS.VIEW_ANALYTICS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.CREATE_TICKET,
      PERMISSIONS.MANAGE_AI,
      PERMISSIONS.MANAGE_SECURITY,
      PERMISSIONS.VIEW_AUDIT_LOGS
    ]),
    SUPER_ADMIN: Object.freeze([
      ...Object.values(PERMISSIONS)
    ])
  });
  /* ==========================================================
     STORAGE KEYS
     ========================================================== */
  const STORAGE_KEYS = Object.freeze({
    ACCESS_TOKEN:
      "ghar_access_token",
    REFRESH_TOKEN:
      "ghar_refresh_token",
    USER:
      "ghar_user",
    ROLE:
      "ghar_role",
    PERMISSIONS:
      "ghar_permissions",
    SESSION:
      "ghar_session",
    THEME:
      "ghar_theme",
    LANGUAGE:
      "ghar_language",
    FAVOURITES:
      "ghar_favourites",
    SAVED_PROPERTIES:
      "ghar_saved_properties",
    SEARCHES:
      "ghar_searches",
    COMPARE:
      "ghar_compare",
    CART:
      "ghar_cart",
    LAST_ROUTE:
      "ghar_last_route",
    ONBOARDING:
      "ghar_onboarding",
    COOKIE_CONSENT:
      "ghar_cookie_consent"
  });
  /* ==========================================================
     UPLOAD CONFIGURATION
     ========================================================== */
  const UPLOADS = Object.freeze({
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
      "/uploads/verification/",
    MAX_IMAGE_SIZE:
      10 * 1024 * 1024,
    MAX_VIDEO_SIZE:
      100 * 1024 * 1024,
    MAX_DOCUMENT_SIZE:
      20 * 1024 * 1024,
    MAX_PROFILE_IMAGE_SIZE:
      5 * 1024 * 1024,
    IMAGE_TYPES:
      Object.freeze([
        "image/jpeg",
        "image/png",
        "image/webp"
      ]),
    DOCUMENT_TYPES:
      Object.freeze([
        "application/pdf",
        "image/jpeg",
        "image/png"
      ])
  });
  /* ==========================================================
     VERIFICATION LEVELS
     ========================================================== */
  const VERIFICATION_LEVELS = Object.freeze({
    UNVERIFIED:
      "UNVERIFIED",
    EMAIL_VERIFIED:
      "EMAIL_VERIFIED",
    PHONE_VERIFIED:
      "PHONE_VERIFIED",
    BASIC_VERIFIED:
      "BASIC_VERIFIED",
    KYC_VERIFIED:
      "KYC_VERIFIED",
    OWNER_VERIFIED:
      "OWNER_VERIFIED",
    DOCUMENT_VERIFIED:
      "DOCUMENT_VERIFIED",
    PROPERTY_VERIFIED:
      "PROPERTY_VERIFIED"
  });
  /* ==========================================================
     PROPERTY STATUS
     ========================================================== */
  const PROPERTY_STATUS = Object.freeze({
    DRAFT:
      "DRAFT",
    PENDING:
      "PENDING",
    UNDER_REVIEW:
      "UNDER_REVIEW",
    APPROVED:
      "APPROVED",
    REJECTED:
      "REJECTED",
    ACTIVE:
      "ACTIVE",
    SOLD:
      "SOLD",
    RENTED:
      "RENTED",
    EXPIRED:
      "EXPIRED",
    ARCHIVED:
      "ARCHIVED"
  });
  /* ==========================================================
     PROPERTY PURPOSE
     ========================================================== */
  const PROPERTY_PURPOSE = Object.freeze({
    SALE:
      "SALE",
    RENT:
      "RENT",
    LEASE:
      "LEASE",
    PG:
      "PG",
    INVESTMENT:
      "INVESTMENT"
  });
  /* ==========================================================
     PROPERTY TYPES
     ========================================================== */
  const PROPERTY_TYPES = Object.freeze({
    APARTMENT:
      "APARTMENT",
    VILLA:
      "VILLA",
    HOUSE:
      "HOUSE",
    PLOT:
      "PLOT",
    LAND:
      "LAND",
    OFFICE:
      "OFFICE",
    SHOP:
      "SHOP",
    WAREHOUSE:
      "WAREHOUSE",
    STUDIO:
      "STUDIO",
    PENTHOUSE:
      "PENTHOUSE",
    FARMHOUSE:
      "FARMHOUSE",
    COMMERCIAL:
      "COMMERCIAL"
  });
  /* ==========================================================
     LEAD STATUSES
     ========================================================== */
  const LEAD_STATUSES = Object.freeze({
    NEW:
      "NEW",
    CONTACTED:
      "CONTACTED",
    INTERESTED:
      "INTERESTED",
    FOLLOW_UP:
      "FOLLOW_UP",
    VISIT_SCHEDULED:
      "VISIT_SCHEDULED",
    NEGOTIATION:
      "NEGOTIATION",
    CONVERTED:
      "CONVERTED",
    LOST:
      "LOST"
  });
  /* ==========================================================
     APPLICATION STATUSES
     ========================================================== */
  const APPLICATION_STATUSES = Object.freeze({
    DRAFT:
      "DRAFT",
    SUBMITTED:
      "SUBMITTED",
    UNDER_REVIEW:
      "UNDER_REVIEW",
    DOCUMENTS_REQUIRED:
      "DOCUMENTS_REQUIRED",
    APPROVED:
      "APPROVED",
    REJECTED:
      "REJECTED",
    CANCELLED:
      "CANCELLED",
    COMPLETED:
      "COMPLETED"
  });
  /* ==========================================================
     OFFER STATUSES
     ========================================================== */
  const OFFER_STATUSES = Object.freeze({
    DRAFT:
      "DRAFT",
    SUBMITTED:
      "SUBMITTED",
    COUNTERED:
      "COUNTERED",
    ACCEPTED:
      "ACCEPTED",
    REJECTED:
      "REJECTED",
    WITHDRAWN:
      "WITHDRAWN",
    EXPIRED:
      "EXPIRED"
  });
  /* ==========================================================
     PAYMENT STATUSES
     ========================================================== */
  const PAYMENT_STATUSES = Object.freeze({
    CREATED:
      "CREATED",
    PENDING:
      "PENDING",
    PROCESSING:
      "PROCESSING",
    SUCCESS:
      "SUCCESS",
    FAILED:
      "FAILED",
    REFUNDED:
      "REFUNDED",
    CANCELLED:
      "CANCELLED"
  });
  /* ==========================================================
     SUBSCRIPTION PLANS
     ========================================================== */
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
      "BUSINESS",
    ENTERPRISE:
      "ENTERPRISE"
  });
  /* ==========================================================
     SUBSCRIPTION STATUS
     ========================================================== */
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
  /* ==========================================================
     FRONTEND PAGES
     ========================================================== */
  const PAGES = Object.freeze({
    HOME:
      pagePath("index.html"),
    ABOUT:
      pagePath("about.html"),
    PROPERTIES:
      pagePath("properties.html"),
    PROPERTY_DETAILS:
      pagePath("property-details.html"),
    MARKETPLACE:
      pagePath("marketplace.html"),
    MAP:
      pagePath("map.html"),
    COMPARE:
      pagePath("compare.html"),
    FAVOURITES:
      pagePath("favourites.html"),
    OFFERS:
      pagePath("offers.html"),
    SEARCHES:
      pagePath("property-searches.html"),
    NOTIFICATIONS:
      pagePath("notifications.html"),
    REFERRALS:
      pagePath("referrals.html"),
    DASHBOARD:
      pagePath("dashboard.html"),
    PROFILE:
      pagePath("profile.html"),
    LOGIN:
      pagePath("login.html"),
    SIGNUP:
      pagePath("sign-up.html"),
    REGISTRATION:
      pagePath("registration.html"),
    ROLE_SELECTION:
      pagePath("role-selection.html"),
    OTP_LOGIN:
      pagePath("otp-login.html"),
    FORGOT_PASSWORD:
      pagePath("forgot-password.html"),
    RESET_PASSWORD:
      pagePath("reset-password.html"),
    VERIFY_EMAIL:
      pagePath("verify-email.html"),
    AI:
      pagePath("ai.html"),
    AI_ADVISOR:
      pagePath("ai-property-advisor.html"),
    AI_SEARCH:
      pagePath("ai-property-search.html"),
    AI_PRICE:
      pagePath("ai-price-estimator.html"),
    AI_INVESTMENT:
      pagePath("ai-investment-advisor.html"),
    AI_LOAN:
      pagePath("ai-loan-advisor.html"),
    AI_DOCUMENT:
      pagePath("ai-document-assistant.html"),
    AI_DESCRIPTION:
      pagePath("ai-property-description.html"),
    AI_CHAT:
      pagePath("ai-chat.html"),
    HELP:
      pagePath("help.html"),
    HELP_CENTRE:
      pagePath("help-centre.html"),
    CONTACT:
      pagePath("contact.html"),
    EDUCATION:
      pagePath("education.html"),
    CAREERS:
      pagePath("careers.html"),
    TERMS:
      pagePath("terms.html"),
    PRIVACY:
      pagePath("privacy.html"),
    SECURITY:
      pagePath("security.html"),
    ACCESSIBILITY:
      pagePath("accessibility.html"),
    COOKIE_POLICY:
      pagePath("cookie-policy.html"),
    REFUND_POLICY:
      pagePath("refund-policy.html"),
    OFFLINE:
      pagePath("offline.html"),
    ERROR_400:
      pagePath("400.html"),
    ERROR_401:
      pagePath("401.html"),
    ERROR_403:
      pagePath("403.html"),
    ERROR_404:
      pagePath("404.html"),
    ERROR_429:
      pagePath("429.html"),
    ERROR_500:
      pagePath("500.html"),
    ERROR_503:
      pagePath("503.html")
  });
  /* ==========================================================
     APPLICATION SETTINGS
     ========================================================== */
  const SETTINGS = Object.freeze({
    APP_NAME:
      APP.NAME,
    APP_VERSION:
      APP.VERSION,
    DEFAULT_LANGUAGE:
      "en",
    DEFAULT_ROLE:
      ROLES.BUYER,
    REQUEST_TIMEOUT:
      30000,
    UPLOAD_TIMEOUT:
      120000,
    MAX_UPLOAD_SIZE:
      20 * 1024 * 1024,
    PAGINATION_LIMIT:
      20,
    MAX_PAGINATION_LIMIT:
      100,
    SEARCH_DEBOUNCE:
      350,
    TOKEN_REFRESH_BUFFER:
      60000,
    TOAST_DURATION:
      4000,
    MODAL_ANIMATION:
      250,
    AUTOSAVE_INTERVAL:
      30000,
    SESSION_CHECK_INTERVAL:
      60000
  });
  /* ==========================================================
     FEATURE FLAGS
     ========================================================== */
  const FEATURES = Object.freeze({
    AUTH:
      true,
    OTP:
      true,
    TWO_FACTOR:
      true,
    PROPERTY_SEARCH:
      true,
    PROPERTY_COMPARE:
      true,
    FAVOURITES:
      true,
    SAVED_SEARCHES:
      true,
    OFFERS:
      true,
    VISITS:
      true,
    APPLICATIONS:
      true,
    DOCUMENTS:
      true,
    DOCUMENT_VAULT:
      true,
    VERIFICATION:
      true,
    KYC:
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
      true,
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
    ANALYTICS:
      true,
    REPORTS:
      true
  });
  /* ==========================================================
     NETWORK CONFIG
     ========================================================== */
  const NETWORK = Object.freeze({
    CREDENTIALS:
      "include",
    RETRY_COUNT:
      2,
    RETRY_DELAY:
      1000,
    HEADERS:
      Object.freeze({
        Accept:
          "application/json",
        "Content-Type":
          "application/json"
      })
  });
  /* ==========================================================
     LANGUAGE CONFIG
     ========================================================== */
  const LANGUAGES = Object.freeze({
    en: "English",
    hi: "हिन्दी",
    bn: "বাংলা",
    as: "অসমীয়া",
    ne: "नेपाली",
    mr: "मराठी",
    gu: "ગુજરાતી",
    pa: "ਪੰਜਾਬੀ",
    ur: "اردو",
    or: "ଓଡ଼ିଆ",
    fr: "Français",
    de: "Deutsch",
    es: "Español",
    zh: "中文",
    ar: "العربية",
    ru: "Русский"
  });
  /* ==========================================================
     CURRENCY
     ========================================================== */
  const CURRENCY = Object.freeze({
    DEFAULT:
      "INR",
    SYMBOL:
      "₹",
    LOCALE:
      "en-IN"
  });
  /* ==========================================================
     DATE / TIME
     ========================================================== */
  const DATETIME = Object.freeze({
    LOCALE:
      "en-IN",
    TIMEZONE:
      "Asia/Kolkata",
    DATE_STYLE:
      "medium",
    TIME_STYLE:
      "short"
  });
  /* ==========================================================
     COMPLETE CONFIGURATION
     ========================================================== */
  const GHAR_CONFIG = {
    APP,
    ENV: Object.freeze({
      NODE_ENV:
        environment,
      environment,
      hostname,
      protocol,
      port,
      isProduction,
      isDevelopment,
      isLocalhost,
      isFileProtocol,
      isHttps,
      isHttp
    }),
    SITE_URL,
    API_BASE_URL,
    API,
    AUTH,
    USER,
    PROPERTY,
    SEARCH,
    AI,
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
    ADMIN_API,
    ADMIN_AI,
    ROLES,
    ROLE_GROUPS,
    ROLE_META,
    ROLE_ROUTES,
    ROLE_HELPERS,
    PERMISSIONS,
    ROLE_PERMISSIONS,
    BUYER,
    SELLER,
    TENANT,
    AGENT,
    ADMIN,
    SUPER_ADMIN,
    STORAGE_KEYS,
    UPLOADS,
    VERIFICATION_LEVELS,
    PROPERTY_STATUS,
    PROPERTY_PURPOSE,
    PROPERTY_TYPES,
    LEAD_STATUSES,
    APPLICATION_STATUSES,
    OFFER_STATUSES,
    PAYMENT_STATUSES,
    SUBSCRIPTION_PLANS,
    SUBSCRIPTION_STATUS,
    PAGES,
    SETTINGS,
    FEATURES,
    NETWORK,
    LANGUAGES,
    CURRENCY,
    DATETIME
  };
  /* ==========================================================
     CONFIG HELPERS
     ========================================================== */
  GHAR_CONFIG.getRole =
    function () {
      try {
        const stored =
          window.localStorage.getItem(
            STORAGE_KEYS.ROLE
          );
        return ROLE_HELPERS.normalize(
          stored
        );
      } catch {
        return null;
      }
    };
  GHAR_CONFIG.getUser =
    function () {
      try {
        const raw =
          window.localStorage.getItem(
            STORAGE_KEYS.USER
          );
        if (!raw) {
          return null;
        }
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };
  GHAR_CONFIG.getDashboard =
    function (role) {
      return ROLE_HELPERS.dashboard(
        role ||
        GHAR_CONFIG.getRole()
      );
    };
  GHAR_CONFIG.hasPermission =
    function (
      role,
      permission
    ) {
      const normalized =
        ROLE_HELPERS.normalize(
          role
        );
      if (!normalized) {
        return false;
      }
      const permissions =
        ROLE_PERMISSIONS[
          normalized
        ] || [];
      return permissions.includes(
        permission
      );
    };
  GHAR_CONFIG.isAdmin =
    function (role) {
      return ROLE_HELPERS.isAdmin(
        role ||
        GHAR_CONFIG.getRole()
      );
    };
  GHAR_CONFIG.isSuperAdmin =
    function (role) {
      return ROLE_HELPERS.isSuperAdmin(
        role ||
        GHAR_CONFIG.getRole()
      );
    };
  GHAR_CONFIG.roleRoute =
    function (
      role,
      route
    ) {
      const normalized =
        ROLE_HELPERS.normalize(
          role
        );
      if (!normalized) {
        return PAGES.LOGIN;
      }
      const routes =
        ROLE_ROUTES[
          normalized
        ];
      if (!routes) {
        return PAGES.DASHBOARD;
      }
      return (
        routes[route] ||
        routes.DASHBOARD ||
        PAGES.DASHBOARD
      );
    };
  /* ==========================================================
     FREEZE CONFIGURATION
     ========================================================== */
  Object.freeze(
    GHAR_CONFIG
  );
  /* ==========================================================
     GLOBAL EXPORT
     ========================================================== */
  window.GHAR =
    GHAR;
  window.GHAR.config =
    GHAR_CONFIG;
  /* Compatibility */
  window.GHAR_CONFIG =
    GHAR_CONFIG;
  /* ==========================================================
     DEBUG
     ========================================================== */
  if (!isProduction) {
    console.info(
      "[GHAR] Configuration loaded"
    );
    console.info(
      "[GHAR] Version:",
      APP.VERSION
    );
    console.info(
      "[GHAR] Environment:",
      environment
    );
    console.info(
      "[GHAR] API:",
      API_BASE_URL
    );
    console.info(
      "[GHAR] Roles:",
      ROLE_GROUPS.AUTHENTICATED
    );
  }
})(window);

This version also adds the Agent and Super Admin roles, role groups, role metadata, role-specific routes, permissions, property/application/offer/payment statuses, and helper functions such as GHAR_CONFIG.getDashboard(), GHAR_CONFIG.hasPermission(), and GHAR_CONFIG.roleRoute().