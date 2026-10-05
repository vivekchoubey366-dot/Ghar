/**
 * GHAR Buyer Support
 */
"use strict";

window.GHARBuyerSupport = {
  async tickets() {
    if (window.GHAR?.api?.get) return window.GHAR.api.get("/api/support/tickets");
    return { items: [] };
  },

  async createTicket(data) {
    if (window.GHAR?.api?.post) return window.GHAR.api.post("/api/support/tickets", data);
    return null;
  }
};
