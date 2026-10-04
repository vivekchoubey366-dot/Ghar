// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/Pagination.js
// Pagination Manager
// ============================================================

"use strict";

(function (window, document) {

  const GHAR = window.GHAR = window.GHAR || {};

  const Pagination = {

    // ----------------------------------------------------------
    // STATE
    // ----------------------------------------------------------

    instances: new Map(),

    // ----------------------------------------------------------
    // CREATE
    // ----------------------------------------------------------

    create(
      element,
      options = {}
    ) {

      if (!element) {
        return null;
      }

      const state = {

        element,

        currentPage:
          Number(
            options.currentPage || 1
          ),

        totalPages:
          Number(
            options.totalPages || 1
          ),

        pageSize:
          Number(
            options.pageSize || 20
          ),

        maxButtons:
          Number(
            options.maxButtons || 5
          ),

        onChange:
          typeof options.onChange ===
          "function"
            ? options.onChange
            : null

      };

      this.instances.set(
        element,
        state
      );

      this.render(
        state
      );

      return state;

    },

    // ----------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------

    render(
      state
    ) {

      const {
        element,
        currentPage,
        totalPages,
        maxButtons
      } = state;

      element.innerHTML = "";

      if (
        totalPages <= 1
      ) {
        return;
      }

      const fragment =
        document.createDocumentFragment();

      const previous =
        this.createButton(
          "Previous",
          currentPage - 1,
          currentPage <= 1
        );

      fragment.appendChild(
        previous
      );

      const pages =
        this.getPageRange(
          currentPage,
          totalPages,
          maxButtons
        );

      pages.forEach(
        page => {

          if (page === "...") {

            const ellipsis =
              document.createElement("span");

            ellipsis.className =
              "ghar-pagination-ellipsis";

            ellipsis.textContent =
              "...";

            fragment.appendChild(
              ellipsis
            );

            return;

          }

          const button =
            this.createButton(
              String(page),
              page,
              false,
              page === currentPage
            );

          fragment.appendChild(
            button
          );

        }
      );

      const next =
        this.createButton(
          "Next",
          currentPage + 1,
          currentPage >= totalPages
        );

      fragment.appendChild(
        next
      );

      element.appendChild(
        fragment
      );

    },

    // ----------------------------------------------------------
    // BUTTON
    // ----------------------------------------------------------

    createButton(
      label,
      page,
      disabled,
      active = false
    ) {

      const button =
        document.createElement("button");

      button.type =
        "button";

      button.className =
        "ghar-pagination-button";

      if (active) {
        button.classList.add(
          "is-active"
        );

        button.setAttribute(
          "aria-current",
          "page"
        );
      }

      button.disabled =
        disabled;

      button.textContent =
        label;

      if (!disabled) {

        button.addEventListener(
          "click",
          () => {

            const state =
              Array.from(
                this.instances.values()
              ).find(
                item =>
                  item.element &&
                  item.element.contains(
                    button
                  )
              );

            if (state) {
              this.goTo(
                state,
                page
              );
            }

          }
        );

      }

      return button;

    },

    // ----------------------------------------------------------
    // GO TO PAGE
    // ----------------------------------------------------------

    goTo(
      state,
      page
    ) {

      const target =
        Math.max(
          1,
          Math.min(
            Number(page),
            state.totalPages
          )
        );

      if (
        target ===
        state.currentPage
      ) {
        return;
      }

      state.currentPage =
        target;

      this.render(
        state
      );

      if (
        typeof state.onChange ===
        "function"
      ) {

        state.onChange(
          target,
          state
        );

      }

      this.emit(
        "ghar:pagination-change",
        {
          page: target,
          state
        }
      );

    },

    // ----------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------

    update(
      state,
      options = {}
    ) {

      Object.assign(
        state,
        options
      );

      state.currentPage =
        Math.max(
          1,
          Math.min(
            state.currentPage,
            state.totalPages
          )
        );

      this.render(
        state
      );

    },

    // ----------------------------------------------------------
    // PAGE RANGE
    // ----------------------------------------------------------

    getPageRange(
      current,
      total,
      maxButtons
    ) {

      if (
        total <= maxButtons
      ) {

        return Array.from(
          {
            length: total
          },
          (_, index) =>
            index + 1
        );

      }

      const pages = [];

      pages.push(1);

      let start =
        Math.max(
          2,
          current - 1
        );

      let end =
        Math.min(
          total - 1,
          current + 1
        );

      if (
        current <= 3
      ) {

        start = 2;
        end = 4;

      }

      if (
        current >= total - 2
      ) {

        start =
          total - 3;

        end =
          total - 1;

      }

      if (start > 2) {
        pages.push("...");
      }

      for (
        let i = start;
        i <= end;
        i++
      ) {
        pages.push(i);
      }

      if (
        end < total - 1
      ) {
        pages.push("...");
      }

      pages.push(total);

      return pages;

    },

    // ----------------------------------------------------------
    // HELPERS
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

  GHAR.Pagination =
    Pagination;

  window.GHARPagination =
    Pagination;

})(window, document);