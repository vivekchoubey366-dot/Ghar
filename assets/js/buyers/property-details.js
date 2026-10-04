/**
 * GHAR Buyer Property Details
 */
"use strict";

window.GHARBuyerPropertyDetails = {
  async get(propertyId) {
    if (!propertyId) throw new Error("propertyId is required.");
    if (window.GHAR?.api?.get) {
      return window.GHAR.api.get(`/api/properties/${encodeURIComponent(propertyId)}`);
    }
    return null;
  }
};
