/**
 * GHAR Buyer AI Chat
 */
"use strict";

window.GHARBuyerAIChat = {
  async send(message, conversationId = null) {
    if (!String(message || "").trim()) throw new Error("Message is required.");

    if (window.GHAR?.api?.post) {
      return window.GHAR.api.post("/api/ai", {
        capability: "chat",
        message,
        conversationId
      });
    }
    return null;
  }
};
