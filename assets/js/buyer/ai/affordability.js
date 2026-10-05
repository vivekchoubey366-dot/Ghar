/**
 * GHAR Buyer AI Affordability
 */
"use strict";

window.GHARBuyerAIAffordability = {
  async calculate(inputs = {}) {
    if (window.GHAR?.api?.post) {
      return window.GHAR.api.post("/api/ai", {
        capability: "loans",
        ...inputs
      });
    }
    return null;
  }
};
