/**
 * GHAR Buyer Referrals
 */
"use strict";

window.GHARBuyerReferrals = {
  async get() {
    if (window.GHAR?.api?.get) return window.GHAR.api.get("/api/referrals");
    return null;
  },

  async create(data = {}) {
    if (window.GHAR?.api?.post) return window.GHAR.api.post("/api/referrals", data);
    return null;
  }
};
