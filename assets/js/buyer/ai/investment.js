/**
 * GHAR Buyer AI Investment
 */
"use strict";

window.GHARBuyerAIInvestment = {
  async analyze(inputs = {}) {
    if (window.GHAR?.api?.post) {
      return window.GHAR.api.post("/api/ai", {
        capability: "investment",
        inputs
      });
    }
    return null;
  }
};
