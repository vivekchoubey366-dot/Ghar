// ============================================================
// GHAR AI
// assets/js/ai/ai.js
// Main AI frontend controller
// ============================================================

"use strict";

(function (window) {

  // ----------------------------------------------------------
  // GHAR namespace
  // ----------------------------------------------------------

  window.GHAR = window.GHAR || {};
  GHAR.AI = GHAR.AI || {};

  // ----------------------------------------------------------
  // Configuration
  // ----------------------------------------------------------

  const DEFAULT_CONFIG = {
    enabled: true,

    apiBase:
      "/api/ai",

    healthEndpoint:
      "/api/ai/health",

    modulesEndpoint:
      "/api/ai/modules",

    timeout:
      30000,

    historyEnabled:
      true,

    feedbackEnabled:
      true
  };

  let config = {
    ...DEFAULT_CONFIG
  };

  // ----------------------------------------------------------
  // Runtime state
  // ----------------------------------------------------------

  const state = {
    initialized: false,

    ready: false,

    loading: false,

    error: null,

    activeModule: null,

    requestCount: 0,

    lastRequest: null,

    lastResponse: null,

    health: null,

    modules: []
  };

  // ----------------------------------------------------------
  // AI module registry
  // ----------------------------------------------------------

  const MODULES = {

    chat: {
      id: "chat",
      name: "AI Chat",
      script: "ai-chat.js"
    },

    search: {
      id: "search",
      name: "Property Search",
      script: "ai-search.js"
    },

    recommendations: {
      id: "recommendations",
      name: "Recommendations",
      script: "ai-recommendations.js"
    },

    priceEstimator: {
      id: "price-estimator",
      name: "Price Estimation",
      script: "ai-price-estimator.js"
    },

    investment: {
      id: "investment",
      name: "Investment Analysis",
      script: "ai-investment.js"
    },

    loanAdvisor: {
      id: "loan-advisor",
      name: "Loan Assistance",
      script: "ai-loan-advisor.js"
    },

    documentAssistant: {
      id: "document-assistant",
      name: "Document Assistance",
      script: "ai-document-assistant.js"
    },

    propertyDescription: {
      id: "property-description",
      name: "Property Description",
      script: "ai-property-description.js"
    },

    rentalAdvisor: {
      id: "rental-advisor",
      name: "Rental Assistance",
      script: "ai-rental-advisor.js"
    },

    moderation: {
      id: "moderation",
      name: "Moderation",
      script: "ai-moderation.js"
    },

    fraudDetection: {
      id: "fraud-detection",
      name: "Fraud Detection",
      script: "ai-fraud-detection.js"
    }
  };

  // ----------------------------------------------------------
  // Utility
  // ----------------------------------------------------------

  function now() {
    return new Date().toISOString();
  }

  function setError(error) {

    state.error =
      error instanceof Error
        ? error.message
        : String(error || "Unknown AI error");

  }

  function clearError() {
    state.error = null;
  }

  // ----------------------------------------------------------
  // Configuration
  // ----------------------------------------------------------

  function configure(options = {}) {

    config = {
      ...config,
      ...options
    };

    return getConfig();
  }

  function getConfig() {

    return {
      ...config
    };
  }

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------

  function getState() {

    return {
      ...state,
      modules: [
        ...state.modules
      ]
    };
  }

  function setLoading(value) {
    state.loading = Boolean(value);
  }

  // ----------------------------------------------------------
  // API request
  // ----------------------------------------------------------

  async function request(
    endpoint,
    options = {}
  ) {

    if (!config.enabled) {
      throw new Error(
        "GHAR AI is currently disabled."
      );
    }

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        config.timeout
      );

    clearError();

    state.loading = true;

    state.requestCount += 1;

    state.lastRequest = {
      endpoint,
      method:
        options.method || "GET",
      timestamp: now()
    };

    try {

      const response =
        await fetch(
          endpoint,
          {
            credentials: "include",

            ...options,

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",

              ...(options.headers || {})
            },

            signal:
              options.signal ||
              controller.signal
          }
        );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      let data;

      if (
        contentType.includes(
          "application/json"
        )
      ) {

        data =
          await response.json();

      } else {

        data =
          await response.text();

      }

      if (!response.ok) {

        const message =
          data &&
          typeof data === "object" &&
          data.error
            ? data.error
            : `AI request failed (${response.status})`;

        throw new Error(message);
      }

      state.lastResponse = {
        endpoint,
        status:
          response.status,
        timestamp:
          now()
      };

      return data;

    } catch (error) {

      setError(error);

      throw error;

    } finally {

      clearTimeout(timeout);

      state.loading = false;

    }
  }

  // ----------------------------------------------------------
  // Health
  // ----------------------------------------------------------

  async function healthCheck() {

    try {

      const result =
        await request(
          config.healthEndpoint
        );

      state.health =
        result;

      state.ready =
        Boolean(
          result &&
          (
            result.ok === true ||
            result.status === "operational"
          )
        );

      return result;

    } catch (error) {

      state.health = {
        ok: false,
        error:
          error.message
      };

      state.ready = false;

      return state.health;
    }
  }

  // ----------------------------------------------------------
  // Load available AI modules
  // ----------------------------------------------------------

  async function loadModules() {

    try {

      const result =
        await request(
          config.modulesEndpoint
        );

      state.modules =
        Array.isArray(
          result?.modules
        )
          ? result.modules
          : [];

      return state.modules;

    } catch (error) {

      state.modules = [];

      return [];

    }
  }

  // ----------------------------------------------------------
  // Module registry
  // ----------------------------------------------------------

  function getModule(
    moduleId
  ) {

    return (
      MODULES[moduleId] ||
      Object.values(MODULES)
        .find(
          module =>
            module.id === moduleId
        ) ||
      null
    );
  }

  function getModules() {

    return Object.values(
      MODULES
    ).map(
      module => ({
        ...module
      })
    );
  }

  function activateModule(
    moduleId
  ) {

    const module =
      getModule(moduleId);

    if (!module) {

      throw new Error(
        `Unknown GHAR AI module: ${moduleId}`
      );
    }

    state.activeModule =
      module.id;

    return {
      ...module
    };
  }

  function getActiveModule() {

    if (!state.activeModule) {
      return null;
    }

    return getModule(
      state.activeModule
    );
  }

  // ----------------------------------------------------------
  // AI Router bridge
  // ----------------------------------------------------------

  function router() {

    if (
      GHAR.AI.Router &&
      typeof GHAR.AI.Router.route ===
        "function"
    ) {

      return GHAR.AI.Router;

    }

    return null;
  }

  async function execute(
    moduleId,
    payload = {}
  ) {

    const module =
      activateModule(
        moduleId
      );

    const aiRouter =
      router();

    if (aiRouter) {

      return aiRouter.route(
        module.id,
        payload
      );

    }

    /*
     * Fallback request.
     *
     * ai-router.js will normally
     * handle routing once loaded.
     */

    return request(
      `${config.apiBase}/${module.id}`,
      {
        method: "POST",

        body:
          JSON.stringify(
            payload
          )
      }
    );
  }

  // ----------------------------------------------------------
  // Convenience methods
  // ----------------------------------------------------------

  function chat(payload) {

    return execute(
      "chat",
      payload
    );
  }

  function search(payload) {

    return execute(
      "search",
      payload
    );
  }

  function recommendations(
    payload
  ) {

    return execute(
      "recommendations",
      payload
    );
  }

  function priceEstimate(
    payload
  ) {

    return execute(
      "priceEstimator",
      payload
    );
  }

  function investment(
    payload
  ) {

    return execute(
      "investment",
      payload
    );
  }

  function loanAdvice(
    payload
  ) {

    return execute(
      "loanAdvisor",
      payload
    );
  }

  function documentAssistance(
    payload
  ) {

    return execute(
      "documentAssistant",
      payload
    );
  }

  function propertyDescription(
    payload
  ) {

    return execute(
      "propertyDescription",
      payload
    );
  }

  function rentalAdvice(
    payload
  ) {

    return execute(
      "rentalAdvisor",
      payload
    );
  }

  function moderate(
    payload
  ) {

    return execute(
      "moderation",
      payload
    );
  }

  function detectFraud(
    payload
  ) {

    return execute(
      "fraudDetection",
      payload
    );
  }

  // ----------------------------------------------------------
  // Initialization
  // ----------------------------------------------------------

  async function init(options = {}) {

    if (state.initialized) {

      return getState();

    }

    configure(
      options
    );

    state.initialized =
      true;

    clearError();

    /*
     * Do not prevent the frontend
     * from loading if the backend
     * is temporarily unavailable.
     */

    await Promise.allSettled([
      healthCheck(),
      loadModules()
    ]);

    /*
     * Notify other GHAR modules.
     */

    if (
      typeof window.CustomEvent ===
      "function"
    ) {

      window.dispatchEvent(
        new CustomEvent(
          "ghar:ai:ready",
          {
            detail:
              getState()
          }
        )
      );

    }

    return getState();
  }

  // ----------------------------------------------------------
  // Destroy / reset
  // ----------------------------------------------------------

  function reset() {

    state.initialized = false;
    state.ready = false;
    state.loading = false;
    state.error = null;
    state.activeModule = null;
    state.requestCount = 0;
    state.lastRequest = null;
    state.lastResponse = null;
    state.health = null;
    state.modules = [];

  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  GHAR.AI = {

    version:
      "1.0.0",

    config:
      configure,

    getConfig,

    getState,

    init,

    reset,

    request,

    healthCheck,

    loadModules,

    getModule,

    getModules,

    activateModule,

    getActiveModule,

    execute,

    chat,

    search,

    recommendations,

    priceEstimate,

    investment,

    loanAdvice,

    documentAssistance,

    propertyDescription,

    rentalAdvice,

    moderate,

    detectFraud,

    modules:
      MODULES
  };

  // ----------------------------------------------------------
  // Automatic initialization
  // ----------------------------------------------------------

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () => {
        GHAR.AI.init();
      },
      {
        once: true
      }
    );

  } else {

    GHAR.AI.init();

  }

})(window);