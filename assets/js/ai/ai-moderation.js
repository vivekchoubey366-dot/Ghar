// ============================================================
// GHAR AI - MODERATION
// ============================================================

"use strict";

(function (window) {

  const GHAR = window.GHAR = window.GHAR || {};
  const AI = GHAR.AI = GHAR.AI || {};

  const CONFIG = {
    endpoint: "/api/ai/moderation"
  };

  async function moderate(
    content,
    options = {}
  ) {

    if (!content) {
      throw new Error(
        "Content is required."
      );
    }

    const payload = {
      content:
        String(content).slice(0, 20000),

      contentType:
        options.contentType ||
        "text",

      context:
        options.context || {},

      userId:
        options.userId || null,

      propertyId:
        options.propertyId || null
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
        "Moderation request failed."
      );
    }

    return data;
  }

  AI.Moderation = {
    config: CONFIG,
    moderate
  };

  window.GHARAIModeration =
    AI.Moderation;

})(window);