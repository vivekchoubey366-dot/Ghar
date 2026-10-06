/**
 * ============================================================
 * GHAR - REAL ESTATE PLATFORM
 * Buyer AI Chat
 * assets/js/buyer-ai-chat.js
 * ============================================================
 */

"use strict";

(function (window) {

  // ----------------------------------------------------------
  // GHAR NAMESPACE
  // ----------------------------------------------------------

  window.GHAR = window.GHAR || {};

  // ----------------------------------------------------------
  // CONFIGURATION
  // ----------------------------------------------------------

  const CONFIG = Object.freeze({
    endpoint: "/ai",
    capability: "chat",

    maxMessageLength: 5000,

    timeout: 30000,

    maxConversationIdLength: 128
  });

  // ----------------------------------------------------------
  // NORMALIZE MESSAGE
  // ----------------------------------------------------------

  function normalizeMessage(message) {
    return String(message ?? "").trim();
  }

  // ----------------------------------------------------------
  // NORMALIZE CONVERSATION ID
  // ----------------------------------------------------------

  function normalizeConversationId(
    conversationId
  ) {
    if (
      conversationId === null ||
      conversationId === undefined ||
      conversationId === ""
    ) {
      return null;
    }

    const value =
      String(conversationId).trim();

    if (!value) {
      return null;
    }

    if (
      value.length >
      CONFIG.maxConversationIdLength
    ) {
      throw new Error(
        "Conversation ID is too long."
      );
    }

    return value;
  }

  // ----------------------------------------------------------
  // REQUEST
  // ----------------------------------------------------------

  async function request(payload) {

    // Preferred GHAR API layer
    if (
      window.GHAR?.api &&
      typeof window.GHAR.api.post ===
        "function"
    ) {
      return window.GHAR.api.post(
        CONFIG.endpoint,
        payload
      );
    }

    // Fallback request
    const controller =
      typeof AbortController !==
      "undefined"
        ? new AbortController()
        : null;

    const timer =
      controller
        ? window.setTimeout(
            () => controller.abort(),
            CONFIG.timeout
          )
        : null;

    try {

      const response =
        await fetch(
          CONFIG.endpoint,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json"
            },

            credentials:
              "include",

            body:
              JSON.stringify(payload),

            signal:
              controller?.signal
          }
        );

      let data = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {

        const error =
          new Error(
            data?.message ||
            data?.error ||
            `AI chat request failed (${response.status})`
          );

        error.status =
          response.status;

        error.data =
          data;

        throw error;
      }

      return data;

    } catch (error) {

      if (
        error?.name ===
        "AbortError"
      ) {
        throw new Error(
          "AI response timed out. Please try again."
        );
      }

      throw error;

    } finally {

      if (timer) {
        window.clearTimeout(timer);
      }
    }
  }

  // ----------------------------------------------------------
  // SEND MESSAGE
  // ----------------------------------------------------------

  async function send(
    message,
    conversationId = null
  ) {

    const normalizedMessage =
      normalizeMessage(message);

    if (!normalizedMessage) {
      throw new Error(
        "Message is required."
      );
    }

    if (
      normalizedMessage.length >
      CONFIG.maxMessageLength
    ) {
      throw new Error(
        `Message cannot exceed ${CONFIG.maxMessageLength} characters.`
      );
    }

    const normalizedConversationId =
      normalizeConversationId(
        conversationId
      );

    return request({
      capability:
        CONFIG.capability,

      message:
        normalizedMessage,

      conversationId:
        normalizedConversationId
    });
  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  const BuyerAIChat = {

    send,

    config: CONFIG
  };

  window.GHARBuyerAIChat =
    BuyerAIChat;

  GHAR.buyerAIChat =
    BuyerAIChat;

})(window);