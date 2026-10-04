/**
 * GHAR Buyer Payments
 */
"use strict";

window.GHARBuyerPayments = {
  async list(params = {}) {
    if (window.GHAR?.api?.get) return window.GHAR.api.get("/api/payments", params);
    return { items: [] };
  },

  async createCheckout(data) {
    if (window.GHAR?.api?.post) return window.GHAR.api.post("/api/payments/checkout", data);
    return null;
  }
};
