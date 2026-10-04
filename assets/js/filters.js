// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/Filters.js
// Property Search / Filter Manager
// ============================================================

"use strict";

(function (window, document) {

  const GHAR = window.GHAR = window.GHAR || {};

  const Filters = {

    activeFilters: {},

    // ----------------------------------------------------------
    // INITIALIZE
    // ----------------------------------------------------------

    init(
      container = document
    ) {

      this.bind(
        container
      );

      this.read(
        container
      );

      return this.activeFilters;

    },

    // ----------------------------------------------------------
    // BIND
    // ----------------------------------------------------------

    bind(
      container
    ) {

      container.addEventListener(
        "change",
        event => {

          const field =
            event.target.closest(
              "[data-filter]"
            );

          if (!field) {
            return;
          }

          this.update(
            field
          );

        }
      );

      container.addEventListener(
        "input",
        event => {

          const field =
            event.target.closest(
              "[data-filter]"
            );

          if (!field) {
            return;
          }

          if (
            field.type === "range" ||
            field.type === "number"
          ) {

            this.update(
              field
            );

          }

        }
      );

      container.addEventListener(
        "click",
        event => {

          const reset =
            event.target.closest(
              "[data-filter-reset]"
            );

          if (reset) {

            event.preventDefault();

            this.reset(
              container
            );

          }

          const apply =
            event.target.closest(
              "[data-filter-apply]"
            );

          if (apply) {

            event.preventDefault();

            this.apply(
              container
            );

          }

        }
      );

    },

    // ----------------------------------------------------------
    // READ
    // ----------------------------------------------------------

    read(
      container
    ) {

      const fields =
        container.querySelectorAll(
          "[data-filter]"
        );

      const filters = {};

      fields.forEach(
        field => {

          const name =
            field.dataset.filter;

          if (!name) {
            return;
          }

          if (
            field.type === "checkbox"
          ) {

            if (
              field.checked
            ) {

              if (
                !Array.isArray(
                  filters[name]
                )
              ) {

                filters[name] = [];

              }

              filters[name].push(
                field.value
              );

            }

            return;

          }

          if (
            field.type === "radio"
          ) {

            if (
              field.checked
            ) {

              filters[name] =
                field.value;

            }

            return;

          }

          if (
            field.value !== ""
          ) {

            filters[name] =
              field.value;

          }

        }
      );

      this.activeFilters =
        filters;

      return filters;

    },

    // ----------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------

    update(
      field
    ) {

      const container =
        field.closest(
          "[data-filter-container]"
        ) ||
        document;

      this.read(
        container
      );

      this.emit(
        "ghar:filter-change",
        {
          filters:
            this.activeFilters,
          field
        }
      );

    },

    // ----------------------------------------------------------
    // APPLY
    // ----------------------------------------------------------

    apply(
      container
    ) {

      const filters =
        this.read(
          container
        );

      this.emit(
        "ghar:filters-applied",
        {
          filters
        }
      );

      if (
        GHAR.Search &&
        typeof GHAR.Search.applyFilters ===
          "function"
      ) {

        GHAR.Search.applyFilters(
          filters
        );

      }

      return filters;

    },

    // ----------------------------------------------------------
    // RESET
    // ----------------------------------------------------------

    reset(
      container
    ) {

      const fields =
        container.querySelectorAll(
          "[data-filter]"
        );

      fields.forEach(
        field => {

          if (
            field.type === "checkbox" ||
            field.type === "radio"
          ) {

            field.checked =
              false;

          } else {

            field.value = "";

          }

        }
      );

      this.activeFilters = {};

      this.emit(
        "ghar:filters-reset",
        {
          filters: {}
        }
      );

    },

    // ----------------------------------------------------------
    // SET FILTER
    // ----------------------------------------------------------

    set(
      name,
      value,
      container = document
    ) {

      const fields =
        container.querySelectorAll(
          `[data-filter="${CSS.escape(name)}"]`
        );

      fields.forEach(
        field => {

          if (
            field.type === "checkbox"
          ) {

            field.checked =
              Array.isArray(value)
                ? value.includes(
                    field.value
                  )
                : field.value ===
                  String(value);

          } else if (
            field.type === "radio"
          ) {

            field.checked =
              field.value ===
              String(value);

          } else {

            field.value =
              value ?? "";

          }

        }
      );

      this.read(
        container
      );

    },

    // ----------------------------------------------------------
    // GET
    // ----------------------------------------------------------

    get(
      name
    ) {

      return this.activeFilters[
        name
      ];

    },

    // ----------------------------------------------------------
    // CLEAR SINGLE FILTER
    // ----------------------------------------------------------

    clear(
      name,
      container = document
    ) {

      this.set(
        name,
        "",
        container
      );

      delete this.activeFilters[
        name
      ];

      this.emit(
        "ghar:filter-cleared",
        {
          name
        }
      );

    },

    // ----------------------------------------------------------
    // COUNT
    // ----------------------------------------------------------

    count() {

      return Object.keys(
        this.activeFilters
      ).length;

    },

    // ----------------------------------------------------------
    // QUERY STRING
    // ----------------------------------------------------------

    toQueryString(
      filters =
        this.activeFilters
    ) {

      const params =
        new URLSearchParams();

      Object.entries(
        filters
      ).forEach(
        ([key, value]) => {

          if (
            Array.isArray(value)
          ) {

            value.forEach(
              item => params.append(
                key,
                item
              )
            );

          } else if (
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {

            params.set(
              key,
              value
            );

          }

        }
      );

      return params.toString();

    },

    // ----------------------------------------------------------
    // FROM QUERY STRING
    // ----------------------------------------------------------

    fromQueryString(
      queryString,
      container = document
    ) {

      const params =
        new URLSearchParams(
          queryString
        );

      params.forEach(
        (value, key) => {

          const existing =
            this.activeFilters[key];

          if (
            existing === undefined
          ) {

            this.activeFilters[key] =
              value;

          } else if (
            Array.isArray(existing)
          ) {

            existing.push(
              value
            );

          } else {

            this.activeFilters[key] =
              [
                existing,
                value
              ];

          }

        }
      );

      Object.entries(
        this.activeFilters
      ).forEach(
        ([key, value]) => {

          this.set(
            key,
            value,
            container
          );

        }
      );

      return this.activeFilters;

    },

    // ----------------------------------------------------------
    // EMIT
    // ----------------------------------------------------------

    emit(
      name,
      detail
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

  };

  GHAR.Filters =
    Filters;

  window.GHARFilters =
    Filters;

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      const container =
        document.querySelector(
          "[data-filter-container]"
        );

      if (container) {
        Filters.init(
          container
        );
      }

    }
  );

})(window, document);