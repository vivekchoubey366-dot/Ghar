"use strict";

const BaseModel = require("./_base");

class AIMessage extends BaseModel {
  static entity = "AIMessage";

  static fields = [
    "id",
    "conversationId",
    "role",
    "content",
    "tokens",
    "metadata"
  ];

  /**
   * Allowed AI message roles.
   */
  static roles = [
    "system",
    "user",
    "assistant",
    "tool"
  ];

  /**
   * Maximum message content length.
   */
  static MAX_CONTENT_LENGTH = 100000;

  /**
   * Validate AI message data.
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
          "AI message data must be an object"
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
     * conversationId.
     */
    if (
      data.conversationId !== undefined
    ) {
      if (
        typeof data.conversationId !== "string" ||
        data.conversationId.trim() === ""
      ) {
        errors.push(
          "conversationId must be a non-empty string"
        );
      }
    }

    /**
     * role.
     */
    if (
      data.role !== undefined
    ) {
      if (
        typeof data.role !== "string"
      ) {
        errors.push(
          "role must be a string"
        );
      } else if (
        !this.roles.includes(
          data.role
        )
      ) {
        errors.push(
          `role must be one of: ${this.roles.join(", ")}`
        );
      }
    }

    /**
     * content.
     */
    if (
      data.content !== undefined
    ) {
      if (
        typeof data.content !== "string"
      ) {
        errors.push(
          "content must be a string"
        );
      } else if (
        data.content.length >
        this.MAX_CONTENT_LENGTH
      ) {
        errors.push(
          `content cannot exceed ${this.MAX_CONTENT_LENGTH} characters`
        );
      }
    }

    /**
     * tokens.
     *
     * Supports:
     * - integer token count
     * - null/undefined when token usage is unavailable
     */
    if (
      data.tokens !== undefined &&
      data.tokens !== null
    ) {
      if (
        !Number.isInteger(
          data.tokens
        )
      ) {
        errors.push(
          "tokens must be an integer"
        );
      } else if (
        data.tokens < 0
      ) {
        errors.push(
          "tokens cannot be negative"
        );
      }
    }

    /**
     * metadata.
     */
    if (
      data.metadata !== undefined
    ) {
      if (
        typeof data.metadata !== "object" ||
        Array.isArray(data.metadata)
      ) {
        errors.push(
          "metadata must be an object"
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
   * Create a new AI message.
   */
  static create(data = {}) {
    const normalized = {
      ...data
    };

    /**
     * Defaults.
     */
    if (
      normalized.role === undefined
    ) {
      normalized.role =
        "user";
    }

    if (
      normalized.metadata === undefined
    ) {
      normalized.metadata = {};
    }

    /**
     * Normalize conversation ID.
     */
    if (
      typeof normalized.conversationId ===
      "string"
    ) {
      normalized.conversationId =
        normalized.conversationId.trim();
    }

    /**
     * Normalize role.
     */
    if (
      typeof normalized.role ===
      "string"
    ) {
      normalized.role =
        normalized.role
          .trim()
          .toLowerCase();
    }

    /**
     * Normalize content.
     */
    if (
      typeof normalized.content ===
      "string"
    ) {
      normalized.content =
        normalized.content.trim();
    }

    /**
     * Normalize token count.
     */
    if (
      normalized.tokens !== undefined &&
      normalized.tokens !== null
    ) {
      normalized.tokens =
        Number(
          normalized.tokens
        );
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
          "AI message validation failed"
        );

      error.status = 422;

      error.code =
        "AI_MESSAGE_VALIDATION_ERROR";

      error.details =
        check.errors;

      throw error;
    }

    return new this(
      normalized
    );
  }

  /**
   * Check whether a role is valid.
   */
  static isValidRole(
    role
  ) {
    return this.roles.includes(
      role
    );
  }

  /**
   * Check whether message is from user.
   */
  isUserMessage() {
    return (
      this.role ===
      "user"
    );
  }

  /**
   * Check whether message is from AI.
   */
  isAssistantMessage() {
    return (
      this.role ===
      "assistant"
    );
  }

  /**
   * Check whether message is a system instruction.
   */
  isSystemMessage() {
    return (
      this.role ===
      "system"
    );
  }

  /**
   * Check whether message is a tool message.
   */
  isToolMessage() {
    return (
      this.role ===
      "tool"
    );
  }

  /**
   * Check whether token usage is available.
   */
  hasTokenUsage() {
    return (
      Number.isInteger(
        this.tokens
      ) &&
      this.tokens >= 0
    );
  }

  /**
   * Set token usage.
   */
  setTokens(
    tokens
  ) {
    const value =
      Number(tokens);

    if (
      !Number.isInteger(
        value
      ) ||
      value < 0
    ) {
      const error =
        new Error(
          "tokens must be a non-negative integer"
        );

      error.status = 422;

      error.code =
        "INVALID_TOKEN_COUNT";

      throw error;
    }

    this.tokens =
      value;

    return this;
  }

  /**
   * Set/update message metadata.
   */
  setMetadata(
    metadata = {}
  ) {
    if (
      !metadata ||
      typeof metadata !== "object" ||
      Array.isArray(metadata)
    ) {
      const error =
        new Error(
          "metadata must be an object"
        );

      error.status = 422;

      error.code =
        "INVALID_MESSAGE_METADATA";

      throw error;
    }

    this.metadata = {
      ...(this.metadata || {}),
      ...metadata
    };

    return this;
  }

  /**
   * Return a safe API representation.
   */
  toJSON() {
    return {
      id:
        this.id,

      conversationId:
        this.conversationId,

      role:
        this.role,

      content:
        this.content,

      tokens:
        this.tokens ?? null,

      metadata:
        this.metadata || {}
    };
  }
}

module.exports = AIMessage;