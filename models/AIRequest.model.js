"use strict";
const BaseModel = require("./_base");
class AIRequest extends BaseModel {
  static entity = "AIRequest";
  static fields = [
    "id",
    "userId",
    "module",
    "provider",
    "model",
    "status",
    "requestPayload",
    "responsePayload",
    "error"
  ];
  /**
   * Supported GHAR AI modules.
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
   * AI request lifecycle.
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
   * Supported providers.
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
  static MAX_MODEL_LENGTH = 200;
  /**
   * Validate AI request.
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
          "AI request data must be an object"
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
     * provider.
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
     * model.
     */
    if (
      data.model !== undefined
    ) {
      if (
        typeof data.model !== "string"
      ) {
        errors.push(
          "model must be a string"
        );
      } else if (
        data.model.trim().length === 0
      ) {
        errors.push(
          "model cannot be empty"
        );
      } else if (
        data.model.length >
        this.MAX_MODEL_LENGTH
      ) {
        errors.push(
          `model cannot exceed ${this.MAX_MODEL_LENGTH} characters`
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
    /**
     * requestPayload.
     */
    if (
      data.requestPayload !== undefined
    ) {
      if (
        typeof data.requestPayload !== "object" ||
        Array.isArray(data.requestPayload)
      ) {
        errors.push(
          "requestPayload must be an object"
        );
      }
    }
    /**
     * responsePayload.
     */
    if (
      data.responsePayload !== undefined
    ) {
      if (
        typeof data.responsePayload !== "object" ||
        Array.isArray(data.responsePayload)
      ) {
        errors.push(
          "responsePayload must be an object"
        );
      }
    }
    /**
     * error.
     */
    if (
      data.error !== undefined
    ) {
      const validError =
        typeof data.error === "string" ||
        (
          data.error &&
          typeof data.error === "object" &&
          !Array.isArray(data.error)
        );
      if (
        !validError
      ) {
        errors.push(
          "error must be a string or object"
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
   * Create AI request.
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
        "pending";
    }
    if (
      normalized.requestPayload === undefined
    ) {
      normalized.requestPayload =
        {};
    }
    /**
     * Normalize strings.
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
      typeof normalized.provider ===
      "string"
    ) {
      normalized.provider =
        normalized.provider
          .trim()
          .toLowerCase();
    }
    if (
      typeof normalized.model ===
      "string"
    ) {
      normalized.model =
        normalized.model.trim();
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
          "AI request validation failed"
        );
      error.status = 422;
      error.code =
        "AI_REQUEST_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Provider validation.
   */
  static isValidProvider(
    provider
  ) {
    return this.providers.includes(
      provider
    );
  }
  /**
   * Module validation.
   */
  static isValidModule(
    module
  ) {
    return this.modules.includes(
      module
    );
  }
  /**
   * Status validation.
   */
  static isValidStatus(
    status
  ) {
    return this.statuses.includes(
      status
    );
  }
  /**
   * Check pending state.
   */
  isPending() {
    return (
      this.status ===
      "pending"
    );
  }
  /**
   * Check processing state.
   */
  isProcessing() {
    return (
      this.status ===
      "processing"
    );
  }
  /**
   * Check completed state.
   */
  isCompleted() {
    return (
      this.status ===
      "completed"
    );
  }
  /**
   * Check failed state.
   */
  isFailed() {
    return (
      this.status ===
      "failed"
    );
  }
  /**
   * Check whether request has reached a terminal state.
   */
  isFinished() {
    return [
      "completed",
      "failed",
      "cancelled",
      "timeout"
    ].includes(
      this.status
    );
  }
  /**
   * Mark request as processing.
   */
  startProcessing() {
    this.status =
      "processing";
    return this;
  }
  /**
   * Mark request as completed.
   */
  complete(
    responsePayload = {}
  ) {
    if (
      responsePayload !== undefined &&
      (
        !responsePayload ||
        typeof responsePayload !== "object" ||
        Array.isArray(responsePayload)
      )
    ) {
      const error =
        new Error(
          "responsePayload must be an object"
        );
      error.status = 422;
      error.code =
        "INVALID_AI_RESPONSE_PAYLOAD";
      throw error;
    }
    this.responsePayload =
      responsePayload;
    this.error =
      null;
    this.status =
      "completed";
    return this;
  }
  /**
   * Mark request as failed.
   */
  fail(
    error
  ) {
    if (
      error instanceof Error
    ) {
      this.error = {
        name:
          error.name,
        message:
          error.message,
        code:
          error.code || null
      };
    } else if (
      typeof error === "string"
    ) {
      this.error = {
        message:
          error
      };
    } else {
      this.error =
        error || {
          message:
            "AI request failed"
        };
    }
    this.status =
      "failed";
    return this;
  }
  /**
   * Cancel request.
   */
  cancel(
    reason = "Request cancelled"
  ) {
    this.error = {
      code:
        "AI_REQUEST_CANCELLED",
      message:
        reason
    };
    this.status =
      "cancelled";
    return this;
  }
  /**
   * Mark request as timed out.
   */
  timeout(
    message =
      "AI request timed out"
  ) {
    this.error = {
      code:
        "AI_REQUEST_TIMEOUT",
      message
    };
    this.status =
      "timeout";
    return this;
  }
  /**
   * Update request payload.
   */
  setRequestPayload(
    payload = {}
  ) {
    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      const error =
        new Error(
          "requestPayload must be an object"
        );
      error.status = 422;
      error.code =
        "INVALID_AI_REQUEST_PAYLOAD";
      throw error;
    }
    this.requestPayload =
      payload;
    return this;
  }
  /**
   * Update response payload.
   */
  setResponsePayload(
    payload = {}
  ) {
    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      const error =
        new Error(
          "responsePayload must be an object"
        );
      error.status = 422;
      error.code =
        "INVALID_AI_RESPONSE_PAYLOAD";
      throw error;
    }
    this.responsePayload =
      payload;
    return this;
  }
  /**
   * Return a safe representation.
   *
   * IMPORTANT:
   * AI request payloads can contain sensitive user/property
   * information. This method removes common credential fields.
   */
  toJSON() {
    const sanitize =
      (value) => {
        if (
          !value ||
          typeof value !== "object"
        ) {
          return value;
        }
        if (
          Array.isArray(value)
        ) {
          return value.map(
            sanitize
          );
        }
        const result = {};
        const sensitiveKeys = [
          "apiKey",
          "api_key",
          "authorization",
          "accessToken",
          "access_token",
          "refreshToken",
          "refresh_token",
          "password",
          "secret",
          "secretKey",
          "secret_key"
        ];
        for (
          const [
            key,
            item
          ] of Object.entries(
            value
          )
        ) {
          if (
            sensitiveKeys.includes(
              key
            )
          ) {
            result[key] =
              "[REDACTED]";
          } else {
            result[key] =
              sanitize(item);
          }
        }
        return result;
      };
    return {
      id:
        this.id,
      userId:
        this.userId,
      module:
        this.module,
      provider:
        this.provider,
      model:
        this.model,
      status:
        this.status,
      requestPayload:
        sanitize(
          this.requestPayload || {}
        ),
      responsePayload:
        sanitize(
          this.responsePayload || {}
        ),
      error:
        this.error || null
    };
  }
}
module.exports =
  AIRequest;

GHAR AI request lifecycle

pending
   │
   ▼
processing
   │
   ├──────────────► completed
   │
   ├──────────────► failed
   │
   ├──────────────► timeout
   │
   └──────────────► cancelled

This model is particularly useful for your AI controller because every provider call can now be recorded consistently:

const request = AIRequest.create({
  userId,
  module: "property",
  provider: "openai",
  model: "your-model",
  requestPayload
});
request.startProcessing();
// provider call...
request.complete(responsePayload);

For an error:

request.fail(error);

One important production feature here is the recursive payload sanitization in toJSON(), so provider credentials accidentally present in a payload aren’t exposed through normal API serialization.