// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/uploader.js
// Enterprise File Upload / Drag & Drop Manager
// ============================================================

"use strict";

(function (window, document) {

  const GHAR = window.GHAR = window.GHAR || {};

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const CONFIG = {

    version: "2.0.0",

    defaults: {

      multiple: true,

      maxFiles: 20,

      maxSize:
        10 * 1024 * 1024,

      accept: [],

      uploadUrl:
        GHAR.API?.DOCUMENTS
          ? `${GHAR.API.DOCUMENTS}/upload`
          : "/api/documents/upload",

      fieldName:
        "files",

      autoUpload: false,

      credentials:
        "include",

      withProgress: true,

      allowDuplicates: false,

      preview: true,

      roleRequired: false,

      allowedRoles: [
        "BUYER",
        "SELLER",
        "TENANT",
        "AGENT",
        "BUSINESS",
        "ADMIN"
      ]

    }

  };

  // ==========================================================
  // STATE
  // ==========================================================

  const Uploader = {

    version:
      CONFIG.version,

    instances: [],

    // ========================================================
    // INITIALIZE
    // ========================================================

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

          if (
            element._gharUploader
          ) {
            return;
          }

          this.create(
            element,
            options
          );

        }
      );

      return this.instances;

    },

    // ========================================================
    // CREATE
    // ========================================================

    create(
      element,
      options = {}
    ) {

      if (!element) {
        return null;
      }

      const config = {

        ...CONFIG.defaults,

        ...options

      };

      const input =
        element.querySelector(
          'input[type="file"]'
        );

      if (!input) {

        console.warn(
          "[GHAR UPLOADER] File input not found."
        );

        return null;

      }

      input.multiple =
        Boolean(config.multiple);

      if (
        Array.isArray(config.accept) &&
        config.accept.length
      ) {

        input.accept =
          config.accept.join(",");

      }

      const state = {

        id:
          element.dataset.uploaderId ||
          `uploader-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        element,

        input,

        config,

        files: [],

        uploaded: [],

        uploading: false,

        progress: 0,

        xhr: null,

        destroyed: false

      };

      element._gharUploader =
        state;

      this.instances.push(
        state
      );

      this.bind(
        state
      );

      this.emit(
        "ghar:upload:initialized",
        {
          uploader: state
        }
      );

      return state;

    },

    // ========================================================
    // EVENTS
    // ========================================================

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

          input.value = "";

        }
      );

      element.addEventListener(
        "dragover",
        event => {

          event.preventDefault();

          if (
            state.uploading
          ) {
            return;
          }

          element.classList.add(
            "is-dragging"
          );

          this.emit(
            "ghar:upload:dragover",
            {
              uploader: state
            }
          );

        }
      );

      element.addEventListener(
        "dragleave",
        event => {

          if (
            !element.contains(
              event.relatedTarget
            )
          ) {

            element.classList.remove(
              "is-dragging"
            );

          }

        }
      );

      element.addEventListener(
        "drop",
        event => {

          event.preventDefault();

          element.classList.remove(
            "is-dragging"
          );

          if (
            state.uploading
          ) {
            return;
          }

          this.addFiles(
            state,
            event.dataTransfer?.files
          );

        }
      );

    },

    // ========================================================
    // ROLE VALIDATION
    // ========================================================

    getCurrentRole() {

      const profile =
        GHAR.Profile &&
        typeof GHAR.Profile.get ===
          "function"
          ? GHAR.Profile.get()
          : null;

      const role =
        profile?.role ||
        localStorage.getItem(
          GHAR.STORAGE_KEYS?.ROLE ||
          "ghar_role"
        ) ||
        document.body.dataset.role;

      return role
        ? String(role)
            .trim()
            .toUpperCase()
        : null;

    },

    canUpload(
      state
    ) {

      if (
        !state.config.roleRequired
      ) {
        return true;
      }

      const role =
        this.getCurrentRole();

      if (!role) {
        return false;
      }

      return state.config.allowedRoles
        .map(
          value =>
            String(value)
              .toUpperCase()
        )
        .includes(role);

    },

    // ========================================================
    // ADD FILES
    // ========================================================

    addFiles(
      state,
      fileList
    ) {

      if (
        !state ||
        state.destroyed
      ) {
        return [];
      }

      if (
        !this.canUpload(state)
      ) {

        this.notify(
          "You do not have permission to upload files.",
          "error"
        );

        return [];

      }

      const files =
        Array.from(
          fileList || []
        );

      const accepted = [];

      for (
        const file of files
      ) {

        if (
          state.files.length >=
          state.config.maxFiles
        ) {

          this.notify(
            `Maximum ${state.config.maxFiles} files allowed.`,
            "warning"
          );

          break;

        }

        const validation =
          this.validateFile(
            file,
            state.config,
            state.files
          );

        if (
          !validation.valid
        ) {

          this.notify(
            validation.message,
            "error"
          );

          continue;

        }

        state.files.push(
          file
        );

        accepted.push(
          file
        );

      }

      this.render(
        state
      );

      this.emit(
        "ghar:upload:files-added",
        {
          uploader: state,
          files: accepted
        }
      );

      if (
        state.config.autoUpload &&
        accepted.length
      ) {

        this.upload(
          state
        );

      }

      return accepted;

    },

    // ========================================================
    // VALIDATION
    // ========================================================

    validateFile(
      file,
      config,
      existingFiles = []
    ) {

      if (!file) {

        return {
          valid: false,
          message: "Invalid file."
        };

      }

      if (
        file.size <= 0
      ) {

        return {
          valid: false,
          message:
            `${file.name} is empty.`
        };

      }

      if (
        file.size >
        config.maxSize
      ) {

        return {
          valid: false,
          message:
            `${file.name} exceeds the maximum file size of ${this.formatSize(
              config.maxSize
            )}.`
        };

      }

      if (
        !config.allowDuplicates
      ) {

        const duplicate =
          existingFiles.some(
            existing =>
              existing.name === file.name &&
              existing.size === file.size &&
              existing.lastModified ===
                file.lastModified
          );

        if (duplicate) {

          return {
            valid: false,
            message:
              `${file.name} is already selected.`
          };

        }

      }

      if (
        Array.isArray(config.accept) &&
        config.accept.length
      ) {

        const valid =
          config.accept.some(
            type => {

              const expected =
                String(type)
                  .toLowerCase();

              const mime =
                String(file.type)
                  .toLowerCase();

              const name =
                String(file.name)
                  .toLowerCase();

              if (
                expected.endsWith("/*")
              ) {

                return mime.startsWith(
                  expected.slice(0, -1)
                );

              }

              return (
                mime === expected ||
                name.endsWith(expected)
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

    // ========================================================
    // REMOVE
    // ========================================================

    remove(
      state,
      index
    ) {

      if (
        !state ||
        index < 0 ||
        index >= state.files.length
      ) {
        return false;
      }

      const [
        file
      ] =
        state.files.splice(
          index,
          1
        );

      this.render(
        state
      );

      this.emit(
        "ghar:upload:file-removed",
        {
          uploader: state,
          file,
          index
        }
      );

      return true;

    },

    // ========================================================
    // CLEAR
    // ========================================================

    clear(
      state
    ) {

      if (!state) {
        return;
      }

      state.files = [];

      state.uploaded = [];

      state.progress = 0;

      this.render(
        state
      );

      this.emit(
        "ghar:upload:cleared",
        {
          uploader: state
        }
      );

    },

    // ========================================================
    // RENDER
    // ========================================================

    render(
      state
    ) {

      if (!state) {
        return;
      }

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
            document.createElement(
              "div"
            );

          item.className =
            "ghar-upload-item";

          item.dataset.index =
            index;

          const preview =
            this.createPreview(
              file,
              state.config
            );

          item.innerHTML = `

            ${
              preview
                ? `
                  <div
                    class="ghar-upload-preview"
                    data-upload-preview
                  >
                    ${preview}
                  </div>
                `
                : ""
            }

            <div
              class="ghar-upload-info"
            >

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
              class="ghar-upload-remove"
              data-remove-upload="${index}"
              aria-label="Remove ${this.escapeHTML(
                file.name
              )}"
              ${
                state.uploading
                  ? "disabled"
                  : ""
              }
            >
              &times;
            </button>

          `;

          item
            .querySelector(
              "[data-remove-upload]"
            )
            ?.addEventListener(
              "click",
              () => {

                this.remove(
                  state,
                  index
                );

              }
            );

          list.appendChild(
            item
          );

        }
      );

    },

    // ========================================================
    // PREVIEW
    // ========================================================

    createPreview(
      file,
      config
    ) {

      if (
        !config.preview
      ) {
        return "";
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        return "";
      }

      try {

        const url =
          URL.createObjectURL(
            file
          );

        return `
          <img
            src="${url}"
            alt="${this.escapeHTML(
              file.name
            )}"
            class="ghar-upload-image-preview"
            loading="lazy"
          >
        `;

      } catch {
        return "";
      }

    },

    // ========================================================
    // UPLOAD
    // ========================================================

    upload(
      state,
      url = null
    ) {

      if (
        !state ||
        state.destroyed
      ) {

        return Promise.resolve({
          ok: false,
          error: "Uploader is unavailable."
        });

      }

      if (
        state.uploading
      ) {

        return Promise.resolve({
          ok: false,
          error: "Upload already in progress."
        });

      }

      if (
        !state.files.length
      ) {

        this.notify(
          "No files selected.",
          "warning"
        );

        return Promise.resolve({
          ok: false,
          error: "No files selected."
        });

      }

      if (
        !this.canUpload(state)
      ) {

        this.notify(
          "You do not have permission to upload files.",
          "error"
        );

        return Promise.resolve({
          ok: false,
          error: "Upload permission denied."
        });

      }

      state.uploading = true;

      state.progress = 0;

      this.setUploadingUI(
        state,
        true
      );

      this.emit(
        "ghar:upload:start",
        {
          uploader: state,
          files: state.files
        }
      );

      return new Promise(
        resolve => {

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

          const xhr =
            new XMLHttpRequest();

          state.xhr =
            xhr;

          xhr.open(
            "POST",
            url ||
              state.config.uploadUrl,
            true
          );

          xhr.withCredentials =
            state.config.credentials ===
            "include";

          const token =
            localStorage.getItem(
              GHAR.STORAGE_KEYS?.ACCESS_TOKEN ||
              "ghar_access_token"
            ) ||
            localStorage.getItem(
              "ghar_token"
            );

          if (token) {

            xhr.setRequestHeader(
              "Authorization",
              `Bearer ${token}`
            );

          }

          xhr.setRequestHeader(
            "Accept",
            "application/json"
          );

          xhr.upload.addEventListener(
            "progress",
            event => {

              if (
                !event.lengthComputable
              ) {
                return;
              }

              state.progress =
                Math.round(
                  (
                    event.loaded /
                    event.total
                  ) * 100
                );

              this.updateProgress(
                state
              );

              this.emit(
                "ghar:upload:progress",
                {
                  uploader: state,
                  progress:
                    state.progress,
                  loaded:
                    event.loaded,
                  total:
                    event.total
                }
              );

            }
          );

          xhr.onload =
            async () => {

              let data = {};

              try {

                data =
                  xhr.responseText
                    ? JSON.parse(
                        xhr.responseText
                      )
                    : {};

              } catch {
                data = {};
              }

              const success =
                xhr.status >= 200 &&
                xhr.status < 300;

              state.uploading =
                false;

              state.xhr =
                null;

              state.progress =
                success
                  ? 100
                  : 0;

              this.setUploadingUI(
                state,
                false
              );

              if (success) {

                state.uploaded =
                  Array.isArray(
                    data.files
                  )
                    ? data.files
                    : data.data ||
                      [];

                this.emit(
                  "ghar:upload:success",
                  {
                    uploader: state,
                    data,
                    files:
                      state.files,
                    uploaded:
                      state.uploaded
                  }
                );

                this.notify(
                  data.message ||
                    "Files uploaded successfully.",
                  "success"
                );

                resolve({
                  ok: true,
                  data,
                  files:
                    state.uploaded
                });

              } else {

                const message =
                  data.error ||
                  data.message ||
                  `Upload failed (${xhr.status}).`;

                this.handleUploadError(
                  state,
                  new Error(message)
                );

                resolve({
                  ok: false,
                  error: message
                });

              }

            };

          xhr.onerror =
            () => {

              state.uploading =
                false;

              state.xhr =
                null;

              this.setUploadingUI(
                state,
                false
              );

              const error =
                new Error(
                  "Network error during file upload."
                );

              this.handleUploadError(
                state,
                error
              );

              resolve({
                ok: false,
                error:
                  error.message
              });

            };

          xhr.onabort =
            () => {

              state.uploading =
                false;

              state.xhr =
                null;

              this.setUploadingUI(
                state,
                false
              );

              this.emit(
                "ghar:upload:cancelled",
                {
                  uploader: state
                }
              );

              resolve({
                ok: false,
                cancelled: true,
                error:
                  "Upload cancelled."
              });

            };

          xhr.send(
            formData
          );

        }
      );

    },

    // ========================================================
    // CANCEL
    // ========================================================

    cancel(
      state
    ) {

      if (
        state?.xhr &&
        state.uploading
      ) {

        state.xhr.abort();

        return true;

      }

      return false;

    },

    // ========================================================
    // UPLOAD UI
    // ========================================================

    setUploadingUI(
      state,
      uploading
    ) {

      state.element.classList.toggle(
        "is-uploading",
        uploading
      );

      state.element
        .querySelectorAll(
          "[data-upload-loading]"
        )
        .forEach(
          element => {

            element.hidden =
              !uploading;

          }
        );

      state.element
        .querySelectorAll(
          "[data-upload-cancel]"
        )
        .forEach(
          element => {

            element.hidden =
              !uploading;

          }
        );

      this.updateProgress(
        state
      );

    },

    // ========================================================
    // PROGRESS
    // ========================================================

    updateProgress(
      state
    ) {

      state.element
        .querySelectorAll(
          "[data-upload-progress]"
        )
        .forEach(
          element => {

            if (
              element.tagName ===
              "PROGRESS"
            ) {

              element.value =
                state.progress;

            } else {

              element.textContent =
                `${state.progress}%`;

            }

          }
        );

      state.element
        .querySelectorAll(
          "[data-upload-progress-bar]"
        )
        .forEach(
          element => {

            element.style.width =
              `${state.progress}%`;

          }
        );

    },

    // ========================================================
    // ERROR HANDLER
    // ========================================================

    handleUploadError(
      state,
      error
    ) {

      this.emit(
        "ghar:upload:error",
        {
          uploader: state,
          error
        }
      );

      this.notify(
        error.message ||
          "Upload failed.",
        "error"
      );

    },

    // ========================================================
    // NOTIFICATION
    // ========================================================

    notify(
      message,
      type = "info"
    ) {

      if (
        GHAR.Toast &&
        typeof GHAR.Toast[type] ===
          "function"
      ) {

        GHAR.Toast[type](
          message
        );

      } else if (
        window.GHARTOAST &&
        typeof window.GHARTOAST[type] ===
          "function"
      ) {

        window.GHARTOAST[type](
          message
        );

      }

    },

    // ========================================================
    // HELPERS
    // ========================================================

    formatSize(
      bytes
    ) {

      const value =
        Number(bytes);

      if (
        !Number.isFinite(value) ||
        value <= 0
      ) {

        return "0 B";

      }

      const units = [
        "B",
        "KB",
        "MB",
        "GB"
      ];

      const index =
        Math.min(
          Math.floor(
            Math.log(value) /
            Math.log(1024)
          ),
          units.length - 1
        );

      return `${(
        value /
        Math.pow(
          1024,
          index
        )
      ).toFixed(
        index === 0
          ? 0
          : 2
      )} ${units[index]}`;

    },

    escapeHTML(
      value
    ) {

      return String(
        value ?? ""
      )
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

    // ========================================================
    // DESTROY
    // ========================================================

    destroy(
      state
    ) {

      if (!state) {
        return;
      }

      this.cancel(
        state
      );

      state.destroyed =
        true;

      if (
        state.element
      ) {

        delete state.element
          ._gharUploader;

      }

      const index =
        this.instances.indexOf(
          state
        );

      if (index !== -1) {

        this.instances.splice(
          index,
          1
        );

      }

    },

    // ========================================================
    // GET INSTANCE
    // ========================================================

    get(
      element
    ) {

      return (
        element?._gharUploader ||
        null
      );

    }

  };

  // ==========================================================
  // PUBLIC GHAR API
  // ==========================================================

  GHAR.Uploader =
    Uploader;

  window.GHARUploader =
    Uploader;

  // ==========================================================
  // AUTO INITIALIZATION
  // ==========================================================

  const initialize =
    () => {

      Uploader.init();

    };

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      {
        once: true
      }
    );

  } else {

    initialize();

  }

})(window, document);