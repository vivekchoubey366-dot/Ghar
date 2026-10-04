// ============================================================
// GHAR AI - HISTORY
// ============================================================

"use strict";

(function (window) {

  const GHAR = window.GHAR = window.GHAR || {};
  const AI = GHAR.AI = GHAR.AI || {};

  const CONFIG = {
    endpoint: "/api/ai/history"
  };

  async function list(
    options = {}
  ) {

    const params =
      new URLSearchParams();

    if (options.userId) {
      params.set(
        "userId",
        options.userId
      );
    }

    if (options.module) {
      params.set(
        "module",
        options.module
      );
    }

    if (options.limit) {
      params.set(
        "limit",
        options.limit
      );
    }

    if (options.page) {
      params.set(
        "page",
        options.page
      );
    }

    const query =
      params.toString();

    const response = await fetch(
      `${options.endpoint || CONFIG.endpoint}${
        query ? `?${query}` : ""
      }`,
      {
        method: "GET",

        headers: {
          Accept:
            "application/json"
        },

        credentials: "include"
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        "Unable to load AI history."
      );
    }

    return data;
  }

  async function getConversation(
    conversationId,
    options = {}
  ) {

    if (!conversationId) {
      throw new Error(
        "Conversation ID is required."
      );
    }

    const response = await fetch(
      `${
        options.conversationEndpoint ||
        "/api/ai/history/"
      }${encodeURIComponent(
        conversationId
      )}`,
      {
        method: "GET",

        headers: {
          Accept:
            "application/json"
        },

        credentials: "include"
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        "Unable to load conversation."
      );
    }

    return data;
  }

  async function remove(
    conversationId,
    options = {}
  ) {

    if (!conversationId) {
      throw new Error(
        "Conversation ID is required."
      );
    }

    const response = await fetch(
      `${
        options.endpoint ||
        CONFIG.endpoint
      }/${encodeURIComponent(
        conversationId
      )}`,
      {
        method: "DELETE",

        headers: {
          Accept:
            "application/json"
        },

        credentials: "include"
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        "Unable to delete AI history."
      );
    }

    return data;
  }

  AI.History = {
    config: CONFIG,
    list,
    getConversation,
    remove
  };

  window.GHRAIHistory =
    AI.History;

})(window);