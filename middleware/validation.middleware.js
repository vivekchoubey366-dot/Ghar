"use strict";

/**
 * ============================================================
 * GHAR - VALIDATION MIDDLEWARE
 * ============================================================
 *
 * Responsibilities:
 * - Validate request body
 * - Validate query parameters
 * - Validate route parameters
 * - Sanitize common input values
 * - Provide reusable validation rules
 * - Return consistent API validation errors
 *
 * This middleware does NOT contain business logic.
 *
 * Authentication:
 *   auth.middleware.js
 *
 * Authorization:
 *   role.middleware.js
 *
 * Validation:
 *   validation.middleware.js
 *
 * Business logic:
 *   controllers / services
 *
 * ============================================================
 */

const crypto = require("crypto");


/**
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

const MAX_STRING_LENGTH =
  Number(
    process.env.VALIDATION_MAX_STRING_LENGTH ||
    10000
  );

const MAX_ARRAY_LENGTH =
  Number(
    process.env.VALIDATION_MAX_ARRAY_LENGTH ||
    100
  );

const MAX_OBJECT_DEPTH =
  Number(
    process.env.VALIDATION_MAX_OBJECT_DEPTH ||
    10
  );


/**
 * ============================================================
 * ERROR RESPONSE
 * ============================================================
 */

function sendValidationError(
  res,
  errors,
  requestId
) {
  return res.status(400).json({
    success: false,

    error: {
      code:
        "VALIDATION_ERROR",

      message:
        "One or more fields contain invalid values.",

      requestId:
        requestId || null,

      fields:
        errors
    }
  });
}


/**
 * ============================================================
 * PATH HELPERS
 * ============================================================
 */

function getValue(
  object,
  path
) {
  if (
    !object ||
    !path
  ) {
    return undefined;
  }

  const parts =
    String(path)
      .replace(
        /\[(\d+)\]/g,
        ".$1"
      )
      .split(".")
      .filter(Boolean);

  let current =
    object;

  for (
    const part of parts
  ) {
    if (
      current === null ||
      current === undefined
    ) {
      return undefined;
    }

    current =
      current[part];
  }

  return current;
}


function setValue(
  object,
  path,
  value
) {
  const parts =
    String(path)
      .replace(
        /\[(\d+)\]/g,
        ".$1"
      )
      .split(".")
      .filter(Boolean);

  let current =
    object;

  parts.forEach(
    (part, index) => {
      const last =
        index ===
        parts.length - 1;

      if (
        last
      ) {
        current[part] =
          value;

        return;
      }

      if (
        typeof current[part] !==
          "object" ||
        current[part] === null
      ) {
        current[part] = {};
      }

      current =
        current[part];
    }
  );

  return object;
}


/**
 * ============================================================
 * BASIC TYPE HELPERS
 * ============================================================
 */

function isObject(
  value
) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}


function isEmpty(
  value
) {
  return (
    value === undefined ||
    value === null ||
    (
      typeof value === "string" &&
      value.trim() === ""
    )
  );
}


function isString(
  value
) {
  return (
    typeof value ===
    "string"
  );
}


function isNumber(
  value
) {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(value)
  );
}


function isBoolean(
  value
) {
  return (
    typeof value ===
    "boolean"
  );
}


/**
 * ============================================================
 * STRING SANITIZATION
 * ============================================================
 */

function trimString(
  value
) {
  if (
    typeof value !==
    "string"
  ) {
    return value;
  }

  return value.trim();
}


function normalizeWhitespace(
  value
) {
  if (
    typeof value !==
    "string"
  ) {
    return value;
  }

  return value
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


/**
 * Remove control characters while preserving normal
 * Unicode text.
 */

function removeControlCharacters(
  value
) {
  if (
    typeof value !==
    "string"
  ) {
    return value;
  }

  return value.replace(
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
    ""
  );
}


/**
 * ============================================================
 * EMAIL
 * ============================================================
 */

function isValidEmail(
  value
) {
  if (
    !isString(value)
  ) {
    return false;
  }

  const email =
    value.trim();

  if (
    email.length > 254
  ) {
    return false;
  }

  /**
   * Deliberately conservative application-level email check.
   * Full RFC validation is unnecessary for normal API input.
   */

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}


/**
 * ============================================================
 * PHONE
 * ============================================================
 */

function isValidPhone(
  value
) {
  if (
    !isString(value) &&
    !isNumber(value)
  ) {
    return false;
  }

  const phone =
    String(value)
      .replace(
        /[\s()-]/g,
        ""
      );

  return /^\+?[0-9]{7,15}$/.test(
    phone
  );
}


/**
 * ============================================================
 * UUID
 * ============================================================
 */

function isValidUUID(
  value
) {
  if (
    !isString(value)
  ) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}


/**
 * ============================================================
 * ID
 * ============================================================
 *
 * Supports:
 * - UUID
 * - numeric IDs
 * - safe alphanumeric IDs
 */

function isValidId(
  value
) {
  if (
    value === undefined ||
    value === null
  ) {
    return false;
  }

  const id =
    String(value)
      .trim();

  if (
    !id ||
    id.length > 128
  ) {
    return false;
  }

  return /^[A-Za-z0-9_-]+$/.test(
    id
  );
}


/**
 * ============================================================
 * DATE
 * ============================================================
 */

function isValidDate(
  value
) {
  if (
    value instanceof Date
  ) {
    return !Number.isNaN(
      value.getTime()
    );
  }

  if (
    !isString(value)
  ) {
    return false;
  }

  const date =
    new Date(value);

  return !Number.isNaN(
    date.getTime()
  );
}


/**
 * ============================================================
 * URL
 * ============================================================
 */

function isValidUrl(
  value
) {
  if (
    !isString(value)
  ) {
    return false;
  }

  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
        "http:" ||
      url.protocol ===
        "https:"
    );

  } catch {
    return false;
  }
}


/**
 * ============================================================
 * ENUM
 * ============================================================
 */

function isOneOf(
  value,
  allowed
) {
  if (
    !Array.isArray(
      allowed
    )
  ) {
    return false;
  }

  return allowed.includes(
    value
  );
}


/**
 * ============================================================
 * RANGE
 * ============================================================
 */

function isInRange(
  value,
  min,
  max
) {
  if (
    !isNumber(value)
  ) {
    return false;
  }

  if (
    min !== undefined &&
    value < min
  ) {
    return false;
  }

  if (
    max !== undefined &&
    value > max
  ) {
    return false;
  }

  return true;
}


/**
 * ============================================================
 * OBJECT DEPTH
 * ============================================================
 */

function getObjectDepth(
  value,
  depth = 0
) {
  if (
    value === null ||
    typeof value !==
      "object"
  ) {
    return depth;
  }

  if (
    depth >
    MAX_OBJECT_DEPTH
  ) {
    return depth;
  }

  let maxDepth =
    depth;

  if (
    Array.isArray(value)
  ) {
    for (
      const item of value
    ) {
      maxDepth =
        Math.max(
          maxDepth,
          getObjectDepth(
            item,
            depth + 1
          )
        );
    }

    return maxDepth;
  }

  for (
    const item of
      Object.values(value)
  ) {
    maxDepth =
      Math.max(
        maxDepth,
        getObjectDepth(
          item,
          depth + 1
        )
      );
  }

  return maxDepth;
}


/**
 * ============================================================
 * DEEP INPUT SANITIZATION
 * ============================================================
 */

function sanitizeValue(
  value,
  options = {},
  depth = 0
) {
  if (
    depth >
    MAX_OBJECT_DEPTH
  ) {
    return value;
  }

  if (
    typeof value ===
    "string"
  ) {
    let result =
      value;

    if (
      options.removeControlCharacters !==
      false
    ) {
      result =
        removeControlCharacters(
          result
        );
    }

    if (
      options.trim !==
      false
    ) {
      result =
        result.trim();
    }

    if (
      options.normalizeWhitespace
    ) {
      result =
        normalizeWhitespace(
          result
        );
    }

    if (
      result.length >
      MAX_STRING_LENGTH
    ) {
      result =
        result.slice(
          0,
          MAX_STRING_LENGTH
        );
    }

    return result;
  }

  if (
    Array.isArray(value)
  ) {
    return value
      .slice(
        0,
        MAX_ARRAY_LENGTH
      )
      .map(
        item =>
          sanitizeValue(
            item,
            options,
            depth + 1
          )
      );
  }

  if (
    isObject(value)
  ) {
    const result =
      {};

    for (
      const [
        key,
        item
      ] of Object.entries(
        value
      )
    ) {
      result[key] =
        sanitizeValue(
          item,
          options,
          depth + 1
        );
    }

    return result;
  }

  return value;
}


/**
 * ============================================================
 * SANITIZE REQUEST BODY
 * ============================================================
 */

function sanitizeBody(
  options = {}
) {
  return function sanitizeBodyMiddleware(
    req,
    res,
    next
  ) {
    if (
      req.body &&
      typeof req.body ===
        "object"
    ) {
      req.body =
        sanitizeValue(
          req.body,
          options
        );
    }

    return next();
  };
}


/**
 * ============================================================
 * SANITIZE QUERY
 * ============================================================
 */

function sanitizeQuery(
  options = {}
) {
  return function sanitizeQueryMiddleware(
    req,
    res,
    next
  ) {
    if (
      req.query &&
      typeof req.query ===
        "object"
    ) {
      const sanitized =
        sanitizeValue(
          req.query,
          options
        );

      /**
       * Express may expose req.query as a getter depending
       * on configuration. Mutate individual properties where
       * possible instead of replacing the object.
       */

      for (
        const [
          key,
          value
        ] of Object.entries(
          sanitized
        )
      ) {
        req.query[key] =
          value;
      }
    }

    return next();
  };
}


/**
 * ============================================================
 * VALIDATION RULE
 * ============================================================
 */

function validateField(
  value,
  rules = {},
  fieldName = "field"
) {
  const errors = [];

  const required =
    rules.required === true;

  if (
    isEmpty(value)
  ) {
    if (
      required
    ) {
      errors.push({
        field:
          fieldName,

        code:
          "REQUIRED",

        message:
          `${fieldName} is required.`
      });
    }

    return errors;
  }


  /**
   * String
   */

  if (
    rules.type ===
    "string"
  ) {
    if (
      !isString(value)
    ) {
      errors.push({
        field:
          fieldName,

        code:
          "INVALID_TYPE",

        message:
          `${fieldName} must be a string.`
      });

      return errors;
    }
  }


  /**
   * Number
   */

  if (
    rules.type ===
    "number"
  ) {
    if (
      !isNumber(value)
    ) {
      errors.push({
        field:
          fieldName,

        code:
          "INVALID_TYPE",

        message:
          `${fieldName} must be a number.`
      });

      return errors;
    }
  }


  /**
   * Integer
   */

  if (
    rules.type ===
    "integer"
  ) {
    if (
      !Number.isInteger(
        value
      )
    ) {
      errors.push({
        field:
          fieldName,

        code:
          "INVALID_TYPE",

        message:
          `${fieldName} must be an integer.`
      });

      return errors;
    }
  }


  /**
   * Boolean
   */

  if (
    rules.type ===
    "boolean"
  ) {
    if (
      !isBoolean(value)
    ) {
      errors.push({
        field:
          fieldName,

        code:
          "INVALID_TYPE",

        message:
          `${fieldName} must be a boolean.`
      });

      return errors;
    }
  }


  /**
   * Array
   */

  if (
    rules.type ===
    "array"
  ) {
    if (
      !Array.isArray(value)
    ) {
      errors.push({
        field:
          fieldName,

        code:
          "INVALID_TYPE",

        message:
          `${fieldName} must be an array.`
      });

      return errors;
    }
  }


  /**
   * Object
   */

  if (
    rules.type ===
    "object"
  ) {
    if (
      !isObject(value)
    ) {
      errors.push({
        field:
          fieldName,

        code:
          "INVALID_TYPE",

        message:
          `${fieldName} must be an object.`
      });

      return errors;
    }
  }


  /**
   * Minimum length
   */

  if (
    rules.minLength !==
      undefined &&
    typeof value ===
      "string" &&
    value.length <
      rules.minLength
  ) {
    errors.push({
      field:
        fieldName,

      code:
        "MIN_LENGTH",

      message:
        `${fieldName} must contain at least ${rules.minLength} characters.`
    });
  }


  /**
   * Maximum length
   */

  if (
    rules.maxLength !==
      undefined &&
    typeof value ===
      "string" &&
    value.length >
      rules.maxLength
  ) {
    errors.push({
      field:
        fieldName,

      code:
        "MAX_LENGTH",

      message:
        `${fieldName} must not exceed ${rules.maxLength} characters.`
    });
  }


  /**
   * Minimum number
   */

  if (
    rules.min !==
      undefined &&
    isNumber(value) &&
    value <
      rules.min
  ) {
    errors.push({
      field:
        fieldName,

      code:
        "MIN_VALUE",

      message:
        `${fieldName} must be at least ${rules.min}.`
    });
  }


  /**
   * Maximum number
   */

  if (
    rules.max !==
      undefined &&
    isNumber(value) &&
    value >
      rules.max
  ) {
    errors.push({
      field:
        fieldName,

      code:
        "MAX_VALUE",

      message:
        `${fieldName} must not exceed ${rules.max}.`
    });
  }


  /**
   * Regex
   */

  if (
    rules.pattern &&
    isString(value)
  ) {
    const regex =
      rules.pattern instanceof
      RegExp
        ? rules.pattern
        : new RegExp(
            rules.pattern
          );

    if (
      !regex.test(value)
    ) {
      errors.push({
        field:
          fieldName,

        code:
          "INVALID_FORMAT",

        message:
          `${fieldName} has an invalid format.`
      });
    }
  }


  /**
   * Email
   */

  if (
    rules.email === true &&
    !isValidEmail(value)
  ) {
    errors.push({
      field:
        fieldName,

      code:
        "INVALID_EMAIL",

      message:
        `${fieldName} must be a valid email address.`
    });
  }


  /**
   * Phone
   */

  if (
    rules.phone === true &&
    !isValidPhone(value)
  ) {
    errors.push({
      field:
        fieldName,

      code:
        "INVALID_PHONE",

      message:
        `${fieldName} must be a valid phone number.`
    });
  }


  /**
   * UUID
   */

  if (
    rules.uuid === true &&
    !isValidUUID(value)
  ) {
    errors.push({
      field:
        fieldName,

      code:
        "INVALID_UUID",

      message:
        `${fieldName} must be a valid UUID.`
    });
  }


  /**
   * ID
   */

  if (
    rules.id === true &&
    !isValidId(value)
  ) {
    errors.push({
      field:
        fieldName,

      code:
        "INVALID_ID",

      message:
        `${fieldName} must be a valid ID.`
    });
  }


  /**
   * URL
   */

  if (
    rules.url === true &&
    !isValidUrl(value)
  ) {
    errors.push({
      field:
        fieldName,

      code:
        "INVALID_URL",

      message:
        `${fieldName} must be a valid HTTP/HTTPS URL.`
    });
  }


  /**
   * Date
   */

  if (
    rules.date === true &&
    !isValidDate(value)
  ) {
    errors.push({
      field:
        fieldName,

      code:
        "INVALID_DATE",

      message:
        `${fieldName} must be a valid date.`
    });
  }


  /**
   * Enum
   */

  if (
    Array.isArray(
      rules.enum
    ) &&
    !rules.enum.includes(
      value
    )
  ) {
    errors.push({
      field:
        fieldName,

      code:
        "INVALID_VALUE",

      message:
        `${fieldName} must be one of: ${rules.enum.join(", ")}.`
    });
  }


  /**
   * Custom validation
   */

  if (
    typeof rules.validate ===
    "function"
  ) {
    const result =
      rules.validate(
        value
      );

    if (
      result !== true
    ) {
      errors.push({
        field:
          fieldName,

        code:
          "CUSTOM_VALIDATION_FAILED",

        message:
          typeof result ===
          "string"
            ? result
            : `${fieldName} is invalid.`
      });
    }
  }


  return errors;
}


/**
 * ============================================================
 * CREATE VALIDATOR
 * ============================================================
 *
 * Example:
 *
 * validate({
 *   email: {
 *     required: true,
 *     email: true
 *   },
 *
 *   password: {
 *     required: true,
 *     type: "string",
 *     minLength: 8
 *   }
 * })
 *
 * ============================================================
 */

function validate(
  schema,
  source = "body"
) {
  if (
    !schema ||
    typeof schema !==
      "object"
  ) {
    throw new TypeError(
      "Validation schema must be an object."
    );
  }

  const allowedSources =
    new Set([
      "body",
      "query",
      "params"
    ]);

  if (
    !allowedSources.has(
      source
    )
  ) {
    throw new TypeError(
      `Unsupported validation source: ${source}`
    );
  }

  return function validationMiddleware(
    req,
    res,
    next
  ) {
    const input =
      req[source] || {};

    const errors = [];

    for (
      const [
        field,
        rules
      ] of Object.entries(
        schema
      )
    ) {
      const value =
        getValue(
          input,
          field
        );

      errors.push(
        ...validateField(
          value,
          rules,
          field
        )
      );
    }

    if (
      errors.length > 0
    ) {
      return sendValidationError(
        res,
        errors,
        req.requestId
      );
    }

    return next();
  };
}


/**
 * ============================================================
 * VALIDATE MULTIPLE SOURCES
 * ============================================================
 */

function validateRequest({
  body,
  query,
  params
} = {}) {
  const validators = [];

  if (
    body
  ) {
    validators.push(
      validate(
        body,
        "body"
      )
    );
  }

  if (
    query
  ) {
    validators.push(
      validate(
        query,
        "query"
      )
    );
  }

  if (
    params
  ) {
    validators.push(
      validate(
        params,
        "params"
      )
    );
  }

  return function requestValidationMiddleware(
    req,
    res,
    next
  ) {
    let index = 0;

    function runNext() {
      if (
        index >=
        validators.length
      ) {
        return next();
      }

      const middleware =
        validators[
          index++
        ];

      return middleware(
        req,
        res,
        runNext
      );
    }

    return runNext();
  };
}


/**
 * ============================================================
 * STRICT BODY VALIDATION
 * ============================================================
 *
 * Reject unknown body fields.
 * ============================================================
 */

function validateAllowedFields(
  allowedFields,
  source = "body"
) {
  if (
    !Array.isArray(
      allowedFields
    )
  ) {
    throw new TypeError(
      "allowedFields must be an array."
    );
  }

  const allowed =
    new Set(
      allowedFields
    );

  return function allowedFieldsMiddleware(
    req,
    res,
    next
  ) {
    const input =
      req[source] || {};

    const unexpected =
      Object.keys(
        input
      ).filter(
        key =>
          !allowed.has(key)
      );

    if (
      unexpected.length > 0
    ) {
      return sendValidationError(
        res,
        unexpected.map(
          field => ({
            field,

            code:
              "UNKNOWN_FIELD",

            message:
              `The field "${field}" is not allowed.`
          })
        ),
        req.requestId
      );
    }

    return next();
  };
}


/**
 * ============================================================
 * COMMON GHAR VALIDATION SCHEMAS
 * ============================================================
 */

const schemas =
  Object.freeze({

    /**
     * Registration
     */

    register: {
      email: {
        required:
          true,

        type:
          "string",

        email:
          true,

        maxLength:
          254
      },

      password: {
        required:
          true,

        type:
          "string",

        minLength:
          8,

        maxLength:
          128
      },

      firstName: {
        required:
          true,

        type:
          "string",

        minLength:
          2,

        maxLength:
          100
      },

      lastName: {
        required:
          false,

        type:
          "string",

        maxLength:
          100
      },

      phone: {
        required:
          false,

        phone:
          true
      }
    },


    /**
     * Login
     */

    login: {
      email: {
        required:
          true,

        email:
          true
      },

      password: {
        required:
          true,

        type:
          "string",

        minLength:
          1,

        maxLength:
          128
      }
    },


    /**
     * Property creation
     */

    propertyCreate: {
      title: {
        required:
          true,

        type:
          "string",

        minLength:
          3,

        maxLength:
          200
      },

      description: {
        required:
          false,

        type:
          "string",

        maxLength:
          10000
      },

      propertyType: {
        required:
          true,

        type:
          "string",

        enum: [
          "apartment",
          "house",
          "villa",
          "plot",
          "land",
          "commercial",
          "office",
          "shop",
          "warehouse",
          "other"
        ]
      },

      listingType: {
        required:
          true,

        type:
          "string",

        enum: [
          "sale",
          "rent",
          "lease"
        ]
      },

      price: {
        required:
          true,

        type:
          "number",

        min:
          0
      },

      bedrooms: {
        required:
          false,

        type:
          "integer",

        min:
          0,

        max:
          100
      },

      bathrooms: {
        required:
          false,

        type:
          "number",

        min:
          0,

        max:
          100
      },

      area: {
        required:
          false,

        type:
          "number",

        min:
          0
      },

      city: {
        required:
          true,

        type:
          "string",

        minLength:
          2,

        maxLength:
          100
      },

      state: {
        required:
          true,

        type:
          "string",

        minLength:
          2,

        maxLength:
          100
      },

      pincode: {
        required:
          false,

        type:
          "string",

        pattern:
          /^[0-9]{4,10}$/
      }
    },


    /**
     * Offer
     */

    offerCreate: {
      propertyId: {
        required:
          true,

        id:
          true
      },

      amount: {
        required:
          true,

        type:
          "number",

        min:
          0
      },

      message: {
        required:
          false,

        type:
          "string",

        maxLength:
          5000
      }
    },


    /**
     * Visit
     */

    visitCreate: {
      propertyId: {
        required:
          true,

        id:
          true
      },

      scheduledAt: {
        required:
          true,

        date:
          true
      },

      message: {
        required:
          false,

        type:
          "string",

        maxLength:
          2000
      }
    },


    /**
     * Message
     */

    messageCreate: {
      recipientId: {
        required:
          true,

        id:
          true
      },

      message: {
        required:
          true,

        type:
          "string",

        minLength:
          1,

        maxLength:
          5000
      }
    },


    /**
     * Search
     */

    propertySearch: {
      q: {
        required:
          false,

        type:
          "string",

        maxLength:
          200
      },

      city: {
        required:
          false,

        type:
          "string",

        maxLength:
          100
      },

      propertyType: {
        required:
          false,

        type:
          "string",

        maxLength:
          50
      },

      listingType: {
        required:
          false,

        type:
          "string",

        enum: [
          "sale",
          "rent",
          "lease"
        ]
      },

      minPrice: {
        required:
          false,

        type:
          "number",

        min:
          0
      },

      maxPrice: {
        required:
          false,

        type:
          "number",

        min:
          0
      }
    },


    /**
     * Pagination
     */

    pagination: {
      page: {
        required:
          false,

        type:
          "integer",

        min:
          1,

        max:
          1000000
      },

      limit: {
        required:
          false,

        type:
          "integer",

        min:
          1,

        max:
          100
      }
    }
  });


/**
 * ============================================================
 * PAGINATION NORMALIZER
 * ============================================================
 */

function normalizePagination(
  req,
  res,
  next
) {
  if (
    !req.query
  ) {
    return next();
  }

  if (
    req.query.page !==
    undefined
  ) {
    const page =
      Number(
        req.query.page
      );

    if (
      Number.isInteger(
        page
      ) &&
      page > 0
    ) {
      req.query.page =
        page;
    }
  }

  if (
    req.query.limit !==
    undefined
  ) {
    const limit =
      Number(
        req.query.limit
      );

    if (
      Number.isInteger(
        limit
      ) &&
      limit > 0
    ) {
      req.query.limit =
        Math.min(
          limit,
          100
        );
    }
  }

  return next();
}


/**
 * ============================================================
 * SANITIZE COMMON REQUEST DATA
 * ============================================================
 */

function sanitizeRequest(
  options = {}
) {
  return function requestSanitizer(
    req,
    res,
    next
  ) {
    if (
      req.body &&
      typeof req.body ===
        "object"
    ) {
      req.body =
        sanitizeValue(
          req.body,
          options
        );
    }

    if (
      req.params &&
      typeof req.params ===
        "object"
    ) {
      req.params =
        sanitizeValue(
          req.params,
          options
        );
    }

    if (
      req.query &&
      typeof req.query ===
        "object"
    ) {
      for (
        const key of Object.keys(
          req.query
        )
      ) {
        req.query[key] =
          sanitizeValue(
            req.query[key],
            options
          );
      }
    }

    return next();
  };
}


/**
 * ============================================================
 * REQUEST STRUCTURE VALIDATION
 * ============================================================
 */

function validateRequestStructure(
  req,
  res,
  next
) {
  const bodyDepth =
    getObjectDepth(
      req.body
    );

  const queryDepth =
    getObjectDepth(
      req.query
    );

  const paramsDepth =
    getObjectDepth(
      req.params
    );

  if (
    Math.max(
      bodyDepth,
      queryDepth,
      paramsDepth
    ) >
    MAX_OBJECT_DEPTH
  ) {
    return sendValidationError(
      res,
      [
        {
          field:
            "request",

          code:
            "REQUEST_TOO_DEEP",

          message:
            "The request contains excessive object nesting."
        }
      ],
      req.requestId
    );
  }

  return next();
}


/**
 * ============================================================
 * GENERATE VALIDATION REQUEST ID
 * ============================================================
 *
 * Useful for validation errors generated outside the normal
 * request-id middleware.
 * ============================================================
 */

function generateValidationId() {
  return crypto
    .randomUUID();
}


/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {

  /**
   * Main middleware
   */

  validate,

  validateRequest,

  validateField,

  validateAllowedFields,

  sanitizeRequest,

  sanitizeBody,

  sanitizeQuery,

  validateRequestStructure,

  normalizePagination,


  /**
   * Helpers
   */

  getValue,

  setValue,

  isEmpty,

  isString,

  isNumber,

  isBoolean,

  isObject,

  isValidEmail,

  isValidPhone,

  isValidUUID,

  isValidId,

  isValidDate,

  isValidUrl,

  isOneOf,

  isInRange,

  sanitizeValue,

  trimString,

  normalizeWhitespace,

  removeControlCharacters,

  getObjectDepth,

  generateValidationId,


  /**
   * Reusable schemas
   */

  schemas,


  /**
   * Error response
   */

  sendValidationError
};