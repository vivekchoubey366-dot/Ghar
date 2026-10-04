// ============================================================
// GHAR - REAL ESTATE PLATFORM
// messages.js
// Messaging / Conversations Module
// ============================================================

"use strict";

(function (window, document) {

  // ============================================================
  // GHAR NAMESPACE
  // ============================================================

  window.GHAR = window.GHAR || {};

  const GHAR = window.GHAR;

  // ============================================================
  // CONFIGURATION
  // ============================================================

  const CONFIG = {
    API_BASE:
      GHAR.CONFIG?.API_BASE ||
      "/api",

    ENDPOINTS: {
      MESSAGES:
        "/messages",

      CONVERSATIONS:
        "/messages/conversations",

      SEND:
        "/messages/send",

      READ:
        "/messages/read",

      DELETE:
        "/messages",

      SEARCH:
        "/messages/search"
    },

    SELECTORS: {
      conversationList:
        "[data-conversation-list]",

      conversation:
        "[data-conversation]",

      messageList:
        "[data-message-list]",

      messageForm:
        "[data-message-form]",

      messageInput:
        "[data-message-input]",

      sendButton:
        "[data-send-message]",

      search:
        "[data-message-search]",

      unreadCount:
        "[data-unread-messages]",

      activeConversation:
        "[data-active-conversation]"
    },

    MAX_MESSAGE_LENGTH: 5000,

    PAGE_SIZE: 50
  };

  // ============================================================
  // STATE
  // ============================================================

  const state = {
    conversations: [],

    activeConversationId: null,

    messages: [],

    unreadCount: 0,

    searchQuery: "",

    loading: false,

    sending: false,

    initialized: false
  };

  // ============================================================
  // HELPERS
  // ============================================================

  function getApiBase() {
    return (
      GHAR.CONFIG?.API_BASE ||
      CONFIG.API_BASE ||
      "/api"
    ).replace(/\/$/, "");
  }

  function getToken() {

    if (GHAR.AUTH?.getToken) {
      return GHAR.AUTH.getToken();
    }

    try {

      return (
        localStorage.getItem("ghar_token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        null
      );

    } catch (error) {

      return null;
    }
  }

  function escapeHTML(value) {

    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value) {

    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    );
  }

  function formatTime(value) {

    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString(
      undefined,
      {
        hour: "numeric",
        minute: "2-digit"
      }
    );
  }

  function showToast(message, type = "info") {

    if (
      GHAR.TOAST &&
      typeof GHAR.TOAST.show === "function"
    ) {
      GHAR.TOAST.show(message, type);
      return;
    }

    if (
      GHAR.UI &&
      typeof GHAR.UI.toast === "function"
    ) {
      GHAR.UI.toast(message, type);
      return;
    }

    console.log(`[GHAR MESSAGE] ${message}`);
  }

  // ============================================================
  // API REQUEST
  // ============================================================

  async function request(
    endpoint,
    options = {}
  ) {

    const token = getToken();

    const headers = {
      "Content-Type":
        "application/json",

      ...(options.headers || {})
    };

    if (token) {
      headers.Authorization =
        `Bearer ${token}`;
    }

    const response =
      await fetch(
        `${getApiBase()}${endpoint}`,
        {
          ...options,
          headers,
          credentials: "include"
        }
      );

    let data = null;

    try {
      data = await response.json();
    } catch (_) {
      data = null;
    }

    if (!response.ok) {

      const message =
        data?.error ||
        data?.message ||
        `Request failed (${response.status})`;

      throw new Error(message);
    }

    return data;
  }

  // ============================================================
  // CONVERSATIONS
  // ============================================================

  async function loadConversations() {

    state.loading = true;

    try {

      const data =
        await request(
          CONFIG.ENDPOINTS.CONVERSATIONS
        );

      state.conversations =
        Array.isArray(data?.conversations)
          ? data.conversations
          : Array.isArray(data)
            ? data
            : [];

      renderConversations();

      updateUnreadCount();

      return state.conversations;

    } catch (error) {

      console.error(
        "GHAR: Failed to load conversations",
        error
      );

      showToast(
        error.message ||
        "Unable to load conversations.",
        "error"
      );

      return [];

    } finally {

      state.loading = false;
    }
  }

  // ============================================================
  // LOAD MESSAGES
  // ============================================================

  async function loadMessages(
    conversationId
  ) {

    if (!conversationId) {
      return [];
    }

    state.loading = true;

    state.activeConversationId =
      String(conversationId);

    try {

      const endpoint =
        `${CONFIG.ENDPOINTS.MESSAGES}` +
        `?conversationId=${encodeURIComponent(
          conversationId
        )}` +
        `&limit=${CONFIG.PAGE_SIZE}`;

      const data =
        await request(endpoint);

      state.messages =
        Array.isArray(data?.messages)
          ? data.messages
          : Array.isArray(data)
            ? data
            : [];

      renderMessages();

      markConversationRead(
        conversationId
      );

      return state.messages;

    } catch (error) {

      console.error(
        "GHAR: Failed to load messages",
        error
      );

      showToast(
        error.message ||
        "Unable to load messages.",
        "error"
      );

      return [];

    } finally {

      state.loading = false;
    }
  }

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  async function sendMessage(
    conversationId,
    message,
    options = {}
  ) {

    if (!conversationId) {
      throw new Error(
        "Conversation is required."
      );
    }

    const text =
      String(message || "").trim();

    if (!text) {
      throw new Error(
        "Message cannot be empty."
      );
    }

    if (
      text.length >
      CONFIG.MAX_MESSAGE_LENGTH
    ) {
      throw new Error(
        `Message cannot exceed ${CONFIG.MAX_MESSAGE_LENGTH} characters.`
      );
    }

    if (state.sending) {
      return null;
    }

    state.sending = true;

    try {

      const payload = {
        conversationId,
        message: text,

        ...options
      };

      const data =
        await request(
          CONFIG.ENDPOINTS.SEND,
          {
            method: "POST",

            body:
              JSON.stringify(payload)
          }
        );

      const newMessage =
        data?.message ||
        data;

      if (newMessage) {

        state.messages.push(
          newMessage
        );

        renderMessages();
      }

      clearMessageInput();

      return newMessage;

    } catch (error) {

      console.error(
        "GHAR: Failed to send message",
        error
      );

      showToast(
        error.message ||
        "Unable to send message.",
        "error"
      );

      throw error;

    } finally {

      state.sending = false;
    }
  }

  // ============================================================
  // MARK AS READ
  // ============================================================

  async function markConversationRead(
    conversationId
  ) {

    if (!conversationId) {
      return;
    }

    try {

      await request(
        CONFIG.ENDPOINTS.READ,
        {
          method: "POST",

          body:
            JSON.stringify({
              conversationId
            })
        }
      );

      const conversation =
        state.conversations.find(
          item =>
            String(item.id) ===
            String(conversationId)
        );

      if (conversation) {
        conversation.unreadCount = 0;
      }

      updateUnreadCount();

      renderConversations();

    } catch (error) {

      console.warn(
        "GHAR: Unable to mark messages as read.",
        error
      );
    }
  }

  // ============================================================
  // DELETE MESSAGE
  // ============================================================

  async function deleteMessage(
    messageId
  ) {

    if (!messageId) {
      return false;
    }

    try {

      await request(
        `${CONFIG.ENDPOINTS.DELETE}/${encodeURIComponent(
          messageId
        )}`,
        {
          method: "DELETE"
        }
      );

      state.messages =
        state.messages.filter(
          message =>
            String(message.id) !==
            String(messageId)
        );

      renderMessages();

      showToast(
        "Message deleted.",
        "success"
      );

      return true;

    } catch (error) {

      console.error(
        "GHAR: Failed to delete message",
        error
      );

      showToast(
        error.message ||
        "Unable to delete message.",
        "error"
      );

      return false;
    }
  }

  // ============================================================
  // SEARCH MESSAGES
  // ============================================================

  async function searchMessages(
    query
  ) {

    const search =
      String(query || "").trim();

    state.searchQuery = search;

    if (!search) {
      renderMessages();
      return state.messages;
    }

    try {

      const endpoint =
        `${CONFIG.ENDPOINTS.SEARCH}` +
        `?q=${encodeURIComponent(
          search
        )}`;

      const data =
        await request(endpoint);

      const results =
        Array.isArray(data?.messages)
          ? data.messages
          : Array.isArray(data)
            ? data
            : [];

      renderMessages(results);

      return results;

    } catch (error) {

      console.error(
        "GHAR: Message search failed",
        error
      );

      return [];
    }
  }

  // ============================================================
  // UNREAD COUNT
  // ============================================================

  function updateUnreadCount() {

    state.unreadCount =
      state.conversations.reduce(
        (total, conversation) =>
          total +
          Number(
            conversation.unreadCount ||
            0
          ),
        0
      );

    document
      .querySelectorAll(
        CONFIG.SELECTORS.unreadCount
      )
      .forEach(element => {

        element.textContent =
          state.unreadCount > 99
            ? "99+"
            : String(
                state.unreadCount
              );

        element.hidden =
          state.unreadCount === 0;

      });

    return state.unreadCount;
  }

  // ============================================================
  // RENDER CONVERSATIONS
  // ============================================================

  function renderConversations() {

    document
      .querySelectorAll(
        CONFIG.SELECTORS.conversationList
      )
      .forEach(container => {

        const query =
          state.searchQuery
            .toLowerCase()
            .trim();

        const conversations =
          state.conversations.filter(
            conversation => {

              if (!query) {
                return true;
              }

              const searchable = [
                conversation.title,
                conversation.name,
                conversation.lastMessage
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

              return searchable.includes(
                query
              );
            }
          );

        if (!conversations.length) {

          container.innerHTML = `
            <div class="ghar-empty-state">
              <p>No conversations found.</p>
            </div>
          `;

          return;
        }

        container.innerHTML =
          conversations
            .map(
              conversation =>
                renderConversation(
                  conversation
                )
            )
            .join("");

      });

    bindConversationEvents();
  }

  // ============================================================
  // CONVERSATION ITEM
  // ============================================================

  function renderConversation(
    conversation
  ) {

    const id =
      escapeHTML(
        conversation.id
      );

    const name =
      escapeHTML(
        conversation.name ||
        conversation.title ||
        "Conversation"
      );

    const lastMessage =
      escapeHTML(
        conversation.lastMessage ||
        ""
      );

    const time =
      formatTime(
        conversation.updatedAt ||
        conversation.lastMessageAt
      );

    const unread =
      Number(
        conversation.unreadCount || 0
      );

    const active =
      String(
        conversation.id
      ) ===
      String(
        state.activeConversationId
      );

    return `
      <button
        type="button"
        class="ghar-conversation-item ${
          active
            ? "is-active"
            : ""
        }"
        data-conversation="${id}"
        data-conversation-id="${id}"
      >

        <span class="ghar-conversation-avatar">

          ${
            conversation.avatar
              ? `
                <img
                  src="${escapeHTML(
                    conversation.avatar
                  )}"
                  alt=""
                  loading="lazy"
                >
              `
              : `
                <span>
                  ${escapeHTML(
                    name
                      .charAt(0)
                      .toUpperCase()
                  )}
                </span>
              `
          }

        </span>

        <span class="ghar-conversation-content">

          <strong>
            ${name}
          </strong>

          <span class="ghar-conversation-preview">
            ${lastMessage}
          </span>

        </span>

        <span class="ghar-conversation-meta">

          <time>
            ${escapeHTML(time)}
          </time>

          ${
            unread > 0
              ? `
                <span
                  class="ghar-message-unread"
                >
                  ${
                    unread > 99
                      ? "99+"
                      : unread
                  }
                </span>
              `
              : ""
          }

        </span>

      </button>
    `;
  }

  // ============================================================
  // RENDER MESSAGES
  // ============================================================

  function renderMessages(
    messages = state.messages
  ) {

    document
      .querySelectorAll(
        CONFIG.SELECTORS.messageList
      )
      .forEach(container => {

        if (!messages.length) {

          container.innerHTML = `
            <div class="ghar-empty-state">
              <p>No messages yet.</p>
            </div>
          `;

          return;
        }

        container.innerHTML =
          messages
            .map(
              message =>
                renderMessage(
                  message
                )
            )
            .join("");

        container.scrollTop =
          container.scrollHeight;
      });

  }

  // ============================================================
  // MESSAGE ITEM
  // ============================================================

  function renderMessage(
    message
  ) {

    const text =
      escapeHTML(
        message.text ||
        message.message ||
        ""
      );

    const sender =
      escapeHTML(
        message.senderName ||
        message.sender?.name ||
        ""
      );

    const time =
      formatTime(
        message.createdAt ||
        message.timestamp
      );

    const own =
      Boolean(
        message.isMine ||
        message.fromCurrentUser ||
        message.senderId ===
          GHAR.AUTH?.getUser?.()?.id
      );

    return `
      <article
        class="ghar-message ${
          own
            ? "ghar-message--own"
            : "ghar-message--received"
        }"
        data-message-id="${escapeHTML(
          message.id || ""
        )}"
      >

        ${
          sender && !own
            ? `
              <span class="ghar-message-sender">
                ${sender}
              </span>
            `
            : ""
        }

        <div class="ghar-message-bubble">
          ${text}
        </div>

        <time
          class="ghar-message-time"
          datetime="${escapeHTML(
            message.createdAt ||
            message.timestamp ||
            ""
          )}"
        >
          ${escapeHTML(time)}
        </time>

      </article>
    `;
  }

  // ============================================================
  // EVENT BINDINGS
  // ============================================================

  function bindConversationEvents() {

    document
      .querySelectorAll(
        CONFIG.SELECTORS.conversation
      )
      .forEach(element => {

        if (
          element.dataset.bound === "true"
        ) {
          return;
        }

        element.dataset.bound = "true";

        element.addEventListener(
          "click",
          () => {

            const id =
              element.dataset.conversationId ||
              element.dataset.conversation;

            if (id) {
              loadMessages(id);
            }
          }
        );

      });
  }

  // ============================================================
  // MESSAGE FORM
  // ============================================================

  function bindMessageForms() {

    document
      .querySelectorAll(
        CONFIG.SELECTORS.messageForm
      )
      .forEach(form => {

        if (
          form.dataset.bound === "true"
        ) {
          return;
        }

        form.dataset.bound = "true";

        form.addEventListener(
          "submit",
          async event => {

            event.preventDefault();

            const input =
              form.querySelector(
                CONFIG.SELECTORS.messageInput
              );

            if (!input) {
              return;
            }

            const conversationId =
              form.dataset.conversationId ||
              state.activeConversationId;

            if (!conversationId) {

              showToast(
                "Select a conversation first.",
                "warning"
              );

              return;
            }

            const message =
              input.value.trim();

            if (!message) {
              return;
            }

            try {

              await sendMessage(
                conversationId,
                message
              );

            } catch (_) {
              return;
            }

          }
        );

      });
  }

  // ============================================================
  // SEARCH EVENTS
  // ============================================================

  function bindSearch() {

    document
      .querySelectorAll(
        CONFIG.SELECTORS.search
      )
      .forEach(input => {

        if (
          input.dataset.bound === "true"
        ) {
          return;
        }

        input.dataset.bound = "true";

        input.addEventListener(
          "input",
          event => {

            state.searchQuery =
              event.target.value
                .trim()
                .toLowerCase();

            renderConversations();

          }
        );

      });
  }

  // ============================================================
  // CLEAR INPUT
  // ============================================================

  function clearMessageInput() {

    document
      .querySelectorAll(
        CONFIG.SELECTORS.messageInput
      )
      .forEach(input => {
        input.value = "";
      });
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async function init() {

    if (state.initialized) {
      return;
    }

    state.initialized = true;

    bindMessageForms();
    bindSearch();

    await loadConversations();

    const active =
      document.querySelector(
        CONFIG.SELECTORS.activeConversation
      );

    if (active) {

      const id =
        active.dataset.conversationId;

      if (id) {
        await loadMessages(id);
      }
    }

  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  GHAR.MESSAGES = {

    state,

    init,

    loadConversations,

    loadMessages,

    sendMessage,

    markConversationRead,

    deleteMessage,

    searchMessages,

    renderConversations,

    renderMessages,

    getUnreadCount() {
      return state.unreadCount;
    },

    getActiveConversation() {
      return state.activeConversationId;
    }

  };

  // ============================================================
  // AUTO INITIALIZATION
  // ============================================================

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