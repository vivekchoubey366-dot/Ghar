// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/auth.js
// Authentication Manager
// ============================================================

"use strict";

(function (window) {

  // ----------------------------------------------------------
  // DEPENDENCY CHECK
  // ----------------------------------------------------------

  const GHAR = window.GHAR || {};

  const CONFIG = GHAR.config || {};
  const CONSTANTS = GHAR.constants || {};
  const STORAGE = GHAR.storage || {};
  const API = GHAR.api || {};

  // ----------------------------------------------------------
  // CONFIGURATION
  // ----------------------------------------------------------

  const AUTH_CONFIG = {

    loginPage:
      CONFIG.routes?.login ||
      "/login.html",

    signupPage:
      CONFIG.routes?.signup ||
      "/sign-up.html",

    roleSelectionPage:
      CONFIG.routes?.roleSelection ||
      "/role-selection.html",

    dashboardPages: {

      buyer:
        "/buyer/index.html",

      seller:
        "/seller/index.html",

      tenant:
        "/tenant/index.html",

      admin:
        "/admin/admin-dashboard.html"

    },

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
      "ghar_role"

  };

  // ----------------------------------------------------------
  // AUTH STATE
  // ----------------------------------------------------------

  let currentUser = null;
  let authToken = null;
  let refreshToken = null;

  // ----------------------------------------------------------
  // STORAGE HELPERS
  // ----------------------------------------------------------

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

      console.error(
        "[GHAR AUTH] Storage read error:",
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
        STORAGE.set(key, value);
        return;
      }

      if (
        typeof value === "object"
      ) {
        localStorage.setItem(
          key,
          JSON.stringify(value)
        );
      } else {
        localStorage.setItem(
          key,
          value
        );
      }

    } catch (error) {

      console.error(
        "[GHAR AUTH] Storage write error:",
        error
      );

    }

  }

  function storageRemove(key) {

    try {

      if (
        STORAGE &&
        typeof STORAGE.remove === "function"
      ) {
        STORAGE.remove(key);
        return;
      }

      localStorage.removeItem(key);

    } catch (error) {

      console.error(
        "[GHAR AUTH] Storage remove error:",
        error
      );

    }

  }

  // ----------------------------------------------------------
  // LOAD STORED AUTH
  // ----------------------------------------------------------

  function loadStoredAuth() {

    authToken =
      storageGet(
        AUTH_CONFIG.tokenKey
      );

    refreshToken =
      storageGet(
        AUTH_CONFIG.refreshTokenKey
      );

    let storedUser =
      storageGet(
        AUTH_CONFIG.userKey
      );

    if (
      typeof storedUser === "string"
    ) {

      try {

        storedUser =
          JSON.parse(
            storedUser
          );

      } catch (_) {

        // Keep string only if JSON parsing fails.

      }

    }

    currentUser =
      storedUser || null;

    return {
      token: authToken,
      refreshToken,
      user: currentUser
    };

  }

  // ----------------------------------------------------------
  // SAVE AUTH
  // ----------------------------------------------------------

  function saveAuth(data = {}) {

    if (
      data.token
    ) {

      authToken =
        data.token;

      storageSet(
        AUTH_CONFIG.tokenKey,
        authToken
      );

    }

    if (
      data.accessToken
    ) {

      authToken =
        data.accessToken;

      storageSet(
        AUTH_CONFIG.tokenKey,
        authToken
      );

    }

    if (
      data.refreshToken
    ) {

      refreshToken =
        data.refreshToken;

      storageSet(
        AUTH_CONFIG.refreshTokenKey,
        refreshToken
      );

    }

    if (
      data.user
    ) {

      currentUser =
        data.user;

      storageSet(
        AUTH_CONFIG.userKey,
        currentUser
      );

    }

    if (
      data.role
    ) {

      storageSet(
        AUTH_CONFIG.roleKey,
        data.role
      );

    }

    return getAuthState();

  }

  // ----------------------------------------------------------
  // CLEAR AUTH
  // ----------------------------------------------------------

  function clearAuth() {

    authToken = null;
    refreshToken = null;
    currentUser = null;

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

  }

  // ----------------------------------------------------------
  // AUTH STATE
  // ----------------------------------------------------------

  function isAuthenticated() {

    return Boolean(
      authToken
    );

  }

  function getUser() {

    return currentUser;

  }

  function getToken() {

    return authToken;

  }

  function getRefreshToken() {

    return refreshToken;

  }

  function getRole() {

    if (
      currentUser &&
      currentUser.role
    ) {
      return normalizeRole(
        currentUser.role
      );
    }

    const role =
      storageGet(
        AUTH_CONFIG.roleKey
      );

    return normalizeRole(
      role
    );

  }

  function getAuthState() {

    return {

      authenticated:
        isAuthenticated(),

      token:
        authToken,

      refreshToken:
        refreshToken,

      user:
        currentUser,

      role:
        getRole()

    };

  }

  // ----------------------------------------------------------
  // ROLE NORMALIZATION
  // ----------------------------------------------------------

  function normalizeRole(role) {

    if (!role) {
      return null;
    }

    const value =
      String(role)
        .trim()
        .toLowerCase();

    const aliases = {

      buyer:
        "buyer",

      buyers:
        "buyer",

      customer:
        "buyer",

      seller:
        "seller",

      sellers:
        "seller",

      owner:
        "seller",

      tenant:
        "tenant",

      tenants:
        "tenant",

      renter:
        "tenant",

      admin:
        "admin",

      administrator:
        "admin"

    };

    return (
      aliases[value] ||
      value
    );

  }

  // ----------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------

  async function login(credentials = {}) {

    const email =
      credentials.email ||
      credentials.username ||
      "";

    const password =
      credentials.password ||
      "";

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

    const payload = {

      email,
      password

    };

    let response;

    if (
      API &&
      typeof API.post === "function"
    ) {

      response =
        await API.post(
          "/auth/login",
          payload
        );

    } else {

      response =
        await fetch(
          "/api/auth/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            credentials:
              "include",

            body:
              JSON.stringify(
                payload
              )

          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.error ||
          data.message ||
          "Login failed."
        );

      }

      response = data;

    }

    const data =
      response?.data ||
      response;

    saveAuth({

      token:
        data.token ||
        data.accessToken,

      refreshToken:
        data.refreshToken,

      user:
        data.user,

      role:
        data.user?.role ||
        data.role

    });

    dispatchAuthEvent(
      "login"
    );

    return getAuthState();

  }

  // ----------------------------------------------------------
  // REGISTER
  // ----------------------------------------------------------

  async function register(payload = {}) {

    if (
      !payload.email
    ) {

      throw new Error(
        "Email is required."
      );

    }

    if (
      !payload.password
    ) {

      throw new Error(
        "Password is required."
      );

    }

    let response;

    if (
      API &&
      typeof API.post === "function"
    ) {

      response =
        await API.post(
          "/auth/register",
          payload
        );

    } else {

      response =
        await fetch(
          "/api/auth/register",
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            credentials:
              "include",

            body:
              JSON.stringify(
                payload
              )

          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.error ||
          data.message ||
          "Registration failed."
        );

      }

      response = data;

    }

    const data =
      response?.data ||
      response;

    if (
      data.token ||
      data.accessToken
    ) {

      saveAuth({

        token:
          data.token ||
          data.accessToken,

        refreshToken:
          data.refreshToken,

        user:
          data.user,

        role:
          data.user?.role ||
          data.role

      });

    }

    dispatchAuthEvent(
      "register"
    );

    return data;

  }

  // ----------------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------------

  async function logout(options = {}) {

    const redirect =
      options.redirect !== false;

    try {

      if (
        authToken &&
        API &&
        typeof API.post === "function"
      ) {

        await API.post(
          "/auth/logout",
          {}
        );

      } else if (
        authToken
      ) {

        await fetch(
          "/api/auth/logout",
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              ...(authToken
                ? {
                    Authorization:
                      `Bearer ${authToken}`
                  }
                : {})

            },

            credentials:
              "include"

          }
        );

      }

    } catch (error) {

      console.warn(
        "[GHAR AUTH] Logout API failed:",
        error
      );

    } finally {

      clearAuth();

      dispatchAuthEvent(
        "logout"
      );

      if (
        redirect
      ) {

        window.location.href =
          AUTH_CONFIG.loginPage;

      }

    }

  }

  // ----------------------------------------------------------
  // REFRESH TOKEN
  // ----------------------------------------------------------

  async function refresh() {

    if (
      !refreshToken
    ) {

      return false;

    }

    try {

      let response;

      if (
        API &&
        typeof API.post === "function"
      ) {

        response =
          await API.post(
            "/auth/refresh",
            {
              refreshToken
            }
          );

      } else {

        const request =
          await fetch(
            "/api/auth/refresh",
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
                  refreshToken
                })

            }
          );

        response =
          await request.json();

        if (
          !request.ok
        ) {

          throw new Error(
            response.error ||
            "Token refresh failed."
          );

        }

      }

      const data =
        response?.data ||
        response;

      if (
        !data.token &&
        !data.accessToken
      ) {

        return false;

      }

      saveAuth({

        token:
          data.token ||
          data.accessToken,

        refreshToken:
          data.refreshToken ||
          refreshToken,

        user:
          data.user ||
          currentUser,

        role:
          data.user?.role ||
          data.role ||
          getRole()

      });

      dispatchAuthEvent(
        "refresh"
      );

      return true;

    } catch (error) {

      console.warn(
        "[GHAR AUTH] Refresh failed:",
        error
      );

      clearAuth();

      return false;

    }

  }

  // ----------------------------------------------------------
  // CURRENT USER
  // ----------------------------------------------------------

  async function fetchCurrentUser() {

    if (
      !authToken
    ) {

      return null;

    }

    try {

      let response;

      if (
        API &&
        typeof API.get === "function"
      ) {

        response =
          await API.get(
            "/users/me"
          );

      } else {

        const request =
          await fetch(
            "/api/users/me",
            {

              method: "GET",

              headers: {

                Authorization:
                  `Bearer ${authToken}`

              },

              credentials:
                "include"

            }
          );

        response =
          await request.json();

        if (
          !request.ok
        ) {

          throw new Error(
            response.error ||
            "Unable to fetch user."
          );

        }

      }

      const data =
        response?.data ||
        response;

      if (
        data.user
      ) {

        currentUser =
          data.user;

      } else if (
        data.id ||
        data._id ||
        data.email
      ) {

        currentUser =
          data;

      }

      if (
        currentUser
      ) {

        storageSet(
          AUTH_CONFIG.userKey,
          currentUser
        );

      }

      return currentUser;

    } catch (error) {

      console.error(
        "[GHAR AUTH] User fetch failed:",
        error
      );

      return null;

    }

  }

  // ----------------------------------------------------------
  // ROLE CHECKS
  // ----------------------------------------------------------

  function hasRole(role) {

    return (
      getRole() ===
      normalizeRole(role)
    );

  }

  function hasAnyRole(roles = []) {

    const userRole =
      getRole();

    return roles
      .map(normalizeRole)
      .includes(userRole);

  }

  function isBuyer() {

    return hasRole(
      "buyer"
    );

  }

  function isSeller() {

    return hasRole(
      "seller"
    );

  }

  function isTenant() {

    return hasRole(
      "tenant"
    );

  }

  function isAdmin() {

    return hasRole(
      "admin"
    );

  }

  // ----------------------------------------------------------
  // ROLE REDIRECT
  // ----------------------------------------------------------

  function getDashboardForRole(
    role
  ) {

    const normalized =
      normalizeRole(role);

    return (
      AUTH_CONFIG
        .dashboardPages[
          normalized
        ] ||
      "/dashboard.html"
    );

  }

  function redirectByRole(
    role
  ) {

    window.location.href =
      getDashboardForRole(
        role ||
        getRole()
      );

  }

  // ----------------------------------------------------------
  // REQUIRE AUTH
  // ----------------------------------------------------------

  function requireAuth(
    options = {}
  ) {

    const {

      roles = null,

      redirect =
        AUTH_CONFIG.loginPage,

      redirectIfAuthenticated =
        false

    } = options;

    if (
      !isAuthenticated()
    ) {

      if (
        redirect
      ) {

        const returnUrl =
          encodeURIComponent(
            window.location.href
          );

        window.location.href =
          `${redirect}?return=${returnUrl}`;

      }

      return false;

    }

    if (
      redirectIfAuthenticated &&
      isAuthenticated()
    ) {

      redirectByRole();

      return false;

    }

    if (
      roles
    ) {

      const allowedRoles =
        Array.isArray(roles)
          ? roles
          : [roles];

      if (
        !hasAnyRole(
          allowedRoles
        )
      ) {

        window.location.href =
          "/404.html";

        return false;

      }

    }

    return true;

  }

  // ----------------------------------------------------------
  // REQUIRE GUEST
  // ----------------------------------------------------------

  function requireGuest() {

    if (
      isAuthenticated()
    ) {

      redirectByRole();

      return false;

    }

    return true;

  }

  // ----------------------------------------------------------
  // SESSION INITIALIZATION
  // ----------------------------------------------------------

  async function initialize() {

    loadStoredAuth();

    if (
      !authToken
    ) {

      return getAuthState();

    }

    // Validate/refresh session where possible.

    if (
      typeof fetch === "function"
    ) {

      try {

        const response =
          await fetch(
            "/api/auth/me",
            {

              method: "GET",

              headers: {

                ...(authToken
                  ? {
                      Authorization:
                        `Bearer ${authToken}`
                    }
                  : {})

              },

              credentials:
                "include"

            }
          );

        if (
          response.ok
        ) {

          const data =
            await response.json();

          const user =
            data.user ||
            data.data?.user ||
            data.data ||
            data;

          if (
            user
          ) {

            currentUser =
              user;

            storageSet(
              AUTH_CONFIG.userKey,
              user
            );

          }

        } else if (
          response.status === 401
        ) {

          const refreshed =
            await refresh();

          if (
            refreshed
          ) {

            await fetchCurrentUser();

          }

        }

      } catch (error) {

        console.warn(
          "[GHAR AUTH] Session check failed:",
          error
        );

      }

    }

    dispatchAuthEvent(
      "initialized"
    );

    return getAuthState();

  }

  // ----------------------------------------------------------
  // AUTH EVENT
  // ----------------------------------------------------------

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

    } catch (_) {

      // Older browser fallback.

    }

  }

  // ----------------------------------------------------------
  // AUTH GUARD FOR HTML PAGES
  // ----------------------------------------------------------

  function protectPage(
    options = {}
  ) {

    return requireAuth(
      options
    );

  }

  // ----------------------------------------------------------
  // LOGGED-IN USER DISPLAY
  // ----------------------------------------------------------

  function getDisplayName() {

    if (
      !currentUser
    ) {

      return "Guest";

    }

    return (
      currentUser.name ||
      currentUser.fullName ||
      currentUser.full_name ||
      currentUser.email ||
      "GHAR User"
    );

  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  GHAR.auth = {

    initialize,

    login,

    register,

    logout,

    refresh,

    fetchCurrentUser,

    saveAuth,

    clearAuth,

    isAuthenticated,

    getUser,

    getToken,

    getRefreshToken,

    getRole,

    getAuthState,

    normalizeRole,

    hasRole,

    hasAnyRole,

    isBuyer,

    isSeller,

    isTenant,

    isAdmin,

    getDashboardForRole,

    redirectByRole,

    requireAuth,

    requireGuest,

    protectPage,

    getDisplayName

  };

  // ----------------------------------------------------------
  // GLOBAL ALIAS
  // ----------------------------------------------------------

  window.GHAR =
    GHAR;

  // ----------------------------------------------------------
  // INITIAL LOAD
  // ----------------------------------------------------------

  loadStoredAuth();

})(window);