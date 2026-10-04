// ============================================================
// GHAR AI - RENTAL ADVISOR
// ============================================================

"use strict";

(function (window) {

  const GHAR = window.GHAR = window.GHAR || {};
  const AI = GHAR.AI = GHAR.AI || {};

  const CONFIG = {
    endpoint: "/api/ai/rental"
  };

  async function advise(
    property,
    options = {}
  ) {

    const payload = {
      property:
        property || {},

      tenantProfile:
        options.tenantProfile || null,

      location:
        options.location || null,

      budget:
        options.budget || null,

      preferredRent:
        options.preferredRent || null,

      leaseDuration:
        options.leaseDuration || null,

      furnished:
        options.furnished || null,

      purpose:
        options.purpose ||
        "residential"
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
        "Rental advice failed."
      );
    }

    return data;
  }

  async function estimateRent(
    property,
    options = {}
  ) {

    return advise(
      property,
      {
        ...options,
        mode: "rent_estimation"
      }
    );
  }

  AI.RentalAdvisor = {
    config: CONFIG,
    advise,
    estimateRent
  };

  window.GHRAIRentalAdvisor =
    AI.RentalAdvisor;

})(window);