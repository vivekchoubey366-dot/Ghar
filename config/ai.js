"use strict";

/**
 * ============================================================
 * GHAR AI - CENTRAL AI CONFIGURATION
 * ============================================================
 *
 * Architecture:
 *
 * Frontend
 *    ↓
 * AI Frontend Router
 *    ↓
 * /api/ai/*
 *    ↓
 * ai.routes.js
 *    ↓
 * ai.controller.js
 *    ↓
 * AI Service Router
 *    ↓
 * Individual AI Services
 *    ↓
 * External AI Provider / Model
 *    ↓
 * GHAR Models / Database
 *
 * This file is the single configuration source for the
 * server-side GHAR AI system.
 *
 * IMPORTANT:
 * - Never expose AI_API_KEY to frontend JavaScript.
 * - Never put the API key in HTML.
 * - Never commit .env.
 * - Sensitive documents must not automatically be sent
 *   to an external AI provider without explicit controls.
 * ============================================================
 */

const env = require("./env");

/* ------------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------------ */

/**
 * Convert environment string to boolean safely.
 */
function toBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  return String(value).trim().toLowerCase() === "true";
}

/**
 * Read a number while preserving valid zero values.
 */
function toNumber(value, defaultValue, options = {}) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return defaultValue;
  }

  if (
    options.min !== undefined &&
    number < options.min
  ) {
    return defaultValue;
  }

  if (
    options.max !== undefined &&
    number > options.max
  ) {
    return defaultValue;
  }

  return number;
}

/**
 * Remove trailing slashes from URLs.
 */
function normalizeUrl(value) {
  return String(value || "").replace(/\/+$/, "");
}

/* ------------------------------------------------------------
 * BASIC AI SETTINGS
 * ------------------------------------------------------------ */

const provider =
  process.env.AI_PROVIDER ||
  "openai";

const apiKey =
  env.ai?.apiKey ||
  process.env.AI_API_KEY ||
  "";

const apiUrl = normalizeUrl(
  env.ai?.apiUrl ||
    process.env.AI_API_URL ||
    "https://api.openai.com/v1"
);

const model =
  env.ai?.model ||
  process.env.AI_MODEL ||
  "";

const fallbackModel =
  process.env.AI_FALLBACK_MODEL ||
  "";

const environment =
  env.nodeEnv ||
  process.env.NODE_ENV ||
  "development";

/* ------------------------------------------------------------
 * AI ENABLEMENT
 * ------------------------------------------------------------ */

/*
 * AI_ENABLED is the master switch.
 *
 * Development:
 *   AI_ENABLED=false
 *   → AI requests are disabled.
 *
 * Production:
 *   AI_ENABLED=true
 *   + valid API credentials
 *   → AI can operate.
 */

const explicitlyEnabled =
  toBoolean(
    process.env.AI_ENABLED,
    false
  );

const hasCredentials =
  Boolean(apiKey);

/*
 * AI is considered operational only when both the master
 * switch and provider credentials are available.
 */

const operational =
  explicitlyEnabled &&
  hasCredentials;

/* ------------------------------------------------------------
 * REQUEST CONFIGURATION
 * ------------------------------------------------------------ */

const request = {
  timeoutMs: toNumber(
    process.env.AI_TIMEOUT,
    60_000,
    {
      min: 1_000,
      max: 300_000
    }
  ),

  maxRetries: toNumber(
    process.env.AI_MAX_RETRIES,
    2,
    {
      min: 0,
      max: 10
    }
  ),

  retryDelayMs: toNumber(
    process.env.AI_RETRY_DELAY_MS,
    1_000,
    {
      min: 100,
      max: 30_000
    }
  ),

  maxConcurrentRequests: toNumber(
    process.env.AI_MAX_CONCURRENT_REQUESTS,
    10,
    {
      min: 1,
      max: 100
    }
  ),

  maxTokens: toNumber(
    process.env.AI_MAX_TOKENS,
    4_000,
    {
      min: 1,
      max: 100_000
    }
  ),

  temperature: toNumber(
    process.env.AI_TEMPERATURE,
    0.2,
    {
      min: 0,
      max: 2
    }
  ),

  topP: toNumber(
    process.env.AI_TOP_P,
    1,
    {
      min: 0,
      max: 1
    }
  )
};

/* ------------------------------------------------------------
 * MODEL CONFIGURATION
 * ------------------------------------------------------------ */

const models = {
  default:
    model,

  fallback:
    fallbackModel,

  /*
   * Optional specialized models.
   *
   * If empty, the AI service layer should fall back to
   * the default model.
   */

  chat:
    process.env.AI_CHAT_MODEL ||
    model,

  search:
    process.env.AI_SEARCH_MODEL ||
    model,

  recommendations:
    process.env.AI_RECOMMENDATIONS_MODEL ||
    model,

  pricing:
    process.env.AI_PRICING_MODEL ||
    model,

  investment:
    process.env.AI_INVESTMENT_MODEL ||
    model,

  loans:
    process.env.AI_LOAN_MODEL ||
    model,

  documents:
    process.env.AI_DOCUMENT_MODEL ||
    model,

  propertyContent:
    process.env.AI_PROPERTY_CONTENT_MODEL ||
    model,

  rental:
    process.env.AI_RENTAL_MODEL ||
    model,

  moderation:
    process.env.AI_MODERATION_MODEL ||
    model,

  fraud:
    process.env.AI_FRAUD_MODEL ||
    model
};

/* ------------------------------------------------------------
 * GHAR AI MODULES
 * ------------------------------------------------------------ */

const modules = {
  chat: toBoolean(
    process.env.AI_CHAT,
    true
  ),

  search: toBoolean(
    process.env.AI_PROPERTY_SEARCH,
    true
  ),

  recommendations: toBoolean(
    process.env.AI_RECOMMENDATIONS,
    true
  ),

  priceEstimation: toBoolean(
    process.env.AI_PRICE_ESTIMATION,
    true
  ),

  investment: toBoolean(
    process.env.AI_INVESTMENT_ADVISOR,
    true
  ),

  loanAdvisor: toBoolean(
    process.env.AI_LOAN_ADVISOR,
    true
  ),

  documentAssistant: toBoolean(
    process.env.AI_DOCUMENT_ASSISTANT,
    true
  ),

  propertyDescription: toBoolean(
    process.env.AI_PROPERTY_DESCRIPTION,
    true
  ),

  rentalAdvisor: toBoolean(
    process.env.AI_RENTAL_ASSISTANCE,
    true
  ),

  moderation: toBoolean(
    process.env.AI_MODERATION,
    true
  ),

  fraudDetection: toBoolean(
    process.env.AI_FRAUD_DETECTION,
    true
  )
};

/* ------------------------------------------------------------
 * AI ROUTES
 * ------------------------------------------------------------ */

const routes = {
  base: "/api/ai",

  chat: "/chat",

  search: "/search",

  recommendations:
    "/recommendations",

  pricing:
    "/pricing",

  investment:
    "/investment",

  loans:
    "/loans",

  documents:
    "/documents",

  propertyContent:
    "/property-content",

  rental:
    "/rental",

  moderation:
    "/moderation",

  fraud:
    "/fraud"
};

/* ------------------------------------------------------------
 * ROUTE → MODULE MAP
 * ------------------------------------------------------------ */

const routeModules = {
  chat: "chat",
  search: "search",
  recommendations: "recommendations",
  pricing: "priceEstimation",
  investment: "investment",
  loans: "loanAdvisor",
  documents: "documentAssistant",
  propertyContent: "propertyDescription",
  rental: "rentalAdvisor",
  moderation: "moderation",
  fraud: "fraudDetection"
};

/* ------------------------------------------------------------
 * LIMITS
 * ------------------------------------------------------------ */

const limits = {
  promptLength: toNumber(
    process.env.AI_MAX_PROMPT_LENGTH,
    20_000,
    {
      min: 100,
      max: 1_000_000
    }
  ),

  contextLength: toNumber(
    process.env.AI_MAX_CONTEXT_LENGTH,
    50_000,
    {
      min: 100,
      max: 2_000_000
    }
  ),

  outputLength: toNumber(
    process.env.AI_MAX_OUTPUT_LENGTH,
    20_000,
    {
      min: 100,
      max: 1_000_000
    }
  ),

  requestsPerMinute: toNumber(
    process.env.AI_REQUESTS_PER_MINUTE,
    30,
    {
      min: 1,
      max: 10_000
    }
  ),

  requestsPerDay: toNumber(
    process.env.AI_REQUESTS_PER_DAY,
    500,
    {
      min: 1,
      max: 1_000_000
    }
  ),

  maxConversationMessages: toNumber(
    process.env.AI_MAX_CONVERSATION_MESSAGES,
    50,
    {
      min: 1,
      max: 500
    }
  )
};

/* ------------------------------------------------------------
 * PRIVACY
 * ------------------------------------------------------------ */

const privacy = {
  /*
   * False by default.
   */

  storePrompts: toBoolean(
    process.env.AI_STORE_PROMPTS,
    false
  ),

  storeResponses: toBoolean(
    process.env.AI_STORE_RESPONSES,
    false
  ),

  /*
   * This should remain false.
   *
   * Sensitive information should be redacted before logging
   * or sending data to an AI provider.
   */

  storeSensitiveData: false,

  redactSensitiveData: toBoolean(
    process.env.AI_REDACT_SENSITIVE_DATA,
    true
  ),

  logRequests: toBoolean(
    process.env.AI_LOG_REQUESTS,
    true
  ),

  logResponses: toBoolean(
    process.env.AI_LOG_RESPONSES,
    false
  )
};

/* ------------------------------------------------------------
 * SECURITY / SAFETY
 * ------------------------------------------------------------ */

const safety = {
  moderationEnabled: toBoolean(
    process.env.AI_MODERATION,
    true
  ),

  fraudDetectionEnabled: toBoolean(
    process.env.AI_FRAUD_DETECTION,
    true
  ),

  documentSafetyChecks: toBoolean(
    process.env.AI_DOCUMENT_SAFETY_CHECKS,
    true
  ),

  propertyContentModeration: toBoolean(
    process.env.AI_PROPERTY_CONTENT_MODERATION,
    true
  ),

  blockUnsafeRequests: toBoolean(
    process.env.AI_BLOCK_UNSAFE_REQUESTS,
    true
  ),

  requireHumanReviewForFraud: toBoolean(
    process.env.AI_REQUIRE_HUMAN_REVIEW_FRAUD,
    true
  ),

  requireHumanReviewForDocuments: toBoolean(
    process.env.AI_REQUIRE_HUMAN_REVIEW_DOCUMENTS,
    true
  ),

  requireHumanReviewForHighRiskLoans: toBoolean(
    process.env.AI_REQUIRE_HUMAN_REVIEW_LOANS,
    true
  )
};

/* ------------------------------------------------------------
 * CACHE
 * ------------------------------------------------------------ */

const cache = {
  enabled: toBoolean(
    process.env.AI_CACHE_ENABLED,
    false
  ),

  ttlMs: toNumber(
    process.env.AI_CACHE_TTL_MS,
    300_000,
    {
      min: 1_000,
      max: 86_400_000
    }
  )
};

/* ------------------------------------------------------------
 * FEATURE FLAGS
 * ------------------------------------------------------------ */

const features = {
  streaming: toBoolean(
    process.env.AI_STREAMING_ENABLED,
    true
  ),

  conversationMemory: toBoolean(
    process.env.AI_MEMORY_ENABLED,
    true
  ),

  recommendations: modules.recommendations,

  documentAnalysis:
    modules.documentAssistant,

  propertySearch:
    modules.search
};

/* ------------------------------------------------------------
 * CONFIGURATION OBJECT
 * ------------------------------------------------------------ */

const aiConfig = {
  enabled: explicitlyEnabled,

  operational,

  environment,

  provider,

  apiKey,

  apiUrl,

  organization:
    process.env.AI_ORGANIZATION || "",

  project:
    process.env.AI_PROJECT || "",

  models,

  request,

  modules,

  routes,

  routeModules,

  limits,

  privacy,

  safety,

  cache,

  features
};

/* ------------------------------------------------------------
 * MODULE CHECK
 * ------------------------------------------------------------ */

/**
 * Check whether GHAR AI itself is operational.
 */
function isAIEnabled() {
  return Boolean(
    aiConfig.enabled &&
    aiConfig.operational
  );
}

/**
 * Check whether a particular AI module is enabled.
 *
 * @param {string} moduleName
 * @returns {boolean}
 */
function isAIModuleEnabled(moduleName) {
  if (!isAIEnabled()) {
    return false;
  }

  return Boolean(
    aiConfig.modules[moduleName]
  );
}

/* ------------------------------------------------------------
 * ROUTE HELPERS
 * ------------------------------------------------------------ */

/**
 * Get a configured AI route.
 *
 * @param {string} routeName
 * @returns {string|null}
 */
function getAIRoute(routeName) {
  return (
    aiConfig.routes[routeName] ||
    null
  );
}

/**
 * Get the module associated with an AI route.
 *
 * @param {string} routeName
 * @returns {string|null}
 */
function getAIRouteModule(routeName) {
  return (
    aiConfig.routeModules[routeName] ||
    null
  );
}

/**
 * Check whether an AI route/module can be used.
 *
 * @param {string} routeName
 * @returns {boolean}
 */
function isAIRouteEnabled(routeName) {
  const moduleName =
    getAIRouteModule(routeName);

  if (!moduleName) {
    return false;
  }

  return isAIModuleEnabled(
    moduleName
  );
}

/* ------------------------------------------------------------
 * MODEL HELPER
 * ------------------------------------------------------------ */

/**
 * Return the model assigned to a module.
 *
 * Falls back to the default model.
 *
 * @param {string} moduleName
 * @returns {string}
 */
function getAIModel(moduleName) {
  return (
    aiConfig.models[moduleName] ||
    aiConfig.models.default ||
    ""
  );
}

/* ------------------------------------------------------------
 * CONFIGURATION VALIDATION
 * ------------------------------------------------------------ */

function validateAIConfig() {
  const warnings = [];
  const errors = [];

  /*
   * AI is disabled intentionally.
   */

  if (!aiConfig.enabled) {
    warnings.push(
      "GHAR AI is disabled because AI_ENABLED is false."
    );

    return {
      valid: true,
      enabled: false,
      operational: false,
      provider: aiConfig.provider,
      model: aiConfig.models.default,
      warnings,
      errors
    };
  }

  /*
   * AI enabled but credentials missing.
   */

  if (!aiConfig.apiKey) {
    errors.push(
      "AI_API_KEY is required when AI_ENABLED=true."
    );
  }

  /*
   * Model should normally be explicitly configured.
   */

  if (!aiConfig.models.default) {
    errors.push(
      "AI_MODEL is not configured."
    );
  }

  /*
   * API URL is required.
   */

  if (!aiConfig.apiUrl) {
    errors.push(
      "AI_API_URL is not configured."
    );
  }

  /*
   * Production should not store sensitive AI data.
   */

  if (
    environment === "production" &&
    aiConfig.privacy.storeSensitiveData
  ) {
    errors.push(
      "Sensitive AI data storage cannot be enabled in production."
    );
  }

  /*
   * Warn about potentially expensive settings.
   */

  if (
    aiConfig.request.maxTokens > 20_000
  ) {
    warnings.push(
      "AI_MAX_TOKENS is configured above 20,000."
    );
  }

  return {
    valid:
      errors.length === 0,

    enabled:
      aiConfig.enabled,

    operational:
      errors.length === 0,

    provider:
      aiConfig.provider,

    model:
      aiConfig.models.default,

    warnings,

    errors
  };
}

/* ------------------------------------------------------------
 * SAFE CONFIGURATION
 * ------------------------------------------------------------ */

/**
 * Returns configuration suitable for diagnostics.
 *
 * NEVER returns the API key.
 */
function getSafeAIConfig() {
  return {
    enabled:
      aiConfig.enabled,

    operational:
      aiConfig.operational,

    environment:
      aiConfig.environment,

    provider:
      aiConfig.provider,

    apiUrl:
      aiConfig.apiUrl,

    model:
      aiConfig.models.default,

    fallbackModel:
      Boolean(aiConfig.models.fallback),

    modules: {
      ...aiConfig.modules
    },

    features: {
      ...aiConfig.features
    },

    limits: {
      ...aiConfig.limits
    },

    privacy: {
      ...aiConfig.privacy,
      storeSensitiveData: false
    },

    safety: {
      ...aiConfig.safety
    }
  };
}

/* ------------------------------------------------------------
 * STARTUP VALIDATION
 * ------------------------------------------------------------ */

const validation = validateAIConfig();

if (
  environment === "production" &&
  aiConfig.enabled &&
  !validation.valid
) {
  throw new Error(
    `[GHAR AI] Invalid production AI configuration: ${validation.errors.join(
      "; "
    )}`
  );
}

/* ------------------------------------------------------------
 * EXPORTS
 * ------------------------------------------------------------ */

module.exports = {
  aiConfig,

  isAIEnabled,

  isAIModuleEnabled,

  getAIRoute,

  getAIRouteModule,

  isAIRouteEnabled,

  getAIModel,

  validateAIConfig,

  getSafeAIConfig
};