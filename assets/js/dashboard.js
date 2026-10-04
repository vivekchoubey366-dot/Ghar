// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/dashboard.js
// Shared Dashboard Controller
// ============================================================

"use strict";

(function (window, document) {

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const DASHBOARD_CONFIG = {

    version: "1.0.0",

    apiBase:
      window.GHARConfig?.API_BASE_URL ||
      "/api",

    storageKeys: {
      dashboard: "ghar_dashboard",
      profile: "ghar_profile",
      user: "ghar_user"
    },

    roles: [
      "buyer",
      "seller",
      "tenant",
      "agent",
      "admin",
      "business"
    ]

  };

  // ==========================================================
  // STATE
  // ==========================================================

  const state = {

    initialized: false,

    loading: false,

    role: null,

    data: null,

    lastUpdated: null

  };

  // ==========================================================
  // HELPERS
  // ==========================================================

  function getJSON(key) {

    try {

      const value =
        localStorage.getItem(key);

      return value
        ? JSON.parse(value)
        : null;

    } catch (error) {

      console.warn(
        "[GHAR DASHBOARD] Storage error:",
        error
      );

      return null;

    }

  }

  function setJSON(key, value) {

    try {

      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

      return true;

    } catch (error) {

      console.warn(
        "[GHAR DASHBOARD] Storage write error:",
        error
      );

      return false;

    }

  }

  function getProfile() {

    if (
      window.GHARProfile &&
      typeof window.GHARProfile.get ===
        "function"
    ) {

      return window.GHARProfile.get();

    }

    return (
      getJSON(
        DASHBOARD_CONFIG.storageKeys.profile
      ) ||
      getJSON(
        DASHBOARD_CONFIG.storageKeys.user
      )
    );

  }

  // ==========================================================
  // ROLE
  // ==========================================================

  function getRole() {

    const profile =
      getProfile();

    if (
      profile &&
      profile.role
    ) {

      return String(
        profile.role
      ).toLowerCase();

    }

    const role =
      document.body.dataset.role ||
      document.documentElement.dataset.role;

    if (role) {

      return String(
        role
      ).toLowerCase();

    }

    return null;

  }

  function setRole(role) {

    if (!role) {
      return false;
    }

    const normalized =
      String(role)
        .trim()
        .toLowerCase();

    if (
      !DASHBOARD_CONFIG.roles.includes(
        normalized
      )
    ) {

      console.warn(
        `[GHAR DASHBOARD] Unknown role: ${normalized}`
      );

      return false;

    }

    state.role =
      normalized;

    document.body.dataset.role =
      normalized;

    return true;

  }

  // ==========================================================
  // DASHBOARD DATA DEFAULTS
  // ==========================================================

  function getDefaultData() {

    return {

      summary: {

        properties: 0,

        savedProperties: 0,

        favourites: 0,

        visits: 0,

        upcomingVisits: 0,

        offers: 0,

        applications: 0,

        leads: 0,

        messages: 0,

        notifications: 0,

        payments: 0,

        documents: 0,

        referrals: 0

      },

      recentProperties: [],

      recentVisits: [],

      recentOffers: [],

      recentApplications: [],

      recentMessages: [],

      recentNotifications: [],

      recentPayments: [],

      recentLeads: [],

      recentDocuments: [],

      activities: [],

      quickActions: []

    };

  }

  // ==========================================================
  // NORMALIZE DASHBOARD DATA
  // ==========================================================

  function normalizeData(data) {

    const defaults =
      getDefaultData();

    if (
      !data ||
      typeof data !== "object"
    ) {

      return defaults;

    }

    return {

      ...defaults,

      ...data,

      summary: {

        ...defaults.summary,

        ...(data.summary || {})

      },

      recentProperties:
        Array.isArray(
          data.recentProperties
        )
          ? data.recentProperties
          : [],

      recentVisits:
        Array.isArray(
          data.recentVisits
        )
          ? data.recentVisits
          : [],

      recentOffers:
        Array.isArray(
          data.recentOffers
        )
          ? data.recentOffers
          : [],

      recentApplications:
        Array.isArray(
          data.recentApplications
        )
          ? data.recentApplications
          : [],

      recentMessages:
        Array.isArray(
          data.recentMessages
        )
          ? data.recentMessages
          : [],

      recentNotifications:
        Array.isArray(
          data.recentNotifications
        )
          ? data.recentNotifications
          : [],

      recentPayments:
        Array.isArray(
          data.recentPayments
        )
          ? data.recentPayments
          : [],

      recentLeads:
        Array.isArray(
          data.recentLeads
        )
          ? data.recentLeads
          : [],

      recentDocuments:
        Array.isArray(
          data.recentDocuments
        )
          ? data.recentDocuments
          : [],

      activities:
        Array.isArray(
          data.activities
        )
          ? data.activities
          : []

    };

  }

  // ==========================================================
  // FETCH DASHBOARD
  // ==========================================================

  async function fetchDashboard(
    options = {}
  ) {

    const role =
      options.role ||
      state.role ||
      getRole();

    state.loading = true;

    dispatchEvent(
      "ghar:dashboard-loading",
      {
        role
      }
    );

    try {

      const token =
        localStorage.getItem(
          "ghar_token"
        );

      const headers = {

        "Accept":
          "application/json"

      };

      if (token) {

        headers.Authorization =
          `Bearer ${token}`;

      }

      const endpoint =
        options.endpoint ||
        `${DASHBOARD_CONFIG.apiBase}/dashboard`;

      const response =
        await fetch(
          endpoint,
          {
            method: "GET",
            headers,
            credentials: "include"
          }
        );

      if (!response.ok) {

        throw new Error(
          `Dashboard request failed: ${response.status}`
        );

      }

      const result =
        await response.json();

      const dashboard =
        normalizeData(
          result.data ||
          result.dashboard ||
          result
        );

      state.data =
        dashboard;

      state.lastUpdated =
        new Date().toISOString();

      setJSON(
        DASHBOARD_CONFIG.storageKeys.dashboard,
        dashboard
      );

      render(dashboard);

      dispatchEvent(
        "ghar:dashboard-loaded",
        {
          role,
          data: dashboard
        }
      );

      return dashboard;

    } catch (error) {

      console.warn(
        "[GHAR DASHBOARD] API unavailable:",
        error
      );

      const cached =
        getJSON(
          DASHBOARD_CONFIG.storageKeys.dashboard
        );

      const dashboard =
        normalizeData(cached);

      state.data =
        dashboard;

      render(dashboard);

      dispatchEvent(
        "ghar:dashboard-error",
        {
          role,
          error
        }
      );

      return dashboard;

    } finally {

      state.loading = false;

      dispatchEvent(
        "ghar:dashboard-loading-complete",
        {
          role
        }
      );

    }

  }

  // ==========================================================
  // RENDER DASHBOARD
  // ==========================================================

  function render(data) {

    if (!data) {
      return;
    }

    renderSummary(
      data.summary
    );

    renderCollections(
      data
    );

    renderActivities(
      data.activities
    );

    renderQuickActions(
      data.quickActions
    );

    renderRoleContent(
      data
    );

    updateDashboardMeta();

  }

  // ==========================================================
  // SUMMARY CARDS
  // ==========================================================

  function renderSummary(summary) {

    if (!summary) {
      return;
    }

    Object.entries(
      summary
    ).forEach(
      ([key, value]) => {

        const selectors = [

          `[data-dashboard-stat="${key}"]`,

          `[data-stat="${key}"]`,

          `#stat-${key}`,

          `.stat-${key}`

        ];

        selectors.forEach(
          selector => {

            document
              .querySelectorAll(selector)
              .forEach(element => {

                element.textContent =
                  formatNumber(value);

                element.dataset.value =
                  value;

              });

          }
        );

      }
    );

  }

  // ==========================================================
  // COLLECTION RENDERING
  // ==========================================================

  function renderCollections(data) {

    const collections = {

      properties:
        data.recentProperties,

      visits:
        data.recentVisits,

      offers:
        data.recentOffers,

      applications:
        data.recentApplications,

      messages:
        data.recentMessages,

      notifications:
        data.recentNotifications,

      payments:
        data.recentPayments,

      leads:
        data.recentLeads,

      documents:
        data.recentDocuments

    };

    Object.entries(
      collections
    ).forEach(
      ([name, items]) => {

        document
          .querySelectorAll(
            `[data-dashboard-list="${name}"]`
          )
          .forEach(container => {

            renderList(
              container,
              items,
              name
            );

          });

      }
    );

  }

  // ==========================================================
  // GENERIC LIST
  // ==========================================================

  function renderList(
    container,
    items,
    type
  ) {

    if (!container) {
      return;
    }

    container.innerHTML = "";

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {

      const empty =
        document.createElement(
          "div"
        );

      empty.className =
        "ghar-empty-state";

      empty.textContent =
        getEmptyMessage(type);

      container.appendChild(
        empty
      );

      return;

    }

    items.forEach(
      item => {

        const element =
          createListItem(
            item,
            type
          );

        container.appendChild(
          element
        );

      }
    );

  }

  // ==========================================================
  // LIST ITEM
  // ==========================================================

  function createListItem(
    item,
    type
  ) {

    const wrapper =
      document.createElement(
        "article"
      );

    wrapper.className =
      `ghar-dashboard-item ghar-dashboard-item-${type}`;

    wrapper.dataset.id =
      item.id ||
      item._id ||
      "";

    const title =
      item.title ||
      item.name ||
      item.propertyName ||
      item.subject ||
      item.type ||
      formatType(type);

    const status =
      item.status ||
      item.state ||
      "";

    const meta =
      item.location ||
      item.date ||
      item.createdAt ||
      item.created_at ||
      "";

    wrapper.innerHTML = `

      <div class="ghar-dashboard-item-main">

        <div
          class="ghar-dashboard-item-title"
          data-item-title
        >
          ${escapeHTML(title)}
        </div>

        ${
          meta
            ? `
              <div
                class="ghar-dashboard-item-meta"
                data-item-meta
              >
                ${escapeHTML(
                  formatValue(meta)
                )}
              </div>
            `
            : ""
        }

      </div>

      ${
        status
          ? `
            <span
              class="ghar-dashboard-item-status"
              data-status="${escapeHTML(
                String(status)
              )}"
            >
              ${escapeHTML(
                formatValue(status)
              )}
            </span>
          `
          : ""
      }

    `;

    return wrapper;

  }

  // ==========================================================
  // ACTIVITIES
  // ==========================================================

  function renderActivities(
    activities
  ) {

    document
      .querySelectorAll(
        '[data-dashboard-activities]'
      )
      .forEach(container => {

        container.innerHTML = "";

        if (
          !Array.isArray(activities) ||
          activities.length === 0
        ) {

          const empty =
            document.createElement(
              "div"
            );

          empty.className =
            "ghar-empty-state";

          empty.textContent =
            "No recent activity.";

          container.appendChild(
            empty
          );

          return;

        }

        activities.forEach(
          activity => {

            const item =
              document.createElement(
                "div"
              );

            item.className =
              "ghar-dashboard-activity";

            item.innerHTML = `

              <div
                class="ghar-dashboard-activity-title"
              >
                ${escapeHTML(
                  activity.title ||
                  activity.message ||
                  "Activity"
                )}
              </div>

              ${
                activity.createdAt
                  ? `
                    <time>
                      ${escapeHTML(
                        formatDate(
                          activity.createdAt
                        )
                      )}
                    </time>
                  `
                  : ""
              }

            `;

            container.appendChild(
              item
            );

          }
        );

      });

  }

  // ==========================================================
  // QUICK ACTIONS
  // ==========================================================

  function renderQuickActions(
    actions
  ) {

    if (
      !Array.isArray(actions)
    ) {
      return;
    }

    document
      .querySelectorAll(
        "[data-dashboard-quick-actions]"
      )
      .forEach(container => {

        container.innerHTML = "";

        actions.forEach(
          action => {

            if (!action.url) {
              return;
            }

            const link =
              document.createElement(
                "a"
              );

            link.href =
              action.url;

            link.className =
              "ghar-dashboard-action";

            link.textContent =
              action.label ||
              action.name ||
              "Open";

            container.appendChild(
              link
            );

          }
        );

      });

  }

  // ==========================================================
  // ROLE-SPECIFIC CONTENT
  // ==========================================================

  function renderRoleContent(
    data
  ) {

    const role =
      state.role ||
      getRole();

    if (!role) {
      return;
    }

    document
      .querySelectorAll(
        "[data-dashboard-role]"
      )
      .forEach(element => {

        const allowed =
          element.dataset.dashboardRole
            .split(",")
            .map(value =>
              value.trim()
                .toLowerCase()
            );

        element.hidden =
          !allowed.includes(role);

      });

    document.body.dataset.dashboardRole =
      role;

  }

  // ==========================================================
  // DASHBOARD META
  // ==========================================================

  function updateDashboardMeta() {

    const profile =
      getProfile();

    if (
      profile &&
      profile.name
    ) {

      document
        .querySelectorAll(
          "[data-dashboard-user]"
        )
        .forEach(element => {

          element.textContent =
            profile.name;

        });

    }

    document
      .querySelectorAll(
        "[data-dashboard-role]"
      );

    document
      .querySelectorAll(
        "[data-dashboard-updated]"
      )
      .forEach(element => {

        element.textContent =
          state.lastUpdated
            ? formatDate(
                state.lastUpdated
              )
            : "";

      });

  }

  // ==========================================================
  // REFRESH
  // ==========================================================

  async function refresh(
    options = {}
  ) {

    return fetchDashboard(
      options
    );

  }

  // ==========================================================
  // GET CURRENT DATA
  // ==========================================================

  function getData() {

    return (
      state.data ||
      getJSON(
        DASHBOARD_CONFIG.storageKeys.dashboard
      ) ||
      getDefaultData()
    );

  }

  // ==========================================================
  // GET SUMMARY
  // ==========================================================

  function getSummary() {

    return getData().summary;

  }

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  function setLoading(
    loading
  ) {

    document.body.classList.toggle(
      "ghar-dashboard-loading",
      Boolean(loading)
    );

    document
      .querySelectorAll(
        "[data-dashboard-loading]"
      )
      .forEach(element => {

        element.hidden =
          !loading;

      });

  }

  // ==========================================================
  // EVENT DISPATCH
  // ==========================================================

  function dispatchEvent(
    name,
    detail
  ) {

    document.dispatchEvent(
      new CustomEvent(
        name,
        {
          detail
        }
      )
    );

  }

  // ==========================================================
  // FORMATTING
  // ==========================================================

  function formatNumber(
    value
  ) {

    const number =
      Number(value);

    if (
      Number.isNaN(number)
    ) {

      return "0";

    }

    return number.toLocaleString(
      "en-IN"
    );

  }

  function formatDate(
    value
  ) {

    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return String(value);

    }

    return date.toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    );

  }

  function formatValue(
    value
  ) {

    if (
      value instanceof Date
    ) {

      return formatDate(value);

    }

    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}/.test(value)
    ) {

      return formatDate(value);

    }

    return String(value);

  }

  function formatType(
    type
  ) {

    return String(type || "")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, char =>
        char.toUpperCase()
      );

  }

  function getEmptyMessage(
    type
  ) {

    const messages = {

      properties:
        "No properties found.",

      visits:
        "No visits scheduled.",

      offers:
        "No offers available.",

      applications:
        "No applications found.",

      messages:
        "No messages yet.",

      notifications:
        "No notifications.",

      payments:
        "No payment records.",

      leads:
        "No leads found.",

      documents:
        "No documents found."

    };

    return (
      messages[type] ||
      "Nothing to display."
    );

  }

  // ==========================================================
  // HTML ESCAPING
  // ==========================================================

  function escapeHTML(
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
  // INITIALIZE
  // ==========================================================

  async function init(
    options = {}
  ) {

    if (
      state.initialized &&
      !options.force
    ) {

      return getData();

    }

    const role =
      options.role ||
      getRole();

    if (role) {
      setRole(role);
    }

    setLoading(true);

    try {

      return await fetchDashboard(
        options
      );

    } finally {

      setLoading(false);

      state.initialized =
        true;

    }

  }

  // ==========================================================
  // PUBLIC GHAR DASHBOARD API
  // ==========================================================

  window.GHARDashboard = {

    version:
      DASHBOARD_CONFIG.version,

    state,

    init,

    refresh,

    fetch:
      fetchDashboard,

    get:
      getData,

    getData,

    getSummary,

    getRole,

    setRole,

    render,

    renderSummary,

    renderCollections,

    renderActivities,

    renderQuickActions,

    setLoading

  };

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

        /*
         * Dashboard pages can disable
         * automatic API loading with:
         *
         * <body data-dashboard-auto="false">
         */

        if (
          document.body.dataset.dashboardAuto ===
          "false"
        ) {

          return;

        }

        init();

      }
    );

  } else {

    if (
      document.body.dataset.dashboardAuto !==
      "false"
    ) {

      init();

    }

  }

})(window, document);