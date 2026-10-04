// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/Referrals.js
// Referral Management
// ============================================================

"use strict";

(() => {
  const GHAR = window.GHAR = window.GHAR || {};

  const CONFIG = {
    apiBase:
      (GHAR.config && GHAR.config.API_BASE_URL) ||
      "/api",

    endpoint: "/referrals",

    storageKey: "ghar_referral_data",

    statuses: {
      PENDING: "PENDING",
      INVITED: "INVITED",
      REGISTERED: "REGISTERED",
      QUALIFIED: "QUALIFIED",
      REWARDED: "REWARDED",
      EXPIRED: "EXPIRED",
      CANCELLED: "CANCELLED"
    }
  };

  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const state = {
    referrals: [],
    summary: {
      total: 0,
      pending: 0,
      registered: 0,
      qualified: 0,
      rewarded: 0,
      earnings: 0
    },

    loading: false,
    initialized: false,
    error: null
  };

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  function getToken() {
    try {
      return (
        localStorage.getItem("ghar_access_token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        ""
      );
    } catch {
      return "";
    }
  }

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
      headers.Authorization = `Bearer ${token}`;
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

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const error =
        new Error(
          data.error ||
          data.message ||
          `Referral request failed (${response.status})`
        );

      error.status = response.status;
      error.data = data;

      throw error;
    }

    return data;
  }

  function saveLocal() {
    try {
      localStorage.setItem(
        CONFIG.storageKey,
        JSON.stringify({
          referrals: state.referrals,
          summary: state.summary
        })
      );
    } catch {
      // Ignore local storage failures.
    }
  }

  function loadLocal() {
    try {
      const raw =
        localStorage.getItem(
          CONFIG.storageKey
        );

      if (!raw) return false;

      const data =
        JSON.parse(raw);

      if (Array.isArray(data.referrals)) {
        state.referrals =
          data.referrals;
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

  function normalizeReferral(item = {}) {
    return {
      id:
        item.id ||
        item.referral_id ||
        item.referralId ||
        null,

      code:
        item.code ||
        item.referral_code ||
        item.referralCode ||
        "",

      referredUser:
        item.referredUser ||
        item.referred_user ||
        null,

      name:
        item.name ||
        item.referred_name ||
        "",

      email:
        item.email ||
        item.referred_email ||
        "",

      phone:
        item.phone ||
        item.referred_phone ||
        "",

      status:
        item.status ||
        CONFIG.statuses.PENDING,

      reward:
        Number(
          item.reward ||
          item.reward_amount ||
          0
        ),

      currency:
        item.currency ||
        "INR",

      createdAt:
        item.createdAt ||
        item.created_at ||
        null,

      updatedAt:
        item.updatedAt ||
        item.updated_at ||
        null,

      expiresAt:
        item.expiresAt ||
        item.expires_at ||
        null
    };
  }

  // ----------------------------------------------------------
  // REFERRAL CODE
  // ----------------------------------------------------------

  function getReferralCode() {
    return (
      state.referrals[0]?.code ||
      localStorage.getItem(
        "ghar_referral_code"
      ) ||
      ""
    );
  }

  async function getMyReferralCode() {
    try {
      const data =
        await request("/code");

      const code =
        data.code ||
        data.referralCode ||
        data.referral_code ||
        "";

      if (code) {
        localStorage.setItem(
          "ghar_referral_code",
          code
        );
      }

      return code;
    } catch (error) {
      console.error(
        "GHAR referral code error:",
        error
      );

      return getReferralCode();
    }
  }

  // ----------------------------------------------------------
  // LOAD REFERRALS
  // ----------------------------------------------------------

  async function loadReferrals(
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

      const list =
        data.referrals ||
        data.items ||
        data.data ||
        [];

      state.referrals =
        Array.isArray(list)
          ? list.map(normalizeReferral)
          : [];

      if (data.summary) {
        state.summary = {
          ...state.summary,
          ...data.summary
        };
      } else {
        calculateSummary();
      }

      saveLocal();
      render();

      return state.referrals;

    } catch (error) {
      state.error = error;

      console.error(
        "GHAR referrals load error:",
        error
      );

      loadLocal();
      calculateSummary();
      render();

      return state.referrals;

    } finally {
      state.loading = false;
    }
  }

  // ----------------------------------------------------------
  // CREATE REFERRAL
  // ----------------------------------------------------------

  async function createReferral(
    referralData = {}
  ) {
    const payload = {
      name:
        referralData.name || "",

      email:
        referralData.email || "",

      phone:
        referralData.phone || "",

      propertyId:
        referralData.propertyId ||
        referralData.property_id ||
        null,

      message:
        referralData.message || ""
    };

    const data =
      await request(
        "",
        {
          method: "POST",
          body: JSON.stringify(payload)
        }
      );

    const referral =
      normalizeReferral(
        data.referral ||
        data.data ||
        data
      );

    if (referral.id) {
      state.referrals.unshift(
        referral
      );
    }

    calculateSummary();
    saveLocal();
    render();

    return referral;
  }

  // ----------------------------------------------------------
  // SHARE REFERRAL
  // ----------------------------------------------------------

  async function shareReferral(
    options = {}
  ) {
    const code =
      options.code ||
      getReferralCode();

    const url =
      options.url ||
      `${window.location.origin}/sign-up.html?ref=${encodeURIComponent(code)}`;

    const shareData = {
      title:
        options.title ||
        "Join GHAR",

      text:
        options.text ||
        "Find your next property with GHAR.",

      url
    };

    if (
      navigator.share
    ) {
      try {
        await navigator.share(
          shareData
        );

        return {
          success: true,
          method: "native"
        };
      } catch (error) {
        if (
          error.name ===
          "AbortError"
        ) {
          return {
            success: false,
            cancelled: true
          };
        }
      }
    }

    try {
      await navigator.clipboard.writeText(
        url
      );

      return {
        success: true,
        method: "clipboard",
        url
      };
    } catch {
      return {
        success: false,
        url
      };
    }
  }

  // ----------------------------------------------------------
  // CALCULATE SUMMARY
  // ----------------------------------------------------------

  function calculateSummary() {
    const referrals =
      state.referrals;

    state.summary = {
      total:
        referrals.length,

      pending:
        referrals.filter(
          item =>
            item.status ===
            CONFIG.statuses.PENDING
        ).length,

      registered:
        referrals.filter(
          item =>
            item.status ===
            CONFIG.statuses.REGISTERED
        ).length,

      qualified:
        referrals.filter(
          item =>
            item.status ===
            CONFIG.statuses.QUALIFIED
        ).length,

      rewarded:
        referrals.filter(
          item =>
            item.status ===
            CONFIG.statuses.REWARDED
        ).length,

      earnings:
        referrals.reduce(
          (total, item) =>
            total +
            Number(item.reward || 0),
          0
        )
    };
  }

  // ----------------------------------------------------------
  // GET REFERRAL BY ID
  // ----------------------------------------------------------

  function getReferralById(id) {
    return state.referrals.find(
      item =>
        String(item.id) ===
        String(id)
    ) || null;
  }

  // ----------------------------------------------------------
  // CANCEL REFERRAL
  // ----------------------------------------------------------

  async function cancelReferral(id) {
    if (!id) {
      throw new Error(
        "Referral ID is required."
      );
    }

    const data =
      await request(
        `/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status:
              CONFIG.statuses.CANCELLED
          })
        }
      );

    const index =
      state.referrals.findIndex(
        item =>
          String(item.id) ===
          String(id)
      );

    if (index !== -1) {
      state.referrals[index] =
        normalizeReferral(
          data.referral ||
          data.data ||
          {
            ...state.referrals[index],
            status:
              CONFIG.statuses.CANCELLED
          }
        );
    }

    calculateSummary();
    saveLocal();
    render();

    return getReferralById(id);
  }

  // ----------------------------------------------------------
  // REFERRAL STATUS
  // ----------------------------------------------------------

  function getStatusLabel(
    status
  ) {
    const labels = {
      PENDING: "Pending",
      INVITED: "Invited",
      REGISTERED: "Registered",
      QUALIFIED: "Qualified",
      REWARDED: "Rewarded",
      EXPIRED: "Expired",
      CANCELLED: "Cancelled"
    };

    return (
      labels[status] ||
      status ||
      "Unknown"
    );
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  function renderSummary() {
    const mapping = {
      total:
        "[data-referral-total]",

      pending:
        "[data-referral-pending]",

      registered:
        "[data-referral-registered]",

      qualified:
        "[data-referral-qualified]",

      rewarded:
        "[data-referral-rewarded]",

      earnings:
        "[data-referral-earnings]"
    };

    Object.entries(mapping)
      .forEach(
        ([key, selector]) => {
          const element =
            document.querySelector(
              selector
            );

          if (!element) return;

          const value =
            state.summary[key] ?? 0;

          element.textContent =
            key === "earnings"
              ? `₹${Number(value).toLocaleString("en-IN")}`
              : String(value);
        }
      );
  }

  function renderReferralList() {
    const containers =
      document.querySelectorAll(
        "[data-referrals]"
      );

    containers.forEach(
      container => {
        container.innerHTML = "";

        if (
          state.referrals.length === 0
        ) {
          container.innerHTML = `
            <div class="ghar-empty-state">
              <p>No referrals found.</p>
            </div>
          `;

          return;
        }

        state.referrals.forEach(
          referral => {
            const item =
              document.createElement(
                "article"
              );

            item.className =
              "ghar-referral-card";

            item.dataset.referralId =
              referral.id || "";

            item.innerHTML = `
              <div class="ghar-referral-card__content">
                <h3>
                  ${escapeHtml(
                    referral.name ||
                    referral.email ||
                    "Referral"
                  )}
                </h3>

                <p>
                  ${escapeHtml(
                    referral.email || ""
                  )}
                </p>

                <span
                  class="ghar-referral-status"
                  data-status="${escapeHtml(
                    referral.status
                  )}"
                >
                  ${escapeHtml(
                    getStatusLabel(
                      referral.status
                    )
                  )}
                </span>
              </div>

              <div class="ghar-referral-card__reward">
                ₹${Number(
                  referral.reward || 0
                ).toLocaleString("en-IN")}
              </div>
            `;

            container.appendChild(
              item
            );
          }
        );
      }
    );
  }

  function renderCode() {
    const code =
      getReferralCode();

    document
      .querySelectorAll(
        "[data-referral-code]"
      )
      .forEach(element => {
        element.textContent =
          code || "--";
      });
  }

  function render() {
    renderSummary();
    renderReferralList();
    renderCode();
  }

  // ----------------------------------------------------------
  // HTML ESCAPE
  // ----------------------------------------------------------

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ----------------------------------------------------------
  // EVENT HANDLERS
  // ----------------------------------------------------------

  function bindEvents() {
    document.addEventListener(
      "click",
      async event => {

        const shareButton =
          event.target.closest(
            "[data-share-referral]"
          );

        if (shareButton) {
          event.preventDefault();

          const result =
            await shareReferral();

          if (
            result.success &&
            window.GHAR?.toast
          ) {
            window.GHAR.toast(
              "Referral link ready."
            );
          }

          return;
        }

        const copyButton =
          event.target.closest(
            "[data-copy-referral]"
          );

        if (copyButton) {
          event.preventDefault();

          const code =
            getReferralCode();

          const url =
            `${window.location.origin}/sign-up.html?ref=${encodeURIComponent(code)}`;

          try {
            await navigator.clipboard.writeText(
              url
            );

            if (
              window.GHAR?.toast
            ) {
              window.GHAR.toast(
                "Referral link copied."
              );
            }
          } catch (error) {
            console.error(
              "Unable to copy referral link:",
              error
            );
          }
        }
      }
    );
  }

  // ----------------------------------------------------------
  // INITIALIZATION
  // ----------------------------------------------------------

  async function init() {
    if (state.initialized) {
      return;
    }

    state.initialized = true;

    loadLocal();
    bindEvents();
    render();

    try {
      await getMyReferralCode();
      await loadReferrals();
    } catch (error) {
      console.error(
        "GHAR referral initialization error:",
        error
      );
    }
  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  GHAR.referrals = {
    init,

    state,

    config: CONFIG,

    load: loadReferrals,

    create:
      createReferral,

    cancel:
      cancelReferral,

    get:
      getReferralById,

    getCode:
      getMyReferralCode,

    share:
      shareReferral,

    summary:
      () => ({
        ...state.summary
      }),

    render,

    statuses:
      CONFIG.statuses
  };

  // ----------------------------------------------------------
  // AUTO INIT
  // ----------------------------------------------------------

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

})();