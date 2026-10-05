/**
 * GHAR Buyer Offers
 */
"use strict";

window.GHARBuyerOffers = {
  async list() {
    if (window.GHAR?.api?.get) return window.GHAR.api.get("/api/offers");
    return { items: [] };
  },

  async create(data) {
    if (window.GHAR?.api?.post) return window.GHAR.api.post("/api/offers", data);
    return null;
  },

  async withdraw(offerId) {
    if (!offerId) throw new Error("offerId is required.");
    if (window.GHAR?.api?.post) {
      return window.GHAR.api.post(`/api/offers/${encodeURIComponent(offerId)}/withdraw`);
    }
    return null;
  }
};
