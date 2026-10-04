// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/applications.js
// Property / Rental / Loan Application Management
// ============================================================

"use strict";

(function (window) {

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const API_BASE =
    window.GHAR_CONFIG?.API_BASE_URL ||
    "/api";

  const APPLICATIONS_ENDPOINT =
    `${API_BASE}/applications`;

  // ==========================================================
  // APPLICATION TYPES
  // ==========================================================

  const TYPES = Object.freeze({
    PROPERTY_PURCHASE: "PROPERTY_PURCHASE",
    RENTAL: "RENTAL",
    LOAN: "LOAN",
    PROPERTY_LISTING: "PROPERTY_LISTING",
    DOCUMENT_VERIFICATION: "DOCUMENT_VERIFICATION"
  });

  // ==========================================================
  // APPLICATION STATUS
  // ==========================================================

  const STATUS = Object.freeze({
    DRAFT: "DRAFT",
    SUBMITTED: "SUBMITTED",
    UNDER_REVIEW: "UNDER_REVIEW",
    DOCUMENTS_REQUIRED: "DOCUMENTS_REQUIRED",
    VERIFICATION_PENDING: "VERIFICATION_PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    CANCELLED: "CANCELLED",
    COMPLETED: "COMPLETED"
  });

  // ==========================================================
  // HELPER - TOKEN
  // ==========================================================

  function getToken() {

    return (
      window.GHAR_AUTH?.getToken?.() ||
      localStorage.getItem("ghar_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("ghar_token") ||
      null
    );

  }

  // ==========================================================
  // AUTH HEADERS
  // ==========================================================

  function authHeaders() {

    const headers = {
      "Content-Type": "application/json"
    };

    const token = getToken();

    if (token) {
      headers.Authorization =
        `Bearer ${token}`;
    }

    return headers;

  }

  // ==========================================================
  // API REQUEST
  // ==========================================================

  async function request(
    url,
    options = {}
  ) {

    const response =
      await fetch(url, {
        credentials: "include",
        ...options,

        headers: {
          ...authHeaders(),
          ...(options.headers || {})
        }
      });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {

      const error =
        new Error(
          data?.error ||
          data?.message ||
          `Request failed: ${response.status}`
        );

      error.status =
        response.status;

      error.data =
        data;

      throw error;

    }

    return data;

  }

  // ==========================================================
  // BUILD QUERY
  // ==========================================================

  function buildQuery(
    params = {}
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

    return queryString
      ? `?${queryString}`
      : "";

  }

  // ==========================================================
  // GET APPLICATIONS
  // ==========================================================

  async function getApplications(
    params = {}
  ) {

    return request(
      `${APPLICATIONS_ENDPOINT}${buildQuery(params)}`
    );

  }

  // ==========================================================
  // GET MY APPLICATIONS
  // ==========================================================

  async function getMyApplications() {

    return getApplications({
      mine: true
    });

  }

  // ==========================================================
  // GET APPLICATION
  // ==========================================================

  async function getApplication(
    applicationId
  ) {

    if (!applicationId) {
      throw new Error(
        "Application ID is required."
      );
    }

    return request(
      `${APPLICATIONS_ENDPOINT}/${encodeURIComponent(applicationId)}`
    );

  }

  // ==========================================================
  // CREATE APPLICATION
  // ==========================================================

  async function createApplication(
    applicationData = {}
  ) {

    if (
      !applicationData ||
      typeof applicationData !== "object"
    ) {
      throw new Error(
        "Application data is required."
      );
    }

    return request(
      APPLICATIONS_ENDPOINT,
      {
        method: "POST",
        body:
          JSON.stringify(
            applicationData
          )
      }
    );

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

    if (!applicationId) {
      throw new Error(
        "Application ID is required."
      );
    }

    return request(
      `${APPLICATIONS_ENDPOINT}/${encodeURIComponent(applicationId)}`,
      {
        method: "PUT",
        body:
          JSON.stringify(
            applicationData
          )
      }
    );

  }

  // ==========================================================
  // SUBMIT APPLICATION
  // ==========================================================

  async function submitApplication(
    applicationId,
    applicationData = {}
  ) {

    if (!applicationId) {
      throw new Error(
        "Application ID is required."
      );
    }

    return request(
      `${APPLICATIONS_ENDPOINT}/${encodeURIComponent(applicationId)}/submit`,
      {
        method: "POST",
        body:
          JSON.stringify(
            applicationData
          )
      }
    );

  }

  // ==========================================================
  // CANCEL APPLICATION
  // ==========================================================

  async function cancelApplication(
    applicationId,
    reason = ""
  ) {

    if (!applicationId) {
      throw new Error(
        "Application ID is required."
      );
    }

    return request(
      `${APPLICATIONS_ENDPOINT}/${encodeURIComponent(applicationId)}/cancel`,
      {
        method: "POST",
        body:
          JSON.stringify({
            reason
          })
      }
    );

  }

  // ==========================================================
  // DELETE DRAFT
  // ==========================================================

  async function deleteApplication(
    applicationId
  ) {

    if (!applicationId) {
      throw new Error(
        "Application ID is required."
      );
    }

    return request(
      `${APPLICATIONS_ENDPOINT}/${encodeURIComponent(applicationId)}`,
      {
        method: "DELETE"
      }
    );

  }

  // ==========================================================
  // APPLICATION BY PROPERTY
  // ==========================================================

  async function getPropertyApplications(
    propertyId
  ) {

    if (!propertyId) {
      throw new Error(
        "Property ID is required."
      );
    }

    return getApplications({
      propertyId
    });

  }

  // ==========================================================
  // APPLICATION BY TYPE
  // ==========================================================

  async function getApplicationsByType(
    type
  ) {

    if (!type) {
      throw new Error(
        "Application type is required."
      );
    }

    return getApplications({
      type
    });

  }

  // ==========================================================
  // APPLICATION BY STATUS
  // ==========================================================

  async function getApplicationsByStatus(
    status
  ) {

    if (!status) {
      throw new Error(
        "Application status is required."
      );
    }

    return getApplications({
      status
    });

  }

  // ==========================================================
  // BUYER APPLICATIONS
  // ==========================================================

  async function getBuyerApplications() {

    return getApplications({
      role: "buyer"
    });

  }

  // ==========================================================
  // SELLER APPLICATIONS
  // ==========================================================

  async function getSellerApplications() {

    return getApplications({
      role: "seller"
    });

  }

  // ==========================================================
  // TENANT APPLICATIONS
  // ==========================================================

  async function getTenantApplications() {

    return getApplications({
      role: "tenant"
    });

  }

  // ==========================================================
  // ADMIN APPLICATIONS
  // ==========================================================

  async function getAdminApplications(
    params = {}
  ) {

    return getApplications({
      ...params,
      admin: true
    });

  }

  // ==========================================================
  // APPROVE APPLICATION
  // ==========================================================

  async function approveApplication(
    applicationId,
    notes = ""
  ) {

    if (!applicationId) {
      throw new Error(
        "Application ID is required."
      );
    }

    return request(
      `${APPLICATIONS_ENDPOINT}/${encodeURIComponent(applicationId)}/approve`,
      {
        method: "POST",
        body:
          JSON.stringify({
            notes
          })
      }
    );

  }

  // ==========================================================
  // REJECT APPLICATION
  // ==========================================================

  async function rejectApplication(
    applicationId,
    reason = ""
  ) {

    if (!applicationId) {
      throw new Error(
        "Application ID is required."
      );
    }

    return request(
      `${APPLICATIONS_ENDPOINT}/${encodeURIComponent(applicationId)}/reject`,
      {
        method: "POST",
        body:
          JSON.stringify({
            reason
          })
      }
    );

  }

  // ==========================================================
  // REQUEST DOCUMENTS
  // ==========================================================

  async function requestDocuments(
    applicationId,
    documents = []
  ) {

    if (!applicationId) {
      throw new Error(
        "Application ID is required."
      );
    }

    return request(
      `${APPLICATIONS_ENDPOINT}/${encodeURIComponent(applicationId)}/documents`,
      {
        method: "POST",
        body:
          JSON.stringify({
            documents
          })
      }
    );

  }

  // ==========================================================
  // APPLICATION STATUS
  // ==========================================================

  async function getApplicationStatus(
    applicationId
  ) {

    if (!applicationId) {
      throw new Error(
        "Application ID is required."
      );
    }

    return request(
      `${APPLICATIONS_ENDPOINT}/${encodeURIComponent(applicationId)}/status`
    );

  }

  // ==========================================================
  // APPLICATION TIMELINE
  // ==========================================================

  async function getApplicationTimeline(
    applicationId
  ) {

    if (!applicationId) {
      throw new Error(
        "Application ID is required."
      );
    }

    return request(
      `${APPLICATIONS_ENDPOINT}/${encodeURIComponent(applicationId)}/timeline`
    );

  }

  // ==========================================================
  // DOCUMENTS
  // ==========================================================

  async function getApplicationDocuments(
    applicationId
  ) {

    if (!applicationId) {
      throw new Error(
        "Application ID is required."
      );
    }

    return request(
      `${APPLICATIONS_ENDPOINT}/${encodeURIComponent(applicationId)}/documents`
    );

  }

  // ==========================================================
  // PAYMENTS
  // ==========================================================

  async function getApplicationPayments(
    applicationId
  ) {

    if (!applicationId) {
      throw new Error(
        "Application ID is required."
      );
    }

    return request(
      `${APPLICATIONS_ENDPOINT}/${encodeURIComponent(applicationId)}/payments`
    );

  }

  // ==========================================================
  // VALIDATE APPLICATION
  // ==========================================================

  function validateApplication(
    application = {}
  ) {

    const errors = [];

    if (!application.type) {
      errors.push(
        "Application type is required."
      );
    }

    if (
      !Object.values(TYPES)
        .includes(application.type)
    ) {
      errors.push(
        "Invalid application type."
      );
    }

    if (
      application.propertyId ===
      undefined &&
      application.type !==
        TYPES.LOAN
    ) {
      errors.push(
        "Property ID is required."
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

    return String(status)
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, char =>
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

    return String(type)
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, char =>
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
      );

  }

  // ==========================================================
  // ESCAPE HTML
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
  // RENDER APPLICATION CARD
  // ==========================================================

  function renderApplicationCard(
    application,
    container
  ) {

    if (
      !application ||
      !container
    ) {
      return;
    }

    const id =
      application.id ||
      application.applicationId ||
      "";

    const propertyName =
      application.propertyName ||
      application.property?.title ||
      "Property Application";

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
      id;

    card.innerHTML = `
      <div class="ghar-application-card__body">

        <div class="ghar-application-card__header">

          <h3 class="ghar-application-card__title">
            ${escapeHtml(propertyName)}
          </h3>

          <span
            class="ghar-application-status ghar-application-status--${escapeHtml(
              getStatusClass(status)
            )}"
          >
            ${escapeHtml(
              getStatusLabel(status)
            )}
          </span>

        </div>

        <div class="ghar-application-card__meta">

          <span>
            Type:
            ${escapeHtml(
              getTypeLabel(type)
            )}
          </span>

          ${
            application.applicationNumber
              ? `
                <span>
                  Application:
                  ${escapeHtml(
                    application.applicationNumber
                  )}
                </span>
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
  // RENDER APPLICATIONS
  // ==========================================================

  function renderApplications(
    applications,
    container
  ) {

    if (!container) {
      return;
    }

    container.innerHTML = "";

    const list =
      Array.isArray(applications)
        ? applications
        : (
          applications?.applications ||
          applications?.data ||
          []
        );

    if (!list.length) {

      container.innerHTML = `
        <div class="ghar-empty-state">
          <h3>No applications found</h3>
          <p>
            Your property applications
            will appear here.
          </p>
        </div>
      `;

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
  // PUBLIC API
  // ==========================================================

  const Applications = {

    TYPES,
    STATUS,

    getApplications,
    getMyApplications,
    getApplication,

    createApplication,
    saveDraft,
    updateApplication,
    submitApplication,
    cancelApplication,
    deleteApplication,

    getPropertyApplications,
    getApplicationsByType,
    getApplicationsByStatus,

    getBuyerApplications,
    getSellerApplications,
    getTenantApplications,
    getAdminApplications,

    approveApplication,
    rejectApplication,
    requestDocuments,

    getApplicationStatus,
    getApplicationTimeline,
    getApplicationDocuments,
    getApplicationPayments,

    validateApplication,

    getStatusLabel,
    getTypeLabel,
    getStatusClass,

    renderApplicationCard,
    renderApplications

  };

  // ==========================================================
  // GLOBAL GHAR OBJECT
  // ==========================================================

  window.GHAR =
    window.GHAR || {};

  window.GHAR.Applications =
    Applications;

  window.GHAR_APPLICATIONS =
    Applications;

})(window);