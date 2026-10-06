"use strict";
const BaseModel = require("./_base");
class AIRecommendation extends BaseModel {
  static entity = "AIRecommendation";
  static fields = [
    "id",
    "userId",
    "propertyId",
    "module",
    "score",
    "reasons",
    "modelVersion"
  ];
  /**
   * GHAR AI recommendation modules.
   */
  static modules = [
    "property",
    "search",
    "investment",
    "rent",
    "buy",
    "sell",
    "loan",
    "marketplace",
    "location",
    "similar_properties",
    "personalized"
  ];
  /**
   * Recommendation score range.
   *
   * Internally stored as 0-1.
   *
   * Example:
   * 0.92 = 92% recommendation score
   */
  static MIN_SCORE = 0;
  static MAX_SCORE = 1;
  static MAX_MODEL_VERSION_LENGTH = 100;
  /**
   * Validate recommendation data.
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
          "AI recommendation data must be an object"
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
     * module.
     */
    if (
      data.module !== undefined
    ) {
      if (
        typeof data.module !== "string"
      ) {
        errors.push(
          "module must be a string"
        );
      } else if (
        !this.modules.includes(
          data.module
        )
      ) {
        errors.push(
          `module must be one of: ${this.modules.join(", ")}`
        );
      }
    }
    /**
     * score.
     */
    if (
      data.score !== undefined
    ) {
      if (
        typeof data.score !== "number" ||
        !Number.isFinite(
          data.score
        )
      ) {
        errors.push(
          "score must be a finite number"
        );
      } else if (
        data.score <
          this.MIN_SCORE ||
        data.score >
          this.MAX_SCORE
      ) {
        errors.push(
          "score must be between 0 and 1"
        );
      }
    }
    /**
     * reasons.
     *
     * Supports either:
     *
     * [
     *   "Good location",
     *   "Within budget"
     * ]
     *
     * or:
     *
     * [
     *   {
     *     reason: "Good location",
     *     weight: 0.8
     *   }
     * ]
     */
    if (
      data.reasons !== undefined
    ) {
      if (
        !Array.isArray(
          data.reasons
        )
      ) {
        errors.push(
          "reasons must be an array"
        );
      } else {
        data.reasons.forEach(
          (reason, index) => {
            if (
              typeof reason !== "string" &&
              (
                !reason ||
                typeof reason !== "object" ||
                Array.isArray(reason)
              )
            ) {
              errors.push(
                `reasons[${index}] must be a string or object`
              );
            }
            if (
              typeof reason === "object" &&
              reason !== null &&
              reason.weight !== undefined
            ) {
              if (
                typeof reason.weight !== "number" ||
                !Number.isFinite(
                  reason.weight
                )
              ) {
                errors.push(
                  `reasons[${index}].weight must be a finite number`
                );
              } else if (
                reason.weight < 0 ||
                reason.weight > 1
              ) {
                errors.push(
                  `reasons[${index}].weight must be between 0 and 1`
                );
              }
            }
          }
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
    return {
      valid:
        errors.length === 0,
      errors
    };
  }
  /**
   * Create recommendation.
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
     * Normalize module.
     */
    if (
      typeof normalized.module ===
      "string"
    ) {
      normalized.module =
        normalized.module
          .trim()
          .toLowerCase();
    }
    /**
     * Normalize score.
     *
     * Supports:
     * 0.92
     * "0.92"
     * 92
     * "92%"
     */
    if (
      normalized.score !== undefined &&
      normalized.score !== null
    ) {
      if (
        typeof normalized.score ===
          "string" &&
        normalized.score
          .trim()
          .endsWith("%")
      ) {
        normalized.score =
          Number(
            normalized.score
              .trim()
              .slice(0, -1)
          ) / 100;
      } else {
        normalized.score =
          Number(
            normalized.score
          );
        if (
          normalized.score > 1 &&
          normalized.score <= 100
        ) {
          normalized.score /=
            100;
        }
      }
    }
    /**
     * Normalize reasons.
     */
    if (
      normalized.reasons === undefined
    ) {
      normalized.reasons = [];
    }
    if (
      typeof normalized.modelVersion ===
      "string"
    ) {
      normalized.modelVersion =
        normalized.modelVersion.trim();
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
          "AI recommendation validation failed"
        );
      error.status = 422;
      error.code =
        "AI_RECOMMENDATION_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Check whether a module is supported.
   */
  static isValidModule(
    module
  ) {
    return this.modules.includes(
      module
    );
  }
  /**
   * Check whether score is valid.
   */
  static isValidScore(
    score
  ) {
    return (
      typeof score ===
        "number" &&
      Number.isFinite(
        score
      ) &&
      score >= 0 &&
      score <= 1
    );
  }
  /**
   * Check whether recommendation has a strong score.
   */
  isStrong(
    threshold = 0.75
  ) {
    return (
      this.isValidScoreValue() &&
      this.score >= threshold
    );
  }
  /**
   * Check whether recommendation is weak.
   */
  isWeak(
    threshold = 0.5
  ) {
    return (
      this.isValidScoreValue() &&
      this.score < threshold
    );
  }
  /**
   * Internal score validation.
   */
  isValidScoreValue() {
    return (
      typeof this.score ===
        "number" &&
      Number.isFinite(
        this.score
      ) &&
      this.score >= 0 &&
      this.score <= 1
    );
  }
  /**
   * Return score as percentage.
   *
   * Example:
   * 0.87 → 87
   */
  getScorePercentage() {
    if (
      !this.isValidScoreValue()
    ) {
      return null;
    }
    return (
      this.score * 100
    );
  }
  /**
   * Set recommendation score.
   */
  setScore(
    score
  ) {
    let value =
      Number(score);
    if (
      typeof score ===
        "string" &&
      score.trim().endsWith("%")
    ) {
      value =
        Number(
          score
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
      !this.constructor.isValidScore(
        value
      )
    ) {
      const error =
        new Error(
          "score must be between 0 and 1"
        );
      error.status = 422;
      error.code =
        "INVALID_RECOMMENDATION_SCORE";
      throw error;
    }
    this.score =
      value;
    return this;
  }
  /**
   * Add a recommendation reason.
   */
  addReason(
    reason,
    weight = undefined
  ) {
    if (
      typeof reason !==
      "string"
    ) {
      throw new TypeError(
        "reason must be a string"
      );
    }
    const text =
      reason.trim();
    if (
      !text
    ) {
      throw new Error(
        "reason cannot be empty"
      );
    }
    if (
      weight === undefined
    ) {
      this.reasons = [
        ...(this.reasons || []),
        text
      ];
      return this;
    }
    const numericWeight =
      Number(weight);
    if (
      !Number.isFinite(
        numericWeight
      ) ||
      numericWeight < 0 ||
      numericWeight > 1
    ) {
      const error =
        new Error(
          "reason weight must be between 0 and 1"
        );
      error.status = 422;
      error.code =
        "INVALID_REASON_WEIGHT";
      throw error;
    }
    this.reasons = [
      ...(this.reasons || []),
      {
        reason: text,
        weight:
          numericWeight
      }
    ];
    return this;
  }
  /**
   * Replace recommendation reasons.
   */
  setReasons(
    reasons = []
  ) {
    if (
      !Array.isArray(
        reasons
      )
    ) {
      const error =
        new Error(
          "reasons must be an array"
        );
      error.status = 422;
      error.code =
        "INVALID_RECOMMENDATION_REASONS";
      throw error;
    }
    const check =
      this.constructor.validate({
        ...this,
        reasons
      });
    if (
      !check.valid
    ) {
      const error =
        new Error(
          "Invalid recommendation reasons"
        );
      error.status = 422;
      error.code =
        "INVALID_RECOMMENDATION_REASONS";
      error.details =
        check.errors;
      throw error;
    }
    this.reasons =
      reasons;
    return this;
  }
  /**
   * Get reasons as readable strings.
   */
  getReasonTexts() {
    return (
      this.reasons || []
    ).map(
      reason => {
        if (
          typeof reason ===
          "string"
        ) {
          return reason;
        }
        return reason?.reason ||
          "";
      }
    ).filter(Boolean);
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
      module:
        this.module,
      score:
        this.score ?? null,
      scorePercentage:
        this.getScorePercentage(),
      reasons:
        this.reasons || [],
      modelVersion:
        this.modelVersion ?? null
    };
  }
}
module.exports =
  AIRecommendation;

This gives your GHAR recommendation model a clean structure:

AIRecommendation
├── id
├── userId
├── propertyId
├── module
├── score
├── reasons
└── modelVersion

It also supports recommendation scores such as 0.92, 92, or "92%", while internally normalizing them to 0–1.