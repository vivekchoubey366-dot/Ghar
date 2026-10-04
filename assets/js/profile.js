// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/profile.js
// Shared Profile Management
// ============================================================

"use strict";

(function (window, document) {

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const GHAR_PROFILE = {

    version: "1.0.0",

    storageKeys: {
      profile: "ghar_profile",
      user: "ghar_user",
      token: "ghar_token"
    },

    selectors: {
      profileName: [
        "[data-profile-name]",
        "#profileName",
        ".profile-name"
      ],

      profileEmail: [
        "[data-profile-email]",
        "#profileEmail",
        ".profile-email"
      ],

      profilePhone: [
        "[data-profile-phone]",
        "#profilePhone",
        ".profile-phone"
      ],

      profileRole: [
        "[data-profile-role]",
        "#profileRole",
        ".profile-role"
      ],

      profileAvatar: [
        "[data-profile-avatar]",
        "#profileAvatar",
        ".profile-avatar"
      ],

      profileStatus: [
        "[data-profile-status]",
        "#profileStatus",
        ".profile-status"
      ]
    }

  };

  // ==========================================================
  // STORAGE HELPERS
  // ==========================================================

  function getStorage(key) {

    try {

      const value =
        localStorage.getItem(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value);

    } catch (error) {

      console.warn(
        "[GHAR PROFILE] Storage read failed:",
        error
      );

      return null;

    }

  }

  function setStorage(key, value) {

    try {

      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

      return true;

    } catch (error) {

      console.warn(
        "[GHAR PROFILE] Storage write failed:",
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
        "[GHAR PROFILE] Storage remove failed:",
        error
      );

    }

  }

  // ==========================================================
  // PROFILE NORMALIZATION
  // ==========================================================

  function normalizeProfile(profile) {

    if (!profile || typeof profile !== "object") {
      return null;
    }

    return {

      id:
        profile.id ||
        profile.userId ||
        profile.user_id ||
        null,

      name:
        profile.name ||
        profile.fullName ||
        profile.full_name ||
        profile.username ||
        "",

      firstName:
        profile.firstName ||
        profile.first_name ||
        "",

      lastName:
        profile.lastName ||
        profile.last_name ||
        "",

      email:
        profile.email ||
        "",

      phone:
        profile.phone ||
        profile.mobile ||
        profile.phoneNumber ||
        "",

      role:
        String(
          profile.role ||
          profile.userRole ||
          profile.user_role ||
          ""
        ).toLowerCase(),

      avatar:
        profile.avatar ||
        profile.avatarUrl ||
        profile.profileImage ||
        profile.profile_image ||
        "",

      verificationLevel:
        profile.verificationLevel ||
        profile.verification_level ||
        "UNVERIFIED",

      subscription:
        profile.subscription ||
        profile.subscription_plan ||
        "FREE",

      subscriptionPlan:
        profile.subscriptionPlan ||
        profile.subscription_plan ||
        "FREE",

      subscriptionStatus:
        profile.subscriptionStatus ||
        profile.subscription_status ||
        "inactive",

      subscriptionStart:
        profile.subscriptionStart ||
        profile.subscription_start ||
        null,

      subscriptionEnd:
        profile.subscriptionEnd ||
        profile.subscription_end ||
        null,

      address:
        profile.address ||
        "",

      city:
        profile.city ||
        "",

      state:
        profile.state ||
        "",

      country:
        profile.country ||
        "India",

      pincode:
        profile.pincode ||
        profile.postalCode ||
        "",

      createdAt:
        profile.createdAt ||
        profile.created_at ||
        null,

      updatedAt:
        profile.updatedAt ||
        profile.updated_at ||
        null

    };

  }

  // ==========================================================
  // GET PROFILE
  // ==========================================================

  function getProfile() {

    const storedProfile =
      getStorage(
        GHAR_PROFILE.storageKeys.profile
      );

    if (storedProfile) {

      return normalizeProfile(
        storedProfile
      );

    }

    const storedUser =
      getStorage(
        GHAR_PROFILE.storageKeys.user
      );

    if (storedUser) {

      return normalizeProfile(
        storedUser
      );

    }

    return null;

  }

  // ==========================================================
  // SAVE PROFILE
  // ==========================================================

  function saveProfile(profile) {

    const normalized =
      normalizeProfile(profile);

    if (!normalized) {
      return false;
    }

    setStorage(
      GHAR_PROFILE.storageKeys.profile,
      normalized
    );

    setStorage(
      GHAR_PROFILE.storageKeys.user,
      normalized
    );

    updateUI(normalized);

    return true;

  }

  // ==========================================================
  // UPDATE PROFILE
  // ==========================================================

  function updateProfile(updates) {

    const current =
      getProfile() || {};

    const updated = {

      ...current,

      ...updates,

      updatedAt:
        new Date().toISOString()

    };

    return saveProfile(updated);

  }

  // ==========================================================
  // CLEAR PROFILE
  // ==========================================================

  function clearProfile() {

    removeStorage(
      GHAR_PROFILE.storageKeys.profile
    );

    removeStorage(
      GHAR_PROFILE.storageKeys.user
    );

  }

  // ==========================================================
  // SELECTOR HELPER
  // ==========================================================

  function findElements(selectors) {

    const elements = [];

    selectors.forEach(selector => {

      document
        .querySelectorAll(selector)
        .forEach(element => {

          if (!elements.includes(element)) {
            elements.push(element);
          }

        });

    });

    return elements;

  }

  // ==========================================================
  // UPDATE PROFILE UI
  // ==========================================================

  function updateUI(profile) {

    if (!profile) {
      return;
    }

    // --------------------------------------------------------
    // NAME
    // --------------------------------------------------------

    findElements(
      GHAR_PROFILE.selectors.profileName
    ).forEach(element => {

      element.textContent =
        profile.name ||
        "GHAR User";

    });

    // --------------------------------------------------------
    // EMAIL
    // --------------------------------------------------------

    findElements(
      GHAR_PROFILE.selectors.profileEmail
    ).forEach(element => {

      element.textContent =
        profile.email ||
        "Not provided";

    });

    // --------------------------------------------------------
    // PHONE
    // --------------------------------------------------------

    findElements(
      GHAR_PROFILE.selectors.profilePhone
    ).forEach(element => {

      element.textContent =
        profile.phone ||
        "Not provided";

    });

    // --------------------------------------------------------
    // ROLE
    // --------------------------------------------------------

    findElements(
      GHAR_PROFILE.selectors.profileRole
    ).forEach(element => {

      element.textContent =
        formatRole(profile.role);

      element.dataset.role =
        profile.role || "";

    });

    // --------------------------------------------------------
    // VERIFICATION STATUS
    // --------------------------------------------------------

    findElements(
      GHAR_PROFILE.selectors.profileStatus
    ).forEach(element => {

      element.textContent =
        formatVerificationLevel(
          profile.verificationLevel
        );

      element.dataset.verification =
        profile.verificationLevel || "";

    });

    // --------------------------------------------------------
    // AVATAR
    // --------------------------------------------------------

    findElements(
      GHAR_PROFILE.selectors.profileAvatar
    ).forEach(element => {

      if (
        profile.avatar
      ) {

        if (
          element.tagName === "IMG"
        ) {

          element.src =
            profile.avatar;

          element.alt =
            profile.name ||
            "GHAR Profile";

        } else {

          element.style.backgroundImage =
            `url("${profile.avatar}")`;

        }

      }

    });

  }

  // ==========================================================
  // FORMAT ROLE
  // ==========================================================

  function formatRole(role) {

    if (!role) {
      return "User";
    }

    const roles = {

      buyer: "Buyer",

      seller: "Seller",

      tenant: "Tenant",

      agent: "Agent",

      admin: "Administrator",

      business: "Business",

      owner: "Owner"

    };

    return (
      roles[
        String(role).toLowerCase()
      ] ||
      String(role)
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, char =>
          char.toUpperCase()
        )
    );

  }

  // ==========================================================
  // FORMAT VERIFICATION LEVEL
  // ==========================================================

  function formatVerificationLevel(level) {

    const levels = {

      UNVERIFIED:
        "Unverified",

      BASIC_VERIFIED:
        "Basic Verified",

      OWNER_VERIFIED:
        "Owner Verified",

      DOCUMENT_VERIFIED:
        "Document Verified",

      PROPERTY_VERIFIED:
        "Property Verified"

    };

    return (
      levels[level] ||
      String(level || "Unverified")
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, char =>
          char.toUpperCase()
        )
    );

  }

  // ==========================================================
  // VERIFICATION CHECK
  // ==========================================================

  function isVerified(
    requiredLevel = "BASIC_VERIFIED"
  ) {

    const profile =
      getProfile();

    if (!profile) {
      return false;
    }

    const hierarchy = [

      "UNVERIFIED",

      "BASIC_VERIFIED",

      "OWNER_VERIFIED",

      "DOCUMENT_VERIFIED",

      "PROPERTY_VERIFIED"

    ];

    const currentIndex =
      hierarchy.indexOf(
        profile.verificationLevel
      );

    const requiredIndex =
      hierarchy.indexOf(
        requiredLevel
      );

    if (
      currentIndex === -1 ||
      requiredIndex === -1
    ) {

      return false;

    }

    return (
      currentIndex >= requiredIndex
    );

  }

  // ==========================================================
  // SUBSCRIPTION
  // ==========================================================

  function getSubscription() {

    const profile =
      getProfile();

    if (!profile) {

      return {

        plan: "FREE",

        status: "inactive",

        start: null,

        end: null

      };

    }

    return {

      plan:
        profile.subscriptionPlan ||
        "FREE",

      status:
        profile.subscriptionStatus ||
        "inactive",

      start:
        profile.subscriptionStart ||
        null,

      end:
        profile.subscriptionEnd ||
        null

    };

  }

  // ==========================================================
  // SUBSCRIPTION CHECK
  // ==========================================================

  function hasSubscription(
    plan
  ) {

    const subscription =
      getSubscription();

    if (
      subscription.status !==
      "active"
    ) {

      return plan === "FREE";

    }

    if (!plan) {
      return true;
    }

    const hierarchy = [

      "FREE",

      "BUYER_PLUS",

      "SELLER_PRO",

      "AGENT_PRO",

      "BUSINESS"

    ];

    const current =
      hierarchy.indexOf(
        subscription.plan
      );

    const required =
      hierarchy.indexOf(
        plan
      );

    if (
      current === -1 ||
      required === -1
    ) {

      return false;

    }

    return current >= required;

  }

  // ==========================================================
  // ROLE CHECK
  // ==========================================================

  function hasRole(role) {

    const profile =
      getProfile();

    if (!profile) {
      return false;
    }

    return (
      String(profile.role)
        .toLowerCase() ===
      String(role)
        .toLowerCase()
    );

  }

  // ==========================================================
  // MULTIPLE ROLE CHECK
  // ==========================================================

  function hasAnyRole(roles) {

    if (!Array.isArray(roles)) {
      return false;
    }

    return roles.some(
      role => hasRole(role)
    );

  }

  // ==========================================================
  // PROFILE COMPLETION
  // ==========================================================

  function getCompletion() {

    const profile =
      getProfile();

    if (!profile) {
      return 0;
    }

    const fields = [

      profile.name,

      profile.email,

      profile.phone,

      profile.role,

      profile.address,

      profile.city,

      profile.state,

      profile.pincode

    ];

    const completed =
      fields.filter(Boolean)
        .length;

    return Math.round(
      (completed / fields.length) *
      100
    );

  }

  // ==========================================================
  // INITIALIZE
  // ==========================================================

  function init() {

    const profile =
      getProfile();

    if (profile) {
      updateUI(profile);
    }

    document.dispatchEvent(
      new CustomEvent(
        "ghar:profile-ready",
        {
          detail: {
            profile
          }
        }
      )
    );

  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  window.GHARProfile = {

    version:
      GHAR_PROFILE.version,

    get:
      getProfile,

    save:
      saveProfile,

    update:
      updateProfile,

    clear:
      clearProfile,

    updateUI,

    isVerified,

    hasSubscription,

    getSubscription,

    hasRole,

    hasAnyRole,

    getCompletion,

    formatRole,

    formatVerificationLevel

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
      init
    );

  } else {

    init();

  }

})(window, document);