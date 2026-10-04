// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/ai/ai-client.js
// GHAR AI API Client
// ============================================================

"use strict";

(function (window) {

  const GHAR = window.GHAR = window.GHAR || {};
  const AI = GHAR.AI = GHAR.AI || {};

  const CONFIG = GHAR.CONFIG || {};

  const API_BASE =
    CONFIG.API_BASE_URL ||
    CONFIG.API_BASE ||
    "/api";

  const AI_BASE =
    `${API_BASE.replace(/\/$/, "")}/ai`;

  const DEFAULT_TIMEOUT = 30000;

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------

  function getToken() {
    try {
      if (
        GHAR.Storage &&
        typeof GHAR.Storage.get === "function"
      ) {
        return (
          GHAR.Storage.get("access_token") ||
          GHAR.Storage.get("token") ||
          null
        );
      }

      return (
        localStorage.getItem("ghar_access_token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        null
      );

    } catch (error) {
      return null;
    }
  }

  function createRequestId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return `ghar-ai-${window.crypto.randomUUID()}`;
    }

    return (
      `ghar-ai-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`
    );
  }

  function buildHeaders(extraHeaders = {}) {

    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "X-Request-ID": createRequestId(),
      ...extraHeaders
    };

    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  function timeoutPromise(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            "GHAR AI request timed out."
          )
        );
      }, ms);
    });
  }

  // ----------------------------------------------------------
  // Generic request
  // ----------------------------------------------------------

  async function request(
    endpoint,
    options = {}
  ) {

    const method =
      options.method || "POST";

    const timeout =
      Number(options.timeout) ||
      DEFAULT_TIMEOUT;

    const url =
      endpoint.startsWith("http")
        ? endpoint
        : `${AI_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    const fetchOptions = {
      method,
      headers: buildHeaders(
        options.headers || {}
      ),
      credentials: "include",
      cache: "no-store"
    };

    if (
      options.body !== undefined &&
      method !== "GET" &&
      method !== "HEAD"
    ) {

      fetchOptions.body =
        typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body);
    }

    let response;

    try {

      response = await Promise.race([
        fetch(url, fetchOptions),
        timeoutPromise(timeout)
      ]);

    } catch (error) {

      const networkError =
        new Error(
          error.message ||
          "Unable to connect to GHAR AI."
        );

      networkError.code =
        "AI_NETWORK_ERROR";

      throw networkError;
    }

    let data = null;

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    try {

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      } else {
        data = await response.text();
      }

    } catch (error) {

      data = null;

    }

    if (!response.ok) {

      const message =
        data &&
        typeof data === "object" &&
        data.error
          ? data.error
          : `GHAR AI request failed with status ${response.status}.`;

      const apiError =
        new Error(message);

      apiError.status =
        response.status;

      apiError.code =
        "AI_API_ERROR";

      apiError.data =
        data;

      throw apiError;
    }

    return data;

  }

  // ----------------------------------------------------------
  // GET
  // ----------------------------------------------------------

  async function get(
    endpoint,
    options = {}
  ) {

    return request(
      endpoint,
      {
        ...options,
        method: "GET"
      }
    );

  }

  // ----------------------------------------------------------
  // POST
  // ----------------------------------------------------------

  async function post(
    endpoint,
    payload = {},
    options = {}
  ) {

    return request(
      endpoint,
      {
        ...options,
        method: "POST",
        body: payload
      }
    );

  }

  // ----------------------------------------------------------
  // PUT
  // ----------------------------------------------------------

  async function put(
    endpoint,
    payload = {},
    options = {}
  ) {

    return request(
      endpoint,
      {
        ...options,
        method: "PUT",
        body: payload
      }
    );

  }

  // ----------------------------------------------------------
  // PATCH
  // ----------------------------------------------------------

  async function patch(
    endpoint,
    payload = {},
    options = {}
  ) {

    return request(
      endpoint,
      {
        ...options,
        method: "PATCH",
        body: payload
      }
    );

  }

  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  async function remove(
    endpoint,
    options = {}
  ) {

    return request(
      endpoint,
      {
        ...options,
        method: "DELETE"
      }
    );

  }

  // ==========================================================
  // GHAR AI ENDPOINTS
  // ==========================================================

  const endpoints = {

    health:
      "/health",

    modules:
      "/modules",

    chat:
      "/chat",

    search:
      "/search",

    recommendations:
      "/recommendations",

    price:
      "/price",

    investment:
      "/investment",

    loan:
      "/loan",

    documents:
      "/documents",

    propertyDescription:
      "/property-description",

    rental:
      "/rental",

    moderation:
      "/moderation",

    fraud:
      "/fraud",

    feedback:
      "/feedback",

    history:
      "/history"

  };

  // ==========================================================
  // AI METHODS
  // ==========================================================

  async function health(
    options = {}
  ) {

    return get(
      endpoints.health,
      options
    );

  }

  async function modules(
    options = {}
  ) {

    return get(
      endpoints.modules,
      options
    );

  }

  async function chat(
    payload,
    options = {}
  ) {

    return post(
      endpoints.chat,
      payload,
      options
    );

  }

  async function search(
    payload,
    options = {}
  ) {

    return post(
      endpoints.search,
      payload,
      options
    );

  }

  async function recommendations(
    payload,
    options = {}
  ) {

    return post(
      endpoints.recommendations,
      payload,
      options
    );

  }

  async function estimatePrice(
    payload,
    options = {}
  ) {

    return post(
      endpoints.price,
      payload,
      options
    );

  }

  async function investmentAnalysis(
    payload,
    options = {}
  ) {

    return post(
      endpoints.investment,
      payload,
      options
    );

  }

  async function loanAssistance(
    payload,
    options = {}
  ) {

    return post(
      endpoints.loan,
      payload,
      options
    );

  }

  async function documentAssistance(
    payload,
    options = {}
  ) {

    return post(
      endpoints.documents,
      payload,
      options
    );

  }

  async function propertyDescription(
    payload,
    options = {}
  ) {

    return post(
      endpoints.propertyDescription,
      payload,
      options
    );

  }

  async function rentalAssistance(
    payload,
    options = {}
  ) {

    return post(
      endpoints.rental,
      payload,
      options
    );

  }

  async function moderation(
    payload,
    options = {}
  ) {

    return post(
      endpoints.moderation,
      payload,
      options
    );

  }

  async function fraudDetection(
    payload,
    options = {}
  ) {

    return post(
      endpoints.fraud,
      payload,
      options
    );

  }

  async function feedback(
    payload,
    options = {}
  ) {

    return post(
      endpoints.feedback,
      payload,
      options
    );

  }

  async function history(
    params = {},
    options = {}
  ) {

    const query =
      new URLSearchParams();

    Object.entries(params)
      .forEach(([key, value]) => {

        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          query.set(
            key,
            value
          );
        }

      });

    const queryString =
      query.toString();

    return get(
      `${endpoints.history}${
        queryString
          ? `?${queryString}`
          : ""
      }`,
      options
    );

  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  AI.Client = {

    request,
    get,
    post,
    put,
    patch,
    delete: remove,

    endpoints,

    health,
    modules,

    chat,
    search,
    recommendations,
    estimatePrice,
    investmentAnalysis,
    loanAssistance,
    documentAssistance,
    propertyDescription,
    rentalAssistance,
    moderation,
    fraudDetection,
    feedback,
    history

  };

  // Compatibility aliases

  AI.client =
    AI.Client;

  GHAR.aiClient =
    AI.Client;

})(window);