// ============================================================
// GHAR AI - FEEDBACK
// ============================================================

"use strict";

(function (window) {

  const GHAR = window.GHAR = window.GHAR || {};
  const AI = GHAR.AI = GHAR.AI || {};

  const CONFIG = {
    endpoint: "/api/ai/feedback"
  };

  async function submit(
    feedback,
    options = {}
  ) {

    const payload = {
      rating:
        Number(feedback?.rating) ||
        null,

      helpful:
        feedback?.helpful ??
        null,

      comment:
        String(
          feedback?.comment || ""
        ).slice(0, 5000),

      module:
        feedback?.module ||
        options.module ||
        null,

      conversationId:
        feedback?.conversationId ||
        options.conversationId ||
        null,

      messageId:
        feedback?.messageId ||
        options.messageId ||
        null,

      propertyId:
        feedback?.propertyId ||
        options.propertyId ||
        null,

      metadata:
        feedback?.metadata ||
        options.metadata ||
        {}
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
        "Unable to submit AI feedback."
      );
    }

    return data;
  }

  async function rate(
    rating,
    options = {}
  ) {

    return submit(
      {
        rating,
        helpful:
          Number(rating) >= 4,
        comment:
          options.comment || ""
      },
      options
    );
  }

  AI.Feedback = {
    config: CONFIG,
    submit,
    rate
  };

  window.GHARAIFeedback =
    AI.Feedback;

})(window);