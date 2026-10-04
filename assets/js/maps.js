// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/Maps.js
// Property Maps / Location Services
// ============================================================

"use strict";

(function (window, document) {

  const GHAR = window.GHAR = window.GHAR || {};

  const Maps = {

    // ----------------------------------------------------------
    // CONFIG
    // ----------------------------------------------------------

    config: {
      defaultZoom: 12,
      propertyZoom: 15,
      defaultLat: 28.6139,
      defaultLng: 77.2090,
      mapProvider:
        window.GHAR_CONFIG?.MAP_PROVIDER || "openstreetmap"
    },

    map: null,

    markers: [],

    currentLocation: null,

    // ----------------------------------------------------------
    // INITIALIZE
    // ----------------------------------------------------------

    init(options = {}) {

      this.config = {
        ...this.config,
        ...options
      };

      this.bindEvents();

      const mapElement =
        document.querySelector(
          "[data-ghar-map]"
        );

      if (mapElement) {
        this.initializeMap(
          mapElement,
          this.config
        );
      }

      return this;
    },

    // ----------------------------------------------------------
    // EVENT BINDINGS
    // ----------------------------------------------------------

    bindEvents() {

      document.addEventListener(
        "click",
        event => {

          const locationButton =
            event.target.closest(
              "[data-map-current-location]"
            );

          if (locationButton) {
            event.preventDefault();
            this.getCurrentLocation();
          }

          const propertyButton =
            event.target.closest(
              "[data-map-property]"
            );

          if (propertyButton) {

            event.preventDefault();

            const lat =
              Number(
                propertyButton.dataset.lat
              );

            const lng =
              Number(
                propertyButton.dataset.lng
              );

            if (
              Number.isFinite(lat) &&
              Number.isFinite(lng)
            ) {

              this.setView(
                lat,
                lng,
                this.config.propertyZoom
              );

            }
          }
        }
      );

    },

    // ----------------------------------------------------------
    // INITIALIZE MAP
    // ----------------------------------------------------------

    initializeMap(
      element,
      options = {}
    ) {

      if (!element) {
        return null;
      }

      const lat =
        Number(
          element.dataset.lat ||
          options.defaultLat
        );

      const lng =
        Number(
          element.dataset.lng ||
          options.defaultLng
        );

      const zoom =
        Number(
          element.dataset.zoom ||
          options.defaultZoom
        );

      // Leaflet support
      if (
        typeof window.L !==
        "undefined"
      ) {

        this.map =
          window.L.map(
            element
          ).setView(
            [
              lat,
              lng
            ],
            zoom
          );

        window.L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              "&copy; OpenStreetMap contributors",

            maxZoom: 19
          }
        ).addTo(
          this.map
        );

        element.dataset.mapInitialized =
          "true";

        return this.map;
      }

      // Graceful fallback
      element.classList.add(
        "ghar-map-fallback"
      );

      element.innerHTML = `
        <div class="ghar-map-placeholder">
          <div class="ghar-map-placeholder-icon">
            📍
          </div>

          <h3>Property Location</h3>

          <p>
            Interactive map service is not
            currently available.
          </p>
        </div>
      `;

      return null;
    },

    // ----------------------------------------------------------
    // SET MAP VIEW
    // ----------------------------------------------------------

    setView(
      lat,
      lng,
      zoom = this.config.propertyZoom
    ) {

      if (
        !this.map ||
        typeof this.map.setView !==
          "function"
      ) {
        return false;
      }

      this.map.setView(
        [
          Number(lat),
          Number(lng)
        ],
        zoom
      );

      return true;
    },

    // ----------------------------------------------------------
    // ADD PROPERTY MARKER
    // ----------------------------------------------------------

    addPropertyMarker(
      property
    ) {

      if (
        !this.map ||
        typeof window.L ===
          "undefined"
      ) {
        return null;
      }

      if (!property) {
        return null;
      }

      const lat =
        Number(
          property.latitude ??
          property.lat
        );

      const lng =
        Number(
          property.longitude ??
          property.lng
        );

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        return null;
      }

      const title =
        property.title ||
        "GHAR Property";

      const price =
        property.price ||
        property.formattedPrice ||
        "";

      const location =
        property.location ||
        property.address ||
        "";

      const marker =
        window.L.marker([
          lat,
          lng
        ]).addTo(
          this.map
        );

      marker.bindPopup(`
        <div class="ghar-map-property">

          <strong>
            ${this.escapeHTML(title)}
          </strong>

          ${
            price
              ? `<div class="ghar-map-price">
                   ${this.escapeHTML(
                     String(price)
                   )}
                 </div>`
              : ""
          }

          ${
            location
              ? `<div class="ghar-map-location">
                   ${this.escapeHTML(
                     String(location)
                   )}
                 </div>`
              : ""
          }

        </div>
      `);

      marker.gharProperty =
        property;

      this.markers.push(
        marker
      );

      return marker;
    },

    // ----------------------------------------------------------
    // ADD MULTIPLE PROPERTIES
    // ----------------------------------------------------------

    addProperties(
      properties = []
    ) {

      if (
        !Array.isArray(properties)
      ) {
        return [];
      }

      return properties
        .map(property =>
          this.addPropertyMarker(
            property
          )
        )
        .filter(Boolean);

    },

    // ----------------------------------------------------------
    // CLEAR MARKERS
    // ----------------------------------------------------------

    clearMarkers() {

      this.markers.forEach(
        marker => {

          if (
            marker &&
            this.map &&
            typeof this.map.removeLayer ===
              "function"
          ) {

            this.map.removeLayer(
              marker
            );

          }

        }
      );

      this.markers = [];

    },

    // ----------------------------------------------------------
    // FIT ALL PROPERTIES
    // ----------------------------------------------------------

    fitProperties() {

      if (
        !this.map ||
        typeof window.L ===
          "undefined" ||
        !this.markers.length
      ) {
        return false;
      }

      const group =
        window.L.featureGroup(
          this.markers
        );

      this.map.fitBounds(
        group.getBounds(),
        {
          padding: [
            30,
            30
          ]
        }
      );

      return true;
    },

    // ----------------------------------------------------------
    // CURRENT LOCATION
    // ----------------------------------------------------------

    getCurrentLocation() {

      if (
        !navigator.geolocation
      ) {

        this.emitError(
          "Geolocation is not supported by this browser."
        );

        return;
      }

      navigator.geolocation.getCurrentPosition(

        position => {

          const latitude =
            position.coords.latitude;

          const longitude =
            position.coords.longitude;

          this.currentLocation = {
            latitude,
            longitude
          };

          this.setView(
            latitude,
            longitude,
            this.config.propertyZoom
          );

          this.addCurrentLocationMarker(
            latitude,
            longitude
          );

          this.emit(
            "ghar:location-found",
            this.currentLocation
          );

        },

        error => {

          let message =
            "Unable to determine your location.";

          if (
            error.code ===
            error.PERMISSION_DENIED
          ) {
            message =
              "Location permission was denied.";
          }

          if (
            error.code ===
            error.POSITION_UNAVAILABLE
          ) {
            message =
              "Location information is unavailable.";
          }

          if (
            error.code ===
            error.TIMEOUT
          ) {
            message =
              "Location request timed out.";
          }

          this.emitError(
            message
          );

        },

        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }

      );

    },

    // ----------------------------------------------------------
    // CURRENT LOCATION MARKER
    // ----------------------------------------------------------

    addCurrentLocationMarker(
      lat,
      lng
    ) {

      if (
        !this.map ||
        typeof window.L ===
          "undefined"
      ) {
        return null;
      }

      if (
        this.currentLocationMarker
      ) {

        this.map.removeLayer(
          this.currentLocationMarker
        );

      }

      this.currentLocationMarker =
        window.L.marker([
          lat,
          lng
        ])
          .addTo(this.map)
          .bindPopup(
            "Your current location"
          );

      return this.currentLocationMarker;
    },

    // ----------------------------------------------------------
    // GEOCODING
    // ----------------------------------------------------------

    async geocode(
      query
    ) {

      if (!query) {
        return null;
      }

      try {

        const response =
          await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(
              query
            )}`,
            {
              headers: {
                Accept:
                  "application/json"
              }
            }
          );

        if (!response.ok) {
          throw new Error(
            "Geocoding request failed."
          );
        }

        const results =
          await response.json();

        return results.map(
          item => ({
            latitude:
              Number(item.lat),

            longitude:
              Number(item.lon),

            displayName:
              item.display_name,

            type:
              item.type,

            raw:
              item
          })
        );

      } catch (error) {

        console.error(
          "[GHAR Maps] Geocoding error:",
          error
        );

        return [];

      }

    },

    // ----------------------------------------------------------
    // REVERSE GEOCODING
    // ----------------------------------------------------------

    async reverseGeocode(
      lat,
      lng
    ) {

      if (
        !Number.isFinite(
          Number(lat)
        ) ||
        !Number.isFinite(
          Number(lng)
        )
      ) {
        return null;
      }

      try {

        const response =
          await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
              lat
            )}&lon=${encodeURIComponent(
              lng
            )}`,
            {
              headers: {
                Accept:
                  "application/json"
              }
            }
          );

        if (!response.ok) {
          throw new Error(
            "Reverse geocoding failed."
          );
        }

        return await response.json();

      } catch (error) {

        console.error(
          "[GHAR Maps] Reverse geocoding error:",
          error
        );

        return null;

      }

    },

    // ----------------------------------------------------------
    // DISTANCE
    // ----------------------------------------------------------

    distanceBetween(
      lat1,
      lng1,
      lat2,
      lng2
    ) {

      const R = 6371;

      const dLat =
        this.toRadians(
          lat2 - lat1
        );

      const dLng =
        this.toRadians(
          lng2 - lng1
        );

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(
          this.toRadians(lat1)
        ) *
        Math.cos(
          this.toRadians(lat2)
        ) *
        Math.sin(dLng / 2) ** 2;

      const c =
        2 *
        Math.atan2(
          Math.sqrt(a),
          Math.sqrt(1 - a)
        );

      return R * c;

    },

    // ----------------------------------------------------------
    // HELPERS
    // ----------------------------------------------------------

    toRadians(
      degrees
    ) {

      return (
        Number(degrees) *
        Math.PI /
        180
      );

    },

    escapeHTML(
      value
    ) {

      return String(value)
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

    emit(
      eventName,
      detail = {}
    ) {

      document.dispatchEvent(
        new CustomEvent(
          eventName,
          {
            detail
          }
        )
      );

    },

    emitError(
      message
    ) {

      console.error(
        "[GHAR Maps]",
        message
      );

      this.emit(
        "ghar:map-error",
        {
          message
        }
      );

    }

  };

  // ----------------------------------------------------------
  // GLOBAL EXPORT
  // ----------------------------------------------------------

  GHAR.Maps = Maps;

  window.GHARMaps = Maps;

  // ----------------------------------------------------------
  // AUTO INIT
  // ----------------------------------------------------------

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      if (
        document.querySelector(
          "[data-ghar-map]"
        )
      ) {

        Maps.init();

      }

    }
  );

})(window, document);