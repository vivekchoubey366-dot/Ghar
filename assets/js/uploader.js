// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/Uploader.js
// File Upload / Drag & Drop Manager
// ============================================================

"use strict";

(function (window, document) {

  const GHAR = window.GHAR = window.GHAR || {};

  const Uploader = {

    // ----------------------------------------------------------
    // DEFAULT CONFIG
    // ----------------------------------------------------------

    defaults: {

      multiple: true,

      maxFiles: 20,

      maxSize:
        10 * 1024 * 1024,

      accept: [],

      uploadUrl:
        "/api/documents/upload",

      fieldName:
        "files",

      autoUpload: false

    },

    instances: [],

    // ----------------------------------------------------------
    // INITIALIZE
    // ----------------------------------------------------------

    init(
      selector = "[data-ghar-uploader]",
      options = {}
    ) {

      const elements =
        document.querySelectorAll(
          selector
        );

      elements.forEach(
        element => {

          this.create(
            element,
            options
          );

        }
      );

      return this.instances;

    },

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

      const config = {
        ...this.defaults,
        ...options
      };

      const input =
        element.querySelector(
          'input[type="file"]'
        );

      if (!input) {
        return null;
      }

      input.multiple =
        config.multiple;

      if (
        config.accept.length
      ) {

        input.accept =
          config.accept.join(",");

      }

      const state = {

        element,

        input,

        config,

        files: []

      };

      element._gharUploader =
        state;

      this.instances.push(
        state
      );

      this.bind(
        state
      );

      return state;

    },

    // ----------------------------------------------------------
    // EVENTS
    // ----------------------------------------------------------

    bind(
      state
    ) {

      const {
        element,
        input
      } = state;

      input.addEventListener(
        "change",
        event => {

          this.addFiles(
            state,
            event.target.files
          );

        }
      );

      element.addEventListener(
        "dragover",
        event => {

          event.preventDefault();

          element.classList.add(
            "is-dragging"
          );

        }
      );

      element.addEventListener(
        "dragleave",
        () => {

          element.classList.remove(
            "is-dragging"
          );

        }
      );

      element.addEventListener(
        "drop",
        event => {

          event.preventDefault();

          element.classList.remove(
            "is-dragging"
          );

          this.addFiles(
            state,
            event.dataTransfer.files
          );

        }
      );

    },

    // ----------------------------------------------------------
    // ADD FILES
    // ----------------------------------------------------------

    addFiles(
      state,
      fileList
    ) {

      const files =
        Array.from(fileList || []);

      for (const file of files) {

        if (
          state.files.length >=
          state.config.maxFiles
        ) {
          break;
        }

        const validation =
          this.validateFile(
            file,
            state.config
          );

        if (!validation.valid) {

          if (
            GHAR.Toast
          ) {

            GHAR.Toast.error(
              validation.message
            );

          }

          continue;
        }

        state.files.push(
          file
        );

      }

      this.render(
        state
      );

      if (
        state.config.autoUpload
      ) {

        this.upload(
          state
        );

      }

    },

    // ----------------------------------------------------------
    // VALIDATE
    // ----------------------------------------------------------

    validateFile(
      file,
      config
    ) {

      if (
        !file
      ) {

        return {
          valid: false,
          message: "Invalid file."
        };

      }

      if (
        file.size >
        config.maxSize
      ) {

        return {
          valid: false,
          message:
            `${file.name} exceeds the maximum file size.`
        };

      }

      if (
        config.accept.length
      ) {

        const valid =
          config.accept.some(
            type => {

              if (
                type.endsWith("/*")
              ) {

                return file.type.startsWith(
                  type.replace("/*", "")
                );

              }

              return (
                file.type === type ||
                file.name
                  .toLowerCase()
                  .endsWith(
                    type.toLowerCase()
                  )
              );

            }
          );

        if (!valid) {

          return {
            valid: false,
            message:
              `${file.name} is not an accepted file type.`
          };

        }

      }

      return {
        valid: true
      };

    },

    // ----------------------------------------------------------
    // REMOVE
    // ----------------------------------------------------------

    remove(
      state,
      index
    ) {

      if (
        index < 0 ||
        index >= state.files.length
      ) {
        return;
      }

      state.files.splice(
        index,
        1
      );

      this.render(
        state
      );

    },

    // ----------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------

    render(
      state
    ) {

      const list =
        state.element.querySelector(
          "[data-upload-list]"
        );

      if (!list) {
        return;
      }

      list.innerHTML = "";

      state.files.forEach(
        (file, index) => {

          const item =
            document.createElement("div");

          item.className =
            "ghar-upload-item";

          item.innerHTML = `

            <div class="ghar-upload-info">

              <strong>
                ${this.escapeHTML(
                  file.name
                )}
              </strong>

              <small>
                ${this.formatSize(
                  file.size
                )}
              </small>

            </div>

            <button
              type="button"
              data-remove-upload="${index}"
              aria-label="Remove file"
            >
              &times;
            </button>

          `;

          item
            .querySelector(
              "[data-remove-upload]"
            )
            .addEventListener(
              "click",
              () => this.remove(
                state,
                index
              )
            );

          list.appendChild(
            item
          );

        }
      );

    },

    // ----------------------------------------------------------
    // UPLOAD
    // ----------------------------------------------------------

    async upload(
      state,
      url = null
    ) {

      if (!state.files.length) {

        return {
          ok: false,
          error: "No files selected."
        };

      }

      const formData =
        new FormData();

      state.files.forEach(
        file => {

          formData.append(
            state.config.fieldName,
            file
          );

        }
      );

      try {

        const response =
          await fetch(
            url ||
            state.config.uploadUrl,
            {
              method: "POST",
              body: formData,
              credentials: "include"
            }
          );

        const data =
          await response.json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            data.error ||
            "Upload failed."
          );
        }

        this.emit(
          "ghar:upload-success",
          {
            data,
            files: state.files
          }
        );

        return {
          ok: true,
          data
        };

      } catch (error) {

        this.emit(
          "ghar:upload-error",
          {
            error
          }
        );

        if (
          GHAR.Toast
        ) {

          GHAR.Toast.error(
            error.message
          );

        }

        return {
          ok: false,
          error: error.message
        };

      }

    },

    // ----------------------------------------------------------
    // HELPERS
    // ----------------------------------------------------------

    formatSize(
      bytes
    ) {

      if (!bytes) {
        return "0 B";
      }

      const units = [
        "B",
        "KB",
        "MB",
        "GB"
      ];

      const index =
        Math.floor(
          Math.log(bytes) /
          Math.log(1024)
        );

      return (
        `${(
          bytes /
          Math.pow(1024, index)
        ).toFixed(
          index === 0 ? 0 : 2
        )} ${units[index]}`
      );

    },

    escapeHTML(value) {

      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

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

    }

  };

  GHAR.Uploader = Uploader;

  window.GHARUploader = Uploader;

  document.addEventListener(
    "DOMContentLoaded",
    () => Uploader.init()
  );

})(window, document);