// ============================================================
// GHAR AI - PROPERTY RECOMMENDATIONS
// ============================================================

"use strict";

(function (window) {

  const GHAR = window.GHAR = window.GHAR || {};
  const AI = GHAR.AI = GHAR.AI || {};

  const CONFIG = {
    endpoint: "/api/ai/recommendations"
  };

  async function getRecommendations(
    options = {}
  ) {

    const payload = {
      userId:
        options.userId || null,

      profile:
        options.profile || null,

      preferences:
        options.preferences || {},

      viewedProperties:
        options.viewedProperties || [],

      savedProperties:
        options.savedProperties || [],

      favouriteProperties:
        options.favouriteProperties || [],

      location:
        options.location || null,

      budget:
        options.budget || null,

      purpose:
        options.purpose || null,

      limit:
        options.limit || 10
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
        "Unable to load recommendations."
      );
    }

    return data;
  }

  function getProperties(result) {

    return (
      result?.properties ||
      result?.recommendations ||
      result?.data ||
      []
    );
  }

  AI.Recommendations = {
    config: CONFIG,
    getRecommendations,
    getProperties
  };

  window.GHARAIRecommendations =
    AI.Recommendations;

})(window);