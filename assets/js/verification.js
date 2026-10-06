// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/verification.js
// Identity / Phone / Email / Address / KYC / PAN / Aadhaar
// Ownership / Verification Status
// Production-ready verification frontend module
// ============================================================

"use strict";

(function (window, document) {

  // ============================================================
  // GHAR NAMESPACE
  // ============================================================

  window.GHAR = window.GHAR || {};

  const GHAR = window.GHAR;

  GHAR.verification =
    GHAR.verification || {};

  // ============================================================
  // CONFIGURATION
  // ============================================================

  const CONFIG = Object.freeze({

    API_BASE:
      GHAR.API_BASE ||
      window.GHAR_CONFIG?.API_BASE ||
      "/api",

    STORAGE_KEYS: Object.freeze({
      token: "ghar_token",
      user: "ghar_user",
      verification: "ghar_verification"
    }),

    MAX_FILE_SIZE:
      10 * 1024 * 1024,

    ALLOWED_FILE_TYPES: Object.freeze([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp"
    ]),

    OTP_LENGTH_MIN: 4,
    OTP_LENGTH_MAX: 8,

    OTP_RESEND_COOLDOWN: 30,

    REQUEST_TIMEOUT: 30000
  });

  // ============================================================
  // VERIFICATION LEVELS
  // ============================================================

  const VERIFICATION_LEVELS =
    Object.freeze([
      "UNVERIFIED",
      "BASIC_VERIFIED",
      "OWNER_VERIFIED",
      "DOCUMENT_VERIFIED",
      "PROPERTY_VERIFIED"
    ]);

  // ============================================================
  // VERIFICATION STATUS
  // ============================================================

  const VERIFICATION_STATUS =
    Object.freeze([
      "NOT_STARTED",
      "PENDING",
      "IN_REVIEW",
      "VERIFIED",
      "REJECTED",
      "EXPIRED"
    ]);

  // ============================================================
  // VERIFICATION TYPES
  // ============================================================

  const VERIFICATION_TYPES =
    Object.freeze([
      "identity",
      "phone",
      "email",
      "address",
      "kyc",
      "pan",
      "aadhaar",
      "ownership"
    ]);

  // ============================================================
  // INTERNAL STATE
  // ============================================================

  const STATE = {
    initialized: false,
    loading: false,
    summary: null,
    otpCooldowns: {}
  };

  // ============================================================
  // UTILITY ACCESS
  // ============================================================

  const utils =
    GHAR.utils || {};

  function escapeHTML(value) {

    if (
      typeof utils.escapeHTML ===
      "function"
    ) {
      return utils.escapeHTML(
        value
      );
    }

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getErrorMessage(
    error,
    fallback =
      "Something went wrong."
  ) {

    if (
      typeof utils.getErrorMessage ===
      "function"
    ) {
      return utils.getErrorMessage(
        error,
        fallback
      );
    }

    if (!error) {
      return fallback;
    }

    if (
      typeof error === "string"
    ) {
      return error;
    }

    return (
      error.message ||
      error.error ||
      error.data?.message ||
      fallback
    );
  }

  // ============================================================
  // TYPE HELPERS
  // ============================================================

  function normalizeStatus(status) {

    return String(
      status || "NOT_STARTED"
    )
      .trim()
      .toUpperCase();
  }

  function normalizeLevel(level) {

    return String(
      level || "UNVERIFIED"
    )
      .trim()
      .toUpperCase();
  }

  function normalizeType(type) {

    return String(
      type || ""
    )
      .trim()
      .toLowerCase();
  }

  function isValidType(type) {

    return VERIFICATION_TYPES.includes(
      normalizeType(type)
    );
  }

  function isValidStatus(status) {

    return VERIFICATION_STATUS.includes(
      normalizeStatus(status)
    );
  }

  // ============================================================
  // STORAGE
  // ============================================================

  function getToken() {

    try {

      if (
        typeof utils.storageGet ===
        "function"
      ) {

        const token =
          utils.storageGet(
            CONFIG.STORAGE_KEYS.token,
            ""
          );

        if (token) {
          return token;
        }
      }

      return (
        localStorage.getItem(
          CONFIG.STORAGE_KEYS.token
        ) ||
        sessionStorage.getItem(
          CONFIG.STORAGE_KEYS.token
        ) ||
        ""
      );

    } catch {

      return "";
    }
  }

  function getStoredVerification() {

    try {

      if (
        typeof utils.storageGet ===
        "function"
      ) {

        return utils.storageGet(
          CONFIG.STORAGE_KEYS.verification,
          null
        );
      }

      const value =
        localStorage.getItem(
          CONFIG.STORAGE_KEYS.verification
        );

      return value
        ? JSON.parse(value)
        : null;

    } catch {

      return null;
    }
  }

  function saveVerification(data) {

    /*
     * Only verification status metadata
     * is stored.
     *
     * Never store:
     * - PAN number
     * - Aadhaar number
     * - OTP
     * - uploaded documents
     * - identity documents
     */

    try {

      const safeData =
        sanitizeVerificationData(
          data
        );

      if (
        typeof utils.storageSet ===
        "function"
      ) {

        return utils.storageSet(
          CONFIG.STORAGE_KEYS.verification,
          safeData
        );
      }

      localStorage.setItem(
        CONFIG.STORAGE_KEYS.verification,
        JSON.stringify(
          safeData
        )
      );

      return true;

    } catch {

      return false;
    }
  }

  function sanitizeVerificationData(
    data
  ) {

    if (!data || typeof data !== "object") {
      return null;
    }

    const source =
      data.records ||
      data.verification ||
      data.data ||
      data;

    const records = {};

    VERIFICATION_TYPES.forEach(
      type => {

        const item =
          source?.[type] || {};

        records[type] = {

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
      calculateLevel(records);

    return {
      level,
      levelIndex:
        getLevelIndex(level),
      records
    };
  }

  // ============================================================
  // USER
  // ============================================================

  function getUser() {

    try {

      if (
        typeof utils.storageGet ===
        "function"
      ) {

        return utils.storageGet(
          CONFIG.STORAGE_KEYS.user,
          null
        );
      }

      const value =
        localStorage.getItem(
          CONFIG.STORAGE_KEYS.user
        );

      return value
        ? JSON.parse(value)
        : null;

    } catch {

      return null;
    }
  }

  // ============================================================
  // API REQUEST
  // ============================================================

  async function request(
    endpoint,
    options = {}
  ) {

    const controller =
      new AbortController();

    const timeout =
      window.setTimeout(
        () => {
          controller.abort();
        },
        Number(
          options.timeout ||
          CONFIG.REQUEST_TIMEOUT
        )
      );

    try {

      const headers = {
        Accept:
          "application/json",
        ...(options.headers || {})
      };

      const isFormData =
        options.body instanceof
        FormData;

      if (
        options.body &&
        !isFormData
      ) {

        headers[
          "Content-Type"
        ] =
          "application/json";
      }

      const token =
        getToken();

      if (token) {

        headers.Authorization =
          `Bearer ${token}`;
      }

      const response =
        await fetch(
          `${CONFIG.API_BASE}${endpoint}`,
          {
            ...options,
            headers,
            credentials:
              options.credentials ||
              "include",
            signal:
              options.signal ||
              controller.signal
          }
        );

      let data = null;

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        contentType.includes(
          "application/json"
        )
      ) {

        try {
          data =
            await response.json();
        } catch {
          data = null;
        }

      } else {

        try {

          const text =
            await response.text();

          data =
            text
              ? { message: text }
              : null;

        } catch {
          data = null;
        }
      }

      if (!response.ok) {

        const error =
          new Error(
            data?.error ||
            data?.message ||
            `Verification request failed (${response.status})`
          );

        error.status =
          response.status;

        error.data =
          data;

        if (
          response.status === 401 ||
          response.status === 403
        ) {

          error.code =
            "AUTH_REQUIRED";
        }

        throw error;
      }

      return data;

    } catch (error) {

      if (
        error?.name ===
        "AbortError"
      ) {

        const timeoutError =
          new Error(
            "Verification request timed out."
          );

        timeoutError.code =
          "REQUEST_TIMEOUT";

        throw timeoutError;
      }

      throw error;

    } finally {

      window.clearTimeout(
        timeout
      );
    }
  }

  // ============================================================
  // VERIFICATION API
  // ============================================================

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

    type =
      normalizeType(type);

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

    type =
      normalizeType(type);

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
        body:
          JSON.stringify(
            payload
          )
      }
    );
  }

  async function update(
    type,
    payload = {}
  ) {

    type =
      normalizeType(type);

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
        body:
          JSON.stringify(
            payload
          )
      }
    );
  }

  // ============================================================
  // DOCUMENT UPLOAD
  // ============================================================

  async function uploadDocument(
    type,
    file,
    metadata = {}
  ) {

    type =
      normalizeType(type);

    if (!isValidType(type)) {

      throw new Error(
        "Invalid verification type."
      );
    }

    if (
      !file ||
      !(file instanceof File)
    ) {

      throw new Error(
        "A valid document file is required."
      );
    }

    validateDocumentFile(
      file
    );

    const formData =
      new FormData();

    formData.append(
      "document",
      file,
      file.name
    );

    formData.append(
      "type",
      type
    );

    Object.entries(
      metadata || {}
    ).forEach(
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

  function validateDocumentFile(
    file
  ) {

    if (
      file.size >
      CONFIG.MAX_FILE_SIZE
    ) {

      throw new Error(
        "File size must not exceed 10 MB."
      );
    }

    if (
      !CONFIG.ALLOWED_FILE_TYPES.includes(
        file.type
      )
    ) {

      throw new Error(
        "Only PDF, JPG, PNG and WEBP files are supported."
      );
    }

    return true;
  }

  // ============================================================
  // OTP
  // ============================================================

  function validateOTP(
    otp
  ) {

    return new RegExp(
      `^\\d{${CONFIG.OTP_LENGTH_MIN},${CONFIG.OTP_LENGTH_MAX}}$`
    ).test(
      String(otp || "").trim()
    );
  }

  async function verifyOTP(
    type,
    otp
  ) {

    type =
      normalizeType(type);

    if (!isValidType(type)) {

      throw new Error(
        "Invalid verification type."
      );
    }

    if (!validateOTP(otp)) {

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
        body:
          JSON.stringify({
            otp:
              String(otp).trim()
          })
      }
    );
  }

  async function resendOTP(
    type
  ) {

    type =
      normalizeType(type);

    if (!isValidType(type)) {

      throw new Error(
        "Invalid verification type."
      );
    }

    if (
      isOTPCooldownActive(type)
    ) {

      const remaining =
        getOTPRemainingSeconds(
          type
        );

      throw new Error(
        `Please wait ${remaining} seconds before requesting another OTP.`
      );
    }

    const result =
      await request(
        `/verification/${encodeURIComponent(
          type
        )}/resend`,
        {
          method: "POST"
        }
      );

    startOTPCooldown(
      type
    );

    return result;
  }

  function startOTPCooldown(
    type,
    seconds =
      CONFIG.OTP_RESEND_COOLDOWN
  ) {

    STATE.otpCooldowns[
      normalizeType(type)
    ] =
      Date.now() +
      seconds * 1000;
  }

  function isOTPCooldownActive(
    type
  ) {

    return (
      getOTPRemainingSeconds(
        type
      ) > 0
    );
  }

  function getOTPRemainingSeconds(
    type
  ) {

    const expires =
      STATE.otpCooldowns[
        normalizeType(type)
      ];

    if (!expires) {
      return 0;
    }

    return Math.max(
      0,
      Math.ceil(
        (expires -
          Date.now()) /
          1000
      )
    );
  }

  // ============================================================
  // VERIFICATION LEVEL
  // ============================================================

  function calculateLevel(
    records = {}
  ) {

    function status(type) {

      return normalizeStatus(
        records?.[type]?.status
      );
    }

    if (
      status("ownership") ===
      "VERIFIED"
    ) {

      return "PROPERTY_VERIFIED";
    }

    if (
      status("kyc") ===
        "VERIFIED" ||
      (
        status("pan") ===
          "VERIFIED" &&
        status("aadhaar") ===
          "VERIFIED"
      )
    ) {

      return "DOCUMENT_VERIFIED";
    }

    if (
      status("identity") ===
      "VERIFIED"
    ) {

      return "OWNER_VERIFIED";
    }

    if (
      status("phone") ===
        "VERIFIED" ||
      status("email") ===
        "VERIFIED" ||
      status("address") ===
        "VERIFIED"
    ) {

      return "BASIC_VERIFIED";
    }

    return "UNVERIFIED";
  }

  function getLevelIndex(
    level
  ) {

    return VERIFICATION_LEVELS.indexOf(
      normalizeLevel(level)
    );
  }

  function hasLevel(
    currentLevel,
    requiredLevel
  ) {

    const current =
      getLevelIndex(
        currentLevel
      );

    const required =
      getLevelIndex(
        requiredLevel
      );

    if (
      current === -1 ||
      required === -1
    ) {

      return false;
    }

    return current >= required;
  }

  // ============================================================
  // STATUS SUMMARY
  // ============================================================

  function buildSummary(
    records = {}
  ) {

    const summary = {};

    VERIFICATION_TYPES.forEach(
      type => {

        const item =
          records?.[type] || {};

        const status =
          normalizeStatus(
            item.status
          );

        summary[type] = {

          type,

          status,

          submitted:
            Boolean(
              item.submitted ||
              item.submittedAt
            ),

          verified:
            status ===
            "VERIFIED",

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
      calculateLevel(
        summary
      );

    return {

      level,

      levelIndex:
        getLevelIndex(level),

      records:
        summary
    };
  }

  // ============================================================
  // FORM VALIDATION
  // ============================================================

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
        .replace(
          /[\s()-]/g,
          ""
        )
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

  // ============================================================
  // DOCUMENT REQUIREMENTS
  // ============================================================

  function getRequirements(
    type
  ) {

    type =
      normalizeType(type);

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

    return [
      ...(requirements[type] || [])
    ];
  }

  // ============================================================
  // PAGE HELPERS
  // ============================================================

  function getPageType() {

    const path =
      window.location.pathname
        .toLowerCase();

    const match =
      path.match(
        /\/verification\/([^/]+)/
      );

    if (!match) {
      return "status";
    }

    return normalizeType(
      match[1]
    );
  }

  function setLoading(
    element,
    loading
  ) {

    if (!element) {
      return;
    }

    const state =
      Boolean(loading);

    element.disabled =
      state;

    element.setAttribute(
      "aria-busy",
      state
        ? "true"
        : "false"
    );

    element.classList.toggle(
      "is-loading",
      state
    );
  }

  // ============================================================
  // MESSAGE SYSTEM
  // ============================================================

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
        document.createElement(
          "div"
        );

      container.dataset
        .verificationMessage =
        "true";

      container.setAttribute(
        "role",
        "status"
      );

      container.setAttribute(
        "aria-live",
        "polite"
      );

      document.body.prepend(
        container
      );
    }

    const allowedTypes = [
      "info",
      "success",
      "warning",
      "error"
    ];

    const safeType =
      allowedTypes.includes(
        type
      )
        ? type
        : "info";

    container.className =
      `verification-message verification-message-${safeType}`;

    container.textContent =
      String(message || "");

    return container;
  }

  // ============================================================
  // STATUS RENDERING
  // ============================================================

  function renderStatus(
    data
  ) {

    const payload =
      data?.verification ||
      data?.data ||
      data ||
      {};

    const summary =
      buildSummary(
        payload
      );

    STATE.summary =
      summary;

    saveVerification(
      summary
    );

    // ----------------------------------------
    // Overall level
    // ----------------------------------------

    document
      .querySelectorAll(
        "[data-verification-level]"
      )
      .forEach(
        element => {

          element.textContent =
            summary.level;

          element.dataset.level =
            summary.level;
        }
      );

    // ----------------------------------------
    // Overall status
    // ----------------------------------------

    document
      .querySelectorAll(
        "[data-verification-overall]"
      )
      .forEach(
        element => {

          element.textContent =
            summary.level;
        }
      );

    // ----------------------------------------
    // Individual statuses
    // ----------------------------------------

    document
      .querySelectorAll(
        "[data-verification-status]"
      )
      .forEach(
        element => {

          const type =
            normalizeType(
              element.dataset
                .verificationStatus
            );

          const record =
            summary.records[type];

          element.textContent =
            record
              ? record.status
              : "NOT_STARTED";

          if (record) {

            element.dataset.status =
              record.status;

            element.classList.toggle(
              "is-verified",
              record.verified
            );
          }
        }
      );

    // ----------------------------------------
    // Verification type cards
    // ----------------------------------------

    document
      .querySelectorAll(
        "[data-verification-type]"
      )
      .forEach(
        element => {

          const type =
            normalizeType(
              element.dataset
                .verificationType
            );

          if (
            !isValidType(type)
          ) {
            return;
          }

          const record =
            summary.records[type];

          if (!record) {
            return;
          }

          element.dataset.status =
            record.status;

          element.classList.toggle(
            "is-verified",
            record.verified
          );

          element.classList.toggle(
            "is-pending",
            record.status ===
              "PENDING" ||
            record.status ===
              "IN_REVIEW"
          );

          element.classList.toggle(
            "is-rejected",
            record.status ===
            "REJECTED"
          );

          element.classList.toggle(
            "is-expired",
            record.status ===
            "EXPIRED"
          );
        }
      );

    // ----------------------------------------
    // Level index
    // ----------------------------------------

    document
      .querySelectorAll(
        "[data-verification-level-index]"
      )
      .forEach(
        element => {

          element.textContent =
            String(
              summary.levelIndex
            );
        }
      );

    // ----------------------------------------
    // Requirements
    // ----------------------------------------

    renderRequirements();

    // ----------------------------------------
    // Event
    // ----------------------------------------

    window.dispatchEvent(
      new CustomEvent(
        "ghar:verification-updated",
        {
          detail: summary
        }
      )
    );

    return summary;
  }

  // ============================================================
  // REQUIREMENTS RENDERER
  // ============================================================

  function renderRequirements() {

    document
      .querySelectorAll(
        "[data-verification-requirements]"
      )
      .forEach(
        element => {

          const type =
            normalizeType(
              element.dataset
                .verificationRequirements
            ) ||
            getPageType();

          const requirements =
            getRequirements(
              type
            );

          element.innerHTML =
            requirements
              .map(
                item =>
                  `<li>${escapeHTML(
                    item
                  )}</li>`
              )
              .join("");
        }
      );
  }

  // ============================================================
  // LOAD CURRENT STATUS
  // ============================================================

  async function loadStatus(
    options = {}
  ) {

    if (
      STATE.loading &&
      !options.force
    ) {

      return STATE.summary;
    }

    STATE.loading = true;

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

        STATE.summary =
          cached;

        renderStatus(
          cached
        );
      }

      console.error(
        "GHAR verification status error:",
        error
      );

      if (
        error?.code ===
        "AUTH_REQUIRED"
      ) {

        showMessage(
          "Please sign in to view your verification status.",
          "warning"
        );

      } else if (
        !cached
      ) {

        showMessage(
          getErrorMessage(
            error,
            "Unable to load verification status."
          ),
          "error"
        );
      }

      return cached;

    } finally {

      STATE.loading = false;
    }
  }

  // ============================================================
  // FORM SUBMISSION
  // ============================================================

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
      normalizeType(
        form.dataset
          .verificationType ||
        getPageType()
      );

    if (
      !isValidType(type)
    ) {

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
        new FormData(
          form
        );

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
        "GHAR verification submit error:",
        error
      );

      showMessage(
        getErrorMessage(
          error,
          "Unable to submit verification."
        ),
        "error"
      );

    } finally {

      setLoading(
        submitButton,
        false
      );
    }
  }

  // ============================================================
  // FILE UPLOAD
  // ============================================================

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

    if (!file) {
      return;
    }

    const type =
      normalizeType(
        input.dataset
          .verificationType
      );

    if (
      !isValidType(type)
    ) {

      showMessage(
        "Invalid verification type.",
        "error"
      );

      input.value = "";

      return;
    }

    try {

      validateDocumentFile(
        file
      );

    } catch (error) {

      showMessage(
        getErrorMessage(
          error,
          "Invalid document."
        ),
        "error"
      );

      input.value = "";

      return;
    }

    try {

      setLoading(
        input,
        true
      );

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

      input.dispatchEvent(
        new CustomEvent(
          "ghar:verification-uploaded",
          {
            detail: {
              type,
              fileName:
                file.name,
              data
            }
          }
        )
      );

    } catch (error) {

      console.error(
        "GHAR verification upload error:",
        error
      );

      showMessage(
        getErrorMessage(
          error,
          "Document upload failed."
        ),
        "error"
      );

    } finally {

      setLoading(
        input,
        false
      );
    }
  }

  // ============================================================
  // OTP SUBMISSION
  // ============================================================

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
      normalizeType(
        form.dataset
          .verificationType
      );

    const input =
      form.querySelector(
        'input[name="otp"]'
      );

    const button =
      form.querySelector(
        '[type="submit"]'
      );

    if (
      !isValidType(type)
    ) {

      showMessage(
        "Invalid verification type.",
        "error"
      );

      return;
    }

    if (
      !validateOTP(
        input?.value
      )
    ) {

      showMessage(
        "Please enter a valid OTP.",
        "error"
      );

      input?.focus();

      return;
    }

    try {

      setLoading(
        button,
        true
      );

      await verifyOTP(
        type,
        input.value
      );

      await loadStatus({
        force: true
      });

      showMessage(
        "Verification completed successfully.",
        "success"
      );

      form.dispatchEvent(
        new CustomEvent(
          "ghar:verification-otp-verified",
          {
            detail: {
              type
            }
          }
        )
      );

    } catch (error) {

      console.error(
        "GHAR OTP verification error:",
        error
      );

      showMessage(
        getErrorMessage(
          error,
          "OTP verification failed."
        ),
        "error"
      );

    } finally {

      setLoading(
        button,
        false
      );
    }
  }

  // ============================================================
  // RESEND OTP
  // ============================================================

  async function handleResendOTP(
    event
  ) {

    const button =
      event.target.closest(
        "[data-resend-otp]"
      );

    if (!button) {
      return;
    }

    event.preventDefault();

    const type =
      normalizeType(
        button.dataset
          .verificationType
      );

    if (
      !isValidType(type)
    ) {

      showMessage(
        "Invalid verification type.",
        "error"
      );

      return;
    }

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

      startResendCountdown(
        button,
        type
      );

    } catch (error) {

      showMessage(
        getErrorMessage(
          error,
          "Unable to resend OTP."
        ),
        "error"
      );

    } finally {

      if (
        !isOTPCooldownActive(
          type
        )
      ) {

        setLoading(
          button,
          false
        );
      }
    }
  }

  // ============================================================
  // OTP COUNTDOWN UI
  // ============================================================

  function startResendCountdown(
    button,
    type
  ) {

    if (!button) {
      return;
    }

    const originalText =
      button.dataset
        .originalResendText ||
      button.textContent ||
      "Resend OTP";

    button.dataset
      .originalResendText =
      originalText;

    button.disabled = true;

    const update =
      () => {

        const remaining =
          getOTPRemainingSeconds(
            type
          );

        if (remaining <= 0) {

          button.disabled =
            false;

          button.textContent =
            originalText;

          return;
        }

        button.disabled =
          true;

        button.textContent =
          `Resend OTP (${remaining}s)`;

        window.setTimeout(
          update,
          1000
        );
      };

    update();
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async function init() {

    if (STATE.initialized) {
      return;
    }

    STATE.initialized =
      true;

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

    renderRequirements();

    await loadStatus();

    window.dispatchEvent(
      new CustomEvent(
        "ghar:verification-ready",
        {
          detail: {
            summary:
              STATE.summary
          }
        }
      )
    );
  }

  // ============================================================
  // PUBLIC GHAR API
  // ============================================================

  Object.assign(
    GHAR.verification,
    {

      // API
      getStatus,
      getLevels,
      getVerification,
      submit,
      update,
      uploadDocument,
      verifyOTP,
      resendOTP,

      // Status
      loadStatus,
      renderStatus,
      buildSummary,

      // Levels
      calculateLevel,
      getLevelIndex,
      hasLevel,

      // Requirements
      getRequirements,

      // Validation
      validatePAN,
      validateAadhaar,
      validatePhone,
      validateEmail,
      validateOTP,
      validateDocumentFile,

      // Utilities
      getPageType,
      showMessage,

      // Constants
      VERIFICATION_LEVELS,
      VERIFICATION_STATUS,
      VERIFICATION_TYPES,

      // Config
      CONFIG
    }
  );

  // ============================================================
  // DOM READY
  // ============================================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );

  } else {

    init();
  }

})(window, document);