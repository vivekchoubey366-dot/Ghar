/**
 * GHAR Buyer Messages
 */
"use strict";

window.GHARBuyerMessages = {
  async conversations() {
    if (window.GHAR?.api?.get) return window.GHAR.api.get("/api/messages");
    return { items: [] };
  },

  async send(conversationId, message) {
    if (!conversationId || !String(message || "").trim()) {
      throw new Error("conversationId and message are required.");
    }
    if (window.GHAR?.api?.post) {
      return window.GHAR.api.post("/api/messages", { conversationId, message });
    }
    return null;
  }
};
