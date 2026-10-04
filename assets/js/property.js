// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/property.js
// Property listing, search, details, favourites & comparison
// ============================================================

"use strict";

(() => {
  // ----------------------------------------------------------
  // CONFIG
  // ----------------------------------------------------------

  const CONFIG = {
    apiBase:
      window.GHAR_CONFIG?.API_BASE_URL ||
      window.GHAR_CONFIG?.API_URL ||
      "/api",

    endpoints: {
      properties: "/properties",
      search: "/search",
      favourites: "/favourites",
      compare: "/compare",
      visits: "/visits",
      offers: "/offers"
    },

    storageKeys: {
      favourites: "ghar_favourites",
      compare: "ghar_compare",
      recentSearches: "ghar_property_searches",
      recentProperties: "ghar_recent_properties"
    },

    limits: {
      favourites: 100,
      compare: 4,
      recentProperties: 20,
      recentSearches: 20
    }
  };

  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const state = {
    properties: [],
    filteredProperties: [],
    currentProperty: null,

    filters: {},

    favourites: loadArray(
      CONFIG.storageKeys.favourites
    ),

    compare: loadArray(
      CONFIG.storageKeys.compare
    ),

    recentProperties: loadArray(
      CONFIG.storageKeys.recentProperties
    ),

    recentSearches: loadArray(
      CONFIG.storageKeys.recentSearches
    ),

    loading: false,
    error: null
  };

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  function loadArray(key) {
    try {
      const value = localStorage.getItem(key);

      if (!value) return [];

      const parsed = JSON.parse(value);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch (error) {
      console.warn(
        `[GHAR] Unable to read storage: ${key}`,
        error
      );

      return [];
    }
  }

  function saveArray(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch (error) {
      console.warn(
        `[GHAR] Unable to save storage: ${key}`,
        error
      );
    }
  }

  function getApiBase() {
    return (
      window.GHAR_CONFIG?.API_BASE_URL ||
      window.GHAR_CONFIG?.API_URL ||
      CONFIG.apiBase
    ).replace(/\/$/, "");
  }

  function buildUrl(pathname, params = {}) {
    const base = getApiBase();

    const url =
      `${base}${pathname}`;

    const query =
      new URLSearchParams();

    Object.entries(params).forEach(
      ([key, value]) => {

        if (
          value === undefined ||
          value === null ||
          value === ""
        ) {
          return;
        }

        if (
          Array.isArray(value)
        ) {
          value.forEach(item => {
            query.append(
              key,
              String(item)
            );
          });

          return;
        }

        query.set(
          key,
          String(value)
        );
      }
    );

    const queryString =
      query.toString();

    return queryString
      ? `${url}?${queryString}`
      : url;
  }

  async function request(
    pathname,
    options = {}
  ) {
    const url =
      pathname.startsWith("http")
        ? pathname
        : buildUrl(
            pathname,
            options.params || {}
          );

    const requestOptions = {
      method:
        options.method || "GET",

      credentials:
        options.credentials || "include",

      headers: {
        Accept:
          "application/json",

        ...(options.body
          ? {
              "Content-Type":
                "application/json"
            }
          : {}),

        ...(options.headers || {})
      }
    };

    if (options.body !== undefined) {
      requestOptions.body =
        typeof options.body === "string"
          ? options.body
          : JSON.stringify(
              options.body
            );
    }

    const response =
      await fetch(
        url,
        requestOptions
      );

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    const data =
      contentType.includes(
        "application/json"
      )
        ? await response.json()
        : await response.text();

    if (!response.ok) {
      const error =
        new Error(
          data?.error ||
          data?.message ||
          `Request failed: ${response.status}`
        );

      error.status =
        response.status;

      error.data = data;

      throw error;
    }

    return data;
  }

  function normalizeProperty(property) {
    if (!property) return null;

    return {
      ...property,

      id:
        property.id ??
        property.property_id ??
        property.propertyId,

      title:
        property.title ||
        property.name ||
        "Untitled Property",

      propertyType:
        property.propertyType ||
        property.property_type ||
        "",

      listingType:
        property.listingType ||
        property.listing_type ||
        property.type ||
        "",

      status:
        property.status ||
        "ACTIVE",

      price:
        property.price ??
        property.expected_price ??
        property.expectedPrice ??
        null,

      rent:
        property.rent ??
        property.monthly_rent ??
        property.monthlyRent ??
        null,

      city:
        property.city ||
        "",

      state:
        property.state ||
        "",

      locality:
        property.locality ||
        property.area ||
        "",

      bedrooms:
        property.bedrooms ??
        property.bhk ??
        null,

      bathrooms:
        property.bathrooms ??
        null,

      area:
        property.area ??
        property.area_sqft ??
        property.areaSqft ??
        null,

      images:
        Array.isArray(
          property.images
        )
          ? property.images
          : property.image
            ? [property.image]
            : [],

      verified:
        Boolean(
          property.verified ||
          property.is_verified ||
          property.property_verified
        )
    };
  }

  function propertyId(property) {
    if (
      property &&
      typeof property === "object"
    ) {
      return (
        property.id ??
        property.property_id ??
        property.propertyId
      );
    }

    return property;
  }

  function findProperty(id) {
    return (
      state.properties.find(
        property =>
          String(
            propertyId(property)
          ) === String(id)
      ) ||
      null
    );
  }

  // ----------------------------------------------------------
  // PROPERTY API
  // ----------------------------------------------------------

  async function getProperties(
    params = {}
  ) {
    state.loading = true;
    state.error = null;

    try {
      const data =
        await request(
          CONFIG.endpoints.properties,
          {
            params
          }
        );

      const raw =
        Array.isArray(data)
          ? data
          : data.properties ||
            data.data ||
            data.results ||
            [];

      state.properties =
        raw.map(
          normalizeProperty
        );

      state.filteredProperties =
        [...state.properties];

      return state.properties;
    } catch (error) {
      state.error = error;

      console.error(
        "[GHAR] Property loading failed:",
        error
      );

      throw error;
    } finally {
      state.loading = false;
    }
  }

  async function getProperty(
    id
  ) {
    if (!id) {
      throw new Error(
        "Property ID is required."
      );
    }

    try {
      const data =
        await request(
          `${CONFIG.endpoints.properties}/${encodeURIComponent(
            id
          )}`
        );

      const property =
        normalizeProperty(
          data.property ||
          data.data ||
          data
        );

      state.currentProperty =
        property;

      if (property) {
        addRecentProperty(
          property
        );
      }

      return property;
    } catch (error) {
      console.error(
        "[GHAR] Property details failed:",
        error
      );

      throw error;
    }
  }

  async function searchProperties(
    params = {}
  ) {
    state.loading = true;
    state.error = null;

    try {
      const data =
        await request(
          CONFIG.endpoints.search,
          {
            params
          }
        );

      const raw =
        Array.isArray(data)
          ? data
          : data.properties ||
            data.results ||
            data.data ||
            [];

      state.filteredProperties =
        raw.map(
          normalizeProperty
        );

      state.filters =
        { ...params };

      saveSearch(
        params
      );

      return state.filteredProperties;
    } catch (error) {
      state.error = error;

      console.error(
        "[GHAR] Property search failed:",
        error
      );

      throw error;
    } finally {
      state.loading = false;
    }
  }

  // ----------------------------------------------------------
  // LOCAL FILTERING
  // ----------------------------------------------------------

  function filterProperties(
    properties,
    filters = {}
  ) {
    const source =
      Array.isArray(properties)
        ? properties
        : state.properties;

    const result =
      source.filter(
        property => {

          if (
            filters.city &&
            String(
              property.city
            ).toLowerCase() !==
              String(
                filters.city
              ).toLowerCase()
          ) {
            return false;
          }

          if (
            filters.locality &&
            !String(
              property.locality
            )
              .toLowerCase()
              .includes(
                String(
                  filters.locality
                ).toLowerCase()
              )
          ) {
            return false;
          }

          if (
            filters.propertyType &&
            String(
              property.propertyType
            ).toLowerCase() !==
              String(
                filters.propertyType
              ).toLowerCase()
          ) {
            return false;
          }

          if (
            filters.listingType &&
            String(
              property.listingType
            ).toLowerCase() !==
              String(
                filters.listingType
              ).toLowerCase()
          ) {
            return false;
          }

          if (
            filters.bedrooms !==
              undefined &&
            filters.bedrooms !== ""
          ) {
            if (
              Number(
                property.bedrooms
              ) <
              Number(
                filters.bedrooms
              )
            ) {
              return false;
            }
          }

          if (
            filters.minPrice !==
              undefined &&
            filters.minPrice !== ""
          ) {
            const price =
              Number(
                property.price ??
                property.rent ??
                0
              );

            if (
              price <
              Number(
                filters.minPrice
              )
            ) {
              return false;
            }
          }

          if (
            filters.maxPrice !==
              undefined &&
            filters.maxPrice !== ""
          ) {
            const price =
              Number(
                property.price ??
                property.rent ??
                0
              );

            if (
              price >
              Number(
                filters.maxPrice
              )
            ) {
              return false;
            }
          }

          if (
            filters.verified === true &&
            !property.verified
          ) {
            return false;
          }

          return true;
        }
      );

    state.filteredProperties =
      result;

    return result;
  }

  // ----------------------------------------------------------
  // FAVOURITES
  // ----------------------------------------------------------

  function isFavourite(id) {
    return state.favourites.some(
      item =>
        String(
          propertyId(item)
        ) === String(id)
    );
  }

  function addFavourite(
    property
  ) {
    const id =
      propertyId(property);

    if (!id) return false;

    if (
      isFavourite(id)
    ) {
      return true;
    }

    state.favourites.push(
      normalizeProperty(
        property
      )
    );

    if (
      state.favourites.length >
      CONFIG.limits.favourites
    ) {
      state.favourites =
        state.favourites.slice(
          -CONFIG.limits.favourites
        );
    }

    saveArray(
      CONFIG.storageKeys.favourites,
      state.favourites
    );

    dispatch(
      "ghar:favourite-added",
      {
        property:
          normalizeProperty(
            property
          )
      }
    );

    return true;
  }

  function removeFavourite(
    id
  ) {
    const before =
      state.favourites.length;

    state.favourites =
      state.favourites.filter(
        item =>
          String(
            propertyId(item)
          ) !== String(id)
      );

    saveArray(
      CONFIG.storageKeys.favourites,
      state.favourites
    );

    const removed =
      before !==
      state.favourites.length;

    if (removed) {
      dispatch(
        "ghar:favourite-removed",
        {
          propertyId:
            id
        }
      );
    }

    return removed;
  }

  function toggleFavourite(
    property
  ) {
    const id =
      propertyId(property);

    if (
      isFavourite(id)
    ) {
      removeFavourite(id);
      return false;
    }

    addFavourite(property);
    return true;
  }

  function getFavourites() {
    return [
      ...state.favourites
    ];
  }

  // ----------------------------------------------------------
  // COMPARE
  // ----------------------------------------------------------

  function isInCompare(id) {
    return state.compare.some(
      item =>
        String(
          propertyId(item)
        ) === String(id)
    );
  }

  function addToCompare(
    property
  ) {
    const id =
      propertyId(property);

    if (!id) return false;

    if (
      isInCompare(id)
    ) {
      return true;
    }

    if (
      state.compare.length >=
      CONFIG.limits.compare
    ) {
      dispatch(
        "ghar:compare-limit",
        {
          limit:
            CONFIG.limits.compare
        }
      );

      return false;
    }

    state.compare.push(
      normalizeProperty(
        property
      )
    );

    saveArray(
      CONFIG.storageKeys.compare,
      state.compare
    );

    dispatch(
      "ghar:compare-added",
      {
        property:
          normalizeProperty(
            property
          )
      }
    );

    return true;
  }

  function removeFromCompare(
    id
  ) {
    const before =
      state.compare.length;

    state.compare =
      state.compare.filter(
        item =>
          String(
            propertyId(item)
          ) !== String(id)
      );

    saveArray(
      CONFIG.storageKeys.compare,
      state.compare
    );

    return (
      before !==
      state.compare.length
    );
  }

  function clearCompare() {
    state.compare = [];

    saveArray(
      CONFIG.storageKeys.compare,
      []
    );
  }

  function getCompare() {
    return [
      ...state.compare
    ];
  }

  // ----------------------------------------------------------
  // RECENT PROPERTIES
  // ----------------------------------------------------------

  function addRecentProperty(
    property
  ) {
    const normalized =
      normalizeProperty(
        property
      );

    const id =
      propertyId(normalized);

    if (!id) return;

    state.recentProperties =
      state.recentProperties.filter(
        item =>
          String(
            propertyId(item)
          ) !== String(id)
      );

    state.recentProperties.unshift(
      normalized
    );

    state.recentProperties =
      state.recentProperties.slice(
        0,
        CONFIG.limits.recentProperties
      );

    saveArray(
      CONFIG.storageKeys.recentProperties,
      state.recentProperties
    );
  }

  function getRecentProperties() {
    return [
      ...state.recentProperties
    ];
  }

  // ----------------------------------------------------------
  // RECENT SEARCHES
  // ----------------------------------------------------------

  function saveSearch(
    filters
  ) {
    if (
      !filters ||
      typeof filters !== "object"
    ) {
      return;
    }

    const search =
      {
        ...filters,
        savedAt:
          new Date().toISOString()
      };

    state.recentSearches =
      state.recentSearches.filter(
        item =>
          JSON.stringify(
            removeTimestamp(item)
          ) !==
          JSON.stringify(
            removeTimestamp(search)
          )
      );

    state.recentSearches.unshift(
      search
    );

    state.recentSearches =
      state.recentSearches.slice(
        0,
        CONFIG.limits.recentSearches
      );

    saveArray(
      CONFIG.storageKeys.recentSearches,
      state.recentSearches
    );
  }

  function removeTimestamp(
    object
  ) {
    const copy =
      {
        ...object
      };

    delete copy.savedAt;

    return copy;
  }

  function getRecentSearches() {
    return [
      ...state.recentSearches
    ];
  }

  // ----------------------------------------------------------
  // PROPERTY ACTIONS
  // ----------------------------------------------------------

  async function scheduleVisit(
    propertyIdValue,
    payload
  ) {
    return request(
      CONFIG.endpoints.visits,
      {
        method: "POST",

        body: {
          propertyId:
            propertyIdValue,

          ...payload
        }
      }
    );
  }

  async function submitOffer(
    propertyIdValue,
    payload
  ) {
    return request(
      CONFIG.endpoints.offers,
      {
        method: "POST",

        body: {
          propertyId:
            propertyIdValue,

          ...payload
        }
      }
    );
  }

  // ----------------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------------

  function formatPrice(
    value
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "Price on request";
    }

    const number =
      Number(value);

    if (
      Number.isNaN(number)
    ) {
      return String(value);
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
      return `₹${number.toLocaleString(
        "en-IN"
      )}`;
    }
  }

  function imageUrl(
    property,
    index = 0
  ) {
    const image =
      property?.images?.[index];

    if (!image) {
      return (
        "/assets/images/properties/default-property.jpg"
      );
    }

    if (
      /^https?:\/\//i.test(
        image
      ) ||
      image.startsWith("/")
    ) {
      return image;
    }

    return `/${image.replace(
      /^\/+/,
      ""
    )}`;
  }

  function createPropertyCard(
    property
  ) {
    const item =
      normalizeProperty(
        property
      );

    const id =
      propertyId(item);

    const favourite =
      isFavourite(id);

    const compared =
      isInCompare(id);

    const article =
      document.createElement(
        "article"
      );

    article.className =
      "property-card";

    article.dataset.propertyId =
      id || "";

    article.innerHTML = `
      <div class="property-card__image">
        <img
          src="${escapeHtml(
            imageUrl(item)
          )}"
          alt="${escapeHtml(
            item.title
          )}"
          loading="lazy"
        >

        ${
          item.verified
            ? `
              <span class="property-card__verified">
                Verified
              </span>
            `
            : ""
        }

        <button
          type="button"
          class="property-card__favourite ${
            favourite
              ? "is-active"
              : ""
          }"
          data-property-action="favourite"
          data-property-id="${escapeHtml(
            id
          )}"
          aria-label="${
            favourite
              ? "Remove from favourites"
              : "Add to favourites"
          }"
        >
          ${favourite ? "♥" : "♡"}
        </button>
      </div>

      <div class="property-card__body">

        <h3 class="property-card__title">
          ${escapeHtml(
            item.title
          )}
        </h3>

        <div class="property-card__location">
          ${escapeHtml(
            [
              item.locality,
              item.city,
              item.state
            ]
              .filter(Boolean)
              .join(", ")
          )}
        </div>

        <div class="property-card__meta">
          ${
            item.bedrooms
              ? `<span>${escapeHtml(
                  item.bedrooms
                )} BHK</span>`
              : ""
          }

          ${
            item.bathrooms
              ? `<span>${escapeHtml(
                  item.bathrooms
                )} Bath</span>`
              : ""
          }

          ${
            item.area
              ? `<span>${escapeHtml(
                  item.area
                )} sq.ft.</span>`
              : ""
          }
        </div>

        <div class="property-card__price">
          ${formatPrice(
            item.price ??
              item.rent
          )}
        </div>

        <div class="property-card__actions">

          <a
            href="/property-details.html?id=${encodeURIComponent(
              id
            )}"
            class="property-card__view"
          >
            View Property
          </a>

          <button
            type="button"
            data-property-action="compare"
            data-property-id="${escapeHtml(
              id
            )}"
            class="${
              compared
                ? "is-active"
                : ""
            }"
          >
            ${
              compared
                ? "Compared"
                : "Compare"
            }
          </button>

        </div>

      </div>
    `;

    return article;
  }

  function renderProperties(
    container,
    properties =
      state.filteredProperties.length
        ? state.filteredProperties
        : state.properties
  ) {
    if (
      typeof container ===
      "string"
    ) {
      container =
        document.querySelector(
          container
        );
    }

    if (!container) {
      return;
    }

    container.innerHTML = "";

    if (
      !properties ||
      properties.length === 0
    ) {
      container.innerHTML = `
        <div class="property-empty">
          <h3>No properties found</h3>
          <p>
            Try changing your search or filters.
          </p>
        </div>
      `;

      return;
    }

    const fragment =
      document.createDocumentFragment();

    properties.forEach(
      property => {
        fragment.appendChild(
          createPropertyCard(
            property
          )
        );
      }
    );

    container.appendChild(
      fragment
    );
  }

  // ----------------------------------------------------------
  // EVENTS
  // ----------------------------------------------------------

  function dispatch(
    name,
    detail = {}
  ) {
    document.dispatchEvent(
      new CustomEvent(
        name,
        {
          detail
        }
      )
    );
  }

  function bindEvents() {
    document.addEventListener(
      "click",
      event => {

        const target =
          event.target.closest(
            "[data-property-action]"
          );

        if (!target) return;

        const action =
          target.dataset
            .propertyAction;

        const id =
          target.dataset
            .propertyId;

        const property =
          findProperty(id) ||
          state.filteredProperties.find(
            item =>
              String(
                propertyId(item)
              ) === String(id)
          );

        if (!property) {
          return;
        }

        if (
          action ===
          "favourite"
        ) {
          const active =
            toggleFavourite(
              property
            );

          target.classList.toggle(
            "is-active",
            active
          );

          target.textContent =
            active
              ? "♥"
              : "♡";

          return;
        }

        if (
          action ===
          "compare"
        ) {
          if (
            isInCompare(id)
          ) {
            removeFromCompare(
              id
            );

            target.classList.remove(
              "is-active"
            );

            target.textContent =
              "Compare";
          } else {
            const added =
              addToCompare(
                property
              );

            if (added) {
              target.classList.add(
                "is-active"
              );

              target.textContent =
                "Compared";
            }
          }
        }
      }
    );
  }

  // ----------------------------------------------------------
  // INITIALIZE
  // ----------------------------------------------------------

  function init() {
    bindEvents();

    document.dispatchEvent(
      new CustomEvent(
        "ghar:property-ready"
      )
    );
  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  window.GHAR_PROPERTY = {
    state,

    config:
      CONFIG,

    init,

    request,

    getProperties,

    getProperty,

    searchProperties,

    filterProperties,

    findProperty,

    normalizeProperty,

    propertyId,

    formatPrice,

    imageUrl,

    renderProperties,

    createPropertyCard,

    isFavourite,

    addFavourite,

    removeFavourite,

    toggleFavourite,

    getFavourites,

    isInCompare,

    addToCompare,

    removeFromCompare,

    clearCompare,

    getCompare,

    addRecentProperty,

    getRecentProperties,

    saveSearch,

    getRecentSearches,

    scheduleVisit,

    submitOffer
  };

  // Compatibility aliases
  window.GHAR_PROPERTY_MANAGER =
    window.GHAR_PROPERTY;

  // Start automatically
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

})();