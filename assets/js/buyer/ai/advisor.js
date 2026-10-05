/**
 * GHAR Buyer AI Advisor
 */
"use strict";

window.GHARBuyerAIAdvisor = {
  async ask(message, context = {}) {
    if (!String(message || "").trim()) throw new Error("Message is required.");
    if (window.GHAR?.api?.post) {
      return window.GHAR.api.post("/api/ai", {
        capability: "chat",
        message,
        context
      });
    }
    return null;
  }
};
