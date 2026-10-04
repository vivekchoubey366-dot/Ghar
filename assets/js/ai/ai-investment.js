// ============================================================
// GHAR AI - INVESTMENT ADVISOR
// ============================================================

"use strict";

(function (window) {

  const GHAR = window.GHAR = window.GHAR || {};
  const AI = GHAR.AI = GHAR.AI || {};

  const CONFIG = {
    endpoint: "/api/ai/investment"
  };

  async function analyze(property, options = {}) {

    const payload = {
      property: property || {},

      investmentAmount:
        options.investmentAmount || null,

      holdingPeriod:
        options.holdingPeriod || null,

      expectedRent:
        options.expectedRent || null,

      expectedAppreciation:
        options.expectedAppreciation || null,

      location:
        options.location || null,

      objective:
        options.objective ||
        "long_term",

      assumptions:
        options.assumptions || {}
    };

    const response = await fetch(
      options.endpoint || CONFIG.endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        "Investment analysis failed."
      );
    }

    return data;
  }

  AI.Investment = {
    config: CONFIG,
    analyze
  };

  window.GHARAInvestment =
    AI.Investment;

})(window);