// ============================================================
// GHAR - PROPERTY DETAILS
// assets/js/property-details.js
// ============================================================

"use strict";

const GharPropertyDetails = (() => {
  const state = {
    property: null,
    loading: false,
    error: null
  };

  // ----------------------------------------------------------
  // CONFIG
  // ----------------------------------------------------------

  const API_BASE =
    window.GHAR_CONFIG?.API_BASE_URL ||
    window.GHAR_CONFIG?.API_BASE ||
    "/api";

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  function getPropertyId() {
    const params = new URLSearchParams(
      window.location.search
    );

    return (
      params.get("id") ||
      params.get("propertyId") ||
      params.get("property")
    );
  }

  function escapeHTML(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatCurrency(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "Price on request";
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(number);
  }

  function formatNumber(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "--";
    }

    return new Intl.NumberFormat("en-IN").format(number);
  }

  function showLoading(show) {
    state.loading = show;

    document
      .querySelectorAll("[data-property-loading]")
      .forEach(element => {
        element.hidden = !show;
      });
  }

  function showError(message) {
    state.error = message;

    document
      .querySelectorAll("[data-property-error]")
      .forEach(element => {
        element.hidden = false;
        element.textContent = message;
      });
  }

  // ----------------------------------------------------------
  // API
  // ----------------------------------------------------------

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "include",

      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },

      ...options
    });

    let data = null;

    try {
      data = await response.json();
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

  async function fetchProperty(id) {
    if (!id) {
      throw new Error(
        "Property ID is required."
      );
    }

    const data = await request(
      `${API_BASE}/properties/${encodeURIComponent(id)}`
    );

    return (
      data?.property ||
      data?.data ||
      data
    );
  }

  // ----------------------------------------------------------
  // PROPERTY DATA
  // ----------------------------------------------------------

  function getPropertyImages(property) {
    if (
      Array.isArray(property?.images) &&
      property.images.length
    ) {
      return property.images;
    }

    if (
      Array.isArray(property?.photos) &&
      property.photos.length
    ) {
      return property.photos;
    }

    if (property?.image) {
      return [property.image];
    }

    return [];
  }

  function getLocation(property) {
    return [
      property?.address,
      property?.locality,
      property?.city,
      property?.state,
      property?.pincode
    ]
      .filter(Boolean)
      .join(", ");
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  function renderProperty(property) {
    if (!property) {
      return;
    }

    state.property = property;

    document
      .querySelectorAll("[data-property-title]")
      .forEach(element => {
        element.textContent =
          property.title ||
          property.name ||
          "Property";
      });

    document
      .querySelectorAll("[data-property-price]")
      .forEach(element => {
        element.textContent =
          formatCurrency(
            property.price
          );
      });

    document
      .querySelectorAll("[data-property-location]")
      .forEach(element => {
        element.textContent =
          getLocation(property) ||
          "Location unavailable";
      });

    document
      .querySelectorAll("[data-property-description]")
      .forEach(element => {
        element.textContent =
          property.description ||
          "No description available.";
      });

    document
      .querySelectorAll("[data-property-type]")
      .forEach(element => {
        element.textContent =
          property.propertyType ||
          property.type ||
          "Property";
      });

    document
      .querySelectorAll("[data-property-status]")
      .forEach(element => {
        element.textContent =
          property.status ||
          property.listingStatus ||
          "Available";
      });

    document
      .querySelectorAll("[data-property-bedrooms]")
      .forEach(element => {
        element.textContent =
          property.bedrooms ??
          property.bhk ??
          "--";
      });

    document
      .querySelectorAll("[data-property-bathrooms]")
      .forEach(element => {
        element.textContent =
          property.bathrooms ??
          "--";
      });

    document
      .querySelectorAll("[data-property-area]")
      .forEach(element => {
        const area =
          property.area ||
          property.size ||
          property.superBuiltUpArea;

        element.textContent =
          area
            ? `${formatNumber(area)} sq ft`
            : "--";
      });

    renderImages(property);
    renderFeatures(property);
    renderMeta(property);

    document.dispatchEvent(
      new CustomEvent(
        "ghar:property-loaded",
        {
          detail: property
        }
      )
    );
  }

  function renderImages(property) {
    const images =
      getPropertyImages(property);

    const gallery =
      document.querySelector(
        "[data-property-gallery]"
      );

    if (!gallery) {
      return;
    }

    gallery.innerHTML = "";

    if (!images.length) {
      gallery.innerHTML = `
        <div class="property-gallery-empty">
          No property images available.
        </div>
      `;

      return;
    }

    images.forEach((image, index) => {
      const src =
        typeof image === "string"
          ? image
          : image?.url || image?.src;

      if (!src) {
        return;
      }

      const img =
        document.createElement("img");

      img.src = src;
      img.alt =
        property.title
          ? `${property.title} - Image ${index + 1}`
          : `Property image ${index + 1}`;

      img.loading =
        index === 0
          ? "eager"
          : "lazy";

      img.addEventListener(
        "click",
        () => openImage(src)
      );

      gallery.appendChild(img);
    });
  }

  function renderFeatures(property) {
    const container =
      document.querySelector(
        "[data-property-features]"
      );

    if (!container) {
      return;
    }

    const features =
      property.features ||
      property.amenities ||
      [];

    if (!Array.isArray(features)) {
      return;
    }

    container.innerHTML =
      features
        .map(feature => {
          const value =
            typeof feature === "string"
              ? feature
              : feature?.name;

          return value
            ? `<li>${escapeHTML(value)}</li>`
            : "";
        })
        .join("");
  }

  function renderMeta(property) {
    const meta = {
      "property-id":
        property.id ||
        property.propertyId,

      "listing-type":
        property.listingType ||
        property.transactionType,

      "furnishing":
        property.furnishing,

      "parking":
        property.parking,

      "floor":
        property.floor,

      "total-floors":
        property.totalFloors,

      "year-built":
        property.yearBuilt,

      "verified":
        property.verified
          ? "Verified"
          : "Not verified"
    };

    Object.entries(meta).forEach(
      ([key, value]) => {
        document
          .querySelectorAll(
            `[data-property-meta="${key}"]`
          )
          .forEach(element => {
            element.textContent =
              value ?? "--";
          });
      }
    );
  }

  // ----------------------------------------------------------
  // IMAGE VIEWER
  // ----------------------------------------------------------

  function openImage(src) {
    let viewer =
      document.querySelector(
        "[data-property-image-viewer]"
      );

    if (!viewer) {
      viewer =
        document.createElement("div");

      viewer.setAttribute(
        "data-property-image-viewer",
        ""
      );

      viewer.innerHTML = `
        <div class="ghar-image-viewer">
          <button
            type="button"
            data-property-viewer-close
            aria-label="Close image"
          >
            ×
          </button>

          <img
            data-property-viewer-image
            alt="Property image"
          />
        </div>
      `;

      document.body.appendChild(viewer);

      viewer
        .querySelector(
          "[data-property-viewer-close]"
        )
        .addEventListener(
          "click",
          closeImage
        );
    }

    viewer.hidden = false;

    viewer
      .querySelector(
        "[data-property-viewer-image]"
      )
      .src = src;
  }

  function closeImage() {
    const viewer =
      document.querySelector(
        "[data-property-image-viewer]"
      );

    if (viewer) {
      viewer.hidden = true;
    }
  }

  // ----------------------------------------------------------
  // FAVOURITES
  // ----------------------------------------------------------

  async function toggleFavourite() {
    const property = state.property;

    if (!property) {
      return;
    }

    const id =
      property.id ||
      property.propertyId;

    if (!id) {
      return;
    }

    try {
      const response =
        await request(
          `${API_BASE}/properties/${encodeURIComponent(id)}/favourite`,
          {
            method: "POST"
          }
        );

      updateFavouriteUI(
        response?.favourite ??
        response?.isFavourite ??
        true
      );

    } catch (error) {
      console.error(
        "GHAR favourite error:",
        error
      );
    }
  }

  function updateFavouriteUI(active) {
    document
      .querySelectorAll(
        "[data-property-favourite]"
      )
      .forEach(button => {
        button.classList.toggle(
          "active",
          Boolean(active)
        );

        button.setAttribute(
          "aria-pressed",
          String(Boolean(active))
        );
      });
  }

  // ----------------------------------------------------------
  // SHARE
  // ----------------------------------------------------------

  async function shareProperty() {
    const property =
      state.property;

    if (!property) {
      return;
    }

    const url =
      window.location.href;

    const title =
      property.title ||
      property.name ||
      "GHAR Property";

    try {
      if (
        navigator.share
      ) {
        await navigator.share({
          title,
          text:
            `Check this property on GHAR: ${title}`,
          url
        });

        return;
      }

      await navigator.clipboard.writeText(
        url
      );

      showToast(
        "Property link copied."
      );

    } catch (error) {
      console.error(
        "GHAR share error:",
        error
      );
    }
  }

  // ----------------------------------------------------------
  // VISIT
  // ----------------------------------------------------------

  function requestVisit() {
    const property =
      state.property;

    if (!property) {
      return;
    }

    const id =
      property.id ||
      property.propertyId;

    window.location.href =
      `/visits/schedule.html?propertyId=${encodeURIComponent(id)}`;
  }

  // ----------------------------------------------------------
  // OFFER
  // ----------------------------------------------------------

  function makeOffer() {
    const property =
      state.property;

    if (!property) {
      return;
    }

    const id =
      property.id ||
      property.propertyId;

    window.location.href =
      `/offers.html?propertyId=${encodeURIComponent(id)}`;
  }

  // ----------------------------------------------------------
  // TOAST
  // ----------------------------------------------------------

  function showToast(message) {
    let toast =
      document.querySelector(
        "[data-ghar-toast]"
      );

    if (!toast) {
      toast =
        document.createElement("div");

      toast.setAttribute(
        "data-ghar-toast",
        ""
      );

      document.body.appendChild(
        toast
      );
    }

    toast.textContent =
      message;

    toast.classList.add(
      "show"
    );

    setTimeout(() => {
      toast.classList.remove(
        "show"
      );
    }, 2500);
  }

  // ----------------------------------------------------------
  // EVENTS
  // ----------------------------------------------------------

  function bindEvents() {
    document.addEventListener(
      "click",
      event => {

        const favourite =
          event.target.closest(
            "[data-property-favourite]"
          );

        if (favourite) {
          event.preventDefault();
          toggleFavourite();
          return;
        }

        const share =
          event.target.closest(
            "[data-property-share]"
          );

        if (share) {
          event.preventDefault();
          shareProperty();
          return;
        }

        const visit =
          event.target.closest(
            "[data-property-visit]"
          );

        if (visit) {
          event.preventDefault();
          requestVisit();
          return;
        }

        const offer =
          event.target.closest(
            "[data-property-offer]"
          );

        if (offer) {
          event.preventDefault();
          makeOffer();
        }
      }
    );
  }

  // ----------------------------------------------------------
  // INITIALIZATION
  // ----------------------------------------------------------

  async function init() {
    bindEvents();

    const propertyId =
      getPropertyId();

    if (!propertyId) {
      showError(
        "No property ID was provided."
      );

      return;
    }

    try {
      showLoading(true);

      const property =
        await fetchProperty(
          propertyId
        );

      renderProperty(
        property
      );

    } catch (error) {

      console.error(
        "GHAR property details error:",
        error
      );

      showError(
        error.message ||
        "Unable to load property details."
      );

    } finally {
      showLoading(false);
    }
  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  return {
    init,
    fetchProperty,
    renderProperty,
    toggleFavourite,
    shareProperty,
    requestVisit,
    makeOffer,
    getPropertyId
  };
})();

window.GharPropertyDetails =
  GharPropertyDetails;

document.addEventListener(
  "DOMContentLoaded",
  () => {
    GharPropertyDetails.init();
  }
);