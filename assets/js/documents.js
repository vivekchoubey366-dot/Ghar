// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/documents.js
// Document Upload / Verification / Vault / Scanner Management
// ============================================================

"use strict";

(function (window) {

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const API_BASE =
    window.GHAR_CONFIG?.API_BASE_URL ||
    "/api";

  const DOCUMENTS_ENDPOINT =
    `${API_BASE}/documents`;

  // ==========================================================
  // DOCUMENT TYPES
  // ==========================================================

  const TYPES = Object.freeze({

    IDENTITY:
      "IDENTITY",

    PAN:
      "PAN",

    AADHAAR:
      "AADHAAR",

    PASSPORT:
      "PASSPORT",

    DRIVING_LICENSE:
      "DRIVING_LICENSE",

    ADDRESS_PROOF:
      "ADDRESS_PROOF",

    OWNERSHIP:
      "OWNERSHIP",

    SALE_DEED:
      "SALE_DEED",

    AGREEMENT:
      "AGREEMENT",

    RENTAL_AGREEMENT:
      "RENTAL_AGREEMENT",

    PROPERTY_TAX:
      "PROPERTY_TAX",

    ENCUMBRANCE_CERTIFICATE:
      "ENCUMBRANCE_CERTIFICATE",

    FLOOR_PLAN:
      "FLOOR_PLAN",

    BANK_STATEMENT:
      "BANK_STATEMENT",

    INCOME_PROOF:
      "INCOME_PROOF",

    LOAN_DOCUMENT:
      "LOAN_DOCUMENT",

    OTHER:
      "OTHER"

  });

  // ==========================================================
  // DOCUMENT STATUS
  // ==========================================================

  const STATUS = Object.freeze({

    UPLOADING:
      "UPLOADING",

    UPLOADED:
      "UPLOADED",

    PROCESSING:
      "PROCESSING",

    PENDING_VERIFICATION:
      "PENDING_VERIFICATION",

    VERIFIED:
      "VERIFIED",

    REJECTED:
      "REJECTED",

    EXPIRED:
      "EXPIRED",

    REPLACEMENT_REQUIRED:
      "REPLACEMENT_REQUIRED"

  });

  // ==========================================================
  // VERIFICATION STATUS
  // ==========================================================

  const VERIFICATION = Object.freeze({

    UNVERIFIED:
      "UNVERIFIED",

    PENDING:
      "PENDING",

    VERIFIED:
      "VERIFIED",

    FAILED:
      "FAILED",

    MANUAL_REVIEW:
      "MANUAL_REVIEW"

  });

  // ==========================================================
  // CONFIGURATION LIMITS
  // ==========================================================

  const CONFIG = Object.freeze({

    MAX_FILE_SIZE:
      25 * 1024 * 1024,

    ALLOWED_TYPES: [

      "application/pdf",

      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",

      "application/msword",

      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    ]

  });

  // ==========================================================
  // TOKEN
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

    const headers = {};

    const token =
      getToken();

    if (token) {

      headers.Authorization =
        `Bearer ${token}`;

    }

    return headers;

  }

  // ==========================================================
  // JSON REQUEST
  // ==========================================================

  async function request(
    url,
    options = {}
  ) {

    const response =
      await fetch(
        url,
        {
          credentials:
            "include",

          ...options,

          headers: {
            ...authHeaders(),

            ...(options.headers || {})
          }
        }
      );

    let data = null;

    try {

      data =
        await response.json();

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
  // QUERY BUILDER
  // ==========================================================

  function buildQuery(
    params = {}
  ) {

    const query =
      new URLSearchParams();

    Object.entries(params)
      .forEach(
        ([key, value]) => {

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

        }
      );

    const queryString =
      query.toString();

    return queryString
      ? `?${queryString}`
      : "";

  }

  // ==========================================================
  // GET DOCUMENTS
  // ==========================================================

  async function getDocuments(
    params = {}
  ) {

    return request(
      `${DOCUMENTS_ENDPOINT}${buildQuery(params)}`
    );

  }

  // ==========================================================
  // GET MY DOCUMENTS
  // ==========================================================

  async function getMyDocuments() {

    return getDocuments({
      mine: true
    });

  }

  // ==========================================================
  // GET DOCUMENT
  // ==========================================================

  async function getDocument(
    documentId
  ) {

    if (!documentId) {

      throw new Error(
        "Document ID is required."
      );

    }

    return request(
      `${DOCUMENTS_ENDPOINT}/${encodeURIComponent(documentId)}`
    );

  }

  // ==========================================================
  // GET DOCUMENT STATUS
  // ==========================================================

  async function getDocumentStatus(
    documentId
  ) {

    if (!documentId) {

      throw new Error(
        "Document ID is required."
      );

    }

    return request(
      `${DOCUMENTS_ENDPOINT}/${encodeURIComponent(documentId)}/status`
    );

  }

  // ==========================================================
  // GET DOCUMENT DETAILS
  // ==========================================================

  async function getDocumentDetails(
    documentId
  ) {

    if (!documentId) {

      throw new Error(
        "Document ID is required."
      );

    }

    return request(
      `${DOCUMENTS_ENDPOINT}/${encodeURIComponent(documentId)}/details`
    );

  }

  // ==========================================================
  // UPLOAD DOCUMENT
  // ==========================================================

  async function uploadDocument(
    file,
    metadata = {},
    onProgress = null
  ) {

    if (!(file instanceof File)) {

      throw new Error(
        "A valid document file is required."
      );

    }

    const validation =
      validateFile(file);

    if (!validation.valid) {

      throw new Error(
        validation.errors.join(" ")
      );

    }

    const formData =
      new FormData();

    formData.append(
      "document",
      file
    );

    Object.entries(metadata)
      .forEach(
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

    // --------------------------------------------------------
    // XMLHttpRequest allows upload progress.
    // --------------------------------------------------------

    return new Promise(
      (resolve, reject) => {

        const xhr =
          new XMLHttpRequest();

        xhr.open(
          "POST",
          DOCUMENTS_ENDPOINT
        );

        xhr.withCredentials =
          true;

        const token =
          getToken();

        if (token) {

          xhr.setRequestHeader(
            "Authorization",
            `Bearer ${token}`
          );

        }

        xhr.upload.onprogress =
          event => {

            if (
              typeof onProgress !==
              "function"
            ) {
              return;
            }

            if (!event.lengthComputable) {

              onProgress({
                loaded:
                  event.loaded,

                total:
                  event.total,

                percentage:
                  null
              });

              return;

            }

            const percentage =
              Math.round(
                (
                  event.loaded /
                  event.total
                ) * 100
              );

            onProgress({

              loaded:
                event.loaded,

              total:
                event.total,

              percentage

            });

          };

        xhr.onload =
          () => {

            let data = null;

            try {

              data =
                JSON.parse(
                  xhr.responseText
                );

            } catch {

              data = null;

            }

            if (
              xhr.status >= 200 &&
              xhr.status < 300
            ) {

              resolve(data);

              return;

            }

            const error =
              new Error(
                data?.error ||
                data?.message ||
                `Upload failed: ${xhr.status}`
              );

            error.status =
              xhr.status;

            error.data =
              data;

            reject(error);

          };

        xhr.onerror =
          () => {

            reject(
              new Error(
                "Document upload failed."
              )
            );

          };

        xhr.onabort =
          () => {

            reject(
              new Error(
                "Document upload was cancelled."
              )
            );

          };

        xhr.send(
          formData
        );

      }
    );

  }

  // ==========================================================
  // UPDATE DOCUMENT
  // ==========================================================

  async function updateDocument(
    documentId,
    data = {}
  ) {

    if (!documentId) {

      throw new Error(
        "Document ID is required."
      );

    }

    return request(
      `${DOCUMENTS_ENDPOINT}/${encodeURIComponent(documentId)}`,
      {
        method:
          "PUT",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(data)
      }
    );

  }

  // ==========================================================
  // DELETE DOCUMENT
  // ==========================================================

  async function deleteDocument(
    documentId
  ) {

    if (!documentId) {

      throw new Error(
        "Document ID is required."
      );

    }

    return request(
      `${DOCUMENTS_ENDPOINT}/${encodeURIComponent(documentId)}`,
      {
        method:
          "DELETE"
      }
    );

  }

  // ==========================================================
  // REPLACE DOCUMENT
  // ==========================================================

  async function replaceDocument(
    documentId,
    file,
    metadata = {},
    onProgress = null
  ) {

    if (!documentId) {

      throw new Error(
        "Document ID is required."
      );

    }

    if (!(file instanceof File)) {

      throw new Error(
        "A valid replacement file is required."
      );

    }

    const validation =
      validateFile(file);

    if (!validation.valid) {

      throw new Error(
        validation.errors.join(" ")
      );

    }

    const formData =
      new FormData();

    formData.append(
      "document",
      file
    );

    Object.entries(metadata)
      .forEach(
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

    return new Promise(
      (resolve, reject) => {

        const xhr =
          new XMLHttpRequest();

        xhr.open(
          "POST",
          `${DOCUMENTS_ENDPOINT}/${encodeURIComponent(documentId)}/replace`
        );

        xhr.withCredentials =
          true;

        const token =
          getToken();

        if (token) {

          xhr.setRequestHeader(
            "Authorization",
            `Bearer ${token}`
          );

        }

        xhr.upload.onprogress =
          event => {

            if (
              typeof onProgress !==
              "function"
            ) {
              return;
            }

            if (
              !event.lengthComputable
            ) {
              onProgress({
                loaded:
                  event.loaded,

                total:
                  event.total,

                percentage:
                  null
              });

              return;
            }

            onProgress({

              loaded:
                event.loaded,

              total:
                event.total,

              percentage:
                Math.round(
                  (
                    event.loaded /
                    event.total
                  ) * 100
                )

            });

          };

        xhr.onload =
          () => {

            let data = null;

            try {

              data =
                JSON.parse(
                  xhr.responseText
                );

            } catch {

              data = null;

            }

            if (
              xhr.status >= 200 &&
              xhr.status < 300
            ) {

              resolve(data);

              return;

            }

            reject(
              new Error(
                data?.error ||
                data?.message ||
                `Replacement failed: ${xhr.status}`
              )
            );

          };

        xhr.onerror =
          () => {

            reject(
              new Error(
                "Document replacement failed."
              )
            );

          };

        xhr.send(
          formData
        );

      }
    );

  }

  // ==========================================================
  // VERIFY DOCUMENT
  // ==========================================================

  async function verifyDocument(
    documentId
  ) {

    if (!documentId) {

      throw new Error(
        "Document ID is required."
      );

    }

    return request(
      `${DOCUMENTS_ENDPOINT}/${encodeURIComponent(documentId)}/verify`,
      {
        method:
          "POST"
      }
    );

  }

  // ==========================================================
  // REQUEST MANUAL VERIFICATION
  // ==========================================================

  async function requestManualVerification(
    documentId,
    reason = ""
  ) {

    if (!documentId) {

      throw new Error(
        "Document ID is required."
      );

    }

    return request(
      `${DOCUMENTS_ENDPOINT}/${encodeURIComponent(documentId)}/manual-verification`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            reason
          })
      }
    );

  }

  // ==========================================================
  // DOCUMENT VERIFICATION HISTORY
  // ==========================================================

  async function getVerificationHistory(
    documentId
  ) {

    if (!documentId) {

      throw new Error(
        "Document ID is required."
      );

    }

    return request(
      `${DOCUMENTS_ENDPOINT}/${encodeURIComponent(documentId)}/verification-history`
    );

  }

  // ==========================================================
  // DOCUMENT VAULT
  // ==========================================================

  async function getVault(
    params = {}
  ) {

    return request(
      `${DOCUMENTS_ENDPOINT}/vault${buildQuery(params)}`
    );

  }

  // ==========================================================
  // DOCUMENT SEARCH
  // ==========================================================

  async function searchDocuments(
    query,
    params = {}
  ) {

    return request(
      `${DOCUMENTS_ENDPOINT}/search${buildQuery({
        q: query,
        ...params
      })}`
    );

  }

  // ==========================================================
  // APPLICATION DOCUMENTS
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
      `${DOCUMENTS_ENDPOINT}/application/${encodeURIComponent(applicationId)}`
    );

  }

  // ==========================================================
  // PROPERTY DOCUMENTS
  // ==========================================================

  async function getPropertyDocuments(
    propertyId
  ) {

    if (!propertyId) {

      throw new Error(
        "Property ID is required."
      );

    }

    return getDocuments({
      propertyId
    });

  }

  // ==========================================================
  // USER DOCUMENTS
  // ==========================================================

  async function getUserDocuments(
    userId
  ) {

    if (!userId) {

      throw new Error(
        "User ID is required."
      );

    }

    return getDocuments({
      userId
    });

  }

  // ==========================================================
  // DOCUMENT SCANNER
  // ==========================================================

  async function scanDocument(
    file,
    options = {}
  ) {

    if (!(file instanceof File)) {

      throw new Error(
        "A valid file is required for scanning."
      );

    }

    const validation =
      validateFile(file);

    if (!validation.valid) {

      throw new Error(
        validation.errors.join(" ")
      );

    }

    const formData =
      new FormData();

    formData.append(
      "document",
      file
    );

    Object.entries(options)
      .forEach(
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
      `${DOCUMENTS_ENDPOINT}/scan`,
      {
        method:
          "POST",

        body:
          formData,

        headers:
          authHeaders()
      }
    );

  }

  // ==========================================================
  // AI DOCUMENT ANALYSIS
  // ==========================================================

  async function analyzeDocument(
    documentId,
    options = {}
  ) {

    if (!documentId) {

      throw new Error(
        "Document ID is required."
      );

    }

    return request(
      `${API_BASE}/ai/documents/analyze`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            documentId,
            ...options
          })
      }
    );

  }

  // ==========================================================
  // AI DOCUMENT ASSISTANCE
  // ==========================================================

  async function documentAssistant(
    documentId,
    question
  ) {

    if (!documentId) {

      throw new Error(
        "Document ID is required."
      );

    }

    if (!question) {

      throw new Error(
        "A document question is required."
      );

    }

    return request(
      `${API_BASE}/ai/documents/assistant`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            documentId,
            question
          })
      }
    );

  }

  // ==========================================================
  // GET DOCUMENT DOWNLOAD URL
  // ==========================================================

  function getDownloadUrl(
    documentId
  ) {

    if (!documentId) {

      throw new Error(
        "Document ID is required."
      );

    }

    return `${DOCUMENTS_ENDPOINT}/${encodeURIComponent(documentId)}/download`;

  }

  // ==========================================================
  // VALIDATE FILE
  // ==========================================================

  function validateFile(
    file
  ) {

    const errors = [];

    if (!(file instanceof File)) {

      errors.push(
        "Invalid file."
      );

      return {
        valid: false,
        errors
      };

    }

    if (
      file.size >
      CONFIG.MAX_FILE_SIZE
    ) {

      errors.push(
        "File size cannot exceed 25 MB."
      );

    }

    if (
      !CONFIG.ALLOWED_TYPES
        .includes(file.type)
    ) {

      errors.push(
        "Unsupported document format."
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
      .replace(
        /_/g,
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
      return "Document";
    }

    return String(type)
      .replace(
        /_/g,
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
  // RENDER DOCUMENT CARD
  // ==========================================================

  function renderDocumentCard(
    document,
    container
  ) {

    if (
      !document ||
      !container
    ) {
      return;
    }

    const id =
      document.id ||
      document.documentId ||
      "";

    const name =
      document.name ||
      document.fileName ||
      "Document";

    const type =
      document.type ||
      TYPES.OTHER;

    const status =
      document.status ||
      STATUS.UPLOADED;

    const card =
      document.createElement
        ? null
        : null;

    const element =
      window.document.createElement(
        "article"
      );

    element.className =
      "ghar-document-card";

    element.dataset.documentId =
      id;

    element.innerHTML = `

      <div class="ghar-document-card__body">

        <div class="ghar-document-card__header">

          <h3 class="ghar-document-card__title">
            ${escapeHtml(name)}
          </h3>

          <span
            class="ghar-document-status ghar-document-status--${escapeHtml(
              getStatusClass(status)
            )}"
          >
            ${escapeHtml(
              getStatusLabel(status)
            )}
          </span>

        </div>

        <div class="ghar-document-card__meta">

          <span>
            ${escapeHtml(
              getTypeLabel(type)
            )}
          </span>

          ${
            document.size
              ? `
                <span>
                  ${escapeHtml(
                    formatFileSize(
                      document.size
                    )
                  )}
                </span>
              `
              : ""
          }

        </div>

      </div>

    `;

    container.appendChild(
      element
    );

    return element;

  }

  // ==========================================================
  // RENDER DOCUMENTS
  // ==========================================================

  function renderDocuments(
    documents,
    container
  ) {

    if (!container) {
      return;
    }

    container.innerHTML =
      "";

    const list =
      Array.isArray(documents)
        ? documents
        : (
          documents?.documents ||
          documents?.data ||
          []
        );

    if (!list.length) {

      container.innerHTML = `

        <div class="ghar-empty-state">

          <h3>
            No documents found
          </h3>

          <p>
            Uploaded and verified documents
            will appear here.
          </p>

        </div>

      `;

      return;

    }

    list.forEach(
      document =>
        renderDocumentCard(
          document,
          container
        )
    );

  }

  // ==========================================================
  // FILE SIZE FORMATTER
  // ==========================================================

  function formatFileSize(
    bytes
  ) {

    const value =
      Number(bytes);

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      return "0 B";
    }

    if (
      value < 1024
    ) {
      return `${value} B`;
    }

    if (
      value < 1024 * 1024
    ) {
      return `${(
        value / 1024
      ).toFixed(1)} KB`;
    }

    if (
      value < 1024 * 1024 * 1024
    ) {
      return `${(
        value /
        (1024 * 1024)
      ).toFixed(1)} MB`;
    }

    return `${(
      value /
      (1024 * 1024 * 1024)
    ).toFixed(1)} GB`;

  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  const Documents = {

    TYPES,

    STATUS,

    VERIFICATION,

    CONFIG,

    getDocuments,
    getMyDocuments,
    getDocument,
    getDocumentStatus,
    getDocumentDetails,

    uploadDocument,
    updateDocument,
    deleteDocument,
    replaceDocument,

    verifyDocument,
    requestManualVerification,
    getVerificationHistory,

    getVault,
    searchDocuments,

    getApplicationDocuments,
    getPropertyDocuments,
    getUserDocuments,

    scanDocument,

    analyzeDocument,
    documentAssistant,

    getDownloadUrl,

    validateFile,

    getStatusLabel,
    getTypeLabel,
    getStatusClass,

    renderDocumentCard,
    renderDocuments,

    formatFileSize

  };

  // ==========================================================
  // GLOBAL GHAR OBJECT
  // ==========================================================

  window.GHAR =
    window.GHAR || {};

  window.GHAR.Documents =
    Documents;

  window.GHAR_DOCUMENTS =
    Documents;

})(window);