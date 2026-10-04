// ============================================================
// GHAR AI - FRAUD DETECTION
// ============================================================

"use strict";

(function (window) {

  const GHAR = window.GHAR = window.GHAR || {};
  const AI = GHAR.AI = GHAR.AI || {};

  const CONFIG = {
    endpoint: "/api/ai/fraud"
  };

  async function analyze(
    data,
    options = {}
  ) {

    const payload = {
      user:
        data?.user ||
        options.user ||
        null,

      property:
        data?.property ||
        options.property ||
        null,

      transaction:
        data?.transaction ||
        options.transaction ||
        null,

      documents:
        data?.documents ||
        options.documents ||
        [],

      behavior:
        data?.behavior ||
        options.behavior ||
        {},

      signals:
        data?.signals ||
        options.signals ||
        []
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

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
        result.message ||
        "Fraud detection failed."
      );
    }

    return result;
  }

  function getRiskLevel(result) {

    const score =
      Number(
        result?.riskScore ??
        result?.score ??
        0
      );

    if (score >= 80) {
      return "HIGH";
    }

    if (score >= 50) {
      return "MEDIUM";
    }

    return "LOW";
  }

  AI.FraudDetection = {
    config: CONFIG,
    analyze,
    getRiskLevel
  };

  window.GHARAIFraudDetection =
    AI.FraudDetection;

})(window);