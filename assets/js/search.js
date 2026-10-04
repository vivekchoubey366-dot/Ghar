// ============================================================
// GHAR - REAL ESTATE PLATFORM
// search.js
// Global Property Search / Filters / Sorting / Suggestions
// ============================================================

"use strict";

(function (window, document) {

  const Search = {

    // ========================================================
    // CONFIGURATION
    // ========================================================

    config: {
      apiBase:
        window.GHAR_CONFIG?.API_BASE_URL ||
        "/api",

      endpoints: {
        search: "/search",
        properties: "/properties",
        suggestions: "/search/suggestions",
        popular: "/search/popular",
        recent: "/search/recent"
      },

      pageSize: 20,

      debounceDelay: 350,

      minSearchLength: 2
    },

    // ========================================================
    // STATE
    // ========================================================

    state: {

      query: "",

      location: "",

      propertyType: "",

      listingType: "",

      purpose: "",

      minPrice: null,

      maxPrice: null,

      bedrooms: null,

      bathrooms: null,

      minArea: null,

      maxArea: null,

      furnishing: "",

      possession: "",

      amenities: [],

      verification: "",

      sort: "relevance",

      page: 1,

      total: 0,

      hasMore: true,

      results: [],

      suggestions: [],

      recentSearches: [],

      loading: false,

      initialized: false,

      debounceTimer: null

    },

    // ========================================================
    // INITIALIZE
    // ========================================================

    init() {

      if (this.state.initialized) {
        return this;
      }

      this.state.initialized = true;

      this.readURL();

      this.bindEvents();

      this.loadRecentSearches();

      if (
        this.state.query ||
        this.state.location
      ) {

        this.executeSearch();

      }

      return this;
    },

    // ========================================================
    // API REQUEST
    // ========================================================

    async request(
      endpoint,
      options = {}
    ) {

      const url =
        `${this.config.apiBase}${endpoint}`;

      const headers = {
        "Content-Type":
          "application/json",

        ...(options.headers || {})
      };

      try {

        const token =
          window.GHAR_STORAGE?.get?.(
            "token"
          ) ||
          window.GHAR_STORAGE?.get?.(
            "accessToken"
          ) ||
          localStorage.getItem(
            "ghar_token"
          );

        if (token) {

          headers.Authorization =
            `Bearer ${token}`;
        }

      } catch (error) {

        console.warn(
          "[GHAR Search] Token read failed",
          error
        );
      }

      const response =
        await fetch(
          url,
          {
            ...options,
            headers,
            credentials: "include"
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
            `Request failed: ${response.status}`
          );

        error.status =
          response.status;

        throw error;
      }

      return data;
    },

    // ========================================================
    // SEARCH
    // ========================================================

    async executeSearch(
      options = {}
    ) {

      if (
        this.state.loading
      ) {
        return;
      }

      if (options.reset !== false) {

        this.state.page = 1;

        this.state.hasMore =
          true;
      }

      this.state.loading =
        true;

      this.renderLoading();

      try {

        const params =
          this.buildQueryParams();

        const endpoint =
          `${this.config.endpoints.search}?${params}`;

        const data =
          await this.request(
            endpoint
          );

        const results =
          Array.isArray(data)
            ? data
            : (
                data.properties ||
                data.results ||
                data.data ||
                []
              );

        const total =
          Number(
            data.total ??
            data.count ??
            results.length
          );

        if (
          this.state.page === 1
        ) {

          this.state.results =
            results;

        } else {

          this.state.results = [
            ...this.state.results,
            ...results
          ];
        }

        this.state.total =
          total;

        this.state.hasMore =
          results.length >=
          this.config.pageSize;

        this.renderResults();

        this.updateURL();

        this.saveSearch();

        return {
          results,
          total,
          page:
            this.state.page
        };

      } catch (error) {

        console.error(
          "[GHAR Search] Search failed:",
          error
        );

        this.renderError(
          "Unable to load properties. Please try again."
        );

        return {
          results: [],
          total: 0
        };

      } finally {

        this.state.loading =
          false;
      }
    },

    // ========================================================
    // LOAD MORE
    // ========================================================

    async loadMore() {

      if (
        this.state.loading ||
        !this.state.hasMore
      ) {
        return;
      }

      this.state.page += 1;

      await this.executeSearch({
        reset: false
      });
    },

    // ========================================================
    // BUILD QUERY
    // ========================================================

    buildQueryParams() {

      const params =
        new URLSearchParams();

      const state =
        this.state;

      const add =
        (key, value) => {

          if (
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {

            params.set(
              key,
              String(value)
            );
          }
        };

      add(
        "q",
        state.query
      );

      add(
        "location",
        state.location
      );

      add(
        "propertyType",
        state.propertyType
      );

      add(
        "listingType",
        state.listingType
      );

      add(
        "purpose",
        state.purpose
      );

      add(
        "minPrice",
        state.minPrice
      );

      add(
        "maxPrice",
        state.maxPrice
      );

      add(
        "bedrooms",
        state.bedrooms
      );

      add(
        "bathrooms",
        state.bathrooms
      );

      add(
        "minArea",
        state.minArea
      );

      add(
        "maxArea",
        state.maxArea
      );

      add(
        "furnishing",
        state.furnishing
      );

      add(
        "possession",
        state.possession
      );

      add(
        "verification",
        state.verification
      );

      add(
        "sort",
        state.sort
      );

      add(
        "page",
        state.page
      );

      add(
        "limit",
        this.config.pageSize
      );

      if (
        Array.isArray(
          state.amenities
        ) &&
        state.amenities.length
      ) {

        params.set(
          "amenities",
          state.amenities.join(",")
        );
      }

      return params.toString();
    },

    // ========================================================
    // UPDATE FILTER
    // ========================================================

    setFilter(
      key,
      value,
      search = true
    ) {

      if (
        !Object.prototype.hasOwnProperty.call(
          this.state,
          key
        )
      ) {
        return;
      }

      this.state[key] =
        value;

      if (search) {

        this.debounceSearch();
      }
    },

    // ========================================================
    // MULTI FILTER
    // ========================================================

    toggleAmenity(
      amenity
    ) {

      const value =
        String(
          amenity || ""
        ).trim();

      if (!value) {
        return;
      }

      const index =
        this.state.amenities.indexOf(
          value
        );

      if (index === -1) {

        this.state.amenities.push(
          value
        );

      } else {

        this.state.amenities.splice(
          index,
          1
        );
      }

      this.debounceSearch();
    },

    // ========================================================
    // CLEAR FILTERS
    // ========================================================

    clearFilters() {

      this.state.query = "";
      this.state.location = "";
      this.state.propertyType = "";
      this.state.listingType = "";
      this.state.purpose = "";
      this.state.minPrice = null;
      this.state.maxPrice = null;
      this.state.bedrooms = null;
      this.state.bathrooms = null;
      this.state.minArea = null;
      this.state.maxArea = null;
      this.state.furnishing = "";
      this.state.possession = "";
      this.state.amenities = [];
      this.state.verification = "";
      this.state.sort = "relevance";
      this.state.page = 1;
      this.state.results = [];
      this.state.total = 0;
      this.state.hasMore = true;

      this.syncForm();

      this.executeSearch();
    },

    // ========================================================
    // DEBOUNCE
    // ========================================================

    debounceSearch() {

      if (
        this.state.debounceTimer
      ) {

        clearTimeout(
          this.state.debounceTimer
        );
      }

      this.state.debounceTimer =
        setTimeout(
          () => {

            this.executeSearch();

          },
          this.config.debounceDelay
        );
    },

    // ========================================================
    // SUGGESTIONS
    // ========================================================

    async getSuggestions(
      query
    ) {

      const value =
        String(
          query || ""
        ).trim();

      if (
        value.length <
        this.config.minSearchLength
      ) {

        this.clearSuggestions();

        return [];
      }

      try {

        const endpoint =
          `${this.config.endpoints.suggestions}` +
          `?q=${encodeURIComponent(value)}`;

        const data =
          await this.request(
            endpoint
          );

        const suggestions =
          Array.isArray(data)
            ? data
            : (
                data.suggestions ||
                data.results ||
                data.data ||
                []
              );

        this.state.suggestions =
          suggestions;

        this.renderSuggestions(
          suggestions
        );

        return suggestions;

      } catch (error) {

        console.warn(
          "[GHAR Search] Suggestions:",
          error
        );

        return [];
      }
    },

    // ========================================================
    // POPULAR SEARCHES
    // ========================================================

    async loadPopularSearches() {

      try {

        const data =
          await this.request(
            this.config.endpoints.popular
          );

        const search =
          Array.isArray(data)
            ? data
            : (
                data.searches ||
                data.results ||
                data.data ||
                []
              );

        this.renderPopularSearches(
          searches
        );

        return searches;

      } catch (error) {

        console.warn(
          "[GHAR Search] Popular searches:",
          error
        );

        return [];
      }
    },

    // ========================================================
    // RECENT SEARCHES
    // ========================================================

    loadRecentSearches() {

      try {

        const stored =
          localStorage.getItem(
            "ghar_recent_searches"
          );

        this.state.recentSearches =
          stored
            ? JSON.parse(stored)
            : [];

        if (
          !Array.isArray(
            this.state.recentSearches
          )
        ) {

          this.state.recentSearches =
            [];
        }

        this.renderRecentSearches();

      } catch (error) {

        console.warn(
          "[GHAR Search] Recent searches:",
          error
        );

        this.state.recentSearches =
          [];
      }
    },

    saveSearch() {

      const hasSearch =
        this.state.query ||
        this.state.location ||
        this.state.propertyType ||
        this.state.minPrice ||
        this.state.maxPrice;

      if (!hasSearch) {
        return;
      }

      const search = {

        query:
          this.state.query,

        location:
          this.state.location,

        propertyType:
          this.state.propertyType,

        listingType:
          this.state.listingType,

        purpose:
          this.state.purpose,

        minPrice:
          this.state.minPrice,

        maxPrice:
          this.state.maxPrice,

        bedrooms:
          this.state.bedrooms,

        timestamp:
          Date.now()
      };

      this.state.recentSearches =
        [
          search,
          ...this.state.recentSearches.filter(
            item =>
              JSON.stringify(item) !==
              JSON.stringify(search)
          )
        ].slice(0, 10);

      try {

        localStorage.setItem(
          "ghar_recent_searches",
          JSON.stringify(
            this.state.recentSearches
          )
        );

      } catch (error) {

        console.warn(
          "[GHAR Search] Save recent search:",
          error
        );
      }

      this.renderRecentSearches();
    },

    // ========================================================
    // APPLY SAVED SEARCH
    // ========================================================

    applySavedSearch(
      search
    ) {

      if (!search) {
        return;
      }

      Object.keys(
        search
      ).forEach(
        key => {

          if (
            key === "timestamp"
          ) {
            return;
          }

          if (
            Object.prototype.hasOwnProperty.call(
              this.state,
              key
            )
          ) {

            this.state[key] =
              search[key];
          }
        }
      );

      this.syncForm();

      this.executeSearch();
    },

    // ========================================================
    // URL STATE
    // ========================================================

    readURL() {

      const params =
        new URLSearchParams(
          window.location.search
        );

      const get =
        key =>
          params.get(key);

      this.state.query =
        get("q") || "";

      this.state.location =
        get("location") || "";

      this.state.propertyType =
        get("propertyType") || "";

      this.state.listingType =
        get("listingType") || "";

      this.state.purpose =
        get("purpose") || "";

      this.state.minPrice =
        this.toNumber(
          get("minPrice")
        );

      this.state.maxPrice =
        this.toNumber(
          get("maxPrice")
        );

      this.state.bedrooms =
        this.toNumber(
          get("bedrooms")
        );

      this.state.bathrooms =
        this.toNumber(
          get("bathrooms")
        );

      this.state.minArea =
        this.toNumber(
          get("minArea")
        );

      this.state.maxArea =
        this.toNumber(
          get("maxArea")
        );

      this.state.furnishing =
        get("furnishing") || "";

      this.state.possession =
        get("possession") || "";

      this.state.verification =
        get("verification") || "";

      this.state.sort =
        get("sort") ||
        "relevance";

      const amenities =
        get("amenities");

      this.state.amenities =
        amenities
          ? amenities.split(",")
          : [];

      this.syncForm();
    },

    // ========================================================
    // UPDATE URL
    // ========================================================

    updateURL() {

      try {

        const params =
          new URLSearchParams();

        const query =
          this.buildQueryParams();

        const current =
          new URLSearchParams(
            query
          );

        current.forEach(
          (value, key) => {

            if (
              key !== "page" &&
              key !== "limit"
            ) {

              params.set(
                key,
                value
              );
            }
          }
        );

        const url =
          `${window.location.pathname}` +
          (
            params.toString()
              ? `?${params.toString()}`
              : ""
          );

        window.history.replaceState(
          {},
          "",
          url
        );

      } catch (error) {

        console.warn(
          "[GHAR Search] URL update:",
          error
        );
      }
    },

    // ========================================================
    // FORM SYNCHRONIZATION
    // ========================================================

    syncForm() {

      const map = {

        query:
          "[data-ghar-search-query]",

        location:
          "[data-ghar-search-location]",

        propertyType:
          "[data-ghar-filter-property-type]",

        listingType:
          "[data-ghar-filter-listing-type]",

        purpose:
          "[data-ghar-filter-purpose]",

        minPrice:
          "[data-ghar-filter-min-price]",

        maxPrice:
          "[data-ghar-filter-max-price]",

        bedrooms:
          "[data-ghar-filter-bedrooms]",

        bathrooms:
          "[data-ghar-filter-bathrooms]",

        minArea:
          "[data-ghar-filter-min-area]",

        maxArea:
          "[data-ghar-filter-max-area]",

        furnishing:
          "[data-ghar-filter-furnishing]",

        possession:
          "[data-ghar-filter-possession]",

        verification:
          "[data-ghar-filter-verification]",

        sort:
          "[data-ghar-search-sort]"
      };

      Object.entries(map)
        .forEach(
          ([key, selector]) => {

            const element =
              document.querySelector(
                selector
              );

            if (
              element &&
              this.state[key] !== null &&
              this.state[key] !== undefined
            ) {

              element.value =
                this.state[key];
            }
          }
        );
    },

    // ========================================================
    // RENDER RESULTS
    // ========================================================

    renderResults() {

      const containers =
        document.querySelectorAll(
          "[data-ghar-search-results]"
        );

      containers.forEach(
        container => {

          container.innerHTML = "";

          if (
            !this.state.results.length
          ) {

            container.innerHTML =
              `<div class="ghar-empty-state">
                <h3>No properties found</h3>
                <p>
                  Try changing your location,
                  budget or property filters.
                </p>
              </div>`;

            return;
          }

          this.state.results.forEach(
            property => {

              container.appendChild(
                this.createPropertyCard(
                  property
                )
              );
            }
          );
        }
      );

      this.updateResultCount();
    },

    // ========================================================
    // PROPERTY CARD
    // ========================================================

    createPropertyCard(
      property
    ) {

      const card =
        document.createElement("article");

      card.className =
        "ghar-search-property-card";

      const id =
        property.id ||
        property._id ||
        "";

      const title =
        property.title ||
        property.name ||
        "Property";

      const location =
        property.location ||
        property.city ||
        "Location unavailable";

      const price =
        property.price ||
        property.amount ||
        "Price on request";

      const image =
        property.image ||
        property.thumbnail ||
        property.coverImage ||
        "/assets/images/properties/default.jpg";

      const type =
        property.propertyType ||
        property.type ||
        "";

      const bedrooms =
        property.bedrooms ||
        property.bhk ||
        "";

      card.innerHTML = `

        <a
          class="ghar-property-card-link"
          href="/property-details.html?id=${encodeURIComponent(id)}"
        >

          <div class="ghar-property-image-wrap">

            <img
              class="ghar-property-image"
              src="${this.escapeHTML(image)}"
              alt="${this.escapeHTML(title)}"
              loading="lazy"
            >

          </div>

          <div class="ghar-property-card-body">

            <h3>
              ${this.escapeHTML(title)}
            </h3>

            <p class="ghar-property-location">
              ${this.escapeHTML(location)}
            </p>

            <strong class="ghar-property-price">
              ${this.escapeHTML(
                this.formatPrice(price)
              )}
            </strong>

            <div class="ghar-property-meta">

              ${
                type
                  ? `<span>
                      ${this.escapeHTML(type)}
                    </span>`
                  : ""
              }

              ${
                bedrooms
                  ? `<span>
                      ${this.escapeHTML(
                        bedrooms
                      )} BHK
                    </span>`
                  : ""
              }

            </div>

          </div>

        </a>
      `;

      return card;
    },

    // ========================================================
    // SUGGESTIONS RENDERER
    // ========================================================

    renderSuggestions(
      suggestions
    ) {

      const containers =
        document.querySelectorAll(
          "[data-ghar-search-suggestions]"
        );

      containers.forEach(
        container => {

          container.innerHTML = "";

          suggestions.forEach(
            suggestion => {

              const value =
                typeof suggestion === "string"
                  ? suggestion
                  : (
                      suggestion.label ||
                      suggestion.name ||
                      suggestion.location ||
                      suggestion.value ||
                      ""
                    );

              if (!value) {
                return;
              }

              const item =
                document.createElement(
                  "button"
                );

              item.type =
                "button";

              item.className =
                "ghar-search-suggestion";

              item.textContent =
                value;

              item.addEventListener(
                "click",
                () => {

                  this.state.query =
                    value;

                  this.syncForm();

                  this.clearSuggestions();

                  this.executeSearch();
                }
              );

              container.appendChild(
                item
              );
            }
          );
        }
      );
    },

    clearSuggestions() {

      document
        .querySelectorAll(
          "[data-ghar-search-suggestions]"
        )
        .forEach(
          container => {

            container.innerHTML =
              "";
          }
        );
    },

    // ========================================================
    // RECENT SEARCH RENDERER
    // ========================================================

    renderRecentSearches() {

      const containers =
        document.querySelectorAll(
          "[data-ghar-recent-searches]"
        );

      containers.forEach(
        container => {

          container.innerHTML = "";

          this.state.recentSearches
            .forEach(
              search => {

                const item =
                  document.createElement(
                    "button"
                  );

                item.type =
                  "button";

                item.className =
                  "ghar-recent-search";

                item.textContent =
                  search.query ||
                  search.location ||
                  search.propertyType ||
                  "Saved search";

                item.addEventListener(
                  "click",
                  () => {

                    this.applySavedSearch(
                      search
                    );
                  }
                );

                container.appendChild(
                  item
                );
              }
            );
        }
      );
    },

    // ========================================================
    // POPULAR SEARCH RENDERER
    // ========================================================

    renderPopularSearches(
      searches
    ) {

      const containers =
        document.querySelectorAll(
          "[data-ghar-popular-searches]"
        );

      containers.forEach(
        container => {

          container.innerHTML = "";

          searches.forEach(
            search => {

              const value =
                typeof search === "string"
                  ? search
                  : (
                      search.label ||
                      search.name ||
                      search.query ||
                      ""
                    );

              if (!value) {
                return;
              }

              const item =
                document.createElement(
                  "button"
                );

              item.type =
                "button";

              item.className =
                "ghar-popular-search";

              item.textContent =
                value;

              item.addEventListener(
                "click",
                () => {

                  this.state.query =
                    value;

                  this.syncForm();

                  this.executeSearch();
                }
              );

              container.appendChild(
                item
              );
            }
          );
        }
      );
    },

    // ========================================================
    // LOADING
    // ========================================================

    renderLoading() {

      document
        .querySelectorAll(
          "[data-ghar-search-results]"
        )
        .forEach(
          container => {

            if (
              this.state.page === 1
            ) {

              container.innerHTML =
                `<div class="ghar-loading">
                  Searching GHAR properties...
                </div>`;
            }
          }
        );
    },

    // ========================================================
    // ERROR
    // ========================================================

    renderError(
      message
    ) {

      document
        .querySelectorAll(
          "[data-ghar-search-results]"
        )
        .forEach(
          container => {

            container.innerHTML =
              `<div class="ghar-error-state">
                <h3>Search unavailable</h3>
                <p>
                  ${this.escapeHTML(message)}
                </p>
                <button
                  type="button"
                  data-ghar-retry-search
                >
                  Try Again
                </button>
              </div>`;
          }
        );
    },

    // ========================================================
    // RESULT COUNT
    // ========================================================

    updateResultCount() {

      document
        .querySelectorAll(
          "[data-ghar-search-count]"
        )
        .forEach(
          element => {

            element.textContent =
              this.state.total
                ? `${this.state.total.toLocaleString()} properties`
                : "0 properties";
          }
        );
    },

    // ========================================================
    // EVENT BINDINGS
    // ========================================================

    bindEvents() {

      // Main search input
      document.addEventListener(
        "input",
        event => {

          const input =
            event.target.closest(
              "[data-ghar-search-query]"
            );

          if (!input) {
            return;
          }

          this.state.query =
            input.value;

          this.getSuggestions(
            input.value
          );

          this.debounceSearch();
        }
      );

      // Location input
      document.addEventListener(
        "input",
        event => {

          const input =
            event.target.closest(
              "[data-ghar-search-location]"
            );

          if (!input) {
            return;
          }

          this.state.location =
            input.value;

          this.debounceSearch();
        }
      );

      // Select/input filters
      document.addEventListener(
        "change",
        event => {

          const target =
            event.target;

          const mappings = {

            "[data-ghar-filter-property-type]":
              "propertyType",

            "[data-ghar-filter-listing-type]":
              "listingType",

            "[data-ghar-filter-purpose]":
              "purpose",

            "[data-ghar-filter-min-price]":
              "minPrice",

            "[data-ghar-filter-max-price]":
              "maxPrice",

            "[data-ghar-filter-bedrooms]":
              "bedrooms",

            "[data-ghar-filter-bathrooms]":
              "bathrooms",

            "[data-ghar-filter-min-area]":
              "minArea",

            "[data-ghar-filter-max-area]":
              "maxArea",

            "[data-ghar-filter-furnishing]":
              "furnishing",

            "[data-ghar-filter-possession]":
              "possession",

            "[data-ghar-filter-verification]":
              "verification",

            "[data-ghar-search-sort]":
              "sort"
          };

          for (
            const [
              selector,
              key
            ] of Object.entries(
              mappings
            )
          ) {

            if (
              target.matches(
                selector
              )
            ) {

              this.setFilter(
                key,
                this.toNumberIfNeeded(
                  key,
                  target.value
                )
              );

              break;
            }
          }
        }
      );

      // Search form submit
      document.addEventListener(
        "submit",
        event => {

          const form =
            event.target.closest(
              "[data-ghar-search-form]"
            );

          if (!form) {
            return;
          }

          event.preventDefault();

          this.syncStateFromForm(
            form
          );

          this.executeSearch();
        }
      );

      // Clear filters
      document.addEventListener(
        "click",
        event => {

          const button =
            event.target.closest(
              "[data-ghar-clear-search]"
            );

          if (!button) {
            return;
          }

          this.clearFilters();
        }
      );

      // Load more
      document.addEventListener(
        "click",
        event => {

          const button =
            event.target.closest(
              "[data-ghar-load-more-search]"
            );

          if (!button) {
            return;
          }

          this.loadMore();
        }
      );

      // Retry
      document.addEventListener(
        "click",
        event => {

          const button =
            event.target.closest(
              "[data-ghar-retry-search]"
            );

          if (!button) {
            return;
          }

          this.executeSearch();
        }
      );

      // Amenity
      document.addEventListener(
        "change",
        event => {

          const checkbox =
            event.target.closest(
              "[data-ghar-amenity]"
            );

          if (!checkbox) {
            return;
          }

          this.toggleAmenity(
            checkbox.value
          );
        }
      );
    },

    // ========================================================
    // SYNC FORM -> STATE
    // ========================================================

    syncStateFromForm(
      form
    ) {

      const get =
        selector =>
          form.querySelector(
            selector
          )?.value;

      this.state.query =
        get(
          "[data-ghar-search-query]"
        ) || "";

      this.state.location =
        get(
          "[data-ghar-search-location]"
        ) || "";

      this.state.propertyType =
        get(
          "[data-ghar-filter-property-type]"
        ) || "";

      this.state.listingType =
        get(
          "[data-ghar-filter-listing-type]"
        ) || "";

      this.state.purpose =
        get(
          "[data-ghar-filter-purpose]"
        ) || "";

      this.state.minPrice =
        this.toNumber(
          get(
            "[data-ghar-filter-min-price]"
          )
        );

      this.state.maxPrice =
        this.toNumber(
          get(
            "[data-ghar-filter-max-price]"
          )
        );

      this.state.bedrooms =
        this.toNumber(
          get(
            "[data-ghar-filter-bedrooms]"
          )
        );

      this.state.bathrooms =
        this.toNumber(
          get(
            "[data-ghar-filter-bathrooms]"
          )
        );

      this.state.minArea =
        this.toNumber(
          get(
            "[data-ghar-filter-min-area]"
          )
        );

      this.state.maxArea =
        this.toNumber(
          get(
            "[data-ghar-filter-max-area]"
          )
        );

      this.state.furnishing =
        get(
          "[data-ghar-filter-furnishing]"
        ) || "";

      this.state.possession =
        get(
          "[data-ghar-filter-possession]"
        ) || "";

      this.state.verification =
        get(
          "[data-ghar-filter-verification]"
        ) || "";

      this.state.sort =
        get(
          "[data-ghar-search-sort]"
        ) ||
        "relevance";
    },

    // ========================================================
    // HELPERS
    // ========================================================

    toNumber(
      value
    ) {

      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {

        return null;
      }

      const number =
        Number(value);

      return Number.isFinite(number)
        ? number
        : null;
    },

    toNumberIfNeeded(
      key,
      value
    ) {

      const numericFields = [
        "minPrice",
        "maxPrice",
        "bedrooms",
        "bathrooms",
        "minArea",
        "maxArea"
      ];

      return numericFields.includes(
        key
      )
        ? this.toNumber(value)
        : value;
    },

    formatPrice(
      price
    ) {

      if (
        typeof price === "number"
      ) {

        return new Intl.NumberFormat(
          "en-IN",
          {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
          }
        ).format(price);
      }

      return String(price);
    },

    escapeHTML(
      value
    ) {

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
    },

    // ========================================================
    // DESTROY
    // ========================================================

    destroy() {

      if (
        this.state.debounceTimer
      ) {

        clearTimeout(
          this.state.debounceTimer
        );
      }

      this.state.initialized =
        false;
    }
  };

  // ==========================================================
  // GLOBAL GHAR API
  // ==========================================================

  window.GHAR_SEARCH =
    Search;

  // ==========================================================
  // AUTO INITIALIZATION
  // ==========================================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () => Search.init(),
      {
        once: true
      }
    );

  } else {

    Search.init();
  }

})(window, document);