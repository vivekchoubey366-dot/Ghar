// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/compare.js
// Property Comparison Engine
// ============================================================

"use strict";

(function (window, document) {

  // ==========================================================
  // GHAR NAMESPACE
  // ==========================================================

  const GHAR =
    window.GHAR ||
    {};

  const CONFIG =
    GHAR.config ||
    GHAR.configs ||
    {};

  const CONSTANTS =
    GHAR.constants ||
    {};

  const STORAGE =
    GHAR.storage ||
    {};

  const API =
    GHAR.api ||
    {};

  const CORE =
    GHAR.core ||
    {};

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const STORAGE_KEY =
    CONSTANTS.STORAGE_KEYS?.COMPARE ||
    "ghar_compare_properties";

  const MAX_COMPARE =
    Number(
      CONSTANTS.COMPARE?.MAX_ITEMS ||
      CONFIG.compare?.maxItems ||
      4
    );

  const API_BASE =
    CONFIG.apiBaseUrl ||
    CONFIG.API_BASE_URL ||
    "/api";

  const COMPARE_CONFIG = {

    storageKey:
      STORAGE_KEY,

    maxItems:
      Number.isFinite(MAX_COMPARE) &&
      MAX_COMPARE > 0
        ? MAX_COMPARE
        : 4,

    comparePage:
      CONFIG.routes?.compare ||
      "/compare.html",

    propertyEndpoint:
      "/properties",

    currency:
      "INR",

    locale:
      "en-IN",

    storageVersion:
      1

  };

  // ==========================================================
  // STATE
  // ==========================================================

  const state = {

    initialized:
      false,

    loading:
      false,

    properties:
      [],

    error:
      null,

    lastUpdated:
      null

  };

  // ==========================================================
  // GENERAL HELPERS
  // ==========================================================

  function isObject(value) {

    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );

  }

  function isFunction(value) {

    return (
      typeof value === "function"
    );

  }

  function normalizeId(property) {

    if (
      property === null ||
      property === undefined
    ) {

      return null;

    }

    if (
      typeof property === "string" ||
      typeof property === "number"
    ) {

      const id =
        String(property).trim();

      return id || null;

    }

    if (
      !isObject(property)
    ) {

      return null;

    }

    const id =
      property.id ??
      property.property_id ??
      property.propertyId ??
      property.slug ??
      null;

    if (
      id === null ||
      id === undefined
    ) {

      return null;

    }

    const normalized =
      String(id).trim();

    return normalized || null;

  }

  function cloneProperty(property) {

    if (
      !property ||
      !isObject(property)
    ) {

      return null;

    }

    try {

      return JSON.parse(
        JSON.stringify(property)
      );

    } catch (_) {

      return {
        ...property
      };

    }

  }

  function normalizeProperty(property) {

    if (
      !property ||
      !isObject(property)
    ) {

      return null;

    }

    const id =
      normalizeId(property);

    if (!id) {

      return null;

    }

    return {
      ...cloneProperty(property),
      id
    };

  }

  function normalizeProperties(
    properties
  ) {

    if (
      !Array.isArray(properties)
    ) {

      return [];

    }

    const result = [];
    const ids = new Set();

    properties.forEach(
      property => {

        const normalized =
          normalizeProperty(
            property
          );

        if (!normalized) {
          return;
        }

        const id =
          normalizeId(
            normalized
          );

        if (
          ids.has(id)
        ) {

          return;

        }

        ids.add(id);

        result.push(
          normalized
        );

      }
    );

    return result.slice(
      0,
      COMPARE_CONFIG.maxItems
    );

  }

  // ==========================================================
  // EVENT SYSTEM
  // ==========================================================

  function emit(
    eventName,
    detail = {}
  ) {

    const payload = {

      ...detail,

      count:
        state.properties.length,

      properties:
        getCompareList(),

      timestamp:
        Date.now()

    };

    try {

      document.dispatchEvent(
        new CustomEvent(
          `ghar:${eventName}`,
          {
            detail:
              payload
          }
        )
      );

    } catch (error) {

      console.warn(
        "[GHAR COMPARE] Event dispatch failed:",
        error
      );

    }

    if (
      CORE &&
      isFunction(CORE.emit)
    ) {

      try {

        CORE.emit(
          eventName,
          payload
        );

      } catch (_) {}

    }

  }

  // ==========================================================
  // STORAGE
  // ==========================================================

  function storageGet(key) {

    try {

      if (
        STORAGE &&
        isFunction(STORAGE.get)
      ) {

        return STORAGE.get(
          key
        );

      }

      return localStorage.getItem(
        key
      );

    } catch (error) {

      console.warn(
        "[GHAR COMPARE] Storage read failed:",
        error
      );

      return null;

    }

  }

  function storageSet(
    key,
    value
  ) {

    try {

      if (
        STORAGE &&
        isFunction(STORAGE.set)
      ) {

        STORAGE.set(
          key,
          value
        );

        return true;

      }

      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

      return true;

    } catch (error) {

      console.warn(
        "[GHAR COMPARE] Storage write failed:",
        error
      );

      return false;

    }

  }

  function storageRemove(key) {

    try {

      if (
        STORAGE &&
        isFunction(STORAGE.remove)
      ) {

        STORAGE.remove(
          key
        );

        return true;

      }

      localStorage.removeItem(
        key
      );

      return true;

    } catch (error) {

      console.warn(
        "[GHAR COMPARE] Storage remove failed:",
        error
      );

      return false;

    }

  }

  function parseStoredValue(
    value
  ) {

    if (
      !value
    ) {

      return [];

    }

    if (
      Array.isArray(value)
    ) {

      return value;

    }

    if (
      isObject(value)
    ) {

      if (
        Array.isArray(
          value.properties
        )
      ) {

        return value.properties;

      }

      return [];

    }

    if (
      typeof value !== "string"
    ) {

      return [];

    }

    try {

      const parsed =
        JSON.parse(
          value
        );

      if (
        Array.isArray(parsed)
      ) {

        return parsed;

      }

      if (
        isObject(parsed) &&
        Array.isArray(
          parsed.properties
        )
      ) {

        return parsed.properties;

      }

    } catch (error) {

      console.warn(
        "[GHAR COMPARE] Invalid stored comparison data."
      );

    }

    return [];

  }

  function getStorage() {

    const saved =
      storageGet(
        COMPARE_CONFIG.storageKey
      );

    return normalizeProperties(
      parseStoredValue(saved)
    );

  }

  function saveStorage(
    properties
  ) {

    const normalized =
      normalizeProperties(
        properties
      );

    return storageSet(
      COMPARE_CONFIG.storageKey,
      normalized
    );

  }

  // ==========================================================
  // STATE HELPERS
  // ==========================================================

  function updateState(
    properties
  ) {

    state.properties =
      normalizeProperties(
        properties
      );

    state.lastUpdated =
      Date.now();

    return state.properties;

  }

  function getCompareList() {

    return state.properties.map(
      property =>
        cloneProperty(property)
    );

  }

  function getCount() {

    return state.properties.length;

  }

  function getState() {

    return {

      initialized:
        state.initialized,

      loading:
        state.loading,

      error:
        state.error,

      count:
        state.properties.length,

      max:
        COMPARE_CONFIG.maxItems,

      lastUpdated:
        state.lastUpdated,

      properties:
        getCompareList()

    };

  }

  // ==========================================================
  // PROPERTY LOOKUP
  // ==========================================================

  function getPropertyById(
    propertyId
  ) {

    const id =
      normalizeId(
        propertyId
      );

    if (!id) {
      return null;
    }

    return (
      state.properties.find(
        property =>
          normalizeId(property) === id
      ) ||
      null
    );

  }

  // ==========================================================
  // CHECK COMPARE STATUS
  // ==========================================================

  function isCompared(
    propertyId
  ) {

    const id =
      normalizeId(
        propertyId
      );

    if (!id) {
      return false;
    }

    return state.properties.some(
      property =>
        normalizeId(property) === id
    );

  }

  // ==========================================================
  // INITIALIZATION
  // ==========================================================

  function init() {

    if (
      state.initialized
    ) {

      return getState();

    }

    updateState(
      getStorage()
    );

    state.initialized =
      true;

    renderCompareCount();

    updateButtons();

    bindEvents();

    emit(
      "compare:ready",
      {
        source:
          "initialization"
      }
    );

    if (
      document.querySelector(
        "[data-compare-container]"
      )
    ) {

      render();

    }

    return getState();

  }

  // ==========================================================
  // ADD PROPERTY
  // ==========================================================

  function add(
    property
  ) {

    const normalized =
      normalizeProperty(
        property
      );

    if (!normalized) {

      const result = {

        ok:
          false,

        error:
          "A valid property with an ID is required."

      };

      state.error =
        result.error;

      emit(
        "compare:error",
        result
      );

      return result;

    }

    const id =
      normalizeId(
        normalized
      );

    if (
      isCompared(id)
    ) {

      return {

        ok:
          true,

        alreadyAdded:
          true,

        property:
          cloneProperty(
            getPropertyById(id)
          ),

        properties:
          getCompareList()

      };

    }

    if (
      state.properties.length >=
      COMPARE_CONFIG.maxItems
    ) {

      const result = {

        ok:
          false,

        limitReached:
          true,

        max:
          COMPARE_CONFIG.maxItems,

        error:
          `You can compare up to ${COMPARE_CONFIG.maxItems} properties.`

      };

      emit(
        "compare:limit",
        result
      );

      return result;

    }

    state.error =
      null;

    state.properties.push(
      normalized
    );

    saveStorage(
      state.properties
    );

    state.lastUpdated =
      Date.now();

    renderCompareCount();

    updateButtons();

    emit(
      "compare:added",
      {
        property:
          cloneProperty(
            normalized
          )
      }
    );

    render();

    return {

      ok:
        true,

      property:
        cloneProperty(
          normalized
        ),

      properties:
        getCompareList()

    };

  }

  // ==========================================================
  // REMOVE PROPERTY
  // ==========================================================

  function remove(
    propertyId
  ) {

    const id =
      normalizeId(
        propertyId
      );

    if (!id) {

      return {

        ok:
          false,

        error:
          "Property ID is required."

      };

    }

    const index =
      state.properties.findIndex(
        property =>
          normalizeId(property) === id
      );

    if (
      index === -1
    ) {

      return {

        ok:
          false,

        error:
          "Property is not in the comparison list."

      };

    }

    const removed =
      state.properties.splice(
        index,
        1
      )[0];

    saveStorage(
      state.properties
    );

    state.lastUpdated =
      Date.now();

    renderCompareCount();

    updateButtons();

    emit(
      "compare:removed",
      {
        property:
          cloneProperty(
            removed
          )
      }
    );

    render();

    return {

      ok:
        true,

      property:
        cloneProperty(
          removed
        ),

      properties:
        getCompareList()

    };

  }

  // ==========================================================
  // TOGGLE PROPERTY
  // ==========================================================

  function toggle(
    property
  ) {

    const id =
      normalizeId(
        property
      );

    if (!id) {

      return {

        ok:
          false,

        error:
          "Property ID is required."

      };

    }

    if (
      isCompared(id)
    ) {

      return remove(id);

    }

    return add(
      property
    );

  }

  // ==========================================================
  // CLEAR COMPARISON
  // ==========================================================

  function clear() {

    const previous =
      getCompareList();

    updateState([]);

    saveStorage([]);

    renderCompareCount();

    updateButtons();

    emit(
      "compare:cleared",
      {
        previous
      }
    );

    render();

    return {

      ok:
        true,

      properties:
        []

    };

  }

  // ==========================================================
  // PROPERTY VALUE RESOLVER
  // ==========================================================

  function value(
    property,
    keys
  ) {

    if (
      !property ||
      !Array.isArray(keys)
    ) {

      return null;

    }

    for (
      const key of keys
    ) {

      const value =
        property[key];

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {

        return value;

      }

    }

    return null;

  }

  // ==========================================================
  // FORMAT VALUE
  // ==========================================================

  function formatValue(
    input,
    type = "text"
  ) {

    if (
      input === null ||
      input === undefined ||
      input === ""
    ) {

      return "--";

    }

    if (
      type === "currency"
    ) {

      const number =
        Number(
          String(input)
            .replace(/,/g, "")
            .replace(/[^\d.-]/g, "")
        );

      if (
        Number.isNaN(number)
      ) {

        return String(input);

      }

      try {

        return new Intl.NumberFormat(
          COMPARE_CONFIG.locale,
          {
            style:
              "currency",

            currency:
              COMPARE_CONFIG.currency,

            maximumFractionDigits:
              0
          }
        ).format(number);

      } catch (_) {

        return `₹${number.toLocaleString(
          COMPARE_CONFIG.locale
        )}`;

      }

    }

    if (
      type === "number"
    ) {

      const number =
        Number(input);

      if (
        Number.isNaN(number)
      ) {

        return String(input);

      }

      return new Intl.NumberFormat(
        COMPARE_CONFIG.locale
      ).format(number);

    }

    if (
      type === "boolean"
    ) {

      return input
        ? "Yes"
        : "No";

    }

    if (
      Array.isArray(input)
    ) {

      return input.join(
        ", "
      );

    }

    if (
      isObject(input)
    ) {

      return (
        input.name ||
        input.label ||
        input.value ||
        "--"
      );

    }

    return String(input);

  }

  // ==========================================================
  // COMPARISON ROW DEFINITIONS
  // ==========================================================

  const rows = [

    {
      key:
        "price",

      label:
        "Price",

      keys:
        [
          "price",
          "property_price",
          "amount",
          "salePrice",
          "rent"
        ],

      type:
        "currency"
    },

    {
      key:
        "propertyType",

      label:
        "Property Type",

      keys:
        [
          "propertyType",
          "property_type",
          "type"
        ]
    },

    {
      key:
        "listingType",

      label:
        "Listing Type",

      keys:
        [
          "listingType",
          "listing_type",
          "transactionType",
          "listing"
        ]
    },

    {
      key:
        "bhk",

      label:
        "BHK",

      keys:
        [
          "bhk",
          "bedrooms",
          "bedroomCount"
        ],

      type:
        "number"
    },

    {
      key:
        "bathrooms",

      label:
        "Bathrooms",

      keys:
        [
          "bathrooms",
          "bathroom",
          "baths",
          "bathroomCount"
        ],

      type:
        "number"
    },

    {
      key:
        "area",

      label:
        "Area",

      keys:
        [
          "area",
          "builtUpArea",
          "built_up_area",
          "superBuiltUpArea",
          "carpetArea",
          "plotArea"
        ],

      type:
        "number"
    },

    {
      key:
        "areaUnit",

      label:
        "Area Unit",

      keys:
        [
          "areaUnit",
          "area_unit",
          "unit"
        ]
    },

    {
      key:
        "location",

      label:
        "Location",

      keys:
        [
          "location",
          "address",
          "locality",
          "areaName"
        ]
    },

    {
      key:
        "city",

      label:
        "City",

      keys:
        [
          "city"
        ]
    },

    {
      key:
        "state",

      label:
        "State",

      keys:
        [
          "state",
          "stateName"
        ]
    },

    {
      key:
        "pincode",

      label:
        "Pincode",

      keys:
        [
          "pincode",
          "pin",
          "postalCode",
          "postal_code"
        ]
    },

    {
      key:
        "furnishing",

      label:
        "Furnishing",

      keys:
        [
          "furnishing",
          "furnishingStatus",
          "furnishing_status"
        ]
    },

    {
      key:
        "floor",

      label:
        "Floor",

      keys:
        [
          "floor",
          "floorNumber",
          "floor_number"
        ]
    },

    {
      key:
        "totalFloors",

      label:
        "Total Floors",

      keys:
        [
          "totalFloors",
          "total_floors"
        ],

      type:
        "number"
    },

    {
      key:
        "parking",

      label:
        "Parking",

      keys:
        [
          "parking",
          "parkingSpaces",
          "parking_spaces"
        ]
    },

    {
      key:
        "facing",

      label:
        "Facing",

      keys:
        [
          "facing",
          "direction"
        ]
    },

    {
      key:
        "age",

      label:
        "Property Age",

      keys:
        [
          "age",
          "propertyAge",
          "property_age"
        ]
    },

    {
      key:
        "verified",

      label:
        "Verified",

      keys:
        [
          "verified",
          "isVerified",
          "is_verified"
        ],

      type:
        "boolean"
    },

    {
      key:
        "status",

      label:
        "Status",

      keys:
        [
          "status",
          "propertyStatus"
        ]
    }

  ];

  // ==========================================================
  // DOM HELPERS
  // ==========================================================

  function createElement(
    tag,
    className = "",
    text = null
  ) {

    const element =
      document.createElement(
        tag
      );

    if (
      className
    ) {

      element.className =
        className;

    }

    if (
      text !== null &&
      text !== undefined
    ) {

      element.textContent =
        String(text);

    }

    return element;

  }

  // ==========================================================
  // RENDER
  // ==========================================================

  function render() {

    const containers =
      document.querySelectorAll(
        "[data-compare-container]"
      );

    if (
      !containers.length
    ) {

      return;

    }

    containers.forEach(
      container => {

        container.replaceChildren();

        if (
          !state.properties.length
        ) {

          renderEmptyState(
            container
          );

          return;

        }

        const wrapper =
          createElement(
            "div",
            "ghar-compare-table-wrapper"
          );

        wrapper.setAttribute(
          "role",
          "region"
        );

        wrapper.setAttribute(
          "aria-label",
          "Property comparison"
        );

        const table =
          createElement(
            "table",
            "ghar-compare-table"
          );

        table.appendChild(
          createHeader()
        );

        table.appendChild(
          createBody()
        );

        wrapper.appendChild(
          table
        );

        container.appendChild(
          wrapper
        );

      }
    );

    updateButtons();

  }

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  function renderEmptyState(
    container
  ) {

    const empty =
      createElement(
        "div",
        "ghar-compare-empty"
      );

    empty.setAttribute(
      "role",
      "status"
    );

    const title =
      createElement(
        "h3",
        "",
        "No properties selected"
      );

    const message =
      createElement(
        "p",
        "",
        "Add properties to compare pricing, specifications, location and features."
      );

    empty.append(
      title,
      message
    );

    container.appendChild(
      empty
    );

  }

  // ==========================================================
  // HEADER
  // ==========================================================

  function createHeader() {

    const thead =
      document.createElement(
        "thead"
      );

    const tr =
      document.createElement(
        "tr"
      );

    const feature =
      createElement(
        "th",
        "compare-feature",
        "Property"
      );

    feature.scope =
      "col";

    tr.appendChild(
      feature
    );

    state.properties.forEach(
      property => {

        const th =
          document.createElement(
            "th"
          );

        th.className =
          "compare-property";

        th.scope =
          "col";

        const title =
          value(
            property,
            [
              "title",
              "name",
              "propertyName",
              "property_name"
            ]
          ) ||
          "Property";

        const heading =
          createElement(
            "div",
            "compare-property-title",
            title
          );

        const remove =
          createElement(
            "button",
            "compare-remove",
            "Remove"
          );

        remove.type =
          "button";

        remove.dataset.compareRemove =
          normalizeId(
            property
          );

        remove.setAttribute(
          "aria-label",
          `Remove ${title} from comparison`
        );

        th.append(
          heading,
          remove
        );

        tr.appendChild(
          th
        );

      }
    );

    thead.appendChild(
      tr
    );

    return thead;

  }

  // ==========================================================
  // BODY
  // ==========================================================

  function createBody() {

    const tbody =
      document.createElement(
        "tbody"
      );

    rows.forEach(
      row => {

        const tr =
          document.createElement(
            "tr"
          );

        const label =
          createElement(
            "th",
            "compare-label",
            row.label
          );

        label.scope =
          "row";

        tr.appendChild(
          label
        );

        state.properties.forEach(
          property => {

            const raw =
              value(
                property,
                row.keys
              );

            const formatted =
              formatValue(
                raw,
                row.type
              );

            const td =
              createElement(
                "td",
                "",
                formatted
              );

            tr.appendChild(
              td
            );

          }
        );

        tbody.appendChild(
          tr
        );

      }
    );

    return tbody;

  }

  // ==========================================================
  // COMPARE COUNT
  // ==========================================================

  function renderCompareCount() {

    const count =
      state.properties.length;

    document
      .querySelectorAll(
        "[data-compare-count]"
      )
      .forEach(
        element => {

          element.textContent =
            String(count);

          element.hidden =
            count === 0;

          element.setAttribute(
            "aria-label",
            `${count} properties selected for comparison`
          );

        }
      );

  }

  // ==========================================================
  // COMPARE BUTTONS
  // ==========================================================

  function updateButtons() {

    document
      .querySelectorAll(
        "[data-compare-id]"
      )
      .forEach(
        button => {

          const id =
            normalizeId(
              button.dataset.compareId
            );

          if (!id) {
            return;
          }

          const active =
            isCompared(id);

          const disabled =
            !active &&
            state.properties.length >=
              COMPARE_CONFIG.maxItems;

          button.classList.toggle(
            "is-active",
            active
          );

          button.classList.toggle(
            "is-disabled",
            disabled
          );

          button.setAttribute(
            "aria-pressed",
            String(active)
          );

          button.setAttribute(
            "aria-disabled",
            String(disabled)
          );

          button.disabled =
            disabled;

          const label =
            active
              ? "Remove from comparison"
              : disabled
                ? "Comparison limit reached"
                : "Add to comparison";

          button.setAttribute(
            "aria-label",
            label
          );

          const text =
            button.querySelector(
              "[data-compare-label]"
            );

          if (text) {

            text.textContent =
              active
                ? "Compared"
                : "Compare";

          }

        }
      );

  }

  // ==========================================================
  // EVENT BINDINGS
  // ==========================================================

  let eventsBound =
    false;

  function bindEvents() {

    if (
      eventsBound
    ) {

      return;

    }

    eventsBound =
      true;

    document.addEventListener(
      "click",
      handleDocumentClick
    );

  }

  function handleDocumentClick(
    event
  ) {

    const compareButton =
      event.target.closest(
        "[data-compare-id]"
      );

    if (
      compareButton
    ) {

      event.preventDefault();

      if (
        compareButton.disabled
      ) {

        return;

      }

      const id =
        normalizeId(
          compareButton.dataset.compareId
        );

      let property =
        compareButton._gharProperty ||
        getPropertyById(id);

      if (!property) {

        property = {

          id,

          title:
            compareButton.dataset.compareTitle ||
            undefined,

          price:
            compareButton.dataset.comparePrice ||
            undefined

        };

      }

      toggle(
        property
      );

      return;

    }

    const removeButton =
      event.target.closest(
        "[data-compare-remove]"
      );

    if (
      removeButton
    ) {

      event.preventDefault();

      remove(
        removeButton.dataset.compareRemove
      );

      return;

    }

    const clearButton =
      event.target.closest(
        "[data-compare-clear]"
      );

    if (
      clearButton
    ) {

      event.preventDefault();

      clear();

      return;

    }

  }

  // ==========================================================
  // API PROPERTY REQUEST
  // ==========================================================

  async function fetchProperty(
    propertyId
  ) {

    const id =
      normalizeId(
        propertyId
      );

    if (!id) {

      throw new Error(
        "Property ID is required."
      );

    }

    state.loading =
      true;

    state.error =
      null;

    try {

      let response;

      const endpoint =
        `${COMPARE_CONFIG.propertyEndpoint}/${encodeURIComponent(id)}`;

      if (
        API &&
        isFunction(API.get)
      ) {

        response =
          await API.get(
            endpoint
          );

      } else {

        const request =
          await fetch(
            `${API_BASE}${endpoint}`,
            {
              method:
                "GET",

              credentials:
                "include",

              headers: {
                Accept:
                  "application/json"
              }
            }
          );

        const data =
          await request.json()
            .catch(
              () => ({})
            );

        if (
          !request.ok
        ) {

          throw new Error(
            data.error ||
            data.message ||
            `Unable to load property (${request.status}).`
          );

        }

        response =
          data;

      }

      const data =
        response?.data ||
        response;

      const property =
        data?.property ||
        data;

      const normalized =
        normalizeProperty(
          property
        );

      if (!normalized) {

        throw new Error(
          "The server returned an invalid property."
        );

      }

      return normalized;

    } catch (error) {

      state.error =
        error;

      emit(
        "compare:error",
        {
          error,
          propertyId:
            id
        }
      );

      throw error;

    } finally {

      state.loading =
        false;

    }

  }

  // ==========================================================
  // ADD BY PROPERTY ID
  // ==========================================================

  async function addById(
    propertyId
  ) {

    const id =
      normalizeId(
        propertyId
      );

    if (!id) {

      return {

        ok:
          false,

        error:
          "Property ID is required."

      };

    }

    if (
      isCompared(id)
    ) {

      return {

        ok:
          true,

        alreadyAdded:
          true,

        property:
          getPropertyById(id),

        properties:
          getCompareList()

      };

    }

    if (
      state.properties.length >=
      COMPARE_CONFIG.maxItems
    ) {

      return add(
        {
          id
        }
      );

    }

    try {

      const property =
        await fetchProperty(
          id
        );

      return add(
        property
      );

    } catch (error) {

      return {

        ok:
          false,

        error:
          error.message ||
          "Unable to add property."

      };

    }

  }

  // ==========================================================
  // COMPARISON URL
  // ==========================================================

  function getComparisonUrl(
    basePath =
      COMPARE_CONFIG.comparePage
  ) {

    const ids =
      state.properties
        .map(
          normalizeId
        )
        .filter(Boolean);

    if (!ids.length) {

      return basePath;

    }

    try {

      const url =
        new URL(
          basePath,
          window.location.origin
        );

      url.searchParams.set(
        "ids",
        ids.join(",")
      );

      return (
        url.pathname +
        url.search +
        url.hash
      );

    } catch (_) {

      return basePath;

    }

  }

  // ==========================================================
  // LOAD PROPERTIES FROM URL
  // ==========================================================

  async function loadFromUrl(
    options = {}
  ) {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const idsParameter =
      params.get(
        "ids"
      );

    if (!idsParameter) {

      return [];

    }

    const ids =
      idsParameter
        .split(",")
        .map(
          id =>
            id.trim()
        )
        .filter(Boolean)
        .filter(
          (id, index, array) =>
            array.indexOf(id) === index
        )
        .slice(
          0,
          COMPARE_CONFIG.maxItems
        );

    const loaded = [];

    for (
      const id of ids
    ) {

      try {

        const property =
          await fetchProperty(
            id
          );

        if (
          options.replace === true
        ) {

          const existing =
            getPropertyById(id);

          if (
            existing
          ) {

            continue;

          }

        }

        const result =
          add(
            property
          );

        if (
          result.ok &&
          result.property
        ) {

          loaded.push(
            result.property
          );

        }

      } catch (error) {

        console.warn(
          "[GHAR COMPARE] URL property load failed:",
          id,
          error
        );

      }

    }

    emit(
      "compare:url-loaded",
      {
        ids,
        loaded
      }
    );

    return loaded;

  }

  // ==========================================================
  // REFRESH STORED PROPERTIES
  // ==========================================================

  async function refreshProperties() {

    const properties =
      getCompareList();

    if (!properties.length) {

      return [];

    }

    state.loading =
      true;

    const refreshed = [];

    try {

      for (
        const property of properties
      ) {

        const id =
          normalizeId(
            property
          );

        try {

          const fresh =
            await fetchProperty(
              id
            );

          if (fresh) {

            refreshed.push(
              fresh
            );

          }

        } catch (error) {

          console.warn(
            "[GHAR COMPARE] Unable to refresh property:",
            id,
            error
          );

          refreshed.push(
            property
          );

        }

      }

      updateState(
        refreshed
      );

      saveStorage(
        state.properties
      );

      renderCompareCount();

      updateButtons();

      render();

      emit(
        "compare:refreshed",
        {
          properties:
            getCompareList()
        }
      );

      return getCompareList();

    } finally {

      state.loading =
        false;

    }

  }

  // ==========================================================
  // NAVIGATE TO COMPARISON
  // ==========================================================

  function openComparison(
    options = {}
  ) {

    const url =
      getComparisonUrl(
        options.basePath ||
        COMPARE_CONFIG.comparePage
      );

    if (
      CORE &&
      isFunction(
        CORE.navigate
      )
    ) {

      CORE.navigate(
        url,
        {
          replace:
            options.replace === true
        }
      );

      return url;

    }

    if (
      options.replace
    ) {

      window.location.replace(
        url
      );

    } else {

      window.location.href =
        url;

    }

    return url;

  }

  // ==========================================================
  // EXPORT / IMPORT
  // ==========================================================

  function exportData() {

    return {

      version:
        COMPARE_CONFIG.storageVersion,

      properties:
        getCompareList(),

      createdAt:
        Date.now()

    };

  }

  function importData(
    data,
    options = {}
  ) {

    const incoming =
      Array.isArray(data)
        ? data
        : data?.properties;

    if (
      !Array.isArray(incoming)
    ) {

      return {

        ok:
          false,

        error:
          "Invalid comparison data."

      };

    }

    const normalized =
      normalizeProperties(
        incoming
      );

    if (
      options.replace !== false
    ) {

      updateState(
        normalized
      );

    } else {

      updateState(
        [
          ...state.properties,
          ...normalized
        ]
      );

    }

    saveStorage(
      state.properties
    );

    renderCompareCount();

    updateButtons();

    render();

    emit(
      "compare:imported",
      {
        properties:
          getCompareList()
      }
    );

    return {

      ok:
        true,

      properties:
        getCompareList()

    };

  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  const GHARCompare = {

    init,

    add,

    addById,

    remove,

    toggle,

    clear,

    render,

    isCompared,

    getPropertyById,

    getCompareList,

    getCount,

    getState,

    getComparisonUrl,

    openComparison,

    loadFromUrl,

    fetchProperty,

    refreshProperties,

    exportData,

    importData,

    value,

    formatValue,

    rows,

    config:
      COMPARE_CONFIG,

    get maxCompare() {

      return COMPARE_CONFIG.maxItems;

    }

  };

  // ==========================================================
  // GHAR NAMESPACE
  // ==========================================================

  GHAR.compare =
    GHARCompare;

  window.GHAR =
    GHAR;

  // Backward compatibility
  window.GHARCompare =
    GHARCompare;

  // ==========================================================
  // AUTO INITIALIZATION
  // ==========================================================

  function autoInit() {

    try {

      init();

    } catch (error) {

      console.error(
        "[GHAR COMPARE] Initialization failed:",
        error
      );

    }

  }

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      autoInit,
      {
        once:
          true
      }
    );

  } else {

    autoInit();

  }

})(window, document);