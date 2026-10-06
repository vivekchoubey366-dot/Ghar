// ============================================================
// GHAR - REAL ESTATE PLATFORM
// search.js
// Global Property Search / Filters / Sorting / Suggestions
// Production-grade frontend search manager
// ============================================================
"use strict";
(function (window, document) {
  const GHAR = window.GHAR = window.GHAR || {};
  // ==========================================================
  // CONSTANTS
  // ==========================================================
  const DEFAULTS = Object.freeze({
    pageSize: 20,
    debounceDelay: 350,
    minSearchLength: 2,
    maxRecentSearches: 10,
    maxSuggestions: 10,
    maxPopularSearches: 12,
    defaultSort: "relevance"
  });
  const NUMERIC_FIELDS = Object.freeze([
    "minPrice",
    "maxPrice",
    "bedrooms",
    "bathrooms",
    "minArea",
    "maxArea"
  ]);
  const FILTER_KEYS = Object.freeze([
    "query",
    "location",
    "propertyType",
    "listingType",
    "purpose",
    "minPrice",
    "maxPrice",
    "bedrooms",
    "bathrooms",
    "minArea",
    "maxArea",
    "furnishing",
    "possession",
    "verification",
    "sort"
  ]);
  // ==========================================================
  // SEARCH MANAGER
  // ==========================================================
  const Search = {
    // ========================================================
    // CONFIGURATION
    // ========================================================
    config: {
      apiBase:
        window.GHAR_CONFIG?.API_BASE_URL ||
        "/api",
      endpoints: {
        search:
          "/search",
        properties:
          "/properties",
        suggestions:
          "/search/suggestions",
        popular:
          "/search/popular",
        recent:
          "/search/recent"
      },
      pageSize:
        DEFAULTS.pageSize,
      debounceDelay:
        DEFAULTS.debounceDelay,
      minSearchLength:
        DEFAULTS.minSearchLength,
      maxRecentSearches:
        DEFAULTS.maxRecentSearches,
      maxSuggestions:
        DEFAULTS.maxSuggestions,
      maxPopularSearches:
        DEFAULTS.maxPopularSearches,
      defaultSort:
        DEFAULTS.defaultSort,
      recentStorageKey:
        "ghar_recent_searches"
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
      sort:
        DEFAULTS.defaultSort,
      page: 1,
      total: 0,
      hasMore: false,
      results: [],
      suggestions: [],
      recentSearches: [],
      popularSearches: [],
      loading: false,
      initialized: false,
      searching: false,
      error: null,
      lastSearchAt: null,
      requestController: null,
      requestSequence: 0,
      debounceTimer: null
    },
    // ========================================================
    // INITIALIZE
    // ========================================================
    init() {
      if (
        this.state.initialized
      ) {
        return this;
      }
      this.state.initialized =
        true;
      this.readURL();
      this.loadRecentSearches();
      this.bindEvents();
      if (
        this.hasActiveSearch()
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
      const apiBase =
        String(
          this.config.apiBase || ""
        ).replace(
          /\/+$/,
          ""
        );
      const normalizedEndpoint =
        String(
          endpoint || ""
        ).startsWith("/")
          ? endpoint
          : `/${endpoint}`;
      const url =
        `${apiBase}${normalizedEndpoint}`;
      const headers = {
        Accept:
          "application/json",
        ...(options.body
          ? {
              "Content-Type":
                "application/json"
            }
          : {}),
        ...(options.headers || {})
      };
      // ------------------------------------------------------
      // AUTH TOKEN
      // ------------------------------------------------------
      try {
        const storage =
          window.GHAR_STORAGE;
        const token =
          storage?.get?.(
            "accessToken"
          ) ||
          storage?.get?.(
            "token"
          ) ||
          localStorage.getItem(
            "ghar_access_token"
          ) ||
          localStorage.getItem(
            "ghar_token"
          );
        if (
          token &&
          !headers.Authorization
        ) {
          headers.Authorization =
            `Bearer ${token}`;
        }
      } catch (error) {
        console.warn(
          "[GHAR Search] Unable to read auth token.",
          error
        );
      }
      const response =
        await fetch(
          url,
          {
            ...options,
            headers,
            credentials:
              options.credentials ||
              "include"
          }
        );
      // ------------------------------------------------------
      // RESPONSE
      // ------------------------------------------------------
      let data = null;
      const contentType =
        response.headers.get(
          "content-type"
        ) || "";
      if (
        contentType.includes(
          "application/json"
        )
      ) {
        try {
          data =
            await response.json();
        } catch {
          data = null;
        }
      } else {
        try {
          const text =
            await response.text();
          data =
            text
              ? {
                  message: text
                }
              : null;
        } catch {
          data = null;
        }
      }
      if (
        !response.ok
      ) {
        const message =
          data?.error?.message ||
          data?.error ||
          data?.message ||
          `Request failed with status ${response.status}`;
        const error =
          new Error(
            message
          );
        error.status =
          response.status;
        error.data =
          data;
        throw error;
      }
      return data;
    },
    // ========================================================
    // EXECUTE SEARCH
    // ========================================================
    async executeSearch(
      options = {}
    ) {
      const reset =
        options.reset !== false;
      if (
        this.state.searching &&
        !options.force
      ) {
        return {
          results:
            this.state.results,
          total:
            this.state.total,
          page:
            this.state.page,
          skipped:
            true
        };
      }
      if (
        reset
      ) {
        this.state.page =
          1;
        this.state.hasMore =
          true;
      }
      // ------------------------------------------------------
      // CANCEL PREVIOUS REQUEST
      // ------------------------------------------------------
      this.abortCurrentRequest();
      const controller =
        new AbortController();
      this.state.requestController =
        controller;
      const requestId =
        ++this.state.requestSequence;
      this.state.loading =
        true;
      this.state.searching =
        true;
      this.state.error =
        null;
      this.renderLoading();
      try {
        const params =
          this.buildQueryParams();
        const endpoint =
          `${this.config.endpoints.search}?${params}`;
        const data =
          await this.request(
            endpoint,
            {
              method: "GET",
              signal:
                controller.signal
            }
          );
        // Ignore stale responses.
        if (
          requestId !==
          this.state.requestSequence
        ) {
          return {
            results: [],
            total: 0,
            stale: true
          };
        }
        const normalized =
          this.normalizeSearchResponse(
            data
          );
        const results =
          normalized.results;
        if (
          this.state.page === 1
        ) {
          this.state.results =
            results;
        } else {
          this.state.results =
            this.mergeResults(
              this.state.results,
              results
            );
        }
        this.state.total =
          normalized.total;
        this.state.hasMore =
          normalized.hasMore;
        this.state.lastSearchAt =
          Date.now();
        this.renderResults();
        this.updateResultCount();
        this.updateURL();
        if (
          this.state.page === 1
        ) {
          this.saveSearch();
        }
        return {
          results:
            this.state.results,
          total:
            this.state.total,
          page:
            this.state.page,
          hasMore:
            this.state.hasMore
        };
      } catch (error) {
        if (
          error?.name ===
          "AbortError"
        ) {
          return {
            results: [],
            total: 0,
            aborted: true
          };
        }
        console.error(
          "[GHAR Search] Search failed:",
          error
        );
        this.state.error =
          error;
        this.renderError(
          this.getUserErrorMessage(
            error
          )
        );
        return {
          results: [],
          total: 0,
          error
        };
      } finally {
        if (
          requestId ===
          this.state.requestSequence
        ) {
          this.state.loading =
            false;
          this.state.searching =
            false;
          this.state.requestController =
            null;
        }
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
        return null;
      }
      this.state.page += 1;
      const result =
        await this.executeSearch({
          reset: false
        });
      if (
        result?.error
      ) {
        this.state.page =
          Math.max(
            1,
            this.state.page - 1
          );
      }
      return result;
    },
    // ========================================================
    // BUILD QUERY PARAMETERS
    // ========================================================
    buildQueryParams() {
      const params =
        new URLSearchParams();
      const state =
        this.state;
      const add =
        (
          key,
          value
        ) => {
          if (
            value === undefined ||
            value === null ||
            value === ""
          ) {
            return;
          }
          params.set(
            key,
            String(value)
          );
        };
      add(
        "q",
        this.cleanText(
          state.query
        )
      );
      add(
        "location",
        this.cleanText(
          state.location
        )
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
        this.toNumber(
          state.minPrice
        )
      );
      add(
        "maxPrice",
        this.toNumber(
          state.maxPrice
        )
      );
      add(
        "bedrooms",
        this.toNumber(
          state.bedrooms
        )
      );
      add(
        "bathrooms",
        this.toNumber(
          state.bathrooms
        )
      );
      add(
        "minArea",
        this.toNumber(
          state.minArea
        )
      );
      add(
        "maxArea",
        this.toNumber(
          state.maxArea
        )
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
        state.sort ||
        this.config.defaultSort
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
          state.amenities
            .map(item =>
              this.cleanText(item)
            )
            .filter(Boolean)
            .join(",")
        );
      }
      return params.toString();
    },
    // ========================================================
    // SET FILTER
    // ========================================================
    setFilter(
      key,
      value,
      search = true
    ) {
      if (
        !FILTER_KEYS.includes(
          key
        )
      ) {
        console.warn(
          `[GHAR Search] Unknown filter: ${key}`
        );
        return false;
      }
      if (
        NUMERIC_FIELDS.includes(
          key
        )
      ) {
        value =
          this.toNumber(
            value
          );
      } else if (
        typeof value ===
        "string"
      ) {
        value =
          this.cleanText(
            value
          );
      }
      this.state[key] =
        value;
      if (
        search
      ) {
        this.debounceSearch();
      }
      return true;
    },
    // ========================================================
    // TOGGLE AMENITY
    // ========================================================
    toggleAmenity(
      amenity,
      search = true
    ) {
      const value =
        this.cleanText(
          amenity
        );
      if (!value) {
        return false;
      }
      const index =
        this.state.amenities.indexOf(
          value
        );
      if (
        index === -1
      ) {
        this.state.amenities.push(
          value
        );
      } else {
        this.state.amenities.splice(
          index,
          1
        );
      }
      if (
        search
      ) {
        this.debounceSearch();
      }
      return true;
    },
    // ========================================================
    // CLEAR FILTERS
    // ========================================================
    clearFilters(
      execute = true
    ) {
      this.abortCurrentRequest();
      this.state.query =
        "";
      this.state.location =
        "";
      this.state.propertyType =
        "";
      this.state.listingType =
        "";
      this.state.purpose =
        "";
      this.state.minPrice =
        null;
      this.state.maxPrice =
        null;
      this.state.bedrooms =
        null;
      this.state.bathrooms =
        null;
      this.state.minArea =
        null;
      this.state.maxArea =
        null;
      this.state.furnishing =
        "";
      this.state.possession =
        "";
      this.state.amenities =
        [];
      this.state.verification =
        "";
      this.state.sort =
        this.config.defaultSort;
      this.state.page =
        1;
      this.state.results =
        [];
      this.state.total =
        0;
      this.state.hasMore =
        false;
      this.state.error =
        null;
      this.syncForm();
      this.updateURL();
      this.updateResultCount();
      if (
        execute
      ) {
        return this.executeSearch();
      }
      this.renderResults();
      return null;
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
        this.cleanText(
          query
        );
      if (
        value.length <
        this.config.minSearchLength
      ) {
        this.state.suggestions =
          [];
        this.clearSuggestions();
        return [];
      }
      try {
        const endpoint =
          `${this.config.endpoints.suggestions}` +
          `?q=${encodeURIComponent(
            value
          )}`;
        const data =
          await this.request(
            endpoint
          );
        const suggestions =
          this.extractArray(
            data,
            [
              "suggestions",
              "results",
              "data"
            ]
          )
            .slice(
              0,
              this.config.maxSuggestions
            );
        this.state.suggestions =
          suggestions;
        this.renderSuggestions(
          suggestions
        );
        return suggestions;
      } catch (error) {
        if (
          error?.name !==
          "AbortError"
        ) {
          console.warn(
            "[GHAR Search] Suggestions failed:",
            error
          );
        }
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
        // Fixed original bug:
        // the old code created `search` but rendered
        // undefined `searches`.
        const searches =
          this.extractArray(
            data,
            [
              "searches",
              "popular",
              "results",
              "data"
            ]
          )
            .slice(
              0,
              this.config.maxPopularSearches
            );
        this.state.popularSearches =
          searches;
        this.renderPopularSearches(
          searches
        );
        return searches;
      } catch (error) {
        console.warn(
          "[GHAR Search] Popular searches failed:",
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
            this.config.recentStorageKey
          );
        if (!stored) {
          this.state.recentSearches =
            [];
          this.renderRecentSearches();
          return [];
        }
        const parsed =
          JSON.parse(
            stored
          );
        this.state.recentSearches =
          Array.isArray(parsed)
            ? parsed
                .filter(
                  item =>
                    item &&
                    typeof item ===
                    "object"
                )
                .slice(
                  0,
                  this.config.maxRecentSearches
                )
            : [];
      } catch (error) {
        console.warn(
          "[GHAR Search] Recent searches failed:",
          error
        );
        this.state.recentSearches =
          [];
      }
      this.renderRecentSearches();
      return [
        ...this.state.recentSearches
      ];
    },
    // ========================================================
    // SAVE SEARCH
    // ========================================================
    saveSearch() {
      if (
        !this.hasActiveSearch()
      ) {
        return false;
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
        bathrooms:
          this.state.bathrooms,
        minArea:
          this.state.minArea,
        maxArea:
          this.state.maxArea,
        furnishing:
          this.state.furnishing,
        possession:
          this.state.possession,
        amenities:
          [
            ...this.state.amenities
          ],
        verification:
          this.state.verification,
        sort:
          this.state.sort,
        timestamp:
          Date.now()
      };
      const fingerprint =
        this.createSearchFingerprint(
          search
        );
      const existing =
        this.state.recentSearches
          .filter(
            item =>
              this.createSearchFingerprint(
                item
              ) !==
              fingerprint
          );
      this.state.recentSearches =
        [
          search,
          ...existing
        ].slice(
          0,
          this.config.maxRecentSearches
        );
      try {
        localStorage.setItem(
          this.config.recentStorageKey,
          JSON.stringify(
            this.state.recentSearches
          )
        );
      } catch (error) {
        console.warn(
          "[GHAR Search] Unable to save recent search:",
          error
        );
      }
      this.renderRecentSearches();
      return true;
    },
    // ========================================================
    // APPLY SAVED SEARCH
    // ========================================================
    applySavedSearch(
      search
    ) {
      if (
        !search ||
        typeof search !==
        "object"
      ) {
        return null;
      }
      FILTER_KEYS.forEach(
        key => {
          if (
            Object.prototype.hasOwnProperty.call(
              search,
              key
            )
          ) {
            this.state[key] =
              NUMERIC_FIELDS.includes(
                key
              )
                ? this.toNumber(
                    search[key]
                  )
                : (
                    search[key] ?? ""
                  );
          }
        }
      );
      this.state.amenities =
        Array.isArray(
          search.amenities
        )
          ? [
              ...search.amenities
            ]
          : [];
      this.state.page =
        1;
      this.syncForm();
      return this.executeSearch();
    },
    // ========================================================
    // URL STATE
    // ========================================================
    readURL() {
      try {
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
          this.config.defaultSort;
        const amenities =
          get("amenities");
        this.state.amenities =
          amenities
            ? amenities
                .split(",")
                .map(
                  item =>
                    this.cleanText(item)
                )
                .filter(Boolean)
            : [];
        this.state.page =
          Math.max(
            1,
            this.toNumber(
              get("page")
            ) || 1
          );
        this.syncForm();
      } catch (error) {
        console.warn(
          "[GHAR Search] URL parsing failed:",
          error
        );
      }
    },
    // ========================================================
    // UPDATE URL
    // ========================================================
    updateURL() {
      try {
        const params =
          new URLSearchParams(
            this.buildQueryParams()
          );
        params.delete(
          "page"
        );
        params.delete(
          "limit"
        );
        const query =
          params.toString();
        const url =
          `${window.location.pathname}` +
          (
            query
              ? `?${query}`
              : ""
          );
        const current =
          `${window.location.pathname}` +
          `${window.location.search}`;
        if (
          url !== current
        ) {
          window.history.replaceState(
            {
              gharSearch:
                true
            },
            "",
            url
          );
        }
      } catch (error) {
        console.warn(
          "[GHAR Search] URL update failed:",
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
      Object.entries(
        map
      ).forEach(
        ([key, selector]) => {
          const elements =
            document.querySelectorAll(
              selector
            );
          elements.forEach(
            element => {
              if (
                this.state[key] !==
                  null &&
                this.state[key] !==
                  undefined
              ) {
                element.value =
                  this.state[key];
              }
            }
          );
        }
      );
      // Sync amenities.
      document
        .querySelectorAll(
          "[data-ghar-amenity]"
        )
        .forEach(
          checkbox => {
            checkbox.checked =
              this.state.amenities.includes(
                checkbox.value
              );
          }
        );
    },
    // ========================================================
    // SYNC STATE FROM FORM
    // ========================================================
    syncStateFromForm(
      form
    ) {
      if (
        !form
      ) {
        return;
      }
      const get =
        selector =>
          form.querySelector(
            selector
          )?.value;
      this.state.query =
        this.cleanText(
          get(
            "[data-ghar-search-query]"
          ) || ""
        );
      this.state.location =
        this.cleanText(
          get(
            "[data-ghar-search-location]"
          ) || ""
        );
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
        this.config.defaultSort;
      this.state.amenities =
        Array.from(
          form.querySelectorAll(
            "[data-ghar-amenity]:checked"
          )
        )
          .map(
            checkbox =>
              checkbox.value
          )
          .filter(Boolean);
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
          container.innerHTML =
            "";
          if (
            !this.state.results.length
          ) {
            container.innerHTML = `
              <div
                class="ghar-empty-state"
                role="status"
              >
                <h3>
                  No properties found
                </h3>
                <p>
                  Try changing your location,
                  budget or property filters.
                </p>
              </div>
            `;
            return;
          }
          const fragment =
            document.createDocumentFragment();
          this.state.results.forEach(
            property => {
              fragment.appendChild(
                this.createPropertyCard(
                  property
                )
              );
            }
          );
          container.appendChild(
            fragment
          );
        }
      );
      this.updateLoadMoreState();
    },
    // ========================================================
    // PROPERTY CARD
    // ========================================================
    createPropertyCard(
      property = {}
    ) {
      const card =
        document.createElement(
          "article"
        );
      card.className =
        "ghar-search-property-card";
      const id =
        property.id ??
        property._id ??
        "";
      const title =
        property.title ||
        property.name ||
        "Property";
      const location =
        property.location ||
        this.buildLocation(
          property
        ) ||
        "Location unavailable";
      const price =
        property.price ??
        property.amount ??
        null;
      const image =
        property.image ||
        property.thumbnail ||
        property.coverImage ||
        property.images?.[0]?.url ||
        property.images?.[0] ||
        "/assets/images/properties/default.jpg";
      const type =
        property.propertyType ||
        property.type ||
        "";
      const bedrooms =
        property.bedrooms ??
        property.bhk ??
        "";
      const bathrooms =
        property.bathrooms ??
        "";
      const area =
        property.area ??
        property.areaSqFt ??
        property.squareFeet ??
        "";
      const verified =
        property.verificationStatus ===
          "verified" ||
        property.verified === true;
      // ------------------------------------------------------
      // Safe DOM construction
      // ------------------------------------------------------
      const link =
        document.createElement(
          "a"
        );
      link.className =
        "ghar-property-card-link";
      link.href =
        this.buildPropertyURL(
          id
        );
      const imageWrap =
        document.createElement(
          "div"
        );
      imageWrap.className =
        "ghar-property-image-wrap";
      const imageElement =
        document.createElement(
          "img"
        );
      imageElement.className =
        "ghar-property-image";
      imageElement.src =
        this.safeImageURL(
          image
        );
      imageElement.alt =
        title;
      imageElement.loading =
        "lazy";
      imageElement.decoding =
        "async";
      imageElement.addEventListener(
        "error",
        () => {
          if (
            imageElement.dataset.fallbackApplied
          ) {
            return;
          }
          imageElement.dataset
            .fallbackApplied =
            "true";
          imageElement.src =
            "/assets/images/properties/default.jpg";
        },
        {
          once: true
        }
      );
      imageWrap.appendChild(
        imageElement
      );
      const body =
        document.createElement(
          "div"
        );
      body.className =
        "ghar-property-card-body";
      const heading =
        document.createElement(
          "h3"
        );
      heading.textContent =
        title;
      body.appendChild(
        heading
      );
      const locationElement =
        document.createElement(
          "p"
        );
      locationElement.className =
        "ghar-property-location";
      locationElement.textContent =
        location;
      body.appendChild(
        locationElement
      );
      const priceElement =
        document.createElement(
          "strong"
        );
      priceElement.className =
        "ghar-property-price";
      priceElement.textContent =
        this.formatPrice(
          price
        );
      body.appendChild(
        priceElement
      );
      const meta =
        document.createElement(
          "div"
        );
      meta.className =
        "ghar-property-meta";
      this.appendMeta(
        meta,
        type
      );
      if (
        bedrooms !== "" &&
        bedrooms !== null &&
        bedrooms !== undefined
      ) {
        this.appendMeta(
          meta,
          `${bedrooms} BHK`
        );
      }
      if (
        bathrooms !== "" &&
        bathrooms !== null &&
        bathrooms !== undefined
      ) {
        this.appendMeta(
          meta,
          `${bathrooms} Bath`
        );
      }
      if (
        area !== "" &&
        area !== null &&
        area !== undefined
      ) {
        this.appendMeta(
          meta,
          `${area} sq.ft`
        );
      }
      if (
        verified
      ) {
        this.appendMeta(
          meta,
          "Verified"
        );
      }
      body.appendChild(
        meta
      );
      link.appendChild(
        imageWrap
      );
      link.appendChild(
        body
      );
      card.appendChild(
        link
      );
      return card;
    },
    // ========================================================
    // META ITEM
    // ========================================================
    appendMeta(
      container,
      text
    ) {
      if (
        !text
      ) {
        return;
      }
      const span =
        document.createElement(
          "span"
        );
      span.textContent =
        String(text);
      container.appendChild(
        span
      );
    },
    // ========================================================
    // PROPERTY URL
    // ========================================================
    buildPropertyURL(
      id
    ) {
      const encoded =
        encodeURIComponent(
          String(id || "")
        );
      return (
        `/property-details.html` +
        `?id=${encoded}`
      );
    },
    // ========================================================
    // SUGGESTIONS RENDERER
    // ========================================================
    renderSuggestions(
      suggestions = []
    ) {
      const containers =
        document.querySelectorAll(
          "[data-ghar-search-suggestions]"
        );
      containers.forEach(
        container => {
          container.innerHTML =
            "";
          suggestions.forEach(
            suggestion => {
              const value =
                this.getSuggestionValue(
                  suggestion
                );
              if (
                !value
              ) {
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
    // ========================================================
    // CLEAR SUGGESTIONS
    // ========================================================
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
      this.state.suggestions =
        [];
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
          container.innerHTML =
            "";
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
                  this.getSearchLabel(
                    search
                  );
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
      searches = []
    ) {
      const containers =
        document.querySelectorAll(
          "[data-ghar-popular-searches]"
        );
      containers.forEach(
        container => {
          container.innerHTML =
            "";
          searches.forEach(
            search => {
              const value =
                this.getSuggestionValue(
                  search
                );
              if (
                !value
              ) {
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
      const containers =
        document.querySelectorAll(
          "[data-ghar-search-results]"
        );
      containers.forEach(
        container => {
          if (
            this.state.page !== 1 &&
            this.state.results.length
          ) {
            this.updateLoadMoreState(
              true
            );
            return;
          }
          container.innerHTML = `
            <div
              class="ghar-loading"
              role="status"
              aria-live="polite"
            >
              Searching GHAR properties...
            </div>
          `;
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
            container.innerHTML = `
              <div
                class="ghar-error-state"
                role="alert"
              >
                <h3>
                  Search unavailable
                </h3>
                <p></p>
                <button
                  type="button"
                  data-ghar-retry-search
                >
                  Try Again
                </button>
              </div>
            `;
            const paragraph =
              container.querySelector(
                "p"
              );
            if (
              paragraph
            ) {
              paragraph.textContent =
                message;
            }
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
            const total =
              Number(
                this.state.total
              ) || 0;
            element.textContent =
              `${total.toLocaleString(
                "en-IN"
              )} ${
                total === 1
                  ? "property"
                  : "properties"
              }`;
          }
        );
    },
    // ========================================================
    // LOAD MORE STATE
    // ========================================================
    updateLoadMoreState(
      loading = false
    ) {
      document
        .querySelectorAll(
          "[data-ghar-load-more-search]"
        )
        .forEach(
          button => {
            button.disabled =
              loading ||
              this.state.loading ||
              !this.state.hasMore;
            button.hidden =
              !this.state.hasMore;
            if (
              loading ||
              this.state.loading
            ) {
              button.textContent =
                "Loading...";
            } else {
              button.textContent =
                "Load More";
            }
          }
        );
    },
    // ========================================================
    // EVENT BINDINGS
    // ========================================================
    bindEvents() {
      // ------------------------------------------------------
      // Input events
      // ------------------------------------------------------
      document.addEventListener(
        "input",
        event => {
          const queryInput =
            event.target.closest(
              "[data-ghar-search-query]"
            );
          if (
            queryInput
          ) {
            this.state.query =
              queryInput.value;
            this.getSuggestions(
              queryInput.value
            );
            this.debounceSearch();
            return;
          }
          const locationInput =
            event.target.closest(
              "[data-ghar-search-location]"
            );
          if (
            locationInput
          ) {
            this.state.location =
              locationInput.value;
            this.debounceSearch();
          }
        }
      );
      // ------------------------------------------------------
      // Change events
      // ------------------------------------------------------
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
                target.value
              );
              return;
            }
          }
          const amenity =
            target.closest(
              "[data-ghar-amenity]"
            );
          if (
            amenity
          ) {
            this.toggleAmenity(
              amenity.value
            );
          }
        }
      );
      // ------------------------------------------------------
      // Form submit
      // ------------------------------------------------------
      document.addEventListener(
        "submit",
        event => {
          const form =
            event.target.closest(
              "[data-ghar-search-form]"
            );
          if (
            !form
          ) {
            return;
          }
          event.preventDefault();
          this.syncStateFromForm(
            form
          );
          this.executeSearch();
        }
      );
      // ------------------------------------------------------
      // Clear
      // ------------------------------------------------------
      document.addEventListener(
        "click",
        event => {
          const clearButton =
            event.target.closest(
              "[data-ghar-clear-search]"
            );
          if (
            clearButton
          ) {
            this.clearFilters();
            return;
          }
          const loadMoreButton =
            event.target.closest(
              "[data-ghar-load-more-search]"
            );
          if (
            loadMoreButton
          ) {
            this.loadMore();
            return;
          }
          const retryButton =
            event.target.closest(
              "[data-ghar-retry-search]"
            );
          if (
            retryButton
          ) {
            this.executeSearch({
              force: true
            });
          }
        }
      );
      // ------------------------------------------------------
      // Browser back / forward
      // ------------------------------------------------------
      window.addEventListener(
        "popstate",
        () => {
          this.readURL();
          if (
            this.hasActiveSearch()
          ) {
            this.executeSearch();
          } else {
            this.state.results =
              [];
            this.state.total =
              0;
            this.renderResults();
            this.updateResultCount();
          }
        }
      );
    },
    // ========================================================
    // ABORT CURRENT REQUEST
    // ========================================================
    abortCurrentRequest() {
      if (
        this.state.requestController
      ) {
        try {
          this.state.requestController.abort();
        } catch {
          // Ignore abort errors.
        }
      }
      this.state.requestController =
        null;
    },
    // ========================================================
    // NORMALIZE SEARCH RESPONSE
    // ========================================================
    normalizeSearchResponse(
      data
    ) {
      const results =
        this.extractArray(
          data,
          [
            "properties",
            "results",
            "data"
          ]
        );
      const totalRaw =
        data?.total ??
        data?.count ??
        data?.pagination?.total ??
        data?.meta?.total;
      const total =
        Number.isFinite(
          Number(totalRaw)
        )
          ? Number(totalRaw)
          : (
              this.state.page === 1
                ? results.length
                : Math.max(
                    this.state.results.length,
                    results.length
                  )
            );
      const pagination =
        data?.pagination ||
        data?.meta ||
        {};
      const hasMore =
        typeof pagination.hasMore ===
          "boolean"
          ? pagination.hasMore
          : typeof data?.hasMore ===
              "boolean"
            ? data.hasMore
            : results.length >=
              this.config.pageSize;
      return {
        results:
          Array.isArray(results)
            ? results
            : [],
        total,
        hasMore
      };
    },
    // ========================================================
    // MERGE RESULTS
    // ========================================================
    mergeResults(
      current = [],
      incoming = []
    ) {
      const merged = [
        ...current
      ];
      const ids =
        new Set(
          current
            .map(
              item =>
                item?.id ??
                item?._id
            )
            .filter(Boolean)
            .map(
              String
            )
        );
      incoming.forEach(
        item => {
          const id =
            item?.id ??
            item?._id;
          if (
            id &&
            ids.has(
              String(id)
            )
          ) {
            return;
          }
          if (
            id
          ) {
            ids.add(
              String(id)
            );
          }
          merged.push(
            item
          );
        }
      );
      return merged;
    },
    // ========================================================
    // ARRAY EXTRACTION
    // ========================================================
    extractArray(
      data,
      keys = []
    ) {
      if (
        Array.isArray(data)
      ) {
        return data;
      }
      if (
        !data ||
        typeof data !==
          "object"
      ) {
        return [];
      }
      for (
        const key of keys
      ) {
        if (
          Array.isArray(
            data[key]
          )
        ) {
          return data[key];
        }
      }
      return [];
    },
    // ========================================================
    // ACTIVE SEARCH
    // ========================================================
    hasActiveSearch() {
      return Boolean(
        this.cleanText(
          this.state.query
        ) ||
        this.cleanText(
          this.state.location
        ) ||
        this.state.propertyType ||
        this.state.listingType ||
        this.state.purpose ||
        this.state.minPrice !== null ||
        this.state.maxPrice !== null ||
        this.state.bedrooms !== null ||
        this.state.bathrooms !== null ||
        this.state.minArea !== null ||
        this.state.maxArea !== null ||
        this.state.furnishing ||
        this.state.possession ||
        this.state.verification ||
        this.state.amenities.length
      );
    },
    // ========================================================
    // SEARCH FINGERPRINT
    // ========================================================
    createSearchFingerprint(
      search = {}
    ) {
      const data = {
        query:
          search.query || "",
        location:
          search.location || "",
        propertyType:
          search.propertyType || "",
        listingType:
          search.listingType || "",
        purpose:
          search.purpose || "",
        minPrice:
          search.minPrice ?? null,
        maxPrice:
          search.maxPrice ?? null,
        bedrooms:
          search.bedrooms ?? null,
        bathrooms:
          search.bathrooms ?? null,
        minArea:
          search.minArea ?? null,
        maxArea:
          search.maxArea ?? null,
        furnishing:
          search.furnishing || "",
        possession:
          search.possession || "",
        verification:
          search.verification || "",
        amenities:
          Array.isArray(
            search.amenities
          )
            ? [
                ...search.amenities
              ].sort()
            : []
      };
      return JSON.stringify(
        data
      );
    },
    // ========================================================
    // SEARCH LABEL
    // ========================================================
    getSearchLabel(
      search = {}
    ) {
      return (
        search.query ||
        search.location ||
        search.propertyType ||
        (
          search.minPrice ||
          search.maxPrice
        )
          ? (
              search.location ||
              search.propertyType ||
              "Property search"
            )
          : "Property search"
      );
    },
    // ========================================================
    // SUGGESTION VALUE
    // ========================================================
    getSuggestionValue(
      suggestion
    ) {
      if (
        typeof suggestion ===
        "string"
      ) {
        return this.cleanText(
          suggestion
        );
      }
      if (
        !suggestion ||
        typeof suggestion !==
          "object"
      ) {
        return "";
      }
      return this.cleanText(
        suggestion.label ||
        suggestion.name ||
        suggestion.location ||
        suggestion.query ||
        suggestion.value ||
        ""
      );
    },
    // ========================================================
    // BUILD LOCATION
    // ========================================================
    buildLocation(
      property = {}
    ) {
      return [
        property.city,
        property.state,
        property.pincode
      ]
        .filter(Boolean)
        .join(", ");
    },
    // ========================================================
    // IMAGE URL
    // ========================================================
    safeImageURL(
      value
    ) {
      const fallback =
        "/assets/images/properties/default.jpg";
      if (
        !value ||
        typeof value !==
          "string"
      ) {
        return fallback;
      }
      const trimmed =
        value.trim();
      if (
        !trimmed
      ) {
        return fallback;
      }
      // Permit normal application URLs.
      if (
        trimmed.startsWith("/") ||
        trimmed.startsWith("./") ||
        trimmed.startsWith("../") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("http://") ||
        trimmed.startsWith("data:image/")
      ) {
        return trimmed;
      }
      return fallback;
    },
    // ========================================================
    // PRICE FORMATTER
    // ========================================================
    formatPrice(
      price
    ) {
      if (
        price === null ||
        price === undefined ||
        price === ""
      ) {
        return "Price on request";
      }
      const numeric =
        Number(price);
      if (
        Number.isFinite(
          numeric
        )
      ) {
        return new Intl.NumberFormat(
          "en-IN",
          {
            style:
              "currency",
            currency:
              "INR",
            maximumFractionDigits:
              0
          }
        ).format(
          numeric
        );
      }
      return String(
        price
      );
    },
    // ========================================================
    // NUMBER
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
        Number(
          value
        );
      return Number.isFinite(
        number
      )
        ? number
        : null;
    },
    // ========================================================
    // TEXT CLEANER
    // ========================================================
    cleanText(
      value
    ) {
      return String(
        value ?? ""
      )
        .trim()
        .replace(
          /\s+/g,
          " "
        );
    },
    // ========================================================
    // ERROR MESSAGE
    // ========================================================
    getUserErrorMessage(
      error
    ) {
      if (
        error?.status ===
        401
      ) {
        return "Please sign in to continue.";
      }
      if (
        error?.status ===
        403
      ) {
        return "You do not have permission to perform this search.";
      }
      if (
        error?.status ===
        429
      ) {
        return "Too many search requests. Please wait a moment and try again.";
      }
      if (
        error?.status >= 500
      ) {
        return "GHAR search is temporarily unavailable. Please try again shortly.";
      }
      return (
        error?.message ||
        "Unable to load properties. Please try again."
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
      this.state.debounceTimer =
        null;
      this.abortCurrentRequest();
      this.state.initialized =
        false;
      this.state.loading =
        false;
      this.state.searching =
        false;
    }
  };
  // ==========================================================
  // EXPOSE GLOBAL API
  // ==========================================================
  GHAR.Search =
    Search;
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
      () => {
        Search.init();
      },
      {
        once: true
      }
    );
  } else {
    Search.init();
  }
})(window, document);

Key fixes/upgrades

* Fixed the original searches is not defined bug in loadPopularSearches().
* Added request cancellation with AbortController.
* Prevented stale API responses from overwriting newer searches.
* Added proper pagination state and duplicate-result protection.
* Added response normalization for different backend response shapes.
* Added browser back/forward search-state support.
* Improved recent-search deduplication using a fingerprint.
* Added GHAR.Search while retaining window.GHAR_SEARCH for compatibility.
* Replaced dynamic property-card innerHTML with safer DOM construction.
* Added safer image URL handling and image fallback.
* Added http, https, relative paths, and data-image support.
* Added proper loading="lazy" and decoding="async".
* Added numeric filter normalization.
* Added amenity synchronization.
* Added Load More state handling.
* Added better HTTP error handling for 401 / 403 / 429 / 5xx.
* Added destroy() and request cleanup.
* Added hasActiveSearch(), mergeResults(), normalizeSearchResponse(), and reusable helpers.
* Preserved your existing data-ghar-* selectors, so your existing HTML does not need to be redesigned.
* The frontend search remains compatible with your planned /api/search backend.

One backend rule is important: don’t rely on this JavaScript to enforce property visibility, seller ownership, subscription restrictions, or authorization. Those checks belong in your GHAR Express middleware/service/database layer.