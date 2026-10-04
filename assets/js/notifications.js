// ============================================================
// GHAR - REAL ESTATE PLATFORM
// notifications.js
//
// Notification management for:
// Buyer / Seller / Tenant / Admin
//
// Flow:
//
// UI
//  ↓
// notifications.js
//  ↓
// API
//  ↓
// /api/notifications
//  ↓
// Controller
//  ↓
// Service
//  ↓
// Model
//  ↓
// Database
// ============================================================

"use strict";

(function (window, document) {

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const Notifications = {

    config: {
      apiBase: "/api/notifications",

      endpoints: {
        list: "/api/notifications",
        unread: "/api/notifications/unread",
        count: "/api/notifications/unread/count",
        markRead: "/api/notifications/read",
        markAllRead: "/api/notifications/read-all",
        remove: "/api/notifications",
        preferences: "/api/notifications/preferences"
      },

      pollingInterval: 60000,

      pageSize: 20,

      autoPoll: true,

      selectors: {
        list: "[data-notifications-list]",
        count: "[data-notification-count]",
        empty: "[data-notifications-empty]",
        loading: "[data-notifications-loading]",
        markAll: "[data-mark-all-notifications-read]"
      }
    },

    state: {

      notifications: [],

      unreadCount: 0,

      page: 1,

      pageSize: 20,

      total: 0,

      loading: false,

      initialized: false,

      pollingTimer: null,

      preferences: {},

      filters: {
        type: "",
        status: "",
        read: ""
      }

    }

  };


  // ==========================================================
  // CONSTANTS
  // ==========================================================

  Notifications.TYPES = {

    SYSTEM: "SYSTEM",

    ACCOUNT: "ACCOUNT",

    SECURITY: "SECURITY",

    PROPERTY: "PROPERTY",

    PROPERTY_APPROVAL: "PROPERTY_APPROVAL",

    PROPERTY_REJECTED: "PROPERTY_REJECTED",

    PROPERTY_VERIFIED: "PROPERTY_VERIFIED",

    PROPERTY_UPDATED: "PROPERTY_UPDATED",

    OFFER: "OFFER",

    OFFER_RECEIVED: "OFFER_RECEIVED",

    OFFER_ACCEPTED: "OFFER_ACCEPTED",

    OFFER_REJECTED: "OFFER_REJECTED",

    VISIT: "VISIT",

    VISIT_SCHEDULED: "VISIT_SCHEDULED",

    VISIT_CONFIRMED: "VISIT_CONFIRMED",

    VISIT_CANCELLED: "VISIT_CANCELLED",

    APPLICATION: "APPLICATION",

    APPLICATION_UPDATED: "APPLICATION_UPDATED",

    DOCUMENT: "DOCUMENT",

    DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",

    DOCUMENT_VERIFIED: "DOCUMENT_VERIFIED",

    DOCUMENT_REJECTED: "DOCUMENT_REJECTED",

    VERIFICATION: "VERIFICATION",

    KYC: "KYC",

    PAYMENT: "PAYMENT",

    PAYMENT_SUCCESS: "PAYMENT_SUCCESS",

    PAYMENT_FAILED: "PAYMENT_FAILED",

    SUBSCRIPTION: "SUBSCRIPTION",

    SUBSCRIPTION_EXPIRING: "SUBSCRIPTION_EXPIRING",

    LOAN: "LOAN",

    LOAN_STATUS: "LOAN_STATUS",

    REFERRAL: "REFERRAL",

    MESSAGE: "MESSAGE",

    SUPPORT: "SUPPORT",

    AI: "AI",

    SECURITY_ALERT: "SECURITY_ALERT",

    ADMIN: "ADMIN"

  };


  // ==========================================================
  // PRIORITIES
  // ==========================================================

  Notifications.PRIORITY = {

    LOW: "LOW",

    NORMAL: "NORMAL",

    HIGH: "HIGH",

    URGENT: "URGENT"

  };


  // ==========================================================
  // API HELPER
  // ==========================================================

  async function request(
    url,
    options = {}
  ) {

    const config = {
      credentials: "include",

      headers: {
        "Content-Type": "application/json",

        ...(options.headers || {})
      },

      ...options
    };

    try {

      const response =
        await fetch(
          url,
          config
        );

      let data = null;

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

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
            ? { message: text }
            : {};

      }

      if (!response.ok) {

        const error =
          new Error(
            data.message ||
            data.error ||
            `Request failed: ${response.status}`
          );

        error.status =
          response.status;

        error.data =
          data;

        throw error;

      }

      return data;

    } catch (error) {

      console.error(
        "[GHAR Notifications]",
        error
      );

      throw error;

    }

  }


  // ==========================================================
  // AUTHORIZATION TOKEN
  // ==========================================================

  function getToken() {

    try {

      if (
        window.GHAR &&
        window.GHAR.auth &&
        typeof window.GHAR.auth.getToken ===
          "function"
      ) {

        return (
          window.GHAR.auth.getToken()
        );

      }

      if (
        window.GHAR_AUTH_TOKEN
      ) {

        return (
          window.GHAR_AUTH_TOKEN
        );

      }

      return (
        localStorage.getItem(
          "ghar_access_token"
        ) ||
        localStorage.getItem(
          "access_token"
        )
      );

    } catch {

      return null;

    }

  }


  // ==========================================================
  // AUTH HEADER
  // ==========================================================

  function getAuthHeaders() {

    const token =
      getToken();

    if (!token) {
      return {};
    }

    return {
      Authorization:
        `Bearer ${token}`
    };

  }


  // ==========================================================
  // LOAD NOTIFICATIONS
  // ==========================================================

  Notifications.load = async function (
    options = {}
  ) {

    if (
      Notifications.state.loading
    ) {

      return Notifications.state.notifications;

    }

    Notifications.state.loading = true;

    showLoading(true);

    try {

      const page =
        options.page ||
        Notifications.state.page;

      const pageSize =
        options.pageSize ||
        Notifications.state.pageSize;

      const params =
        new URLSearchParams();

      params.set(
        "page",
        page
      );

      params.set(
        "limit",
        pageSize
      );

      if (
        Notifications.state.filters.type
      ) {

        params.set(
          "type",
          Notifications.state.filters.type
        );

      }

      if (
        Notifications.state.filters.status
      ) {

        params.set(
          "status",
          Notifications.state.filters.status
        );

      }

      if (
        Notifications.state.filters.read !== ""
      ) {

        params.set(
          "read",
          Notifications.state.filters.read
        );

      }

      const response =
        await request(
          `${Notifications.config.endpoints.list}?${params.toString()}`,
          {
            method: "GET",

            headers:
              getAuthHeaders()
          }
        );

      const notifications =
        normalizeListResponse(
          response
        );

      Notifications.state.notifications =
        notifications.items;

      Notifications.state.total =
        notifications.total;

      Notifications.state.page =
        page;

      render();

      return (
        Notifications.state.notifications
      );

    } catch (error) {

      showError(
        "Unable to load notifications."
      );

      return [];

    } finally {

      Notifications.state.loading =
        false;

      showLoading(false);

    }

  };


  // ==========================================================
  // LOAD UNREAD NOTIFICATIONS
  // ==========================================================

  Notifications.loadUnread =
    async function () {

      try {

        const response =
          await request(
            Notifications.config.endpoints.unread,
            {
              method: "GET",

              headers:
                getAuthHeaders()
            }
          );

        const notifications =
          normalizeListResponse(
            response
          );

        return notifications.items;

      } catch (error) {

        console.error(
          "[GHAR] Unable to load unread notifications:",
          error
        );

        return [];

      }

    };


  // ==========================================================
  // LOAD UNREAD COUNT
  // ==========================================================

  Notifications.loadUnreadCount =
    async function () {

      try {

        const response =
          await request(
            Notifications.config.endpoints.count,
            {
              method: "GET",

              headers:
                getAuthHeaders()
            }
          );

        const count =
          Number(
            response.count ??
            response.unreadCount ??
            response.data?.count ??
            0
          );

        Notifications.state.unreadCount =
          Math.max(
            0,
            count
          );

        updateUnreadCount();

        return (
          Notifications.state.unreadCount
        );

      } catch (error) {

        console.error(
          "[GHAR] Unable to load unread count:",
          error
        );

        return (
          Notifications.state.unreadCount
        );

      }

    };


  // ==========================================================
  // MARK AS READ
  // ==========================================================

  Notifications.markRead =
    async function (
      notificationId
    ) {

      if (
        !notificationId
      ) {

        return false;

      }

      try {

        await request(
          `${Notifications.config.endpoints.markRead}/${encodeURIComponent(notificationId)}`,
          {
            method: "PATCH",

            headers:
              getAuthHeaders(),

            body:
              JSON.stringify({
                read: true
              })
          }
        );

        updateLocalReadState(
          notificationId,
          true
        );

        await Notifications.loadUnreadCount();

        render();

        return true;

      } catch (error) {

        showError(
          "Unable to mark notification as read."
        );

        return false;

      }

    };


  // ==========================================================
  // MARK ALL READ
  // ==========================================================

  Notifications.markAllRead =
    async function () {

      try {

        await request(
          Notifications.config.endpoints.markAllRead,
          {
            method: "PATCH",

            headers:
              getAuthHeaders(),

            body:
              JSON.stringify({
                read: true
              })
          }
        );

        Notifications.state.notifications =
          Notifications.state.notifications.map(
            notification => ({
              ...notification,
              read: true,
              isRead: true
            })
          );

        Notifications.state.unreadCount =
          0;

        updateUnreadCount();

        render();

        return true;

      } catch (error) {

        showError(
          "Unable to mark all notifications as read."
        );

        return false;

      }

    };


  // ==========================================================
  // DELETE NOTIFICATION
  // ==========================================================

  Notifications.remove =
    async function (
      notificationId
    ) {

      if (
        !notificationId
      ) {

        return false;

      }

      try {

        await request(
          `${Notifications.config.endpoints.remove}/${encodeURIComponent(notificationId)}`,
          {
            method: "DELETE",

            headers:
              getAuthHeaders()
          }
        );

        Notifications.state.notifications =
          Notifications.state.notifications.filter(
            notification =>
              String(
                notification.id
              ) !==
              String(
                notificationId
              )
          );

        await Notifications.loadUnreadCount();

        render();

        return true;

      } catch (error) {

        showError(
          "Unable to delete notification."
        );

        return false;

      }

    };


  // ==========================================================
  // GET NOTIFICATION PREFERENCES
  // ==========================================================

  Notifications.loadPreferences =
    async function () {

      try {

        const response =
          await request(
            Notifications.config.endpoints.preferences,
            {
              method: "GET",

              headers:
                getAuthHeaders()
            }
          );

        Notifications.state.preferences =
          response.preferences ||
          response.data ||
          response ||
          {};

        return (
          Notifications.state.preferences
        );

      } catch (error) {

        console.error(
          "[GHAR] Unable to load notification preferences:",
          error
        );

        return {};

      }

    };


  // ==========================================================
  // UPDATE NOTIFICATION PREFERENCES
  // ==========================================================

  Notifications.updatePreferences =
    async function (
      preferences
    ) {

      if (
        !preferences ||
        typeof preferences !== "object"
      ) {

        return false;

      }

      try {

        const response =
          await request(
            Notifications.config.endpoints.preferences,
            {
              method: "PUT",

              headers:
                getAuthHeaders(),

              body:
                JSON.stringify(
                  preferences
                )
            }
          );

        Notifications.state.preferences =
          response.preferences ||
          preferences;

        return true;

      } catch (error) {

        showError(
          "Unable to update notification preferences."
        );

        return false;

      }

    };


  // ==========================================================
  // FILTERS
  // ==========================================================

  Notifications.setFilter =
    async function (
      filter,
      value
    ) {

      if (
        !Object.prototype.hasOwnProperty.call(
          Notifications.state.filters,
          filter
        )
      ) {

        return;

      }

      Notifications.state.filters[
        filter
      ] = value;

      Notifications.state.page =
        1;

      await Notifications.load();

    };


  Notifications.clearFilters =
    async function () {

      Notifications.state.filters = {

        type: "",

        status: "",

        read: ""

      };

      Notifications.state.page =
        1;

      await Notifications.load();

    };


  // ==========================================================
  // PAGINATION
  // ==========================================================

  Notifications.nextPage =
    async function () {

      const maxPage =
        Math.ceil(
          Notifications.state.total /
          Notifications.state.pageSize
        );

      if (
        Notifications.state.page >=
        maxPage
      ) {

        return;

      }

      Notifications.state.page++;

      await Notifications.load();

    };


  Notifications.previousPage =
    async function () {

      if (
        Notifications.state.page <=
        1
      ) {

        return;

      }

      Notifications.state.page--;

      await Notifications.load();

    };


  // ==========================================================
  // NORMALIZE API RESPONSE
  // ==========================================================

  function normalizeListResponse(
    response
  ) {

    if (
      Array.isArray(response)
    ) {

      return {
        items: response,
        total: response.length
      };

    }

    const items =
      response.notifications ||
      response.items ||
      response.data?.notifications ||
      response.data?.items ||
      [];

    const total =
      Number(
        response.total ??
        response.pagination?.total ??
        response.data?.total ??
        items.length
      );

    return {

      items:
        Array.isArray(items)
          ? items
          : [],

      total:
        Number.isFinite(total)
          ? total
          : items.length

    };

  }


  // ==========================================================
  // NORMALIZE NOTIFICATION
  // ==========================================================

  function normalizeNotification(
    notification
  ) {

    const item =
      notification || {};

    return {

      id:
        item.id ||
        item._id ||
        item.notification_id,

      type:
        item.type ||
        "SYSTEM",

      title:
        item.title ||
        "GHAR Notification",

      message:
        item.message ||
        item.body ||
        "",

      priority:
        item.priority ||
        "NORMAL",

      read:
        Boolean(
          item.read ??
          item.isRead ??
          item.read_at
        ),

      isRead:
        Boolean(
          item.read ??
          item.isRead ??
          item.read_at
        ),

      createdAt:
        item.createdAt ||
        item.created_at ||
        item.timestamp ||
        null,

      updatedAt:
        item.updatedAt ||
        item.updated_at ||
        null,

      link:
        item.link ||
        item.url ||
        null,

      entityType:
        item.entityType ||
        item.entity_type ||
        null,

      entityId:
        item.entityId ||
        item.entity_id ||
        null,

      metadata:
        item.metadata ||
        {}

    };

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  function render() {

    const containers =
      document.querySelectorAll(
        Notifications.config.selectors.list
      );

    containers.forEach(
      container => {

        container.innerHTML = "";

        const items =
          Notifications.state.notifications
            .map(
              normalizeNotification
            );

        if (
          !items.length
        ) {

          renderEmpty(
            container
          );

          return;

        }

        items.forEach(
          notification => {

            container.appendChild(
              createNotificationElement(
                notification
              )
            );

          }

        );

      }
    );

    updateUnreadCount();

  }


  // ==========================================================
  // CREATE NOTIFICATION ELEMENT
  // ==========================================================

  function createNotificationElement(
    notification
  ) {

    const wrapper =
      document.createElement(
        "article"
      );

    wrapper.className =
      "ghar-notification";

    if (
      !notification.read
    ) {

      wrapper.classList.add(
        "is-unread"
      );

    }

    wrapper.dataset.notificationId =
      notification.id || "";

    wrapper.dataset.notificationType =
      notification.type;

    const icon =
      document.createElement(
        "span"
      );

    icon.className =
      "ghar-notification-icon";

    icon.textContent =
      getNotificationIcon(
        notification.type
      );

    const content =
      document.createElement(
        "div"
      );

    content.className =
      "ghar-notification-content";

    const title =
      document.createElement(
        "strong"
      );

    title.className =
      "ghar-notification-title";

    title.textContent =
      notification.title;

    const message =
      document.createElement(
        "p"
      );

    message.className =
      "ghar-notification-message";

    message.textContent =
      notification.message;

    const meta =
      document.createElement(
        "small"
      );

    meta.className =
      "ghar-notification-time";

    meta.textContent =
      formatDate(
        notification.createdAt
      );

    content.appendChild(
      title
    );

    content.appendChild(
      message
    );

    content.appendChild(
      meta
    );

    const actions =
      document.createElement(
        "div"
      );

    actions.className =
      "ghar-notification-actions";

    if (
      !notification.read
    ) {

      const readButton =
        document.createElement(
          "button"
        );

      readButton.type =
        "button";

      readButton.className =
        "ghar-notification-read";

      readButton.textContent =
        "Mark read";

      readButton.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          Notifications.markRead(
            notification.id
          );

        }
      );

      actions.appendChild(
        readButton
      );

    }

    const deleteButton =
      document.createElement(
        "button"
      );

    deleteButton.type =
      "button";

    deleteButton.className =
      "ghar-notification-delete";

    deleteButton.textContent =
      "Delete";

    deleteButton.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        Notifications.remove(
          notification.id
        );

      }
    );

    actions.appendChild(
      deleteButton
    );

    wrapper.appendChild(
      icon
    );

    wrapper.appendChild(
      content
    );

    wrapper.appendChild(
      actions
    );

    wrapper.addEventListener(
      "click",
      () => {

        if (
          !notification.read
        ) {

          Notifications.markRead(
            notification.id
          );

        }

        if (
          notification.link
        ) {

          window.location.href =
            notification.link;

        }

      }
    );

    return wrapper;

  }


  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  function renderEmpty(
    container
  ) {

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "ghar-notifications-empty";

    empty.innerHTML = `
      <div class="ghar-notifications-empty-icon">
        🔔
      </div>

      <h3>No notifications</h3>

      <p>
        You're all caught up.
      </p>
    `;

    container.appendChild(
      empty
    );

  }


  // ==========================================================
  // NOTIFICATION ICONS
  // ==========================================================

  function getNotificationIcon(
    type
  ) {

    const icons = {

      SYSTEM: "🔔",

      ACCOUNT: "👤",

      SECURITY: "🔐",

      SECURITY_ALERT: "⚠️",

      PROPERTY: "🏠",

      PROPERTY_APPROVAL: "✅",

      PROPERTY_REJECTED: "❌",

      PROPERTY_VERIFIED: "🏠",

      PROPERTY_UPDATED: "🏡",

      OFFER: "💰",

      OFFER_RECEIVED: "💰",

      OFFER_ACCEPTED: "✅",

      OFFER_REJECTED: "❌",

      VISIT: "📅",

      VISIT_SCHEDULED: "📅",

      VISIT_CONFIRMED: "✅",

      VISIT_CANCELLED: "❌",

      APPLICATION: "📋",

      APPLICATION_UPDATED: "📋",

      DOCUMENT: "📄",

      DOCUMENT_UPLOADED: "📤",

      DOCUMENT_VERIFIED: "✅",

      DOCUMENT_REJECTED: "❌",

      VERIFICATION: "✓",

      KYC: "🪪",

      PAYMENT: "💳",

      PAYMENT_SUCCESS: "💳",

      PAYMENT_FAILED: "⚠️",

      SUBSCRIPTION: "⭐",

      SUBSCRIPTION_EXPIRING: "⏰",

      LOAN: "🏦",

      LOAN_STATUS: "🏦",

      REFERRAL: "🤝",

      MESSAGE: "💬",

      SUPPORT: "🎧",

      AI: "🤖",

      ADMIN: "⚙️"

    };

    return (
      icons[type] ||
      icons.SYSTEM
    );

  }


  // ==========================================================
  // UPDATE LOCAL READ STATE
  // ==========================================================

  function updateLocalReadState(
    notificationId,
    value
  ) {

    Notifications.state.notifications =
      Notifications.state.notifications.map(
        notification => {

          if (
            String(
              notification.id
            ) ===
            String(
              notificationId
            )
          ) {

            return {

              ...notification,

              read: value,

              isRead: value

            };

          }

          return notification;

        }
      );

  }


  // ==========================================================
  // UNREAD COUNT UI
  // ==========================================================

  function updateUnreadCount() {

    const count =
      Notifications.state.unreadCount;

    const elements =
      document.querySelectorAll(
        Notifications.config.selectors.count
      );

    elements.forEach(
      element => {

        element.textContent =
          count > 99
            ? "99+"
            : String(count);

        element.dataset.count =
          String(count);

        element.hidden =
          count <= 0;

      }
    );

  }


  // ==========================================================
  // LOADING UI
  // ==========================================================

  function showLoading(
    visible
  ) {

    const elements =
      document.querySelectorAll(
        Notifications.config.selectors.loading
      );

    elements.forEach(
      element => {

        element.hidden =
          !visible;

      }
    );

  }


  // ==========================================================
  // ERROR UI
  // ==========================================================

  function showError(
    message
  ) {

    console.error(
      "[GHAR Notifications]",
      message
    );

    if (
      window.GHAR &&
      window.GHAR.toast &&
      typeof window.GHAR.toast.error ===
        "function"
    ) {

      window.GHAR.toast.error(
        message
      );

      return;

    }

    if (
      typeof window.showToast ===
      "function"
    ) {

      window.showToast(
        message,
        "error"
      );

    }

  }


  // ==========================================================
  // DATE FORMATTER
  // ==========================================================

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

      return "";

    }

    return new Intl.DateTimeFormat(
      undefined,
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    ).format(date);

  }


  // ==========================================================
  // EVENT DELEGATION
  // ==========================================================

  function bindEvents() {

    document.addEventListener(
      "click",
      event => {

        const markAll =
          event.target.closest(
            Notifications.config.selectors.markAll
          );

        if (
          markAll
        ) {

          event.preventDefault();

          Notifications.markAllRead();

        }

      }
    );

  }


  // ==========================================================
  // REAL-TIME / POLLING
  // ==========================================================

  Notifications.startPolling =
    function () {

      Notifications.stopPolling();

      if (
        !Notifications.config.autoPoll
      ) {

        return;

      }

      Notifications.state.pollingTimer =
        window.setInterval(
          async () => {

            if (
              document.hidden
            ) {

              return;

            }

            await Notifications.loadUnreadCount();

          },

          Notifications.config.pollingInterval
        );

    };


  Notifications.stopPolling =
    function () {

      if (
        Notifications.state.pollingTimer
      ) {

        window.clearInterval(
          Notifications.state.pollingTimer
        );

        Notifications.state.pollingTimer =
          null;

      }

    };


  // ==========================================================
  // REFRESH
  // ==========================================================

  Notifications.refresh =
    async function () {

      await Promise.all([
        Notifications.load(),
        Notifications.loadUnreadCount()
      ]);

    };


  // ==========================================================
  // INITIALIZATION
  // ==========================================================

  Notifications.init =
    async function (
      options = {}
    ) {

      if (
        Notifications.state.initialized
      ) {

        return Notifications;

      }

      Notifications.state.initialized =
        true;

      if (
        options.apiBase
      ) {

        Notifications.config.apiBase =
          options.apiBase;

      }

      if (
        options.pageSize
      ) {

        Notifications.state.pageSize =
          Number(
            options.pageSize
          );

      }

      if (
        typeof options.autoPoll ===
        "boolean"
      ) {

        Notifications.config.autoPoll =
          options.autoPoll;

      }

      bindEvents();

      await Notifications.loadUnreadCount();

      if (
        document.querySelector(
          Notifications.config.selectors.list
        )
      ) {

        await Notifications.load();

      }

      Notifications.startPolling();

      return Notifications;

    };


  // ==========================================================
  // PUBLIC API
  // ==========================================================

  window.GHAR =
    window.GHAR || {};

  window.GHAR.notifications =
    Notifications;

  window.GHAR.Notifications =
    Notifications;


  // ==========================================================
  // AUTO INIT
  // ==========================================================

  function boot() {

    Notifications.init()
      .catch(
        error => {

          console.error(
            "[GHAR Notifications] Initialization failed:",
            error
          );

        }
      );

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      boot,
      {
        once: true
      }
    );

  } else {

    boot();

  }


})(window, document);