// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/storage.js
// Centralized Client Storage Manager
// ============================================================

"use strict";

(function (window) {

  // ==========================================================
  // STORAGE KEYS
  // ==========================================================

  const KEYS = Object.freeze({

    ACCESS_TOKEN: "ghar_access_token",
    REFRESH_TOKEN: "ghar_refresh_token",

    USER: "ghar_user",
    USER_ID: "ghar_user_id",
    USER_ROLE: "ghar_user_role",

    SESSION: "ghar_session",

    PREFERENCES: "ghar_preferences",

    THEME: "ghar_theme",
    LANGUAGE: "ghar_language",

    FAVOURITES: "ghar_favourites",
    SAVED_PROPERTIES: "ghar_saved_properties",
    RECENT_PROPERTIES: "ghar_recent_properties",

    SEARCHES: "ghar_property_searches",
    COMPARE: "ghar_compare",

    CART: "ghar_cart",

    NOTIFICATIONS: "ghar_notifications",

    AI_CONVERSATION: "ghar_ai_conversation",

    REDIRECT_AFTER_LOGIN:
      "ghar_redirect_after_login"

  });


  // ==========================================================
  // SAFE STORAGE DETECTION
  // ==========================================================

  function getStorage(type) {

    try {

      const storage =
        type === "session"
          ? window.sessionStorage
          : window.localStorage;

      const testKey =
        "__ghar_storage_test__";

      storage.setItem(
        testKey,
        "1"
      );

      storage.removeItem(
        testKey
      );

      return storage;

    } catch (error) {

      console.warn(
        "GHAR storage unavailable:",
        error
      );

      return null;

    }

  }


  const local =
    getStorage("local");

  const session =
    getStorage("session");


  // ==========================================================
  // SERIALIZATION
  // ==========================================================

  function serialize(value) {

    try {

      return JSON.stringify(value);

    } catch (error) {

      console.error(
        "GHAR storage serialization error:",
        error
      );

      return null;

    }

  }


  function deserialize(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return null;

    }

    try {

      return JSON.parse(value);

    } catch (error) {

      console.warn(
        "GHAR storage parse error:",
        error
      );

      return null;

    }

  }


  // ==========================================================
  // LOCAL STORAGE
  // ==========================================================

  function set(
    key,
    value
  ) {

    if (!local) {
      return false;
    }

    const serialized =
      serialize(value);

    if (serialized === null) {
      return false;
    }

    try {

      local.setItem(
        key,
        serialized
      );

      return true;

    } catch (error) {

      console.error(
        "GHAR localStorage set error:",
        error
      );

      return false;

    }

  }


  function get(
    key,
    fallback = null
  ) {

    if (!local) {
      return fallback;
    }

    try {

      const value =
        local.getItem(key);

      if (value === null) {
        return fallback;
      }

      const parsed =
        deserialize(value);

      return parsed === null
        ? fallback
        : parsed;

    } catch (error) {

      console.error(
        "GHAR localStorage get error:",
        error
      );

      return fallback;

    }

  }


  function remove(
    key
  ) {

    if (!local) {
      return false;
    }

    try {

      local.removeItem(key);

      return true;

    } catch (error) {

      console.error(
        "GHAR localStorage remove error:",
        error
      );

      return false;

    }

  }


  function has(
    key
  ) {

    if (!local) {
      return false;
    }

    return local.getItem(key) !== null;

  }


  // ==========================================================
  // SESSION STORAGE
  // ==========================================================

  function sessionSet(
    key,
    value
  ) {

    if (!session) {
      return false;
    }

    const serialized =
      serialize(value);

    if (serialized === null) {
      return false;
    }

    try {

      session.setItem(
        key,
        serialized
      );

      return true;

    } catch (error) {

      console.error(
        "GHAR sessionStorage set error:",
        error
      );

      return false;

    }

  }


  function sessionGet(
    key,
    fallback = null
  ) {

    if (!session) {
      return fallback;
    }

    try {

      const value =
        session.getItem(key);

      if (value === null) {
        return fallback;
      }

      const parsed =
        deserialize(value);

      return parsed === null
        ? fallback
        : parsed;

    } catch (error) {

      console.error(
        "GHAR sessionStorage get error:",
        error
      );

      return fallback;

    }

  }


  function sessionRemove(
    key
  ) {

    if (!session) {
      return false;
    }

    try {

      session.removeItem(key);

      return true;

    } catch (error) {

      console.error(
        "GHAR sessionStorage remove error:",
        error
      );

      return false;

    }

  }


  // ==========================================================
  // AUTH STORAGE
  // ==========================================================

  function setAccessToken(
    token
  ) {

    if (!token) {
      return false;
    }

    return set(
      KEYS.ACCESS_TOKEN,
      token
    );

  }


  function getAccessToken() {

    return get(
      KEYS.ACCESS_TOKEN,
      null
    );

  }


  function removeAccessToken() {

    return remove(
      KEYS.ACCESS_TOKEN
    );

  }


  function setRefreshToken(
    token
  ) {

    if (!token) {
      return false;
    }

    return set(
      KEYS.REFRESH_TOKEN,
      token
    );

  }


  function getRefreshToken() {

    return get(
      KEYS.REFRESH_TOKEN,
      null
    );

  }


  function setUser(
    user
  ) {

    if (!user) {
      return false;
    }

    set(
      KEYS.USER,
      user
    );

    if (user.id) {

      set(
        KEYS.USER_ID,
        user.id
      );

    }

    if (user.role) {

      set(
        KEYS.USER_ROLE,
        user.role
      );

    }

    return true;

  }


  function getUser() {

    return get(
      KEYS.USER,
      null
    );

  }


  function getUserId() {

    return get(
      KEYS.USER_ID,
      null
    );

  }


  function getUserRole() {

    return get(
      KEYS.USER_ROLE,
      null
    );

  }


  // ==========================================================
  // PREFERENCES
  // ==========================================================

  function getPreferences() {

    return get(
      KEYS.PREFERENCES,
      {}
    );

  }


  function setPreferences(
    preferences
  ) {

    return set(
      KEYS.PREFERENCES,
      preferences || {}
    );

  }


  function updatePreferences(
    updates
  ) {

    const current =
      getPreferences();

    const updated = {
      ...current,
      ...(updates || {})
    };

    setPreferences(
      updated
    );

    return updated;

  }


  // ==========================================================
  // FAVOURITES
  // ==========================================================

  function getFavourites() {

    return get(
      KEYS.FAVOURITES,
      []
    );

  }


  function setFavourites(
    properties
  ) {

    return set(
      KEYS.FAVOURITES,
      Array.isArray(properties)
        ? properties
        : []
    );

  }


  function addFavourite(
    propertyId
  ) {

    if (!propertyId) {
      return false;
    }

    const favourites =
      getFavourites();

    if (
      !favourites.includes(
        propertyId
      )
    ) {

      favourites.push(
        propertyId
      );

    }

    return setFavourites(
      favourites
    );

  }


  function removeFavourite(
    propertyId
  ) {

    const favourites =
      getFavourites()
        .filter(
          id => id !== propertyId
        );

    return setFavourites(
      favourites
    );

  }


  function isFavourite(
    propertyId
  ) {

    return getFavourites()
      .includes(propertyId);

  }


  // ==========================================================
  // SAVED PROPERTIES
  // ==========================================================

  function getSavedProperties() {

    return get(
      KEYS.SAVED_PROPERTIES,
      []
    );

  }


  function setSavedProperties(
    properties
  ) {

    return set(
      KEYS.SAVED_PROPERTIES,
      Array.isArray(properties)
        ? properties
        : []
    );

  }


  // ==========================================================
  // RECENT PROPERTIES
  // ==========================================================

  function getRecentProperties() {

    return get(
      KEYS.RECENT_PROPERTIES,
      []
    );

  }


  function addRecentProperty(
    propertyId
  ) {

    if (!propertyId) {
      return false;
    }

    let recent =
      getRecentProperties();

    recent =
      recent.filter(
        id => id !== propertyId
      );

    recent.unshift(
      propertyId
    );

    // Keep latest 20
    recent =
      recent.slice(
        0,
        20
      );

    return set(
      KEYS.RECENT_PROPERTIES,
      recent
    );

  }


  // ==========================================================
  // PROPERTY SEARCHES
  // ==========================================================

  function getSearches() {

    return get(
      KEYS.SEARCHES,
      []
    );

  }


  function saveSearch(
    search
  ) {

    if (!search) {
      return false;
    }

    let searches =
      getSearches();

    searches.unshift({
      ...search,
      savedAt:
        new Date().toISOString()
    });

    searches =
      searches.slice(
        0,
        20
      );

    return set(
      KEYS.SEARCHES,
      searches
    );

  }


  // ==========================================================
  // COMPARE
  // ==========================================================

  function getCompare() {

    return get(
      KEYS.COMPARE,
      []
    );

  }


  function setCompare(
    properties
  ) {

    return set(
      KEYS.COMPARE,
      Array.isArray(properties)
        ? properties.slice(0, 4)
        : []
    );

  }


  function addCompare(
    propertyId
  ) {

    if (!propertyId) {
      return false;
    }

    const compare =
      getCompare();

    if (
      !compare.includes(
        propertyId
      )
    ) {

      compare.push(
        propertyId
      );

    }

    return setCompare(
      compare
    );

  }


  function removeCompare(
    propertyId
  ) {

    return setCompare(
      getCompare()
        .filter(
          id => id !== propertyId
        )
    );

  }


  // ==========================================================
  // REDIRECT
  // ==========================================================

  function setRedirect(
    url
  ) {

    return sessionSet(
      KEYS.REDIRECT_AFTER_LOGIN,
      url
    );

  }


  function getRedirect() {

    return sessionGet(
      KEYS.REDIRECT_AFTER_LOGIN,
      null
    );

  }


  function clearRedirect() {

    return sessionRemove(
      KEYS.REDIRECT_AFTER_LOGIN
    );

  }


  // ==========================================================
  // THEME
  // ==========================================================

  function setTheme(
    theme
  ) {

    return set(
      KEYS.THEME,
      theme
    );

  }


  function getTheme() {

    return get(
      KEYS.THEME,
      "system"
    );

  }


  // ==========================================================
  // LANGUAGE
  // ==========================================================

  function setLanguage(
    language
  ) {

    return set(
      KEYS.LANGUAGE,
      language
    );

  }


  function getLanguage() {

    return get(
      KEYS.LANGUAGE,
      "en"
    );

  }


  // ==========================================================
  // LOGOUT / CLEAR AUTH DATA
  // ==========================================================

  function clearAuth() {

    remove(
      KEYS.ACCESS_TOKEN
    );

    remove(
      KEYS.REFRESH_TOKEN
    );

    remove(
      KEYS.USER
    );

    remove(
      KEYS.USER_ID
    );

    remove(
      KEYS.USER_ROLE
    );

    sessionRemove(
      KEYS.SESSION
    );

  }


  // ==========================================================
  // COMPLETE RESET
  // ==========================================================

  function clearAll() {

    if (local) {

      try {

        local.clear();

      } catch (error) {

        console.error(
          "GHAR localStorage clear error:",
          error
        );

      }

    }

    if (session) {

      try {

        session.clear();

      } catch (error) {

        console.error(
          "GHAR sessionStorage clear error:",
          error
        );

      }

    }

  }


  // ==========================================================
  // PUBLIC API
  // ==========================================================

  window.GHARStorage = Object.freeze({

    KEYS,

    set,
    get,
    remove,
    has,

    sessionSet,
    sessionGet,
    sessionRemove,

    setAccessToken,
    getAccessToken,
    removeAccessToken,

    setRefreshToken,
    getRefreshToken,

    setUser,
    getUser,
    getUserId,
    getUserRole,

    getPreferences,
    setPreferences,
    updatePreferences,

    getFavourites,
    setFavourites,
    addFavourite,
    removeFavourite,
    isFavourite,

    getSavedProperties,
    setSavedProperties,

    getRecentProperties,
    addRecentProperty,

    getSearches,
    saveSearch,

    getCompare,
    setCompare,
    addCompare,
    removeCompare,

    setRedirect,
    getRedirect,
    clearRedirect,

    setTheme,
    getTheme,

    setLanguage,
    getLanguage,

    clearAuth,
    clearAll

  });


  // ==========================================================
  // READY EVENT
  // ==========================================================

  window.dispatchEvent(
    new CustomEvent(
      "ghar:storage-ready"
    )
  );


})(window);