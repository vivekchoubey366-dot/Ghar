// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/ai/ai-router.js
// GHAR AI ROUTER
// ============================================================

"use strict";

(function (window) {

  const GHAR = window.GHAR = window.GHAR || {};
  const AI = GHAR.AI = GHAR.AI || {};

  // ==========================================================
  // ROUTE DEFINITIONS
  // ==========================================================

  const ROUTES = Object.freeze({

    CHAT: {
      id: "chat",
      path: "/chat",
      module: "ai-chat"
    },

    PROPERTY_SEARCH: {
      id: "property-search",
      path: "/search",
      module: "ai-search"
    },

    RECOMMENDATIONS: {
      id: "recommendations",
      path: "/recommendations",
      module: "ai-recommendations"
    },

    PRICE_ESTIMATION: {
      id: "price-estimation",
      path: "/price",
      module: "ai-price-estimator"
    },

    INVESTMENT: {
      id: "investment-analysis",
      path: "/investment",
      module: "ai-investment"
    },

    LOAN: {
      id: "loan-assistance",
      path: "/loan",
      module: "ai-loan-advisor"
    },

    DOCUMENTS: {
      id: "document-assistance",
      path: "/documents",
      module: "ai-document-assistant"
    },

    PROPERTY_DESCRIPTION: {
      id: "property-description",
      path: "/property-description",
      module: "ai-property-description"
    },

    RENTAL: {
      id: "rental-assistance",
      path: "/rental",
      module: "ai-rental-advisor"
    },

    MODERATION: {
      id: "moderation",
      path: "/moderation",
      module: "ai-moderation"
    },

    FRAUD_DETECTION: {
      id: "fraud-detection",
      path: "/fraud",
      module: "ai-fraud-detection"
    },

    FEEDBACK: {
      id: "feedback",
      path: "/feedback",
      module: "ai-feedback"
    },

    HISTORY: {
      id: "history",
      path: "/history",
      module: "ai-history"
    }

  });

  // ==========================================================
  // ROUTE MAP
  // ==========================================================

  const ROUTE_MAP = Object.freeze({

    chat: ROUTES.CHAT,

    search: ROUTES.PROPERTY_SEARCH,
    propertySearch: ROUTES.PROPERTY_SEARCH,

    recommendations:
      ROUTES.RECOMMENDATIONS,

    price:
      ROUTES.PRICE_ESTIMATION,

    priceEstimation:
      ROUTES.PRICE_ESTIMATION,

    investment:
      ROUTES.INVESTMENT,

    investmentAnalysis:
      ROUTES.INVESTMENT,

    loan:
      ROUTES.LOAN,

    loanAssistance:
      ROUTES.LOAN,

    documents:
      ROUTES.DOCUMENTS,

    documentAssistance:
      ROUTES.DOCUMENTS,

    propertyDescription:
      ROUTES.PROPERTY_DESCRIPTION,

    rental:
      ROUTES.RENTAL,

    rentalAssistance:
      ROUTES.RENTAL,

    moderation:
      ROUTES.MODERATION,

    fraud:
      ROUTES.FRAUD_DETECTION,

    fraudDetection:
      ROUTES.FRAUD_DETECTION,

    feedback:
      ROUTES.FEEDBACK,

    history:
      ROUTES.HISTORY

  });

  // ==========================================================
  // NORMALIZE ROUTE
  // ==========================================================

  function normalizeRoute(route) {

    if (!route) {
      return null;
    }

    const key =
      String(route)
        .trim()
        .replace(/^\/+/, "")
        .replace(/\/+$/, "")
        .toLowerCase();

    const aliases = {

      "chat":
        "chat",

      "ai-chat":
        "chat",

      "search":
        "search",

      "property-search":
        "propertySearch",

      "property_search":
        "propertySearch",

      "recommendations":
        "recommendations",

      "recommendation":
        "recommendations",

      "price":
        "price",

      "price-estimator":
        "priceEstimation",

      "price-estimation":
        "priceEstimation",

      "investment":
        "investment",

      "investment-analysis":
        "investmentAnalysis",

      "loan":
        "loan",

      "loan-advisor":
        "loanAssistance",

      "loan-assistance":
        "loanAssistance",

      "documents":
        "documents",

      "document":
        "documents",

      "document-assistant":
        "documentAssistance",

      "document-assistance":
        "documentAssistance",

      "property-description":
        "propertyDescription",

      "property-description-generator":
        "propertyDescription",

      "rental":
        "rental",

      "rental-advisor":
        "rentalAssistance",

      "rental-assistance":
        "rentalAssistance",

      "moderation":
        "moderation",

      "fraud":
        "fraudDetection",

      "fraud-detection":
        "fraudDetection",

      "feedback":
        "feedback",

      "history":
        "history"

    };

    const normalized =
      aliases[key] || key;

    return (
      ROUTE_MAP[normalized] ||
      null
    );

  }

  // ==========================================================
  // GET ROUTE
  // ==========================================================

  function getRoute(route) {

    return normalizeRoute(route);

  }

  // ==========================================================
  // CHECK ROUTE
  // ==========================================================

  function hasRoute(route) {

    return Boolean(
      normalizeRoute(route)
    );

  }

  // ==========================================================
  // LIST ROUTES
  // ==========================================================

  function getRoutes() {

    return Object.values(
      ROUTES
    );

  }

  // ==========================================================
  // BUILD API PATH
  // ==========================================================

  function buildApiPath(route) {

    const definition =
      normalizeRoute(route);

    if (!definition) {
      throw new Error(
        `Unknown GHAR AI route: ${route}`
      );
    }

    return definition.path;

  }

  // ==========================================================
  // EXECUTE ROUTE
  // ==========================================================

  async function execute(
    route,
    payload = {},
    options = {}
  ) {

    const definition =
      normalizeRoute(route);

    if (!definition) {

      const error =
        new Error(
          `Unknown GHAR AI route: ${route}`
        );

      error.code =
        "AI_ROUTE_NOT_FOUND";

      throw error;
    }

    if (
      !AI.Client ||
      typeof AI.Client.post !==
        "function"
    ) {

      const error =
        new Error(
          "GHAR AI Client is not available."
        );

      error.code =
        "AI_CLIENT_UNAVAILABLE";

      throw error;
    }

    return AI.Client.post(
      definition.path,
      payload,
      options
    );

  }

  // ==========================================================
  // GET REQUEST
  // ==========================================================

  async function get(
    route,
    options = {}
  ) {

    const definition =
      normalizeRoute(route);

    if (!definition) {

      const error =
        new Error(
          `Unknown GHAR AI route: ${route}`
        );

      error.code =
        "AI_ROUTE_NOT_FOUND";

      throw error;
    }

    if (
      !AI.Client ||
      typeof AI.Client.get !==
        "function"
    ) {

      const error =
        new Error(
          "GHAR AI Client is not available."
        );

      error.code =
        "AI_CLIENT_UNAVAILABLE";

      throw error;
    }

    return AI.Client.get(
      definition.path,
      options
    );

  }

  // ==========================================================
  // CONVENIENCE ROUTERS
  // ==========================================================

  const router = {

    chat(payload, options) {
      return execute(
        "chat",
        payload,
        options
      );
    },

    propertySearch(
      payload,
      options
    ) {
      return execute(
        "propertySearch",
        payload,
        options
      );
    },

    recommendations(
      payload,
      options
    ) {
      return execute(
        "recommendations",
        payload,
        options
      );
    },

    priceEstimation(
      payload,
      options
    ) {
      return execute(
        "priceEstimation",
        payload,
        options
      );
    },

    investment(
      payload,
      options
    ) {
      return execute(
        "investment",
        payload,
        options
      );
    },

    loanAssistance(
      payload,
      options
    ) {
      return execute(
        "loanAssistance",
        payload,
        options
      );
    },

    documentAssistance(
      payload,
      options
    ) {
      return execute(
        "documentAssistance",
        payload,
        options
      );
    },

    propertyDescription(
      payload,
      options
    ) {
      return execute(
        "propertyDescription",
        payload,
        options
      );
    },

    rentalAssistance(
      payload,
      options
    ) {
      return execute(
        "rentalAssistance",
        payload,
        options
      );
    },

    moderation(
      payload,
      options
    ) {
      return execute(
        "moderation",
        payload,
        options
      );
    },

    fraudDetection(
      payload,
      options
    ) {
      return execute(
        "fraudDetection",
        payload,
        options
      );
    },

    feedback(
      payload,
      options
    ) {
      return execute(
        "feedback",
        payload,
        options
      );
    },

    history(
      options
    ) {
      return get(
        "history",
        options
      );
    }

  };

  // ==========================================================
  // ROUTER PUBLIC API
  // ==========================================================

  AI.Router = {

    ROUTES,

    ROUTE_MAP,

    normalizeRoute,

    getRoute,

    hasRoute,

    getRoutes,

    buildApiPath,

    execute,

    get,

    ...router

  };

  // Compatibility aliases

  AI.router =
    AI.Router;

  GHAR.aiRouter =
    AI.Router;

})(window);