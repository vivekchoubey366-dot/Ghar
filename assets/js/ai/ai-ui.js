// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/ai/ai-ui.js
// GHAR AI UI LAYER
// ============================================================

"use strict";

(function (window, document) {

  const GHAR = window.GHAR || {};

  GHAR.ai = GHAR.ai || {};

  const AI_UI = {

    // ========================================================
    // CONFIGURATION
    // ========================================================

    config: {
      rootSelector: "[data-ghar-ai]",
      loadingClass: "is-loading",
      activeClass: "is-active",
      hiddenClass: "is-hidden",
      errorClass: "has-error",
      successClass: "is-success",
      disabledClass: "is-disabled"
    },

    // ========================================================
    // INITIALIZE
    // ========================================================

    init() {

      this.bindEvents();
      this.initializeContainers();
      this.initializeForms();
      this.initializeButtons();

      return this;
    },

    // ========================================================
    // FIND ELEMENT
    // ========================================================

    $(selector, root = document) {
      return root.querySelector(selector);
    },

    // ========================================================
    // FIND ALL
    // ========================================================

    $$(selector, root = document) {
      return Array.from(
        root.querySelectorAll(selector)
      );
    },

    // ========================================================
    // EVENT SYSTEM
    // ========================================================

    bindEvents() {

      document.addEventListener(
        "click",
        event => {

          const button =
            event.target.closest(
              "[data-ai-action]"
            );

          if (!button) {
            return;
          }

          const action =
            button.dataset.aiAction;

          this.handleAction(
            action,
            button,
            event
          );

        }
      );

      document.addEventListener(
        "submit",
        event => {

          const form =
            event.target.closest(
              "[data-ai-form]"
            );

          if (!form) {
            return;
          }

          this.handleForm(
            form,
            event
          );

        }
      );

    },

    // ========================================================
    // ACTION HANDLER
    // ========================================================

    async handleAction(
      action,
      element,
      event
    ) {

      switch (action) {

        case "open":
          this.open();
          break;

        case "close":
          this.close();
          break;

        case "toggle":
          this.toggle();
          break;

        case "clear":
          this.clear(element);
          break;

        case "copy":
          await this.copyResult(element);
          break;

        case "retry":
          this.retry(element);
          break;

        case "stop":
          this.stop(element);
          break;

        default:
          break;
      }

    },

    // ========================================================
    // AI CONTAINERS
    // ========================================================

    initializeContainers() {

      this.$$(
        this.config.rootSelector
      ).forEach(
        container => {

          if (
            !container.hasAttribute(
              "aria-live"
            )
          ) {

            container.setAttribute(
              "aria-live",
              "polite"
            );

          }

        }
      );

    },

    // ========================================================
    // AI FORMS
    // ========================================================

    initializeForms() {

      this.$$(
        "[data-ai-form]"
      ).forEach(
        form => {

          const submit =
            form.querySelector(
              "[type='submit']"
            );

          if (submit) {
            submit.dataset.originalText =
              submit.textContent.trim();
          }

        }
      );

    },

    // ========================================================
    // AI BUTTONS
    // ========================================================

    initializeButtons() {

      this.$$(
        "[data-ai-button]"
      ).forEach(
        button => {

          if (
            !button.dataset.originalText
          ) {

            button.dataset.originalText =
              button.textContent.trim();

          }

        }
      );

    },

    // ========================================================
    // OPEN AI UI
    // ========================================================

    open(
      selector = "[data-ghar-ai]"
    ) {

      const element =
        this.$(selector);

      if (!element) {
        return false;
      }

      element.classList.add(
        this.config.activeClass
      );

      element.classList.remove(
        this.config.hiddenClass
      );

      element.setAttribute(
        "aria-hidden",
        "false"
      );

      return true;
    },

    // ========================================================
    // CLOSE AI UI
    // ========================================================

    close(
      selector = "[data-ghar-ai]"
    ) {

      const element =
        this.$(selector);

      if (!element) {
        return false;
      }

      element.classList.remove(
        this.config.activeClass
      );

      element.classList.add(
        this.config.hiddenClass
      );

      element.setAttribute(
        "aria-hidden",
        "true"
      );

      return true;
    },

    // ========================================================
    // TOGGLE
    // ========================================================

    toggle(
      selector = "[data-ghar-ai]"
    ) {

      const element =
        this.$(selector);

      if (!element) {
        return false;
      }

      if (
        element.classList.contains(
          this.config.activeClass
        )
      ) {

        return this.close(
          selector
        );

      }

      return this.open(
        selector
      );

    },

    // ========================================================
    // LOADING STATE
    // ========================================================

    setLoading(
      container,
      loading = true,
      message = "GHAR AI is thinking..."
    ) {

      if (
        typeof container === "string"
      ) {

        container =
          this.$(container);

      }

      if (!container) {
        return;
      }

      const loader =
        container.querySelector(
          "[data-ai-loading]"
        );

      if (loading) {

        container.classList.add(
          this.config.loadingClass
        );

        if (loader) {

          loader.textContent =
            message;

          loader.hidden =
            false;

        }

        this.setDisabled(
          container,
          true
        );

      } else {

        container.classList.remove(
          this.config.loadingClass
        );

        if (loader) {
          loader.hidden = true;
        }

        this.setDisabled(
          container,
          false
        );

      }

    },

    // ========================================================
    // DISABLE / ENABLE
    // ========================================================

    setDisabled(
      container,
      disabled = true
    ) {

      if (
        typeof container === "string"
      ) {

        container =
          this.$(container);

      }

      if (!container) {
        return;
      }

      this.$$(
        "button, input, select, textarea",
        container
      ).forEach(
        element => {

          element.disabled =
            disabled;

          element.classList.toggle(
            this.config.disabledClass,
            disabled
          );

        }
      );

    },

    // ========================================================
    // BUTTON LOADING
    // ========================================================

    setButtonLoading(
      button,
      loading = true,
      text = "Processing..."
    ) {

      if (
        typeof button === "string"
      ) {

        button =
          this.$(button);

      }

      if (!button) {
        return;
      }

      if (
        !button.dataset.originalText
      ) {

        button.dataset.originalText =
          button.textContent.trim();

      }

      if (loading) {

        button.disabled =
          true;

        button.classList.add(
          this.config.loadingClass
        );

        button.setAttribute(
          "aria-busy",
          "true"
        );

        button.textContent =
          text;

      } else {

        button.disabled =
          false;

        button.classList.remove(
          this.config.loadingClass
        );

        button.setAttribute(
          "aria-busy",
          "false"
        );

        button.textContent =
          button.dataset.originalText;

      }

    },

    // ========================================================
    // RESULT
    // ========================================================

    showResult(
      result,
      options = {}
    ) {

      const container =
        typeof options.container === "string"
          ? this.$(options.container)
          : options.container ||
            this.$(
              "[data-ai-result]"
            );

      if (!container) {
        return;
      }

      const text =
        this.normalizeResult(
          result
        );

      container.textContent =
        text;

      container.classList.remove(
        this.config.errorClass
      );

      container.classList.add(
        this.config.successClass
      );

      container.hidden =
        false;

      container.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });

    },

    // ========================================================
    // ERROR
    // ========================================================

    showError(
      error,
      options = {}
    ) {

      const container =
        typeof options.container === "string"
          ? this.$(options.container)
          : options.container ||
            this.$(
              "[data-ai-result]"
            );

      if (!container) {
        return;
      }

      const message =
        error?.message ||
        "GHAR AI could not complete the request.";

      container.textContent =
        message;

      container.classList.remove(
        this.config.successClass
      );

      container.classList.add(
        this.config.errorClass
      );

      container.hidden =
        false;

    },

    // ========================================================
    // NORMALIZE RESULT
    // ========================================================

    normalizeResult(result) {

      if (
        result === null ||
        result === undefined
      ) {

        return "";

      }

      if (
        typeof result === "string"
      ) {

        return result;

      }

      if (
        typeof result === "number" ||
        typeof result === "boolean"
      ) {

        return String(result);

      }

      if (
        result.answer
      ) {

        return String(
          result.answer
        );

      }

      if (
        result.message
      ) {

        return String(
          result.message
        );

      }

      if (
        result.data
      ) {

        if (
          typeof result.data ===
          "string"
        ) {

          return result.data;

        }

        return JSON.stringify(
          result.data,
          null,
          2
        );

      }

      return JSON.stringify(
        result,
        null,
        2
      );

    },

    // ========================================================
    // CLEAR RESULT
    // ========================================================

    clear(
      element
    ) {

      const container =
        element?.closest(
          "[data-ghar-ai]"
        ) ||
        this.$(
          "[data-ai-result]"
        );

      if (!container) {
        return;
      }

      const result =
        container.querySelector(
          "[data-ai-result]"
        ) ||
        container;

      result.textContent =
        "";

      result.hidden =
        true;

      result.classList.remove(
        this.config.errorClass,
        this.config.successClass
      );

    },

    // ========================================================
    // FORM HANDLER
    // ========================================================

    async handleForm(
      form,
      event
    ) {

      event.preventDefault();

      const action =
        form.dataset.aiForm;

      const button =
        form.querySelector(
          "[type='submit']"
        );

      const resultContainer =
        form.querySelector(
          "[data-ai-result]"
        ) ||
        this.$(
          "[data-ai-result]"
        );

      if (!action) {
        return;
      }

      const payload =
        this.serializeForm(
          form
        );

      this.setButtonLoading(
        button,
        true,
        "GHAR AI is thinking..."
      );

      this.setLoading(
        form,
        true
      );

      try {

        const client =
          GHAR.aiClient;

        if (
          !client ||
          typeof client[action] !==
          "function"
        ) {

          throw new Error(
            `AI operation "${action}" is not available.`
          );

        }

        const response =
          await client[action](
            payload
          );

        this.showResult(
          response,
          {
            container:
              resultContainer
          }
        );

        form.dispatchEvent(
          new CustomEvent(
            "ghar:ai:success",
            {
              detail: {
                action,
                payload,
                response
              }
            }
          )
        );

      } catch (error) {

        this.showError(
          error,
          {
            container:
              resultContainer
          }
        );

        form.dispatchEvent(
          new CustomEvent(
            "ghar:ai:error",
            {
              detail: {
                action,
                payload,
                error
              }
            }
          )
        );

      } finally {

        this.setButtonLoading(
          button,
          false
        );

        this.setLoading(
          form,
          false
        );

      }

    },

    // ========================================================
    // SERIALIZE FORM
    // ========================================================

    serializeForm(
      form
    ) {

      const formData =
        new FormData(
          form
        );

      const data = {};

      formData.forEach(
        (value, key) => {

          if (
            value instanceof File
          ) {

            if (value.name) {
              data[key] =
                value;
            }

            return;
          }

          if (
            Object.prototype.hasOwnProperty
              .call(data, key)
          ) {

            if (
              !Array.isArray(data[key])
            ) {

              data[key] = [
                data[key]
              ];

            }

            data[key].push(
              value
            );

          } else {

            data[key] =
              value;

          }

        }
      );

      return data;

    },

    // ========================================================
    // COPY RESULT
    // ========================================================

    async copyResult(
      element
    ) {

      const container =
        element?.closest(
          "[data-ghar-ai]"
        );

      const result =
        container?.querySelector(
          "[data-ai-result]"
        ) ||
        this.$(
          "[data-ai-result]"
        );

      if (
        !result ||
        !result.textContent.trim()
      ) {

        return false;

      }

      try {

        await navigator.clipboard.writeText(
          result.textContent
        );

        this.notify(
          "AI result copied."
        );

        return true;

      } catch (error) {

        console.warn(
          "[GHAR AI] Copy failed",
          error
        );

        return false;

      }

    },

    // ========================================================
    // RETRY
    // ========================================================

    retry(
      element
    ) {

      const form =
        element?.closest(
          "[data-ai-form]"
        );

      if (!form) {
        return;
      }

      const submit =
        form.querySelector(
          "[type='submit']"
        );

      if (submit) {
        submit.click();
      }

    },

    // ========================================================
    // STOP
    // ========================================================

    stop(
      element
    ) {

      const form =
        element?.closest(
          "[data-ai-form]"
        );

      if (!form) {
        return;
      }

      form.dispatchEvent(
        new CustomEvent(
          "ghar:ai:stop"
        )
      );

      this.setLoading(
        form,
        false
      );

    },

    // ========================================================
    // NOTIFICATION
    // ========================================================

    notify(
      message,
      type = "success"
    ) {

      if (
        GHAR.toast &&
        typeof GHAR.toast.show ===
        "function"
      ) {

        GHAR.toast.show(
          message,
          type
        );

        return;
      }

      const event =
        new CustomEvent(
          "ghar:toast",
          {
            detail: {
              message,
              type
            }
          }
        );

      document.dispatchEvent(
        event
      );

    },

    // ========================================================
    // CHAT MESSAGE
    // ========================================================

    addChatMessage(
      message,
      role = "assistant",
      container
    ) {

      if (
        typeof container === "string"
      ) {

        container =
          this.$(container);

      }

      container =
        container ||
        this.$(
          "[data-ai-chat-messages]"
        );

      if (!container) {
        return null;
      }

      const messageElement =
        document.createElement(
          "div"
        );

      messageElement.className =
        `ai-message ai-message-${role}`;

      messageElement.dataset.aiRole =
        role;

      messageElement.textContent =
        this.normalizeResult(
          message
        );

      container.appendChild(
        messageElement
      );

      container.scrollTop =
        container.scrollHeight;

      return messageElement;

    },

    // ========================================================
    // CHAT LOADING
    // ========================================================

    showChatLoading(
      container
    ) {

      if (
        typeof container === "string"
      ) {

        container =
          this.$(container);

      }

      container =
        container ||
        this.$(
          "[data-ai-chat-messages]"
        );

      if (!container) {
        return;
      }

      let loader =
        container.querySelector(
          "[data-ai-chat-loading]"
        );

      if (!loader) {

        loader =
          document.createElement(
            "div"
          );

        loader.className =
          "ai-message ai-message-loading";

        loader.dataset.aiChatLoading =
          "true";

        loader.textContent =
          "GHAR AI is typing...";

        container.appendChild(
          loader
        );

      }

      loader.hidden =
        false;

      container.scrollTop =
        container.scrollHeight;

    },

    // ========================================================
    // HIDE CHAT LOADING
    // ========================================================

    hideChatLoading(
      container
    ) {

      if (
        typeof container === "string"
      ) {

        container =
          this.$(container);

      }

      container =
        container ||
        this.$(
          "[data-ai-chat-messages]"
        );

      const loader =
        container?.querySelector(
          "[data-ai-chat-loading]"
        );

      if (loader) {
        loader.hidden = true;
      }

    }

  };

  // ==========================================================
  // EXPORT
  // ==========================================================

  GHAR.ai.ui =
    AI_UI;

  GHAR.aiUI =
    AI_UI;

  window.GHAR =
    GHAR;

  // ==========================================================
  // AUTO INITIALIZATION
  // ==========================================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () => AI_UI.init(),
      {
        once: true
      }
    );

  } else {

    AI_UI.init();

  }

})(window, document);