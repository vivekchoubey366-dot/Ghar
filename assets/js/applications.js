// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/applications.js
// Enterprise Application Management Engine
// ============================================================

"use strict";

(function (window, document) {

  // ==========================================================
  // GHAR NAMESPACE
  // ==========================================================

  const GHAR =
    window.GHAR =
    window.GHAR || {};

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const config =
    window.GHAR_CONFIG ||
    window.GHARConfig ||
    {};

  const API_BASE =
    String(
      config.API_BASE_URL ||
      config.API_URL ||
      "/api"
    ).replace(/\/+$/, "");

  const APPLICATIONS_ENDPOINT =
    `${API_BASE}/applications`;

  const CACHE_KEY =
    "ghar_applications_cache";

  const CACHE_TTL =
    Number(
      config.APPLICATION_CACHE_TTL ||
      60 * 1000
    );

  const MAX_CACHE_ITEMS =
    Number(
      config.APPLICATION_MAX_CACHE ||
      100
    );

  // ==========================================================
  // APPLICATION TYPES
  // ==========================================================

  const TYPES = Object.freeze({

    PROPERTY_PURCHASE:
      "PROPERTY_PURCHASE",

    RENTAL:
      "RENTAL",

    LOAN:
      "LOAN",

    PROPERTY_LISTING:
      "PROPERTY_LISTING",

    DOCUMENT_VERIFICATION:
      "DOCUMENT_VERIFICATION"

  });

  // ==========================================================
  // APPLICATION STATUS
  // ==========================================================

  const STATUS = Object.freeze({

    DRAFT:
      "DRAFT",

    SUBMITTED:
      "SUBMITTED",

    UNDER_REVIEW:
      "UNDER_REVIEW",

    DOCUMENTS_REQUIRED:
      "DOCUMENTS_REQUIRED",

    VERIFICATION_PENDING:
      "VERIFICATION_PENDING",

    APPROVED:
      "APPROVED",

    REJECTED:
      "REJECTED",

    CANCELLED:
      "CANCELLED",

    COMPLETED:
      "COMPLETED"

  });

  // ==========================================================
  // ROLES
  // ==========================================================

  const ROLES = Object.freeze({

    GUEST:
      "guest",

    BUYER:
      "buyer",

    SELLER:
      "seller",

    TENANT:
      "tenant",

    OWNER:
      "owner",

    AGENT:
      "agent",

    ADMIN:
      "admin",

    SUPER_ADMIN:
      "super_admin"

  });

  // ==========================================================
  // STATE
  // ==========================================================

  const state = {

    initialized:
      false,

    loading:
      false,

    submitting:
      false,

    applications:
      [],

    current:
      null,

    pagination: {

      page:
        1,

      limit:
        20,

      total:
        0,

      pages:
        1

    },

    filters: {},

    cache:
      new Map(),

    abortController:
      null

  };

  // ==========================================================
  // EVENTS
  // ==========================================================

  function emit(
    name,
    detail = {}
  ) {

    try {

      document.dispatchEvent(
        new CustomEvent(
          `ghar:applications:${name}`,
          {
            detail
          }
        )
      );

    } catch (error) {

      console.warn(
        "GHAR Applications event error:",
        error
      );

    }

  }

  // ==========================================================
  // ERROR FACTORY
  // ==========================================================

  function createError(
    message,
    details = {}
  ) {

    const error =
      new Error(message);

    error.name =
      "GHARApplicationError";

    Object.assign(
      error,
      details
    );

    return error;

  }

  // ==========================================================
  // API CLIENT
  // ==========================================================

  function getApi() {

    if (
      GHAR.Api
    ) {
      return GHAR.Api;
    }

    if (
      window.GHARApi
    ) {
      return window.GHARApi;
    }

    return null;

  }

  // ==========================================================
  // REQUEST
  // ==========================================================

  async function request(
    endpoint,
    options = {}
  ) {

    const api =
      getApi();

    if (api) {

      const method =
        String(
          options.method ||
          "GET"
        ).toUpperCase();

      const requestOptions = {
        ...options
      };

      delete requestOptions.method;

      if (
        method === "GET"
      ) {

        const response =
          await api.get(
            endpoint,
            options.query || null,
            requestOptions
          );

        return response?.data ??
          response;

      }

      if (
        method === "POST"
      ) {

        const response =
          await api.post(
            endpoint,
            options.body ?? null,
            requestOptions
          );

        return response?.data ??
          response;

      }

      if (
        method === "PUT"
      ) {

        const response =
          await api.put(
            endpoint,
            options.body ?? null,
            requestOptions
          );

        return response?.data ??
          response;

      }

      if (
        method === "PATCH"
      ) {

        const response =
          await api.patch(
            endpoint,
            options.body ?? null,
            requestOptions
          );

        return response?.data ??
          response;

      }

      if (
        method === "DELETE"
      ) {

        const response =
          await api.delete(
            endpoint,
            requestOptions
          );

        return response?.data ??
          response;

      }

    }

    // --------------------------------------------------------
    // FALLBACK REQUEST
    // --------------------------------------------------------

    const response =
      await fetch(
        `${API_BASE}${endpoint}`,
        {
          method:
            options.method ||
            "GET",

          credentials:
            "include",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            ...(options.headers || {})
          },

          body:
            options.body
              ? JSON.stringify(
                  options.body
                )
              : undefined,

          signal:
            options.signal
        }
      );

    let data = null;

    try {

      data =
        await response.json();

    } catch {

      data =
        await response.text()
          .catch(() => null);

    }

    if (!response.ok) {

      throw createError(
        data?.error ||
        data?.message ||
        `Request failed: ${response.status}`,
        {
          status:
            response.status,

          data
        }
      );

    }

    return data;

  }

  // ==========================================================
  // ID NORMALIZATION
  // ==========================================================

  function normalizeId(
    application
  ) {

    if (
      application ===
      null ||
      application ===
      undefined
    ) {
      return null;
    }

    if (
      typeof application !==
      "object"
    ) {

      return String(
        application
      ).trim() || null;

    }

    return String(
      application.id ||
      application.applicationId ||
      application.application_id ||
      application.uuid ||
      ""
    ).trim() || null;

  }

  // ==========================================================
  // PROPERTY ID
  // ==========================================================

  function getPropertyId(
    application
  ) {

    if (!application) {
      return null;
    }

    return (
      application.propertyId ||
      application.property_id ||
      application.property?.id ||
      application.property?.propertyId ||
      null
    );

  }

  // ==========================================================
  // RESPONSE NORMALIZATION
  // ==========================================================

  function normalizeListResponse(
    response
  ) {

    if (
      Array.isArray(response)
    ) {

      return {
        items:
          response,

        pagination:
          state.pagination

      };

    }

    const items =
      response?.applications ||
      response?.items ||
      response?.results ||
      response?.data ||
      [];

    const pagination =
      response?.pagination ||
      response?.meta ||
      {};

    return {

      items:
        Array.isArray(items)
          ? items
          : [],

      pagination: {

        page:
          Number(
            pagination.page ||
            pagination.currentPage ||
            1
          ),

        limit:
          Number(
            pagination.limit ||
            pagination.pageSize ||
            state.pagination.limit
          ),

        total:
          Number(
            pagination.total ||
            pagination.totalItems ||
            items.length
          ),

        pages:
          Number(
            pagination.pages ||
            pagination.totalPages ||
            1
          )

      }

    };

  }

  // ==========================================================
  // CACHE STORAGE
  // ==========================================================

  function readCache() {

    try {

      const raw =
        localStorage.getItem(
          CACHE_KEY
        );

      if (!raw) {
        return [];
      }

      const parsed =
        JSON.parse(raw);

      return Array.isArray(parsed)
        ? parsed
        : [];

    } catch {

      return [];

    }

  }

  function writeCache(
    applications
  ) {

    try {

      const list =
        Array.isArray(
          applications
        )
          ? applications.slice(
              0,
              MAX_CACHE_ITEMS
            )
          : [];

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(list)
      );

    } catch (error) {

      console.warn(
        "GHAR Applications cache error:",
        error
      );

    }

  }

  // ==========================================================
  // CACHE FIND
  // ==========================================================

  function getCached(
    applicationId
  ) {

    const id =
      String(
        applicationId ||
        ""
      );

    if (!id) {
      return null;
    }

    const memory =
      state.cache.get(id);

    if (
      memory &&
      Date.now() -
        memory.timestamp <
        CACHE_TTL
    ) {

      return memory.data;

    }

    state.cache.delete(id);

    const storage =
      readCache();

    const found =
      storage.find(
        item =>
          normalizeId(item) === id
      );

    return found ||
      null;

  }

  // ==========================================================
  // CACHE SET
  // ==========================================================

  function setCached(
    application
  ) {

    const id =
      normalizeId(
        application
      );

    if (!id) {
      return;
    }

    state.cache.set(
      id,
      {
        data:
          application,

        timestamp:
          Date.now()
      }
    );

    const existing =
      readCache()
        .filter(
          item =>
            normalizeId(item) !==
            id
        );

    writeCache([
      application,
      ...existing
    ]);

  }

  // ==========================================================
  // CACHE REMOVE
  // ==========================================================

  function removeCached(
    applicationId
  ) {

    const id =
      String(
        applicationId ||
        ""
      );

    state.cache.delete(
      id
    );

    const remaining =
      readCache()
        .filter(
          item =>
            normalizeId(item) !==
            id
        );

    writeCache(
      remaining
    );

  }

  // ==========================================================
  // CLEAR CACHE
  // ==========================================================

  function clearCache() {

    state.cache.clear();

    try {

      localStorage.removeItem(
        CACHE_KEY
      );

    } catch {}

  }

  // ==========================================================
  // QUERY BUILDER
  // ==========================================================

  function buildQuery(
    params = {}
  ) {

    const query =
      {};

    Object.entries(
      params
    ).forEach(
      ([key, value]) => {

        if (
          value === undefined ||
          value === null ||
          value === ""
        ) {
          return;
        }

        query[key] =
          Array.isArray(value)
            ? value.join(",")
            : value;

      }
    );

    return query;

  }

  // ==========================================================
  // GET APPLICATIONS
  // ==========================================================

  async function getApplications(
    params = {},
    options = {}
  ) {

    state.loading =
      true;

    emit(
      "loading",
      {
        loading:
          true
      }
    );

    try {

      const query =
        buildQuery(
          params
        );

      const response =
        await request(
          "/applications",
          {
            method:
              "GET",

            query,

            signal:
              options.signal
          }
        );

      const normalized =
        normalizeListResponse(
          response
        );

      state.applications =
        normalized.items;

      state.pagination =
        {
          ...state.pagination,
          ...normalized.pagination
        };

      state.filters =
        {
          ...params
        };

      normalized.items.forEach(
        setCached
      );

      writeCache(
        normalized.items
      );

      emit(
        "loaded",
        {
          applications:
            [...state.applications],

          pagination:
            {
              ...state.pagination
            },

          filters:
            {
              ...state.filters
            }
        }
      );

      return response;

    } catch (error) {

      emit(
        "error",
        {
          error
        }
      );

      throw error;

    } finally {

      state.loading =
        false;

      emit(
        "loading",
        {
          loading:
            false
        }
      );

    }

  }

  // ==========================================================
  // GET MY APPLICATIONS
  // ==========================================================

  async function getMyApplications(
    params = {}
  ) {

    return getApplications({
      ...params,
      mine:
        true
    });

  }

  // ==========================================================
  // GET APPLICATION
  // ==========================================================

  async function getApplication(
    applicationId,
    options = {}
  ) {

    const id =
      normalizeId(
        applicationId
      );

    if (!id) {

      throw createError(
        "Application ID is required."
      );

    }

    if (
      !options.force
    ) {

      const cached =
        getCached(id);

      if (cached) {

        state.current =
          cached;

        emit(
          "selected",
          {
            application:
              cached
          }
        );

        return cached;

      }

    }

    const response =
      await request(
        `/applications/${encodeURIComponent(id)}`,
        {
          method:
            "GET"
        }
      );

    const application =
      response?.application ||
      response?.data ||
      response;

    if (
      application
    ) {

      state.current =
        application;

      setCached(
        application
      );

      emit(
        "selected",
        {
          application
        }
      );

    }

    return application;

  }

  // ==========================================================
  // CREATE APPLICATION
  // ==========================================================

  async function createApplication(
    applicationData = {}
  ) {

    const validation =
      validateApplication(
        applicationData
      );

    if (
      !validation.valid
    ) {

      throw createError(
        validation.errors.join(" "),
        {
          code:
            "VALIDATION_ERROR",

          errors:
            validation.errors
        }
      );

    }

    state.submitting =
      true;

    emit(
      "creating",
      {
        data:
          applicationData
      }
    );

    try {

      const response =
        await request(
          "/applications",
          {
            method:
              "POST",

            body:
              applicationData
          }
        );

      const application =
        response?.application ||
        response?.data ||
        response;

      if (
        application
      ) {

        setCached(
          application
        );

        state.current =
          application;

        state.applications =
          upsert(
            state.applications,
            application
          );

      }

      emit(
        "created",
        {
          application
        }
      );

      return response;

    } finally {

      state.submitting =
        false;

    }

  }

  // ==========================================================
  // SAVE DRAFT
  // ==========================================================

  async function saveDraft(
    applicationData = {}
  ) {

    return createApplication({
      ...applicationData,

      status:
        STATUS.DRAFT

    });

  }

  // ==========================================================
  // UPDATE APPLICATION
  // ==========================================================

  async function updateApplication(
    applicationId,
    applicationData = {}
  ) {

    const id =
      normalizeId(
        applicationId
      );

    if (!id) {

      throw createError(
        "Application ID is required."
      );

    }

    const response =
      await request(
        `/applications/${encodeURIComponent(id)}`,
        {
          method:
            "PUT",

          body:
            applicationData
        }
      );

    const application =
      response?.application ||
      response?.data ||
      response;

    if (
      application
    ) {

      setCached(
        application
      );

      state.current =
        application;

      state.applications =
        upsert(
          state.applications,
          application
        );

    }

    emit(
      "updated",
      {
        application
      }
    );

    return response;

  }

  // ==========================================================
  // SUBMIT APPLICATION
  // ==========================================================

  async function submitApplication(
    applicationId,
    applicationData = {}
  ) {

    const id =
      normalizeId(
        applicationId
      );

    if (!id) {

      throw createError(
        "Application ID is required."
      );

    }

    const validation =
      validateApplication(
        {
          ...applicationData,

          type:
            applicationData.type ||
            state.current?.type
        }
      );

    if (
      !validation.valid
    ) {

      throw createError(
        validation.errors.join(" "),
        {
          code:
            "VALIDATION_ERROR",

          errors:
            validation.errors
        }
      );

    }

    state.submitting =
      true;

    emit(
      "submitting",
      {
        applicationId:
          id
      }
    );

    try {

      const response =
        await request(
          `/applications/${encodeURIComponent(id)}/submit`,
          {
            method:
              "POST",

            body:
              applicationData
          }
        );

      const application =
        response?.application ||
        response?.data ||
        response;

      if (
        application &&
        typeof application ===
        "object"
      ) {

        setCached(
          application
        );

        state.current =
          application;

        state.applications =
          upsert(
            state.applications,
            application
          );

      }

      emit(
        "submitted",
        {
          application
        }
      );

      return response;

    } finally {

      state.submitting =
        false;

    }

  }

  // ==========================================================
  // CANCEL APPLICATION
  // ==========================================================

  async function cancelApplication(
    applicationId,
    reason = ""
  ) {

    const id =
      normalizeId(
        applicationId
      );

    if (!id) {

      throw createError(
        "Application ID is required."
      );

    }

    const response =
      await request(
        `/applications/${encodeURIComponent(id)}/cancel`,
        {
          method:
            "POST",

          body: {
            reason:
              String(
                reason ||
                ""
              ).trim()
          }
        }
      );

    removeCached(id);

    emit(
      "cancelled",
      {
        applicationId:
          id,

        response
      }
    );

    return response;

  }

  // ==========================================================
  // DELETE APPLICATION
  // ==========================================================

  async function deleteApplication(
    applicationId
  ) {

    const id =
      normalizeId(
        applicationId
      );

    if (!id) {

      throw createError(
        "Application ID is required."
      );

    }

    const response =
      await request(
        `/applications/${encodeURIComponent(id)}`,
        {
          method:
            "DELETE"
        }
      );

    state.applications =
      state.applications.filter(
        application =>
          normalizeId(
            application
          ) !== id
      );

    removeCached(
      id
    );

    if (
      normalizeId(
        state.current
      ) === id
    ) {

      state.current =
        null;

    }

    emit(
      "deleted",
      {
        applicationId:
          id
      }
    );

    return response;

  }

  // ==========================================================
  // APPLICATION BY PROPERTY
  // ==========================================================

  function getPropertyApplications(
    propertyId,
    params = {}
  ) {

    if (!propertyId) {

      throw createError(
        "Property ID is required."
      );

    }

    return getApplications({
      ...params,

      propertyId
    });

  }

  // ==========================================================
  // APPLICATION BY TYPE
  // ==========================================================

  function getApplicationsByType(
    type,
    params = {}
  ) {

    if (
      !Object.values(TYPES)
        .includes(type)
    ) {

      throw createError(
        "Invalid application type."
      );

    }

    return getApplications({
      ...params,

      type
    });

  }

  // ==========================================================
  // APPLICATION BY STATUS
  // ==========================================================

  function getApplicationsByStatus(
    status,
    params = {}
  ) {

    if (
      !Object.values(STATUS)
        .includes(status)
    ) {

      throw createError(
        "Invalid application status."
      );

    }

    return getApplications({
      ...params,

      status
    });

  }

  // ==========================================================
  // BUYER APPLICATIONS
  // ==========================================================

  function getBuyerApplications(
    params = {}
  ) {

    return getApplications({
      ...params,

      role:
        ROLES.BUYER
    });

  }

  // ==========================================================
  // SELLER APPLICATIONS
  // ==========================================================

  function getSellerApplications(
    params = {}
  ) {

    return getApplications({
      ...params,

      role:
        ROLES.SELLER
    });

  }

  // ==========================================================
  // TENANT APPLICATIONS
  // ==========================================================

  function getTenantApplications(
    params = {}
  ) {

    return getApplications({
      ...params,

      role:
        ROLES.TENANT
    });

  }

  // ==========================================================
  // ADMIN APPLICATIONS
  // ==========================================================

  function getAdminApplications(
    params = {}
  ) {

    return getApplications({
      ...params,

      admin:
        true
    });

  }

  // ==========================================================
  // APPROVE APPLICATION
  // ==========================================================

  async function approveApplication(
    applicationId,
    notes = ""
  ) {

    const id =
      normalizeId(
        applicationId
      );

    if (!id) {

      throw createError(
        "Application ID is required."
      );

    }

    const response =
      await request(
        `/applications/${encodeURIComponent(id)}/approve`,
        {
          method:
            "POST",

          body: {
            notes
          }
        }
      );

    emit(
      "approved",
      {
        applicationId:
          id,

        response
      }
    );

    return response;

  }

  // ==========================================================
  // REJECT APPLICATION
  // ==========================================================

  async function rejectApplication(
    applicationId,
    reason = ""
  ) {

    const id =
      normalizeId(
        applicationId
      );

    if (!id) {

      throw createError(
        "Application ID is required."
      );

    }

    if (
      !String(reason).trim()
    ) {

      throw createError(
        "A rejection reason is required."
      );

    }

    const response =
      await request(
        `/applications/${encodeURIComponent(id)}/reject`,
        {
          method:
            "POST",

          body: {
            reason:
              String(
                reason
              ).trim()
          }
        }
      );

    emit(
      "rejected",
      {
        applicationId:
          id,

        response
      }
    );

    return response;

  }

  // ==========================================================
  // REQUEST DOCUMENTS
  // ==========================================================

  async function requestDocuments(
    applicationId,
    documents = []
  ) {

    const id =
      normalizeId(
        applicationId
      );

    if (!id) {

      throw createError(
        "Application ID is required."
      );

    }

    if (
      !Array.isArray(documents) ||
      !documents.length
    ) {

      throw createError(
        "At least one document is required."
      );

    }

    const response =
      await request(
        `/applications/${encodeURIComponent(id)}/documents`,
        {
          method:
            "POST",

          body: {
            documents
          }
        }
      );

    emit(
      "documents-requested",
      {
        applicationId:
          id,

        documents
      }
    );

    return response;

  }

  // ==========================================================
  // STATUS
  // ==========================================================

  async function getApplicationStatus(
    applicationId
  ) {

    const id =
      normalizeId(
        applicationId
      );

    if (!id) {

      throw createError(
        "Application ID is required."
      );

    }

    return request(
      `/applications/${encodeURIComponent(id)}/status`,
      {
        method:
          "GET"
      }
    );

  }

  // ==========================================================
  // TIMELINE
  // ==========================================================

  async function getApplicationTimeline(
    applicationId
  ) {

    const id =
      normalizeId(
        applicationId
      );

    if (!id) {

      throw createError(
        "Application ID is required."
      );

    }

    return request(
      `/applications/${encodeURIComponent(id)}/timeline`,
      {
        method:
          "GET"
      }
    );

  }

  // ==========================================================
  // DOCUMENTS
  // ==========================================================

  async function getApplicationDocuments(
    applicationId
  ) {

    const id =
      normalizeId(
        applicationId
      );

    if (!id) {

      throw createError(
        "Application ID is required."
      );

    }

    return request(
      `/applications/${encodeURIComponent(id)}/documents`,
      {
        method:
          "GET"
      }
    );

  }

  // ==========================================================
  // PAYMENTS
  // ==========================================================

  async function getApplicationPayments(
    applicationId
  ) {

    const id =
      normalizeId(
        applicationId
      );

    if (!id) {

      throw createError(
        "Application ID is required."
      );

    }

    return request(
      `/applications/${encodeURIComponent(id)}/payments`,
      {
        method:
          "GET"
      }
    );

  }

  // ==========================================================
  // VALIDATION
  // ==========================================================

  function validateApplication(
    application = {}
  ) {

    const errors = [];

    if (
      !application ||
      typeof application !==
      "object"
    ) {

      return {
        valid:
          false,

        errors: [
          "Application data is required."
        ]
      };

    }

    if (!application.type) {

      errors.push(
        "Application type is required."
      );

    } else if (
      !Object.values(TYPES)
        .includes(
          application.type
        )
    ) {

      errors.push(
        "Invalid application type."
      );

    }

    const requiresProperty =
      application.type !==
      TYPES.LOAN;

    if (
      requiresProperty &&
      !getPropertyId(
        application
      )
    ) {

      errors.push(
        "Property ID is required."
      );

    }

    if (
      application.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(
          String(
            application.email
          )
        )
    ) {

      errors.push(
        "Invalid email address."
      );

    }

    if (
      application.phone &&
      !/^[+0-9()\-\s]{7,20}$/
        .test(
          String(
            application.phone
          )
        )
    ) {

      errors.push(
        "Invalid phone number."
      );

    }

    return {

      valid:
        errors.length === 0,

      errors

    };

  }

  // ==========================================================
  // STATUS LABEL
  // ==========================================================

  function getStatusLabel(
    status
  ) {

    if (!status) {
      return "Unknown";
    }

    return String(
      status
    )
      .replace(
        /[_-]/g,
        " "
      )
      .toLowerCase()
      .replace(
        /\b\w/g,
        char =>
          char.toUpperCase()
      );

  }

  // ==========================================================
  // TYPE LABEL
  // ==========================================================

  function getTypeLabel(
    type
  ) {

    if (!type) {
      return "Application";
    }

    return String(
      type
    )
      .replace(
        /[_-]/g,
        " "
      )
      .toLowerCase()
      .replace(
        /\b\w/g,
        char =>
          char.toUpperCase()
      );

  }

  // ==========================================================
  // STATUS CLASS
  // ==========================================================

  function getStatusClass(
    status
  ) {

    return String(
      status || ""
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  }

  // ==========================================================
  // STATUS CATEGORY
  // ==========================================================

  function getStatusCategory(
    status
  ) {

    switch (
      status
    ) {

      case STATUS.DRAFT:
        return "draft";

      case STATUS.SUBMITTED:
      case STATUS.UNDER_REVIEW:
      case STATUS.DOCUMENTS_REQUIRED:
      case STATUS.VERIFICATION_PENDING:
        return "pending";

      case STATUS.APPROVED:
      case STATUS.COMPLETED:
        return "success";

      case STATUS.REJECTED:
      case STATUS.CANCELLED:
        return "danger";

      default:
        return "neutral";

    }

  }

  // ==========================================================
  // TERMINAL STATUS
  // ==========================================================

  function isTerminalStatus(
    status
  ) {

    return [
      STATUS.APPROVED,
      STATUS.REJECTED,
      STATUS.CANCELLED,
      STATUS.COMPLETED
    ].includes(
      status
    );

  }

  // ==========================================================
  // CAN EDIT
  // ==========================================================

  function canEdit(
    application
  ) {

    if (!application) {
      return false;
    }

    return [
      STATUS.DRAFT,
      STATUS.DOCUMENTS_REQUIRED
    ].includes(
      application.status
    );

  }

  // ==========================================================
  // CAN CANCEL
  // ==========================================================

  function canCancel(
    application
  ) {

    if (!application) {
      return false;
    }

    return !isTerminalStatus(
      application.status
    );

  }

  // ==========================================================
  // HTML ESCAPE
  // ==========================================================

  function escapeHtml(
    value
  ) {

    return String(
      value ?? ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  }

  // ==========================================================
  // APPLICATION TITLE
  // ==========================================================

  function getApplicationTitle(
    application
  ) {

    return (
      application?.propertyName ||
      application?.property?.title ||
      application?.property?.name ||
      application?.title ||
      getTypeLabel(
        application?.type
      )
    );

  }

  // ==========================================================
  // UPSERT
  // ==========================================================

  function upsert(
    list,
    item
  ) {

    const id =
      normalizeId(
        item
      );

    if (!id) {
      return list;
    }

    const index =
      list.findIndex(
        existing =>
          normalizeId(
            existing
          ) === id
      );

    if (
      index === -1
    ) {

      return [
        item,
        ...list
      ];

    }

    const copy =
      [...list];

    copy[index] = {
      ...copy[index],
      ...item
    };

    return copy;

  }

  // ==========================================================
  // RENDER CARD
  // ==========================================================

  function renderApplicationCard(
    application,
    container
  ) {

    if (
      !application ||
      !container
    ) {
      return null;
    }

    const id =
      normalizeId(
        application
      );

    const title =
      getApplicationTitle(
        application
      );

    const status =
      application.status ||
      STATUS.DRAFT;

    const type =
      application.type ||
      TYPES.PROPERTY_PURCHASE;

    const card =
      document.createElement(
        "article"
      );

    card.className =
      "ghar-application-card";

    card.dataset.applicationId =
      id || "";

    card.dataset.status =
      status;

    card.dataset.type =
      type;

    card.innerHTML = `

      <div class="ghar-application-card__body">

        <div class="ghar-application-card__header">

          <div>

            <span class="ghar-application-card__eyebrow">
              ${escapeHtml(
                getTypeLabel(type)
              )}
            </span>

            <h3 class="ghar-application-card__title">
              ${escapeHtml(title)}
            </h3>

          </div>

          <span
            class="
              ghar-application-status
              ghar-application-status--${escapeHtml(
                getStatusClass(status)
              )}
            "
            data-status-category="${escapeHtml(
              getStatusCategory(status)
            )}"
          >
            ${escapeHtml(
              getStatusLabel(status)
            )}
          </span>

        </div>

        <div class="ghar-application-card__meta">

          ${
            application.applicationNumber
              ? `
                <span>
                  <strong>Application:</strong>
                  ${escapeHtml(
                    application.applicationNumber
                  )}
                </span>
              `
              : ""
          }

          ${
            getPropertyId(application)
              ? `
                <span>
                  <strong>Property:</strong>
                  ${escapeHtml(
                    getPropertyId(application)
                  )}
                </span>
              `
              : ""
          }

          ${
            application.createdAt
              ? `
                <span>
                  <strong>Created:</strong>
                  ${escapeHtml(
                    formatDate(
                      application.createdAt
                    )
                  )}
                </span>
              `
              : ""
          }

        </div>

        <div class="ghar-application-card__actions">

          ${
            id
              ? `
                <button
                  type="button"
                  class="ghar-btn ghar-btn--secondary"
                  data-application-view="${escapeHtml(id)}"
                >
                  View
                </button>
              `
              : ""
          }

          ${
            canEdit(application) && id
              ? `
                <button
                  type="button"
                  class="ghar-btn ghar-btn--primary"
                  data-application-edit="${escapeHtml(id)}"
                >
                  Continue
                </button>
              `
              : ""
          }

        </div>

      </div>
    `;

    container.appendChild(
      card
    );

    return card;

  }

  // ==========================================================
  // RENDER LIST
  // ==========================================================

  function renderApplications(
    applications,
    container
  ) {

    if (!container) {
      return;
    }

    container.innerHTML =
      "";

    const list =
      Array.isArray(
        applications
      )
        ? applications
        : (
          applications?.applications ||
          applications?.items ||
          applications?.data ||
          []
        );

    if (!list.length) {

      const empty =
        document.createElement(
          "div"
        );

      empty.className =
        "ghar-empty-state";

      empty.innerHTML = `

        <h3>
          No applications found
        </h3>

        <p>
          Your property, rental,
          loan and verification
          applications will appear here.
        </p>

      `;

      container.appendChild(
        empty
      );

      return;

    }

    list.forEach(
      application =>
        renderApplicationCard(
          application,
          container
        )
    );

  }

  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  function formatDate(
    value
  ) {

    if (!value) {
      return "--";
    }

    const date =
      new Date(
        value
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return String(
        value
      );

    }

    return new Intl.DateTimeFormat(
      "en-IN",
      {
        dateStyle:
          "medium"
      }
    ).format(
      date
    );

  }

  // ==========================================================
  // GET STATE
  // ==========================================================

  function getState() {

    return {

      ...state,

      applications:
        [...state.applications],

      filters:
        {
          ...state.filters
        },

      pagination:
        {
          ...state.pagination
        }

    };

  }

  // ==========================================================
  // SET CURRENT
  // ==========================================================

  function setCurrent(
    application
  ) {

    state.current =
      application ||
      null;

    if (
      application
    ) {

      setCached(
        application
      );

    }

    emit(
      "selected",
      {
        application:
          state.current
      }
    );

    return state.current;

  }

  // ==========================================================
  // REFRESH
  // ==========================================================

  async function refresh(
    params = {}
  ) {

    clearCache();

    return getApplications(
      params
    );

  }

  // ==========================================================
  // ABORT REQUESTS
  // ==========================================================

  function abortRequests() {

    if (
      state.abortController
    ) {

      state.abortController.abort();

      state.abortController =
        null;

    }

  }

  // ==========================================================
  // INITIALIZATION
  // ==========================================================

  function init() {

    if (
      state.initialized
    ) {
      return Applications;
    }

    state.initialized =
      true;

    bindEvents();

    emit(
      "ready",
      {
        state:
          getState()
      }
    );

    return Applications;

  }

  // ==========================================================
  // DOM EVENTS
  // ==========================================================

  function bindEvents() {

    if (
      state.eventsBound
    ) {
      return;
    }

    state.eventsBound =
      true;

    document.addEventListener(
      "click",
      event => {

        const view =
          event.target.closest(
            "[data-application-view]"
          );

        if (view) {

          const id =
            view.dataset.applicationView;

          emit(
            "view-requested",
            {
              applicationId:
                id
            }
          );

          return;

        }

        const edit =
          event.target.closest(
            "[data-application-edit]"
          );

        if (edit) {

          const id =
            edit.dataset.applicationEdit;

          emit(
            "edit-requested",
            {
              applicationId:
                id
            }
          );

        }

      }
    );

  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  const Applications = {

    // Configuration
    API_BASE,
    APPLICATIONS_ENDPOINT,

    // Constants
    TYPES,
    STATUS,
    ROLES,

    // State
    getState,
    setCurrent,

    // CRUD
    getApplications,
    getMyApplications,
    getApplication,

    createApplication,
    saveDraft,
    updateApplication,
    submitApplication,

    cancelApplication,
    deleteApplication,

    // Filters
    getPropertyApplications,
    getApplicationsByType,
    getApplicationsByStatus,

    getBuyerApplications,
    getSellerApplications,
    getTenantApplications,
    getAdminApplications,

    // Admin
    approveApplication,
    rejectApplication,
    requestDocuments,

    // Application information
    getApplicationStatus,
    getApplicationTimeline,
    getApplicationDocuments,
    getApplicationPayments,

    // Validation
    validateApplication,

    // Status utilities
    getStatusLabel,
    getStatusClass,
    getStatusCategory,
    isTerminalStatus,
    canEdit,
    canCancel,

    // Type utilities
    getTypeLabel,

    // Helpers
    normalizeId,
    getPropertyId,
    getApplicationTitle,
    formatDate,
    escapeHtml,

    // Cache
    clearCache,
    getCached,

    // UI
    renderApplicationCard,
    renderApplications,

    // Lifecycle
    refresh,
    abortRequests,
    init

  };

  // ==========================================================
  // GHAR NAMESPACE
  // ==========================================================

  GHAR.Applications =
    Applications;

  window.GHAR_APPLICATIONS =
    Applications;

  // ==========================================================
  // AUTO INITIALIZATION
  // ==========================================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () => {
        Applications.init();
      },
      {
        once:
          true
      }
    );

  } else {

    Applications.init();

  }

})(window, document);