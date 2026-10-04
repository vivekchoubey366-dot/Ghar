// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/api.js
// Central API Client
// ============================================================

"use strict";

(function (window) {

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const config =
    window.GHARConfig || {};

  const API_BASE =
    (
      config.API_BASE_URL ||
      config.API_URL ||
      "/api"
    ).replace(/\/+$/, "");

  const REQUEST_TIMEOUT =
    Number(
      config.API_TIMEOUT ||
      30000
    );

  // ==========================================================
  // STORAGE
  // ==========================================================

  const storage =
    window.GHARStorage || null;

  function getAccessToken() {

    if (!storage) {
      return null;
    }

    return storage.getAccessToken();

  }

  // ==========================================================
  // REQUEST ID
  // ==========================================================

  function createRequestId() {

    if (
      window.crypto &&
      typeof window.crypto.randomUUID ===
        "function"
    ) {

      return `ghar-${window.crypto.randomUUID()}`;

    }

    return `ghar-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

  }

  // ==========================================================
  // URL BUILDER
  // ==========================================================

  function buildUrl(
    endpoint,
    query = null
  ) {

    const cleanEndpoint =
      String(endpoint || "")
        .replace(/^\/+/, "");

    const url =
      `${API_BASE}/${cleanEndpoint}`;

    if (!query) {
      return url;
    }

    const params =
      new URLSearchParams();

    Object.entries(query)
      .forEach(([key, value]) => {

        if (
          value === undefined ||
          value === null ||
          value === ""
        ) {
          return;
        }

        if (Array.isArray(value)) {

          value.forEach(item => {

            params.append(
              key,
              String(item)
            );

          });

          return;

        }

        params.append(
          key,
          String(value)
        );

      });

    const queryString =
      params.toString();

    return queryString
      ? `${url}?${queryString}`
      : url;

  }

  // ==========================================================
  // REQUEST
  // ==========================================================

  async function request(
    endpoint,
    options = {}
  ) {

    const {

      method = "GET",

      body,

      query,

      headers = {},

      auth = true,

      timeout = REQUEST_TIMEOUT,

      signal,

      credentials = "include"

    } = options;

    const requestId =
      createRequestId();

    const requestHeaders = {
      Accept:
        "application/json",

      "X-Requested-With":
        "XMLHttpRequest",

      "X-Request-ID":
        requestId,

      ...headers

    };

    // --------------------------------------------------------
    // AUTHORIZATION
    // --------------------------------------------------------

    const token =
      getAccessToken();

    if (
      auth &&
      token
    ) {

      requestHeaders.Authorization =
        `Bearer ${token}`;

    }

    // --------------------------------------------------------
    // BODY
    // --------------------------------------------------------

    let requestBody =
      body;

    const isFormData =
      body instanceof FormData;

    const isBlob =
      body instanceof Blob;

    const isArrayBuffer =
      body instanceof ArrayBuffer;

    if (
      body !== undefined &&
      body !== null &&
      !isFormData &&
      !isBlob &&
      !isArrayBuffer &&
      typeof body === "object"
    ) {

      requestHeaders["Content-Type"] =
        "application/json";

      requestBody =
        JSON.stringify(body);

    }

    // --------------------------------------------------------
    // ABORT CONTROLLER
    // --------------------------------------------------------

    const controller =
      new AbortController();

    let timeoutId;

    if (timeout > 0) {

      timeoutId =
        setTimeout(
          () => controller.abort(),
          timeout
        );

    }

    // --------------------------------------------------------
    // EXTERNAL SIGNAL
    // --------------------------------------------------------

    if (signal) {

      if (signal.aborted) {
        controller.abort();
      }

      signal.addEventListener(
        "abort",
        () => controller.abort(),
        {
          once: true
        }
      );

    }

    // --------------------------------------------------------
    // FETCH
    // --------------------------------------------------------

    let response;

    try {

      response =
        await fetch(
          buildUrl(
            endpoint,
            query
          ),
          {
            method,

            headers:
              requestHeaders,

            body:
              requestBody,

            credentials,

            signal:
              controller.signal
          }
        );

    } catch (error) {

      if (
        error &&
        error.name ===
          "AbortError"
      ) {

        throw new GHARApiError(
          "Request timed out or was cancelled.",
          {
            status:
              408,

            code:
              "REQUEST_TIMEOUT",

            requestId
          }
        );

      }

      throw new GHARApiError(
        "Unable to connect to GHAR API.",
        {
          status:
            0,

          code:
            "NETWORK_ERROR",

          requestId,

          cause:
            error
        }
      );

    } finally {

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

    }

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    let data;

    try {

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

    } catch (error) {

      data = null;

    }

    // --------------------------------------------------------
    // ERROR RESPONSE
    // --------------------------------------------------------

    if (!response.ok) {

      const message =
        data &&
        typeof data === "object" &&
        data.error
          ? data.error
          : `GHAR API request failed with status ${response.status}.`;

      throw new GHARApiError(
        message,
        {
          status:
            response.status,

          code:
            data &&
            typeof data === "object"
              ? data.code
              : undefined,

          data,

          requestId:
            data &&
            typeof data === "object" &&
            data.requestId
              ? data.requestId
              : requestId
        }
      );

    }

    return {

      ok: true,

      status:
        response.status,

      data,

      requestId

    };

  }

  // ==========================================================
  // API ERROR CLASS
  // ==========================================================

  class GHARApiError
    extends Error {

    constructor(
      message,
      details = {}
    ) {

      super(message);

      this.name =
        "GHARApiError";

      this.status =
        details.status || 0;

      this.code =
        details.code || null;

      this.data =
        details.data || null;

      this.requestId =
        details.requestId || null;

      this.cause =
        details.cause || null;

    }

  }

  // ==========================================================
  // HTTP METHODS
  // ==========================================================

  async function get(
    endpoint,
    query = null,
    options = {}
  ) {

    return request(
      endpoint,
      {
        ...options,
        method: "GET",
        query
      }
    );

  }

  async function post(
    endpoint,
    body = null,
    options = {}
  ) {

    return request(
      endpoint,
      {
        ...options,
        method: "POST",
        body
      }
    );

  }

  async function put(
    endpoint,
    body = null,
    options = {}
  ) {

    return request(
      endpoint,
      {
        ...options,
        method: "PUT",
        body
      }
    );

  }

  async function patch(
    endpoint,
    body = null,
    options = {}
  ) {

    return request(
      endpoint,
      {
        ...options,
        method: "PATCH",
        body
      }
    );

  }

  async function del(
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
  // FILE UPLOAD
  // ==========================================================

  async function upload(
    endpoint,
    files,
    fields = {},
    options = {}
  ) {

    const formData =
      new FormData();

    // --------------------------------------------------------
    // Fields
    // --------------------------------------------------------

    Object.entries(fields)
      .forEach(([key, value]) => {

        if (
          value === undefined ||
          value === null
        ) {
          return;
        }

        formData.append(
          key,
          value
        );

      });

    // --------------------------------------------------------
    // Files
    // --------------------------------------------------------

    if (
      files instanceof File
    ) {

      formData.append(
        "file",
        files
      );

    } else if (
      files instanceof FileList
    ) {

      Array.from(files)
        .forEach(file => {

          formData.append(
            "files",
            file
          );

        });

    } else if (
      Array.isArray(files)
    ) {

      files.forEach(file => {

        if (
          file instanceof File
        ) {

          formData.append(
            "files",
            file
          );

        }

      });

    }

    return request(
      endpoint,
      {
        ...options,

        method:
          options.method ||
          "POST",

        body:
          formData
      }
    );

  }

  // ==========================================================
  // AUTH API
  // ==========================================================

  const auth = {

    login(credentials) {

      return post(
        "/auth/login",
        credentials,
        {
          auth: false
        }
      );

    },

    register(data) {

      return post(
        "/auth/register",
        data,
        {
          auth: false
        }
      );

    },

    signup(data) {

      return post(
        "/auth/signup",
        data,
        {
          auth: false
        }
      );

    },

    logout() {

      return post(
        "/auth/logout"
      );

    },

    refresh(data = {}) {

      return post(
        "/auth/refresh",
        data,
        {
          auth: false
        }
      );

    },

    me() {

      return get(
        "/auth/me"
      );

    },

    verifyEmail(data) {

      return post(
        "/auth/verify-email",
        data,
        {
          auth: false
        }
      );

    },

    sendOtp(data) {

      return post(
        "/auth/send-otp",
        data,
        {
          auth: false
        }
      );

    },

    verifyOtp(data) {

      return post(
        "/auth/verify-otp",
        data,
        {
          auth: false
        }
      );

    },

    forgotPassword(data) {

      return post(
        "/auth/forgot-password",
        data,
        {
          auth: false
        }
      );

    },

    resetPassword(data) {

      return post(
        "/auth/reset-password",
        data,
        {
          auth: false
        }
      );

    }

  };

  // ==========================================================
  // USER API
  // ==========================================================

  const users = {

    get(id) {

      return get(
        `/users/${encodeURIComponent(id)}`
      );

    },

    me() {

      return get(
        "/users/me"
      );

    },

    updateMe(data) {

      return patch(
        "/users/me",
        data
      );

    },

    uploadProfileImage(file) {

      return upload(
        "/users/me/profile-image",
        file
      );

    }

  };

  // ==========================================================
  // PROPERTY API
  // ==========================================================

  const properties = {

    list(query = {}) {

      return get(
        "/properties",
        query
      );

    },

    get(id) {

      return get(
        `/properties/${encodeURIComponent(id)}`
      );

    },

    create(data) {

      return post(
        "/properties",
        data
      );

    },

    update(id, data) {

      return patch(
        `/properties/${encodeURIComponent(id)}`,
        data
      );

    },

    remove(id) {

      return del(
        `/properties/${encodeURIComponent(id)}`
      );

    },

    uploadImages(
      id,
      files
    ) {

      return upload(
        `/properties/${encodeURIComponent(id)}/images`,
        files
      );

    }

  };

  // ==========================================================
  // SEARCH API
  // ==========================================================

  const search = {

    properties(query = {}) {

      return get(
        "/search/properties",
        query
      );

    },

    suggestions(query = {}) {

      return get(
        "/search/suggestions",
        query
      );

    }

  };

  // ==========================================================
  // VISITS API
  // ==========================================================

  const visits = {

    list(query = {}) {

      return get(
        "/visits",
        query
      );

    },

    get(id) {

      return get(
        `/visits/${encodeURIComponent(id)}`
      );

    },

    create(data) {

      return post(
        "/visits",
        data
      );

    },

    update(id, data) {

      return patch(
        `/visits/${encodeURIComponent(id)}`,
        data
      );

    },

    cancel(id) {

      return del(
        `/visits/${encodeURIComponent(id)}`
      );

    }

  };

  // ==========================================================
  // OFFERS API
  // ==========================================================

  const offers = {

    list(query = {}) {

      return get(
        "/offers",
        query
      );

    },

    get(id) {

      return get(
        `/offers/${encodeURIComponent(id)}`
      );

    },

    create(data) {

      return post(
        "/offers",
        data
      );

    },

    update(id, data) {

      return patch(
        `/offers/${encodeURIComponent(id)}`,
        data
      );

    },

    accept(id) {

      return post(
        `/offers/${encodeURIComponent(id)}/accept`
      );

    },

    reject(id) {

      return post(
        `/offers/${encodeURIComponent(id)}/reject`
      );

    }

  };

  // ==========================================================
  // APPLICATIONS API
  // ==========================================================

  const applications = {

    list(query = {}) {

      return get(
        "/applications",
        query
      );

    },

    get(id) {

      return get(
        `/applications/${encodeURIComponent(id)}`
      );

    },

    create(data) {

      return post(
        "/applications",
        data
      );

    },

    update(id, data) {

      return patch(
        `/applications/${encodeURIComponent(id)}`,
        data
      );

    }

  };

  // ==========================================================
  // DOCUMENT API
  // ==========================================================

  const documents = {

    list(query = {}) {

      return get(
        "/documents",
        query
      );

    },

    get(id) {

      return get(
        `/documents/${encodeURIComponent(id)}`
      );

    },

    upload(files, fields = {}) {

      return upload(
        "/documents/upload",
        files,
        fields
      );

    },

    verify(id, data = {}) {

      return post(
        `/documents/${encodeURIComponent(id)}/verify`,
        data
      );

    },

    status(id) {

      return get(
        `/documents/${encodeURIComponent(id)}/status`
      );

    }

  };

  // ==========================================================
  // VERIFICATION API
  // ==========================================================

  const verification = {

    levels() {

      return get(
        "/verification/levels",
        null,
        {
          auth: false
        }
      );

    },

    status() {

      return get(
        "/verification/status"
      );

    },

    identity(data) {

      return post(
        "/verification/identity",
        data
      );

    },

    phone(data) {

      return post(
        "/verification/phone",
        data
      );

    },

    email(data) {

      return post(
        "/verification/email",
        data
      );

    },

    address(data) {

      return post(
        "/verification/address",
        data
      );

    },

    kyc(data) {

      return post(
        "/verification/kyc",
        data
      );

    },

    ownership(data) {

      return post(
        "/verification/ownership",
        data
      );

    }

  };

  // ==========================================================
  // PAYMENTS API
  // ==========================================================

  const payments = {

    createCheckout(data) {

      return post(
        "/payments/checkout",
        data
      );

    },

    verify(data) {

      return post(
        "/payments/verify",
        data
      );

    },

    history(query = {}) {

      return get(
        "/payments/history",
        query
      );

    },

    invoices(query = {}) {

      return get(
        "/payments/invoices",
        query
      );

    }

  };

  // ==========================================================
  // SUBSCRIPTIONS API
  // ==========================================================

  const subscriptions = {

    plans() {

      return get(
        "/subscriptions/plans",
        null,
        {
          auth: false
        }
      );

    },

    schema() {

      return get(
        "/subscriptions/schema",
        null,
        {
          auth: false
        }
      );

    },

    current() {

      return get(
        "/subscriptions/current"
      );

    },

    subscribe(data) {

      return post(
        "/subscriptions",
        data
      );

    },

    cancel() {

      return post(
        "/subscriptions/cancel"
      );

    }

  };

  // ==========================================================
  // LOANS API
  // ==========================================================

  const loans = {

    eligibility(data) {

      return post(
        "/loans/eligibility",
        data
      );

    },

    calculate(data) {

      return post(
        "/loans/calculator",
        data
      );

    },

    applications(query = {}) {

      return get(
        "/loans/applications",
        query
      );

    },

    apply(data) {

      return post(
        "/loans/applications",
        data
      );

    },

    get(id) {

      return get(
        `/loans/applications/${encodeURIComponent(id)}`
      );

    },

    status(id) {

      return get(
        `/loans/applications/${encodeURIComponent(id)}/status`
      );

    }

  };

  // ==========================================================
  // REFERRALS API
  // ==========================================================

  const referrals = {

    list(query = {}) {

      return get(
        "/referrals",
        query
      );

    },

    create(data) {

      return post(
        "/referrals",
        data
      );

    },

    stats() {

      return get(
        "/referrals/stats"
      );

    }

  };

  // ==========================================================
  // NOTIFICATIONS API
  // ==========================================================

  const notifications = {

    list(query = {}) {

      return get(
        "/notifications",
        query
      );

    },

    markRead(id) {

      return patch(
        `/notifications/${encodeURIComponent(id)}/read`
      );

    },

    markAllRead() {

      return patch(
        "/notifications/read-all"
      );

    }

  };

  // ==========================================================
  // MESSAGES API
  // ==========================================================

  const messages = {

    conversations(query = {}) {

      return get(
        "/messages/conversations",
        query
      );

    },

    conversation(id) {

      return get(
        `/messages/conversations/${encodeURIComponent(id)}`
      );

    },

    send(data) {

      return post(
        "/messages",
        data
      );

    }

  };

  // ==========================================================
  // SUPPORT API
  // ==========================================================

  const support = {

    tickets(query = {}) {

      return get(
        "/support/tickets",
        query
      );

    },

    createTicket(data) {

      return post(
        "/support/tickets",
        data
      );

    },

    ticket(id) {

      return get(
        `/support/tickets/${encodeURIComponent(id)}`
      );

    },

    reply(id, data) {

      return post(
        `/support/tickets/${encodeURIComponent(id)}/reply`,
        data
      );

    }

  };

  // ==========================================================
  // AI API
  // ==========================================================

  const ai = {

    health() {

      return get(
        "/ai/health",
        null,
        {
          auth: false
        }
      );

    },

    modules() {

      return get(
        "/ai/modules",
        null,
        {
          auth: false
        }
      );

    },

    search(data) {

      return post(
        "/ai/search",
        data
      );

    },

    recommendations(data) {

      return post(
        "/ai/recommendations",
        data
      );

    },

    price(data) {

      return post(
        "/ai/price",
        data
      );

    },

    investment(data) {

      return post(
        "/ai/investment",
        data
      );

    },

    loan(data) {

      return post(
        "/ai/loan",
        data
      );

    },

    documents(data) {

      return post(
        "/ai/documents",
        data
      );

    },

    propertyDescription(data) {

      return post(
        "/ai/property-description",
        data
      );

    },

    rental(data) {

      return post(
        "/ai/rental",
        data
      );

    },

    moderation(data) {

      return post(
        "/ai/moderation",
        data
      );

    },

    chat(data) {

      return post(
        "/ai/chat",
        data
      );

    }

  };

  // ==========================================================
  // ADMIN API
  // ==========================================================

  const admin = {

    dashboard() {

      return get(
        "/admin/dashboard"
      );

    },

    users(query = {}) {

      return get(
        "/admin/users",
        query
      );

    },

    properties(query = {}) {

      return get(
        "/admin/properties",
        query
      );

    },

    usersCreate(data) {

      return post(
        "/admin/users",
        data
      );

    },

    usersUpdate(id, data) {

      return patch(
        `/admin/users/${encodeURIComponent(id)}`,
        data
      );

    },

    propertyApprove(id, data = {}) {

      return post(
        `/admin/properties/${encodeURIComponent(id)}/approve`,
        data
      );

    },

    propertyReject(id, data = {}) {

      return post(
        `/admin/properties/${encodeURIComponent(id)}/reject`,
        data
      );

    },

    analytics(query = {}) {

      return get(
        "/admin/analytics",
        query
      );

    },

    reports(query = {}) {

      return get(
        "/admin/reports",
        query
      );

    },

    auditLogs(query = {}) {

      return get(
        "/admin/audit-logs",
        query
      );

    }

  };

  // ==========================================================
  // ADMIN AI API
  // ==========================================================

  const adminAI = {

    dashboard() {

      return get(
        "/admin/ai/dashboard"
      );

    },

    settings() {

      return get(
        "/admin/ai/settings"
      );

    },

    models() {

      return get(
        "/admin/ai/models"
      );

    },

    prompts() {

      return get(
        "/admin/ai/prompts"
      );

    },

    usage(query = {}) {

      return get(
        "/admin/ai/usage",
        query
      );

    },

    moderation(query = {}) {

      return get(
        "/admin/ai/moderation",
        query
      );

    },

    logs(query = {}) {

      return get(
        "/admin/ai/logs",
        query
      );

    }

  };

  // ==========================================================
  // SYSTEM API
  // ==========================================================

  const system = {

    health() {

      return get(
        "/health",
        null,
        {
          auth: false
        }
      );

    },

    info() {

      return get(
        "",
        null,
        {
          auth: false
        }
      );

    },

    routes() {

      return get(
        "/routes",
        null,
        {
          auth: false
        }
      );

    }

  };

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  window.GHARApi = Object.freeze({

    API_BASE,

    request,

    get,
    post,
    put,
    patch,
    delete: del,

    upload,

    GHARApiError,

    auth,
    users,
    properties,
    search,
    visits,
    offers,
    applications,
    documents,
    verification,
    payments,
    subscriptions,
    loans,
    referrals,
    notifications,
    messages,
    support,
    ai,
    admin,
    adminAI,
    system

  });


  // ==========================================================
  // READY EVENT
  // ==========================================================

  window.dispatchEvent(
    new CustomEvent(
      "ghar:api-ready"
    )
  );


})(window);