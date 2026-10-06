// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/api.js
// Enterprise API Client
// ============================================================

"use strict";

(function (window, document) {

  // ==========================================================
  // GHAR NAMESPACE
  // ==========================================================

  const GHAR =
    window.GHAR ||
    {};

  const CONFIG =
    GHAR.config ||
    window.GHARConfig ||
    {};

  const STORAGE =
    GHAR.storage ||
    window.GHARStorage ||
    null;

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const API_BASE =
    String(
      CONFIG.apiBaseUrl ||
      CONFIG.API_BASE_URL ||
      CONFIG.API_URL ||
      "/api"
    ).replace(/\/+$/, "");

  const API_VERSION =
    CONFIG.apiVersion ||
    CONFIG.API_VERSION ||
    "";

  const REQUEST_TIMEOUT =
    Number(
      CONFIG.apiTimeout ||
      CONFIG.API_TIMEOUT ||
      30000
    );

  const RETRY_COUNT =
    Number(
      CONFIG.apiRetryCount ??
      CONFIG.API_RETRY_COUNT ??
      2
    );

  const RETRY_DELAY =
    Number(
      CONFIG.apiRetryDelay ??
      CONFIG.API_RETRY_DELAY ??
      500
    );

  const ENABLE_RETRY =
    CONFIG.apiEnableRetry !== false &&
    CONFIG.API_ENABLE_RETRY !== false;

  const ENABLE_REFRESH =
    CONFIG.apiEnableRefresh !== false &&
    CONFIG.API_ENABLE_REFRESH !== false;

  const CSRF_HEADER =
    CONFIG.csrfHeader ||
    CONFIG.CSRF_HEADER ||
    "X-CSRF-Token";

  const CSRF_COOKIE =
    CONFIG.csrfCookie ||
    CONFIG.CSRF_COOKIE ||
    "XSRF-TOKEN";

  const DEFAULT_CREDENTIALS =
    CONFIG.apiCredentials ||
    CONFIG.API_CREDENTIALS ||
    "include";

  // ==========================================================
  // INTERNAL STATE
  // ==========================================================

  const state = {

    initialized: false,

    online:
      typeof navigator !== "undefined"
        ? navigator.onLine
        : true,

    activeRequests:
      0,

    requestCount:
      0,

    failedRequests:
      0,

    successfulRequests:
      0,

    refreshingToken:
      null,

    controllers:
      new Map(),

    interceptors: {

      request: [],

      response: [],

      error: []

    }

  };

  // ==========================================================
  // HELPERS
  // ==========================================================

  function isFunction(value) {

    return (
      typeof value ===
      "function"
    );

  }

  function isObject(value) {

    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );

  }

  function isBrowser() {

    return (
      typeof window !==
      "undefined" &&
      typeof document !==
      "undefined"
    );

  }

  function sleep(ms) {

    return new Promise(
      resolve =>
        setTimeout(
          resolve,
          ms
        )
    );

  }

  function createRequestId() {

    if (
      window.crypto &&
      isFunction(
        window.crypto.randomUUID
      )
    ) {

      return (
        `ghar-${window.crypto.randomUUID()}`
      );

    }

    return (
      `ghar-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`
    );

  }

  function emit(
    event,
    detail = {}
  ) {

    try {

      document.dispatchEvent(
        new CustomEvent(
          `ghar:${event}`,
          {
            detail
          }
        )
      );

    } catch (_) {}

    try {

      window.dispatchEvent(
        new CustomEvent(
          `ghar:${event}`,
          {
            detail
          }
        )
      );

    } catch (_) {}

  }

  // ==========================================================
  // STORAGE
  // ==========================================================

  function storageGet(
    key
  ) {

    try {

      if (
        STORAGE &&
        isFunction(
          STORAGE.get
        )
      ) {

        return STORAGE.get(
          key
        );

      }

    } catch (_) {}

    try {

      return localStorage.getItem(
        key
      );

    } catch (_) {

      return null;

    }

  }

  function storageSet(
    key,
    value
  ) {

    try {

      if (
        STORAGE &&
        isFunction(
          STORAGE.set
        )
      ) {

        STORAGE.set(
          key,
          value
        );

        return;

      }

    } catch (_) {}

    try {

      localStorage.setItem(
        key,
        value
      );

    } catch (_) {}

  }

  function storageRemove(
    key
  ) {

    try {

      if (
        STORAGE &&
        isFunction(
          STORAGE.remove
        )
      ) {

        STORAGE.remove(
          key
        );

        return;

      }

    } catch (_) {}

    try {

      localStorage.removeItem(
        key
      );

    } catch (_) {}

  }

  // ==========================================================
  // TOKEN MANAGEMENT
  // ==========================================================

  function getAccessToken() {

    const keys = [

      "accessToken",

      "access_token",

      "ghar_access_token",

      "token"

    ];

    for (
      const key of keys
    ) {

      const token =
        storageGet(key);

      if (
        token
      ) {

        return token;

      }

    }

    if (
      GHAR.auth &&
      isFunction(
        GHAR.auth.getAccessToken
      )
    ) {

      try {

        return GHAR.auth.getAccessToken();

      } catch (_) {}

    }

    return null;

  }

  function getRefreshToken() {

    const keys = [

      "refreshToken",

      "refresh_token",

      "ghar_refresh_token"

    ];

    for (
      const key of keys
    ) {

      const token =
        storageGet(key);

      if (
        token
      ) {

        return token;

      }

    }

    return null;

  }

  function saveTokens(
    data
  ) {

    if (
      !data ||
      typeof data !==
        "object"
    ) {

      return;

    }

    const accessToken =
      data.accessToken ||
      data.access_token ||
      data.token;

    const refreshToken =
      data.refreshToken ||
      data.refresh_token;

    if (
      accessToken
    ) {

      storageSet(
        "accessToken",
        accessToken
      );

    }

    if (
      refreshToken
    ) {

      storageSet(
        "refreshToken",
        refreshToken
      );

    }

    emit(
      "api:tokens-updated",
      {
        hasAccessToken:
          Boolean(
            accessToken
          ),

        hasRefreshToken:
          Boolean(
            refreshToken
          )
      }
    );

  }

  function clearTokens() {

    [
      "accessToken",
      "access_token",
      "ghar_access_token",
      "token",
      "refreshToken",
      "refresh_token",
      "ghar_refresh_token"
    ].forEach(
      storageRemove
    );

    emit(
      "api:tokens-cleared"
    );

  }

  // ==========================================================
  // CSRF
  // ==========================================================

  function getCookie(
    name
  ) {

    if (
      !isBrowser()
    ) {

      return null;

    }

    const cookies =
      document.cookie
        ? document.cookie.split(";")
        : [];

    for (
      const cookie of cookies
    ) {

      const [key, ...rest] =
        cookie.trim().split("=");

      if (
        key === name
      ) {

        return decodeURIComponent(
          rest.join("=")
        );

      }

    }

    return null;

  }

  function getCsrfToken() {

    const configured =
      storageGet(
        "ghar_csrf_token"
      );

    if (
      configured
    ) {

      return configured;

    }

    return getCookie(
      CSRF_COOKIE
    );

  }

  // ==========================================================
  // URL BUILDER
  // ==========================================================

  function buildUrl(
    endpoint,
    query = null
  ) {

    const cleanEndpoint =
      String(
        endpoint || ""
      )
        .replace(/^\/+/, "");

    let base =
      API_BASE;

    if (
      API_VERSION
    ) {

      base =
        `${base}/${String(
          API_VERSION
        ).replace(
          /^\/+|\/+$/g,
          ""
        )}`;

    }

    const url =
      `${base}/${cleanEndpoint}`;

    if (
      !query ||
      typeof query !==
        "object"
    ) {

      return url;

    }

    const params =
      new URLSearchParams();

    Object.entries(
      query
    ).forEach(
      ([key, value]) => {

        if (
          value ===
            undefined ||
          value ===
            null ||
          value ===
            ""
        ) {

          return;

        }

        if (
          Array.isArray(value)
        ) {

          value.forEach(
            item => {

              if (
                item !==
                  undefined &&
                item !==
                  null
              ) {

                params.append(
                  key,
                  String(item)
                );

              }

            }
          );

          return;

        }

        if (
          typeof value ===
          "object"
        ) {

          params.append(
            key,
            JSON.stringify(value)
          );

          return;

        }

        params.append(
          key,
          String(value)
        );

      }
    );

    const queryString =
      params.toString();

    return queryString
      ? `${url}?${queryString}`
      : url;

  }

  // ==========================================================
  // ERROR CLASS
  // ==========================================================

  class GHARApiError
    extends Error {

    constructor(
      message,
      details = {}
    ) {

      super(
        message ||
        "GHAR API request failed."
      );

      this.name =
        "GHARApiError";

      this.status =
        Number(
          details.status ||
          0
        );

      this.code =
        details.code ||
        null;

      this.data =
        details.data ||
        null;

      this.requestId =
        details.requestId ||
        null;

      this.endpoint =
        details.endpoint ||
        null;

      this.method =
        details.method ||
        null;

      this.retryable =
        Boolean(
          details.retryable
        );

      this.cause =
        details.cause ||
        null;

      this.isNetworkError =
        this.code ===
        "NETWORK_ERROR";

      this.isTimeout =
        this.code ===
        "REQUEST_TIMEOUT";

      this.isUnauthorized =
        this.status ===
        401;

      this.isForbidden =
        this.status ===
        403;

      this.isNotFound =
        this.status ===
        404;

      this.isValidation =
        this.status ===
        422;

      this.isServerError =
        this.status >=
        500;

    }

  }

  // ==========================================================
  // RESPONSE PARSER
  // ==========================================================

  async function parseResponse(
    response
  ) {

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      response.status ===
        204 ||
      response.status ===
        205
    ) {

      return null;

    }

    if (
      contentType.includes(
        "application/json"
      ) ||
      contentType.includes(
        "+json"
      )
    ) {

      try {

        return await response.json();

      } catch (_) {

        return null;

      }

    }

    if (
      contentType.includes(
        "application/octet-stream"
      ) ||
      contentType.includes(
        "application/pdf"
      ) ||
      contentType.includes(
        "image/"
      )
    ) {

      try {

        return await response.blob();

      } catch (_) {

        return null;

      }

    }

    try {

      return await response.text();

    } catch (_) {

      return null;

    }

  }

  // ==========================================================
  // ERROR MESSAGE EXTRACTION
  // ==========================================================

  function getErrorMessage(
    data,
    status
  ) {

    if (
      data &&
      typeof data ===
        "object"
    ) {

      return (
        data.message ||
        data.error ||
        data.detail ||
        data.title ||
        data.reason ||
        `GHAR API request failed with status ${status}.`
      );

    }

    if (
      typeof data ===
      "string" &&
      data.trim()
    ) {

      return data;

    }

    return (
      `GHAR API request failed with status ${status}.`
    );

  }

  function getErrorCode(
    data
  ) {

    if (
      data &&
      typeof data ===
        "object"
    ) {

      return (
        data.code ||
        data.errorCode ||
        data.error_code ||
        null
      );

    }

    return null;

  }

  // ==========================================================
  // RETRY LOGIC
  // ==========================================================

  function isRetryableStatus(
    status
  ) {

    return (
      status === 408 ||
      status === 425 ||
      status === 429 ||
      status >= 500
    );

  }

  function shouldRetry(
    error,
    method,
    attempt,
    options
  ) {

    if (
      !ENABLE_RETRY ||
      options.retry === false
    ) {

      return false;

    }

    if (
      attempt >=
      options.retryCount
    ) {

      return false;

    }

    const safeMethod =
      [
        "GET",
        "HEAD",
        "OPTIONS"
      ].includes(
        String(method)
          .toUpperCase()
      );

    if (
      !safeMethod &&
      options.retryUnsafe !==
        true
    ) {

      return false;

    }

    if (
      error instanceof
      GHARApiError
    ) {

      return (
        error.isNetworkError ||
        error.isTimeout ||
        isRetryableStatus(
          error.status
        )
      );

    }

    return false;

  }

  // ==========================================================
  // INTERCEPTORS
  // ==========================================================

  async function runRequestInterceptors(
    context
  ) {

    let result =
      context;

    for (
      const interceptor of
        state.interceptors.request
    ) {

      if (
        isFunction(
          interceptor
        )
      ) {

        result =
          await interceptor(
            result
          ) ||
          result;

      }

    }

    return result;

  }

  async function runResponseInterceptors(
    response,
    context
  ) {

    let result =
      response;

    for (
      const interceptor of
        state.interceptors.response
    ) {

      if (
        isFunction(
          interceptor
        )
      ) {

        result =
          await interceptor(
            result,
            context
          ) ||
          result;

      }

    }

    return result;

  }

  async function runErrorInterceptors(
    error,
    context
  ) {

    let result =
      error;

    for (
      const interceptor of
        state.interceptors.error
    ) {

      if (
        isFunction(
          interceptor
        )
      ) {

        try {

          result =
            await interceptor(
              result,
              context
            ) ||
            result;

        } catch (
          interceptorError
        ) {

          result =
            interceptorError;

        }

      }

    }

    return result;

  }

  function addInterceptor(
    type,
    handler
  ) {

    if (
      ![
        "request",
        "response",
        "error"
      ].includes(type)
    ) {

      throw new Error(
        "Invalid interceptor type."
      );

    }

    if (
      !isFunction(handler)
    ) {

      throw new TypeError(
        "Interceptor must be a function."
      );

    }

    state.interceptors[type]
      .push(handler);

    return () => {

      const list =
        state.interceptors[type];

      const index =
        list.indexOf(handler);

      if (
        index !==
        -1
      ) {

        list.splice(
          index,
          1
        );

      }

    };

  }

  // ==========================================================
  // REQUEST
  // ==========================================================

  async function request(
    endpoint,
    options = {}
  ) {

    const method =
      String(
        options.method ||
        "GET"
      ).toUpperCase();

    const requestId =
      createRequestId();

    const timeout =
      Number(
        options.timeout ??
        REQUEST_TIMEOUT
      );

    const retryCount =
      Number(
        options.retryCount ??
        RETRY_COUNT
      );

    const retryDelay =
      Number(
        options.retryDelay ??
        RETRY_DELAY
      );

    const auth =
      options.auth !==
      false;

    const credentials =
      options.credentials ||
      DEFAULT_CREDENTIALS;

    const controller =
      new AbortController();

    let timeoutId =
      null;

    let externalAbortHandler =
      null;

    const controllerKey =
      options.requestKey ||
      null;

    if (
      controllerKey
    ) {

      const existing =
        state.controllers.get(
          controllerKey
        );

      if (
        existing
      ) {

        existing.abort();

      }

      state.controllers.set(
        controllerKey,
        controller
      );

    }

    const context = {

      endpoint,

      method,

      requestId,

      options

    };

    state.requestCount++;
    state.activeRequests++;

    emit(
      "api:request:start",
      {
        ...context
      }
    );

    try {

      let prepared =
        await runRequestInterceptors(
          context
        );

      for (
        let attempt = 0;
        attempt <= retryCount;
        attempt++
      ) {

        let requestBody =
          options.body;

        const headers = {

          Accept:
            options.accept ||
            "application/json",

          "X-Requested-With":
            "XMLHttpRequest",

          "X-Request-ID":
            requestId,

          ...(
            options.headers ||
            {}
          )

        };

        // ------------------------------------------------------
        // AUTHORIZATION
        // ------------------------------------------------------

        if (
          auth
        ) {

          const token =
            getAccessToken();

          if (
            token &&
            !headers.Authorization
          ) {

            headers.Authorization =
              `Bearer ${token}`;

          }

        }

        // ------------------------------------------------------
        // CSRF
        // ------------------------------------------------------

        const csrfToken =
          getCsrfToken();

        if (
          csrfToken &&
          ![
            "GET",
            "HEAD",
            "OPTIONS"
          ].includes(method) &&
          !headers[CSRF_HEADER]
        ) {

          headers[CSRF_HEADER] =
            csrfToken;

        }

        // ------------------------------------------------------
        // BODY SERIALIZATION
        // ------------------------------------------------------

        const isFormData =
          typeof FormData !==
            "undefined" &&
          requestBody instanceof
            FormData;

        const isBlob =
          typeof Blob !==
            "undefined" &&
          requestBody instanceof
            Blob;

        const isArrayBuffer =
          typeof ArrayBuffer !==
            "undefined" &&
          requestBody instanceof
            ArrayBuffer;

        const isURLSearchParams =
          typeof URLSearchParams !==
            "undefined" &&
          requestBody instanceof
            URLSearchParams;

        if (
          requestBody !==
            undefined &&
          requestBody !==
            null &&
          !isFormData &&
          !isBlob &&
          !isArrayBuffer &&
          !isURLSearchParams &&
          typeof requestBody ===
            "object"
        ) {

          headers[
            "Content-Type"
          ] =
            headers[
              "Content-Type"
            ] ||
            "application/json";

          requestBody =
            JSON.stringify(
              requestBody
            );

        }

        // ------------------------------------------------------
        // TIMEOUT
        // ------------------------------------------------------

        if (
          timeout > 0
        ) {

          timeoutId =
            setTimeout(
              () => {

                controller.abort();

              },
              timeout
            );

        }

        // ------------------------------------------------------
        // EXTERNAL SIGNAL
        // ------------------------------------------------------

        if (
          options.signal
        ) {

          if (
            options.signal.aborted
          ) {

            controller.abort();

          }

          externalAbortHandler =
            () =>
              controller.abort();

          options.signal.addEventListener(
            "abort",
            externalAbortHandler,
            {
              once:
                true
            }
          );

        }

        // ------------------------------------------------------
        // FETCH
        // ------------------------------------------------------

        let response;

        try {

          response =
            await fetch(
              buildUrl(
                endpoint,
                options.query
              ),
              {
                method,

                headers,

                body:
                  requestBody,

                credentials,

                signal:
                  controller.signal,

                cache:
                  options.cache ||
                  "default",

                redirect:
                  options.redirect ||
                  "follow"

              }
            );

        } catch (error) {

          if (
            error &&
            error.name ===
              "AbortError"
          ) {

            const message =
              options.signal?.aborted
                ? "Request was cancelled."
                : "Request timed out.";

            throw new GHARApiError(
              message,
              {
                status:
                  options.signal?.aborted
                    ? 499
                    : 408,

                code:
                  options.signal?.aborted
                    ? "REQUEST_CANCELLED"
                    : "REQUEST_TIMEOUT",

                requestId,

                endpoint,

                method,

                retryable:
                  !options.signal?.aborted
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

              endpoint,

              method,

              cause:
                error,

              retryable:
                true
            }
          );

        } finally {

          if (
            timeoutId
          ) {

            clearTimeout(
              timeoutId
            );

            timeoutId =
              null;

          }

          if (
            options.signal &&
            externalAbortHandler
          ) {

            options.signal.removeEventListener(
              "abort",
              externalAbortHandler
            );

          }

        }

        // ------------------------------------------------------
        // RESPONSE
        // ------------------------------------------------------

        const data =
          await parseResponse(
            response
          );

        // ------------------------------------------------------
        // REFRESH TOKEN
        // ------------------------------------------------------

        if (
          response.status ===
            401 &&
          auth &&
          ENABLE_REFRESH &&
          !options.skipRefresh &&
          !String(
            endpoint
          ).includes(
            "/auth/refresh"
          )
        ) {

          try {

            const refreshed =
              await refreshAccessToken();

            if (
              refreshed
            ) {

              return request(
                endpoint,
                {
                  ...options,

                  skipRefresh:
                    true
                }
              );

            }

          } catch (_) {

            clearTokens();

            emit(
              "auth:expired",
              {
                requestId
              }
            );

          }

        }

        // ------------------------------------------------------
        // HTTP ERROR
        // ------------------------------------------------------

        if (
          !response.ok
        ) {

          const error =
            new GHARApiError(
              getErrorMessage(
                data,
                response.status
              ),
              {
                status:
                  response.status,

                code:
                  getErrorCode(
                    data
                  ),

                data,

                requestId,

                endpoint,

                method,

                retryable:
                  isRetryableStatus(
                    response.status
                  )
              }
            );

          if (
            shouldRetry(
              error,
              method,
              attempt,
              {
                ...options,
                retryCount
              }
            )
          ) {

            state.failedRequests++;

            await sleep(
              retryDelay *
              Math.pow(
                2,
                attempt
              )
            );

            continue;

          }

          throw error;

        }

        // ------------------------------------------------------
        // SUCCESS
        // ------------------------------------------------------

        state.successfulRequests++;

        if (
          data &&
          typeof data ===
            "object"
        ) {

          saveTokens(
            data
          );

        }

        const result = {

          ok:
            true,

          status:
            response.status,

          data,

          requestId,

          headers:
            response.headers,

          url:
            response.url

        };

        const finalResult =
          await runResponseInterceptors(
            result,
            prepared
          );

        emit(
          "api:request:success",
          {
            ...context,

            status:
              response.status,

            requestId
          }
        );

        return finalResult;

      }

    } catch (error) {

      state.failedRequests++;

      const normalized =
        error instanceof
          GHARApiError
          ? error
          : new GHARApiError(
              error?.message ||
              "GHAR API request failed.",
              {
                requestId,

                endpoint,

                method,

                cause:
                  error
              }
            );

      const intercepted =
        await runErrorInterceptors(
          normalized,
          context
        );

      emit(
        "api:request:error",
        {
          ...context,

          error:
            intercepted
        }
      );

      throw intercepted;

    } finally {

      state.activeRequests--;

      if (
        controllerKey &&
        state.controllers.get(
          controllerKey
        ) === controller
      ) {

        state.controllers.delete(
          controllerKey
        );

      }

      emit(
        "api:request:end",
        {
          ...context,

          activeRequests:
            state.activeRequests
        }
      );

    }

  }

  // ==========================================================
  // TOKEN REFRESH
  // ==========================================================

  async function refreshAccessToken() {

    if (
      state.refreshingToken
    ) {

      return state.refreshingToken;

    }

    const refreshToken =
      getRefreshToken();

    if (
      !refreshToken
    ) {

      return false;

    }

    state.refreshingToken =
      (async () => {

        try {

          const result =
            await request(
              "/auth/refresh",
              {
                method:
                  "POST",

                body: {
                  refreshToken
                },

                auth:
                  false,

                skipRefresh:
                  true,

                retry:
                  false
              }
            );

          saveTokens(
            result.data
          );

          emit(
            "auth:refresh",
            {
              data:
                result.data
            }
          );

          return true;

        } catch (error) {

          clearTokens();

          throw error;

        } finally {

          state.refreshingToken =
            null;

        }

      })();

    return state.refreshingToken;

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

        method:
          "GET",

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

        method:
          "POST",

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

        method:
          "PUT",

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

        method:
          "PATCH",

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

        method:
          "DELETE"
      }
    );

  }

  async function head(
    endpoint,
    query = null,
    options = {}
  ) {

    return request(
      endpoint,
      {
        ...options,

        method:
          "HEAD",

        query
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

    Object.entries(
      fields || {}
    ).forEach(
      ([key, value]) => {

        if (
          value ===
            undefined ||
          value ===
            null
        ) {

          return;

        }

        if (
          value instanceof
          Blob
        ) {

          formData.append(
            key,
            value
          );

          return;

        }

        if (
          typeof value ===
          "object"
        ) {

          formData.append(
            key,
            JSON.stringify(
              value
            )
          );

          return;

        }

        formData.append(
          key,
          String(value)
        );

      }
    );

    if (
      typeof File !==
        "undefined" &&
      files instanceof File
    ) {

      formData.append(
        options.fileField ||
        "file",
        files
      );

    } else if (
      typeof FileList !==
        "undefined" &&
      files instanceof FileList
    ) {

      Array.from(
        files
      ).forEach(
        file => {

          formData.append(
            options.fileField ||
            "files",
            file
          );

        }
      );

    } else if (
      Array.isArray(files)
    ) {

      files.forEach(
        file => {

          if (
            file instanceof
            Blob
          ) {

            formData.append(
              options.fileField ||
              "files",
              file
            );

          }

        }
      );

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
  // DOWNLOAD
  // ==========================================================

  async function download(
    endpoint,
    options = {}
  ) {

    const result =
      await request(
        endpoint,
        {
          ...options,

          accept:
            options.accept ||
            "application/octet-stream"
        }
      );

    return result;

  }

  // ==========================================================
  // PAGINATION
  // ==========================================================

  function normalizePagination(
    response
  ) {

    const data =
      response?.data;

    if (
      !data ||
      typeof data !==
        "object"
    ) {

      return {

        items: [],

        page:
          1,

        limit:
          0,

        total:
          0,

        totalPages:
          0,

        hasNext:
          false,

        hasPrevious:
          false

      };

    }

    const items =
      data.items ||
      data.results ||
      data.data ||
      [];

    const page =
      Number(
        data.page ||
        data.currentPage ||
        1
      );

    const limit =
      Number(
        data.limit ||
        data.pageSize ||
        items.length ||
        0
      );

    const total =
      Number(
        data.total ||
        data.count ||
        0
      );

    const totalPages =
      Number(
        data.totalPages ||
        data.pages ||
        (
          limit > 0
            ? Math.ceil(
                total /
                limit
              )
            : 0
        )
      );

    return {

      items:
        Array.isArray(items)
          ? items
          : [],

      page,

      limit,

      total,

      totalPages,

      hasNext:
        Boolean(
          data.hasNext ??
          data.has_next ??
          page <
            totalPages
        ),

      hasPrevious:
        Boolean(
          data.hasPrevious ??
          data.has_previous ??
          page > 1
        )

    };

  }

  // ==========================================================
  // AUTH API
  // ==========================================================

  const auth = {

    login(data) {

      return post(
        "/auth/login",
        data,
        {
          auth:
            false
        }
      );

    },

    register(data) {

      return post(
        "/auth/register",
        data,
        {
          auth:
            false
        }
      );

    },

    signup(data) {

      return post(
        "/auth/signup",
        data,
        {
          auth:
            false
        }
      );

    },

    logout() {

      return post(
        "/auth/logout",
        null,
        {
          retry:
            false
        }
      );

    },

    refresh(data = {}) {

      return post(
        "/auth/refresh",
        {
          refreshToken:
            data.refreshToken ||
            getRefreshToken()
        },
        {
          auth:
            false,

          skipRefresh:
            true,

          retry:
            false
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
          auth:
            false
        }
      );

    },

    sendOtp(data) {

      return post(
        "/auth/send-otp",
        data,
        {
          auth:
            false
        }
      );

    },

    verifyOtp(data) {

      return post(
        "/auth/verify-otp",
        data,
        {
          auth:
            false
        }
      );

    },

    forgotPassword(data) {

      return post(
        "/auth/forgot-password",
        data,
        {
          auth:
            false
        }
      );

    },

    resetPassword(data) {

      return post(
        "/auth/reset-password",
        data,
        {
          auth:
            false
        }
      );

    },

    logoutLocal() {

      clearTokens();

      emit(
        "auth:logout"
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

    upload(
      files,
      fields = {}
    ) {

      return upload(
        "/documents/upload",
        files,
        fields
      );

    },

    verify(
      id,
      data = {}
    ) {

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
          auth:
            false
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
          auth:
            false
        }
      );

    },

    schema() {

      return get(
        "/subscriptions/schema",
        null,
        {
          auth:
            false
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
        "/subscriptions/cancel",
        null,
        {
          retry:
            false
        }
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
          auth:
            false
        }
      );

    },

    modules() {

      return get(
        "/ai/modules",
        null,
        {
          auth:
            false
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

    usersUpdate(
      id,
      data
    ) {

      return patch(
        `/admin/users/${encodeURIComponent(id)}`,
        data
      );

    },

    propertyApprove(
      id,
      data = {}
    ) {

      return post(
        `/admin/properties/${encodeURIComponent(id)}/approve`,
        data
      );

    },

    propertyReject(
      id,
      data = {}
    ) {

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
          auth:
            false
        }
      );

    },

    info() {

      return get(
        "",
        null,
        {
          auth:
            false
        }
      );

    },

    routes() {

      return get(
        "/routes",
        null,
        {
          auth:
            false
        }
      );

    }

  };

  // ==========================================================
  // CLIENT
  // ==========================================================

  const client = {

    API_BASE,

    API_VERSION,

    request,

    get,

    post,

    put,

    patch,

    delete:
      del,

    head,

    upload,

    download,

    refreshAccessToken,

    getAccessToken,

    getRefreshToken,

    clearTokens,

    buildUrl,

    normalizePagination,

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

    system,

    interceptors: {

      addRequest:
        handler =>
          addInterceptor(
            "request",
            handler
          ),

      addResponse:
        handler =>
          addInterceptor(
            "response",
            handler
          ),

      addError:
        handler =>
          addInterceptor(
            "error",
            handler
          )

    },

    getStats() {

      return {

        ...state,

        controllers:
          undefined,

        refreshingToken:
          Boolean(
            state.refreshingToken
          )

      };

    },

    cancel(
      requestKey
    ) {

      const controller =
        state.controllers.get(
          requestKey
        );

      if (
        controller
      ) {

        controller.abort();

        state.controllers.delete(
          requestKey
        );

        return true;

      }

      return false;

    }

  };

  // ==========================================================
  // GLOBAL API
  // ==========================================================

  window.GHARApi =
    Object.freeze(
      client
    );

  // ==========================================================
  // IMPORTANT GHAR CORE INTEGRATION
  // ==========================================================

  GHAR.api =
    client;

  window.GHAR =
    GHAR;

  // ==========================================================
  // NETWORK EVENTS
  // ==========================================================

  if (
    isBrowser()
  ) {

    window.addEventListener(
      "online",
      () => {

        state.online =
          true;

        emit(
          "api:online"
        );

      }
    );

    window.addEventListener(
      "offline",
      () => {

        state.online =
          false;

        emit(
          "api:offline"
        );

      }
    );

  }

  // ==========================================================
  // READY EVENT
  // ==========================================================

  state.initialized =
    true;

  try {

    window.dispatchEvent(
      new CustomEvent(
        "ghar:api-ready",
        {
          detail: {

            api:
              client,

            baseUrl:
              API_BASE,

            version:
              API_VERSION

          }

        }
      )
    );

  } catch (_) {}

})(window);