// ============================================================
// GHAR AI - DOCUMENT ASSISTANT
// ============================================================

"use strict";

(function (window) {

  const GHAR = window.GHAR = window.GHAR || {};
  const AI = GHAR.AI = GHAR.AI || {};

  const CONFIG = {
    endpoint: "/api/ai/documents"
  };

  async function analyzeDocument(
    file,
    options = {}
  ) {

    if (!file) {
      throw new Error(
        "Document file is required."
      );
    }

    const formData =
      new FormData();

    formData.append(
      "document",
      file
    );

    if (options.documentType) {
      formData.append(
        "documentType",
        options.documentType
      );
    }

    if (options.propertyId) {
      formData.append(
        "propertyId",
        options.propertyId
      );
    }

    const response = await fetch(
      options.endpoint || CONFIG.endpoint,
      {
        method: "POST",
        credentials: "include",
        body: formData
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        "Document analysis failed."
      );
    }

    return data;
  }

  async function ask(
    question,
    options = {}
  ) {

    const response = await fetch(
      options.questionEndpoint ||
      "/api/ai/documents/question",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json"
        },

        credentials: "include",

        body: JSON.stringify({
          question,
          documentId:
            options.documentId ||
            null
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        "Document question failed."
      );
    }

    return data;
  }

  AI.DocumentAssistant = {
    config: CONFIG,
    analyzeDocument,
    ask
  };

  window.GHAIDocumentAssistant =
    AI.DocumentAssistant;

})(window);