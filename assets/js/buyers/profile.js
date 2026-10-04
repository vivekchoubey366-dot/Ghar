/**
 * GHAR Buyer Profile
 */
"use strict";

window.GHARBuyerProfile = {
  async get() {
    if (window.GHAR?.api?.get) return window.GHAR.api.get("/api/user/profile");
    return null;
  },

  async update(data) {
    if (window.GHAR?.api?.put) return window.GHAR.api.put("/api/user/profile", data);
    return null;
  }
};
