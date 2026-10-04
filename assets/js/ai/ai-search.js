// ============================================================
// GHAR AI - PROPERTY SEARCH
// ============================================================

"use strict";

(function (window) {

  const GHAR = window.GHAR = window.GHAR || {};
  const AI = GHAR.AI = GHAR.AI || {};

  const CONFIG = {
    endpoint: "/api/ai/search"
  };

  function normalizeQuery(query) {
    return String(query || "")
      .trim()
      .slice(0, 2000);
  }

  async function search(query, options = {}) {

    const text = normalizeQuery(query);

    if (!text) {
      throw new Error("Search query is required.");
    }

    const payload = {
      query: text,
      location: options.location || null,
      purpose: options.purpose || null,
      propertyType:
        options.propertyType || null,
      budget: options.budget || null,
      bedrooms: options.bedrooms || null,
      filters: options.filters || {},
      limit: options.limit || 20
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
        "AI property search failed."
      );
    }

    return data;
  }

  async function searchByNaturalLanguage(
    query,
    options = {}
  ) {
    return search(query, options);
  }

  AI.Search = {
    config: CONFIG,
    search,
    searchByNaturalLanguage,
    normalizeQuery
  };

  window.GHARAIPropertySearch =
    AI.Search;

})(window);