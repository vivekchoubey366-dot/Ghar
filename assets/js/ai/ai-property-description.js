// ============================================================
// GHAR AI - PROPERTY DESCRIPTION GENERATOR
// ============================================================

"use strict";

(function (window) {

  const GHAR = window.GHAR = window.GHAR || {};
  const AI = GHAR.AI = GHAR.AI || {};

  const CONFIG = {
    endpoint: "/api/ai/property-description"
  };

  async function generate(
    property,
    options = {}
  ) {

    const payload = {
      property:
        property || {},

      tone:
        options.tone ||
        "professional",

      length:
        options.length ||
        "medium",

      language:
        options.language ||
        "en",

      audience:
        options.audience ||
        "buyers",

      includeSEO:
        options.includeSEO !== false,

      includeHighlights:
        options.includeHighlights !== false
    };

    const response = await fetch(
      options.endpoint || CONFIG.endpoint,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json"
        },

        credentials: "include",

        body:
          JSON.stringify(payload)
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        "Property description generation failed."
      );
    }

    return data;
  }

  AI.PropertyDescription = {
    config: CONFIG,
    generate
  };

  window.GHARAIPropertyDescription =
    AI.PropertyDescription;

})(window);