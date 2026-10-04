// ============================================================
// GHAR AI - LOAN ADVISOR
// ============================================================

"use strict";

(function (window) {

  const GHAR = window.GHAR = window.GHAR || {};
  const AI = GHAR.AI = GHAR.AI || {};

  const CONFIG = {
    endpoint: "/api/ai/loan"
  };

  async function assess(options = {}) {

    const payload = {
      income:
        Number(options.income) || 0,

      monthlyIncome:
        Number(options.monthlyIncome) || 0,

      existingEMI:
        Number(options.existingEMI) || 0,

      downPayment:
        Number(options.downPayment) || 0,

      propertyPrice:
        Number(options.propertyPrice) || 0,

      tenure:
        Number(options.tenure) || 0,

      interestRate:
        Number(options.interestRate) || 0,

      creditScore:
        Number(options.creditScore) || null,

      employment:
        options.employment || null,

      property:
        options.property || null
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
        "Loan assessment failed."
      );
    }

    return data;
  }

  function calculateEMI(
    principal,
    annualRate,
    years
  ) {

    const P = Number(principal) || 0;
    const r =
      (Number(annualRate) || 0) /
      12 /
      100;

    const n =
      (Number(years) || 0) *
      12;

    if (!P || !n) return 0;

    if (!r) {
      return P / n;
    }

    return (
      P *
      r *
      Math.pow(1 + r, n)
    ) /
    (
      Math.pow(1 + r, n) - 1
    );
  }

  AI.LoanAdvisor = {
    config: CONFIG,
    assess,
    calculateEMI
  };

  window.GHARAILoanAdvisor =
    AI.LoanAdvisor;

})(window);