// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/subscriptions.js
// Subscription Plans / Billing / Status Management
// ============================================================

"use strict";

(function (window, document) {

  // ==========================================================
  // GHAR NAMESPACE
  // ==========================================================

  const GHAR = (window.GHAR = window.GHAR || {});

  const config = GHAR.config || {};
  const storage = GHAR.storage || {};
  const auth = GHAR.auth || {};

  // ==========================================================
  // CONSTANTS
  // ==========================================================

  const PLANS = Object.freeze({
    FREE: "FREE",
    BUYER_PLUS: "BUYER_PLUS",
    SELLER_PRO: "SELLER_PRO",
    AGENT_PRO: "AGENT_PRO",
    BUSINESS: "BUSINESS"
  });

  const STATUS = Object.freeze({
    ACTIVE: "ACTIVE",
    TRIAL: "TRIAL",
    PENDING: "PENDING",
    PAUSED: "PAUSED",
    CANCELLED: "CANCELLED",
    EXPIRED: "EXPIRED",
    FAILED: "FAILED"
  });

  const BILLING_CYCLES = Object.freeze({
    MONTHLY: "MONTHLY",
    YEARLY: "YEARLY"
  });

  const STORAGE_KEYS = Object.freeze({
    SUBSCRIPTION:
      "ghar_subscription",

    PLAN:
      "ghar_subscription_plan",

    STATUS:
      "ghar_subscription_status",

    START:
      "ghar_subscription_start",

    END:
      "ghar_subscription_end"
  });

  // ==========================================================
  // HELPERS
  // ==========================================================

  function getApiBase() {

    return (
      config.API_BASE_URL ||
      config.apiBaseUrl ||
      config.API_URL ||
      "/api"
    ).replace(/\/$/, "");
  }

  function getToken() {

    if (
      typeof auth.getToken ===
      "function"
    ) {
      return auth.getToken();
    }

    if (
      typeof storage.get ===
      "function"
    ) {
      return (
        storage.get("accessToken") ||
        storage.get("token")
      );
    }

    return (
      localStorage.getItem(
        "ghar_access_token"
      ) ||
      localStorage.getItem(
        "accessToken"
      ) ||
      localStorage.getItem(
        "token"
      )
    );
  }

  function isAuthenticated() {

    if (
      typeof auth.isAuthenticated ===
      "function"
    ) {
      return auth.isAuthenticated();
    }

    return Boolean(getToken());
  }

  function notify(
    message,
    type = "info"
  ) {

    if (
      typeof GHAR.notify ===
      "function"
    ) {
      GHAR.notify(
        message,
        type
      );
      return;
    }

    if (
      typeof window.showToast ===
      "function"
    ) {
      window.showToast(
        message,
        type
      );
      return;
    }

    if (type === "error") {
      console.error(message);
    } else {
      console.log(message);
    }
  }

  function escapeHtml(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
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

  function formatAmount(
    amount,
    currency = "INR"
  ) {

    const value =
      Number(amount);

    if (
      !Number.isFinite(value)
    ) {
      return "₹0";
    }

    try {

      return new Intl.NumberFormat(
        "en-IN",
        {
          style: "currency",
          currency,
          maximumFractionDigits: 2
        }
      ).format(value);

    } catch (error) {

      return `${currency} ${value.toFixed(2)}`;

    }
  }

  function formatDate(value) {

    if (!value) {
      return "--";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "--";
    }

    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    ).format(date);
  }

  // ==========================================================
  // API REQUEST
  // ==========================================================

  async function request(
    endpoint,
    options = {}
  ) {

    const url =
      endpoint.startsWith("http://") ||
      endpoint.startsWith("https://")
        ? endpoint
        : `${getApiBase()}${
            endpoint.startsWith("/")
              ? ""
              : "/"
          }${endpoint}`;

    const headers = {
      Accept:
        "application/json",
      ...(options.headers || {})
    };

    const token =
      getToken();

    if (token) {
      headers.Authorization =
        `Bearer ${token}`;
    }

    if (
      options.body &&
      !(options.body instanceof FormData)
    ) {
      headers[
        "Content-Type"
      ] =
        "application/json";
    }

    const response =
      await fetch(
        url,
        {
          ...options,
          headers,
          credentials:
            "include"
        }
      );

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    let data = {};

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      data =
        await response.json();
    } else {

      const text =
        await response.text();

      data =
        text
          ? { data: text }
          : {};
    }

    if (!response.ok) {

      const error =
        new Error(
          data.error ||
          data.message ||
          `Subscription request failed (${response.status})`
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
  // NORMALIZE SUBSCRIPTION
  // ==========================================================

  function normalizeSubscription(
    subscription = {}
  ) {

    return {

      id:
        subscription.id ||
        subscription.subscription_id ||
        null,

      plan:
        String(
          subscription.plan ||
          subscription.subscription_plan ||
          PLANS.FREE
        ).toUpperCase(),

      status:
        String(
          subscription.status ||
          subscription.subscription_status ||
          STATUS.ACTIVE
        ).toUpperCase(),

      billingCycle:
        String(
          subscription.billingCycle ||
          subscription.billing_cycle ||
          BILLING_CYCLES.MONTHLY
        ).toUpperCase(),

      start:
        subscription.start ||
        subscription.subscription_start ||
        null,

      end:
        subscription.end ||
        subscription.subscription_end ||
        null,

      amount:
        Number(
          subscription.amount ||
          subscription.price ||
          0
        ),

      currency:
        subscription.currency ||
        "INR",

      autoRenew:
        subscription.autoRenew ??
        subscription.auto_renew ??
        true,

      cancelledAt:
        subscription.cancelledAt ||
        subscription.cancelled_at ||
        null,

      createdAt:
        subscription.createdAt ||
        subscription.created_at ||
        null,

      updatedAt:
        subscription.updatedAt ||
        subscription.updated_at ||
        null
    };
  }

  // ==========================================================
  // GET PLANS
  // ==========================================================

  async function getPlans() {

    const result =
      await request(
        "/subscriptions/plans"
      );

    return (
      result.plans ||
      result.data ||
      []
    );
  }

  // ==========================================================
  // GET CURRENT SUBSCRIPTION
  // ==========================================================

  async function getCurrentSubscription() {

    if (
      !isAuthenticated()
    ) {
      return null;
    }

    const result =
      await request(
        "/subscriptions"
      );

    const subscription =
      result.subscription ||
      result.data ||
      result;

    const normalized =
      normalizeSubscription(
        subscription
      );

    saveSubscription(
      normalized
    );

    return normalized;
  }

  // ==========================================================
  // GET SUBSCRIPTION BY ID
  // ==========================================================

  async function getSubscription(
    subscriptionId
  ) {

    if (!subscriptionId) {
      throw new Error(
        "Subscription ID is required."
      );
    }

    const result =
      await request(
        `/subscriptions/${encodeURIComponent(
          subscriptionId
        )}`
      );

    return normalizeSubscription(
      result.subscription ||
      result.data ||
      result
    );
  }

  // ==========================================================
  // CREATE SUBSCRIPTION
  // ==========================================================

  async function createSubscription(
    plan,
    options = {}
  ) {

    if (
      !isAuthenticated()
    ) {
      throw new Error(
        "Please login before subscribing."
      );
    }

    if (!PLANS[plan]) {
      throw new Error(
        "Invalid subscription plan."
      );
    }

    const result =
      await request(
        "/subscriptions",
        {
          method: "POST",

          body:
            JSON.stringify({
              plan,
              billingCycle:
                options.billingCycle ||
                BILLING_CYCLES.MONTHLY,
              ...options
            })
        }
      );

    const subscription =
      normalizeSubscription(
        result.subscription ||
        result.data ||
        result
      );

    saveSubscription(
      subscription
    );

    return subscription;
  }

  // ==========================================================
  // CHANGE PLAN
  // ==========================================================

  async function changePlan(
    plan,
    options = {}
  ) {

    if (!PLANS[plan]) {
      throw new Error(
        "Invalid subscription plan."
      );
    }

    const result =
      await request(
        "/subscriptions/change-plan",
        {
          method: "POST",

          body:
            JSON.stringify({
              plan,
              ...options
            })
        }
      );

    const subscription =
      normalizeSubscription(
        result.subscription ||
        result.data ||
        result
      );

    saveSubscription(
      subscription
    );

    return subscription;
  }

  // ==========================================================
  // CANCEL SUBSCRIPTION
  // ==========================================================

  async function cancelSubscription(
    reason = "",
    immediately = false
  ) {

    const result =
      await request(
        "/subscriptions/cancel",
        {
          method: "POST",

          body:
            JSON.stringify({
              reason,
              immediately
            })
        }
      );

    const subscription =
      normalizeSubscription(
        result.subscription ||
        result.data ||
        result
      );

    saveSubscription(
      subscription
    );

    return subscription;
  }

  // ==========================================================
  // RESUME SUBSCRIPTION
  // ==========================================================

  async function resumeSubscription() {

    const result =
      await request(
        "/subscriptions/resume",
        {
          method: "POST"
        }
      );

    const subscription =
      normalizeSubscription(
        result.subscription ||
        result.data ||
        result
      );

    saveSubscription(
      subscription
    );

    return subscription;
  }

  // ==========================================================
  // AUTO RENEW
  // ==========================================================

  async function setAutoRenew(
    enabled
  ) {

    const result =
      await request(
        "/subscriptions/auto-renew",
        {
          method: "PATCH",

          body:
            JSON.stringify({
              enabled:
                Boolean(enabled)
            })
        }
      );

    const subscription =
      normalizeSubscription(
        result.subscription ||
        result.data ||
        result
      );

    saveSubscription(
      subscription
    );

    return subscription;
  }

  // ==========================================================
  // BILLING PORTAL
  // ==========================================================

  async function getBillingPortal() {

    const result =
      await request(
        "/subscriptions/billing-portal"
      );

    return (
      result.url ||
      result.portalUrl ||
      result.data ||
      result
    );
  }

  // ==========================================================
  // SUBSCRIPTION HISTORY
  // ==========================================================

  async function getHistory(
    params = {}
  ) {

    const query =
      new URLSearchParams();

    Object.entries(
      params
    ).forEach(
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

    const endpoint =
      `/subscriptions/history${
        query.toString()
          ? `?${query.toString()}`
          : ""
      }`;

    const result =
      await request(
        endpoint
      );

    return (
      result.subscriptions ||
      result.history ||
      result.data ||
      []
    );
  }

  // ==========================================================
  // CHECK PLAN ACCESS
  // ==========================================================

  function hasPlanAccess(
    requiredPlan,
    currentPlan
  ) {

    const levels = {

      [PLANS.FREE]:
        0,

      [PLANS.BUYER_PLUS]:
        1,

      [PLANS.SELLER_PRO]:
        2,

      [PLANS.AGENT_PRO]:
        3,

      [PLANS.BUSINESS]:
        4

    };

    const current =
      String(
        currentPlan ||
        getStoredPlan() ||
        PLANS.FREE
      ).toUpperCase();

    const required =
      String(
        requiredPlan ||
        PLANS.FREE
      ).toUpperCase();

    return (
      (levels[current] ?? 0) >=
      (levels[required] ?? 0)
    );
  }

  // ==========================================================
  // CHECK ACTIVE
  // ==========================================================

  function isActive(
    subscription
  ) {

    if (!subscription) {
      return false;
    }

    const normalized =
      normalizeSubscription(
        subscription
      );

    return [
      STATUS.ACTIVE,
      STATUS.TRIAL
    ].includes(
      normalized.status
    );
  }

  // ==========================================================
  // CHECK EXPIRATION
  // ==========================================================

  function isExpired(
    subscription
  ) {

    if (!subscription) {
      return true;
    }

    const normalized =
      normalizeSubscription(
        subscription
      );

    if (
      normalized.status ===
      STATUS.EXPIRED
    ) {
      return true;
    }

    if (!normalized.end) {
      return false;
    }

    return (
      new Date(
        normalized.end
      ).getTime() <
      Date.now()
    );
  }

  // ==========================================================
  // DAYS REMAINING
  // ==========================================================

  function daysRemaining(
    subscription
  ) {

    if (!subscription) {
      return 0;
    }

    const normalized =
      normalizeSubscription(
        subscription
      );

    if (!normalized.end) {
      return Infinity;
    }

    const difference =
      new Date(
        normalized.end
      ).getTime() -
      Date.now();

    return Math.max(
      0,
      Math.ceil(
        difference /
        (1000 * 60 * 60 * 24)
      )
    );
  }

  // ==========================================================
  // LOCAL STORAGE
  // ==========================================================

  function saveSubscription(
    subscription
  ) {

    const normalized =
      normalizeSubscription(
        subscription
      );

    try {

      if (
        typeof storage.set ===
        "function"
      ) {

        storage.set(
          STORAGE_KEYS.SUBSCRIPTION,
          normalized
        );

        storage.set(
          STORAGE_KEYS.PLAN,
          normalized.plan
        );

        storage.set(
          STORAGE_KEYS.STATUS,
          normalized.status
        );

        storage.set(
          STORAGE_KEYS.START,
          normalized.start
        );

        storage.set(
          STORAGE_KEYS.END,
          normalized.end
        );

      } else {

        localStorage.setItem(
          STORAGE_KEYS.SUBSCRIPTION,
          JSON.stringify(
            normalized
          )
        );

        localStorage.setItem(
          STORAGE_KEYS.PLAN,
          normalized.plan
        );

        localStorage.setItem(
          STORAGE_KEYS.STATUS,
          normalized.status
        );

        localStorage.setItem(
          STORAGE_KEYS.START,
          normalized.start || ""
        );

        localStorage.setItem(
          STORAGE_KEYS.END,
          normalized.end || ""
        );

      }

    } catch (error) {

      console.warn(
        "Unable to save subscription.",
        error
      );

    }

    return normalized;
  }

  function getStoredSubscription() {

    try {

      if (
        typeof storage.get ===
        "function"
      ) {

        return storage.get(
          STORAGE_KEYS.SUBSCRIPTION
        );
      }

      const value =
        localStorage.getItem(
          STORAGE_KEYS.SUBSCRIPTION
        );

      return value
        ? JSON.parse(value)
        : null;

    } catch (error) {

      return null;

    }
  }

  function getStoredPlan() {

    try {

      if (
        typeof storage.get ===
        "function"
      ) {

        return (
          storage.get(
            STORAGE_KEYS.PLAN
          ) ||
          PLANS.FREE
        );
      }

      return (
        localStorage.getItem(
          STORAGE_KEYS.PLAN
        ) ||
        PLANS.FREE
      );

    } catch (error) {

      return PLANS.FREE;

    }
  }

  function clearSubscription() {

    try {

      if (
        typeof storage.remove ===
        "function"
      ) {

        Object.values(
          STORAGE_KEYS
        ).forEach(
          key =>
            storage.remove(key)
        );

      } else {

        Object.values(
          STORAGE_KEYS
        ).forEach(
          key =>
            localStorage.removeItem(
              key
            )
        );

      }

    } catch (error) {

      console.warn(
        "Unable to clear subscription data.",
        error
      );

    }
  }

  // ==========================================================
  // UI - PLAN CARDS
  // ==========================================================

  function renderPlans(
    container,
    plans = [],
    currentPlan = getStoredPlan()
  ) {

    if (!container) {
      return;
    }

    if (!plans.length) {

      container.innerHTML = `
        <div class="ghar-empty-state">
          <p>No subscription plans available.</p>
        </div>
      `;

      return;
    }

    container.innerHTML =
      plans
        .map(
          plan => {

            const id =
              String(
                plan.id ||
                plan.plan ||
                ""
              ).toUpperCase();

            const name =
              plan.name ||
              id;

            const price =
              plan.price ??
              plan.amount ??
              0;

            const active =
              id ===
              String(
                currentPlan
              ).toUpperCase();

            return `
              <article
                class="ghar-subscription-card ${
                  active
                    ? "is-current"
                    : ""
                }"
                data-plan="${escapeHtml(
                  id
                )}"
              >

                <div class="ghar-subscription-card__header">

                  <h3>
                    ${escapeHtml(
                      name
                    )}
                  </h3>

                  ${
                    active
                      ? `
                        <span class="subscription-badge">
                          Current Plan
                        </span>
                      `
                      : ""
                  }

                </div>

                <div class="ghar-subscription-card__price">

                  <strong>
                    ${escapeHtml(
                      formatAmount(
                        price,
                        plan.currency ||
                          "INR"
                      )
                    )}
                  </strong>

                  ${
                    plan.billingCycle ||
                    plan.billing_cycle
                      ? `
                        <span>
                          / ${escapeHtml(
                            String(
                              plan.billingCycle ||
                              plan.billing_cycle
                            ).toLowerCase()
                          )}
                        </span>
                      `
                      : ""
                  }

                </div>

                ${
                  Array.isArray(
                    plan.features
                  )
                    ? `
                      <ul class="ghar-subscription-card__features">
                        ${plan.features
                          .map(
                            feature =>
                              `<li>${escapeHtml(
                                feature
                              )}</li>`
                          )
                          .join("")}
                      </ul>
                    `
                    : ""
                }

                ${
                  active
                    ? `
                      <button
                        type="button"
                        disabled
                        class="btn btn-secondary"
                      >
                        Current Plan
                      </button>
                    `
                    : `
                      <button
                        type="button"
                        class="btn btn-primary"
                        data-subscribe-plan="${escapeHtml(
                          id
                        )}"
                      >
                        Choose Plan
                      </button>
                    `
                }

              </article>
            `;
          }
        )
        .join("");

    bindPlanButtons();
  }

  // ==========================================================
  // PLAN BUTTONS
  // ==========================================================

  function bindPlanButtons() {

    document
      .querySelectorAll(
        "[data-subscribe-plan]"
      )
      .forEach(
        button => {

          if (
            button.dataset.bound ===
            "true"
          ) {
            return;
          }

          button.dataset.bound =
            "true";

          button.addEventListener(
            "click",
            async () => {

              const plan =
                button.dataset
                  .subscribePlan;

              button.disabled =
                true;

              try {

                const subscription =
                  await createSubscription(
                    plan
                  );

                notify(
                  `Subscription changed to ${subscription.plan}.`,
                  "success"
                );

                document.dispatchEvent(
                  new CustomEvent(
                    "ghar:subscription-updated",
                    {
                      detail:
                        subscription
                    }
                  )
                );

              } catch (error) {

                console.error(
                  "Subscription error:",
                  error
                );

                notify(
                  error.message ||
                    "Unable to update subscription.",
                  "error"
                );

              } finally {

                button.disabled =
                  false;

              }

            }
          );

        }
      );
  }

  // ==========================================================
  // UI - SUBSCRIPTION STATUS
  // ==========================================================

  function renderStatus(
    container,
    subscription
  ) {

    if (!container) {
      return;
    }

    if (!subscription) {

      container.innerHTML = `
        <div class="ghar-subscription-status">
          <strong>FREE</strong>
          <span>No active subscription</span>
        </div>
      `;

      return;
    }

    const item =
      normalizeSubscription(
        subscription
      );

    const remaining =
      daysRemaining(item);

    container.innerHTML = `
      <div
        class="ghar-subscription-status"
        data-subscription-plan="${escapeHtml(
          item.plan
        )}"
      >

        <div>
          <strong>
            ${escapeHtml(
              item.plan
            )}
          </strong>

          <span
            class="subscription-status subscription-status--${escapeHtml(
              item.status.toLowerCase()
            )}"
          >
            ${escapeHtml(
              item.status
            )}
          </span>
        </div>

        <div>
          <span>
            Started:
            ${escapeHtml(
              formatDate(
                item.start
              )
            )}
          </span>

          <span>
            Ends:
            ${escapeHtml(
              formatDate(
                item.end
              )
            )}
          </span>
        </div>

        ${
          Number.isFinite(
            remaining
          )
            ? `
              <div>
                ${remaining} day${
                  remaining === 1
                    ? ""
                    : "s"
                } remaining
              </div>
            `
            : ""
        }

      </div>
    `;
  }

  // ==========================================================
  // AUTO INITIALIZATION
  // ==========================================================

  async function initialize() {

    const plansContainer =
      document.querySelector(
        "[data-subscription-plans]"
      );

    const statusContainer =
      document.querySelector(
        "[data-subscription-status]"
      );

    try {

      let subscription =
        getStoredSubscription();

      if (
        isAuthenticated()
      ) {

        try {

          subscription =
            await getCurrentSubscription();

        } catch (error) {

          console.warn(
            "Unable to retrieve live subscription.",
            error
          );

        }

      }

      if (statusContainer) {

        renderStatus(
          statusContainer,
          subscription
        );

      }

      if (plansContainer) {

        const plans =
          await getPlans();

        renderPlans(
          plansContainer,
          plans,
          subscription?.plan ||
            PLANS.FREE
        );

      }

    } catch (error) {

      console.error(
        "Subscription initialization failed:",
        error
      );

    }

    document.dispatchEvent(
      new CustomEvent(
        "ghar:subscriptions-ready"
      )
    );
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  const Subscriptions = {

    PLANS,

    STATUS,

    BILLING_CYCLES,

    getPlans,

    getCurrentSubscription,

    getSubscription,

    createSubscription,

    changePlan,

    cancelSubscription,

    resumeSubscription,

    setAutoRenew,

    getBillingPortal,

    getHistory,

    hasPlanAccess,

    isActive,

    isExpired,

    daysRemaining,

    saveSubscription,

    getStoredSubscription,

    getStoredPlan,

    clearSubscription,

    renderPlans,

    renderStatus,

    formatAmount,

    formatDate

  };

  GHAR.Subscriptions =
    Subscriptions;

  window.GHARSubscriptions =
    Subscriptions;

  // ==========================================================
  // START
  // ==========================================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      {
        once: true
      }
    );

  } else {

    initialize();

  }

})(window, document);