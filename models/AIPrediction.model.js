"use strict";
const BaseModel = require("./_base");
class AIPrediction extends BaseModel {
  static entity = "AIPrediction";
  static fields = [
    "id",
    "userId",
    "propertyId",
    "type",
    "value",
    "confidence",
    "modelVersion",
    "expiresAt"
  ];
  /**
   * Supported prediction types.
   *
   * Keep this list aligned with the prediction features
   * actually implemented by GHAR.
   */
  static types = [
    "price",
    "rent",
    "property_value",
    "demand",
    "investment",
    "roi",
    "risk",
    "recommendation",
    "location_score",
    "price_trend",
    "rent_trend",
    "market_trend"
  ];
  /**
   * Confidence is represented as a decimal between
   * 0 and 1.
   *
   * Example:
   * 0.95 = 95% confidence
   */
  static MIN_CONFIDENCE = 0;
  static MAX_CONFIDENCE = 1;
  /**
   * Maximum model-version string length.
   */
  static MAX_MODEL_VERSION_LENGTH = 100;
  /**
   * Validate prediction data.
   */
  static validate(data = {}) {
    const errors = [];
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return {
        valid: false,
        errors: [
          "AI prediction data must be an object"
        ]
      };
    }
    /**
     * Null protection.
     */
    for (const field of this.fields) {
      if (
        Object.prototype.hasOwnProperty.call(
          data,
          field
        ) &&
        data[field] === null
      ) {
        errors.push(
          `${field} cannot be null`
        );
      }
    }
    /**
     * userId.
     */
    if (
      data.userId !== undefined
    ) {
      if (
        typeof data.userId !== "string" ||
        data.userId.trim() === ""
      ) {
        errors.push(
          "userId must be a non-empty string"
        );
      }
    }
    /**
     * propertyId.
     */
    if (
      data.propertyId !== undefined
    ) {
      if (
        typeof data.propertyId !== "string" ||
        data.propertyId.trim() === ""
      ) {
        errors.push(
          "propertyId must be a non-empty string"
        );
      }
    }
    /**
     * type.
     */
    if (
      data.type !== undefined
    ) {
      if (
        typeof data.type !== "string"
      ) {
        errors.push(
          "type must be a string"
        );
      } else if (
        !this.types.includes(
          data.type
        )
      ) {
        errors.push(
          `type must be one of: ${this.types.join(", ")}`
        );
      }
    }
    /**
     * value.
     *
     * Predictions can be:
     * - numeric
     * - string
     * - structured object
     * - array
     *
     * This allows GHAR to store different prediction
     * outputs without forcing everything into one format.
     */
    if (
      data.value !== undefined
    ) {
      const valueType =
        typeof data.value;
      const valid =
        data.value !== null &&
        (
          valueType === "string" ||
          valueType === "number" ||
          valueType === "boolean" ||
          valueType === "object"
        );
      if (
        !valid
      ) {
        errors.push(
          "value has an unsupported type"
        );
      }
      if (
        typeof data.value === "number" &&
        !Number.isFinite(
          data.value
        )
      ) {
        errors.push(
          "value must be a finite number"
        );
      }
    }
    /**
     * confidence.
     */
    if (
      data.confidence !== undefined
    ) {
      if (
        typeof data.confidence !== "number" ||
        !Number.isFinite(
          data.confidence
        )
      ) {
        errors.push(
          "confidence must be a finite number"
        );
      } else if (
        data.confidence <
        this.MIN_CONFIDENCE ||
        data.confidence >
        this.MAX_CONFIDENCE
      ) {
        errors.push(
          "confidence must be between 0 and 1"
        );
      }
    }
    /**
     * modelVersion.
     */
    if (
      data.modelVersion !== undefined
    ) {
      if (
        typeof data.modelVersion !== "string"
      ) {
        errors.push(
          "modelVersion must be a string"
        );
      } else if (
        data.modelVersion.trim().length === 0
      ) {
        errors.push(
          "modelVersion cannot be empty"
        );
      } else if (
        data.modelVersion.length >
        this.MAX_MODEL_VERSION_LENGTH
      ) {
        errors.push(
          `modelVersion cannot exceed ${this.MAX_MODEL_VERSION_LENGTH} characters`
        );
      }
    }
    /**
     * expiresAt.
     */
    if (
      data.expiresAt !== undefined
    ) {
      const expiry =
        new Date(
          data.expiresAt
        );
      if (
        Number.isNaN(
          expiry.getTime()
        )
      ) {
        errors.push(
          "expiresAt must be a valid date"
        );
      }
    }
    return {
      valid:
        errors.length === 0,
      errors
    };
  }
  /**
   * Create a new AI prediction.
   */
  static create(data = {}) {
    const normalized = {
      ...data
    };
    /**
     * Normalize IDs.
     */
    if (
      typeof normalized.userId ===
      "string"
    ) {
      normalized.userId =
        normalized.userId.trim();
    }
    if (
      typeof normalized.propertyId ===
      "string"
    ) {
      normalized.propertyId =
        normalized.propertyId.trim();
    }
    /**
     * Normalize prediction type.
     */
    if (
      typeof normalized.type ===
      "string"
    ) {
      normalized.type =
        normalized.type
          .trim()
          .toLowerCase();
    }
    /**
     * Normalize model version.
     */
    if (
      typeof normalized.modelVersion ===
      "string"
    ) {
      normalized.modelVersion =
        normalized.modelVersion.trim();
    }
    /**
     * Normalize confidence.
     *
     * Supports:
     * 0.85
     * "0.85"
     * 85
     * "85%"
     */
    if (
      normalized.confidence !== undefined &&
      normalized.confidence !== null
    ) {
      if (
        typeof normalized.confidence ===
          "string" &&
        normalized.confidence
          .trim()
          .endsWith("%")
      ) {
        normalized.confidence =
          Number(
            normalized.confidence
              .trim()
              .slice(0, -1)
          ) / 100;
      } else {
        normalized.confidence =
          Number(
            normalized.confidence
          );
        if (
          normalized.confidence > 1 &&
          normalized.confidence <= 100
        ) {
          normalized.confidence /=
            100;
        }
      }
    }
    /**
     * Normalize expiry date to Date when supplied.
     */
    if (
      normalized.expiresAt !== undefined &&
      normalized.expiresAt !== null
    ) {
      const expiry =
        new Date(
          normalized.expiresAt
        );
      if (
        !Number.isNaN(
          expiry.getTime()
        )
      ) {
        normalized.expiresAt =
          expiry;
      }
    }
    const check =
      this.validate(
        normalized
      );
    if (
      !check.valid
    ) {
      const error =
        new Error(
          "AI prediction validation failed"
        );
      error.status = 422;
      error.code =
        "AI_PREDICTION_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Check whether a prediction type is supported.
   */
  static isValidType(
    type
  ) {
    return this.types.includes(
      type
    );
  }
  /**
   * Check whether confidence is valid.
   */
  static isValidConfidence(
    confidence
  ) {
    return (
      typeof confidence ===
        "number" &&
      Number.isFinite(
        confidence
      ) &&
      confidence >= 0 &&
      confidence <= 1
    );
  }
  /**
   * Check whether prediction has expired.
   */
  isExpired(
    now = new Date()
  ) {
    if (
      !this.expiresAt
    ) {
      return false;
    }
    const expiry =
      new Date(
        this.expiresAt
      );
    if (
      Number.isNaN(
        expiry.getTime()
      )
    ) {
      return true;
    }
    return (
      expiry.getTime() <=
      new Date(
        now
      ).getTime()
    );
  }
  /**
   * Check whether prediction is currently usable.
   */
  isValid(
    now = new Date()
  ) {
    return !this.isExpired(
      now
    );
  }
  /**
   * Get confidence as a percentage.
   *
   * Example:
   * 0.87 → 87
   */
  getConfidencePercentage() {
    if (
      !this.isValidConfidenceValue()
    ) {
      return null;
    }
    return (
      this.confidence * 100
    );
  }
  /**
   * Internal confidence check.
   */
  isValidConfidenceValue() {
    return (
      typeof this.confidence ===
        "number" &&
      Number.isFinite(
        this.confidence
      ) &&
      this.confidence >= 0 &&
      this.confidence <= 1
    );
  }
  /**
   * Set prediction confidence.
   */
  setConfidence(
    confidence
  ) {
    let value =
      Number(
        confidence
      );
    if (
      typeof confidence ===
        "string" &&
      confidence.trim().endsWith("%")
    ) {
      value =
        Number(
          confidence
            .trim()
            .slice(0, -1)
        ) / 100;
    } else if (
      value > 1 &&
      value <= 100
    ) {
      value /=
        100;
    }
    if (
      !this.constructor.isValidConfidence(
        value
      )
    ) {
      const error =
        new Error(
          "confidence must be between 0 and 1"
        );
      error.status = 422;
      error.code =
        "INVALID_PREDICTION_CONFIDENCE";
      throw error;
    }
    this.confidence =
      value;
    return this;
  }
  /**
   * Set expiry date.
   */
  setExpiry(
    expiresAt
  ) {
    const expiry =
      new Date(
        expiresAt
      );
    if (
      Number.isNaN(
        expiry.getTime()
      )
    ) {
      const error =
        new Error(
          "expiresAt must be a valid date"
        );
      error.status = 422;
      error.code =
        "INVALID_PREDICTION_EXPIRY";
      throw error;
    }
    this.expiresAt =
      expiry;
    return this;
  }
  /**
   * Remove expiry.
   */
  clearExpiry() {
    this.expiresAt =
      null;
    return this;
  }
  /**
   * Return safe API representation.
   */
  toJSON() {
    return {
      id:
        this.id,
      userId:
        this.userId,
      propertyId:
        this.propertyId,
      type:
        this.type,
      value:
        this.value,
      confidence:
        this.confidence ?? null,
      confidencePercentage:
        this.getConfidencePercentage(),
      modelVersion:
        this.modelVersion ?? null,
      expiresAt:
        this.expiresAt ?? null,
      expired:
        this.isExpired()
    };
  }
}
module.exports = AIPrediction;

Updated model

AIPrediction
├── id
├── userId
├── propertyId
├── type
├── value
├── confidence
├── modelVersion
└── expiresAt

The important additions are confidence normalization (85%, 85, or 0.85), expiry detection, controlled prediction types, model-version validation, and toJSON() output. This also keeps predictions tied to both the user and property, which fits the GHAR AI/property workflow.