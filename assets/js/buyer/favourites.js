/**
 * GHAR Buyer Favourites
 */
"use strict";

window.GHARBuyerFavourites = {
  async list() {
    if (window.GHAR?.api?.get) return window.GHAR.api.get("/api/favourites");
    return { items: [] };
  },

  async toggle(propertyId) {
    if (!propertyId) throw new Error("propertyId is required.");
    if (window.GHAR?.api?.post) {
      return window.GHAR.api.post("/api/favourites/toggle", { propertyId });
    }
    return null;
  }
};
