"use strict";

const BaseModel = require("./_base");

class AIConversation extends BaseModel {
  static entity = "AIConversation";

  static fields = [
    "id",
    "userId",
    "title",
    "module",
    "status",
    "metadata"
  ];

  static statuses = [
    "active",
    "archived",
    "closed"
  ];

  static modules = [
    "general",
    "property",
    "search",
    "loan",
    "legal",
    "finance",
    "support",
    "marketplace"
  ];

  /**
   * Validate AI conversation data.
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
          "Conversation data must be an object"
        ]
      };
    }

    /*
     * Null protection
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

    /*
     * userId
     */
    if (
      data.userId !== undefined &&
      (
        typeof data.userId !== "string" ||
        data.userId.trim() === ""
      )
    ) {
      errors.push(
        "userId must be a non-empty string"
      );
    }

    /*
     * title
     */
    if (
      data.title !== undefined
    ) {
      if (
        typeof data.title !== "string"
      ) {
        errors.push(
          "title must be a string"
        );
      } else if (
        data.title.length > 200
      ) {
        errors.push(
          "title cannot exceed 200 characters"
        );
      }
    }

    /*
     * module
     */
    if (
      data.module !== undefined &&
      !this.modules.includes(
        data.module
      )
    ) {
      errors.push(
        `module must be one of: ${this.modules.join(", ")}`
      );
    }

    /*
     * status
     */
    if (
      data.status !== undefined &&
      !this.statuses.includes(
        data.status
      )
    ) {
      errors.push(
        `status must be one of: ${this.statuses.join(", ")}`
      );
    }

    /*
     * metadata
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
   * Create a new AI conversation.
   */
  static create(data = {}) {
    const normalized = {
      ...data
    };

    /*
     * Apply safe defaults.
     */
    if (
      normalized.status === undefined
    ) {
      normalized.status =
        "active";
    }

    if (
      normalized.module === undefined
    ) {
      normalized.module =
        "general";
    }

    if (
      normalized.metadata === undefined
    ) {
      normalized.metadata = {};
    }

    /*
     * Normalize title.
     */
    if (
      typeof normalized.title ===
      "string"
    ) {
      normalized.title =
        normalized.title.trim();
    }

    /*
     * Normalize module/status.
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
          "AI conversation validation failed"
        );

      error.status = 422;
      error.code =
        "AI_CONVERSATION_VALIDATION_ERROR";
      error.details =
        check.errors;

      throw error;
    }

    return new this(
      normalized
    );
  }

  /**
   * Check whether a status is valid.
   */
  static isValidStatus(
    status
  ) {
    return this.statuses.includes(
      status
    );
  }

  /**
   * Check whether a module is valid.
   */
  static isValidModule(
    module
  ) {
    return this.modules.includes(
      module
    );
  }

  /**
   * Check whether conversation is active.
   */
  isActive() {
    return (
      this.status ===
      "active"
    );
  }

  /**
   * Archive conversation.
   */
  archive() {
    this.status =
      "archived";

    return this;
  }

  /**
   * Close conversation.
   */
  close() {
    this.status =
      "closed";

    return this;
  }

  /**
   * Reactivate conversation.
   */
  activate() {
    this.status =
      "active";

    return this;
  }
}

module.exports =
  AIConversation;