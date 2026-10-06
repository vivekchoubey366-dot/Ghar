"use strict";
const BaseModel = require("./_base");
class AIUsage extends BaseModel {
  static entity = "AIUsage";
  static fields = [
    "id",
    "userId",
    "module",
    "requestId",
    "inputTokens",
    "outputTokens",
    "latencyMs",
    "cost",
    "status"
  ];
  /**
   * GHAR AI modules.
   */
  static modules = [
    "general",
    "property",
    "search",
    "loan",
    "investment",
    "marketplace",
    "recommendation",
    "prediction",
    "map",
    "support",
    "admin",
    "verification"
  ];
  /**
   * Usage record lifecycle.
   */
  static statuses = [
    "pending",
    "processing",
    "completed",
    "failed",
    "cancelled",
    "timeout"
  ];
  /**
   * Validation limits.
   */
  static MAX_TOKENS = Number.MAX_SAFE_INTEGER;
  static MAX_LATENCY_MS = Number.MAX_SAFE_INTEGER;
  static MAX_COST = Number.MAX_SAFE_INTEGER;
  /**
   * Validate AI usage data.
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
          "AI usage data must be an object"
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
     * requestId.
     */
    if (
      data.requestId !== undefined
    ) {
      if (
        typeof data.requestId !== "string" ||
        data.requestId.trim() === ""
      ) {
        errors.push(
          "requestId must be a non-empty string"
        );
      }
    }
    /**
     * Token validation.
     */
    const tokenFields = [
      "inputTokens",
      "outputTokens"
    ];
    for (
      const field of tokenFields
    ) {
      if (
        data[field] !== undefined
      ) {
        if (
          !Number.isInteger(
            data[field]
          )
        ) {
          errors.push(
            `${field} must be an integer`
          );
        } else if (
          data[field] < 0
        ) {
          errors.push(
            `${field} cannot be negative`
          );
        } else if (
          data[field] >
          this.MAX_TOKENS
        ) {
          errors.push(
            `${field} exceeds the maximum allowed value`
          );
        }
      }
    }
    /**
     * latencyMs.
     */
    if (
      data.latencyMs !== undefined
    ) {
      if (
        !Number.isInteger(
          data.latencyMs
        )
      ) {
        errors.push(
          "latencyMs must be an integer"
        );
      } else if (
        data.latencyMs < 0
      ) {
        errors.push(
          "latencyMs cannot be negative"
        );
      } else if (
        data.latencyMs >
        this.MAX_LATENCY_MS
      ) {
        errors.push(
          "latencyMs exceeds the maximum allowed value"
        );
      }
    }
    /**
     * cost.
     *
     * Stored as a non-negative number.
     */
    if (
      data.cost !== undefined
    ) {
      if (
        typeof data.cost !== "number" ||
        !Number.isFinite(
          data.cost
        )
      ) {
        errors.push(
          "cost must be a finite number"
        );
      } else if (
        data.cost < 0
      ) {
        errors.push(
          "cost cannot be negative"
        );
      } else if (
        data.cost >
        this.MAX_COST
      ) {
        errors.push(
          "cost exceeds the maximum allowed value"
        );
      }
    }
    /**
     * status.
     */
    if (
      data.status !== undefined
    ) {
      if (
        typeof data.status !== "string"
      ) {
        errors.push(
          "status must be a string"
        );
      } else if (
        !this.statuses.includes(
          data.status
        )
      ) {
        errors.push(
          `status must be one of: ${this.statuses.join(", ")}`
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
   * Create AI usage record.
   */
  static create(data = {}) {
    const normalized = {
      ...data
    };
    /**
     * Defaults.
     */
    if (
      normalized.inputTokens === undefined
    ) {
      normalized.inputTokens = 0;
    }
    if (
      normalized.outputTokens === undefined
    ) {
      normalized.outputTokens = 0;
    }
    if (
      normalized.cost === undefined
    ) {
      normalized.cost = 0;
    }
    if (
      normalized.status === undefined
    ) {
      normalized.status =
        "pending";
    }
    /**
     * Normalize identifiers.
     */
    if (
      typeof normalized.userId ===
      "string"
    ) {
      normalized.userId =
        normalized.userId.trim();
    }
    if (
      typeof normalized.module ===
      "string"
    ) {
      normalized.module =
        normalized.module
          .trim()
          .toLowerCase();
    }
    if (
      typeof normalized.requestId ===
      "string"
    ) {
      normalized.requestId =
        normalized.requestId.trim();
    }
    /**
     * Normalize numeric values.
     */
    if (
      normalized.inputTokens !== undefined
    ) {
      normalized.inputTokens =
        Number(
          normalized.inputTokens
        );
    }
    if (
      normalized.outputTokens !== undefined
    ) {
      normalized.outputTokens =
        Number(
          normalized.outputTokens
        );
    }
    if (
      normalized.latencyMs !== undefined &&
      normalized.latencyMs !== null
    ) {
      normalized.latencyMs =
        Number(
          normalized.latencyMs
        );
    }
    if (
      normalized.cost !== undefined
    ) {
      normalized.cost =
        Number(
          normalized.cost
        );
    }
    if (
      typeof normalized.status ===
      "string"
    ) {
      normalized.status =
        normalized.status
          .trim()
          .toLowerCase();
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
          "AI usage validation failed"
        );
      error.status = 422;
      error.code =
        "AI_USAGE_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Check whether module is supported.
   */
  static isValidModule(
    module
  ) {
    return this.modules.includes(
      module
    );
  }
  /**
   * Check whether status is supported.
   */
  static isValidStatus(
    status
  ) {
    return this.statuses.includes(
      status
    );
  }
  /**
   * Total tokens consumed.
   */
  getTotalTokens() {
    return (
      Number(
        this.inputTokens || 0
      ) +
      Number(
        this.outputTokens || 0
      )
    );
  }
  /**
   * Get input/output token ratio.
   */
  getTokenRatio() {
    const input =
      Number(
        this.inputTokens || 0
      );
    const output =
      Number(
        this.outputTokens || 0
      );
    if (
      output === 0
    ) {
      return null;
    }
    return input / output;
  }
  /**
   * Get cost per 1,000 tokens.
   */
  getCostPerThousandTokens() {
    const total =
      this.getTotalTokens();
    const cost =
      Number(
        this.cost || 0
      );
    if (
      total <= 0
    ) {
      return 0;
    }
    return (
      cost / total
    ) * 1000;
  }
  /**
   * Check whether usage is successful.
   */
  isSuccessful() {
    return (
      this.status ===
      "completed"
    );
  }
  /**
   * Check whether usage failed.
   */
  isFailed() {
    return [
      "failed",
      "timeout",
      "cancelled"
    ].includes(
      this.status
    );
  }
  /**
   * Check whether usage is still active.
   */
  isActive() {
    return [
      "pending",
      "processing"
    ].includes(
      this.status
    );
  }
  /**
   * Mark usage as processing.
   */
  startProcessing() {
    this.status =
      "processing";
    return this;
  }
  /**
   * Mark usage as completed.
   */
  complete({
    inputTokens,
    outputTokens,
    latencyMs,
    cost
  } = {}) {
    if (
      inputTokens !== undefined
    ) {
      this.inputTokens =
        Number(
          inputTokens
        );
    }
    if (
      outputTokens !== undefined
    ) {
      this.outputTokens =
        Number(
          outputTokens
        );
    }
    if (
      latencyMs !== undefined
    ) {
      this.latencyMs =
        Number(
          latencyMs
        );
    }
    if (
      cost !== undefined
    ) {
      this.cost =
        Number(
          cost
        );
    }
    this.status =
      "completed";
    const check =
      this.constructor.validate(
        this
      );
    if (
      !check.valid
    ) {
      const error =
        new Error(
          "Invalid completed AI usage"
        );
      error.status = 422;
      error.code =
        "INVALID_COMPLETED_AI_USAGE";
      error.details =
        check.errors;
      throw error;
    }
    return this;
  }
  /**
   * Mark usage as failed.
   */
  fail() {
    this.status =
      "failed";
    return this;
  }
  /**
   * Mark usage as timed out.
   */
  timeout() {
    this.status =
      "timeout";
    return this;
  }
  /**
   * Mark usage as cancelled.
   */
  cancel() {
    this.status =
      "cancelled";
    return this;
  }
  /**
   * Set token usage.
   */
  setTokens(
    inputTokens,
    outputTokens
  ) {
    const input =
      Number(
        inputTokens
      );
    const output =
      Number(
        outputTokens
      );
    if (
      !Number.isInteger(
        input
      ) ||
      input < 0
    ) {
      throw new Error(
        "inputTokens must be a non-negative integer"
      );
    }
    if (
      !Number.isInteger(
        output
      ) ||
      output < 0
    ) {
      throw new Error(
        "outputTokens must be a non-negative integer"
      );
    }
    this.inputTokens =
      input;
    this.outputTokens =
      output;
    return this;
  }
  /**
   * Set latency.
   */
  setLatency(
    latencyMs
  ) {
    const value =
      Number(
        latencyMs
      );
    if (
      !Number.isInteger(
        value
      ) ||
      value < 0
    ) {
      const error =
        new Error(
          "latencyMs must be a non-negative integer"
        );
      error.status = 422;
      error.code =
        "INVALID_AI_LATENCY";
      throw error;
    }
    this.latencyMs =
      value;
    return this;
  }
  /**
   * Set AI cost.
   */
  setCost(
    cost
  ) {
    const value =
      Number(
        cost
      );
    if (
      !Number.isFinite(
        value
      ) ||
      value < 0
    ) {
      const error =
        new Error(
          "cost must be a non-negative number"
        );
      error.status = 422;
      error.code =
        "INVALID_AI_COST";
      throw error;
    }
    this.cost =
      value;
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
      module:
        this.module,
      requestId:
        this.requestId,
      inputTokens:
        this.inputTokens ?? 0,
      outputTokens:
        this.outputTokens ?? 0,
      totalTokens:
        this.getTotalTokens(),
      latencyMs:
        this.latencyMs ?? null,
      cost:
        this.cost ?? 0,
      costPerThousandTokens:
        this.getCostPerThousandTokens(),
      status:
        this.status
    };
  }
}
module.exports =
  AIUsage;

GHAR AI flow

Your AI models now fit together cleanly:

AIRequest
    │
    ├── provider
    ├── model
    ├── requestPayload
    └── responsePayload
          │
          ▼
      AIUsage
          │
          ├── inputTokens
          ├── outputTokens
          ├── latencyMs
          ├── cost
          └── status

And the relationship should be:

AIRequest
   │
   └── requestId
          │
          ▼
       AIUsage

This gives you the foundation for AI quotas, subscription limits, provider cost tracking, admin analytics, per-user billing, latency monitoring, and AI usage dashboards without changing the fields you already defined.