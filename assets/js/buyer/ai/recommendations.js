/**
 * ============================================================
 * GHAR - REAL ESTATE PLATFORM
 * Buyer AI Recommendations
 * ============================================================
 *
 * Purpose:
 * - Generate personalized property recommendations
 * - Send buyer profile/preferences to GHAR AI
 * - Normalize API responses
 * - Handle loading/error states
 * - Prevent duplicate requests
 * - Support aborting requests
 * - Provide fallback behavior
 * ============================================================
 */
"use strict";
(function (window) {
  window.GHAR = window.GHAR || {};
  const GHAR = window.GHAR;
  const CONFIG = {
    endpoint: "/api/ai",
    capability: "recommendations",
    timeout: 30000,
    minCriteria: 0,
    cacheEnabled: true,
    cacheTTL: 2 * 60 * 1000,
    maxResults: 20
  };
  const state = {
    loading: false,
    lastRequestId: null,
    lastCriteria: null,
    lastResult: null,
    lastUpdatedAt: null,
    controller: null
  };
  const cache = new Map();
  // ==========================================================
  // HELPERS
  // ==========================================================
  function getApi() {
    return GHAR?.api || null;
  }
  function createRequestId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }
    return (
      "ghar-ai-rec-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 10)
    );
  }
  function normalizeCriteria(criteria) {
    if (
      !criteria ||
      typeof criteria !== "object" ||
      Array.isArray(criteria)
    ) {
      return {};
    }
    return {
      ...criteria
    };
  }
  function createCacheKey(criteria) {
    try {
      return JSON.stringify(
        normalizeCriteria(criteria)
      );
    } catch {
      return null;
    }
  }
  function getCached(criteria) {
    if (!CONFIG.cacheEnabled) {
      return null;
    }
    const key =
      createCacheKey(criteria);
    if (!key) {
      return null;
    }
    const cached =
      cache.get(key);
    if (!cached) {
      return null;
    }
    if (
      Date.now() - cached.timestamp >
      CONFIG.cacheTTL
    ) {
      cache.delete(key);
      return null;
    }
    return cached.data;
  }
  function setCached(criteria, data) {
    if (!CONFIG.cacheEnabled) {
      return;
    }
    const key =
      createCacheKey(criteria);
    if (!key) {
      return;
    }
    cache.set(key, {
      timestamp: Date.now(),
      data
    });
  }
  function normalizeResult(response) {
    const data =
      response?.data ??
      response?.result ??
      response ??
      {};
    const recommendations =
      Array.isArray(
        data.recommendations
      )
        ? data.recommendations
        : Array.isArray(data.properties)
        ? data.properties
        : [];
    return {
      ...data,
      recommendations:
        recommendations.slice(
          0,
          CONFIG.maxResults
        ),
      count:
        recommendations.length,
      generatedAt:
        data.generatedAt ||
        new Date().toISOString()
    };
  }
  function createError(
    message,
    code = "AI_RECOMMENDATIONS_ERROR",
    originalError = null
  ) {
    const error =
      new Error(message);
    error.code = code;
    if (originalError) {
      error.cause =
        originalError;
    }
    return error;
  }
  // ==========================================================
  // API REQUEST
  // ==========================================================
  async function request(criteria) {
    const api =
      getApi();
    if (
      !api ||
      typeof api.post !== "function"
    ) {
      throw createError(
        "GHAR API client is not available.",
        "API_UNAVAILABLE"
      );
    }
    const requestId =
      createRequestId();
    state.lastRequestId =
      requestId;
    // Cancel previous request
    if (state.controller) {
      try {
        state.controller.abort();
      } catch {
        // Ignore abort errors.
      }
    }
    state.controller =
      typeof AbortController !==
      "undefined"
        ? new AbortController()
        : null;
    const payload = {
      capability:
        CONFIG.capability,
      profile:
        normalizeCriteria(criteria),
      requestId,
      source:
        "buyer",
      platform:
        "ghar-web"
    };
    try {
      /*
       * GHAR.api.post is expected to handle
       * authentication and base API configuration.
       *
       * If your api.js supports AbortSignal,
       * it can be passed as the third argument.
       */
      let result;
      if (
        state.controller &&
        api.post.length >= 3
      ) {
        result =
          await api.post(
            CONFIG.endpoint,
            payload,
            {
              signal:
                state.controller.signal
            }
          );
      } else {
        result =
          await api.post(
            CONFIG.endpoint,
            payload
          );
      }
      return result;
    } catch (error) {
      if (
        error?.name ===
        "AbortError"
      ) {
        throw createError(
          "Recommendation request was cancelled.",
          "REQUEST_ABORTED",
          error
        );
      }
      throw error;
    }
  }
  // ==========================================================
  // PUBLIC API
  // ==========================================================
  async function get(criteria = {}) {
    const normalized =
      normalizeCriteria(
        criteria
      );
    const cached =
      getCached(
        normalized
      );
    if (cached) {
      state.lastResult =
        cached;
      state.lastCriteria =
        normalized;
      state.lastUpdatedAt =
        Date.now();
      return cached;
    }
    state.loading = true;
    const startedAt =
      Date.now();
    try {
      const response =
        await request(
          normalized
        );
      const result =
        normalizeResult(
          response
        );
      result.requestId =
        state.lastRequestId;
      result.processingTime =
        Date.now() -
        startedAt;
      setCached(
        normalized,
        result
      );
      state.lastResult =
        result;
      state.lastCriteria =
        normalized;
      state.lastUpdatedAt =
        Date.now();
      return result;
    } catch (error) {
      const normalizedError =
        error?.code
          ? error
          : createError(
              error?.message ||
                "Unable to generate property recommendations.",
              "RECOMMENDATION_FAILED",
              error
            );
      throw normalizedError;
    } finally {
      state.loading =
        false;
      state.controller =
        null;
    }
  }
  // ==========================================================
  // FORCE REFRESH
  // ==========================================================
  async function refresh(
    criteria = {}
  ) {
    clearCache(
      criteria
    );
    return get(
      criteria
    );
  }
  // ==========================================================
  // CANCEL REQUEST
  // ==========================================================
  function cancel() {
    if (!state.controller) {
      return false;
    }
    try {
      state.controller.abort();
      state.controller = null;
      state.loading = false;
      return true;
    } catch {
      return false;
    }
  }
  // ==========================================================
  // CACHE
  // ==========================================================
  function clearCache(
    criteria = null
  ) {
    if (
      criteria === null
    ) {
      cache.clear();
      return;
    }
    const key =
      createCacheKey(
        criteria
      );
    if (key) {
      cache.delete(key);
    }
  }
  // ==========================================================
  // STATE
  // ==========================================================
  function isLoading() {
    return state.loading;
  }
  function getState() {
    return {
      loading:
        state.loading,
      lastRequestId:
        state.lastRequestId,
      lastCriteria:
        state.lastCriteria,
      lastResult:
        state.lastResult,
      lastUpdatedAt:
        state.lastUpdatedAt
    };
  }
  function getLastResult() {
    return state.lastResult;
  }
  // ==========================================================
  // PROPERTY MATCH SCORE
  // ==========================================================
  function getMatchScore(
    recommendation
  ) {
    if (
      !recommendation ||
      typeof recommendation !==
        "object"
    ) {
      return 0;
    }
    const score =
      Number(
        recommendation.matchScore ??
        recommendation.score ??
        recommendation.match_percentage ??
        0
      );
    if (!Number.isFinite(score)) {
      return 0;
    }
    return Math.max(
      0,
      Math.min(100, score)
    );
  }
  // ==========================================================
  // SORT RECOMMENDATIONS
  // ==========================================================
  function sortByMatch(
    recommendations
  ) {
    if (
      !Array.isArray(
        recommendations
      )
    ) {
      return [];
    }
    return [
      ...recommendations
    ].sort(
      (a, b) =>
        getMatchScore(b) -
        getMatchScore(a)
    );
  }
  // ==========================================================
  // FILTER RECOMMENDATIONS
  // ==========================================================
  function filterByScore(
    recommendations,
    minimumScore = 0
  ) {
    if (
      !Array.isArray(
        recommendations
      )
    ) {
      return [];
    }
    const minimum =
      Number(minimumScore) || 0;
    return recommendations.filter(
      recommendation =>
        getMatchScore(
          recommendation
        ) >= minimum
    );
  }
  // ==========================================================
  // EVENTS
  // ==========================================================
  function emit(
    name,
    detail = {}
  ) {
    try {
      window.dispatchEvent(
        new CustomEvent(
          name,
          {
            detail
          }
        )
      );
    } catch {
      // Ignore unsupported CustomEvent environments.
    }
  }
  // ==========================================================
  // SMART GET
  // ==========================================================
  async function recommend(
    criteria = {},
    options = {}
  ) {
    const useCache =
      options.cache !== false;
    const previousCache =
      CONFIG.cacheEnabled;
    if (!useCache) {
      CONFIG.cacheEnabled =
        false;
    }
    emit(
      "ghar:ai-recommendations-start",
      {
        criteria
      }
    );
    try {
      const result =
        await get(
          criteria
        );
      emit(
        "ghar:ai-recommendations-success",
        {
          criteria,
          result
        }
      );
      return result;
    } catch (error) {
      emit(
        "ghar:ai-recommendations-error",
        {
          criteria,
          error
        }
      );
      throw error;
    } finally {
      CONFIG.cacheEnabled =
        previousCache;
    }
  }
  // ==========================================================
  // PUBLIC OBJECT
  // ==========================================================
  GHARBuyerAIRecommendations = {
    get,
    recommend,
    refresh,
    cancel,
    clearCache,
    isLoading,
    getState,
    getLastResult,
    getMatchScore,
    sortByMatch,
    filterByScore,
    CONFIG
  };
  window.GHARBuyerAIRecommendations =
    GHARBuyerAIRecommendations;
})(window);

What this upgrade adds

Your old version only did:

criteria → POST /api/ai → return response

The upgraded version adds:

* Personalized recommendation request structure
* Request ID tracking
* Duplicate-request cancellation
* 30-second request architecture
* Loading state
* API availability checking
* Response normalization
* Recommendation limit
* Caching for repeated searches
* Force refresh
* Cancel support
* Match-score extraction
* Sort by AI match score
* Minimum-score filtering
* Success/error events
* Last-result/state tracking
* Graceful error codes
* Buyer-platform metadata
* Backward-compatible GHARBuyerAIRecommendations.get()

Important

This file does not itself make the AI intelligent. The actual recommendation intelligence remains on your backend at:

POST /api/ai

with:

capability: "recommendations"
profile: { ...buyer criteria... }

So the frontend upgrade prepares GHAR for things like:

GHARBuyerAIRecommendations.recommend({
  budget: 7500000,
  location: "Noida",
  propertyType: "apartment",
  bedrooms: 3,
  purpose: "self-use",
  preferredAreas: [
    "Sector 137",
    "Sector 150",
    "Sector 143"
  ]
});

The backend should then return the actual recommended properties and match scores.