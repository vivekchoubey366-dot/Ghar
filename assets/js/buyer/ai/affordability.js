 /**
 * ============================================================
 * GHAR - REAL ESTATE PLATFORM
 * Buyer AI Affordability
 * assets/js/buyer-ai-affordability.js
 * ============================================================
 */

"use strict";

(function (window) {

  // ----------------------------------------------------------
  // GHAR NAMESPACE
  // ----------------------------------------------------------

  window.GHAR = window.GHAR || {};

  // ----------------------------------------------------------
  // CONFIGURATION
  // ----------------------------------------------------------

  const CONFIG = Object.freeze({
    endpoint: "/ai",
    capability: "loans",
    timeout: 30000,

    defaults: {
      income: 0,
      monthlyIncome: 0,
      existingEMI: 0,
      downPayment: 0,
      propertyPrice: 0,
      loanAmount: 0,
      interestRate: 0,
      tenureYears: 0,
      creditScore: null
    }
  });

  // ----------------------------------------------------------
  // NUMBER NORMALIZATION
  // ----------------------------------------------------------

  function number(value, fallback = 0) {
    const parsed =
      Number(
        String(value ?? "")
          .replace(/,/g, "")
          .trim()
      );

    return Number.isFinite(parsed)
      ? parsed
      : fallback;
  }

  function normalizeInputs(inputs) {

    if (
      !inputs ||
      typeof inputs !== "object" ||
      Array.isArray(inputs)
    ) {
      return {
        ...CONFIG.defaults
      };
    }

    return {
      ...CONFIG.defaults,

      ...inputs,

      income:
        number(inputs.income),

      monthlyIncome:
        number(inputs.monthlyIncome),

      existingEMI:
        number(inputs.existingEMI),

      downPayment:
        number(inputs.downPayment),

      propertyPrice:
        number(inputs.propertyPrice),

      loanAmount:
        number(inputs.loanAmount),

      interestRate:
        number(inputs.interestRate),

      tenureYears:
        number(inputs.tenureYears),

      creditScore:
        inputs.creditScore === null ||
        inputs.creditScore === undefined ||
        inputs.creditScore === ""
          ? null
          : number(
              inputs.creditScore,
              null
            )
    };
  }

  // ----------------------------------------------------------
  // BASIC INPUT VALIDATION
  // ----------------------------------------------------------

  function validateInputs(inputs) {

    const errors = [];

    if (
      inputs.propertyPrice < 0
    ) {
      errors.push(
        "Property price cannot be negative."
      );
    }

    if (
      inputs.downPayment < 0
    ) {
      errors.push(
        "Down payment cannot be negative."
      );
    }

    if (
      inputs.existingEMI < 0
    ) {
      errors.push(
        "Existing EMI cannot be negative."
      );
    }

    if (
      inputs.interestRate < 0
    ) {
      errors.push(
        "Interest rate cannot be negative."
      );
    }

    if (
      inputs.tenureYears < 0
    ) {
      errors.push(
        "Loan tenure cannot be negative."
      );
    }

    if (
      inputs.propertyPrice > 0 &&
      inputs.downPayment >
        inputs.propertyPrice
    ) {
      errors.push(
        "Down payment cannot exceed property price."
      );
    }

    return errors;
  }

  // ----------------------------------------------------------
  // API REQUEST
  // ----------------------------------------------------------

  async function request(
    payload
  ) {

    // Preferred GHAR API layer
    if (
      window.GHAR?.api &&
      typeof window.GHAR.api.post ===
        "function"
    ) {

      return window.GHAR.api.post(
        CONFIG.endpoint,
        payload
      );
    }

    // Fallback
    const controller =
      typeof AbortController !==
      "undefined"
        ? new AbortController()
        : null;

    const timer =
      controller
        ? window.setTimeout(
            () => controller.abort(),
            CONFIG.timeout
          )
        : null;

    try {

      const response =
        await fetch(
          CONFIG.endpoint,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json"
            },

            credentials:
              "include",

            body:
              JSON.stringify(payload),

            signal:
              controller?.signal
          }
        );

      let data = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {

        const error =
          new Error(
            data?.message ||
            data?.error ||
            `Affordability request failed (${response.status})`
          );

        error.status =
          response.status;

        error.data =
          data;

        throw error;
      }

      return data;

    } catch (error) {

      if (
        error?.name ===
        "AbortError"
      ) {
        throw new Error(
          "Affordability calculation timed out. Please try again."
        );
      }

      throw error;

    } finally {

      if (timer) {
        window.clearTimeout(timer);
      }
    }
  }

  // ----------------------------------------------------------
  // CALCULATE AFFORDABILITY
  // ----------------------------------------------------------

  async function calculate(
    inputs = {}
  ) {

    const normalized =
      normalizeInputs(inputs);

    const errors =
      validateInputs(normalized);

    if (errors.length) {

      const error =
        new Error(
          errors.join(" ")
        );

      error.validationErrors =
        errors;

      throw error;
    }

    return request({
      capability:
        CONFIG.capability,

      inputs:
        normalized
    });
  }

  // ----------------------------------------------------------
  // EMI CALCULATION
  // ----------------------------------------------------------

  function calculateEMI(
    principal,
    annualRate,
    tenureYears
  ) {

    const P =
      number(principal);

    const years =
      number(tenureYears);

    const annual =
      number(annualRate);

    if (
      P <= 0 ||
      years <= 0
    ) {
      return 0;
    }

    if (annual === 0) {
      return (
        P /
        (years * 12)
      );
    }

    const monthlyRate =
      annual /
      100 /
      12;

    const months =
      years * 12;

    return (
      P *
      monthlyRate *
      Math.pow(
        1 + monthlyRate,
        months
      ) /
      (
        Math.pow(
          1 + monthlyRate,
          months
        ) - 1
      )
    );
  }

  // ----------------------------------------------------------
  // ESTIMATE LOAN AMOUNT
  // ----------------------------------------------------------

  function estimateLoanAmount(
    propertyPrice,
    downPayment
  ) {

    const price =
      number(propertyPrice);

    const down =
      number(downPayment);

    return Math.max(
      0,
      price - down
    );
  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  const BuyerAIAffordability = {

    calculate,

    calculateEMI,

    estimateLoanAmount,

    validateInputs,

    normalizeInputs,

    config: CONFIG
  };

  window.GHARBuyerAIAffordability =
    BuyerAIAffordability;

  GHAR.buyerAIAffordability =
    BuyerAIAffordability;

})(window);