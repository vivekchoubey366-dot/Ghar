// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/payments.js
// Payment / Billing / Invoice / Subscription Frontend Module
// ============================================================

"use strict";

(function (window, document) {
  // ----------------------------------------------------------
  // DEPENDENCIES
  // ----------------------------------------------------------

  const GHAR = (window.GHAR = window.GHAR || {});

  const config = GHAR.config || {};
  const storage = GHAR.storage || {};
  const auth = GHAR.auth || {};
  const api = GHAR.api || {};

  // ----------------------------------------------------------
  // CONSTANTS
  // ----------------------------------------------------------

  const PAYMENT_STATUS = Object.freeze({
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    SUCCESS: "SUCCESS",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
    REFUNDED: "REFUNDED",
    EXPIRED: "EXPIRED"
  });

  const PAYMENT_TYPES = Object.freeze({
    PROPERTY: "PROPERTY",
    SUBSCRIPTION: "SUBSCRIPTION",
    RENT: "RENT",
    LOAN: "LOAN",
    SERVICE: "SERVICE",
    REFUND: "REFUND"
  });

  const SUBSCRIPTION_PLANS = Object.freeze({
    FREE: "FREE",
    BUYER_PLUS: "BUYER_PLUS",
    SELLER_PRO: "SELLER_PRO",
    AGENT_PRO: "AGENT_PRO",
    BUSINESS: "BUSINESS"
  });

  const STORAGE_KEYS = Object.freeze({
    LAST_PAYMENT: "ghar_last_payment",
    PAYMENT_HISTORY: "ghar_payment_history",
    PENDING_PAYMENT: "ghar_pending_payment",
    SUBSCRIPTION: "ghar_subscription"
  });

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  function getApiBase() {
    return (
      config.API_BASE_URL ||
      config.apiBaseUrl ||
      config.API_URL ||
      "/api"
    ).replace(/\/$/, "");
  }

  function getCurrency() {
    return (
      config.CURRENCY ||
      config.currency ||
      "INR"
    );
  }

  function getAuthToken() {
    if (typeof auth.getToken === "function") {
      return auth.getToken();
    }

    if (typeof storage.get === "function") {
      return (
        storage.get("accessToken") ||
        storage.get("token")
      );
    }

    return (
      localStorage.getItem("ghar_access_token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token")
    );
  }

  function isAuthenticated() {
    if (typeof auth.isAuthenticated === "function") {
      return auth.isAuthenticated();
    }

    return Boolean(getAuthToken());
  }

  function generateClientPaymentId() {
    return (
      "GHAR-PAY-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 10)
        .toUpperCase()
    );
  }

  function formatAmount(amount, currency = getCurrency()) {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return "₹0";
    }

    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 2
      }).format(value);
    } catch (error) {
      return `${currency} ${value.toFixed(2)}`;
    }
  }

  function formatDate(value) {
    if (!value) {
      return "--";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "--";
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function formatDateTime(value) {
    if (!value) {
      return "--";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "--";
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function notify(message, type = "info") {
    if (
      typeof GHAR.notify === "function"
    ) {
      GHAR.notify(message, type);
      return;
    }

    if (
      typeof window.showToast === "function"
    ) {
      window.showToast(message, type);
      return;
    }

    if (type === "error") {
      console.error(message);
    } else {
      console.log(message);
    }
  }

  // ----------------------------------------------------------
  // API REQUEST
  // ----------------------------------------------------------

  async function request(
    endpoint,
    options = {}
  ) {
    const url =
      endpoint.startsWith("http://") ||
      endpoint.startsWith("https://")
        ? endpoint
        : `${getApiBase()}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    const headers = {
      Accept: "application/json",
      ...(options.headers || {})
    };

    const token = getAuthToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (
      options.body &&
      !(options.body instanceof FormData)
    ) {
      headers["Content-Type"] =
        "application/json";
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include"
    });

    let data = null;

    const contentType =
      response.headers.get("content-type") || "";

    if (
      contentType.includes("application/json")
    ) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { data: text } : {};
    }

    if (!response.ok) {
      const error = new Error(
        data?.error ||
          data?.message ||
          `Payment API request failed (${response.status})`
      );

      error.status = response.status;
      error.data = data;

      throw error;
    }

    return data;
  }

  // ----------------------------------------------------------
  // PAYMENT OBJECT
  // ----------------------------------------------------------

  function normalizePayment(payment = {}) {
    return {
      id:
        payment.id ||
        payment.payment_id ||
        payment.paymentId ||
        null,

      clientPaymentId:
        payment.clientPaymentId ||
        payment.client_payment_id ||
        null,

      transactionId:
        payment.transactionId ||
        payment.transaction_id ||
        null,

      orderId:
        payment.orderId ||
        payment.order_id ||
        null,

      amount:
        Number(payment.amount || 0),

      currency:
        payment.currency ||
        getCurrency(),

      type:
        payment.type ||
        payment.payment_type ||
        PAYMENT_TYPES.SERVICE,

      status:
        String(
          payment.status ||
          PAYMENT_STATUS.PENDING
        ).toUpperCase(),

      description:
        payment.description || "",

      propertyId:
        payment.propertyId ||
        payment.property_id ||
        null,

      subscriptionPlan:
        payment.subscriptionPlan ||
        payment.subscription_plan ||
        null,

      invoiceId:
        payment.invoiceId ||
        payment.invoice_id ||
        null,

      createdAt:
        payment.createdAt ||
        payment.created_at ||
        null,

      updatedAt:
        payment.updatedAt ||
        payment.updated_at ||
        null
    };
  }

  // ----------------------------------------------------------
  // CREATE PAYMENT
  // ----------------------------------------------------------

  async function createPayment(payload = {}) {
    const payment = {
      ...payload,
      clientPaymentId:
        payload.clientPaymentId ||
        generateClientPaymentId()
    };

    const result = await request(
      "/payments",
      {
        method: "POST",
        body: JSON.stringify(payment)
      }
    );

    const created =
      normalizePayment(
        result.payment ||
          result.data ||
          result
      );

    savePendingPayment(created);

    return created;
  }

  // ----------------------------------------------------------
  // PAYMENT CHECKOUT
  // ----------------------------------------------------------

  async function createCheckout(
    payload = {}
  ) {
    const result = await request(
      "/payments/checkout",
      {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          clientPaymentId:
            payload.clientPaymentId ||
            generateClientPaymentId()
        })
      }
    );

    const checkout =
      result.checkout ||
      result.data ||
      result;

    savePendingPayment(checkout);

    return checkout;
  }

  // ----------------------------------------------------------
  // CONFIRM PAYMENT
  // ----------------------------------------------------------

  async function confirmPayment(
    paymentId,
    payload = {}
  ) {
    if (!paymentId) {
      throw new Error(
        "Payment ID is required."
      );
    }

    const result = await request(
      `/payments/${encodeURIComponent(
        paymentId
      )}/confirm`,
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );

    const payment =
      normalizePayment(
        result.payment ||
          result.data ||
          result
      );

    saveLastPayment(payment);
    removePendingPayment();

    return payment;
  }

  // ----------------------------------------------------------
  // GET PAYMENT
  // ----------------------------------------------------------

  async function getPayment(
    paymentId
  ) {
    if (!paymentId) {
      throw new Error(
        "Payment ID is required."
      );
    }

    const result = await request(
      `/payments/${encodeURIComponent(
        paymentId
      )}`
    );

    return normalizePayment(
      result.payment ||
        result.data ||
        result
    );
  }

  // ----------------------------------------------------------
  // PAYMENT STATUS
  // ----------------------------------------------------------

  async function getPaymentStatus(
    paymentId
  ) {
    if (!paymentId) {
      throw new Error(
        "Payment ID is required."
      );
    }

    const result = await request(
      `/payments/${encodeURIComponent(
        paymentId
      )}/status`
    );

    return normalizePayment(
      result.payment ||
        result.data ||
        result
    );
  }

  // ----------------------------------------------------------
  // PAYMENT HISTORY
  // ----------------------------------------------------------

  async function getPaymentHistory(
    params = {}
  ) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          query.set(key, value);
        }
      }
    );

    const endpoint =
      `/payments/history${
        query.toString()
          ? `?${query.toString()}`
          : ""
      }`;

    const result =
      await request(endpoint);

    const payments =
      result.payments ||
      result.data ||
      result.items ||
      [];

    return Array.isArray(payments)
      ? payments.map(normalizePayment)
      : [];
  }

  // ----------------------------------------------------------
  // INVOICES
  // ----------------------------------------------------------

  async function getInvoices(
    params = {}
  ) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          query.set(key, value);
        }
      }
    );

    const result = await request(
      `/payments/invoices${
        query.toString()
          ? `?${query.toString()}`
          : ""
      }`
    );

    return (
      result.invoices ||
      result.data ||
      []
    );
  }

  async function getInvoice(
    invoiceId
  ) {
    if (!invoiceId) {
      throw new Error(
        "Invoice ID is required."
      );
    }

    const result = await request(
      `/payments/invoices/${encodeURIComponent(
        invoiceId
      )}`
    );

    return (
      result.invoice ||
      result.data ||
      result
    );
  }

  // ----------------------------------------------------------
  // SUBSCRIPTIONS
  // ----------------------------------------------------------

  async function getSubscriptionPlans() {
    const result = await request(
      "/subscriptions/plans"
    );

    return (
      result.plans ||
      result.data ||
      []
    );
  }

  async function getSubscription() {
    const result = await request(
      "/subscriptions"
    );

    const subscription =
      result.subscription ||
      result.data ||
      result;

    return subscription;
  }

  async function subscribe(
    plan,
    payload = {}
  ) {
    if (!plan) {
      throw new Error(
        "Subscription plan is required."
      );
    }

    const result = await request(
      "/subscriptions",
      {
        method: "POST",
        body: JSON.stringify({
          plan,
          ...payload
        })
      }
    );

    const subscription =
      result.subscription ||
      result.data ||
      result;

    if (
      typeof storage.set === "function"
    ) {
      storage.set(
        STORAGE_KEYS.SUBSCRIPTION,
        subscription
      );
    } else {
      localStorage.setItem(
        STORAGE_KEYS.SUBSCRIPTION,
        JSON.stringify(subscription)
      );
    }

    return subscription;
  }

  async function cancelSubscription(
    reason = ""
  ) {
    const result = await request(
      "/subscriptions/cancel",
      {
        method: "POST",
        body: JSON.stringify({
          reason
        })
      }
    );

    return (
      result.subscription ||
      result.data ||
      result
    );
  }

  // ----------------------------------------------------------
  // REFUND
  // ----------------------------------------------------------

  async function requestRefund(
    paymentId,
    reason = ""
  ) {
    if (!paymentId) {
      throw new Error(
        "Payment ID is required."
      );
    }

    const result = await request(
      `/payments/${encodeURIComponent(
        paymentId
      )}/refund`,
      {
        method: "POST",
        body: JSON.stringify({
          reason
        })
      }
    );

    return normalizePayment(
      result.payment ||
        result.data ||
        result
    );
  }

  // ----------------------------------------------------------
  // PAYMENT METHODS
  // ----------------------------------------------------------

  async function getPaymentMethods() {
    const result = await request(
      "/payments/methods"
    );

    return (
      result.methods ||
      result.data ||
      []
    );
  }

  // ----------------------------------------------------------
  // LOCAL STORAGE
  // ----------------------------------------------------------

  function saveLastPayment(payment) {
    try {
      const value =
        JSON.stringify(payment);

      if (
        typeof storage.set === "function"
      ) {
        storage.set(
          STORAGE_KEYS.LAST_PAYMENT,
          payment
        );
      } else {
        localStorage.setItem(
          STORAGE_KEYS.LAST_PAYMENT,
          value
        );
      }
    } catch (error) {
      console.warn(
        "Unable to save last payment.",
        error
      );
    }
  }

  function getLastPayment() {
    try {
      if (
        typeof storage.get === "function"
      ) {
        return storage.get(
          STORAGE_KEYS.LAST_PAYMENT
        );
      }

      const value =
        localStorage.getItem(
          STORAGE_KEYS.LAST_PAYMENT
        );

      return value
        ? JSON.parse(value)
        : null;
    } catch (error) {
      return null;
    }
  }

  function savePendingPayment(payment) {
    try {
      if (
        typeof storage.set === "function"
      ) {
        storage.set(
          STORAGE_KEYS.PENDING_PAYMENT,
          payment
        );
      } else {
        localStorage.setItem(
          STORAGE_KEYS.PENDING_PAYMENT,
          JSON.stringify(payment)
        );
      }
    } catch (error) {
      console.warn(
        "Unable to save pending payment.",
        error
      );
    }
  }

  function getPendingPayment() {
    try {
      if (
        typeof storage.get === "function"
      ) {
        return storage.get(
          STORAGE_KEYS.PENDING_PAYMENT
        );
      }

      const value =
        localStorage.getItem(
          STORAGE_KEYS.PENDING_PAYMENT
        );

      return value
        ? JSON.parse(value)
        : null;
    } catch (error) {
      return null;
    }
  }

  function removePendingPayment() {
    try {
      if (
        typeof storage.remove === "function"
      ) {
        storage.remove(
          STORAGE_KEYS.PENDING_PAYMENT
        );
      } else {
        localStorage.removeItem(
          STORAGE_KEYS.PENDING_PAYMENT
        );
      }
    } catch (error) {
      console.warn(
        "Unable to clear pending payment.",
        error
      );
    }
  }

  // ----------------------------------------------------------
  // UI - PAYMENT SUMMARY
  // ----------------------------------------------------------

  function renderPaymentSummary(
    container,
    payment
  ) {
    if (!container) {
      return;
    }

    const item =
      normalizePayment(payment);

    container.innerHTML = `
      <div class="ghar-payment-summary">
        <div class="ghar-payment-summary__row">
          <span>Amount</span>
          <strong>
            ${escapeHtml(
              formatAmount(
                item.amount,
                item.currency
              )
            )}
          </strong>
        </div>

        <div class="ghar-payment-summary__row">
          <span>Status</span>
          <strong
            class="payment-status payment-status--${escapeHtml(
              item.status.toLowerCase()
            )}">
            ${escapeHtml(item.status)}
          </strong>
        </div>

        ${
          item.transactionId
            ? `
              <div class="ghar-payment-summary__row">
                <span>Transaction ID</span>
                <strong>
                  ${escapeHtml(
                    item.transactionId
                  )}
                </strong>
              </div>
            `
            : ""
        }

        ${
          item.invoiceId
            ? `
              <div class="ghar-payment-summary__row">
                <span>Invoice</span>
                <strong>
                  ${escapeHtml(
                    item.invoiceId
                  )}
                </strong>
              </div>
            `
            : ""
        }

        ${
          item.createdAt
            ? `
              <div class="ghar-payment-summary__row">
                <span>Date</span>
                <strong>
                  ${escapeHtml(
                    formatDateTime(
                      item.createdAt
                    )
                  )}
                </strong>
              </div>
            `
            : ""
        }
      </div>
    `;
  }

  // ----------------------------------------------------------
  // UI - PAYMENT HISTORY
  // ----------------------------------------------------------

  function renderPaymentHistory(
    container,
    payments = []
  ) {
    if (!container) {
      return;
    }

    if (!payments.length) {
      container.innerHTML = `
        <div class="ghar-empty-state">
          <p>No payment records found.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = payments
      .map(payment => {
        const item =
          normalizePayment(payment);

        return `
          <article
            class="ghar-payment-card"
            data-payment-id="${escapeHtml(
              item.id || ""
            )}"
          >
            <div class="ghar-payment-card__header">
              <strong>
                ${escapeHtml(
                  item.description ||
                    item.type
                )}
              </strong>

              <span
                class="payment-status payment-status--${escapeHtml(
                  item.status.toLowerCase()
                )}"
              >
                ${escapeHtml(item.status)}
              </span>
            </div>

            <div class="ghar-payment-card__body">
              <strong>
                ${escapeHtml(
                  formatAmount(
                    item.amount,
                    item.currency
                  )
                )}
              </strong>

              <span>
                ${escapeHtml(
                  formatDate(
                    item.createdAt
                  )
                )}
              </span>
            </div>

            ${
              item.transactionId
                ? `
                  <div class="ghar-payment-card__transaction">
                    Transaction:
                    ${escapeHtml(
                      item.transactionId
                    )}
                  </div>
                `
                : ""
            }
          </article>
        `;
      })
      .join("");
  }

  // ----------------------------------------------------------
  // UI - INVOICES
  // ----------------------------------------------------------

  function renderInvoices(
    container,
    invoices = []
  ) {
    if (!container) {
      return;
    }

    if (!invoices.length) {
      container.innerHTML = `
        <div class="ghar-empty-state">
          <p>No invoices available.</p>
        </div>
      `;
      return;
    }

    container.innerHTML =
      invoices
        .map(invoice => {
          return `
            <article
              class="ghar-invoice-card"
              data-invoice-id="${escapeHtml(
                invoice.id ||
                  invoice.invoice_id ||
                  ""
              )}"
            >
              <div>
                <strong>
                  ${escapeHtml(
                    invoice.invoice_number ||
                      invoice.invoiceNumber ||
                      invoice.id ||
                      "Invoice"
                  )}
                </strong>

                <span>
                  ${escapeHtml(
                    formatDate(
                      invoice.created_at ||
                        invoice.createdAt
                    )
                  )}
                </span>
              </div>

              <strong>
                ${escapeHtml(
                  formatAmount(
                    invoice.amount || 0,
                    invoice.currency ||
                      getCurrency()
                  )
                )}
              </strong>
            </article>
          `;
        })
        .join("");
  }

  // ----------------------------------------------------------
  // PAYMENT BUTTON
  // ----------------------------------------------------------

  async function handlePaymentButton(
    button
  ) {
    if (!button) {
      return;
    }

    if (!isAuthenticated()) {
      notify(
        "Please login before making a payment.",
        "warning"
      );
      return;
    }

    const amount =
      Number(
        button.dataset.amount ||
          0
      );

    const type =
      button.dataset.type ||
      PAYMENT_TYPES.SERVICE;

    const description =
      button.dataset.description ||
      "";

    const propertyId =
      button.dataset.propertyId ||
      null;

    const plan =
      button.dataset.plan ||
      null;

    button.disabled = true;

    try {
      const checkout =
        await createCheckout({
          amount,
          type,
          description,
          propertyId,
          subscriptionPlan: plan
        });

      // Payment gateway integration is intentionally
      // delegated to the backend/gateway response.
      if (
        checkout.checkoutUrl
      ) {
        window.location.href =
          checkout.checkoutUrl;
        return;
      }

      if (
        checkout.redirectUrl
      ) {
        window.location.href =
          checkout.redirectUrl;
        return;
      }

      if (
        checkout.url
      ) {
        window.location.href =
          checkout.url;
        return;
      }

      notify(
        "Payment checkout created.",
        "success"
      );

      document.dispatchEvent(
        new CustomEvent(
          "ghar:payment-created",
          {
            detail: checkout
          }
        )
      );
    } catch (error) {
      console.error(
        "Payment checkout failed:",
        error
      );

      notify(
        error.message ||
          "Unable to start payment.",
        "error"
      );
    } finally {
      button.disabled = false;
    }
  }

  // ----------------------------------------------------------
  // AUTO PAYMENT BUTTON BINDING
  // ----------------------------------------------------------

  function bindPaymentButtons() {
    document
      .querySelectorAll(
        "[data-payment-button]"
      )
      .forEach(button => {
        if (
          button.dataset.paymentBound ===
          "true"
        ) {
          return;
        }

        button.dataset.paymentBound =
          "true";

        button.addEventListener(
          "click",
          () =>
            handlePaymentButton(button)
        );
      });
  }

  // ----------------------------------------------------------
  // AUTO HISTORY LOADER
  // ----------------------------------------------------------

  async function initializeHistory() {
    const container =
      document.querySelector(
        "[data-payment-history]"
      );

    if (!container) {
      return;
    }

    try {
      container.innerHTML =
        "<p>Loading payments...</p>";

      const payments =
        await getPaymentHistory();

      renderPaymentHistory(
        container,
        payments
      );
    } catch (error) {
      console.error(
        "Payment history error:",
        error
      );

      container.innerHTML = `
        <div class="ghar-error-state">
          Unable to load payment history.
        </div>
      `;
    }
  }

  // ----------------------------------------------------------
  // AUTO INVOICE LOADER
  // ----------------------------------------------------------

  async function initializeInvoices() {
    const container =
      document.querySelector(
        "[data-invoices]"
      );

    if (!container) {
      return;
    }

    try {
      container.innerHTML =
        "<p>Loading invoices...</p>";

      const invoices =
        await getInvoices();

      renderInvoices(
        container,
        invoices
      );
    } catch (error) {
      console.error(
        "Invoice loading error:",
        error
      );

      container.innerHTML = `
        <div class="ghar-error-state">
          Unable to load invoices.
        </div>
      `;
    }
  }

  // ----------------------------------------------------------
  // PAYMENT RESULT HANDLING
  // ----------------------------------------------------------

  function handlePaymentResult() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const status =
      params.get("status");

    const paymentId =
      params.get("payment_id") ||
      params.get("paymentId");

    if (!status && !paymentId) {
      return;
    }

    if (
      status === "success"
    ) {
      notify(
        "Payment completed successfully.",
        "success"
      );
    }

    if (
      status === "failed"
    ) {
      notify(
        "Payment failed. Please try again.",
        "error"
      );
    }

    if (
      status === "cancelled"
    ) {
      notify(
        "Payment was cancelled.",
        "warning"
      );
    }

    if (paymentId) {
      document.dispatchEvent(
        new CustomEvent(
          "ghar:payment-result",
          {
            detail: {
              status,
              paymentId
            }
          }
        )
      );
    }
  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  const Payments = {
    PAYMENT_STATUS,
    PAYMENT_TYPES,
    SUBSCRIPTION_PLANS,

    isAuthenticated,

    createPayment,
    createCheckout,
    confirmPayment,

    getPayment,
    getPaymentStatus,
    getPaymentHistory,

    getInvoices,
    getInvoice,

    getPaymentMethods,

    getSubscriptionPlans,
    getSubscription,
    subscribe,
    cancelSubscription,

    requestRefund,

    saveLastPayment,
    getLastPayment,

    savePendingPayment,
    getPendingPayment,
    removePendingPayment,

    formatAmount,
    formatDate,
    formatDateTime,

    renderPaymentSummary,
    renderPaymentHistory,
    renderInvoices,

    bindPaymentButtons
  };

  GHAR.Payments = Payments;

  // Backward-compatible global.
  window.GHARPayments = Payments;

  // ----------------------------------------------------------
  // INITIALIZATION
  // ----------------------------------------------------------

  function init() {
    bindPaymentButtons();
    initializeHistory();
    initializeInvoices();
    handlePaymentResult();

    document.dispatchEvent(
      new CustomEvent(
        "ghar:payments-ready"
      )
    );
  }

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