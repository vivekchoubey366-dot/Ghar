/**
 * GHAR Buyer Properties
 */
"use strict";

window.GHARBuyerProperties = {
  async list(params = {}) {
    if (window.GHAR?.api?.get) {
      return window.GHAR.api.get("/api/properties", params);
    }
    return { items: [] };
  }
};
