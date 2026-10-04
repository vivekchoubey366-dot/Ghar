// ============================================================
// GHAR AI - PRICE ESTIMATOR
// assets/js/ai/ai-price-estimator.js
// ============================================================

"use strict";

(function (window, document) {
  const GHAR = (window.GHAR = window.GHAR || {});
  const AI = (GHAR.AI = GHAR.AI || {});

  const CONFIG = {
    endpoint: "/api/ai/price",
    timeout: 30000,
    currency: "INR",
    locale: "en-IN"
  };

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  function getElement(target) {
    if (!target) return null;

    if (typeof target === "string") {
      return document.querySelector(target);
    }

    return target;
  }

  function number(value, fallback = 0) {
    const parsed = Number(
      String(value ?? "")
        .replace(/,/g, "")
        .replace(/[^\d.-]/g, "")
    );

    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function formatCurrency(value) {
    const amount = number(value);

    return new Intl.NumberFormat(CONFIG.locale, {
      style: "currency",
      currency: CONFIG.currency,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat(CONFIG.locale, {
      maximumFractionDigits: 0
    }).format(number(value));
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // ----------------------------------------------------------
  // INPUT NORMALIZATION
  // ----------------------------------------------------------

  function normalizeProperty(property = {}) {
    return {
      id:
        property.id ||
        property.propertyId ||
        null,

      propertyType:
        property.propertyType ||
        property.type ||
        "",

      listingType:
        property.listingType ||
        property.transactionType ||
        property.purpose ||
        "sale",

      bhk:
        number(property.bhk || property.bedrooms),

      bathrooms:
        number(property.bathrooms || property.baths),

      area:
        number(
          property.area ||
          property.builtUpArea ||
          property.superBuiltUpArea ||
          property.carpetArea
        ),

      areaUnit:
        property.areaUnit ||
        "sqft",

      city:
        property.city ||
        "",

      locality:
        property.locality ||
        property.location ||
        "",

      state:
        property.state ||
        "",

      pincode:
        property.pincode ||
        "",

      floor:
        number(property.floor),

      totalFloors:
        number(property.totalFloors),

      age:
        number(
          property.age ||
          property.propertyAge
        ),

      furnishing:
        property.furnishing ||
        "",

      parking:
        property.parking ||
        "",

      amenities:
        Array.isArray(property.amenities)
          ? property.amenities
          : [],

      latitude:
        property.latitude ?? null,

      longitude:
        property.longitude ?? null,

      currentPrice:
        number(
          property.currentPrice ||
          property.price
        )
    };
  }

  // ----------------------------------------------------------
  // API REQUEST
  // ----------------------------------------------------------

  async function estimate(property, options = {}) {
    const payload = {
      property: normalizeProperty(property),

      user: options.user || null,

      market: options.market || null,

      currency:
        options.currency ||
        CONFIG.currency,

      includeRange:
        options.includeRange !== false,

      includeExplanation:
        options.includeExplanation !== false,

      includeFactors:
        options.includeFactors !== false
    };

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        options.timeout ||
          CONFIG.timeout
      );

    try {
      const response =
        await fetch(
          options.endpoint ||
            CONFIG.endpoint,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",

              ...(options.headers || {})
            },

            credentials:
              options.credentials ||
              "include",

            body:
              JSON.stringify(payload),

            signal:
              controller.signal
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
            data?.error ||
            data?.message ||
            `Price estimation failed (${response.status})`
          );

        error.status =
          response.status;

        error.data =
          data;

        throw error;
      }

      return normalizeResult(
        data,
        payload.property
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  // ----------------------------------------------------------
  // RESULT NORMALIZATION
  // ----------------------------------------------------------

  function normalizeResult(data = {}, property = {}) {
    const source =
      data.result ||
      data.estimate ||
      data.data ||
      data;

    const estimatedPrice =
      number(
        source.estimatedPrice ??
        source.estimated_price ??
        source.price ??
        source.value
      );

    const minPrice =
      number(
        source.minPrice ??
        source.min_price
      );

    const maxPrice =
      number(
        source.maxPrice ??
        source.max_price
      );

    const pricePerSqft =
      number(
        source.pricePerSqft ??
        source.price_per_sqft ??
        source.ratePerSqft
      ) ||
      (
        property.area > 0
          ? estimatedPrice /
            property.area
          : 0
      );

    return {
      ok:
        data.ok !== false,

      estimatedPrice,

      minPrice,

      maxPrice,

      pricePerSqft,

      confidence:
        number(
          source.confidence
        ),

      confidenceLabel:
        source.confidenceLabel ||
        source.confidence_label ||
        "",

      currency:
        source.currency ||
        CONFIG.currency,

      property:
        property,

      factors:
        Array.isArray(
          source.factors
        )
          ? source.factors
          : [],

      explanation:
        source.explanation ||
        source.reason ||
        "",

      comparableProperties:
        Array.isArray(
          source.comparableProperties
        )
          ? source.comparableProperties
          : [],

      market:
        source.market ||
        null,

      raw:
        data
    };
  }

  // ----------------------------------------------------------
  // LOCAL ESTIMATION
  // ----------------------------------------------------------
  // Fallback only.
  //
  // This does NOT replace server-side AI/model valuation.
  // It provides a preliminary estimate when an API is
  // unavailable or when the UI needs an instant calculation.
  // ----------------------------------------------------------

  function localEstimate(property, options = {}) {
    const normalized =
      normalizeProperty(property);

    const area =
      normalized.area;

    if (!area) {
      return {
        ok: false,

        error:
          "Property area is required for local estimation."
      };
    }

    const baseRate =
      number(
        options.baseRate ||
        property.pricePerSqft ||
        property.ratePerSqft
      );

    if (!baseRate) {
      return {
        ok: false,

        error:
          "A local price-per-square-foot rate is required."
      };
    }

    let adjustment = 1;

    // BHK adjustment
    if (normalized.bhk >= 4) {
      adjustment *= 1.08;
    } else if (
      normalized.bhk === 3
    ) {
      adjustment *= 1.04;
    }

    // Furnishing
    const furnishing =
      String(
        normalized.furnishing
      ).toLowerCase();

    if (
      furnishing.includes("fully")
    ) {
      adjustment *= 1.05;
    } else if (
      furnishing.includes("semi")
    ) {
      adjustment *= 1.025;
    }

    // Property age
    if (normalized.age > 20) {
      adjustment *= 0.90;
    } else if (
      normalized.age > 10
    ) {
      adjustment *= 0.95;
    } else if (
      normalized.age > 5
    ) {
      adjustment *= 0.98;
    }

    const estimatedPrice =
      area *
      baseRate *
      adjustment;

    const range =
      options.rangePercent ??
      0.08;

    return {
      ok: true,

      estimatedPrice,

      minPrice:
        estimatedPrice *
        (1 - range),

      maxPrice:
        estimatedPrice *
        (1 + range),

      pricePerSqft:
        estimatedPrice /
        area,

      confidence: 0,

      confidenceLabel:
        "Preliminary",

      currency:
        CONFIG.currency,

      property:
        normalized,

      factors: [
        {
          name:
            "Base market rate",

          value:
            baseRate
        },

        {
          name:
            "Property adjustments",

          value:
            adjustment
        }
      ],

      explanation:
        "This is a preliminary client-side estimate. Use the GHAR AI server endpoint for the official model-based estimate."
    };
  }

  // ----------------------------------------------------------
  // FORM DATA
  // ----------------------------------------------------------

  function collectForm(form) {
    const element =
      getElement(form);

    if (!element) {
      throw new Error(
        "Price estimator form not found."
      );
    }

    const formData =
      new FormData(element);

    const property = {};

    for (
      const [
        key,
        value
      ] of formData.entries()
    ) {
      property[key] = value;
    }

    return normalizeProperty(
      property
    );
  }

  // ----------------------------------------------------------
  // RENDER RESULT
  // ----------------------------------------------------------

  function renderResult(
    container,
    result
  ) {
    const element =
      getElement(container);

    if (!element) return;

    if (!result || result.ok === false) {
      element.innerHTML = `
        <div class="ghar-ai-error" role="alert">
          <strong>Unable to estimate price</strong>
          <p>
            ${escapeHTML(
              result?.error ||
              "Please check the property details and try again."
            )}
          </p>
        </div>
      `;

      return;
    }

    const estimated =
      formatCurrency(
        result.estimatedPrice
      );

    const min =
      result.minPrice
        ? formatCurrency(
            result.minPrice
          )
        : "--";

    const max =
      result.maxPrice
        ? formatCurrency(
            result.maxPrice
          )
        : "--";

    const rate =
      result.pricePerSqft
        ? formatCurrency(
            result.pricePerSqft
          )
        : "--";

    const confidence =
      result.confidence > 0
        ? `${Math.round(
            clamp(
              result.confidence,
              0,
              100
            )
          )}%`
        : "--";

    const factors =
      Array.isArray(
        result.factors
      ) &&
      result.factors.length
        ? `
          <div class="ghar-ai-price-factors">
            ${result.factors
              .map(
                factor => `
                  <div class="ghar-ai-price-factor">
                    <span>
                      ${escapeHTML(
                        factor.name ||
                        "Factor"
                      )}
                    </span>
                    <strong>
                      ${escapeHTML(
                        factor.value ??
                        ""
                      )}
                    </strong>
                  </div>
                `
              )
              .join("")}
          </div>
        `
        : "";

    element.innerHTML = `
      <section
        class="ghar-ai-price-result"
        aria-label="AI property price estimate"
      >

        <div class="ghar-ai-price-main">
          <span class="ghar-ai-price-label">
            Estimated Property Value
          </span>

          <strong class="ghar-ai-price-value">
            ${estimated}
          </strong>
        </div>

        <div class="ghar-ai-price-grid">

          <div class="ghar-ai-price-card">
            <span>Estimated Range</span>
            <strong>
              ${min} – ${max}
            </strong>
          </div>

          <div class="ghar-ai-price-card">
            <span>Price / Sq. Ft.</span>
            <strong>
              ${rate}
            </strong>
          </div>

          <div class="ghar-ai-price-card">
            <span>AI Confidence</span>
            <strong>
              ${confidence}
            </strong>
          </div>

        </div>

        ${
          result.explanation
            ? `
              <div class="ghar-ai-price-explanation">
                <strong>
                  AI Analysis
                </strong>

                <p>
                  ${escapeHTML(
                    result.explanation
                  )}
                </p>
              </div>
            `
            : ""
        }

        ${factors}

      </section>
    `;
  }

  // ----------------------------------------------------------
  // FORM BINDING
  // ----------------------------------------------------------

  function bindForm(
    form,
    options = {}
  ) {
    const element =
      getElement(form);

    if (!element) {
      return null;
    }

    const resultContainer =
      getElement(
        options.result ||
        element.dataset.result
      );

    const submitButton =
      element.querySelector(
        '[type="submit"]'
      );

    element.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        const originalText =
          submitButton?.textContent;

        try {
          if (submitButton) {
            submitButton.disabled =
              true;

            submitButton.setAttribute(
              "aria-busy",
              "true"
            );

            submitButton.textContent =
              options.loadingText ||
              "Estimating...";
          }

          const property =
            collectForm(element);

          const result =
            await estimate(
              property,
              options
            );

          renderResult(
            resultContainer,
            result
          );

          if (
            typeof options.onSuccess ===
            "function"
          ) {
            options.onSuccess(
              result
            );
          }
        } catch (error) {
          const fallback =
            options.useLocalFallback
              ? localEstimate(
                  collectForm(element),
                  options
                )
              : null;

          if (fallback) {
            renderResult(
              resultContainer,
              fallback
            );
          } else {
            renderResult(
              resultContainer,
              {
                ok: false,
                error:
                  error.message
              }
            );
          }

          if (
            typeof options.onError ===
            "function"
          ) {
            options.onError(
              error
            );
          }
        } finally {
          if (submitButton) {
            submitButton.disabled =
              false;

            submitButton.removeAttribute(
              "aria-busy"
            );

            submitButton.textContent =
              originalText ||
              "Estimate Price";
          }
        }
      }
    );

    return element;
  }

  // ----------------------------------------------------------
  // HTML ESCAPING
  // ----------------------------------------------------------

  function escapeHTML(value) {
    return String(
      value ?? ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  const PriceEstimator = {

    config:
      CONFIG,

    estimate,

    localEstimate,

    normalizeProperty,

    collectForm,

    renderResult,

    bindForm,

    formatCurrency,

    formatNumber

  };

  AI.PriceEstimator =
    PriceEstimator;

  // Backward-compatible global
  window.GHARPriceEstimator =
    PriceEstimator;

  // ----------------------------------------------------------
  // AUTO INITIALIZATION
  // ----------------------------------------------------------

  function init() {
    document
      .querySelectorAll(
        "[data-ghar-price-estimator]"
      )
      .forEach(form => {
        bindForm(
          form,
          {
            result:
              form.dataset.result,

            useLocalFallback:
              form.dataset.localFallback ===
              "true"
          }
        );
      });
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );
  } else {
    init();
  }

})(window, document);