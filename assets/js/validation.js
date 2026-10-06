// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/validation.js
// Global frontend validation library
// ============================================================

"use strict";

(function (window, document) {

  // ==========================================================
  // GHAR NAMESPACE
  // ==========================================================

  window.GHAR = window.GHAR || {};

  const GHAR = window.GHAR;

  GHAR.validation = GHAR.validation || {};

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const CONFIG = Object.freeze({

    selectors: {
      form: "[data-validate]",
      field: "[data-validate-field]",
      message: "[data-validation-message]"
    },

    classes: {
      valid: "is-valid",
      invalid: "is-invalid",
      touched: "is-touched",
      validating: "is-validating"
    },

    limits: {
      nameMin: 2,
      nameMax: 100,

      passwordMin: 8,
      passwordMax: 128,

      phoneMin: 10,
      phoneMax: 15,

      messageMax: 5000,

      propertyTitleMax: 150,
      propertyDescriptionMax: 5000,

      fileMaxSize: 10 * 1024 * 1024
    },

    files: {
      document: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp"
      ],

      image: [
        "image/jpeg",
        "image/png",
        "image/webp"
      ]
    }

  });

  // ==========================================================
  // BASIC TYPE HELPERS
  // ==========================================================

  function isString(value) {
    return typeof value === "string";
  }

  function isNumber(value) {
    return (
      typeof value === "number" &&
      Number.isFinite(value)
    );
  }

  function isObject(value) {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }

  function normalize(value) {
    return String(value ?? "").trim();
  }

  // ==========================================================
  // ERROR RESULT
  // ==========================================================

  function valid(value = null) {
    return {
      valid: true,
      value,
      message: ""
    };
  }

  function invalid(message, value = null) {
    return {
      valid: false,
      value,
      message
    };
  }

  // ==========================================================
  // REQUIRED
  // ==========================================================

  function required(
    value,
    message = "This field is required."
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return invalid(message, value);
    }

    if (
      typeof value === "string" &&
      value.trim() === ""
    ) {
      return invalid(message, value);
    }

    if (
      Array.isArray(value) &&
      value.length === 0
    ) {
      return invalid(message, value);
    }

    return valid(value);
  }

  // ==========================================================
  // STRING VALIDATION
  // ==========================================================

  function minLength(
    value,
    min,
    message
  ) {
    const text = normalize(value);

    if (text.length < min) {
      return invalid(
        message ||
        `Minimum ${min} characters required.`,
        value
      );
    }

    return valid(value);
  }

  function maxLength(
    value,
    max,
    message
  ) {
    const text = normalize(value);

    if (text.length > max) {
      return invalid(
        message ||
        `Maximum ${max} characters allowed.`,
        value
      );
    }

    return valid(value);
  }

  function lengthBetween(
    value,
    min,
    max,
    message
  ) {
    const text = normalize(value);

    if (
      text.length < min ||
      text.length > max
    ) {
      return invalid(
        message ||
        `Must be between ${min} and ${max} characters.`,
        value
      );
    }

    return valid(value);
  }

  // ==========================================================
  // EMAIL
  // ==========================================================

  function email(value) {

    const text =
      normalize(value).toLowerCase();

    if (!text) {
      return invalid(
        "Email address is required.",
        value
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text)
    ) {
      return invalid(
        "Enter a valid email address.",
        value
      );
    }

    if (text.length > 254) {
      return invalid(
        "Email address is too long.",
        value
      );
    }

    return valid(text);
  }

  // ==========================================================
  // PHONE
  // ==========================================================

  function phone(
    value,
    country = "IN"
  ) {

    const text =
      normalize(value)
        .replace(/[\s()-]/g, "");

    if (!text) {
      return invalid(
        "Phone number is required.",
        value
      );
    }

    if (country === "IN") {

      if (
        !/^(?:\+91|91)?[6-9]\d{9}$/.test(text)
      ) {
        return invalid(
          "Enter a valid Indian mobile number.",
          value
        );
      }

      return valid(text);
    }

    if (
      !/^\+?[1-9]\d{7,14}$/.test(text)
    ) {
      return invalid(
        "Enter a valid phone number.",
        value
      );
    }

    return valid(text);
  }

  // ==========================================================
  // NAME
  // ==========================================================

  function name(
    value,
    field = "Name"
  ) {

    const text = normalize(value);

    if (!text) {
      return invalid(
        `${field} is required.`,
        value
      );
    }

    if (
      text.length <
      CONFIG.limits.nameMin
    ) {
      return invalid(
        `${field} is too short.`,
        value
      );
    }

    if (
      text.length >
      CONFIG.limits.nameMax
    ) {
      return invalid(
        `${field} is too long.`,
        value
      );
    }

    if (
      !/^[A-Za-zÀ-ÖØ-öø-ÿ.' -]+$/.test(text)
    ) {
      return invalid(
        `${field} contains invalid characters.`,
        value
      );
    }

    return valid(text);
  }

  // ==========================================================
  // PASSWORD
  // ==========================================================

  function password(value) {

    const text = String(value ?? "");

    if (!text) {
      return invalid(
        "Password is required.",
        value
      );
    }

    if (
      text.length <
      CONFIG.limits.passwordMin
    ) {
      return invalid(
        `Password must contain at least ${CONFIG.limits.passwordMin} characters.`,
        value
      );
    }

    if (
      text.length >
      CONFIG.limits.passwordMax
    ) {
      return invalid(
        "Password is too long.",
        value
      );
    }

    if (!/[A-Z]/.test(text)) {
      return invalid(
        "Password must contain an uppercase letter.",
        value
      );
    }

    if (!/[a-z]/.test(text)) {
      return invalid(
        "Password must contain a lowercase letter.",
        value
      );
    }

    if (!/[0-9]/.test(text)) {
      return invalid(
        "Password must contain a number.",
        value
      );
    }

    if (!/[^A-Za-z0-9]/.test(text)) {
      return invalid(
        "Password must contain a special character.",
        value
      );
    }

    return valid(true);
  }

  // ==========================================================
  // PASSWORD CONFIRMATION
  // ==========================================================

  function confirmPassword(
    passwordValue,
    confirmationValue
  ) {

    if (
      String(passwordValue ?? "") !==
      String(confirmationValue ?? "")
    ) {
      return invalid(
        "Passwords do not match."
      );
    }

    return valid(true);
  }

  // ==========================================================
  // OTP
  // ==========================================================

  function otp(
    value,
    length = 6
  ) {

    const text = normalize(value);

    const pattern =
      new RegExp(`^\\d{${length}}$`);

    if (!pattern.test(text)) {
      return invalid(
        `Enter the ${length}-digit OTP.`
      );
    }

    return valid(text);
  }

  // ==========================================================
  // PAN
  // ==========================================================

  function pan(value) {

    const text =
      normalize(value)
        .toUpperCase();

    if (
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(text)
    ) {
      return invalid(
        "Enter a valid PAN number."
      );
    }

    return valid(text);
  }

  // ==========================================================
  // AADHAAR
  // ==========================================================

  function aadhaar(value) {

    const text =
      normalize(value)
        .replace(/\s/g, "");

    if (!/^\d{12}$/.test(text)) {
      return invalid(
        "Enter a valid 12-digit Aadhaar number."
      );
    }

    return valid(text);
  }

  // ==========================================================
  // PINCODE
  // ==========================================================

  function pincode(
    value,
    country = "IN"
  ) {

    const text =
      normalize(value);

    if (country === "IN") {

      if (!/^[1-9][0-9]{5}$/.test(text)) {
        return invalid(
          "Enter a valid 6-digit Indian PIN code."
        );
      }

      return valid(text);
    }

    if (!/^[A-Za-z0-9 -]{3,12}$/.test(text)) {
      return invalid(
        "Enter a valid postal code."
      );
    }

    return valid(text);
  }

  // ==========================================================
  // URL
  // ==========================================================

  function url(value) {

    const text = normalize(value);

    try {

      const parsed =
        new URL(text);

      if (
        parsed.protocol !== "http:" &&
        parsed.protocol !== "https:"
      ) {
        throw new Error();
      }

      return valid(parsed.href);

    } catch {
      return invalid(
        "Enter a valid URL.",
        value
      );
    }
  }

  // ==========================================================
  // NUMBER
  // ==========================================================

  function number(
    value,
    options = {}
  ) {

    const text = normalize(value);

    if (!text) {
      return invalid(
        options.requiredMessage ||
        "Number is required."
      );
    }

    const numeric =
      Number(
        text.replace(/,/g, "")
      );

    if (!Number.isFinite(numeric)) {
      return invalid(
        options.message ||
        "Enter a valid number."
      );
    }

    if (
      options.min !== undefined &&
      numeric < options.min
    ) {
      return invalid(
        options.minMessage ||
        `Value must be at least ${options.min}.`
      );
    }

    if (
      options.max !== undefined &&
      numeric > options.max
    ) {
      return invalid(
        options.maxMessage ||
        `Value must not exceed ${options.max}.`
      );
    }

    return valid(numeric);
  }

  // ==========================================================
  // PRICE
  // ==========================================================

  function price(value) {

    return number(
      value,
      {
        min: 0,
        message: "Enter a valid property price.",
        minMessage: "Property price cannot be negative."
      }
    );
  }

  // ==========================================================
  // AREA
  // ==========================================================

  function area(value) {

    return number(
      value,
      {
        min: 0,
        message: "Enter a valid property area.",
        minMessage: "Property area cannot be negative."
      }
    );
  }

  // ==========================================================
  // PROPERTY TITLE
  // ==========================================================

  function propertyTitle(value) {

    const requiredResult =
      required(
        value,
        "Property title is required."
      );

    if (!requiredResult.valid) {
      return requiredResult;
    }

    return lengthBetween(
      value,
      5,
      CONFIG.limits.propertyTitleMax,
      "Property title must be between 5 and 150 characters."
    );
  }

  // ==========================================================
  // PROPERTY DESCRIPTION
  // ==========================================================

  function propertyDescription(value) {

    const text = normalize(value);

    if (!text) {
      return invalid(
        "Property description is required."
      );
    }

    if (
      text.length >
      CONFIG.limits.propertyDescriptionMax
    ) {
      return invalid(
        "Property description is too long."
      );
    }

    return valid(text);
  }

  // ==========================================================
  // SELECT FIELD
  // ==========================================================

  function select(
    value,
    allowedValues = []
  ) {

    const text = normalize(value);

    if (!text) {
      return invalid(
        "Please select an option."
      );
    }

    if (
      Array.isArray(allowedValues) &&
      allowedValues.length &&
      !allowedValues.includes(text)
    ) {
      return invalid(
        "Selected option is not valid."
      );
    }

    return valid(text);
  }

  // ==========================================================
  // BOOLEAN / CHECKBOX
  // ==========================================================

  function accepted(
    value,
    message = "You must accept this requirement."
  ) {

    if (
      value === true ||
      value === "true" ||
      value === "on" ||
      value === 1
    ) {
      return valid(true);
    }

    return invalid(message);
  }

  // ==========================================================
  // DATE
  // ==========================================================

  function date(
    value,
    options = {}
  ) {

    if (!value) {
      return invalid(
        options.requiredMessage ||
        "Date is required."
      );
    }

    const parsed =
      value instanceof Date
        ? value
        : new Date(value);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return invalid(
        options.message ||
        "Enter a valid date."
      );
    }

    if (
      options.min &&
      parsed < new Date(options.min)
    ) {
      return invalid(
        options.minMessage ||
        "Selected date is too early."
      );
    }

    if (
      options.max &&
      parsed > new Date(options.max)
    ) {
      return invalid(
        options.maxMessage ||
        "Selected date is too late."
      );
    }

    return valid(parsed);
  }

  // ==========================================================
  // FILE VALIDATION
  // ==========================================================

  function file(
    value,
    options = {}
  ) {

    const inputFile =
      value instanceof FileList
        ? value[0]
        : value;

    if (!(inputFile instanceof File)) {
      return invalid(
        options.required === false
          ? ""
          : "Please select a file."
      );
    }

    const maxSize =
      options.maxSize ||
      CONFIG.limits.fileMaxSize;

    if (
      inputFile.size > maxSize
    ) {
      return invalid(
        `File size must not exceed ${Math.round(maxSize / 1024 / 1024)} MB.`
      );
    }

    const allowedTypes =
      options.types ||
      CONFIG.files.document;

    if (
      !allowedTypes.includes(
        inputFile.type
      )
    ) {
      return invalid(
        "This file type is not supported."
      );
    }

    return valid(inputFile);
  }

  // ==========================================================
  // IMAGE FILE
  // ==========================================================

  function imageFile(value) {

    return file(
      value,
      {
        types: CONFIG.files.image
      }
    );
  }

  // ==========================================================
  // DOCUMENT FILE
  // ==========================================================

  function documentFile(value) {

    return file(
      value,
      {
        types: CONFIG.files.document
      }
    );
  }

  // ==========================================================
  // FIELD RULE ENGINE
  // ==========================================================

  function validateField(
    value,
    rules = {}
  ) {

    if (
      rules.required &&
      !required(value).valid
    ) {
      return required(
        value,
        rules.requiredMessage
      );
    }

    if (
      !rules.required &&
      isEmptyValue(value)
    ) {
      return valid(value);
    }

    if (rules.email) {
      const result =
        email(value);

      if (!result.valid) {
        return result;
      }
    }

    if (rules.phone) {
      const result =
        phone(
          value,
          rules.country || "IN"
        );

      if (!result.valid) {
        return result;
      }
    }

    if (rules.name) {
      const result =
        name(
          value,
          rules.nameLabel || "Name"
        );

      if (!result.valid) {
        return result;
      }
    }

    if (rules.password) {
      const result =
        password(value);

      if (!result.valid) {
        return result;
      }
    }

    if (rules.pan) {
      const result =
        pan(value);

      if (!result.valid) {
        return result;
      }
    }

    if (rules.aadhaar) {
      const result =
        aadhaar(value);

      if (!result.valid) {
        return result;
      }
    }

    if (rules.pincode) {
      const result =
        pincode(
          value,
          rules.country || "IN"
        );

      if (!result.valid) {
        return result;
      }
    }

    if (rules.url) {
      const result =
        url(value);

      if (!result.valid) {
        return result;
      }
    }

    if (rules.number) {
      const result =
        number(
          value,
          rules.numberOptions || {}
        );

      if (!result.valid) {
        return result;
      }
    }

    if (rules.price) {
      const result =
        price(value);

      if (!result.valid) {
        return result;
      }
    }

    if (rules.area) {
      const result =
        area(value);

      if (!result.valid) {
        return result;
      }
    }

    if (rules.otp) {
      const result =
        otp(
          value,
          rules.otpLength || 6
        );

      if (!result.valid) {
        return result;
      }
    }

    if (rules.propertyTitle) {
      const result =
        propertyTitle(value);

      if (!result.valid) {
        return result;
      }
    }

    if (rules.propertyDescription) {
      const result =
        propertyDescription(value);

      if (!result.valid) {
        return result;
      }
    }

    if (rules.minLength) {
      const result =
        minLength(
          value,
          rules.minLength,
          rules.minLengthMessage
        );

      if (!result.valid) {
        return result;
      }
    }

    if (rules.maxLength) {
      const result =
        maxLength(
          value,
          rules.maxLength,
          rules.maxLengthMessage
        );

      if (!result.valid) {
        return result;
      }
    }

    if (rules.sameAs !== undefined) {
      if (value !== rules.sameAs) {
        return invalid(
          rules.sameAsMessage ||
          "Values do not match."
        );
      }
    }

    if (rules.accepted) {
      const result =
        accepted(
          value,
          rules.acceptedMessage
        );

      if (!result.valid) {
        return result;
      }
    }

    return valid(value);
  }

  // ==========================================================
  // EMPTY VALUE
  // ==========================================================

  function isEmptyValue(value) {

    if (
      value === null ||
      value === undefined
    ) {
      return true;
    }

    if (
      typeof value === "string"
    ) {
      return value.trim() === "";
    }

    if (
      value instanceof FileList
    ) {
      return value.length === 0;
    }

    return false;
  }

  // ==========================================================
  // RULE PARSER
  // ==========================================================

  function getRules(element) {

    const rules = {};

    if (!element) {
      return rules;
    }

    if (
      element.hasAttribute(
        "required"
      )
    ) {
      rules.required = true;
    }

    if (
      element.dataset.validateRequired
    ) {
      rules.required =
        element.dataset.validateRequired !== "false";
    }

    if (
      element.dataset.validateEmail !== undefined
    ) {
      rules.email = true;
    }

    if (
      element.dataset.validatePhone !== undefined
    ) {
      rules.phone = true;
    }

    if (
      element.dataset.validateName !== undefined
    ) {
      rules.name = true;
    }

    if (
      element.dataset.validatePassword !== undefined
    ) {
      rules.password = true;
    }

    if (
      element.dataset.validatePan !== undefined
    ) {
      rules.pan = true;
    }

    if (
      element.dataset.validateAadhaar !== undefined
    ) {
      rules.aadhaar = true;
    }

    if (
      element.dataset.validatePincode !== undefined
    ) {
      rules.pincode = true;
    }

    if (
      element.dataset.validateUrl !== undefined
    ) {
      rules.url = true;
    }

    if (
      element.dataset.validatePrice !== undefined
    ) {
      rules.price = true;
    }

    if (
      element.dataset.validateArea !== undefined
    ) {
      rules.area = true;
    }

    if (
      element.dataset.validateOtp !== undefined
    ) {
      rules.otp = true;
    }

    if (
      element.dataset.validatePropertyTitle !== undefined
    ) {
      rules.propertyTitle = true;
    }

    if (
      element.dataset.validatePropertyDescription !== undefined
    ) {
      rules.propertyDescription = true;
    }

    if (
      element.dataset.minLength
    ) {
      rules.minLength =
        Number(element.dataset.minLength);
    }

    if (
      element.dataset.maxLength
    ) {
      rules.maxLength =
        Number(element.dataset.maxLength);
    }

    if (
      element.dataset.validateCountry
    ) {
      rules.country =
        element.dataset.validateCountry;
    }

    if (
      element.dataset.validateOtpLength
    ) {
      rules.otpLength =
        Number(element.dataset.validateOtpLength);
    }

    return rules;
  }

  // ==========================================================
  // FIELD UI
  // ==========================================================

  function findMessageElement(
    field
  ) {

    if (!field) {
      return null;
    }

    const id =
      field.getAttribute("id");

    if (id) {

      const linked =
        document.querySelector(
          `[data-validation-for="${CSS.escape(id)}"]`
        );

      if (linked) {
        return linked;
      }
    }

    const parent =
      field.closest(
        ".form-field, .form-group, .field, label"
      );

    if (!parent) {
      return null;
    }

    return parent.querySelector(
      CONFIG.selectors.message
    );
  }

  function clearFieldError(field) {

    if (!field) {
      return;
    }

    field.classList.remove(
      CONFIG.classes.invalid
    );

    field.removeAttribute(
      "aria-invalid"
    );

    const message =
      findMessageElement(field);

    if (message) {
      message.textContent = "";
      message.hidden = true;
    }
  }

  function showFieldError(
    field,
    message
  ) {

    if (!field) {
      return;
    }

    field.classList.add(
      CONFIG.classes.invalid
    );

    field.classList.remove(
      CONFIG.classes.valid
    );

    field.setAttribute(
      "aria-invalid",
      "true"
    );

    const messageElement =
      findMessageElement(field);

    if (messageElement) {
      messageElement.textContent =
        message || "Invalid value.";

      messageElement.hidden = false;
    }
  }

  function showFieldValid(field) {

    if (!field) {
      return;
    }

    field.classList.remove(
      CONFIG.classes.invalid
    );

    field.classList.add(
      CONFIG.classes.valid
    );

    field.setAttribute(
      "aria-invalid",
      "false"
    );

    const message =
      findMessageElement(field);

    if (message) {
      message.textContent = "";
      message.hidden = true;
    }
  }

  // ==========================================================
  // VALIDATE FIELD ELEMENT
  // ==========================================================

  function validateElement(
    field
  ) {

    if (!field) {
      return valid();
    }

    const rules =
      getRules(field);

    const value =
      field.type === "checkbox"
        ? field.checked
        : field.type === "file"
          ? field.files
          : field.value;

    const result =
      validateField(
        value,
        rules
      );

    field.classList.add(
      CONFIG.classes.touched
    );

    if (result.valid) {
      showFieldValid(field);
    } else {
      showFieldError(
        field,
        result.message
      );
    }

    return result;
  }

  // ==========================================================
  // VALIDATE FORM
  // ==========================================================

  function validateForm(
    form,
    options = {}
  ) {

    if (!form) {
      return {
        valid: false,
        fields: {},
        errors: {}
      };
    }

    const fields =
      form.querySelectorAll(
        CONFIG.selectors.field
      );

    const results = {};
    const errors = {};

    let formValid = true;

    fields.forEach(field => {

      const name =
        field.name ||
        field.id ||
        field.dataset.validateField;

      if (!name) {
        return;
      }

      const result =
        validateElement(field);

      results[name] =
        result;

      if (!result.valid) {

        formValid = false;

        errors[name] =
          result.message;

        if (
          options.focusFirst !== false &&
          !options._focused
        ) {
          try {
            field.focus();
          } catch {
            // Ignore focus errors.
          }

          options._focused = true;
        }
      }

    });

    form.classList.toggle(
      "is-valid",
      formValid
    );

    form.classList.toggle(
      "is-invalid",
      !formValid
    );

    return {
      valid: formValid,
      fields: results,
      errors
    };
  }

  // ==========================================================
  // VALIDATE OBJECT
  // ==========================================================

  function validateObject(
    data,
    schema
  ) {

    if (!isObject(data)) {
      return {
        valid: false,
        errors: {
          _form: "Invalid data."
        }
      };
    }

    if (!isObject(schema)) {
      return {
        valid: true,
        errors: {}
      };
    }

    const errors = {};
    const fields = {};

    let isValidResult = true;

    Object.entries(schema)
      .forEach(
        ([key, rules]) => {

          const result =
            validateField(
              data[key],
              rules || {}
            );

          fields[key] =
            result;

          if (!result.valid) {

            isValidResult = false;

            errors[key] =
              result.message;
          }

        }
      );

    return {
      valid: isValidResult,
      fields,
      errors
    };
  }

  // ==========================================================
  // COMMON GHAR SCHEMAS
  // ==========================================================

  const schemas = {

    login: {
      email: {
        required: true,
        email: true
      },

      password: {
        required: true,
        minLength: 8
      }
    },

    register: {

      name: {
        required: true,
        name: true
      },

      email: {
        required: true,
        email: true
      },

      phone: {
        required: true,
        phone: true
      },

      password: {
        required: true,
        password: true
      }
    },

    property: {

      title: {
        required: true,
        propertyTitle: true
      },

      description: {
        required: true,
        propertyDescription: true
      },

      price: {
        required: true,
        price: true
      },

      area: {
        required: true,
        area: true
      },

      city: {
        required: true,
        minLength: 2,
        maxLength: 100
      },

      state: {
        required: true,
        minLength: 2,
        maxLength: 100
      },

      pincode: {
        required: true,
        pincode: true
      }
    },

    verification: {

      phone: {
        required: true,
        phone: true
      },

      email: {
        required: true,
        email: true
      },

      pan: {
        required: true,
        pan: true
      },

      aadhaar: {
        required: true,
        aadhaar: true
      },

      address: {
        required: true,
        minLength: 5,
        maxLength: 500
      },

      pincode: {
        required: true,
        pincode: true
      }
    }

  };

  // ==========================================================
  // FORM EVENT HANDLERS
  // ==========================================================

  function handleBlur(event) {

    const field =
      event.target.closest(
        CONFIG.selectors.field
      );

    if (!field) {
      return;
    }

    validateElement(field);
  }

  function handleInput(event) {

    const field =
      event.target.closest(
        CONFIG.selectors.field
      );

    if (!field) {
      return;
    }

    if (
      !field.classList.contains(
        CONFIG.classes.touched
      )
    ) {
      return;
    }

    validateElement(field);
  }

  function handleSubmit(event) {

    const form =
      event.target.closest(
        CONFIG.selectors.form
      );

    if (!form) {
      return;
    }

    const result =
      validateForm(form);

    if (!result.valid) {
      event.preventDefault();

      form.dispatchEvent(
        new CustomEvent(
          "ghar:validation-failed",
          {
            bubbles: true,
            detail: result
          }
        )
      );

      return;
    }

    form.dispatchEvent(
      new CustomEvent(
        "ghar:validation-passed",
        {
          bubbles: true,
          detail: result
        }
      )
    );
  }

  // ==========================================================
  // INITIALIZE
  // ==========================================================

  function init(root = document) {

    if (!root) {
      return;
    }

    root.addEventListener(
      "blur",
      handleBlur,
      true
    );

    root.addEventListener(
      "input",
      handleInput,
      true
    );

    root.addEventListener(
      "change",
      handleInput,
      true
    );

    root.addEventListener(
      "submit",
      handleSubmit
    );

  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  Object.assign(
    GHAR.validation,
    {

      CONFIG,

      required,
      minLength,
      maxLength,
      lengthBetween,

      email,
      phone,
      name,
      password,
      confirmPassword,
      otp,

      pan,
      aadhaar,
      pincode,
      url,

      number,
      price,
      area,

      propertyTitle,
      propertyDescription,

      select,
      accepted,
      date,

      file,
      imageFile,
      documentFile,

      validateField,
      validateElement,
      validateForm,
      validateObject,

      getRules,

      clearFieldError,
      showFieldError,
      showFieldValid,

      schemas,

      init

    }
  );

  // ==========================================================
  // GLOBAL SHORTCUTS
  // ==========================================================

  GHAR.validateForm =
    validateForm;

  GHAR.validateField =
    validateField;

  // ==========================================================
  // DOM READY
  // ==========================================================

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () => init(),
      {
        once: true
      }
    );

  } else {

    init();

  }

})(window, document);