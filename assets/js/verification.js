// ============================================================
// GHAR - REAL ESTATE PLATFORM
// verification.js
// Identity / Phone / Email / Address / KYC / PAN / Aadhaar
// / Ownership / Verification Status
// ============================================================

"use strict";

(function () {
  const GHAR = window.GHAR || {};

  // ----------------------------------------------------------
  // CONFIG
  // ----------------------------------------------------------

  const API_BASE =
    GHAR.API_BASE ||
    window.GHAR_CONFIG?.API_BASE ||
    "/api";

  const STORAGE_KEYS = {
    token: "ghar_token",
    user: "ghar_user",
    verification: "ghar_verification"
  };

  const VERIFICATION_LEVELS = Object.freeze([
    "UNVERIFIED",
    "BASIC_VERIFIED",
    "OWNER_VERIFIED",
    "DOCUMENT_VERIFIED",
    "PROPERTY_VERIFIED"
  ]);

  const VERIFICATION_STATUS = Object.freeze([
    "NOT_STARTED",
    "PENDING",
    "IN_REVIEW",
    "VERIFIED",
    "REJECTED",
    "EXPIRED"
  ]);

  const VERIFICATION_TYPES = Object.freeze([
    "identity",
    "phone",
    "email",
    "address",
    "kyc",
    "pan",
    "aadhaar",
    "ownership"
  ]);

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  function getToken() {
    try {
      return (
        localStorage.getItem(STORAGE_KEYS.token) ||
        sessionStorage.getItem(STORAGE_KEYS.token) ||
        ""
      );
    } catch {
      return "";
    }
  }

  function getStoredVerification() {
    try {
      const value = localStorage.getItem(
        STORAGE_KEYS.verification
      );

      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  function saveVerification(data) {
    try {
      localStorage.setItem(
        STORAGE_KEYS.verification,
        JSON.stringify(data)
      );
    } catch {
      // Storage may be unavailable.
    }
  }

  function getUser() {
    try {
      const value = localStorage.getItem(
        STORAGE_KEYS.user
      );

      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeStatus(status) {
    return String(status || "NOT_STARTED")
      .trim()
      .toUpperCase();
  }

  function normalizeLevel(level) {
    return String(level || "UNVERIFIED")
      .trim()
      .toUpperCase();
  }

  function isValidType(type) {
    return VERIFICATION_TYPES.includes(
      String(type).toLowerCase()
    );
  }

  // ----------------------------------------------------------
  // API REQUEST
  // ----------------------------------------------------------

  async function request(
    endpoint,
    options = {}
  ) {
    const headers = {
      Accept: "application/json",
      ...(options.headers || {})
    };

    if (
      options.body &&
      !(options.body instanceof FormData)
    ) {
      headers["Content-Type"] =
        "application/json";
    }

    const token = getToken();

    if (token) {
      headers.Authorization =
        `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE}${endpoint}`,
      {
        ...options,
        headers,
        credentials: "include"
      }
    );

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
          `Verification request failed (${response.status})`
        );

      error.status = response.status;
      error.data = data;

      throw error;
    }

    return data;
  }

  // ----------------------------------------------------------
  // VERIFICATION API
  // ----------------------------------------------------------

  async function getStatus() {
    return request(
      "/verification/status"
    );
  }

  async function getLevels() {
    return request(
      "/verification/levels"
    );
  }

  async function getVerification(
    type
  ) {
    if (!isValidType(type)) {
      throw new Error(
        "Invalid verification type."
      );
    }

    return request(
      `/verification/${encodeURIComponent(
        type
      )}`
    );
  }

  async function submit(
    type,
    payload = {}
  ) {
    if (!isValidType(type)) {
      throw new Error(
        "Invalid verification type."
      );
    }

    return request(
      `/verification/${encodeURIComponent(
        type
      )}`,
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );
  }

  async function update(
    type,
    payload = {}
  ) {
    if (!isValidType(type)) {
      throw new Error(
        "Invalid verification type."
      );
    }

    return request(
      `/verification/${encodeURIComponent(
        type
      )}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload)
      }
    );
  }

  async function uploadDocument(
    type,
    file,
    metadata = {}
  ) {
    if (!isValidType(type)) {
      throw new Error(
        "Invalid verification type."
      );
    }

    if (!(file instanceof File)) {
      throw new Error(
        "A valid document file is required."
      );
    }

    const formData = new FormData();

    formData.append(
      "document",
      file
    );

    formData.append(
      "type",
      type
    );

    Object.entries(metadata).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null
        ) {
          formData.append(
            key,
            String(value)
          );
        }
      }
    );

    return request(
      `/verification/${encodeURIComponent(
        type
      )}/upload`,
      {
        method: "POST",
        body: formData
      }
    );
  }

  async function verifyOTP(
    type,
    otp
  ) {
    if (!isValidType(type)) {
      throw new Error(
        "Invalid verification type."
      );
    }

    if (!/^\d{4,8}$/.test(
      String(otp || "")
    )) {
      throw new Error(
        "Invalid OTP."
      );
    }

    return request(
      `/verification/${encodeURIComponent(
        type
      )}/otp`,
      {
        method: "POST",
        body: JSON.stringify({
          otp: String(otp)
        })
      }
    );
  }

  async function resendOTP(
    type
  ) {
    if (!isValidType(type)) {
      throw new Error(
        "Invalid verification type."
      );
    }

    return request(
      `/verification/${encodeURIComponent(
        type
      )}/resend`,
      {
        method: "POST"
      }
    );
  }

  // ----------------------------------------------------------
  // VERIFICATION LEVEL CALCULATION
  // ----------------------------------------------------------

  function calculateLevel(
    records = {}
  ) {
    const status = type =>
      normalizeStatus(
        records?.[type]?.status
      );

    if (
      status("ownership") === "VERIFIED"
    ) {
      return "PROPERTY_VERIFIED";
    }

    if (
      status("kyc") === "VERIFIED" ||
      (
        status("pan") === "VERIFIED" &&
        status("aadhaar") === "VERIFIED"
      )
    ) {
      return "DOCUMENT_VERIFIED";
    }

    if (
      status("identity") === "VERIFIED"
    ) {
      return "OWNER_VERIFIED";
    }

    if (
      status("phone") === "VERIFIED" ||
      status("email") === "VERIFIED" ||
      status("address") === "VERIFIED"
    ) {
      return "BASIC_VERIFIED";
    }

    return "UNVERIFIED";
  }

  function getLevelIndex(level) {
    return VERIFICATION_LEVELS.indexOf(
      normalizeLevel(level)
    );
  }

  function hasLevel(
    currentLevel,
    requiredLevel
  ) {
    return (
      getLevelIndex(currentLevel) >=
      getLevelIndex(requiredLevel)
    );
  }

  // ----------------------------------------------------------
  // STATUS SUMMARY
  // ----------------------------------------------------------

  function buildSummary(
    records = {}
  ) {
    const summary = {};

    VERIFICATION_TYPES.forEach(
      type => {
        const item =
          records[type] || {};

        summary[type] = {
          type,
          status:
            normalizeStatus(
              item.status
            ),
          submitted:
            Boolean(
              item.submitted ||
              item.submittedAt
            ),
          verified:
            normalizeStatus(
              item.status
            ) === "VERIFIED",
          submittedAt:
            item.submittedAt ||
            null,
          verifiedAt:
            item.verifiedAt ||
            null,
          expiresAt:
            item.expiresAt ||
            null,
          rejectionReason:
            item.rejectionReason ||
            null
        };
      }
    );

    const level =
      calculateLevel(summary);

    return {
      level,
      levelIndex:
        getLevelIndex(level),
      records: summary
    };
  }

  // ----------------------------------------------------------
  // FORM VALIDATION
  // ----------------------------------------------------------

  function validatePAN(
    pan
  ) {
    return /^[A-Z]{5}[0-9]{4}[A-Z]$/
      .test(
        String(pan || "")
          .trim()
          .toUpperCase()
      );
  }

  function validateAadhaar(
    aadhaar
  ) {
    return /^\d{12}$/.test(
      String(aadhaar || "")
        .replace(/\s/g, "")
    );
  }

  function validatePhone(
    phone
  ) {
    return /^\+?[0-9]{10,15}$/.test(
      String(phone || "")
        .replace(/[\s()-]/g, "")
    );
  }

  function validateEmail(
    email
  ) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(
        String(email || "")
          .trim()
      );
  }

  // ----------------------------------------------------------
  // DOCUMENT REQUIREMENTS
  // ----------------------------------------------------------

  function getRequirements(
    type
  ) {
    const requirements = {
      identity: [
        "Government-issued identity document"
      ],

      phone: [
        "Valid mobile number",
        "OTP verification"
      ],

      email: [
        "Valid email address",
        "Email verification"
      ],

      address: [
        "Valid address",
        "Address proof"
      ],

      kyc: [
        "Identity verification",
        "PAN",
        "Aadhaar or accepted KYC document"
      ],

      pan: [
        "Valid PAN number",
        "PAN document"
      ],

      aadhaar: [
        "Valid Aadhaar number",
        "Aadhaar verification"
      ],

      ownership: [
        "Property ownership document",
        "Property details",
        "Document verification"
      ]
    };

    return (
      requirements[
        String(type).toLowerCase()
      ] || []
    );
  }

  // ----------------------------------------------------------
  // PAGE HELPERS
  // ----------------------------------------------------------

  function getPageType() {
    const path =
      window.location.pathname
        .toLowerCase();

    const match =
      path.match(
        /\/verification\/([^/]+)/
      );

    return match
      ? match[1]
      : "status";
  }

  function setLoading(
    element,
    loading
  ) {
    if (!element) return;

    element.disabled =
      Boolean(loading);

    element.setAttribute(
      "aria-busy",
      loading
        ? "true"
        : "false"
    );
  }

  function showMessage(
    message,
    type = "info"
  ) {
    let container =
      document.querySelector(
        "[data-verification-message]"
      );

    if (!container) {
      container =
        document.createElement("div");

      container.dataset
        .verificationMessage =
        "true";

      container.setAttribute(
        "role",
        "status"
      );

      document.body.prepend(
        container
      );
    }

    container.className =
      `verification-message verification-message-${type}`;

    container.textContent =
      message;
  }

  // ----------------------------------------------------------
  // STATUS RENDERING
  // ----------------------------------------------------------

  function renderStatus(
    data
  ) {
    const payload =
      data?.verification ||
      data?.data ||
      data ||
      {};

    const summary =
      buildSummary(payload);

    saveVerification(
      summary
    );

    document
      .querySelectorAll(
        "[data-verification-level]"
      )
      .forEach(element => {
        element.textContent =
          summary.level;
      });

    document
      .querySelectorAll(
        "[data-verification-status]"
      )
      .forEach(element => {

        const type =
          element.dataset
            .verificationStatus;

        const record =
          summary.records[type];

        element.textContent =
          record
            ? record.status
            : "NOT_STARTED";
      });

    document
      .querySelectorAll(
        "[data-verification-type]"
      )
      .forEach(element => {

        const type =
          element.dataset
            .verificationType;

        const record =
          summary.records[type];

        if (!record) return;

        element.dataset.status =
          record.status;

        element.classList.toggle(
          "is-verified",
          record.verified
        );
      });

    return summary;
  }

  // ----------------------------------------------------------
  // LOAD CURRENT STATUS
  // ----------------------------------------------------------

  async function loadStatus() {
    try {
      const data =
        await getStatus();

      return renderStatus(
        data
      );
    } catch (error) {

      const cached =
        getStoredVerification();

      if (cached) {
        renderStatus(
          cached
        );
      }

      console.error(
        "GHAR verification status error:",
        error
      );

      return cached;
    }
  }

  // ----------------------------------------------------------
  // FORM SUBMISSION
  // ----------------------------------------------------------

  async function handleFormSubmit(
    event
  ) {
    const form =
      event.target;

    if (
      !form.matches(
        "[data-verification-form]"
      )
    ) {
      return;
    }

    event.preventDefault();

    const type =
      form.dataset
        .verificationType ||
      getPageType();

    if (!isValidType(type)) {
      showMessage(
        "Invalid verification type.",
        "error"
      );
      return;
    }

    const submitButton =
      form.querySelector(
        '[type="submit"]'
      );

    setLoading(
      submitButton,
      true
    );

    try {

      const formData =
        new FormData(form);

      const payload = {};

      formData.forEach(
        (value, key) => {

          if (
            value instanceof File
          ) {
            return;
          }

          payload[key] =
            value;
        }
      );

      const data =
        await submit(
          type,
          payload
        );

      renderStatus(
        data
      );

      showMessage(
        "Verification submitted successfully.",
        "success"
      );

      form.dispatchEvent(
        new CustomEvent(
          "ghar:verification-submitted",
          {
            detail: {
              type,
              data
            }
          }
        )
      );

    } catch (error) {

      console.error(
        error
      );

      showMessage(
        error.message ||
          "Unable to submit verification.",
        "error"
      );

    } finally {

      setLoading(
        submitButton,
        false
      );
    }
  }

  // ----------------------------------------------------------
  // FILE UPLOAD
  // ----------------------------------------------------------

  async function handleFileUpload(
    event
  ) {
    const input =
      event.target;

    if (
      !input.matches(
        "[data-verification-upload]"
      )
    ) {
      return;
    }

    const file =
      input.files?.[0];

    if (!file) return;

    const type =
      input.dataset
        .verificationType;

    if (!isValidType(type)) {
      showMessage(
        "Invalid verification type.",
        "error"
      );
      return;
    }

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {
      showMessage(
        "File size must not exceed 10 MB.",
        "error"
      );

      input.value = "";
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      showMessage(
        "Only PDF, JPG, PNG and WEBP files are supported.",
        "error"
      );

      input.value = "";
      return;
    }

    try {

      showMessage(
        "Uploading verification document...",
        "info"
      );

      const data =
        await uploadDocument(
          type,
          file
        );

      renderStatus(
        data
      );

      showMessage(
        "Document uploaded successfully.",
        "success"
      );

    } catch (error) {

      console.error(
        error
      );

      showMessage(
        error.message ||
          "Document upload failed.",
        "error"
      );

    }
  }

  // ----------------------------------------------------------
  // OTP HANDLER
  // ----------------------------------------------------------

  async function handleOTPSubmit(
    event
  ) {
    const form =
      event.target;

    if (
      !form.matches(
        "[data-verification-otp]"
      )
    ) {
      return;
    }

    event.preventDefault();

    const type =
      form.dataset
        .verificationType;

    const input =
      form.querySelector(
        'input[name="otp"]'
      );

    const button =
      form.querySelector(
        '[type="submit"]'
      );

    try {

      setLoading(
        button,
        true
      );

      await verifyOTP(
        type,
        input?.value
      );

      await loadStatus();

      showMessage(
        "Verification completed successfully.",
        "success"
      );

    } catch (error) {

      showMessage(
        error.message ||
          "OTP verification failed.",
        "error"
      );

    } finally {

      setLoading(
        button,
        false
      );
    }
  }

  // ----------------------------------------------------------
  // RESEND OTP
  // ----------------------------------------------------------

  async function handleResendOTP(
    event
  ) {
    const button =
      event.target.closest(
        "[data-resend-otp]"
      );

    if (!button) return;

    event.preventDefault();

    const type =
      button.dataset
        .verificationType;

    try {

      setLoading(
        button,
        true
      );

      await resendOTP(
        type
      );

      showMessage(
        "A new OTP has been sent.",
        "success"
      );

    } catch (error) {

      showMessage(
        error.message ||
          "Unable to resend OTP.",
        "error"
      );

    } finally {

      setLoading(
        button,
        false
      );
    }
  }

  // ----------------------------------------------------------
  // INITIALIZATION
  // ----------------------------------------------------------

  async function init() {
    document.addEventListener(
      "submit",
      handleFormSubmit
    );

    document.addEventListener(
      "submit",
      handleOTPSubmit
    );

    document.addEventListener(
      "change",
      handleFileUpload
    );

    document.addEventListener(
      "click",
      handleResendOTP
    );

    await loadStatus();

    const pageType =
      getPageType();

    document
      .querySelectorAll(
        "[data-verification-requirements]"
      )
      .forEach(element => {

        const type =
          element.dataset
            .verificationRequirements ||
          pageType;

        const requirements =
          getRequirements(type);

        element.innerHTML =
          requirements
            .map(
              item =>
                `<li>${escapeHTML(item)}</li>`
            )
            .join("");
      });

    window.dispatchEvent(
      new CustomEvent(
        "ghar:verification-ready"
      )
    );
  }

  // ----------------------------------------------------------
  // PUBLIC GHAR API
  // ----------------------------------------------------------

  GHAR.verification = {
    getStatus,
    getLevels,
    getVerification,
    submit,
    update,
    uploadDocument,
    verifyOTP,
    resendOTP,

    calculateLevel,
    getLevelIndex,
    hasLevel,

    buildSummary,
    getRequirements,

    validatePAN,
    validateAadhaar,
    validatePhone,
    validateEmail,

    VERIFICATION_LEVELS,
    VERIFICATION_STATUS,
    VERIFICATION_TYPES
  };

  window.GHAR = GHAR;

  // ----------------------------------------------------------
  // START
  // ----------------------------------------------------------

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }

})();