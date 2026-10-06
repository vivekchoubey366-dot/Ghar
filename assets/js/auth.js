// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/auth.js
// Enterprise Authentication & Session Manager
// ============================================================

"use strict";

(function (window, document) {

  // ==========================================================
  // GHAR NAMESPACE
  // ==========================================================

  const GHAR = window.GHAR = window.GHAR || {};

  const CONFIG = GHAR.config || {};
  const CONSTANTS = GHAR.constants || {};
  const STORAGE = GHAR.storage || {};
  const API = GHAR.api || {};

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const AUTH_CONFIG = Object.freeze({

    apiBase:
      CONFIG.API_BASE_URL ||
      CONFIG.apiBase ||
      "/api",

    loginPage:
      CONFIG.routes?.login ||
      "/login.html",

    signupPage:
      CONFIG.routes?.signup ||
      "/sign-up.html",

    roleSelectionPage:
      CONFIG.routes?.roleSelection ||
      "/role-selection.html",

    forbiddenPage:
      CONFIG.routes?.forbidden ||
      "/404.html",

    dashboardPages: Object.freeze({

      buyer:
        "/buyer/index.html",

      seller:
        "/seller/index.html",

      tenant:
        "/tenant/index.html",

      agent:
        "/agent/index.html",

      admin:
        "/admin/admin-dashboard.html"

    }),

    tokenKey:
      CONSTANTS.STORAGE_KEYS?.AUTH_TOKEN ||
      "ghar_auth_token",

    refreshTokenKey:
      CONSTANTS.STORAGE_KEYS?.REFRESH_TOKEN ||
      "ghar_refresh_token",

    userKey:
      CONSTANTS.STORAGE_KEYS?.USER ||
      "ghar_user",

    roleKey:
      CONSTANTS.STORAGE_KEYS?.ROLE ||
      "ghar_role",

    rolesKey:
      CONSTANTS.STORAGE_KEYS?.ROLES ||
      "ghar_roles",

    sessionKey:
      CONSTANTS.STORAGE_KEYS?.SESSION ||
      "ghar_auth_session",

    requestTimeout:
      Number(
        CONFIG.AUTH_REQUEST_TIMEOUT ||
        15000
      ),

    maxRefreshAttempts: 1

  });

  // ==========================================================
  // ROLE DEFINITIONS
  // ==========================================================

  const ROLES = Object.freeze({

    GUEST: "guest",
    BUYER: "buyer",
    SELLER: "seller",
    TENANT: "tenant",
    AGENT: "agent",
    ADMIN: "admin"

  });

  const VALID_ROLES = Object.freeze(
    Object.values(ROLES)
  );

  const ROLE_ALIASES = Object.freeze({

    guest:
      ROLES.GUEST,

    buyer:
      ROLES.BUYER,

    buyers:
      ROLES.BUYER,

    customer:
      ROLES.BUYER,

    purchaser:
      ROLES.BUYER,

    seller:
      ROLES.SELLER,

    sellers:
      ROLES.SELLER,

    owner:
      ROLES.SELLER,

    landlord:
      ROLES.SELLER,

    tenant:
      ROLES.TENANT,

    tenants:
      ROLES.TENANT,

    renter:
      ROLES.TENANT,

    agent:
      ROLES.AGENT,

    broker:
      ROLES.AGENT,

    realtor:
      ROLES.AGENT,

    admin:
      ROLES.ADMIN,

    administrator:
      ROLES.ADMIN,

    superadmin:
      ROLES.ADMIN

  });

  // ==========================================================
  // PRIVATE STATE
  // ==========================================================

  const state = {

    initialized: false,

    initializing: false,

    authenticated: false,

    currentUser: null,

    accessToken: null,

    refreshToken: null,

    roles: [],

    primaryRole: null,

    refreshPromise: null,

    refreshAttempts: 0,

    lastAuthError: null

  };

  // ==========================================================
  // GENERAL HELPERS
  // ==========================================================

  function isObject(value) {

    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );

  }

  function safeString(value) {

    return String(
      value ?? ""
    ).trim();

  }

  function normalizeRole(role) {

    if (!role) {
      return null;
    }

    const normalized =
      safeString(role)
        .toLowerCase()
        .replace(/[\s_-]+/g, "");

    return (
      ROLE_ALIASES[normalized] ||
      null
    );

  }

  function normalizeRoles(roles) {

    if (!roles) {
      return [];
    }

    const source =
      Array.isArray(roles)
        ? roles
        : [roles];

    return [
      ...new Set(
        source
          .map(normalizeRole)
          .filter(Boolean)
          .filter(
            role =>
              role !== ROLES.GUEST
          )
      )
    ];

  }

  function isValidRole(role) {

    return VALID_ROLES.includes(
      normalizeRole(role)
    );

  }

  // ==========================================================
  // STORAGE
  // ==========================================================

  function storageGet(key) {

    try {

      if (
        STORAGE &&
        typeof STORAGE.get === "function"
      ) {

        return STORAGE.get(key);

      }

      return localStorage.getItem(key);

    } catch (error) {

      console.warn(
        "[GHAR AUTH] Storage read failed:",
        error
      );

      return null;

    }

  }

  function storageSet(key, value) {

    try {

      if (
        STORAGE &&
        typeof STORAGE.set === "function"
      ) {

        STORAGE.set(
          key,
          value
        );

        return true;
      }

      const serialized =
        typeof value === "object"
          ? JSON.stringify(value)
          : String(value);

      localStorage.setItem(
        key,
        serialized
      );

      return true;

    } catch (error) {

      console.warn(
        "[GHAR AUTH] Storage write failed:",
        error
      );

      return false;

    }

  }

  function storageRemove(key) {

    try {

      if (
        STORAGE &&
        typeof STORAGE.remove === "function"
      ) {

        STORAGE.remove(key);

        return true;
      }

      localStorage.removeItem(key);

      return true;

    } catch (error) {

      console.warn(
        "[GHAR AUTH] Storage remove failed:",
        error
      );

      return false;

    }

  }

  function parseStoredValue(value) {

    if (
      typeof value !== "string"
    ) {

      return value;

    }

    try {

      return JSON.parse(value);

    } catch {

      return value;

    }

  }

  // ==========================================================
  // TOKEN STORAGE
  // ==========================================================

  function loadStoredAuth() {

    state.accessToken =
      storageGet(
        AUTH_CONFIG.tokenKey
      );

    state.refreshToken =
      storageGet(
        AUTH_CONFIG.refreshTokenKey
      );

    state.currentUser =
      parseStoredValue(
        storageGet(
          AUTH_CONFIG.userKey
        )
      );

    const storedRole =
      storageGet(
        AUTH_CONFIG.roleKey
      );

    const storedRoles =
      parseStoredValue(
        storageGet(
          AUTH_CONFIG.rolesKey
        )
      );

    const userRoles =
      state.currentUser?.roles ||
      state.currentUser?.role ||
      storedRoles ||
      storedRole ||
      [];

    state.roles =
      normalizeRoles(
        userRoles
      );

    const primary =
      normalizeRole(
        state.currentUser?.role ||
        storedRole ||
        state.roles[0]
      );

    state.primaryRole =
      primary &&
      primary !== ROLES.GUEST
        ? primary
        : (
            state.roles[0] ||
            null
          );

    state.authenticated =
      Boolean(
        state.accessToken
      );

    return getAuthState();

  }

  // ==========================================================
  // SAVE AUTH
  // ==========================================================

  function saveAuth(data = {}) {

    const payload =
      isObject(data)
        ? data
        : {};

    const accessToken =
      payload.accessToken ||
      payload.token ||
      payload.access_token;

    const refreshToken =
      payload.refreshToken ||
      payload.refresh_token;

    const user =
      payload.user ||
      payload.account ||
      payload.profile;

    if (accessToken) {

      state.accessToken =
        safeString(
          accessToken
        );

      storageSet(
        AUTH_CONFIG.tokenKey,
        state.accessToken
      );

    }

    if (refreshToken) {

      state.refreshToken =
        safeString(
          refreshToken
        );

      storageSet(
        AUTH_CONFIG.refreshTokenKey,
        state.refreshToken
      );

    }

    if (user) {

      state.currentUser =
        user;

      storageSet(
        AUTH_CONFIG.userKey,
        user
      );

    }

    const extractedRoles =
      payload.roles ||
      user?.roles ||
      payload.role ||
      user?.role;

    if (extractedRoles) {

      state.roles =
        normalizeRoles(
          extractedRoles
        );

      const primary =
        normalizeRole(
          user?.role ||
          payload.role ||
          state.roles[0]
        );

      state.primaryRole =
        primary ||
        state.roles[0] ||
        null;

      storageSet(
        AUTH_CONFIG.rolesKey,
        state.roles
      );

      if (state.primaryRole) {

        storageSet(
          AUTH_CONFIG.roleKey,
          state.primaryRole
        );

      }

    }

    state.authenticated =
      Boolean(
        state.accessToken
      );

    state.lastAuthError =
      null;

    return getAuthState();

  }

  // ==========================================================
  // CLEAR AUTH
  // ==========================================================

  function clearAuth() {

    state.authenticated =
      false;

    state.currentUser =
      null;

    state.accessToken =
      null;

    state.refreshToken =
      null;

    state.roles =
      [];

    state.primaryRole =
      null;

    state.refreshAttempts =
      0;

    state.lastAuthError =
      null;

    storageRemove(
      AUTH_CONFIG.tokenKey
    );

    storageRemove(
      AUTH_CONFIG.refreshTokenKey
    );

    storageRemove(
      AUTH_CONFIG.userKey
    );

    storageRemove(
      AUTH_CONFIG.roleKey
    );

    storageRemove(
      AUTH_CONFIG.rolesKey
    );

    storageRemove(
      AUTH_CONFIG.sessionKey
    );

  }

  // ==========================================================
  // AUTH STATE
  // ==========================================================

  function isAuthenticated() {

    return (
      state.authenticated &&
      Boolean(
        state.accessToken
      )
    );

  }

  function getUser() {

    return state.currentUser;

  }

  function getToken() {

    return state.accessToken;

  }

  function getRefreshToken() {

    return state.refreshToken;

  }

  function getRole() {

    return (
      state.primaryRole ||
      null
    );

  }

  function getRoles() {

    return [
      ...state.roles
    ];

  }

  function getAuthState() {

    return {

      authenticated:
        isAuthenticated(),

      user:
        state.currentUser,

      token:
        state.accessToken,

      refreshToken:
        state.refreshToken,

      role:
        getRole(),

      roles:
        getRoles(),

      initialized:
        state.initialized

    };

  }

  // ==========================================================
  // API REQUEST
  // ==========================================================

  async function request(
    endpoint,
    options = {},
    retry = true
  ) {

    const url =
      endpoint.startsWith("http")
        ? endpoint
        : `${AUTH_CONFIG.apiBase}${endpoint}`;

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        AUTH_CONFIG.requestTimeout
      );

    const headers = {

      "Content-Type":
        "application/json",

      ...(options.headers || {})

    };

    if (
      state.accessToken &&
      !headers.Authorization
    ) {

      headers.Authorization =
        `Bearer ${state.accessToken}`;

    }

    try {

      let response;

      if (
        API &&
        typeof API.request === "function"
      ) {

        response =
          await API.request(
            endpoint,
            {
              ...options,
              headers,
              signal:
                controller.signal
            }
          );

      } else {

        response =
          await fetch(
            url,
            {
              ...options,
              headers,
              credentials:
                "include",
              signal:
                controller.signal
            }
          );

      }

      if (
        response?.status === 401 &&
        retry &&
        state.refreshToken
      ) {

        const refreshed =
          await refresh();

        if (refreshed) {

          return request(
            endpoint,
            options,
            false
          );

        }

      }

      if (
        response &&
        typeof response.json === "function"
      ) {

        const data =
          await response.json()
            .catch(
              () => ({})
            );

        if (
          !response.ok
        ) {

          const error =
            new Error(
              data?.message ||
              data?.error ||
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

      return response;

    } finally {

      clearTimeout(
        timeout
      );

    }

  }

  // ==========================================================
  // LOGIN
  // ==========================================================

  async function login(
    credentials = {}
  ) {

    const email =
      safeString(
        credentials.email ||
        credentials.username
      );

    const password =
      safeString(
        credentials.password
      );

    if (!email) {

      throw new Error(
        "Email or username is required."
      );

    }

    if (!password) {

      throw new Error(
        "Password is required."
      );

    }

    const response =
      await request(
        "/auth/login",
        {
          method: "POST",
          body:
            JSON.stringify({
              email,
              password
            })
        },
        false
      );

    const data =
      response?.data ||
      response;

    if (
      !data?.token &&
      !data?.accessToken
    ) {

      throw new Error(
        "Login succeeded but no authentication token was returned."
      );

    }

    saveAuth(
      data
    );

    dispatchAuthEvent(
      "login"
    );

    return getAuthState();

  }

  // ==========================================================
  // REGISTER
  // ==========================================================

  async function register(
    payload = {}
  ) {

    if (
      !safeString(
        payload.email
      )
    ) {

      throw new Error(
        "Email is required."
      );

    }

    if (
      !safeString(
        payload.password
      )
    ) {

      throw new Error(
        "Password is required."
      );

    }

    const response =
      await request(
        "/auth/register",
        {
          method: "POST",
          body:
            JSON.stringify(
              payload
            )
        },
        false
      );

    const data =
      response?.data ||
      response;

    if (
      data?.token ||
      data?.accessToken
    ) {

      saveAuth(
        data
      );

    }

    dispatchAuthEvent(
      "register"
    );

    return data;

  }

  // ==========================================================
  // REFRESH TOKEN
  // ==========================================================

  async function refresh() {

    if (
      !state.refreshToken
    ) {

      return false;

    }

    // Prevent multiple simultaneous refresh requests.
    if (
      state.refreshPromise
    ) {

      return state.refreshPromise;

    }

    state.refreshPromise =
      (async () => {

        try {

          if (
            state.refreshAttempts >=
            AUTH_CONFIG.maxRefreshAttempts
          ) {

            clearAuth();

            return false;

          }

          state.refreshAttempts += 1;

          const response =
            await fetch(
              `${AUTH_CONFIG.apiBase}/auth/refresh`,
              {

                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                credentials:
                  "include",

                body:
                  JSON.stringify({
                    refreshToken:
                      state.refreshToken
                  })

              }
            );

          const data =
            await response
              .json()
              .catch(
                () => ({})
              );

          if (
            !response.ok
          ) {

            throw new Error(
              data?.message ||
              data?.error ||
              "Token refresh failed."
            );

          }

          const payload =
            data?.data ||
            data;

          const token =
            payload?.accessToken ||
            payload?.token;

          if (!token) {

            throw new Error(
              "Refresh response did not contain an access token."
            );

          }

          saveAuth({

            accessToken:
              token,

            refreshToken:
              payload?.refreshToken ||
              state.refreshToken,

            user:
              payload?.user ||
              state.currentUser,

            roles:
              payload?.roles ||
              payload?.user?.roles,

            role:
              payload?.role ||
              payload?.user?.role

          });

          state.refreshAttempts =
            0;

          dispatchAuthEvent(
            "refresh"
          );

          return true;

        } catch (error) {

          state.lastAuthError =
            error;

          clearAuth();

          dispatchAuthEvent(
            "session-expired"
          );

          return false;

        } finally {

          state.refreshPromise =
            null;

        }

      })();

    return state.refreshPromise;

  }

  // ==========================================================
  // CURRENT USER
  // ==========================================================

  async function fetchCurrentUser() {

    if (
      !state.accessToken
    ) {

      return null;

    }

    try {

      const response =
        await request(
          "/users/me",
          {
            method: "GET"
          }
        );

      const data =
        response?.data ||
        response;

      const user =
        data?.user ||
        data;

      if (
        user &&
        (
          user.id ||
          user._id ||
          user.email
        )
      ) {

        state.currentUser =
          user;

        storageSet(
          AUTH_CONFIG.userKey,
          user
        );

        const roles =
          user.roles ||
          user.role;

        state.roles =
          normalizeRoles(
            roles
          );

        state.primaryRole =
          normalizeRole(
            user.role
          ) ||
          state.roles[0] ||
          null;

        storageSet(
          AUTH_CONFIG.rolesKey,
          state.roles
        );

        if (
          state.primaryRole
        ) {

          storageSet(
            AUTH_CONFIG.roleKey,
            state.primaryRole
          );

        }

      }

      return state.currentUser;

    } catch (error) {

      state.lastAuthError =
        error;

      return null;

    }

  }

  // ==========================================================
  // ROLE CHECKING
  // ==========================================================

  function hasRole(role) {

    const normalized =
      normalizeRole(role);

    if (!normalized) {

      return false;

    }

    if (
      normalized === ROLES.GUEST
    ) {

      return !isAuthenticated();

    }

    return state.roles.includes(
      normalized
    );

  }

  function hasAnyRole(
    roles = []
  ) {

    return normalizeRoles(
      roles
    ).some(
      role =>
        hasRole(role)
    );

  }

  function hasAllRoles(
    roles = []
  ) {

    const normalized =
      normalizeRoles(
        roles
      );

    return (
      normalized.length > 0 &&
      normalized.every(
        role =>
          hasRole(role)
      )
    );

  }

  function isGuest() {

    return !isAuthenticated();

  }

  function isBuyer() {

    return hasRole(
      ROLES.BUYER
    );

  }

  function isSeller() {

    return hasRole(
      ROLES.SELLER
    );

  }

  function isTenant() {

    return hasRole(
      ROLES.TENANT
    );

  }

  function isAgent() {

    return hasRole(
      ROLES.AGENT
    );

  }

  function isAdmin() {

    return hasRole(
      ROLES.ADMIN
    );

  }

  // ==========================================================
  // DASHBOARD ROUTING
  // ==========================================================

  function getDashboardForRole(
    role
  ) {

    const normalized =
      normalizeRole(
        role
      );

    return (
      AUTH_CONFIG.dashboardPages[
        normalized
      ] ||
      "/dashboard.html"
    );

  }

  function redirectByRole(
    role
  ) {

    const targetRole =
      role ||
      getRole();

    window.location.assign(
      getDashboardForRole(
        targetRole
      )
    );

  }

  // ==========================================================
  // RETURN URL
  // ==========================================================

  function getCurrentReturnURL() {

    return (
      window.location.pathname +
      window.location.search +
      window.location.hash
    );

  }

  function buildLoginURL() {

    const current =
      getCurrentReturnURL();

    if (
      !current ||
      current === AUTH_CONFIG.loginPage
    ) {

      return AUTH_CONFIG.loginPage;

    }

    return (
      `${AUTH_CONFIG.loginPage}?return=` +
      encodeURIComponent(
        current
      )
    );

  }

  // ==========================================================
  // AUTH GUARD
  // ==========================================================

  function requireAuth(
    options = {}
  ) {

    const roles =
      options.roles || null;

    const redirect =
      options.redirect !== false;

    if (
      !isAuthenticated()
    ) {

      if (
        redirect
      ) {

        window.location.assign(
          buildLoginURL()
        );

      }

      return false;

    }

    if (
      roles
    ) {

      const allowed =
        Array.isArray(roles)
          ? roles
          : [roles];

      if (
        !hasAnyRole(
          allowed
        )
      ) {

        if (
          options.forbiddenRedirect !== false
        ) {

          window.location.assign(
            AUTH_CONFIG.forbiddenPage
          );

        }

        return false;

      }

    }

    return true;

  }

  // ==========================================================
  // GUEST GUARD
  // ==========================================================

  function requireGuest(
    options = {}
  ) {

    if (
      isAuthenticated()
    ) {

      if (
        options.redirect !== false
      ) {

        redirectByRole();

      }

      return false;

    }

    return true;

  }

  // ==========================================================
  // PAGE PROTECTION
  // ==========================================================

  function protectPage(
    options = {}
  ) {

    return requireAuth(
      options
    );

  }

  // ==========================================================
  // DISPLAY NAME
  // ==========================================================

  function getDisplayName() {

    const user =
      state.currentUser;

    if (!user) {

      return "Guest";

    }

    return (
      user.name ||
      user.fullName ||
      user.full_name ||
      user.username ||
      user.email ||
      "GHAR User"
    );

  }

  // ==========================================================
  // AUTH EVENTS
  // ==========================================================

  function dispatchAuthEvent(
    type
  ) {

    try {

      window.dispatchEvent(
        new CustomEvent(
          `ghar:auth:${type}`,
          {
            detail:
              getAuthState()
          }
        )
      );

    } catch (error) {

      console.warn(
        "[GHAR AUTH] Event dispatch failed:",
        error
      );

    }

  }

  // ==========================================================
  // SESSION INITIALIZATION
  // ==========================================================

  async function initialize() {

    if (
      state.initialized
    ) {

      return getAuthState();

    }

    if (
      state.initializing
    ) {

      return getAuthState();

    }

    state.initializing =
      true;

    try {

      loadStoredAuth();

      if (
        !state.accessToken
      ) {

        state.initialized =
          true;

        dispatchAuthEvent(
          "initialized"
        );

        return getAuthState();

      }

      const user =
        await fetchCurrentUser();

      if (!user) {

        if (
          state.refreshToken
        ) {

          const refreshed =
            await refresh();

          if (
            refreshed
          ) {

            await fetchCurrentUser();

          }

        }

      }

      state.authenticated =
        Boolean(
          state.accessToken
        );

      state.initialized =
        true;

      dispatchAuthEvent(
        "initialized"
      );

      return getAuthState();

    } catch (error) {

      state.lastAuthError =
        error;

      state.initialized =
        true;

      return getAuthState();

    } finally {

      state.initializing =
        false;

    }

  }

  // ==========================================================
  // LOGOUT
  // ==========================================================

  async function logout(
    options = {}
  ) {

    const shouldRedirect =
      options.redirect !== false;

    const token =
      state.accessToken;

    try {

      if (token) {

        await fetch(
          `${AUTH_CONFIG.apiBase}/auth/logout`,
          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`

            },

            credentials:
              "include"

          }
        ).catch(
          () => null
        );

      }

    } finally {

      clearAuth();

      dispatchAuthEvent(
        "logout"
      );

      if (
        shouldRedirect
      ) {

        window.location.assign(
          AUTH_CONFIG.loginPage
        );

      }

    }

  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  GHAR.auth = {

    ROLES,

    VALID_ROLES,

    initialize,

    login,

    register,

    logout,

    refresh,

    fetchCurrentUser,

    saveAuth,

    clearAuth,

    request,

    isAuthenticated,

    isGuest,

    getUser,

    getToken,

    getRefreshToken,

    getRole,

    getRoles,

    getAuthState,

    normalizeRole,

    normalizeRoles,

    isValidRole,

    hasRole,

    hasAnyRole,

    hasAllRoles,

    isBuyer,

    isSeller,

    isTenant,

    isAgent,

    isAdmin,

    getDashboardForRole,

    redirectByRole,

    requireAuth,

    requireGuest,

    protectPage,

    getDisplayName

  };

  // ==========================================================
  // GLOBAL ALIAS
  // ==========================================================

  window.GHAR_AUTH =
    GHAR.auth;

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
        initialize();
      },
      {
        once: true
      }
    );

  } else {

    initialize();

  }

})(window, document);