/**
 * ============================================================
 * GHAR - REAL ESTATE PLATFORM
 * Buyer AI Investment Advisor
 * assets/js/buyer-ai-investment.js
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
    capability: "investment",

    timeout: 30000,

    defaults: {
      propertyPrice: 0,
      downPayment: 0,
      loanAmount: 0,

      monthlyRent: 0,
      annualRent: 0,

      expectedAppreciation: 0,
      rentalYield: 0,

      maintenance: 0,
      annualExpenses: 0,

      holdingPeriodYears: 0,

      interestRate: 0,
      tenureYears: 0,

      location: "",
      propertyType: "",
      propertyStatus: ""
    }
  });

  // ----------------------------------------------------------
  // NUMBER NORMALIZATION
  // ----------------------------------------------------------

  function toNumber(
    value,
    fallback = 0
  ) {
    const number =
      Number(
        String(value ?? "")
          .replace(/,/g, "")
          .trim()
      );

    return Number.isFinite(number)
      ? number
      : fallback;
  }

  // ----------------------------------------------------------
  // INPUT NORMALIZATION
  // ----------------------------------------------------------

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

      propertyPrice:
        toNumber(
          inputs.propertyPrice
        ),

      downPayment:
        toNumber(
          inputs.downPayment
        ),

      loanAmount:
        toNumber(
          inputs.loanAmount
        ),

      monthlyRent:
        toNumber(
          inputs.monthlyRent
        ),

      annualRent:
        toNumber(
          inputs.annualRent
        ),

      expectedAppreciation:
        toNumber(
          inputs.expectedAppreciation
        ),

      rentalYield:
        toNumber(
          inputs.rentalYield
        ),

      maintenance:
        toNumber(
          inputs.maintenance
        ),

      annualExpenses:
        toNumber(
          inputs.annualExpenses
        ),

      holdingPeriodYears:
        toNumber(
          inputs.holdingPeriodYears
        ),

      interestRate:
        toNumber(
          inputs.interestRate
        ),

      tenureYears:
        toNumber(
          inputs.tenureYears
        ),

      location:
        String(
          inputs.location ?? ""
        ).trim(),

      propertyType:
        String(
          inputs.propertyType ?? ""
        ).trim(),

      propertyStatus:
        String(
          inputs.propertyStatus ?? ""
        ).trim()
    };
  }

  // ----------------------------------------------------------
  // INPUT VALIDATION
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
      inputs.loanAmount < 0
    ) {
      errors.push(
        "Loan amount cannot be negative."
      );
    }

    if (
      inputs.monthlyRent < 0
    ) {
      errors.push(
        "Monthly rent cannot be negative."
      );
    }

    if (
      inputs.annualRent < 0
    ) {
      errors.push(
        "Annual rent cannot be negative."
      );
    }

    if (
      inputs.expectedAppreciation < 0
    ) {
      errors.push(
        "Expected appreciation cannot be negative."
      );
    }

    if (
      inputs.rentalYield < 0
    ) {
      errors.push(
        "Rental yield cannot be negative."
      );
    }

    if (
      inputs.maintenance < 0
    ) {
      errors.push(
        "Maintenance cost cannot be negative."
      );
    }

    if (
      inputs.annualExpenses < 0
    ) {
      errors.push(
        "Annual expenses cannot be negative."
      );
    }

    if (
      inputs.holdingPeriodYears < 0
    ) {
      errors.push(
        "Holding period cannot be negative."
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
  // BASIC INVESTMENT CALCULATIONS
  // ----------------------------------------------------------

  function calculateAnnualRent(
    inputs
  ) {

    if (
      inputs.annualRent > 0
    ) {
      return inputs.annualRent;
    }

    return (
      inputs.monthlyRent * 12
    );
  }

  function calculateRentalYield(
    propertyPrice,
    annualRent
  ) {

    const price =
      toNumber(propertyPrice);

    const rent =
      toNumber(annualRent);

    if (
      price <= 0 ||
      rent <= 0
    ) {
      return 0;
    }

    return (
      rent /
      price *
      100
    );
  }

  function calculateFutureValue(
    propertyPrice,
    appreciation,
    years
  ) {

    const price =
      toNumber(propertyPrice);

    const rate =
      toNumber(appreciation);

    const period =
      toNumber(years);

    if (
      price <= 0 ||
      period <= 0
    ) {
      return price;
    }

    return (
      price *
      Math.pow(
        1 + rate / 100,
        period
      )
    );
  }

  function calculateTotalRent(
    monthlyRent,
    years
  ) {

    return (
      toNumber(monthlyRent) *
      12 *
      toNumber(years)
    );
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

    // Fallback request
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
            `Investment analysis failed (${response.status})`
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
          "Investment analysis timed out. Please try again."
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
  // INVESTMENT ANALYSIS
  // ----------------------------------------------------------

  async function analyze(
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

    const annualRent =
      calculateAnnualRent(
        normalized
      );

    const calculatedYield =
      calculateRentalYield(
        normalized.propertyPrice,
        annualRent
      );

    const futureValue =
      calculateFutureValue(
        normalized.propertyPrice,
        normalized.expectedAppreciation,
        normalized.holdingPeriodYears
      );

    const totalRent =
      calculateTotalRent(
        normalized.monthlyRent,
        normalized.holdingPeriodYears
      );

    return request({

      capability:
        CONFIG.capability,

      inputs:
        normalized,

      calculated: {
        annualRent,
        rentalYield:
          calculatedYield,
        estimatedFutureValue:
          futureValue,
        estimatedTotalRent:
          totalRent
      }
    });
  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  const BuyerAIInvestment = {

    analyze,

    normalizeInputs,

    validateInputs,

    calculateAnnualRent,

    calculateRentalYield,

    calculateFutureValue,

    calculateTotalRent,

    config:
      CONFIG
  };

  window.GHARBuyerAIInvestment =
    BuyerAIInvestment;

  GHAR.buyerAIInvestment =
    BuyerAIInvestment;

})(window);