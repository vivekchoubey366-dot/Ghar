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

  const CONFIG = {

    VERSION: "2.0.0",

    API_BASE:
      window.GHAR_CONFIG?.API_BASE_URL ||
      window.GHAR?.config?.API_BASE_URL ||
      "/api",

    DASHBOARD_ENDPOINT:
      "/dashboard",

    STORAGE_KEYS: {

      DASHBOARD: "ghar_dashboard",
      USER: "ghar_user",
      PROFILE: "ghar_profile",
      ROLE: "ghar_role",
      ACCESS_TOKEN: "ghar_access_token",
      ROLES: "ghar_roles"

    },

    ROLES: Object.freeze([

      "BUYER",
      "SELLER",
      "TENANT",
      "AGENT",
      "ADMIN",
      "SUPER_ADMIN",
      "BUSINESS"

    ]),

    DEFAULT_ROLE:
      "BUYER",

    REQUEST_TIMEOUT:
      30000

  };


  // ==========================================================
  // STATE
  // ==========================================================

  const state = {

    initialized: false,

    loading: false,

    role: null,

    roles: [],

    user: null,

    profile: null,

    data: null,

    error: null,

    lastUpdated: null

  };


  // ==========================================================
  // STORAGE
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
        "[GHAR Dashboard] Storage read failed:",
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
        "[GHAR Dashboard] Storage write failed:",
        error
      );

      return false;

    }

  }


  function removeStorage(key) {

    try {

      localStorage.removeItem(key);

    } catch (error) {

      console.warn(
        "[GHAR Dashboard] Storage remove failed:",
        error
      );

    }

  }


  // ==========================================================
  // ROLE SYSTEM
  // ==========================================================

  function normalizeRole(role) {

    if (
      role === null ||
      role === undefined
    ) {

      return null;

    }

    const normalized =
      String(role)
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");

    const aliases = {

      USER:
        "BUYER",

      CUSTOMER:
        "BUYER",

      CLIENT:
        "BUYER",

      OWNER:
        "SELLER",

      LANDLORD:
        "SELLER",

      PROPERTY_OWNER:
        "SELLER",

      RENTER:
        "TENANT",

      STAFF:
        "AGENT",

      BROKER:
        "AGENT",

      REALTOR:
        "AGENT",

      BUSINESS_USER:
        "BUSINESS",

      SUPERADMIN:
        "SUPER_ADMIN",

      "SUPER-ADMIN":
        "SUPER_ADMIN"

    };

    return aliases[normalized] ||
      normalized;

  }


  function isValidRole(role) {

    return CONFIG.ROLES.includes(
      normalizeRole(role)
    );

  }


  function normalizeRoles(roles) {

    let input = roles;

    if (!Array.isArray(input)) {

      input =
        input
          ? [input]
          : [];

    }

    const normalized =
      input
        .map(normalizeRole)
        .filter(
          role =>
            role &&
            isValidRole(role)
        );

    return [
      ...new Set(normalized)
    ];

  }


  function getStoredRoles() {

    const stored =
      getJSON(
        CONFIG.STORAGE_KEYS.ROLES
      );

    if (Array.isArray(stored)) {

      return normalizeRoles(stored);

    }

    const storedRole =
      localStorage.getItem(
        CONFIG.STORAGE_KEYS.ROLE
      );

    return normalizeRoles(
      storedRole
        ? [storedRole]
        : []
    );

  }


  function getUser() {

    if (
      window.GHAR_AUTH &&
      typeof window.GHAR_AUTH.getUser ===
        "function"
    ) {

      try {

        return window.GHAR_AUTH.getUser();

      } catch {}

    }

    return getJSON(
      CONFIG.STORAGE_KEYS.USER
    );

  }


  function getProfile() {

    if (
      window.GHARProfile &&
      typeof window.GHARProfile.get ===
        "function"
    ) {

      try {

        return window.GHARProfile.get();

      } catch {}

    }

    return (
      getJSON(
        CONFIG.STORAGE_KEYS.PROFILE
      ) ||
      getUser()
    );

  }


  function getUserRoles() {

    const user =
      getUser();

    const profile =
      getProfile();

    const roles = [

      ...(user?.roles || []),

      ...(profile?.roles || []),

      user?.role,

      profile?.role,

      ...getStoredRoles(),

      document.body.dataset.role,

      document.documentElement.dataset.role

    ];

    return normalizeRoles(roles);

  }


  function getRole() {

    const availableRoles =
      state.roles.length
        ? state.roles
        : getUserRoles();

    const storedRole =
      normalizeRole(
        localStorage.getItem(
          CONFIG.STORAGE_KEYS.ROLE
        )
      );

    if (
      storedRole &&
      availableRoles.includes(storedRole)
    ) {

      return storedRole;

    }

    return (
      state.role ||
      availableRoles[0] ||
      null
    );

  }


  function setRole(role) {

    const normalized =
      normalizeRole(role);

    if (
      !normalized ||
      !isValidRole(normalized)
    ) {

      console.warn(
        `[GHAR Dashboard] Invalid role: ${role}`
      );

      return false;

    }

    const availableRoles =
      state.roles.length
        ? state.roles
        : getUserRoles();

    if (
      availableRoles.length &&
      !availableRoles.includes(normalized)
    ) {

      console.warn(
        `[GHAR Dashboard] Role not assigned: ${normalized}`
      );

      return false;

    }

    state.role =
      normalized;

    localStorage.setItem(
      CONFIG.STORAGE_KEYS.ROLE,
      normalized
    );

    document.body.dataset.role =
      normalized;

    document.body.dataset.dashboardRole =
      normalized;

    document.documentElement.dataset.role =
      normalized;

    dispatchEvent(
      "ghar:role-change",
      {
        role: normalized,
        roles: state.roles
      }
    );

    return true;

  }


  function initializeRoles() {

    state.roles =
      getUserRoles();

    if (!state.roles.length) {

      const bodyRole =
        normalizeRole(
          document.body.dataset.role
        );

      if (bodyRole && isValidRole(bodyRole)) {

        state.roles = [
          bodyRole
        ];

      }

    }

    const currentRole =
      getRole();

    if (currentRole) {

      state.role =
        currentRole;

    }

    return state.roles;

  }


  // ==========================================================
  // DASHBOARD DEFAULT DATA
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
  // DATA NORMALIZATION
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

    const normalized = {

      ...defaults,

      ...data,

      summary: {

        ...defaults.summary,

        ...(data.summary || {})

      }

    };

    const collections = [

      "recentProperties",

      "recentVisits",

      "recentOffers",

      "recentApplications",

      "recentMessages",

      "recentNotifications",

      "recentPayments",

      "recentLeads",

      "recentDocuments",

      "activities",

      "quickActions"

    ];

    collections.forEach(
      key => {

        normalized[key] =
          Array.isArray(data[key])
            ? data[key]
            : [];

      }
    );

    return normalized;

  }


  // ==========================================================
  // API REQUEST
  // ==========================================================

  async function request(
    url,
    options = {}
  ) {

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        CONFIG.REQUEST_TIMEOUT
      );

    const token =
      localStorage.getItem(
        CONFIG.STORAGE_KEYS.ACCESS_TOKEN
      );

    const headers = {

      Accept:
        "application/json",

      ...(options.headers || {})

    };

    if (token) {

      headers.Authorization =
        `Bearer ${token}`;

    }

    try {

      const response =
        await fetch(
          url,
          {
            ...options,
            headers,
            credentials:
              options.credentials ||
              "include",
            signal:
              controller.signal
          }
        );

      if (!response.ok) {

        throw new Error(
          `Request failed: ${response.status}`
        );

      }

      return await response.json();

    } finally {

      clearTimeout(timeout);

    }

  }


  // ==========================================================
  // FETCH DASHBOARD
  // ==========================================================

  async function fetchDashboard(
    options = {}
  ) {

    const role =
      normalizeRole(
        options.role ||
        state.role ||
        getRole()
      );

    state.loading =
      true;

    state.error =
      null;

    dispatchEvent(
      "ghar:dashboard-loading",
      {
        role
      }
    );

    const endpoint =
      options.endpoint ||
      `${CONFIG.API_BASE}${CONFIG.DASHBOARD_ENDPOINT}`;

    try {

      const url =
        new URL(
          endpoint,
          window.location.origin
        );

      if (role) {

        url.searchParams.set(
          "role",
          role
        );

      }

      const result =
        await request(
          url.toString(),
          {
            method: "GET"
          }
        );

      const dashboard =
        normalizeData(
          result?.data ||
          result?.dashboard ||
          result
        );

      state.data =
        dashboard;

      state.lastUpdated =
        new Date().toISOString();

      setJSON(
        CONFIG.STORAGE_KEYS.DASHBOARD,
        dashboard
      );

      render(
        dashboard
      );

      dispatchEvent(
        "ghar:dashboard-loaded",
        {
          role,
          data: dashboard
        }
      );

      return dashboard;

    } catch (error) {

      state.error =
        error;

      console.warn(
        "[GHAR Dashboard] API unavailable:",
        error
      );

      const cached =
        getJSON(
          CONFIG.STORAGE_KEYS.DASHBOARD
        );

      const dashboard =
        normalizeData(cached);

      state.data =
        dashboard;

      render(
        dashboard
      );

      dispatchEvent(
        "ghar:dashboard-error",
        {
          role,
          error
        }
      );

      return dashboard;

    } finally {

      state.loading =
        false;

      dispatchEvent(
        "ghar:dashboard-loading-complete",
        {
          role
        }
      );

    }

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  function render(data) {

    const dashboard =
      normalizeData(data);

    renderSummary(
      dashboard.summary
    );

    renderCollections(
      dashboard
    );

    renderActivities(
      dashboard.activities
    );

    renderQuickActions(
      dashboard.quickActions
    );

    renderRoleContent(
      dashboard
    );

    updateDashboardMeta();

  }


  // ==========================================================
  // SUMMARY
  // ==========================================================

  function renderSummary(summary) {

    Object.entries(
      summary || {}
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
                  String(value ?? 0);

              });

          }
        );

      }
    );

  }


  // ==========================================================
  // COLLECTIONS
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
      ([type, items]) => {

        document
          .querySelectorAll(
            `[data-dashboard-list="${type}"]`
          )
          .forEach(
            container =>
              renderList(
                container,
                items,
                type
              )
          );

      }
    );

  }


  // ==========================================================
  // LIST RENDERING
  // ==========================================================

  function renderList(
    container,
    items,
    type
  ) {

    container.replaceChildren();

    if (
      !Array.isArray(items) ||
      !items.length
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

    const fragment =
      document.createDocumentFragment();

    items.forEach(
      item => {

        fragment.appendChild(
          createListItem(
            item,
            type
          )
        );

      }
    );

    container.appendChild(
      fragment
    );

  }


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
      String(
        item?.id ||
        item?._id ||
        ""
      );

    const title =
      item?.title ||
      item?.name ||
      item?.propertyName ||
      item?.subject ||
      item?.type ||
      formatType(type);

    const status =
      item?.status ||
      item?.state ||
      "";

    const meta =
      item?.location ||
      item?.date ||
      item?.createdAt ||
      item?.created_at ||
      "";

    const main =
      document.createElement(
        "div"
      );

    main.className =
      "ghar-dashboard-item-main";

    const titleElement =
      document.createElement(
        "div"
      );

    titleElement.className =
      "ghar-dashboard-item-title";

    titleElement.dataset.itemTitle =
      "";

    titleElement.textContent =
      String(title);

    main.appendChild(
      titleElement
    );

    if (meta) {

      const metaElement =
        document.createElement(
          "div"
        );

      metaElement.className =
        "ghar-dashboard-item-meta";

      metaElement.dataset.itemMeta =
        "";

      metaElement.textContent =
        formatValue(meta);

      main.appendChild(
        metaElement
      );

    }

    wrapper.appendChild(
      main
    );

    if (status) {

      const statusElement =
        document.createElement(
          "span"
        );

      statusElement.className =
        "ghar-dashboard-item-status";

      statusElement.dataset.status =
        String(status);

      statusElement.textContent =
        formatValue(status);

      wrapper.appendChild(
        statusElement
      );

    }

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
        "[data-dashboard-activities]"
      )
      .forEach(
        container => {

          container.replaceChildren();

          if (
            !Array.isArray(activities) ||
            !activities.length
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

          const fragment =
            document.createDocumentFragment();

          activities.forEach(
            activity => {

              const item =
                document.createElement(
                  "div"
                );

              item.className =
                "ghar-dashboard-activity";

              const title =
                document.createElement(
                  "div"
                );

              title.className =
                "ghar-dashboard-activity-title";

              title.textContent =
                activity?.title ||
                activity?.message ||
                "Activity";

              item.appendChild(
                title
              );

              if (
                activity?.createdAt
              ) {

                const time =
                  document.createElement(
                    "time"
                  );

                time.dateTime =
                  String(
                    activity.createdAt
                  );

                time.textContent =
                  formatDate(
                    activity.createdAt
                  );

                item.appendChild(
                  time
                );

              }

              fragment.appendChild(
                item
              );

            }
          );

          container.appendChild(
            fragment
          );

        }
      );

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
      .forEach(
        container => {

          container.replaceChildren();

          const fragment =
            document.createDocumentFragment();

          actions.forEach(
            action => {

              if (
                !action?.url
              ) {

                return;

              }

              const link =
                document.createElement(
                  "a"
                );

              link.href =
                String(action.url);

              link.className =
                "ghar-dashboard-action";

              link.textContent =
                action.label ||
                action.name ||
                "Open";

              fragment.appendChild(
                link
              );

            }
          );

          container.appendChild(
            fragment
          );

        }
      );

  }


  // ==========================================================
  // ROLE-BASED CONTENT
  // ==========================================================

  function renderRoleContent() {

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
      .forEach(
        element => {

          /*
           * Example:
           *
           * data-dashboard-role="BUYER"
           *
           * or:
           *
           * data-dashboard-role="BUYER,SELLER"
           */

          const allowed =
            String(
              element.dataset.dashboardRole
            )
              .split(",")
              .map(normalizeRole)
              .filter(Boolean);

          element.hidden =
            !allowed.includes(role);

        }
      );

    document.body.dataset.dashboardRole =
      role;

  }


  // ==========================================================
  // DASHBOARD META
  // ==========================================================

  function updateDashboardMeta() {

    const profile =
      getProfile();

    if (profile?.name) {

      document
        .querySelectorAll(
          "[data-dashboard-user]"
        )
        .forEach(
          element => {

            element.textContent =
              profile.name;

          }
        );

    }

    const role =
      state.role ||
      getRole();

    document
      .querySelectorAll(
        "[data-dashboard-current-role]"
      )
      .forEach(
        element => {

          element.textContent =
            role
              ? formatType(role)
              : "";

        }
      );

    document
      .querySelectorAll(
        "[data-dashboard-updated]"
      )
      .forEach(
        element => {

          element.textContent =
            state.lastUpdated
              ? formatDate(
                  state.lastUpdated
                )
              : "";

        }
      );

  }


  // ==========================================================
  // LOADING
  // ==========================================================

  function setLoading(
    loading
  ) {

    state.loading =
      Boolean(loading);

    document.body.classList.toggle(
      "ghar-dashboard-loading",
      state.loading
    );

    document
      .querySelectorAll(
        "[data-dashboard-loading]"
      )
      .forEach(
        element => {

          element.hidden =
            !state.loading;

        }
      );

  }


  // ==========================================================
  // REFRESH
  // ==========================================================

  async function refresh(
    options = {}
  ) {

    return fetchDashboard(
      {
        ...options,
        force: true
      }
    );

  }


  // ==========================================================
  // DATA ACCESS
  // ==========================================================

  function getData() {

    return (
      state.data ||
      getJSON(
        CONFIG.STORAGE_KEYS.DASHBOARD
      ) ||
      getDefaultData()
    );

  }


  function getSummary() {

    return getData().summary;

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
      !Number.isFinite(number)
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
        dateStyle:
          "medium",

        timeStyle:
          "short"
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

    return String(
      value ?? ""
    );

  }


  function formatType(
    value
  ) {

    return String(
      value || ""
    )
      .replace(
        /[_-]+/g,
        " "
      )
      .replace(
        /\b\w/g,
        char =>
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
  // EVENTS
  // ==========================================================

  function dispatchEvent(
    name,
    detail = {}
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
  // INITIALIZATION
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

    state.user =
      getUser();

    state.profile =
      getProfile();

    initializeRoles();

    const requestedRole =
      normalizeRole(
        options.role
      );

    if (requestedRole) {

      setRole(
        requestedRole
      );

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
  // PUBLIC API
  // ==========================================================

  const GHARDashboard = {

    version:
      CONFIG.VERSION,

    config:
      CONFIG,

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

    getUserRoles,

    setRole,

    normalizeRole,

    normalizeRoles,

    isValidRole,

    render,

    renderSummary,

    renderCollections,

    renderActivities,

    renderQuickActions,

    setLoading

  };


  // ==========================================================
  // GLOBAL EXPORT
  // ==========================================================

  window.GHARDashboard =
    GHARDashboard;


  // Compatibility alias

  window.GHAR_DASHBOARD =
    GHARDashboard;


  // ==========================================================
  // AUTO INITIALIZATION
  // ==========================================================

  function autoInit() {

    if (
      document.body.dataset.dashboardAuto ===
      "false"
    ) {

      return;

    }

    init();

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      autoInit,
      {
        once: true
      }
    );

  } else {

    autoInit();

  }


})(window, document);