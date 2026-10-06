/**
 * ============================================================
 * GHAR - REAL ESTATE PLATFORM
 * Buyer AI Advisor
 * assets/js/buyer-ai-advisor.js
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
    timeout: 30000
  });

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  function normalizeMessage(message) {
    return String(message ?? "").trim();
  }

  function normalizeContext(context) {
    if (
      !context ||
      typeof context !== "object" ||
      Array.isArray(context)
    ) {
      return {};
    }

    return context;
  }

  function createTimeoutController(timeout) {
    if (
      typeof AbortController === "undefined"
    ) {
      return {
        controller: null,
        timer: null
      };
    }

    const controller =
      new AbortController();

    const timer =
      window.setTimeout(
        () => controller.abort(),
        timeout
      );

    return {
      controller,
      timer
    };
  }

  // ----------------------------------------------------------
  // ASK AI
  // ----------------------------------------------------------

  async function ask(
    message,
    context = {}
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

    const normalizedContext =
      normalizeContext(context);

    // --------------------------------------------------------
    // Preferred GHAR API layer
    // --------------------------------------------------------

    if (
      window.GHAR?.api &&
      typeof window.GHAR.api.post ===
        "function"
    ) {

      return window.GHAR.api.post(
        CONFIG.endpoint,
        {
          capability:
            CONFIG.capability,

          message:
            normalizedMessage,

          context:
            normalizedContext
        }
      );
    }

    // --------------------------------------------------------
    // Fallback API request
    // --------------------------------------------------------

    const timeout =
      createTimeoutController(
        CONFIG.timeout
      );

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
              JSON.stringify({
                capability:
                  CONFIG.capability,

                message:
                  normalizedMessage,

                context:
                  normalizedContext
              }),

            signal:
              timeout.controller?.signal
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
            `AI request failed (${response.status})`
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
          "AI request timed out. Please try again."
        );
      }

      throw error;

    } finally {

      if (timeout.timer) {
        window.clearTimeout(
          timeout.timer
        );
      }
    }
  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  const BuyerAIAdvisor = {

    ask,

    config: CONFIG
  };

  window.GHARBuyerAIAdvisor =
    BuyerAIAdvisor;

  GHAR.buyerAIAdvisor =
    BuyerAIAdvisor;

})(window);