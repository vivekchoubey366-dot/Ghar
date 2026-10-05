/**
 * GHAR Buyer Property Search
 */
"use strict";

window.GHARBuyerSearch = {
  async search(criteria = {}) {
    if (window.GHAR?.api?.get) {
      return window.GHAR.api.get("/api/search", criteria);
    }
    return { items: [], criteria };
  }
};
