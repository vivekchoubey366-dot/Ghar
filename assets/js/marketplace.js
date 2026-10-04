// ============================================================
// GHAR - REAL ESTATE PLATFORM
// marketplace.js
// Marketplace listings, filters, sorting, favourites,
// property comparison, pagination and API integration
// ============================================================

"use strict";

(function (window, document) {

  const GHAR = window.GHAR || {};

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const CONFIG = {
    API_BASE:
      GHAR.API_BASE ||
      window.GHAR_API_BASE ||
      "/api",

    ENDPOINTS: {
      marketplace: "/properties/marketplace",
      properties: "/properties",
      favourites: "/favourites",
      compare: "/compare"
    },

    SELECTORS: {
      container:
        "#marketplaceGrid, #propertyGrid, [data-marketplace-grid]",

      form:
        "#marketplaceSearchForm, [data-marketplace-form]",

      search:
        "#marketplaceSearch, [data-marketplace-search]",

      type:
        "#propertyType, [name='propertyType'], [data-property-type]",

      listingType:
        "#listingType, [name='listingType'], [data-listing-type]",

      location:
        "#location, [name='location'], [data-location]",

      minPrice:
        "#minPrice, [name='minPrice'], [data-min-price]",

      maxPrice:
        "#maxPrice, [name='maxPrice'], [data-max-price]",

      bedrooms:
        "#bedrooms, [name='bedrooms'], [data-bedrooms]",

      sort:
        "#sort, [name='sort'], [data-marketplace-sort]",

      loading:
        "[data-marketplace-loading]",

      empty:
        "[data-marketplace-empty]",

      count:
        "[data-marketplace-count]",

      pagination:
        "[data-marketplace-pagination], #marketplacePagination",

      results:
        "[data-marketplace-results]",

      compareCount:
        "[data-compare-count]",

      favouriteCount:
        "[data-favourite-count]"
    },

    DEFAULTS: {
      page: 1,
      limit: 12,
      sort: "newest"
    }
  };

  // ==========================================================
  // STATE
  // ==========================================================

  const state = {
    properties: [],
    filteredProperties: [],

    page:
      CONFIG.DEFAULTS.page,

    limit:
      CONFIG.DEFAULTS.limit,

    total: 0,

    totalPages: 0,

    loading: false,

    filters: {
      search: "",
      propertyType: "",
      listingType: "",
      location: "",
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      sort:
        CONFIG.DEFAULTS.sort
    },

    favourites: new Set(),

    compare: new Set()
  };

  // ==========================================================
  // HELPERS
  // ==========================================================

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(
      root.querySelectorAll(selector)
    );
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getPropertyId(property) {
    return String(
      property?.id ||
      property?._id ||
      property?.propertyId ||
      ""
    );
  }

  function formatPrice(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "Price on request";
    }

    try {
      return new Intl.NumberFormat(
        "en-IN",
        {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0
        }
      ).format(number);
    } catch {
      return `₹${number.toLocaleString("en-IN")}`;
    }
  }

  function formatNumber(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "0";
    }

    return number.toLocaleString("en-IN");
  }

  function getAuthToken() {
    try {
      return (
        localStorage.getItem(
          "ghar_access_token"
        ) ||
        localStorage.getItem(
          "accessToken"
        ) ||
        sessionStorage.getItem(
          "ghar_access_token"
        ) ||
        ""
      );
    } catch {
      return "";
    }
  }

  function buildHeaders() {
    const headers = {
      Accept:
        "application/json",
      "Content-Type":
        "application/json"
    };

    const token =
      getAuthToken();

    if (token) {
      headers.Authorization =
        `Bearer ${token}`;
    }

    return headers;
  }

  // ==========================================================
  // API REQUEST
  // ==========================================================

  async function apiRequest(
    endpoint,
    options = {}
  ) {
    const response =
      await fetch(
        `${CONFIG.API_BASE}${endpoint}`,
        {
          credentials:
            "include",

          ...options,

          headers: {
            ...buildHeaders(),
            ...(options.headers || {})
          }
        }
      );

    let data = {};

    try {
      data =
        await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const error =
        new Error(
          data?.error ||
          data?.message ||
          `Request failed (${response.status})`
        );

      error.status =
        response.status;

      error.data =
        data;

      throw error;
    }

    return data;
  }

  // ==========================================================
  // FILTER MANAGEMENT
  // ==========================================================

  function readFilters() {
    const getValue =
      selector =>
        qs(selector)?.value?.trim() || "";

    state.filters = {
      search:
        getValue(
          CONFIG.SELECTORS.search
        ),

      propertyType:
        getValue(
          CONFIG.SELECTORS.type
        ),

      listingType:
        getValue(
          CONFIG.SELECTORS.listingType
        ),

      location:
        getValue(
          CONFIG.SELECTORS.location
        ),

      minPrice:
        getValue(
          CONFIG.SELECTORS.minPrice
        ),

      maxPrice:
        getValue(
          CONFIG.SELECTORS.maxPrice
        ),

      bedrooms:
        getValue(
          CONFIG.SELECTORS.bedrooms
        ),

      sort:
        getValue(
          CONFIG.SELECTORS.sort
        ) ||
        CONFIG.DEFAULTS.sort
    };
  }

  function buildQuery() {
    const params =
      new URLSearchParams();

    const filters =
      state.filters;

    if (filters.search) {
      params.set(
        "search",
        filters.search
      );
    }

    if (filters.propertyType) {
      params.set(
        "propertyType",
        filters.propertyType
      );
    }

    if (filters.listingType) {
      params.set(
        "listingType",
        filters.listingType
      );
    }

    if (filters.location) {
      params.set(
        "location",
        filters.location
      );
    }

    if (filters.minPrice) {
      params.set(
        "minPrice",
        filters.minPrice
      );
    }

    if (filters.maxPrice) {
      params.set(
        "maxPrice",
        filters.maxPrice
      );
    }

    if (filters.bedrooms) {
      params.set(
        "bedrooms",
        filters.bedrooms
      );
    }

    if (filters.sort) {
      params.set(
        "sort",
        filters.sort
      );
    }

    params.set(
      "page",
      String(state.page)
    );

    params.set(
      "limit",
      String(state.limit)
    );

    return params.toString();
  }

  // ==========================================================
  // LOAD MARKETPLACE
  // ==========================================================

  async function loadMarketplace(
    options = {}
  ) {

    if (options.resetPage !== false) {
      state.page = 1;
    }

    if (options.filters) {
      state.filters = {
        ...state.filters,
        ...options.filters
      };
    } else {
      readFilters();
    }

    setLoading(true);

    try {

      const query =
        buildQuery();

      const result =
        await apiRequest(
          `${CONFIG.ENDPOINTS.marketplace}?${query}`
        );

      state.properties =
        result.properties ||
        result.listings ||
        result.data ||
        [];

      state.total =
        Number(
          result.total ??
          result.count ??
          state.properties.length
        );

      state.totalPages =
        Number(
          result.totalPages ??
          Math.ceil(
            state.total /
            state.limit
          )
        );

      state.filteredProperties =
        state.properties;

      render();

      return state.properties;

    } catch (error) {

      console.error(
        "GHAR Marketplace:",
        error
      );

      renderError(
        error.message ||
        "Unable to load marketplace."
      );

      return [];

    } finally {

      setLoading(false);

    }
  }

  // ==========================================================
  // LOCAL FILTERING
  // ==========================================================

  function filterLocalProperties() {

    let properties =
      [...state.properties];

    const filters =
      state.filters;

    const search =
      filters.search.toLowerCase();

    if (search) {

      properties =
        properties.filter(
          property => {

            const text =
              [
                property.title,
                property.name,
                property.city,
                property.location,
                property.locality,
                property.description,
                property.propertyType
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return text.includes(
              search
            );
          }
        );
    }

    if (filters.propertyType) {

      properties =
        properties.filter(
          property =>
            String(
              property.propertyType ||
              property.type ||
              ""
            ).toLowerCase() ===
            filters.propertyType.toLowerCase()
        );
    }

    if (filters.listingType) {

      properties =
        properties.filter(
          property =>
            String(
              property.listingType ||
              property.transactionType ||
              ""
            ).toLowerCase() ===
            filters.listingType.toLowerCase()
        );
    }

    if (filters.location) {

      const location =
        filters.location.toLowerCase();

      properties =
        properties.filter(
          property =>
            [
              property.location,
              property.city,
              property.state,
              property.locality
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(location)
        );
    }

    if (filters.minPrice) {

      const minimum =
        Number(
          filters.minPrice
        );

      properties =
        properties.filter(
          property =>
            Number(
              property.price || 0
            ) >= minimum
        );
    }

    if (filters.maxPrice) {

      const maximum =
        Number(
          filters.maxPrice
        );

      properties =
        properties.filter(
          property =>
            Number(
              property.price || 0
            ) <= maximum
        );
    }

    if (filters.bedrooms) {

      const bedrooms =
        Number(
          filters.bedrooms
        );

      properties =
        properties.filter(
          property =>
            Number(
              property.bedrooms ||
              property.bhk ||
              0
            ) >= bedrooms
        );
    }

    state.filteredProperties =
      properties;

    return properties;
  }

  // ==========================================================
  // SORT
  // ==========================================================

  function sortProperties(
    properties
  ) {

    const sorted =
      [...properties];

    switch (
      state.filters.sort
    ) {

      case "price-low":
      case "price_asc":

        return sorted.sort(
          (a, b) =>
            Number(a.price || 0) -
            Number(b.price || 0)
        );

      case "price-high":
      case "price_desc":

        return sorted.sort(
          (a, b) =>
            Number(b.price || 0) -
            Number(a.price || 0)
        );

      case "area-low":

        return sorted.sort(
          (a, b) =>
            Number(
              a.area ||
              a.size ||
              0
            ) -
            Number(
              b.area ||
              b.size ||
              0
            )
        );

      case "area-high":

        return sorted.sort(
          (a, b) =>
            Number(
              b.area ||
              b.size ||
              0
            ) -
            Number(
              a.area ||
              a.size ||
              0
            )
        );

      case "oldest":

        return sorted.sort(
          (a, b) =>
            new Date(
              a.createdAt || 0
            ) -
            new Date(
              b.createdAt || 0
            )
        );

      case "newest":
      default:

        return sorted.sort(
          (a, b) =>
            new Date(
              b.createdAt || 0
            ) -
            new Date(
              a.createdAt || 0
            )
        );
    }
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  function render() {

    let properties =
      filterLocalProperties();

    properties =
      sortProperties(
        properties
      );

    renderProperties(
      properties
    );

    renderCount(
      properties.length
    );

    renderPagination();

    updateCounters();
  }

  function renderProperties(
    properties
  ) {

    const container =
      qs(
        CONFIG.SELECTORS.container
      );

    if (!container) {
      return;
    }

    if (!properties.length) {

      container.innerHTML = `
        <div
          class="ghar-empty-state"
          data-marketplace-empty
        >
          <h3>No properties found</h3>
          <p>
            Try changing your search
            filters or location.
          </p>

          <button
            type="button"
            class="ghar-button"
            data-action="clear-filters"
          >
            Clear Filters
          </button>
        </div>
      `;

      return;
    }

    container.innerHTML =
      properties
        .map(
          property =>
            createPropertyCard(
              property
            )
        )
        .join("");
  }

  // ==========================================================
  // PROPERTY CARD
  // ==========================================================

  function createPropertyCard(
    property
  ) {

    const id =
      getPropertyId(
        property
      );

    const title =
      property.title ||
      property.name ||
      "Property";

    const image =
      property.image ||
      property.coverImage ||
      property.thumbnail ||
      "/assets/images/properties/default-property.jpg";

    const location =
      [
        property.locality,
        property.city,
        property.state
      ]
        .filter(Boolean)
        .join(", ") ||
      property.location ||
      "Location unavailable";

    const propertyType =
      property.propertyType ||
      property.type ||
      "Property";

    const listingType =
      property.listingType ||
      property.transactionType ||
      "SALE";

    const bedrooms =
      property.bedrooms ||
      property.bhk;

    const bathrooms =
      property.bathrooms ||
      property.baths;

    const area =
      property.area ||
      property.size;

    const isFavourite =
      state.favourites.has(id);

    const isCompared =
      state.compare.has(id);

    const verified =
      property.verified === true ||
      property.verificationStatus ===
        "PROPERTY_VERIFIED";

    return `
      <article
        class="property-card marketplace-property-card"
        data-property-id="${escapeHTML(id)}"
      >

        <div
          class="property-card__image"
        >

          <img
            src="${escapeHTML(image)}"
            alt="${escapeHTML(title)}"
            loading="lazy"
            onerror="
              this.onerror=null;
              this.src='/assets/images/properties/default-property.jpg';
            "
          />

          <div
            class="property-card__badges"
          >

            <span
              class="property-badge property-badge--listing"
            >
              ${escapeHTML(
                listingType
              )}
            </span>

            ${
              verified
                ? `
                  <span
                    class="property-badge property-badge--verified"
                  >
                    Verified
                  </span>
                `
                : ""
            }

          </div>

          <div
            class="property-card__actions"
          >

            <button
              type="button"
              class="property-action ${
                isFavourite
                  ? "is-active"
                  : ""
              }"
              data-action="toggle-favourite"
              data-property-id="${escapeHTML(id)}"
              aria-label="${
                isFavourite
                  ? "Remove from favourites"
                  : "Add to favourites"
              }"
              aria-pressed="${isFavourite}"
            >
              ♡
            </button>

            <button
              type="button"
              class="property-action ${
                isCompared
                  ? "is-active"
                  : ""
              }"
              data-action="toggle-compare"
              data-property-id="${escapeHTML(id)}"
              aria-label="${
                isCompared
                  ? "Remove from comparison"
                  : "Add to comparison"
              }"
              aria-pressed="${isCompared}"
            >
              ⇄
            </button>

          </div>

        </div>

        <div
          class="property-card__content"
        >

          <div
            class="property-card__type"
          >
            ${escapeHTML(
              propertyType
            )}
          </div>

          <h3
            class="property-card__title"
          >
            ${escapeHTML(title)}
          </h3>

          <div
            class="property-card__location"
          >
            ${escapeHTML(location)}
          </div>

          <div
            class="property-card__details"
          >

            ${
              bedrooms
                ? `
                  <span>
                    ${escapeHTML(
                      bedrooms
                    )} BHK
                  </span>
                `
                : ""
            }

            ${
              bathrooms
                ? `
                  <span>
                    ${escapeHTML(
                      bathrooms
                    )} Bath
                  </span>
                `
                : ""
            }

            ${
              area
                ? `
                  <span>
                    ${escapeHTML(
                      formatNumber(area)
                    )} sq.ft
                  </span>
                `
                : ""
            }

          </div>

          <div
            class="property-card__footer"
          >

            <strong
              class="property-card__price"
            >
              ${formatPrice(
                property.price
              )}
            </strong>

            <a
              class="property-card__link"
              href="/property-details.html?id=${encodeURIComponent(id)}"
              data-property-link
            >
              View Details
            </a>

          </div>

        </div>

      </article>
    `;
  }

  // ==========================================================
  // FAVOURITES
  // ==========================================================

  async function toggleFavourite(
    propertyId
  ) {

    if (!propertyId) {
      return;
    }

    const id =
      String(propertyId);

    const currentlyFavourite =
      state.favourites.has(id);

    try {

      if (currentlyFavourite) {

        await apiRequest(
          `${CONFIG.ENDPOINTS.favourites}/${encodeURIComponent(id)}`,
          {
            method: "DELETE"
          }
        );

        state.favourites.delete(
          id
        );

      } else {

        await apiRequest(
          CONFIG.ENDPOINTS.favourites,
          {
            method: "POST",
            body: JSON.stringify({
              propertyId: id
            })
          }
        );

        state.favourites.add(
          id
        );
      }

      render();

      return !currentlyFavourite;

    } catch (error) {

      console.error(
        "GHAR Favourite:",
        error
      );

      return currentlyFavourite;
    }
  }

  // ==========================================================
  // LOAD FAVOURITES
  // ==========================================================

  async function loadFavourites() {

    try {

      const result =
        await apiRequest(
          CONFIG.ENDPOINTS.favourites
        );

      const favourites =
        result.favourites ||
        result.data ||
        [];

      state.favourites =
        new Set(
          favourites.map(
            item =>
              String(
                item.propertyId ||
                item.id ||
                item._id
              )
          )
        );

      updateCounters();

      render();

      return favourites;

    } catch (error) {

      console.warn(
        "Unable to load favourites:",
        error.message
      );

      return [];
    }
  }

  // ==========================================================
  // COMPARE
  // ==========================================================

  function toggleCompare(
    propertyId
  ) {

    const id =
      String(propertyId || "");

    if (!id) return;

    if (
      state.compare.has(id)
    ) {

      state.compare.delete(
        id
      );

    } else {

      if (
        state.compare.size >= 4
      ) {

        showMessage(
          "You can compare up to 4 properties.",
          "warning"
        );

        return;
      }

      state.compare.add(id);
    }

    updateCounters();
    render();

    saveCompareState();
  }

  function saveCompareState() {

    try {

      localStorage.setItem(
        "ghar_compare_properties",
        JSON.stringify(
          [...state.compare]
        )
      );

    } catch {
      // Ignore storage failures.
    }
  }

  function loadCompareState() {

    try {

      const stored =
        localStorage.getItem(
          "ghar_compare_properties"
        );

      if (!stored) {
        return;
      }

      const ids =
        JSON.parse(stored);

      if (
        Array.isArray(ids)
      ) {

        state.compare =
          new Set(
            ids
              .slice(0, 4)
              .map(String)
          );
      }

    } catch {
      state.compare =
        new Set();
    }
  }

  function openCompare() {

    if (!state.compare.size) {

      showMessage(
        "Select at least one property to compare.",
        "warning"
      );

      return;
    }

    const ids =
      [...state.compare];

    window.location.href =
      `/compare.html?ids=${encodeURIComponent(
        ids.join(",")
      )}`;
  }

  // ==========================================================
  // COUNTERS
  // ==========================================================

  function updateCounters() {

    qsa(
      CONFIG.SELECTORS.compareCount
    ).forEach(element => {
      element.textContent =
        String(
          state.compare.size
        );
    });

    qsa(
      CONFIG.SELECTORS.favouriteCount
    ).forEach(element => {
      element.textContent =
        String(
          state.favourites.size
        );
    });
  }

  function renderCount(
    count
  ) {

    qsa(
      CONFIG.SELECTORS.count
    ).forEach(element => {
      element.textContent =
        `${formatNumber(count)} properties`;
    });
  }

  // ==========================================================
  // PAGINATION
  // ==========================================================

  function renderPagination() {

    const container =
      qs(
        CONFIG.SELECTORS.pagination
      );

    if (!container) {
      return;
    }

    if (
      state.totalPages <= 1
    ) {

      container.innerHTML =
        "";

      return;
    }

    let html = "";

    html += `
      <button
        type="button"
        data-page="${state.page - 1}"
        ${state.page <= 1 ? "disabled" : ""}
      >
        Previous
      </button>
    `;

    const start =
      Math.max(
        1,
        state.page - 2
      );

    const end =
      Math.min(
        state.totalPages,
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
          class="${
            page === state.page
              ? "is-active"
              : ""
          }"
          data-page="${page}"
        >
          ${page}
        </button>
      `;
    }

    html += `
      <button
        type="button"
        data-page="${state.page + 1}"
        ${
          state.page >=
          state.totalPages
            ? "disabled"
            : ""
        }
      >
        Next
      </button>
    `;

    container.innerHTML =
      html;
  }

  function goToPage(
    page
  ) {

    const target =
      Number(page);

    if (
      !Number.isFinite(target) ||
      target < 1 ||
      target > state.totalPages
    ) {
      return;
    }

    state.page =
      target;

    loadMarketplace({
      resetPage: false
    });
  }

  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  function clearFilters() {

    state.filters = {
      search: "",
      propertyType: "",
      listingType: "",
      location: "",
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      sort:
        CONFIG.DEFAULTS.sort
    };

    qsa(
      `${CONFIG.SELECTORS.form} input, ${CONFIG.SELECTORS.form} select`
    ).forEach(input => {

      if (
        input.type === "checkbox" ||
        input.type === "radio"
      ) {
        input.checked = false;
      } else {
        input.value = "";
      }
    });

    const sort =
      qs(
        CONFIG.SELECTORS.sort
      );

    if (sort) {
      sort.value =
        CONFIG.DEFAULTS.sort;
    }

    loadMarketplace();
  }

  // ==========================================================
  // FORM SUBMIT
  // ==========================================================

  function handleSearchSubmit(
    event
  ) {

    event.preventDefault();

    readFilters();

    state.page = 1;

    loadMarketplace({
      resetPage: false
    });
  }

  // ==========================================================
  // SORT CHANGE
  // ==========================================================

  function handleSortChange() {

    readFilters();

    state.page = 1;

    loadMarketplace({
      resetPage: false
    });
  }

  // ==========================================================
  // CLICK ACTIONS
  // ==========================================================

  function handleClick(
    event
  ) {

    const action =
      event.target.closest(
        "[data-action]"
      );

    if (!action) {
      return;
    }

    const type =
      action.dataset.action;

    switch (type) {

      case "toggle-favourite":

        event.preventDefault();

        toggleFavourite(
          action.dataset.propertyId
        );

        break;

      case "toggle-compare":

        event.preventDefault();

        toggleCompare(
          action.dataset.propertyId
        );

        break;

      case "open-compare":

        event.preventDefault();

        openCompare();

        break;

      case "clear-filters":

        event.preventDefault();

        clearFilters();

        break;

      default:
        break;
    }

    if (
      action.dataset.page
    ) {

      event.preventDefault();

      goToPage(
        action.dataset.page
      );
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  function setLoading(
    loading
  ) {

    state.loading =
      Boolean(loading);

    qsa(
      CONFIG.SELECTORS.loading
    ).forEach(element => {

      element.hidden =
        !state.loading;
    });

    const container =
      qs(
        CONFIG.SELECTORS.container
      );

    if (
      container &&
      state.loading
    ) {

      container.setAttribute(
        "aria-busy",
        "true"
      );

    } else if (container) {

      container.removeAttribute(
        "aria-busy"
      );
    }
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  function renderError(
    message
  ) {

    const container =
      qs(
        CONFIG.SELECTORS.container
      );

    if (!container) {
      return;
    }

    container.innerHTML = `
      <div class="ghar-error-state">
        <h3>
          Unable to load properties
        </h3>

        <p>
          ${escapeHTML(
            message
          )}
        </p>

        <button
          type="button"
          class="ghar-button"
          data-action="retry-marketplace"
        >
          Try Again
        </button>
      </div>
    `;
  }

  function showMessage(
    message,
    type = "info"
  ) {

    let element =
      qs(
        "[data-marketplace-message]"
      );

    if (!element) {

      element =
        document.createElement(
          "div"
        );

      element.dataset
        .marketplaceMessage =
        "true";

      document.body.appendChild(
        element
      );
    }

    element.className =
      `ghar-marketplace-message is-${type}`;

    element.textContent =
      message;

    window.setTimeout(
      () => {
        element.remove();
      },
      3000
    );
  }

  // ==========================================================
  // RETRY
  // ==========================================================

  function retry() {
    loadMarketplace({
      resetPage: false
    });
  }

  // ==========================================================
  // EVENT INITIALIZATION
  // ==========================================================

  function initEvents() {

    const form =
      qs(
        CONFIG.SELECTORS.form
      );

    if (form) {

      form.addEventListener(
        "submit",
        handleSearchSubmit
      );
    }

    qsa(
      CONFIG.SELECTORS.sort
    ).forEach(element => {

      element.addEventListener(
        "change",
        handleSortChange
      );
    });

    document.addEventListener(
      "click",
      event => {

        const retryButton =
          event.target.closest(
            "[data-action='retry-marketplace']"
          );

        if (retryButton) {

          event.preventDefault();

          retry();

          return;
        }

        handleClick(event);
      }
    );
  }

  // ==========================================================
  // INITIALIZATION
  // ==========================================================

  async function init() {

    loadCompareState();

    initEvents();

    await loadMarketplace();

    // Favourites are optional.
    // If authentication exists, load them.
    if (getAuthToken()) {
      await loadFavourites();
    }

    updateCounters();
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  GHAR.Marketplace = {

    state,

    config: CONFIG,

    init,

    loadMarketplace,

    loadFavourites,

    filterLocalProperties,

    sortProperties,

    render,

    renderProperties,

    createPropertyCard,

    toggleFavourite,

    toggleCompare,

    openCompare,

    clearFilters,

    goToPage,

    retry
  };

  window.GHAR =
    GHAR;

  window.GHARMarketplace =
    GHAR.Marketplace;

  // ==========================================================
  // AUTO START
  // ==========================================================

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