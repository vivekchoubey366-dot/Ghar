// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/forms.js
// Global Form Manager
// ============================================================

"use strict";

(() => {
  // ----------------------------------------------------------
  // CONFIG
  // ----------------------------------------------------------

  const Forms = {
    version: "1.0.0",

    selectors: {
      form: "form",
      required: "[required]",
      error: ".form-error",
      fieldError: ".field-error",
      success: ".form-success",
      password: "[data-password-toggle]",
      file: 'input[type="file"]',
      submit: 'button[type="submit"], input[type="submit"]'
    },

    classes: {
      error: "is-invalid",
      valid: "is-valid",
      loading: "is-loading",
      hidden: "is-hidden"
    }
  };

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  function $(selector, parent = document) {
    return parent.querySelector(selector);
  }

  function $$(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  }

  function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
  }

  function getFieldName(field) {
    return (
      field.name ||
      field.id ||
      field.getAttribute("data-field") ||
      "field"
    );
  }

  // ----------------------------------------------------------
  // ERROR HANDLING
  // ----------------------------------------------------------

  function getErrorElement(field) {
    const id = field.id;

    if (id) {
      const linked = document.querySelector(
        `[data-error-for="${CSS.escape(id)}"]`
      );

      if (linked) {
        return linked;
      }
    }

    let error = field.parentElement?.querySelector(
      Forms.selectors.fieldError
    );

    if (!error && field.parentElement) {
      error = document.createElement("div");
      error.className = "field-error";
      error.setAttribute("role", "alert");
      error.hidden = true;

      field.parentElement.appendChild(error);
    }

    return error;
  }

  function setError(field, message) {
    field.classList.remove(Forms.classes.valid);
    field.classList.add(Forms.classes.error);

    field.setAttribute("aria-invalid", "true");

    const error = getErrorElement(field);

    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
  }

  function clearError(field) {
    field.classList.remove(Forms.classes.error);
    field.classList.add(Forms.classes.valid);

    field.removeAttribute("aria-invalid");

    const error = getErrorElement(field);

    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
  }

  function clearFieldState(field) {
    field.classList.remove(
      Forms.classes.error,
      Forms.classes.valid
    );

    field.removeAttribute("aria-invalid");

    const error = getErrorElement(field);

    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
  }

  // ----------------------------------------------------------
  // VALUE HELPERS
  // ----------------------------------------------------------

  function getValue(field) {
    if (
      field.type === "checkbox"
    ) {
      return field.checked;
    }

    if (
      field.type === "radio"
    ) {
      return field.checked
        ? field.value
        : "";
    }

    return String(field.value || "").trim();
  }

  // ----------------------------------------------------------
  // VALIDATORS
  // ----------------------------------------------------------

  const validators = {
    required(field) {
      if (
        field.type === "checkbox"
      ) {
        return field.checked;
      }

      return String(field.value || "").trim().length > 0;
    },

    email(field) {
      const value = getValue(field);

      if (!value) {
        return true;
      }

      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },

    phone(field) {
      const value = getValue(field);

      if (!value) {
        return true;
      }

      return /^[+]?[0-9\s()-]{7,20}$/.test(value);
    },

    password(field) {
      const value = getValue(field);

      if (!value) {
        return true;
      }

      return value.length >= 8;
    },

    number(field) {
      const value = getValue(field);

      if (!value) {
        return true;
      }

      return Number.isFinite(Number(value));
    },

    minLength(field) {
      const min = Number(
        field.dataset.minLength ||
        field.getAttribute("minlength")
      );

      if (!min) {
        return true;
      }

      return getValue(field).length >= min;
    },

    maxLength(field) {
      const max = Number(
        field.dataset.maxLength ||
        field.getAttribute("maxlength")
      );

      if (!max) {
        return true;
      }

      return getValue(field).length <= max;
    },

    pattern(field) {
      const pattern =
        field.getAttribute("pattern");

      if (!pattern) {
        return true;
      }

      try {
        return new RegExp(
          `^(?:${pattern})$`
        ).test(getValue(field));
      } catch {
        return true;
      }
    },

    match(field) {
      const target =
        field.dataset.match;

      if (!target) {
        return true;
      }

      const other =
        document.querySelector(target);

      if (!other) {
        return true;
      }

      return getValue(field) === getValue(other);
    }
  };

  function validateField(field) {
    if (
      field.disabled ||
      field.type === "hidden"
    ) {
      return {
        valid: true,
        message: ""
      };
    }

    const value = getValue(field);

    if (
      field.required &&
      !validators.required(field)
    ) {
      return {
        valid: false,
        message:
          field.dataset.requiredMessage ||
          `${getFieldName(field)} is required.`
      };
    }

    if (
      field.type === "email" &&
      !validators.email(field)
    ) {
      return {
        valid: false,
        message: "Enter a valid email address."
      };
    }

    if (
      field.dataset.validate === "email" &&
      !validators.email(field)
    ) {
      return {
        valid: false,
        message: "Enter a valid email address."
      };
    }

    if (
      field.dataset.validate === "phone" &&
      !validators.phone(field)
    ) {
      return {
        valid: false,
        message: "Enter a valid phone number."
      };
    }

    if (
      field.dataset.validate === "password" &&
      !validators.password(field)
    ) {
      return {
        valid: false,
        message:
          "Password must contain at least 8 characters."
      };
    }

    if (
      field.type === "number" &&
      !validators.number(field)
    ) {
      return {
        valid: false,
        message: "Enter a valid number."
      };
    }

    if (
      !validators.minLength(field)
    ) {
      return {
        valid: false,
        message:
          `Minimum ${field.minLength || field.dataset.minLength} characters required.`
      };
    }

    if (
      !validators.maxLength(field)
    ) {
      return {
        valid: false,
        message:
          `Maximum ${field.maxLength || field.dataset.maxLength} characters allowed.`
      };
    }

    if (
      !validators.pattern(field)
    ) {
      return {
        valid: false,
        message:
          field.dataset.patternMessage ||
          "Enter a valid value."
      };
    }

    if (
      !validators.match(field)
    ) {
      return {
        valid: false,
        message:
          field.dataset.matchMessage ||
          "Values do not match."
      };
    }

    return {
      valid: true,
      message: ""
    };
  }

  // ----------------------------------------------------------
  // FORM VALIDATION
  // ----------------------------------------------------------

  function validateForm(form) {
    let valid = true;
    let firstInvalid = null;

    const fields = $$(
      "input, textarea, select",
      form
    );

    fields.forEach(field => {
      const result =
        validateField(field);

      if (!result.valid) {
        valid = false;

        setError(
          field,
          result.message
        );

        if (!firstInvalid) {
          firstInvalid = field;
        }
      } else if (
        getValue(field)
      ) {
        clearError(field);
      }
    });

    if (firstInvalid) {
      firstInvalid.focus({
        preventScroll: false
      });
    }

    return valid;
  }

  // ----------------------------------------------------------
  // FORM DATA
  // ----------------------------------------------------------

  function serialize(form) {
    const formData =
      new FormData(form);

    const data = {};

    for (
      const [key, value]
      of formData.entries()
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          data,
          key
        )
      ) {
        if (
          !Array.isArray(data[key])
        ) {
          data[key] = [
            data[key]
          ];
        }

        data[key].push(value);
      } else {
        data[key] = value;
      }
    }

    return data;
  }

  // ----------------------------------------------------------
  // SUBMIT BUTTON
  // ----------------------------------------------------------

  function setLoading(
    form,
    loading
  ) {
    form.classList.toggle(
      Forms.classes.loading,
      loading
    );

    const buttons = $$(
      Forms.selectors.submit,
      form
    );

    buttons.forEach(button => {
      if (loading) {
        button.dataset.originalText =
          button.textContent;

        button.disabled = true;

        button.setAttribute(
          "aria-busy",
          "true"
        );

        button.textContent =
          button.dataset.loadingText ||
          "Processing...";
      } else {
        button.disabled = false;

        button.removeAttribute(
          "aria-busy"
        );

        if (
          button.dataset.originalText
        ) {
          button.textContent =
            button.dataset.originalText;

          delete button.dataset.originalText;
        }
      }
    });
  }

  // ----------------------------------------------------------
  // SUCCESS MESSAGE
  // ----------------------------------------------------------

  function showSuccess(
    form,
    message
  ) {
    let element =
      form.querySelector(
        Forms.selectors.success
      );

    if (!element) {
      element =
        document.createElement("div");

      element.className =
        "form-success";

      element.setAttribute(
        "role",
        "status"
      );

      form.prepend(element);
    }

    element.textContent =
      message || "Successfully submitted.";

    element.hidden = false;
  }

  // ----------------------------------------------------------
  // FORM RESET
  // ----------------------------------------------------------

  function reset(form) {
    form.reset();

    $$(
      "input, textarea, select",
      form
    ).forEach(clearFieldState);

    const success =
      form.querySelector(
        Forms.selectors.success
      );

    if (success) {
      success.hidden = true;
    }
  }

  // ----------------------------------------------------------
  // PASSWORD VISIBILITY
  // ----------------------------------------------------------

  function togglePassword(button) {
    const selector =
      button.dataset.passwordToggle;

    if (!selector) {
      return;
    }

    const input =
      document.querySelector(selector);

    if (!input) {
      return;
    }

    const showing =
      input.type === "text";

    input.type =
      showing
        ? "password"
        : "text";

    button.setAttribute(
      "aria-pressed",
      String(!showing)
    );

    button.setAttribute(
      "aria-label",
      showing
        ? "Show password"
        : "Hide password"
    );
  }

  // ----------------------------------------------------------
  // FILE VALIDATION
  // ----------------------------------------------------------

  function validateFile(field) {
    const files =
      Array.from(field.files || []);

    if (!files.length) {
      return {
        valid: true,
        message: ""
      };
    }

    const maxSize =
      Number(
        field.dataset.maxSize ||
        10
      ) * 1024 * 1024;

    const allowedTypes =
      field.dataset.allowedTypes
        ? field.dataset.allowedTypes
            .split(",")
            .map(type =>
              type.trim().toLowerCase()
            )
        : [];

    for (const file of files) {
      if (
        file.size > maxSize
      ) {
        return {
          valid: false,
          message:
            `File "${file.name}" exceeds the allowed size.`
        };
      }

      if (
        allowedTypes.length &&
        !allowedTypes.includes(
          file.type.toLowerCase()
        )
      ) {
        return {
          valid: false,
          message:
            `File type "${file.type || "unknown"}" is not allowed.`
        };
      }
    }

    return {
      valid: true,
      message: ""
    };
  }

  // ----------------------------------------------------------
  // EVENT HANDLERS
  // ----------------------------------------------------------

  function handleInput(event) {
    const field =
      event.target;

    if (
      !field.matches(
        "input, textarea, select"
      )
    ) {
      return;
    }

    const result =
      validateField(field);

    if (
      result.valid &&
      getValue(field)
    ) {
      clearError(field);
    } else if (
      !result.valid
    ) {
      setError(
        field,
        result.message
      );
    }
  }

  function handleBlur(event) {
    const field =
      event.target;

    if (
      !field.matches(
        "input, textarea, select"
      )
    ) {
      return;
    }

    const result =
      validateField(field);

    if (
      !result.valid
    ) {
      setError(
        field,
        result.message
      );
    } else if (
      getValue(field)
    ) {
      clearError(field);
    }
  }

  function handleFileChange(event) {
    const field =
      event.target;

    if (
      field.type !== "file"
    ) {
      return;
    }

    const result =
      validateFile(field);

    if (!result.valid) {
      setError(
        field,
        result.message
      );

      field.value = "";
    } else {
      clearError(field);
    }
  }

  function handlePasswordToggle(event) {
    const button =
      event.target.closest(
        Forms.selectors.password
      );

    if (!button) {
      return;
    }

    togglePassword(button);
  }

  function handleSubmit(event) {
    const form =
      event.target;

    if (
      !form.matches(
        Forms.selectors.form
      )
    ) {
      return;
    }

    if (
      form.dataset.noValidate === "true"
    ) {
      return;
    }

    if (
      !validateForm(form)
    ) {
      event.preventDefault();

      form.dispatchEvent(
        new CustomEvent(
          "ghar:form-invalid",
          {
            bubbles: true,
            detail: {
              form
            }
          }
        )
      );

      return;
    }

    form.dispatchEvent(
      new CustomEvent(
        "ghar:form-valid",
        {
          bubbles: true,
          detail: {
            form,
            data: serialize(form)
          }
        }
      )
    );

    if (
      form.dataset.loading === "true"
    ) {
      setLoading(
        form,
        true
      );
    }
  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  function init(root = document) {
    if (!root) {
      return;
    }

    root.addEventListener(
      "input",
      handleInput
    );

    root.addEventListener(
      "blur",
      handleBlur,
      true
    );

    root.addEventListener(
      "change",
      handleFileChange
    );

    root.addEventListener(
      "click",
      handlePasswordToggle
    );

    root.addEventListener(
      "submit",
      handleSubmit
    );
  }

  // ----------------------------------------------------------
  // GLOBAL EXPORT
  // ----------------------------------------------------------

  window.GHAR =
    window.GHAR || {};

  window.GHAR.Forms = {
    ...Forms,

    init,
    validateField,
    validateForm,
    serialize,
    reset,
    setLoading,
    showSuccess,
    setError,
    clearError,
    validateFile
  };

  // ----------------------------------------------------------
  // AUTO INIT
  // ----------------------------------------------------------

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      () => init()
    );
  } else {
    init();
  }

})();