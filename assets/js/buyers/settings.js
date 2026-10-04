/**
 * GHAR Buyer Settings
 */
"use strict";

window.GHARBuyerSettings = {
  async get() {
    if (window.GHAR?.api?.get) return window.GHAR.api.get("/api/user/settings");
    return {};
  },

  async update(data) {
    if (window.GHAR?.api?.put) return window.GHAR.api.put("/api/user/settings", data);
    return null;
  }
};
