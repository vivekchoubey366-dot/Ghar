"use strict";
const BaseModel = require("./_base");
class AIModel extends BaseModel {
  static entity = "AIModel";
  static fields = [
    "id",
    "name",
    "provider",
    "version",
    "status",
    "config",
    "usageLimits"
  ];
  /**
   * Supported AI providers.
   *
   * Add your actual providers here as GHAR integrations
   * are enabled.
   */
  static providers = [
    "openai",
    "anthropic",
    "google",
    "azure",
    "cohere",
    "mistral",
    "groq",
    "local",
    "custom"
  ];
  /**
   * Supported model states.
   */
  static statuses = [
    "active",
    "inactive",
    "maintenance",
    "deprecated"
  ];
  /**
   * Validate AI model data.
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
          "AI model data must be an object"
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
     * name
     */
    if (
      data.name !== undefined
    ) {
      if (
        typeof data.name !== "string"
      ) {
        errors.push(
          "name must be a string"
        );
      } else if (
        data.name.trim().length === 0
      ) {
        errors.push(
          "name cannot be empty"
        );
      } else if (
        data.name.length > 200
      ) {
        errors.push(
          "name cannot exceed 200 characters"
        );
      }
    }
    /**
     * provider
     */
    if (
      data.provider !== undefined
    ) {
      if (
        typeof data.provider !== "string"
      ) {
        errors.push(
          "provider must be a string"
        );
      } else if (
        !this.providers.includes(
          data.provider
        )
      ) {
        errors.push(
          `provider must be one of: ${this.providers.join(", ")}`
        );
      }
    }
    /**
     * version
     */
    if (
      data.version !== undefined
    ) {
      if (
        typeof data.version !== "string"
      ) {
        errors.push(
          "version must be a string"
        );
      } else if (
        data.version.trim().length === 0
      ) {
        errors.push(
          "version cannot be empty"
        );
      } else if (
        data.version.length > 100
      ) {
        errors.push(
          "version cannot exceed 100 characters"
        );
      }
    }
    /**
     * status
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
    /**
     * config
     */
    if (
      data.config !== undefined
    ) {
      if (
        typeof data.config !== "object" ||
        Array.isArray(data.config)
      ) {
        errors.push(
          "config must be an object"
        );
      }
    }
    /**
     * usageLimits
     */
    if (
      data.usageLimits !== undefined
    ) {
      if (
        typeof data.usageLimits !== "object" ||
        Array.isArray(data.usageLimits)
      ) {
        errors.push(
          "usageLimits must be an object"
        );
      } else {
        const limits =
          data.usageLimits;
        const numericFields = [
          "requestsPerMinute",
          "requestsPerHour",
          "requestsPerDay",
          "tokensPerMinute",
          "tokensPerHour",
          "tokensPerDay",
          "maxTokensPerRequest"
        ];
        for (
          const field of numericFields
        ) {
          if (
            limits[field] !== undefined
          ) {
            if (
              !Number.isInteger(
                limits[field]
              )
            ) {
              errors.push(
                `usageLimits.${field} must be an integer`
              );
            } else if (
              limits[field] < 0
            ) {
              errors.push(
                `usageLimits.${field} cannot be negative`
              );
            }
          }
        }
      }
    }
    return {
      valid:
        errors.length === 0,
      errors
    };
  }
  /**
   * Create a new AI model.
   */
  static create(data = {}) {
    const normalized = {
      ...data
    };
    /**
     * Defaults.
     */
    if (
      normalized.status === undefined
    ) {
      normalized.status =
        "active";
    }
    if (
      normalized.config === undefined
    ) {
      normalized.config = {};
    }
    if (
      normalized.usageLimits === undefined
    ) {
      normalized.usageLimits = {};
    }
    /**
     * Normalize strings.
     */
    if (
      typeof normalized.name === "string"
    ) {
      normalized.name =
        normalized.name.trim();
    }
    if (
      typeof normalized.provider === "string"
    ) {
      normalized.provider =
        normalized.provider
          .trim()
          .toLowerCase();
    }
    if (
      typeof normalized.version === "string"
    ) {
      normalized.version =
        normalized.version.trim();
    }
    if (
      typeof normalized.status === "string"
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
          "AI model validation failed"
        );
      error.status = 422;
      error.code =
        "AI_MODEL_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Check whether provider is supported.
   */
  static isValidProvider(
    provider
  ) {
    return this.providers.includes(
      provider
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
   * Check whether model is active.
   */
  isActive() {
    return (
      this.status ===
      "active"
    );
  }
  /**
   * Check whether model is available for requests.
   */
  isAvailable() {
    return (
      this.status ===
        "active"
    );
  }
  /**
   * Disable model.
   */
  deactivate() {
    this.status =
      "inactive";
    return this;
  }
  /**
   * Activate model.
   */
  activate() {
    this.status =
      "active";
    return this;
  }
  /**
   * Put model into maintenance.
   */
  setMaintenance() {
    this.status =
      "maintenance";
    return this;
  }
  /**
   * Mark model as deprecated.
   */
  deprecate() {
    this.status =
      "deprecated";
    return this;
  }
  /**
   * Update model configuration.
   */
  setConfig(
    config = {}
  ) {
    if (
      !config ||
      typeof config !== "object" ||
      Array.isArray(config)
    ) {
      const error =
        new Error(
          "config must be an object"
        );
      error.status = 422;
      error.code =
        "INVALID_AI_MODEL_CONFIG";
      throw error;
    }
    this.config = {
      ...(this.config || {}),
      ...config
    };
    return this;
  }
  /**
   * Update usage limits.
   */
  setUsageLimits(
    limits = {}
  ) {
    if (
      !limits ||
      typeof limits !== "object" ||
      Array.isArray(limits)
    ) {
      const error =
        new Error(
          "usageLimits must be an object"
        );
      error.status = 422;
      error.code =
        "INVALID_AI_USAGE_LIMITS";
      throw error;
    }
    const merged = {
      ...(this.usageLimits || {}),
      ...limits
    };
    const check =
      this.validate({
        ...this,
        usageLimits:
          merged
      });
    if (
      !check.valid
    ) {
      const error =
        new Error(
          "Invalid AI model usage limits"
        );
      error.status = 422;
      error.code =
        "INVALID_AI_USAGE_LIMITS";
      error.details =
        check.errors;
      throw error;
    }
    this.usageLimits =
      merged;
    return this;
  }
  /**
   * Get a specific usage limit.
   */
  getUsageLimit(
    name,
    defaultValue = null
  ) {
    if (
      !this.usageLimits ||
      typeof this.usageLimits !== "object"
    ) {
      return defaultValue;
    }
    return (
      this.usageLimits[name] ??
      defaultValue
    );
  }
  /**
   * Check whether a request token count is within
   * the configured per-request limit.
   */
  canHandleTokens(
    tokens
  ) {
    const count =
      Number(tokens);
    if (
      !Number.isFinite(
        count
      ) ||
      count < 0
    ) {
      return false;
    }
    const limit =
      this.getUsageLimit(
        "maxTokensPerRequest"
      );
    if (
      limit === null ||
      limit === undefined
    ) {
      return true;
    }
    return (
      count <=
      limit
    );
  }
  /**
   * Return a safe API representation.
   *
   * Sensitive provider credentials should never be stored
   * inside config in the first place. API keys/secrets should
   * come from environment variables or a secrets manager.
   */
  toJSON() {
    const safeConfig = {
      ...(this.config || {})
    };
    /**
     * Prevent accidental exposure of credentials if somebody
     * incorrectly placed them inside config.
     */
    const sensitiveKeys = [
      "apiKey",
      "api_key",
      "secret",
      "secretKey",
      "secret_key",
      "accessToken",
      "access_token",
      "password",
      "token"
    ];
    for (
      const key of sensitiveKeys
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          safeConfig,
          key
        )
      ) {
        delete safeConfig[key];
      }
    }
    return {
      id:
        this.id,
      name:
        this.name,
      provider:
        this.provider,
      version:
        this.version,
      status:
        this.status,
      config:
        safeConfig,
      usageLimits:
        this.usageLimits || {}
    };
  }
}
module.exports = AIModel;

Updated AI model structure

AIModel
├── id
├── name
├── provider
├── version
├── status
├── config
└── usageLimits

The main improvement for GHAR is that provider credentials are not exposed through toJSON(). Keep API keys/secrets in your environment/secrets configuration rather than inside the model record.