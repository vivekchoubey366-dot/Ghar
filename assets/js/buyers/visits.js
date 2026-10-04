/**
 * GHAR Buyer Visits
 */
"use strict";

window.GHARBuyerVisits = {
  async list(params = {}) {
    if (window.GHAR?.api?.get) return window.GHAR.api.get("/api/visits", params);
    return { items: [] };
  },

  async schedule(data) {
    if (window.GHAR?.api?.post) return window.GHAR.api.post("/api/visits", data);
    return null;
  },

  async cancel(visitId) {
    if (!visitId) throw new Error("visitId is required.");
    if (window.GHAR?.api?.delete) {
      return window.GHAR.api.delete(`/api/visits/${encodeURIComponent(visitId)}`);
    }
    return null;
  }
};
