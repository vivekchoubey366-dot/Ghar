// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/favourites.js
// Favourites / Saved Properties Management
// ============================================================

"use strict";

(() => {
  const GHAR = window.GHAR || {};
  const config = GHAR.config || {};
  const storage = GHAR.storage || {};

  const STORAGE_KEY =
    config.storageKeys?.favourites ||
    "ghar_favourites";

  // ----------------------------------------------------------
  // INTERNAL HELPERS
  // ----------------------------------------------------------

  function readFavourites() {
    try {
      if (typeof storage.get === "function") {
        const data = storage.get(STORAGE_KEY);
        return Array.isArray(data) ? data : [];
      }

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("[GHAR] Failed to read favourites:", error);
      return [];
    }
  }

  function saveFavourites(favourites) {
    try {
      if (typeof storage.set === "function") {
        storage.set(STORAGE_KEY, favourites);
        return true;
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(favourites)
      );

      return true;
    } catch (error) {
      console.error("[GHAR] Failed to save favourites:", error);
      return false;
    }
  }

  function normalizeId(id) {
    if (id === undefined || id === null) {
      return null;
    }

    return String(id).trim() || null;
  }

  function getPropertyId(property) {
    if (!property) return null;

    return normalizeId(
      property.id ||
      property.propertyId ||
      property.property_id
    );
  }

  function dispatch(name, detail = {}) {
    document.dispatchEvent(
      new CustomEvent(`ghar:${name}`, {
        detail
      })
    );
  }

  // ----------------------------------------------------------
  // GET ALL FAVOURITES
  // ----------------------------------------------------------

  function getAll() {
    return readFavourites();
  }

  // ----------------------------------------------------------
  // CHECK FAVOURITE
  // ----------------------------------------------------------

  function isFavourite(propertyId) {
    const id = normalizeId(propertyId);

    if (!id) return false;

    return readFavourites().some(
      item => normalizeId(item.id) === id
    );
  }

  // ----------------------------------------------------------
  // ADD FAVOURITE
  // ----------------------------------------------------------

  function add(property) {
    const id = getPropertyId(property);

    if (!id) {
      console.warn(
        "[GHAR] Cannot favourite property without ID."
      );
      return false;
    }

    const favourites = readFavourites();

    if (
      favourites.some(
        item => normalizeId(item.id) === id
      )
    ) {
      return true;
    }

    const item = {
      ...property,
      id,
      savedAt: new Date().toISOString()
    };

    favourites.push(item);

    const saved = saveFavourites(favourites);

    if (saved) {
      dispatch("favourite-added", {
        property: item,
        propertyId: id
      });
    }

    updateUI();

    return saved;
  }

  // ----------------------------------------------------------
  // REMOVE FAVOURITE
  // ----------------------------------------------------------

  function remove(propertyId) {
    const id = normalizeId(propertyId);

    if (!id) return false;

    const favourites = readFavourites();

    const filtered = favourites.filter(
      item => normalizeId(item.id) !== id
    );

    if (filtered.length === favourites.length) {
      return false;
    }

    const saved = saveFavourites(filtered);

    if (saved) {
      dispatch("favourite-removed", {
        propertyId: id
      });
    }

    updateUI();

    return saved;
  }

  // ----------------------------------------------------------
  // TOGGLE FAVOURITE
  // ----------------------------------------------------------

  function toggle(property) {
    const id = getPropertyId(property);

    if (!id) return false;

    if (isFavourite(id)) {
      remove(id);
      return false;
    }

    add(property);
    return true;
  }

  // ----------------------------------------------------------
  // CLEAR ALL
  // ----------------------------------------------------------

  function clear() {
    const previous = readFavourites();

    const saved = saveFavourites([]);

    if (saved) {
      dispatch("favourites-cleared", {
        count: previous.length
      });
    }

    updateUI();

    return saved;
  }

  // ----------------------------------------------------------
  // COUNT
  // ----------------------------------------------------------

  function count() {
    return readFavourites().length;
  }

  // ----------------------------------------------------------
  // GET SINGLE PROPERTY
  // ----------------------------------------------------------

  function get(propertyId) {
    const id = normalizeId(propertyId);

    if (!id) return null;

    return (
      readFavourites().find(
        item => normalizeId(item.id) === id
      ) || null
    );
  }

  // ----------------------------------------------------------
  // UI STATE
  // ----------------------------------------------------------

  function updateButton(button, propertyId) {
    if (!button) return;

    const active = isFavourite(propertyId);

    button.classList.toggle(
      "is-favourite",
      active
    );

    button.classList.toggle(
      "active",
      active
    );

    button.setAttribute(
      "aria-pressed",
      String(active)
    );

    button.setAttribute(
      "aria-label",
      active
        ? "Remove from favourites"
        : "Add to favourites"
    );

    const icon =
      button.querySelector(
        "[data-favourite-icon]"
      );

    if (icon) {
      icon.textContent = active
        ? "♥"
        : "♡";
    }

    const text =
      button.querySelector(
        "[data-favourite-text]"
      );

    if (text) {
      text.textContent = active
        ? "Saved"
        : "Save";
    }
  }

  function updateButtons() {
    const buttons =
      document.querySelectorAll(
        "[data-favourite], " +
        "[data-favorite]"
      );

    buttons.forEach(button => {
      const propertyId =
        button.dataset.propertyId ||
        button.dataset.id;

      updateButton(
        button,
        propertyId
      );
    });
  }

  function updateCounters() {
    const total = count();

    document
      .querySelectorAll(
        "[data-favourites-count], " +
        "[data-favorites-count]"
      )
      .forEach(element => {
        element.textContent = String(total);
      });
  }

  function updateUI() {
    updateButtons();
    updateCounters();
  }

  // ----------------------------------------------------------
  // BUTTON HANDLER
  // ----------------------------------------------------------

  function handleFavouriteClick(event) {
    const button =
      event.target.closest(
        "[data-favourite], [data-favorite]"
      );

    if (!button) return;

    event.preventDefault();

    const propertyId =
      button.dataset.propertyId ||
      button.dataset.id;

    if (!propertyId) {
      console.warn(
        "[GHAR] Favourite button has no property ID."
      );
      return;
    }

    const existing =
      get(propertyId);

    if (existing) {
      remove(propertyId);
      return;
    }

    // Collect property information from the
    // closest property card when available.
    const card =
      button.closest(
        "[data-property-id], " +
        ".property-card, " +
        ".property-item, " +
        ".property"
      );

    const property = {
      id: propertyId,

      title:
        button.dataset.propertyTitle ||
        card?.dataset.propertyTitle ||
        card?.querySelector(
          "[data-property-title]"
        )?.textContent?.trim() ||
        "",

      image:
        button.dataset.propertyImage ||
        card?.dataset.propertyImage ||
        card?.querySelector("img")?.src ||
        "",

      location:
        button.dataset.propertyLocation ||
        card?.dataset.propertyLocation ||
        "",

      price:
        button.dataset.propertyPrice ||
        card?.dataset.propertyPrice ||
        ""
    };

    add(property);
  }

  // ----------------------------------------------------------
  // PAGE INITIALIZATION
  // ----------------------------------------------------------

  function init() {
    document.addEventListener(
      "click",
      handleFavouriteClick
    );

    updateUI();

    dispatch("favourites-ready", {
      count: count()
    });
  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  const favourites = {
    getAll,
    get,
    add,
    remove,
    toggle,
    clear,
    count,
    isFavourite,
    updateUI
  };

  GHAR.favourites = favourites;

  window.GHAR = GHAR;

  // Backward-compatible global access
  window.GHARFavourites = favourites;

  // ----------------------------------------------------------
  // START
  // ----------------------------------------------------------

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();