// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/visits.js
// Property Visit Management
// ============================================================

"use strict";

(function (window) {

  // ==========================================================
  // CONFIG
  // ==========================================================

  const API_BASE =
    window.GHAR_CONFIG?.API_BASE_URL ||
    "/api";

  const VISITS_ENDPOINT =
    `${API_BASE}/visits`;

  // ==========================================================
  // VISIT STATUS
  // ==========================================================

  const STATUS = Object.freeze({
    NEW: "NEW",
    SCHEDULED: "SCHEDULED",
    CONFIRMED: "CONFIRMED",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    RESCHEDULED: "RESCHEDULED",
    NO_SHOW: "NO_SHOW"
  });

  // ==========================================================
  // HELPERS
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

  function authHeaders() {

    const token = getToken();

    const headers = {
      "Content-Type": "application/json"
    };

    if (token) {
      headers.Authorization =
        `Bearer ${token}`;
    }

    return headers;

  }

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

      error.data = data;

      throw error;

    }

    return data;

  }

  // ==========================================================
  // GET ALL VISITS
  // ==========================================================

  async function getVisits(
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

    const url =
      query.toString()
        ? `${VISITS_ENDPOINT}?${query}`
        : VISITS_ENDPOINT;

    return request(url);

  }

  // ==========================================================
  // GET VISIT
  // ==========================================================

  async function getVisit(
    visitId
  ) {

    if (!visitId) {
      throw new Error(
        "Visit ID is required."
      );
    }

    return request(
      `${VISITS_ENDPOINT}/${encodeURIComponent(visitId)}`
    );

  }

  // ==========================================================
  // SCHEDULE VISIT
  // ==========================================================

  async function scheduleVisit(
    visitData
  ) {

    if (!visitData) {
      throw new Error(
        "Visit information is required."
      );
    }

    return request(
      VISITS_ENDPOINT,
      {
        method: "POST",
        body: JSON.stringify(
          visitData
        )
      }
    );

  }

  // ==========================================================
  // UPDATE VISIT
  // ==========================================================

  async function updateVisit(
    visitId,
    visitData
  ) {

    if (!visitId) {
      throw new Error(
        "Visit ID is required."
      );
    }

    return request(
      `${VISITS_ENDPOINT}/${encodeURIComponent(visitId)}`,
      {
        method: "PUT",
        body: JSON.stringify(
          visitData || {}
        )
      }
    );

  }

  // ==========================================================
  // RESCHEDULE VISIT
  // ==========================================================

  async function rescheduleVisit(
    visitId,
    date,
    time
  ) {

    if (!visitId) {
      throw new Error(
        "Visit ID is required."
      );
    }

    return updateVisit(
      visitId,
      {
        scheduledDate: date,
        scheduledTime: time,
        status:
          STATUS.RESCHEDULED
      }
    );

  }

  // ==========================================================
  // CONFIRM VISIT
  // ==========================================================

  async function confirmVisit(
    visitId
  ) {

    return updateVisit(
      visitId,
      {
        status:
          STATUS.CONFIRMED
      }
    );

  }

  // ==========================================================
  // COMPLETE VISIT
  // ==========================================================

  async function completeVisit(
    visitId,
    notes = ""
  ) {

    return updateVisit(
      visitId,
      {
        status:
          STATUS.COMPLETED,
        notes
      }
    );

  }

  // ==========================================================
  // CANCEL VISIT
  // ==========================================================

  async function cancelVisit(
    visitId,
    reason = ""
  ) {

    return updateVisit(
      visitId,
      {
        status:
          STATUS.CANCELLED,
        cancellationReason:
          reason
      }
    );

  }

  // ==========================================================
  // UPCOMING VISITS
  // ==========================================================

  async function getUpcomingVisits() {

    return getVisits({
      status:
        STATUS.CONFIRMED
    });

  }

  // ==========================================================
  // COMPLETED VISITS
  // ==========================================================

  async function getCompletedVisits() {

    return getVisits({
      status:
        STATUS.COMPLETED
    });

  }

  // ==========================================================
  // VISIT HISTORY
  // ==========================================================

  async function getVisitHistory() {

    return getVisits({
      history: true
    });

  }

  // ==========================================================
  // USER VISITS
  // ==========================================================

  async function getMyVisits() {

    return getVisits({
      mine: true
    });

  }

  // ==========================================================
  // PROPERTY VISITS
  // ==========================================================

  async function getPropertyVisits(
    propertyId
  ) {

    if (!propertyId) {
      throw new Error(
        "Property ID is required."
      );
    }

    return getVisits({
      propertyId
    });

  }

  // ==========================================================
  // SELLER / OWNER VISITS
  // ==========================================================

  async function getSellerVisits() {

    return getVisits({
      role: "seller"
    });

  }

  // ==========================================================
  // BUYER VISITS
  // ==========================================================

  async function getBuyerVisits() {

    return getVisits({
      role: "buyer"
    });

  }

  // ==========================================================
  // TENANT VISITS
  // ==========================================================

  async function getTenantVisits() {

    return getVisits({
      role: "tenant"
    });

  }

  // ==========================================================
  // VISIT DATE VALIDATION
  // ==========================================================

  function isValidDate(
    date
  ) {

    if (!date) {
      return false;
    }

    const parsed =
      new Date(date);

    return (
      !Number.isNaN(
        parsed.getTime()
      )
    );

  }

  // ==========================================================
  // VISIT TIME VALIDATION
  // ==========================================================

  function isValidTime(
    time
  ) {

    if (!time) {
      return false;
    }

    return /^([01]\d|2[0-3]):([0-5]\d)$/
      .test(time);

  }

  // ==========================================================
  // CAN SCHEDULE
  // ==========================================================

  function canSchedule(
    date,
    time
  ) {

    if (!isValidDate(date)) {
      return false;
    }

    if (!isValidTime(time)) {
      return false;
    }

    const scheduled =
      new Date(
        `${date}T${time}`
      );

    return (
      scheduled.getTime() >
      Date.now()
    );

  }

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  function formatDate(
    date
  ) {

    if (!date) {
      return "";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return String(date);
    }

    return new Intl.DateTimeFormat(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric"
      }
    ).format(parsed);

  }

  // ==========================================================
  // FORMAT TIME
  // ==========================================================

  function formatTime(
    time
  ) {

    if (!time) {
      return "";
    }

    const match =
      String(time).match(
        /^(\d{1,2}):(\d{2})/
      );

    if (!match) {
      return String(time);
    }

    const hours =
      Number(match[1]);

    const minutes =
      match[2];

    const suffix =
      hours >= 12
        ? "PM"
        : "AM";

    const displayHour =
      hours % 12 || 12;

    return `${displayHour}:${minutes} ${suffix}`;

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
  // STATUS CLASS
  // ==========================================================

  function getStatusClass(
    status
  ) {

    return String(
      status || ""
    )
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

  }

  // ==========================================================
  // RENDER VISIT CARD
  // ==========================================================

  function renderVisitCard(
    visit,
    container
  ) {

    if (
      !container ||
      !visit
    ) {
      return;
    }

    const card =
      document.createElement("article");

    card.className =
      "ghar-visit-card";

    card.dataset.visitId =
      visit.id ||
      visit.visitId ||
      "";

    const propertyName =
      visit.propertyName ||
      visit.property?.title ||
      "Property Visit";

    const date =
      visit.scheduledDate ||
      visit.date ||
      visit.visitDate;

    const time =
      visit.scheduledTime ||
      visit.time ||
      visit.visitTime;

    const status =
      visit.status ||
      STATUS.NEW;

    card.innerHTML = `
      <div class="ghar-visit-card__body">

        <h3 class="ghar-visit-card__title">
          ${escapeHtml(propertyName)}
        </h3>

        <div class="ghar-visit-card__meta">

          <span>
            ${escapeHtml(formatDate(date))}
          </span>

          <span>
            ${escapeHtml(formatTime(time))}
          </span>

        </div>

        <span
          class="ghar-visit-status ghar-visit-status--${escapeHtml(
            getStatusClass(status)
          )}"
        >
          ${escapeHtml(
            getStatusLabel(status)
          )}
        </span>

      </div>
    `;

    container.appendChild(card);

    return card;

  }

  // ==========================================================
  // RENDER VISITS
  // ==========================================================

  function renderVisits(
    visits,
    container
  ) {

    if (!container) {
      return;
    }

    container.innerHTML = "";

    const list =
      Array.isArray(visits)
        ? visits
        : (
          visits?.visits ||
          visits?.data ||
          []
        );

    if (!list.length) {

      container.innerHTML = `
        <div class="ghar-empty-state">
          <h3>No visits found</h3>
          <p>
            Your scheduled property visits
            will appear here.
          </p>
        </div>
      `;

      return;

    }

    list.forEach(
      visit =>
        renderVisitCard(
          visit,
          container
        )
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
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  const Visits = {

    STATUS,

    getVisits,
    getVisit,
    getMyVisits,
    getUpcomingVisits,
    getCompletedVisits,
    getVisitHistory,

    getPropertyVisits,
    getSellerVisits,
    getBuyerVisits,
    getTenantVisits,

    scheduleVisit,
    updateVisit,
    rescheduleVisit,

    confirmVisit,
    completeVisit,
    cancelVisit,

    isValidDate,
    isValidTime,
    canSchedule,

    formatDate,
    formatTime,

    getStatusLabel,
    getStatusClass,

    renderVisitCard,
    renderVisits

  };

  // ==========================================================
  // GLOBAL
  // ==========================================================

  window.GHAR_VISITS =
    Visits;

  window.GHAR =
    window.GHAR || {};

  window.GHAR.Visits =
    Visits;

})(window);