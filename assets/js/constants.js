// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/constants.js
// Global Application Constants
// ============================================================

"use strict";

window.GHAR = window.GHAR || {};


// ============================================================
// APPLICATION
// ============================================================

GHAR.APP = Object.freeze({
  NAME: "GHAR",
  FULL_NAME: "GHAR Real Estate Platform",
  VERSION: "1.0.0",
  DEFAULT_LANGUAGE: "en",
  DEFAULT_CURRENCY: "INR",
  DEFAULT_COUNTRY: "India",
  ENVIRONMENT:
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "development"
      : "production"
});


// ============================================================
// USER ROLES
// ============================================================

GHAR.ROLES = Object.freeze({
  BUYER: "BUYER",
  SELLER: "SELLER",
  TENANT: "TENANT",
  AGENT: "AGENT",
  BUSINESS: "BUSINESS",
  ADMIN: "ADMIN"
});


// ============================================================
// USER ROLE LABELS
// ============================================================

GHAR.ROLE_LABELS = Object.freeze({
  BUYER: "Buyer",
  SELLER: "Seller",
  TENANT: "Tenant",
  AGENT: "Agent",
  BUSINESS: "Business",
  ADMIN: "Administrator"
});


// ============================================================
// AUTHENTICATION STATUS
// ============================================================

GHAR.AUTH_STATUS = Object.freeze({
  AUTHENTICATED: "AUTHENTICATED",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  PENDING: "PENDING",
  EXPIRED: "EXPIRED",
  BLOCKED: "BLOCKED",
  SUSPENDED: "SUSPENDED"
});


// ============================================================
// VERIFICATION LEVELS
// ============================================================

GHAR.VERIFICATION_LEVELS = Object.freeze({
  UNVERIFIED: "UNVERIFIED",
  BASIC_VERIFIED: "BASIC_VERIFIED",
  OWNER_VERIFIED: "OWNER_VERIFIED",
  DOCUMENT_VERIFIED: "DOCUMENT_VERIFIED",
  PROPERTY_VERIFIED: "PROPERTY_VERIFIED"
});


// ============================================================
// VERIFICATION ORDER
// ============================================================

GHAR.VERIFICATION_ORDER = Object.freeze([
  GHAR.VERIFICATION_LEVELS.UNVERIFIED,
  GHAR.VERIFICATION_LEVELS.BASIC_VERIFIED,
  GHAR.VERIFICATION_LEVELS.OWNER_VERIFIED,
  GHAR.VERIFICATION_LEVELS.DOCUMENT_VERIFIED,
  GHAR.VERIFICATION_LEVELS.PROPERTY_VERIFIED
]);


// ============================================================
// LEAD STATUS
// ============================================================

GHAR.LEAD_STATUS = Object.freeze({
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  INTERESTED: "INTERESTED",
  VISIT_SCHEDULED: "VISIT_SCHEDULED",
  NEGOTIATION: "NEGOTIATION",
  CONVERTED: "CONVERTED",
  LOST: "LOST"
});


// ============================================================
// LEAD STATUS ORDER
// ============================================================

GHAR.LEAD_STATUS_ORDER = Object.freeze([
  GHAR.LEAD_STATUS.NEW,
  GHAR.LEAD_STATUS.CONTACTED,
  GHAR.LEAD_STATUS.INTERESTED,
  GHAR.LEAD_STATUS.VISIT_SCHEDULED,
  GHAR.LEAD_STATUS.NEGOTIATION,
  GHAR.LEAD_STATUS.CONVERTED,
  GHAR.LEAD_STATUS.LOST
]);


// ============================================================
// PROPERTY STATUS
// ============================================================

GHAR.PROPERTY_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PUBLISHED: "PUBLISHED",
  PAUSED: "PAUSED",
  SOLD: "SOLD",
  RENTED: "RENTED",
  LEASED: "LEASED",
  EXPIRED: "EXPIRED",
  ARCHIVED: "ARCHIVED"
});


// ============================================================
// PROPERTY PURPOSE
// ============================================================

GHAR.PROPERTY_PURPOSE = Object.freeze({
  SALE: "SALE",
  RENT: "RENT",
  LEASE: "LEASE",
  PG: "PG",
  COMMERCIAL_SALE: "COMMERCIAL_SALE",
  COMMERCIAL_RENT: "COMMERCIAL_RENT"
});


// ============================================================
// PROPERTY TYPES
// ============================================================

GHAR.PROPERTY_TYPES = Object.freeze({
  APARTMENT: "APARTMENT",
  FLAT: "FLAT",
  VILLA: "VILLA",
  INDEPENDENT_HOUSE: "INDEPENDENT_HOUSE",
  BUILDER_FLOOR: "BUILDER_FLOOR",
  PLOT: "PLOT",
  LAND: "LAND",
  STUDIO: "STUDIO",
  FARMHOUSE: "FARMHOUSE",
  PENTHOUSE: "PENTHOUSE",
  OFFICE: "OFFICE",
  SHOP: "SHOP",
  SHOWROOM: "SHOWROOM",
  WAREHOUSE: "WAREHOUSE",
  INDUSTRIAL: "INDUSTRIAL",
  PG: "PG",
  HOSTEL: "HOSTEL",
  OTHER: "OTHER"
});


// ============================================================
// BHK TYPES
// ============================================================

GHAR.BHK_TYPES = Object.freeze([
  "1RK",
  "1BHK",
  "2BHK",
  "3BHK",
  "4BHK",
  "5BHK",
  "6BHK",
  "7BHK",
  "8BHK",
  "9BHK",
  "10BHK"
]);


// ============================================================
// PROPERTY LISTING TYPES
// ============================================================

GHAR.LISTING_TYPES = Object.freeze({
  OWNER: "OWNER",
  AGENT: "AGENT",
  BUILDER: "BUILDER",
  BUSINESS: "BUSINESS"
});


// ============================================================
// PROPERTY FURNISHING
// ============================================================

GHAR.FURNISHING = Object.freeze({
  UNFURNISHED: "UNFURNISHED",
  SEMI_FURNISHED: "SEMI_FURNISHED",
  FULLY_FURNISHED: "FULLY_FURNISHED"
});


// ============================================================
// PROPERTY FACING
// ============================================================

GHAR.FACING = Object.freeze([
  "NORTH",
  "SOUTH",
  "EAST",
  "WEST",
  "NORTH_EAST",
  "NORTH_WEST",
  "SOUTH_EAST",
  "SOUTH_WEST"
]);


// ============================================================
// PROPERTY AMENITIES
// ============================================================

GHAR.AMENITIES = Object.freeze([
  "PARKING",
  "LIFT",
  "POWER_BACKUP",
  "SECURITY",
  "CCTV",
  "GYM",
  "SWIMMING_POOL",
  "CLUBHOUSE",
  "GARDEN",
  "PLAY_AREA",
  "GATED_COMMUNITY",
  "FIRE_SAFETY",
  "WATER_SUPPLY",
  "INTERNET",
  "AIR_CONDITIONING",
  "BALCONY",
  "TERRACE",
  "SERVANT_ROOM",
  "STUDY_ROOM"
]);


// ============================================================
// VISIT STATUS
// ============================================================

GHAR.VISIT_STATUS = Object.freeze({
  REQUESTED: "REQUESTED",
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  RESCHEDULED: "RESCHEDULED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW"
});


// ============================================================
// OFFER STATUS
// ============================================================

GHAR.OFFER_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  VIEWED: "VIEWED",
  COUNTERED: "COUNTERED",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
  EXPIRED: "EXPIRED"
});


// ============================================================
// APPLICATION STATUS
// ============================================================

GHAR.APPLICATION_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  DOCUMENTS_REQUIRED: "DOCUMENTS_REQUIRED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED"
});


// ============================================================
// DOCUMENT STATUS
// ============================================================

GHAR.DOCUMENT_STATUS = Object.freeze({
  UPLOADED: "UPLOADED",
  PROCESSING: "PROCESSING",
  PENDING_REVIEW: "PENDING_REVIEW",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED"
});


// ============================================================
// DOCUMENT TYPES
// ============================================================

GHAR.DOCUMENT_TYPES = Object.freeze({
  IDENTITY: "IDENTITY",
  ADDRESS: "ADDRESS",
  PAN: "PAN",
  AADHAAR: "AADHAAR",
  PASSPORT: "PASSPORT",
  DRIVING_LICENSE: "DRIVING_LICENSE",
  OWNERSHIP: "OWNERSHIP",
  SALE_DEED: "SALE_DEED",
  RENT_AGREEMENT: "RENT_AGREEMENT",
  PROPERTY_TAX: "PROPERTY_TAX",
  ENCUMBRANCE_CERTIFICATE: "ENCUMBRANCE_CERTIFICATE",
  BANK_STATEMENT: "BANK_STATEMENT",
  INCOME_PROOF: "INCOME_PROOF",
  EMPLOYMENT_PROOF: "EMPLOYMENT_PROOF",
  OTHER: "OTHER"
});


// ============================================================
// PAYMENT STATUS
// ============================================================

GHAR.PAYMENT_STATUS = Object.freeze({
  CREATED: "CREATED",
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
  PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED"
});


// ============================================================
// PAYMENT TYPES
// ============================================================

GHAR.PAYMENT_TYPES = Object.freeze({
  SUBSCRIPTION: "SUBSCRIPTION",
  PROPERTY_LISTING: "PROPERTY_LISTING",
  PREMIUM_LISTING: "PREMIUM_LISTING",
  SERVICE: "SERVICE",
  LOAN_FEE: "LOAN_FEE",
  REFUND: "REFUND",
  OTHER: "OTHER"
});


// ============================================================
// SUBSCRIPTION PLANS
// ============================================================

GHAR.SUBSCRIPTION_PLANS = Object.freeze({
  FREE: "FREE",
  BUYER_PLUS: "BUYER_PLUS",
  SELLER_PRO: "SELLER_PRO",
  AGENT_PRO: "AGENT_PRO",
  BUSINESS: "BUSINESS"
});


// ============================================================
// SUBSCRIPTION STATUS
// ============================================================

GHAR.SUBSCRIPTION_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  TRIAL: "TRIAL",
  PENDING: "PENDING",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  SUSPENDED: "SUSPENDED"
});


// ============================================================
// SUBSCRIPTION DATABASE FIELDS
// ============================================================

GHAR.SUBSCRIPTION_FIELDS = Object.freeze([
  "subscription",
  "subscription_plan",
  "subscription_status",
  "subscription_start",
  "subscription_end"
]);


// ============================================================
// LOAN STATUS
// ============================================================

GHAR.LOAN_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  ELIGIBILITY_PENDING: "ELIGIBILITY_PENDING",
  ELIGIBLE: "ELIGIBLE",
  NOT_ELIGIBLE: "NOT_ELIGIBLE",
  APPLICATION_SUBMITTED: "APPLICATION_SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  DISBURSED: "DISBURSED",
  CLOSED: "CLOSED"
});


// ============================================================
// NOTIFICATION TYPES
// ============================================================

GHAR.NOTIFICATION_TYPES = Object.freeze({
  SYSTEM: "SYSTEM",
  AUTH: "AUTH",
  PROPERTY: "PROPERTY",
  VISIT: "VISIT",
  OFFER: "OFFER",
  APPLICATION: "APPLICATION",
  DOCUMENT: "DOCUMENT",
  VERIFICATION: "VERIFICATION",
  PAYMENT: "PAYMENT",
  SUBSCRIPTION: "SUBSCRIPTION",
  LOAN: "LOAN",
  MESSAGE: "MESSAGE",
  SUPPORT: "SUPPORT",
  AI: "AI",
  SECURITY: "SECURITY"
});


// ============================================================
// MESSAGE TYPES
// ============================================================

GHAR.MESSAGE_TYPES = Object.freeze({
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  DOCUMENT: "DOCUMENT",
  SYSTEM: "SYSTEM"
});


// ============================================================
// SUPPORT TICKET STATUS
// ============================================================

GHAR.SUPPORT_STATUS = Object.freeze({
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  WAITING_FOR_USER: "WAITING_FOR_USER",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED"
});


// ============================================================
// SUPPORT PRIORITY
// ============================================================

GHAR.SUPPORT_PRIORITY = Object.freeze({
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT"
});


// ============================================================
// AI MODULES
// ============================================================

GHAR.AI_MODULES = Object.freeze({
  PROPERTY_SEARCH: "property-search",
  RECOMMENDATIONS: "recommendations",
  PRICE_ESTIMATION: "price-estimation",
  INVESTMENT_ANALYSIS: "investment-analysis",
  LOAN_ASSISTANCE: "loan-assistance",
  DOCUMENT_ASSISTANCE: "document-assistance",
  PROPERTY_DESCRIPTION: "property-description",
  RENTAL_ASSISTANCE: "rental-assistance",
  MODERATION: "moderation",
  FRAUD_DETECTION: "fraud-detection"
});


// ============================================================
// AI ENDPOINTS
// ============================================================

GHAR.AI_ENDPOINTS = Object.freeze({
  SEARCH: "/api/ai/search",
  RECOMMENDATIONS: "/api/ai/recommendations",
  PRICE: "/api/ai/price",
  INVESTMENT: "/api/ai/investment",
  LOAN: "/api/ai/loan",
  DOCUMENTS: "/api/ai/documents",
  PROPERTY_DESCRIPTION:
    "/api/ai/property-description",
  RENTAL: "/api/ai/rental",
  MODERATION: "/api/ai/moderation",
  HEALTH: "/api/ai/health",
  MODULES: "/api/ai/modules"
});


// ============================================================
// AI REQUEST STATUS
// ============================================================

GHAR.AI_STATUS = Object.freeze({
  IDLE: "IDLE",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED"
});


// ============================================================
// API
// ============================================================

GHAR.API = Object.freeze({
  BASE: "/api",

  HEALTH: "/api/health",

  AUTH: "/api/auth",
  USERS: "/api/users",
  PROPERTIES: "/api/properties",
  SEARCH: "/api/search",
  MARKETPLACE: "/api/marketplace",
  FAVOURITES: "/api/favourites",
  PROPERTY_SEARCHES: "/api/property-searches",

  VISITS: "/api/visits",
  OFFERS: "/api/offers",
  APPLICATIONS: "/api/applications",

  DOCUMENTS: "/api/documents",
  VERIFICATION: "/api/verification",

  PAYMENTS: "/api/payments",
  SUBSCRIPTIONS: "/api/subscriptions",

  LOANS: "/api/loans",

  REFERRALS: "/api/referrals",
  NOTIFICATIONS: "/api/notifications",
  MESSAGES: "/api/messages",

  SUPPORT: "/api/support",
  CONTACT: "/api/contact",

  ADMIN: "/api/admin",
  ADMIN_AI: "/api/admin/ai",

  AI: "/api/ai",

  PLATFORM_STATUS:
    "/api/platform/status",

  ROUTES:
    "/api/routes"
});


// ============================================================
// HTTP METHODS
// ============================================================

GHAR.HTTP_METHODS = Object.freeze({
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE"
});


// ============================================================
// HTTP STATUS CODES
// ============================================================

GHAR.HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  RATE_LIMITED: 429,

  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
});


// ============================================================
// STORAGE KEYS
// ============================================================

GHAR.STORAGE_KEYS = Object.freeze({
  ACCESS_TOKEN:
    "ghar_access_token",

  REFRESH_TOKEN:
    "ghar_refresh_token",

  USER:
    "ghar_user",

  USER_ID:
    "ghar_user_id",

  ROLE:
    "ghar_role",

  AUTH_STATUS:
    "ghar_auth_status",

  LANGUAGE:
    "ghar_language",

  THEME:
    "ghar_theme",

  CURRENCY:
    "ghar_currency",

  FAVOURITES:
    "ghar_favourites",

  SAVED_PROPERTIES:
    "ghar_saved_properties",

  RECENT_SEARCHES:
    "ghar_recent_searches",

  PROPERTY_SEARCHES:
    "ghar_property_searches",

  COMPARE:
    "ghar_compare",

  NOTIFICATIONS:
    "ghar_notifications",

  SETTINGS:
    "ghar_settings"
});


// ============================================================
// FILE UPLOAD
// ============================================================

GHAR.FILE_UPLOAD = Object.freeze({

  MAX_IMAGE_SIZE:
    10 * 1024 * 1024,

  MAX_VIDEO_SIZE:
    100 * 1024 * 1024,

  MAX_DOCUMENT_SIZE:
    25 * 1024 * 1024,

  IMAGE_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif"
  ],

  VIDEO_TYPES: [
    "video/mp4",
    "video/webm",
    "video/quicktime"
  ],

  DOCUMENT_TYPES: [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ]

});


// ============================================================
// PAGINATION
// ============================================================

GHAR.PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
});


// ============================================================
// DATE / TIME
// ============================================================

GHAR.DATE = Object.freeze({
  LOCALE: "en-IN",
  TIMEZONE: "Asia/Kolkata",
  DATE_FORMAT: "DD/MM/YYYY",
  TIME_FORMAT: "hh:mm A"
});


// ============================================================
// CURRENCY
// ============================================================

GHAR.CURRENCY = Object.freeze({
  CODE: "INR",
  SYMBOL: "₹",
  LOCALE: "en-IN"
});


// ============================================================
// ROUTE GROUPS
// ============================================================

GHAR.ROUTE_GROUPS = Object.freeze({
  PUBLIC: "PUBLIC",
  AUTH: "AUTH",
  BUYER: "BUYER",
  SELLER: "SELLER",
  TENANT: "TENANT",
  ADMIN: "ADMIN"
});


// ============================================================
// ACCESS LEVELS
// ============================================================

GHAR.ACCESS = Object.freeze({
  PUBLIC: "PUBLIC",
  AUTHENTICATED: "AUTHENTICATED",
  VERIFIED: "VERIFIED",
  OWNER: "OWNER",
  ADMIN: "ADMIN"
});


// ============================================================
// THEME
// ============================================================

GHAR.THEME = Object.freeze({
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system"
});


// ============================================================
// EVENTS
// ============================================================

GHAR.EVENTS = Object.freeze({

  AUTH_LOGIN:
    "ghar:auth:login",

  AUTH_LOGOUT:
    "ghar:auth:logout",

  AUTH_CHANGED:
    "ghar:auth:changed",

  USER_UPDATED:
    "ghar:user:updated",

  PROPERTY_CREATED:
    "ghar:property:created",

  PROPERTY_UPDATED:
    "ghar:property:updated",

  PROPERTY_DELETED:
    "ghar:property:deleted",

  PROPERTY_SAVED:
    "ghar:property:saved",

  PROPERTY_UNSAVED:
    "ghar:property:unsaved",

  VISIT_CREATED:
    "ghar:visit:created",

  OFFER_CREATED:
    "ghar:offer:created",

  PAYMENT_SUCCESS:
    "ghar:payment:success",

  PAYMENT_FAILED:
    "ghar:payment:failed",

  NOTIFICATION_RECEIVED:
    "ghar:notification:received",

  MESSAGE_RECEIVED:
    "ghar:message:received",

  AI_REQUEST_STARTED:
    "ghar:ai:request:started",

  AI_REQUEST_COMPLETED:
    "ghar:ai:request:completed",

  AI_REQUEST_FAILED:
    "ghar:ai:request:failed"
});


// ============================================================
// ERROR CODES
// ============================================================

GHAR.ERROR_CODES = Object.freeze({
  UNKNOWN: "GHAR_UNKNOWN_ERROR",
  NETWORK: "GHAR_NETWORK_ERROR",
  AUTH_REQUIRED: "GHAR_AUTH_REQUIRED",
  SESSION_EXPIRED: "GHAR_SESSION_EXPIRED",
  ACCESS_DENIED: "GHAR_ACCESS_DENIED",
  VALIDATION: "GHAR_VALIDATION_ERROR",
  NOT_FOUND: "GHAR_NOT_FOUND",
  SERVER: "GHAR_SERVER_ERROR",
  AI_ERROR: "GHAR_AI_ERROR",
  PAYMENT_ERROR: "GHAR_PAYMENT_ERROR",
  UPLOAD_ERROR: "GHAR_UPLOAD_ERROR"
});


// ============================================================
// REGEX
// ============================================================

GHAR.REGEX = Object.freeze({

  EMAIL:
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  PHONE:
    /^[6-9]\d{9}$/,

  PINCODE:
    /^\d{6}$/,

  PAN:
    /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,

  OTP:
    /^\d{6}$/,

  PASSWORD:
    /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

});


// ============================================================
// DEFAULT VALUES
// ============================================================

GHAR.DEFAULTS = Object.freeze({

  ROLE:
    GHAR.ROLES.BUYER,

  AUTH_STATUS:
    GHAR.AUTH_STATUS.UNAUTHENTICATED,

  VERIFICATION:
    GHAR.VERIFICATION_LEVELS.UNVERIFIED,

  PROPERTY_STATUS:
    GHAR.PROPERTY_STATUS.DRAFT,

  SUBSCRIPTION:
    GHAR.SUBSCRIPTION_PLANS.FREE,

  SUBSCRIPTION_STATUS:
    GHAR.SUBSCRIPTION_STATUS.INACTIVE,

  LANGUAGE:
    GHAR.APP.DEFAULT_LANGUAGE,

  CURRENCY:
    GHAR.APP.DEFAULT_CURRENCY,

  PAGE:
    GHAR.PAGINATION.DEFAULT_PAGE,

  LIMIT:
    GHAR.PAGINATION.DEFAULT_LIMIT

});


// ============================================================
// FREEZE MAIN OBJECT
// ============================================================

Object.freeze(GHAR);


// ============================================================
// DEBUG
// ============================================================

if (
  GHAR.APP.ENVIRONMENT === "development"
) {

  console.log(
    "[GHAR] constants.js loaded"
  );

  console.log(
    "[GHAR] Version:",
    GHAR.APP.VERSION
  );

}