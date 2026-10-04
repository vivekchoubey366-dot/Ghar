// ============================================================
// GHAR - PROPERTY SEARCH
// assets/js/property-search.js
// ============================================================

"use strict";

const GharPropertySearch = (() => {
  // ==========================================================
  // STATE
  // ==========================================================

  const state = {
    query: "",
    filters: {
      city: "",
      locality: "",
      propertyType: "",
      listingType: "",
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      bathrooms: "",
      minArea: "",
      maxArea: "",
      furnishing: "",
      possession: "",
      verified: false
    },

    properties: [],
    total: 0,
    page: 1,
    limit: 20,
    loading: false,
    error: null,
    sort: "newest"
  };

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const API_BASE =
    window.GHAR_CONFIG?.API_BASE_URL ||
    window.GHAR_CONFIG?.API_BASE ||
    "/api";

  const SEARCH_ENDPOINT =
    `${API_BASE}/search`;

  const PROPERTY_ENDPOINT =
    `${API_BASE}/properties`;

  // ==========================================================
  // DOM HELPERS
  // ==========================================================

  function $(selector, parent = document) {
    return parent.querySelector(selector);
  }

  function $$(selector, parent = document) {
    return Array.from(
      parent.querySelectorAll(selector)
    );
  }

  // ==========================================================
  // HTML SAFETY
  // ==========================================================

  function escapeHTML(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ==========================================================
  // FORMATTING
  // ==========================================================

  function formatCurrency(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return "Price on request";
    }

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      }
    ).format(amount);
  }

  function formatNumber(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "--";
    }

    return new Intl.NumberFormat(
      "en-IN"
    ).format(number);
  }

  // ==========================================================
  // REQUEST
  // ==========================================================

  async function request(
    url,
    options = {}
  ) {
    const response = await fetch(
      url,
      {
        credentials: "include",

        ...options,

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          ...(options.headers || {})
        }
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
      throw new Error(
        data?.error ||
        data?.message ||
        `Request failed: ${response.status}`
      );
    }

    return data;
  }

  // ==========================================================
  // READ FORM
  // ==========================================================

  function readForm() {
    const form =
      $(
        "[data-property-search-form]"
      ) ||
      $("form#propertySearchForm") ||
      $("form");

    if (!form) {
      return;
    }

    const getValue = (
      ...selectors
    ) => {
      for (const selector of selectors) {
        const element =
          $(selector, form);

        if (element) {
          return element.value?.trim() || "";
        }
      }

      return "";
    };

    state.query =
      getValue(
        "[name='q']",
        "[name='query']",
        "[name='search']",
        "[data-search-query]"
      );

    state.filters.city =
      getValue(
        "[name='city']",
        "[data-filter='city']"
      );

    state.filters.locality =
      getValue(
        "[name='locality']",
        "[name='location']",
        "[data-filter='locality']"
      );

    state.filters.propertyType =
      getValue(
        "[name='propertyType']",
        "[name='property_type']",
        "[data-filter='property-type']"
      );

    state.filters.listingType =
      getValue(
        "[name='listingType']",
        "[name='listing_type']",
        "[data-filter='listing-type']"
      );

    state.filters.minPrice =
      getValue(
        "[name='minPrice']",
        "[name='min_price']"
      );

    state.filters.maxPrice =
      getValue(
        "[name='maxPrice']",
        "[name='max_price']"
      );

    state.filters.bedrooms =
      getValue(
        "[name='bedrooms']",
        "[name='bhk']"
      );

    state.filters.bathrooms =
      getValue(
        "[name='bathrooms']"
      );

    state.filters.minArea =
      getValue(
        "[name='minArea']",
        "[name='min_area']"
      );

    state.filters.maxArea =
      getValue(
        "[name='maxArea']",
        "[name='max_area']"
      );

    state.filters.furnishing =
      getValue(
        "[name='furnishing']"
      );

    state.filters.possession =
      getValue(
        "[name='possession']"
      );

    const verified =
      $(
        "[name='verified']",
        form
      );

    state.filters.verified =
      Boolean(
        verified?.checked
      );
  }

  // ==========================================================
  // BUILD QUERY
  // ==========================================================

  function buildQuery() {
    const params =
      new URLSearchParams();

    if (state.query) {
      params.set(
        "q",
        state.query
      );
    }

    Object.entries(
      state.filters
    ).forEach(
      ([key, value]) => {

        if (
          value === "" ||
          value === null ||
          value === undefined
        ) {
          return;
        }

        if (
          key === "verified" &&
          !value
        ) {
          return;
        }

        params.set(
          key,
          String(value)
        );
      }
    );

    params.set(
      "page",
      String(state.page)
    );

    params.set(
      "limit",
      String(state.limit)
    );

    params.set(
      "sort",
      state.sort
    );

    return params;
  }

  // ==========================================================
  // SEARCH API
  // ==========================================================

  async function search(
    options = {}
  ) {
    if (
      options.resetPage !== false
    ) {
      state.page = 1;
    }

    if (
      options.readForm !== false
    ) {
      readForm();
    }

    state.loading = true;
    state.error = null;

    renderLoading();

    try {
      const params =
        buildQuery();

      let data;

      try {
        data =
          await request(
            `${SEARCH_ENDPOINT}?${params.toString()}`
          );
      } catch (searchError) {

        // Fallback to the property
        // endpoint if a dedicated
        // search endpoint is not
        // available yet.

        data =
          await request(
            `${PROPERTY_ENDPOINT}?${params.toString()}`
          );
      }

      const properties =
        Array.isArray(data)
          ? data
          : (
              data?.properties ||
              data?.results ||
              data?.data ||
              []
            );

      state.properties =
        properties;

      state.total =
        Number(
          data?.total ??
          data?.count ??
          properties.length
        );

      renderResults();
      renderPagination();

      document.dispatchEvent(
        new CustomEvent(
          "ghar:property-search-complete",
          {
            detail: {
              query:
                state.query,

              filters:
                { ...state.filters },

              properties:
                state.properties,

              total:
                state.total
            }
          }
        )
      );

      return data;

    } catch (error) {

      console.error(
        "GHAR property search error:",
        error
      );

      state.error =
        error.message ||
        "Unable to search properties.";

      renderError(
        state.error
      );

      throw error;

    } finally {
      state.loading = false;
      updateSearchButton();
    }
  }

  // ==========================================================
  // RENDER LOADING
  // ==========================================================

  function renderLoading() {
    const container =
      $(
        "[data-property-results]"
      );

    if (!container) {
      return;
    }

    container.innerHTML = `
      <div
        class="ghar-search-loading"
        aria-live="polite"
      >
        <div class="ghar-loading-spinner"></div>
        <p>Searching properties...</p>
      </div>
    `;
  }

  // ==========================================================
  // RENDER ERROR
  // ==========================================================

  function renderError(
    message
  ) {
    const container =
      $(
        "[data-property-results]"
      );

    if (!container) {
      return;
    }

    container.innerHTML = `
      <div
        class="ghar-search-error"
        role="alert"
      >
        <h3>Search unavailable</h3>
        <p>${escapeHTML(message)}</p>

        <button
          type="button"
          data-property-search-retry
        >
          Try Again
        </button>
      </div>
    `;
  }

  // ==========================================================
  // PROPERTY IMAGE
  // ==========================================================

  function getPropertyImage(
    property
  ) {
    if (
      Array.isArray(property.images) &&
      property.images.length
    ) {
      const image =
        property.images[0];

      return typeof image === "string"
        ? image
        : image?.url ||
          image?.src ||
          "";
    }

    if (
      Array.isArray(property.photos) &&
      property.photos.length
    ) {
      const image =
        property.photos[0];

      return typeof image === "string"
        ? image
        : image?.url ||
          image?.src ||
          "";
    }

    return (
      property.image ||
      property.thumbnail ||
      ""
    );
  }

  // ==========================================================
  // PROPERTY LOCATION
  // ==========================================================

  function getLocation(
    property
  ) {
    return [
      property.locality,
      property.city,
      property.state
    ]
      .filter(Boolean)
      .join(", ");
  }

  // ==========================================================
  // PROPERTY CARD
  // ==========================================================

  function createPropertyCard(
    property
  ) {
    const id =
      property.id ||
      property.propertyId;

    const image =
      getPropertyImage(
        property
      );

    const title =
      property.title ||
      property.name ||
      "Property";

    const location =
      getLocation(
        property
      ) ||
      property.location ||
      "Location unavailable";

    const price =
      formatCurrency(
        property.price
      );

    const bedrooms =
      property.bedrooms ??
      property.bhk ??
      "--";

    const bathrooms =
      property.bathrooms ??
      "--";

    const area =
      property.area ||
      property.size ||
      property.superBuiltUpArea;

    const propertyType =
      property.propertyType ||
      property.type ||
      "Property";

    const listingType =
      property.listingType ||
      property.transactionType ||
      "";

    const verified =
      property.verified ||
      property.verificationStatus ===
        "PROPERTY_VERIFIED";

    const safeId =
      encodeURIComponent(
        id || ""
      );

    return `
      <article
        class="ghar-property-card"
        data-property-id="${escapeHTML(id || "")}"
      >

        <a
          class="ghar-property-card-image"
          href="/property-details.html?id=${safeId}"
          aria-label="${escapeHTML(title)}"
        >

          ${
            image
              ? `
                <img
                  src="${escapeHTML(image)}"
                  alt="${escapeHTML(title)}"
                  loading="lazy"
                >
              `
              : `
                <div
                  class="ghar-property-card-placeholder"
                >
                  Property Image
                </div>
              `
          }

          ${
            verified
              ? `
                <span
                  class="ghar-property-verified"
                >
                  Verified
                </span>
              `
              : ""
          }

          <button
            type="button"
            class="ghar-property-favourite"
            data-property-favourite
            data-property-id="${escapeHTML(id || "")}"
            aria-label="Add to favourites"
            aria-pressed="false"
          >
            ♡
          </button>

        </a>

        <div
          class="ghar-property-card-content"
        >

          <div
            class="ghar-property-card-type"
          >
            ${escapeHTML(propertyType)}

            ${
              listingType
                ? `
                  <span>
                    ${escapeHTML(listingType)}
                  </span>
                `
                : ""
            }
          </div>

          <h3>
            <a
              href="/property-details.html?id=${safeId}"
            >
              ${escapeHTML(title)}
            </a>
          </h3>

          <p
            class="ghar-property-location"
          >
            ${escapeHTML(location)}
          </p>

          <div
            class="ghar-property-price"
          >
            ${escapeHTML(price)}
          </div>

          <div
            class="ghar-property-specs"
          >
            <span>
              ${escapeHTML(String(bedrooms))}
              ${
                property.bhk
                  ? " BHK"
                  : " Beds"
              }
            </span>

            <span>
              ${escapeHTML(String(bathrooms))}
              Baths
            </span>

            ${
              area
                ? `
                  <span>
                    ${escapeHTML(
                      formatNumber(area)
                    )}
                    sq ft
                  </span>
                `
                : ""
            }
          </div>

          <div
            class="ghar-property-card-actions"
          >

            <a
              href="/property-details.html?id=${safeId}"
              class="ghar-btn ghar-btn-primary"
            >
              View Property
            </a>

            <button
              type="button"
              data-property-compare
              data-property-id="${escapeHTML(id || "")}"
            >
              Compare
            </button>

          </div>

        </div>

      </article>
    `;
  }

  // ==========================================================
  // RENDER RESULTS
  // ==========================================================

  function renderResults() {
    const container =
      $(
        "[data-property-results]"
      );

    if (!container) {
      return;
    }

    if (
      !state.properties.length
    ) {

      container.innerHTML = `
        <div
          class="ghar-search-empty"
        >
          <h3>No properties found</h3>

          <p>
            Try changing your location,
            price range or property filters.
          </p>

          <button
            type="button"
            data-property-clear-filters
          >
            Clear Filters
          </button>
        </div>
      `;

      updateResultCount();

      return;
    }

    container.innerHTML =
      state.properties
        .map(
          createPropertyCard
        )
        .join("");

    updateResultCount();

    restoreFavouriteState();
  }

  // ==========================================================
  // RESULT COUNT
  // ==========================================================

  function updateResultCount() {
    $$(
      "[data-property-result-count]"
    ).forEach(element => {
      element.textContent =
        formatNumber(
          state.total
        );
    });
  }

  // ==========================================================
  // PAGINATION
  // ==========================================================

  function renderPagination() {
    const container =
      $(
        "[data-property-pagination]"
      );

    if (!container) {
      return;
    }

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          state.total /
          state.limit
        )
      );

    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    let html = "";

    if (state.page > 1) {
      html += `
        <button
          type="button"
          data-search-page="${state.page - 1}"
        >
          Previous
        </button>
      `;
    }

    const start =
      Math.max(
        1,
        state.page - 2
      );

    const end =
      Math.min(
        totalPages,
        state.page + 2
      );

    for (
      let page = start;
      page <= end;
      page++
    ) {
      html += `
        <button
          type="button"
          data-search-page="${page}"
          class="${
            page === state.page
              ? "active"
              : ""
          }"
          ${
            page === state.page
              ? "aria-current=\"page\""
              : ""
          }
        >
          ${page}
        </button>
      `;
    }

    if (
      state.page < totalPages
    ) {
      html += `
        <button
          type="button"
          data-search-page="${state.page + 1}"
        >
          Next
        </button>
      `;
    }

    container.innerHTML =
      html;
  }

  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  function clearFilters() {
    state.query = "";

    Object.keys(
      state.filters
    ).forEach(key => {
      state.filters[key] =
        key === "verified"
          ? false
          : "";
    });

    const form =
      $(
        "[data-property-search-form]"
      );

    if (form) {
      form.reset();
    }

    $(
      "[data-search-query]"
    )?.removeAttribute(
      "value"
    );

    search({
      readForm: false
    });
  }

  // ==========================================================
  // SORT
  // ==========================================================

  function setSort(sort) {
    if (!sort) {
      return;
    }

    state.sort =
      sort;

    search({
      resetPage: true,
      readForm: false
    });
  }

  // ==========================================================
  // FAVOURITES
  // ==========================================================

  async function toggleFavourite(
    propertyId,
    button
  ) {
    if (!propertyId) {
      return;
    }

    try {
      const response =
        await request(
          `${PROPERTY_ENDPOINT}/${encodeURIComponent(
            propertyId
          )}/favourite`,
          {
            method: "POST"
          }
        );

      const active =
        Boolean(
          response?.favourite ??
          response?.isFavourite ??
          true
        );

      if (button) {
        button.classList.toggle(
          "active",
          active
        );

        button.setAttribute(
          "aria-pressed",
          String(active)
        );

        button.textContent =
          active
            ? "♥"
            : "♡";
      }

      document.dispatchEvent(
        new CustomEvent(
          "ghar:favourite-updated",
          {
            detail: {
              propertyId,
              active
            }
          }
        )
      );

    } catch (error) {

      console.error(
        "GHAR favourite error:",
        error
      );
    }
  }

  function restoreFavouriteState() {
    const saved =
      JSON.parse(
        localStorage.getItem(
          "ghar_favourites"
        ) || "[]"
      );

    $$(
      "[data-property-favourite]"
    ).forEach(button => {
      const id =
        button.dataset.propertyId;

      if (
        saved.includes(id)
      ) {
        button.classList.add(
          "active"
        );

        button.setAttribute(
          "aria-pressed",
          "true"
        );

        button.textContent =
          "♥";
      }
    });
  }

  // ==========================================================
  // COMPARE
  // ==========================================================

  function addToCompare(
    propertyId
  ) {
    if (!propertyId) {
      return;
    }

    let compare =
      JSON.parse(
        localStorage.getItem(
          "ghar_compare"
        ) || "[]"
      );

    if (
      compare.includes(
        propertyId
      )
    ) {
      return;
    }

    if (
      compare.length >= 4
    ) {
      showMessage(
        "You can compare up to 4 properties."
      );

      return;
    }

    compare.push(
      propertyId
    );

    localStorage.setItem(
      "ghar_compare",
      JSON.stringify(compare)
    );

    showMessage(
      "Property added to comparison."
    );

    document.dispatchEvent(
      new CustomEvent(
        "ghar:compare-updated",
        {
          detail: {
            propertyId,
            properties:
              compare
          }
        }
      )
    );
  }

  // ==========================================================
  // SEARCH URL
  // ==========================================================

  function updateBrowserURL() {
    const params =
      buildQuery();

    const url =
      `${window.location.pathname}?${params.toString()}`;

    window.history.replaceState(
      {},
      "",
      url
    );
  }

  function loadFromURL() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    state.query =
      params.get("q") ||
      params.get("query") ||
      "";

    const filterKeys =
      Object.keys(
        state.filters
      );

    filterKeys.forEach(key => {
      const value =
        params.get(key);

      if (
        value !== null
      ) {
        state.filters[key] =
          key === "verified"
            ? value === "true"
            : value;
      }
    });

    state.page =
      Number(
        params.get("page")
      ) || 1;

    state.sort =
      params.get("sort") ||
      "newest";

    populateForm();
  }

  function populateForm() {
    const form =
      $(
        "[data-property-search-form]"
      );

    if (!form) {
      return;
    }

    const setValue = (
      selector,
      value
    ) => {
      const element =
        $(selector, form);

      if (!element) {
        return;
      }

      if (
        element.type === "checkbox"
      ) {
        element.checked =
          Boolean(value);
      } else {
        element.value =
          value ?? "";
      }
    };

    setValue(
      "[name='q']",
      state.query
    );

    Object.entries(
      state.filters
    ).forEach(
      ([key, value]) => {
        setValue(
          `[name='${key}']`,
          value
        );

        setValue(
          `[data-filter='${key}']`,
          value
        );
      }
    );
  }

  // ==========================================================
  // BUTTON STATE
  // ==========================================================

  function updateSearchButton() {
    $$(
      "[data-property-search-submit]"
    ).forEach(button => {
      button.disabled =
        state.loading;

      button.setAttribute(
        "aria-busy",
        String(
          state.loading
        )
      );
    });
  }

  // ==========================================================
  // MESSAGE
  // ==========================================================

  function showMessage(
    message
  ) {
    let element =
      $(
        "[data-ghar-search-message]"
      );

    if (!element) {
      element =
        document.createElement(
          "div"
        );

      element.setAttribute(
        "data-ghar-search-message",
        ""
      );

      document.body.appendChild(
        element
      );
    }

    element.textContent =
      message;

    element.classList.add(
      "show"
    );

    setTimeout(() => {
      element.classList.remove(
        "show"
      );
    }, 2500);
  }

  // ==========================================================
  // EVENT HANDLERS
  // ==========================================================

  function bindEvents() {
    document.addEventListener(
      "submit",
      event => {

        const form =
          event.target.closest(
            "[data-property-search-form]"
          );

        if (!form) {
          return;
        }

        event.preventDefault();

        updateBrowserURL();

        search();
      }
    );

    document.addEventListener(
      "click",
      event => {

        const retry =
          event.target.closest(
            "[data-property-search-retry]"
          );

        if (retry) {
          event.preventDefault();

          search();

          return;
        }

        const clear =
          event.target.closest(
            "[data-property-clear-filters]"
          );

        if (clear) {
          event.preventDefault();

          clearFilters();

          return;
        }

        const pageButton =
          event.target.closest(
            "[data-search-page]"
          );

        if (pageButton) {
          event.preventDefault();

          const page =
            Number(
              pageButton.dataset.searchPage
            );

          if (
            Number.isInteger(page) &&
            page > 0
          ) {
            state.page =
              page;

            updateBrowserURL();

            search({
              resetPage: false
            });
          }

          return;
        }

        const favourite =
          event.target.closest(
            "[data-property-favourite]"
          );

        if (favourite) {
          event.preventDefault();

          toggleFavourite(
            favourite.dataset.propertyId,
            favourite
          );

          return;
        }

        const compare =
          event.target.closest(
            "[data-property-compare]"
          );

        if (compare) {
          event.preventDefault();

          addToCompare(
            compare.dataset.propertyId
          );

          return;
        }

        const sort =
          event.target.closest(
            "[data-property-sort]"
          );

        if (sort) {
          event.preventDefault();

          setSort(
            sort.dataset.propertySort
          );
        }
      }
    );
  }

  // ==========================================================
  // INITIALIZATION
  // ==========================================================

  async function init() {
    bindEvents();

    loadFromURL();

    updateSearchButton();

    const hasSearch =
      Boolean(
        state.query ||
        Object.values(
          state.filters
        ).some(value =>
          Boolean(value)
        )
      );

    if (
      hasSearch ||
      $("[data-property-results]")
    ) {
      try {
        await search({
          resetPage: false,
          readForm: false
        });
      } catch {
        // Error already rendered.
      }
    }
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  return {
    init,
    search,
    clearFilters,
    setSort,
    getState: () => ({
      ...state,
      filters: {
        ...state.filters
      },
      properties: [
        ...state.properties
      ]
    }),
    getPropertyImage,
    createPropertyCard
  };
})();

window.GharPropertySearch =
  GharPropertySearch;

// ============================================================
// START
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {
    GharPropertySearch.init();
  }
);