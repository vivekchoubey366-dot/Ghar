/**
 * GHAR Buyer Applications
 */
"use strict";

window.GHARBuyerApplications = {
  async list() {
    if (window.GHAR?.api?.get) return window.GHAR.api.get("/api/applications");
    return { items: [] };
  },

  async create(data) {
    if (window.GHAR?.api?.post) return window.GHAR.api.post("/api/applications", data);
    return null;
  }
};
