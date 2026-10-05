/**
 * GHAR Buyer Loans
 */
"use strict";

window.GHARBuyerLoans = {
  async list() {
    if (window.GHAR?.api?.get) return window.GHAR.api.get("/api/loans");
    return { items: [] };
  },

  async apply(data) {
    if (window.GHAR?.api?.post) return window.GHAR.api.post("/api/loans/applications", data);
    return null;
  }
};
