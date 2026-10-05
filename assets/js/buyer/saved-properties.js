/**
 * GHAR Buyer Saved Properties
 */
"use strict";

window.GHARBuyerSavedProperties = {
  async list() {
    if (window.GHAR?.api?.get) return window.GHAR.api.get("/api/saved-properties");
    return { items: [] };
  },

  async save(propertyId) {
    if (!propertyId) throw new Error("propertyId is required.");
    if (window.GHAR?.api?.post) {
      return window.GHAR.api.post("/api/saved-properties", { propertyId });
    }
    return null;
  },

  async remove(propertyId) {
    if (!propertyId) throw new Error("propertyId is required.");
    if (window.GHAR?.api?.delete) {
      return window.GHAR.api.delete(`/api/saved-properties/${encodeURIComponent(propertyId)}`);
    }
    return null;
  }
};
