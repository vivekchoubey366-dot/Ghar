// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/Loans.js
// Loan Management • Eligibility • Calculator • Applications
// ============================================================

"use strict";

(() => {
  const GHAR = (window.GHAR = window.GHAR || {});

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const CONFIG = {
    apiBase:
      (GHAR.config &&
        (GHAR.config.API_BASE_URL ||
          GHAR.config.apiBaseUrl)) ||
      "/api",

    endpoint: "/loans",

    storageKey: "ghar_loan_data",

    defaultCurrency: "INR",

    statuses: {
      DRAFT: "DRAFT",
      SUBMITTED: "SUBMITTED",
      UNDER_REVIEW: "UNDER_REVIEW",
      DOCUMENTS_REQUIRED: "DOCUMENTS_REQUIRED",
      APPROVED: "APPROVED",
      REJECTED: "REJECTED",
      DISBURSED: "DISBURSED",
      CLOSED: "CLOSED",
      CANCELLED: "CANCELLED"
    },

    applicationTypes: {
      HOME_LOAN: "HOME_LOAN",
      PROPERTY_LOAN: "PROPERTY_LOAN",
      CONSTRUCTION_LOAN: "CONSTRUCTION_LOAN",
      LAND_LOAN: "LAND_LOAN",
      HOME_IMPROVEMENT: "HOME_IMPROVEMENT"
    }
  };

  // ==========================================================
  // STATE
  // ==========================================================

  const state = {
    loans: [],

    applications: [],

    eligibility: null,

    calculator: {
      principal: 0,
      annualRate: 0,
      tenureYears: 0,
      monthlyEMI: 0,
      totalInterest: 0,
      totalPayment: 0
    },

    summary: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      disbursed: 0
    },

    loading: false,
    initialized: false,
    error: null
  };

  // ==========================================================
  // AUTH
  // ==========================================================

  function getToken() {
    try {
      return (
        localStorage.getItem(
          "ghar_access_token"
        ) ||
        localStorage.getItem(
          "accessToken"
        ) ||
        localStorage.getItem(
          "token"
        ) ||
        ""
      );
    } catch {
      return "";
    }
  }

  // ==========================================================
  // API HELPERS
  // ==========================================================

  function buildUrl(path = "") {
    return `${CONFIG.apiBase}${CONFIG.endpoint}${path}`;
  }

  function createHeaders(extra = {}) {
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...extra
    };

    const token = getToken();

    if (token) {
      headers.Authorization =
        `Bearer ${token}`;
    }

    return headers;
  }

  async function request(
    path = "",
    options = {}
  ) {
    const response = await fetch(
      buildUrl(path),
      {
        credentials: "include",
        ...options,

        headers: createHeaders(
          options.headers || {}
        )
      }
    );

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const error = new Error(
        data.error ||
        data.message ||
        `Loan request failed (${response.status})`
      );

      error.status =
        response.status;

      error.data = data;

      throw error;
    }

    return data;
  }

  // ==========================================================
  // LOCAL STORAGE
  // ==========================================================

  function saveLocal() {
    try {
      localStorage.setItem(
        CONFIG.storageKey,
        JSON.stringify({
          loans: state.loans,
          applications:
            state.applications,
          eligibility:
            state.eligibility,
          calculator:
            state.calculator,
          summary:
            state.summary
        })
      );
    } catch {
      // Storage is optional.
    }
  }

  function loadLocal() {
    try {
      const raw =
        localStorage.getItem(
          CONFIG.storageKey
        );

      if (!raw) {
        return false;
      }

      const data =
        JSON.parse(raw);

      if (
        Array.isArray(
          data.loans
        )
      ) {
        state.loans =
          data.loans;
      }

      if (
        Array.isArray(
          data.applications
        )
      ) {
        state.applications =
          data.applications;
      }

      if (data.eligibility) {
        state.eligibility =
          data.eligibility;
      }

      if (data.calculator) {
        state.calculator = {
          ...state.calculator,
          ...data.calculator
        };
      }

      if (data.summary) {
        state.summary = {
          ...state.summary,
          ...data.summary
        };
      }

      return true;
    } catch {
      return false;
    }
  }

  // ==========================================================
  // NORMALIZATION
  // ==========================================================

  function normalizeLoan(
    item = {}
  ) {
    return {
      id:
        item.id ||
        item.loan_id ||
        item.loanId ||
        null,

      applicationNumber:
        item.applicationNumber ||
        item.application_number ||
        "",

      type:
        item.type ||
        item.loan_type ||
        CONFIG.applicationTypes.HOME_LOAN,

      lender:
        item.lender ||
        item.lender_name ||
        "",

      amount:
        Number(
          item.amount ||
          item.loan_amount ||
          0
        ),

      approvedAmount:
        Number(
          item.approvedAmount ||
          item.approved_amount ||
          0
        ),

      interestRate:
        Number(
          item.interestRate ||
          item.interest_rate ||
          0
        ),

      tenureYears:
        Number(
          item.tenureYears ||
          item.tenure_years ||
          0
        ),

      emi:
        Number(
          item.emi ||
          item.monthly_emi ||
          0
        ),

      status:
        item.status ||
        CONFIG.statuses.DRAFT,

      propertyId:
        item.propertyId ||
        item.property_id ||
        null,

      createdAt:
        item.createdAt ||
        item.created_at ||
        null,

      updatedAt:
        item.updatedAt ||
        item.updated_at ||
        null
    };
  }

  // ==========================================================
  // LOAD LOANS
  // ==========================================================

  async function loadLoans(
    options = {}
  ) {
    state.loading = true;
    state.error = null;

    try {
      const query =
        new URLSearchParams();

      if (options.status) {
        query.set(
          "status",
          options.status
        );
      }

      if (options.page) {
        query.set(
          "page",
          options.page
        );
      }

      if (options.limit) {
        query.set(
          "limit",
          options.limit
        );
      }

      const suffix =
        query.toString()
          ? `?${query.toString()}`
          : "";

      const data =
        await request(suffix);

      const items =
        data.loans ||
        data.items ||
        data.data ||
        [];

      state.loans =
        Array.isArray(items)
          ? items.map(
              normalizeLoan
            )
          : [];

      calculateSummary();
      saveLocal();
      render();

      return state.loans;
    } catch (error) {
      state.error = error;

      console.error(
        "GHAR loans load error:",
        error
      );

      loadLocal();
      calculateSummary();
      render();

      return state.loans;
    } finally {
      state.loading = false;
    }
  }

  // ==========================================================
  // ELIGIBILITY
  // ==========================================================

  async function checkEligibility(
    eligibilityData = {}
  ) {
    const payload = {
      monthlyIncome:
        Number(
          eligibilityData.monthlyIncome ||
          eligibilityData.monthly_income ||
          0
        ),

      monthlyObligations:
        Number(
          eligibilityData.monthlyObligations ||
          eligibilityData.monthly_obligations ||
          0
        ),

      employmentType:
        eligibilityData.employmentType ||
        eligibilityData.employment_type ||
        "",

      employmentYears:
        Number(
          eligibilityData.employmentYears ||
          eligibilityData.employment_years ||
          0
        ),

      creditScore:
        Number(
          eligibilityData.creditScore ||
          eligibilityData.credit_score ||
          0
        ),

      requestedAmount:
        Number(
          eligibilityData.requestedAmount ||
          eligibilityData.requested_amount ||
          0
        ),

      tenureYears:
        Number(
          eligibilityData.tenureYears ||
          eligibilityData.tenure_years ||
          0
        ),

      propertyValue:
        Number(
          eligibilityData.propertyValue ||
          eligibilityData.property_value ||
          0
        )
    };

    try {
      const data =
        await request(
          "/eligibility",
          {
            method: "POST",
            body: JSON.stringify(
              payload
            )
          }
        );

      state.eligibility =
        data.eligibility ||
        data.data ||
        data;

      saveLocal();
      renderEligibility();

      return state.eligibility;
    } catch (error) {
      console.error(
        "GHAR loan eligibility error:",
        error
      );

      // Local preliminary calculation.
      const income =
        payload.monthlyIncome;

      const obligations =
        payload.monthlyObligations;

      const availableIncome =
        Math.max(
          0,
          income - obligations
        );

      const estimatedEMI =
        availableIncome * 0.5;

      const estimatedLoan =
        estimateLoanFromEMI(
          estimatedEMI,
          8.5,
          payload.tenureYears ||
            20
        );

      state.eligibility = {
        eligible:
          estimatedEMI > 0,

        estimatedMonthlyEMI:
          estimatedEMI,

        estimatedLoanAmount:
          estimatedLoan,

        source:
          "preliminary"
      };

      saveLocal();
      renderEligibility();

      return state.eligibility;
    }
  }

  // ==========================================================
  // EMI CALCULATOR
  // ==========================================================

  function calculateEMI(
    principal,
    annualRate,
    tenureYears
  ) {
    principal =
      Number(principal) || 0;

    annualRate =
      Number(annualRate) || 0;

    tenureYears =
      Number(tenureYears) || 0;

    const months =
      Math.max(
        0,
        Math.round(
          tenureYears * 12
        )
      );

    if (
      principal <= 0 ||
      months <= 0
    ) {
      state.calculator = {
        principal,
        annualRate,
        tenureYears,
        monthlyEMI: 0,
        totalInterest: 0,
        totalPayment: 0
      };

      renderCalculator();

      return state.calculator;
    }

    let emi;

    if (annualRate === 0) {
      emi =
        principal / months;
    } else {
      const monthlyRate =
        annualRate /
        12 /
        100;

      const factor =
        Math.pow(
          1 + monthlyRate,
          months
        );

      emi =
        principal *
        monthlyRate *
        factor /
        (factor - 1);
    }

    const totalPayment =
      emi * months;

    const totalInterest =
      totalPayment -
      principal;

    state.calculator = {
      principal,
      annualRate,
      tenureYears,

      monthlyEMI:
        Math.round(emi),

      totalInterest:
        Math.round(
          Math.max(
            0,
            totalInterest
          )
        ),

      totalPayment:
        Math.round(
          totalPayment
        )
    };

    renderCalculator();

    return state.calculator;
  }

  function estimateLoanFromEMI(
    emi,
    annualRate,
    tenureYears
  ) {
    emi =
      Number(emi) || 0;

    annualRate =
      Number(annualRate) || 0;

    tenureYears =
      Number(tenureYears) || 0;

    const months =
      tenureYears * 12;

    if (
      emi <= 0 ||
      months <= 0
    ) {
      return 0;
    }

    if (annualRate === 0) {
      return emi * months;
    }

    const monthlyRate =
      annualRate /
      12 /
      100;

    return (
      emi *
      (
        Math.pow(
          1 + monthlyRate,
          months
        ) - 1
      ) /
      (
        monthlyRate *
        Math.pow(
          1 + monthlyRate,
          months
        )
      )
    );
  }

  // ==========================================================
  // CREATE LOAN APPLICATION
  // ==========================================================

  async function createApplication(
    applicationData = {}
  ) {
    const payload = {
      loanType:
        applicationData.loanType ||
        applicationData.loan_type ||
        CONFIG.applicationTypes.HOME_LOAN,

      requestedAmount:
        Number(
          applicationData.requestedAmount ||
          applicationData.requested_amount ||
          0
        ),

      tenureYears:
        Number(
          applicationData.tenureYears ||
          applicationData.tenure_years ||
          0
        ),

      propertyId:
        applicationData.propertyId ||
        applicationData.property_id ||
        null,

      monthlyIncome:
        Number(
          applicationData.monthlyIncome ||
          applicationData.monthly_income ||
          0
        ),

      employmentType:
        applicationData.employmentType ||
        applicationData.employment_type ||
        "",

      purpose:
        applicationData.purpose ||
        ""
    };

    const data =
      await request(
        "/applications",
        {
          method: "POST",
          body: JSON.stringify(
            payload
          )
        }
      );

    const application =
      normalizeLoan(
        data.application ||
        data.loan ||
        data.data ||
        data
      );

    if (
      application.id
    ) {
      state.applications.unshift(
        application
      );
    }

    calculateSummary();
    saveLocal();
    render();

    return application;
  }

  // ==========================================================
  // GET APPLICATION
  // ==========================================================

  async function getApplication(
    id
  ) {
    if (!id) {
      throw new Error(
        "Loan application ID is required."
      );
    }

    const data =
      await request(
        `/applications/${encodeURIComponent(
          id
        )}`
      );

    return normalizeLoan(
      data.application ||
      data.loan ||
      data.data ||
      data
    );
  }

  // ==========================================================
  // UPDATE APPLICATION
  // ==========================================================

  async function updateApplication(
    id,
    updates = {}
  ) {
    if (!id) {
      throw new Error(
        "Loan application ID is required."
      );
    }

    const data =
      await request(
        `/applications/${encodeURIComponent(
          id
        )}`,
        {
          method: "PATCH",
          body: JSON.stringify(
            updates
          )
        }
      );

    const application =
      normalizeLoan(
        data.application ||
        data.loan ||
        data.data ||
        data
      );

    const index =
      state.applications.findIndex(
        item =>
          String(item.id) ===
          String(id)
      );

    if (index !== -1) {
      state.applications[index] =
        application;
    }

    calculateSummary();
    saveLocal();
    render();

    return application;
  }

  // ==========================================================
  // SUBMIT APPLICATION
  // ==========================================================

  async function submitApplication(
    id
  ) {
    if (!id) {
      throw new Error(
        "Loan application ID is required."
      );
    }

    const data =
      await request(
        `/applications/${encodeURIComponent(
          id
        )}/submit`,
        {
          method: "POST"
        }
      );

    const application =
      normalizeLoan(
        data.application ||
        data.loan ||
        data.data ||
        data
      );

    const index =
      state.applications.findIndex(
        item =>
          String(item.id) ===
          String(id)
      );

    if (index !== -1) {
      state.applications[index] =
        application;
    }

    calculateSummary();
    saveLocal();
    render();

    return application;
  }

  // ==========================================================
  // CANCEL APPLICATION
  // ==========================================================

  async function cancelApplication(
    id
  ) {
    return updateApplication(
      id,
      {
        status:
          CONFIG.statuses.CANCELLED
      }
    );
  }

  // ==========================================================
  // GET LOAN BY ID
  // ==========================================================

  function getLoanById(id) {
    return (
      state.loans.find(
        loan =>
          String(loan.id) ===
          String(id)
      ) ||
      state.applications.find(
        loan =>
          String(loan.id) ===
          String(id)
      ) ||
      null
    );
  }

  // ==========================================================
  // SUMMARY
  // ==========================================================

  function calculateSummary() {
    const loans = [
      ...state.loans,
      ...state.applications
    ];

    const unique = [];

    const ids = new Set();

    loans.forEach(loan => {
      const key =
        loan.id ||
        `${loan.applicationNumber}`;

      if (!ids.has(key)) {
        ids.add(key);
        unique.push(loan);
      }
    });

    state.summary = {
      total:
        unique.length,

      pending:
        unique.filter(
          loan =>
            [
              CONFIG.statuses.SUBMITTED,
              CONFIG.statuses.UNDER_REVIEW,
              CONFIG.statuses.DOCUMENTS_REQUIRED
            ].includes(
              loan.status
            )
        ).length,

      approved:
        unique.filter(
          loan =>
            loan.status ===
            CONFIG.statuses.APPROVED
        ).length,

      rejected:
        unique.filter(
          loan =>
            loan.status ===
            CONFIG.statuses.REJECTED
        ).length,

      disbursed:
        unique.filter(
          loan =>
            loan.status ===
            CONFIG.statuses.DISBURSED
        ).length
    };
  }

  // ==========================================================
  // FORMATTING
  // ==========================================================

  function formatCurrency(
    amount,
    currency = CONFIG.defaultCurrency
  ) {
    const value =
      Number(amount) || 0;

    try {
      return new Intl.NumberFormat(
        "en-IN",
        {
          style: "currency",
          currency,
          maximumFractionDigits: 0
        }
      ).format(value);
    } catch {
      return `₹${Math.round(
        value
      ).toLocaleString("en-IN")}`;
    }
  }

  function getStatusLabel(
    status
  ) {
    const labels = {
      DRAFT: "Draft",
      SUBMITTED: "Submitted",
      UNDER_REVIEW: "Under Review",
      DOCUMENTS_REQUIRED:
        "Documents Required",
      APPROVED: "Approved",
      REJECTED: "Rejected",
      DISBURSED: "Disbursed",
      CLOSED: "Closed",
      CANCELLED: "Cancelled"
    };

    return (
      labels[status] ||
      status ||
      "Unknown"
    );
  }

  // ==========================================================
  // RENDER SUMMARY
  // ==========================================================

  function renderSummary() {
    const fields = {
      total:
        "[data-loan-total]",

      pending:
        "[data-loan-pending]",

      approved:
        "[data-loan-approved]",

      rejected:
        "[data-loan-rejected]",

      disbursed:
        "[data-loan-disbursed]"
    };

    Object.entries(fields)
      .forEach(
        ([key, selector]) => {
          document
            .querySelectorAll(
              selector
            )
            .forEach(element => {
              element.textContent =
                String(
                  state.summary[key] ||
                  0
                );
            });
        }
      );
  }

  // ==========================================================
  // RENDER CALCULATOR
  // ==========================================================

  function renderCalculator() {
    const data =
      state.calculator;

    const fields = {
      monthlyEMI:
        "[data-loan-emi]",

      totalInterest:
        "[data-loan-total-interest]",

      totalPayment:
        "[data-loan-total-payment]"
    };

    Object.entries(fields)
      .forEach(
        ([key, selector]) => {
          document
            .querySelectorAll(
              selector
            )
            .forEach(element => {
              element.textContent =
                formatCurrency(
                  data[key]
                );
            });
        }
      );
  }

  // ==========================================================
  // RENDER ELIGIBILITY
  // ==========================================================

  function renderEligibility() {
    const result =
      state.eligibility;

    if (!result) {
      return;
    }

    document
      .querySelectorAll(
        "[data-loan-eligible]"
      )
      .forEach(element => {
        element.textContent =
          result.eligible === true
            ? "Eligible"
            : result.eligible === false
              ? "Not Eligible"
              : "Check Required";
      });

    document
      .querySelectorAll(
        "[data-loan-eligible-amount]"
      )
      .forEach(element => {
        element.textContent =
          formatCurrency(
            result.estimatedLoanAmount ||
            result.eligibleAmount ||
            result.maxLoanAmount ||
            0
          );
      });

    document
      .querySelectorAll(
        "[data-loan-eligible-emi]"
      )
      .forEach(element => {
        element.textContent =
          formatCurrency(
            result.estimatedMonthlyEMI ||
            result.maxEMI ||
            0
          );
      });
  }

  // ==========================================================
  // RENDER APPLICATIONS
  // ==========================================================

  function renderApplications() {
    document
      .querySelectorAll(
        "[data-loan-applications]"
      )
      .forEach(container => {
        container.innerHTML = "";

        if (
          state.applications.length === 0
        ) {
          container.innerHTML = `
            <div class="ghar-empty-state">
              <p>No loan applications found.</p>
            </div>
          `;

          return;
        }

        state.applications.forEach(
          application => {
            const article =
              document.createElement(
                "article"
              );

            article.className =
              "ghar-loan-card";

            article.dataset.loanId =
              application.id || "";

            article.innerHTML = `
              <div class="ghar-loan-card__content">
                <h3>
                  ${escapeHtml(
                    application.applicationNumber ||
                    "Loan Application"
                  )}
                </h3>

                <p>
                  ${escapeHtml(
                    application.type
                  )}
                </p>

                <strong>
                  ${formatCurrency(
                    application.amount
                  )}
                </strong>

                <span
                  class="ghar-loan-status"
                  data-status="${escapeHtml(
                    application.status
                  )}"
                >
                  ${escapeHtml(
                    getStatusLabel(
                      application.status
                    )
                  )}
                </span>
              </div>

              <div class="ghar-loan-card__emi">
                EMI:
                ${formatCurrency(
                  application.emi
                )}
              </div>
            `;

            container.appendChild(
              article
            );
          }
        );
      });
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  function render() {
    renderSummary();
    renderCalculator();
    renderEligibility();
    renderApplications();
  }

  // ==========================================================
  // HTML ESCAPE
  // ==========================================================

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ==========================================================
  // EVENT BINDINGS
  // ==========================================================

  function bindEvents() {
    document.addEventListener(
      "input",
      event => {
        const form =
          event.target.closest(
            "[data-loan-calculator]"
          );

        if (!form) {
          return;
        }

        const principal =
          form.querySelector(
            "[name='amount'], [name='principal'], [data-loan-principal]"
          )?.value;

        const rate =
          form.querySelector(
            "[name='interestRate'], [name='interest_rate'], [data-loan-rate]"
          )?.value;

        const tenure =
          form.querySelector(
            "[name='tenureYears'], [name='tenure_years'], [data-loan-tenure]"
          )?.value;

        calculateEMI(
          principal,
          rate,
          tenure
        );
      }
    );

    document.addEventListener(
      "submit",
      async event => {
        const form =
          event.target.closest(
            "[data-loan-eligibility]"
          );

        if (!form) {
          return;
        }

        event.preventDefault();

        const formData =
          new FormData(form);

        const data =
          Object.fromEntries(
            formData.entries()
          );

        try {
          await checkEligibility(
            data
          );
        } catch (error) {
          console.error(
            "Eligibility check failed:",
            error
          );
        }
      }
    );
  }

  // ==========================================================
  // INITIALIZATION
  // ==========================================================

  async function init() {
    if (state.initialized) {
      return;
    }

    state.initialized = true;

    loadLocal();
    bindEvents();
    render();

    try {
      await loadLoans();
    } catch (error) {
      console.error(
        "GHAR loans initialization error:",
        error
      );
    }
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  GHAR.loans = {
    init,

    state,

    config:
      CONFIG,

    load:
      loadLoans,

    eligibility:
      checkEligibility,

    calculateEMI,

    estimateLoanFromEMI,

    createApplication,

    getApplication,

    updateApplication,

    submitApplication,

    cancelApplication,

    get:
      getLoanById,

    summary:
      () => ({
        ...state.summary
      }),

    formatCurrency,

    render
  };

  // ==========================================================
  // AUTO INIT
  // ==========================================================

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