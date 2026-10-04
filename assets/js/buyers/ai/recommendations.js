/**
 * GHAR Buyer AI Recommendations
 */
"use strict";

window.GHARBuyerAIRecommendations = {
  async get(criteria = {}) {
    if (window.GHAR?.api?.post) {
      return window.GHAR.api.post("/api/ai", {
        capability: "recommendations",
        profile: criteria
      });
    }
    return null;
  }
};
