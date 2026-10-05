/**
 * GHAR Buyer Dashboard
 */
"use strict";

window.GHARBuyerDashboard = {
  async load() {
    if (window.GHAR?.api?.get) {
      return window.GHAR.api.get("/api/buyer/dashboard");
    }
    return null;
  }
};
