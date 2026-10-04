// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/compare.js
// Property Comparison Engine
// ============================================================

"use strict";

(function (window, document) {

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const STORAGE_KEY = "ghar_compare_properties";
  const MAX_COMPARE = 4;

  const API_BASE =
    (window.GHAR_CONFIG &&
      window.GHAR_CONFIG.API_BASE_URL) ||
    "/api";

  // ==========================================================
  // STATE
  // ==========================================================

  const state = {
    properties: [],
    loading: false
  };

  // ==========================================================
  // HELPERS
  // ==========================================================

  function safeParse(value, fallback = []) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function normalizeId(property) {
    if (!property) return null;

    return String(
      property.id ||
      property.property_id ||
      property.propertyId ||
      property.slug ||
      ""
    ).trim();
  }

  function getStorage() {
    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const parsed =
      safeParse(saved, []);

    return Array.isArray(parsed)
      ? parsed
      : [];
  }

  function saveStorage(properties) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(properties)
    );
  }

  function emit(name, detail = {}) {
    document.dispatchEvent(
      new CustomEvent(
        `ghar:${name}`,
        { detail }
      )
    );
  }

  function getPropertyById(id) {
    return state.properties.find(
      property =>
        normalizeId(property) === String(id)
    );
  }

  // ==========================================================
  // INITIALIZATION
  // ==========================================================

  function init() {

    state.properties =
      getStorage();

    renderCompareCount();

    bindEvents();

    emit(
      "compare:ready",
      {
        properties:
          [...state.properties]
      }
    );

    if (
      document.querySelector(
        "[data-compare-container]"
      )
    ) {
      render();
    }
  }

  // ==========================================================
  // GET COMPARE LIST
  // ==========================================================

  function getCompareList() {
    return [...state.properties];
  }

  // ==========================================================
  // CHECK PROPERTY
  // ==========================================================

  function isCompared(propertyId) {

    return state.properties.some(
      property =>
        normalizeId(property) ===
        String(propertyId)
    );
  }

  // ==========================================================
  // ADD PROPERTY
  // ==========================================================

  function add(property) {

    if (!property) {
      return {
        ok: false,
        error: "Property is required"
      };
    }

    const id =
      normalizeId(property);

    if (!id) {
      return {
        ok: false,
        error: "Property ID is required"
      };
    }

    if (isCompared(id)) {
      return {
        ok: true,
        alreadyAdded: true,
        properties:
          getCompareList()
      };
    }

    if (
      state.properties.length >=
      MAX_COMPARE
    ) {

      emit(
        "compare:limit",
        {
          max:
            MAX_COMPARE
        }
      );

      return {
        ok: false,
        error:
          `You can compare up to ${MAX_COMPARE} properties.`
      };
    }

    state.properties.push(property);

    saveStorage(
      state.properties
    );

    renderCompareCount();

    updateButtons();

    emit(
      "compare:added",
      {
        property,
        properties:
          getCompareList()
      }
    );

    render();

    return {
      ok: true,
      property,
      properties:
        getCompareList()
    };
  }

  // ==========================================================
  // REMOVE PROPERTY
  // ==========================================================

  function remove(propertyId) {

    const id =
      String(propertyId);

    const index =
      state.properties.findIndex(
        property =>
          normalizeId(property) === id
      );

    if (index === -1) {
      return {
        ok: false,
        error:
          "Property is not in comparison list"
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

    renderCompareCount();

    updateButtons();

    emit(
      "compare:removed",
      {
        property: removed,
        properties:
          getCompareList()
      }
    );

    render();

    return {
      ok: true,
      property: removed,
      properties:
        getCompareList()
    };
  }

  // ==========================================================
  // TOGGLE
  // ==========================================================

  function toggle(property) {

    const id =
      normalizeId(property);

    if (!id) {
      return {
        ok: false,
        error:
          "Property ID is required"
      };
    }

    if (isCompared(id)) {
      return remove(id);
    }

    return add(property);
  }

  // ==========================================================
  // CLEAR ALL
  // ==========================================================

  function clear() {

    const previous =
      getCompareList();

    state.properties = [];

    saveStorage([]);

    renderCompareCount();

    updateButtons();

    emit(
      "compare:cleared",
      {
        properties:
          previous
      }
    );

    render();

    return {
      ok: true
    };
  }

  // ==========================================================
  // PROPERTY VALUE
  // ==========================================================

  function value(property, keys) {

    if (!property) {
      return null;
    }

    for (
      const key of keys
    ) {

      if (
        property[key] !== undefined &&
        property[key] !== null &&
        property[key] !== ""
      ) {
        return property[key];
      }
    }

    return null;
  }

  // ==========================================================
  // FORMAT VALUE
  // ==========================================================

  function formatValue(
    value,
    type = "text"
  ) {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "--";
    }

    if (type === "currency") {

      const number =
        Number(
          String(value)
            .replace(/,/g, "")
            .replace(/[^\d.]/g, "")
        );

      if (
        Number.isNaN(number)
      ) {
        return String(value);
      }

      return new Intl.NumberFormat(
        "en-IN",
        {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0
        }
      ).format(number);
    }

    if (type === "number") {

      const number =
        Number(value);

      if (
        Number.isNaN(number)
      ) {
        return String(value);
      }

      return new Intl.NumberFormat(
        "en-IN"
      ).format(number);
    }

    if (type === "boolean") {

      return value
        ? "Yes"
        : "No";
    }

    return String(value);
  }

  // ==========================================================
  // COMPARE ROW DEFINITIONS
  // ==========================================================

  const rows = [

    {
      key: "price",
      label: "Price",
      keys: [
        "price",
        "property_price",
        "amount"
      ],
      type: "currency"
    },

    {
      key: "propertyType",
      label: "Property Type",
      keys: [
        "propertyType",
        "property_type",
        "type"
      ]
    },

    {
      key: "listingType",
      label: "Listing Type",
      keys: [
        "listingType",
        "listing_type",
        "transactionType"
      ]
    },

    {
      key: "bhk",
      label: "BHK",
      keys: [
        "bhk",
        "bedrooms"
      ]
    },

    {
      key: "bathrooms",
      label: "Bathrooms",
      keys: [
        "bathrooms",
        "bathroom",
        "baths"
      ]
    },

    {
      key: "area",
      label: "Area",
      keys: [
        "area",
        "builtUpArea",
        "built_up_area",
        "superBuiltUpArea"
      ]
    },

    {
      key: "areaUnit",
      label: "Area Unit",
      keys: [
        "areaUnit",
        "area_unit"
      ]
    },

    {
      key: "location",
      label: "Location",
      keys: [
        "location",
        "address",
        "locality"
      ]
    },

    {
      key: "city",
      label: "City",
      keys: [
        "city"
      ]
    },

    {
      key: "state",
      label: "State",
      keys: [
        "state"
      ]
    },

    {
      key: "pincode",
      label: "Pincode",
      keys: [
        "pincode",
        "pin",
        "postalCode"
      ]
    },

    {
      key: "furnishing",
      label: "Furnishing",
      keys: [
        "furnishing",
        "furnishingStatus"
      ]
    },

    {
      key: "floor",
      label: "Floor",
      keys: [
        "floor",
        "floorNumber"
      ]
    },

    {
      key: "totalFloors",
      label: "Total Floors",
      keys: [
        "totalFloors",
        "total_floors"
      ]
    },

    {
      key: "parking",
      label: "Parking",
      keys: [
        "parking",
        "parkingSpaces"
      ]
    },

    {
      key: "facing",
      label: "Facing",
      keys: [
        "facing"
      ]
    },

    {
      key: "age",
      label: "Property Age",
      keys: [
        "age",
        "propertyAge"
      ]
    },

    {
      key: "verified",
      label: "Verified",
      keys: [
        "verified",
        "isVerified"
      ],
      type: "boolean"
    }

  ];

  // ==========================================================
  // CREATE ELEMENT
  // ==========================================================

  function createElement(
    tag,
    className,
    text
  ) {

    const element =
      document.createElement(tag);

    if (className) {
      element.className =
        className;
    }

    if (
      text !== undefined &&
      text !== null
    ) {
      element.textContent =
        text;
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

    if (!containers.length) {
      return;
    }

    containers.forEach(
      container => {

        container.innerHTML = "";

        if (
          !state.properties.length
        ) {

          const empty =
            createElement(
              "div",
              "ghar-compare-empty"
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
              "Add properties to compare their features, pricing and specifications."
            );

          empty.appendChild(title);
          empty.appendChild(message);

          container.appendChild(empty);

          return;
        }

        const wrapper =
          createElement(
            "div",
            "ghar-compare-table-wrapper"
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

        wrapper.appendChild(table);

        container.appendChild(wrapper);

      }
    );

    updateButtons();
  }

  // ==========================================================
  // HEADER
  // ==========================================================

  function createHeader() {

    const thead =
      document.createElement("thead");

    const tr =
      document.createElement("tr");

    const feature =
      createElement(
        "th",
        "compare-feature",
        "Property"
      );

    tr.appendChild(feature);

    state.properties.forEach(
      property => {

        const th =
          document.createElement("th");

        th.className =
          "compare-property";

        const title =
          value(
            property,
            [
              "title",
              "name",
              "propertyName"
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

        remove.type = "button";

        remove.dataset.compareRemove =
          normalizeId(property);

        th.appendChild(heading);
        th.appendChild(remove);

        tr.appendChild(th);

      }
    );

    thead.appendChild(tr);

    return thead;
  }

  // ==========================================================
  // BODY
  // ==========================================================

  function createBody() {

    const tbody =
      document.createElement("tbody");

    rows.forEach(
      row => {

        const tr =
          document.createElement("tr");

        const label =
          createElement(
            "th",
            "compare-label",
            row.label
          );

        tr.appendChild(label);

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

            tr.appendChild(td);

          }
        );

        tbody.appendChild(tr);

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

        }
      );
  }

  // ==========================================================
  // UPDATE COMPARE BUTTONS
  // ==========================================================

  function updateButtons() {

    document
      .querySelectorAll(
        "[data-compare-id]"
      )
      .forEach(
        button => {

          const id =
            button.dataset.compareId;

          const active =
            isCompared(id);

          button.classList.toggle(
            "is-active",
            active
          );

          button.setAttribute(
            "aria-pressed",
            String(active)
          );

          const label =
            active
              ? "Remove from comparison"
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

  function bindEvents() {

    document.addEventListener(
      "click",
      event => {

        const compareButton =
          event.target.closest(
            "[data-compare-id]"
          );

        if (
          compareButton
        ) {

          event.preventDefault();

          const id =
            compareButton.dataset.compareId;

          let property =
            compareButton._gharProperty;

          if (!property) {

            property =
              getPropertyById(id);
          }

          if (!property) {

            property = {
              id
            };

            const title =
              compareButton.dataset.compareTitle;

            const price =
              compareButton.dataset.comparePrice;

            if (title) {
              property.title =
                title;
            }

            if (price) {
              property.price =
                price;
            }
          }

          toggle(property);

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
    );
  }

  // ==========================================================
  // API: LOAD PROPERTY
  // ==========================================================

  async function fetchProperty(
    propertyId
  ) {

    if (!propertyId) {
      throw new Error(
        "Property ID is required"
      );
    }

    const response =
      await fetch(
        `${API_BASE}/properties/${encodeURIComponent(propertyId)}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept:
              "application/json"
          }
        }
      );

    if (!response.ok) {

      throw new Error(
        `Unable to load property (${response.status})`
      );
    }

    const data =
      await response.json();

    return (
      data.property ||
      data.data ||
      data
    );
  }

  // ==========================================================
  // ADD BY ID
  // ==========================================================

  async function addById(
    propertyId
  ) {

    if (
      isCompared(propertyId)
    ) {
      return {
        ok: true,
        alreadyAdded: true
      };
    }

    state.loading = true;

    try {

      const property =
        await fetchProperty(
          propertyId
        );

      return add(property);

    } finally {

      state.loading = false;

    }
  }

  // ==========================================================
  // GET COMPARISON URL
  // ==========================================================

  function getComparisonUrl(
    basePath = "/compare.html"
  ) {

    const ids =
      state.properties
        .map(normalizeId)
        .filter(Boolean);

    if (!ids.length) {
      return basePath;
    }

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
      url.search
    );
  }

  // ==========================================================
  // LOAD IDS FROM URL
  // ==========================================================

  async function loadFromUrl() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const ids =
      params
        .get("ids");

    if (!ids) {
      return [];
    }

    const list =
      ids
        .split(",")
        .map(id => id.trim())
        .filter(Boolean)
        .slice(
          0,
          MAX_COMPARE
        );

    const loaded = [];

    for (
      const id of list
    ) {

      try {

        const property =
          await fetchProperty(id);

        if (property) {

          add(property);

          loaded.push(property);

        }

      } catch (error) {

        console.warn(
          "GHAR Compare:",
          error.message
        );

      }

    }

    return loaded;
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  window.GHARCompare = {

    init,

    add,

    addById,

    remove,

    toggle,

    clear,

    render,

    isCompared,

    getCompareList,

    getComparisonUrl,

    loadFromUrl,

    fetchProperty,

    get maxCompare() {
      return MAX_COMPARE;
    }

  };

  // ==========================================================
  // AUTO INIT
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