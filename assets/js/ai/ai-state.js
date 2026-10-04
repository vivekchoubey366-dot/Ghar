// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/ai/ai-state.js
// GHAR AI STATE MANAGEMENT
// ============================================================

"use strict";

(function (window) {

  const GHAR = window.GHAR = window.GHAR || {};
  const AI = GHAR.AI = GHAR.AI || {};

  // ==========================================================
  // DEFAULT STATE
  // ==========================================================

  const DEFAULT_STATE = {
    initialized: false,
    ready: false,
    loading: false,
    error: null,

    activeModule: null,
    activeRoute: null,

    sessionId: null,
    conversationId: null,

    user: {
      authenticated: false,
      id: null,
      role: null
    },

    context: {
      propertyId: null,
      location: null,
      search: null,
      filters: {},
      budget: null,
      purpose: null
    },

    chat: {
      messages: [],
      messageCount: 0,
      lastMessage: null,
      isTyping: false
    },

    search: {
      query: "",
      filters: {},
      results: [],
      total: 0,
      page: 1,
      pageSize: 20,
      loading: false
    },

    recommendations: {
      items: [],
      loading: false,
      lastUpdated: null
    },

    priceEstimator: {
      property: null,
      estimate: null,
      confidence: null,
      loading: false
    },

    investment: {
      property: null,
      analysis: null,
      loading: false
    },

    loan: {
      input: {},
      eligibility: null,
      estimate: null,
      loading: false
    },

    documents: {
      documentId: null,
      status: null,
      result: null,
      loading: false
    },

    propertyDescription: {
      input: {},
      result: null,
      loading: false
    },

    rental: {
      input: {},
      result: null,
      loading: false
    },

    moderation: {
      status: null,
      result: null,
      loading: false
    },

    fraudDetection: {
      status: null,
      result: null,
      loading: false
    },

    history: {
      items: [],
      loading: false
    },

    feedback: {
      submitted: false,
      lastSubmission: null
    }
  };

  // ==========================================================
  // STATE STORAGE
  // ==========================================================

  let state =
    deepClone(DEFAULT_STATE);

  const listeners =
    new Set();

  // ==========================================================
  // UTILITIES
  // ==========================================================

  function deepClone(value) {

    if (
      value === undefined ||
      value === null
    ) {
      return value;
    }

    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch (error) {
      return value;
    }
  }

  function isObject(value) {

    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );

  }

  function mergeDeep(
    target,
    source
  ) {

    if (
      !isObject(target) ||
      !isObject(source)
    ) {
      return source;
    }

    Object.keys(source)
      .forEach(key => {

        const sourceValue =
          source[key];

        if (
          isObject(sourceValue) &&
          isObject(target[key])
        ) {

          mergeDeep(
            target[key],
            sourceValue
          );

        } else {

          target[key] =
            deepClone(sourceValue);

        }

      });

    return target;
  }

  // ==========================================================
  // GET STATE
  // ==========================================================

  function getState() {

    return deepClone(state);

  }

  // ==========================================================
  // GET VALUE
  // ==========================================================

  function get(
    path,
    fallback = null
  ) {

    if (!path) {
      return getState();
    }

    const parts =
      String(path)
        .split(".")
        .filter(Boolean);

    let current =
      state;

    for (
      const part of parts
    ) {

      if (
        current === null ||
        current === undefined ||
        !Object.prototype.hasOwnProperty
          .call(current, part)
      ) {
        return fallback;
      }

      current =
        current[part];
    }

    return deepClone(
      current
    );

  }

  // ==========================================================
  // SET VALUE
  // ==========================================================

  function set(
    path,
    value,
    options = {}
  ) {

    if (!path) {
      return false;
    }

    const parts =
      String(path)
        .split(".")
        .filter(Boolean);

    if (!parts.length) {
      return false;
    }

    let current =
      state;

    for (
      let index = 0;
      index < parts.length - 1;
      index++
    ) {

      const key =
        parts[index];

      if (
        !isObject(current[key]) &&
        !Array.isArray(current[key])
      ) {
        current[key] = {};
      }

      current =
        current[key];
    }

    const finalKey =
      parts[parts.length - 1];

    current[finalKey] =
      deepClone(value);

    if (
      options.notify !== false
    ) {
      notify(
        "set",
        path
      );
    }

    return true;

  }

  // ==========================================================
  // MERGE STATE
  // ==========================================================

  function update(
    changes,
    options = {}
  ) {

    if (
      !isObject(changes)
    ) {
      return false;
    }

    mergeDeep(
      state,
      changes
    );

    if (
      options.notify !== false
    ) {
      notify(
        "update",
        null
      );
    }

    return true;

  }

  // ==========================================================
  // RESET
  // ==========================================================

  function reset(
    options = {}
  ) {

    state =
      deepClone(
        DEFAULT_STATE
      );

    if (
      options.notify !== false
    ) {
      notify(
        "reset",
        null
      );
    }

    return true;

  }

  // ==========================================================
  // RESET MODULE
  // ==========================================================

  function resetModule(
    moduleName,
    options = {}
  ) {

    if (!moduleName) {
      return false;
    }

    if (
      !Object.prototype.hasOwnProperty
        .call(
          DEFAULT_STATE,
          moduleName
        )
    ) {
      return false;
    }

    state[moduleName] =
      deepClone(
        DEFAULT_STATE[moduleName]
      );

    if (
      options.notify !== false
    ) {
      notify(
        "module-reset",
        moduleName
      );
    }

    return true;

  }

  // ==========================================================
  // SUBSCRIBE
  // ==========================================================

  function subscribe(
    listener
  ) {

    if (
      typeof listener !==
      "function"
    ) {
      return () => {};
    }

    listeners.add(
      listener
    );

    return function unsubscribe() {
      listeners.delete(
        listener
      );
    };

  }

  // ==========================================================
  // NOTIFY
  // ==========================================================

  function notify(
    action,
    path
  ) {

    const snapshot =
      getState();

    listeners.forEach(
      listener => {

        try {

          listener(
            snapshot,
            {
              action,
              path
            }
          );

        } catch (error) {

          console.error(
            "[GHAR AI STATE] Listener error:",
            error
          );

        }

      }
    );

  }

  // ==========================================================
  // SESSION
  // ==========================================================

  function createSession() {

    let id;

    if (
      window.crypto &&
      typeof window.crypto.randomUUID ===
        "function"
    ) {

      id =
        window.crypto.randomUUID();

    } else {

      id =
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 12)}`;

    }

    state.sessionId =
      `ghar-ai-${id}`;

    state.initialized =
      true;

    notify(
      "session-created",
      "sessionId"
    );

    return state.sessionId;

  }

  function setSession(
    sessionId
  ) {

    state.sessionId =
      sessionId || null;

    notify(
      "session-updated",
      "sessionId"
    );

    return state.sessionId;

  }

  function getSession() {

    return state.sessionId;

  }

  // ==========================================================
  // CONVERSATION
  // ==========================================================

  function setConversation(
    conversationId
  ) {

    state.conversationId =
      conversationId || null;

    notify(
      "conversation-updated",
      "conversationId"
    );

    return state.conversationId;

  }

  // ==========================================================
  // ACTIVE MODULE
  // ==========================================================

  function setActiveModule(
    moduleName,
    route = null
  ) {

    state.activeModule =
      moduleName || null;

    state.activeRoute =
      route || null;

    notify(
      "module-changed",
      "activeModule"
    );

    return state.activeModule;

  }

  // ==========================================================
  // LOADING
  // ==========================================================

  function setLoading(
    loading,
    moduleName = null
  ) {

    state.loading =
      Boolean(loading);

    if (
      moduleName &&
      state[moduleName] &&
      typeof state[moduleName] ===
        "object"
    ) {

      state[moduleName].loading =
        Boolean(loading);

    }

    notify(
      "loading-changed",
      moduleName
    );

  }

  // ==========================================================
  // ERROR
  // ==========================================================

  function setError(
    error
  ) {

    if (!error) {

      state.error =
        null;

    } else {

      state.error = {

        message:
          error.message ||
          String(error),

        code:
          error.code ||
          null,

        status:
          error.status ||
          null,

        timestamp:
          new Date().toISOString()

      };

    }

    notify(
      "error-changed",
      "error"
    );

    return state.error;

  }

  function clearError() {

    return setError(
      null
    );

  }

  // ==========================================================
  // CHAT
  // ==========================================================

  function addMessage(
    message
  ) {

    if (
      !message ||
      typeof message !==
        "object"
    ) {
      return null;
    }

    const item = {

      id:
        message.id ||
        `msg-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      role:
        message.role ||
        "user",

      content:
        message.content ||
        "",

      timestamp:
        message.timestamp ||
        new Date().toISOString(),

      metadata:
        message.metadata ||
        {}

    };

    state.chat.messages.push(
      item
    );

    state.chat.messageCount =
      state.chat.messages.length;

    state.chat.lastMessage =
      deepClone(item);

    notify(
      "message-added",
      "chat.messages"
    );

    return deepClone(item);

  }

  function clearMessages() {

    state.chat.messages =
      [];

    state.chat.messageCount =
      0;

    state.chat.lastMessage =
      null;

    notify(
      "messages-cleared",
      "chat.messages"
    );

  }

  function setTyping(
    typing
  ) {

    state.chat.isTyping =
      Boolean(typing);

    notify(
      "typing-changed",
      "chat.isTyping"
    );

  }

  // ==========================================================
  // SEARCH
  // ==========================================================

  function setSearchResults(
    results,
    total = null
  ) {

    state.search.results =
      Array.isArray(results)
        ? deepClone(results)
        : [];

    state.search.total =
      total !== null
        ? Number(total) || 0
        : state.search.results.length;

    state.search.loading =
      false;

    notify(
      "search-results-updated",
      "search"
    );

  }

  // ==========================================================
  // CLEAR SEARCH
  // ==========================================================

  function clearSearch() {

    state.search =
      deepClone(
        DEFAULT_STATE.search
      );

    notify(
      "search-cleared",
      "search"
    );

  }

  // ==========================================================
  // CONTEXT
  // ==========================================================

  function setContext(
    context = {}
  ) {

    if (
      !isObject(context)
    ) {
      return false;
    }

    mergeDeep(
      state.context,
      context
    );

    notify(
      "context-updated",
      "context"
    );

    return true;

  }

  function clearContext() {

    state.context =
      deepClone(
        DEFAULT_STATE.context
      );

    notify(
      "context-cleared",
      "context"
    );

  }

  // ==========================================================
  // USER
  // ==========================================================

  function setUser(
    user = {}
  ) {

    state.user = {

      ...state.user,

      ...deepClone(user)

    };

    notify(
      "user-updated",
      "user"
    );

  }

  // ==========================================================
  // READY
  // ==========================================================

  function setReady(
    ready
  ) {

    state.ready =
      Boolean(ready);

    notify(
      "ready-changed",
      "ready"
    );

  }

  // ==========================================================
  // SERIALIZE
  // ==========================================================

  function serialize() {

    return JSON.stringify(
      state
    );

  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  AI.State = {

    DEFAULT_STATE:
      deepClone(DEFAULT_STATE),

    getState,
    get,
    set,
    update,

    reset,
    resetModule,

    subscribe,

    createSession,
    setSession,
    getSession,

    setConversation,

    setActiveModule,

    setLoading,

    setError,
    clearError,

    addMessage,
    clearMessages,
    setTyping,

    setSearchResults,
    clearSearch,

    setContext,
    clearContext,

    setUser,

    setReady,

    serialize

  };

  // Compatibility aliases

  AI.state =
    AI.State;

  GHAR.aiState =
    AI.State;

  // ==========================================================
  // AUTO SESSION INITIALIZATION
  // ==========================================================

  if (
    !state.sessionId
  ) {
    createSession();
  }

})(window);