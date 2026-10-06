"use strict";
const BaseModel = require("./_base");
class Notification extends BaseModel {
  static entity = "Notification";
  static fields = [
    "id",
    "userId",
    "type",
    "title",
    "message",
    "readAt",
    "metadata"
  ];
  /**
   * Notification categories.
   */
  static types = [
    "system",
    "account",
    "verification",
    "property",
    "favourite",
    "saved_search",
    "lead",
    "application",
    "offer",
    "visit",
    "payment",
    "invoice",
    "subscription",
    "loan",
    "document",
    "message",
    "referral",
    "support",
    "security",
    "ai",
    "marketing"
  ];
  static MAX_TITLE_LENGTH = 255;
  static MAX_MESSAGE_LENGTH = 5000;
  static MAX_METADATA_KEYS = 100;
  /**
   * Validate notification.
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
          "Notification data must be an object"
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
     * User ID.
     */
    if (
      data.userId !== undefined
    ) {
      if (
        typeof data.userId !== "string" &&
        typeof data.userId !== "number"
      ) {
        errors.push(
          "userId must be a string or number"
        );
      } else if (
        String(data.userId).trim() === ""
      ) {
        errors.push(
          "userId cannot be empty"
        );
      }
    }
    /**
     * Type.
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
     * Title.
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
        data.title.trim().length === 0
      ) {
        errors.push(
          "title cannot be empty"
        );
      } else if (
        data.title.length >
        this.MAX_TITLE_LENGTH
      ) {
        errors.push(
          `title cannot exceed ${this.MAX_TITLE_LENGTH} characters`
        );
      }
    }
    /**
     * Message.
     */
    if (
      data.message !== undefined
    ) {
      if (
        typeof data.message !== "string"
      ) {
        errors.push(
          "message must be a string"
        );
      } else if (
        data.message.trim().length === 0
      ) {
        errors.push(
          "message cannot be empty"
        );
      } else if (
        data.message.length >
        this.MAX_MESSAGE_LENGTH
      ) {
        errors.push(
          `message cannot exceed ${this.MAX_MESSAGE_LENGTH} characters`
        );
      }
    }
    /**
     * Read timestamp.
     */
    if (
      data.readAt !== undefined
    ) {
      if (
        !this.isValidDate(
          data.readAt
        )
      ) {
        errors.push(
          "readAt must be a valid date"
        );
      }
    }
    /**
     * Metadata.
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
      } else if (
        Object.keys(
          data.metadata
        ).length >
        this.MAX_METADATA_KEYS
      ) {
        errors.push(
          `metadata cannot contain more than ${this.MAX_METADATA_KEYS} keys`
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
   * Create notification.
   */
  static create(data = {}) {
    const normalized = {
      ...data
    };
    /**
     * Normalize user ID.
     */
    if (
      normalized.userId !== undefined &&
      normalized.userId !== null
    ) {
      normalized.userId =
        String(
          normalized.userId
        ).trim();
    }
    /**
     * Normalize type.
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
     * Normalize title.
     */
    if (
      typeof normalized.title ===
      "string"
    ) {
      normalized.title =
        normalized.title.trim();
    }
    /**
     * Normalize message.
     */
    if (
      typeof normalized.message ===
      "string"
    ) {
      normalized.message =
        normalized.message.trim();
    }
    /**
     * Normalize metadata.
     */
    if (
      normalized.metadata === undefined
    ) {
      normalized.metadata = {};
    } else if (
      normalized.metadata &&
      typeof normalized.metadata ===
        "object" &&
      !Array.isArray(
        normalized.metadata
      )
    ) {
      normalized.metadata = {
        ...normalized.metadata
      };
    }
    /**
     * Normalize readAt.
     */
    if (
      normalized.readAt !== undefined &&
      normalized.readAt !== null
    ) {
      normalized.readAt =
        this.normalizeDate(
          normalized.readAt
        );
    }
    /**
     * Validate.
     */
    const check =
      this.validate(
        normalized
      );
    if (
      !check.valid
    ) {
      const error =
        new Error(
          "Notification validation failed"
        );
      error.status = 422;
      error.code =
        "NOTIFICATION_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Check date.
   */
  static isValidDate(value) {
    if (
      value instanceof Date
    ) {
      return !Number.isNaN(
        value.getTime()
      );
    }
    const date =
      new Date(value);
    return !Number.isNaN(
      date.getTime()
    );
  }
  /**
   * Check notification ownership.
   */
  belongsToUser(
    userId
  ) {
    if (
      userId === undefined ||
      userId === null
    ) {
      return false;
    }
    return (
      String(this.userId) ===
      String(userId)
    );
  }
  /**
   * Check read state.
   */
  isRead() {
    return Boolean(
      this.readAt
    );
  }
  /**
   * Check unread state.
   */
  isUnread() {
    return !this.isRead();
  }
  /**
   * Mark notification as read.
   */
  markRead(
    readAt = new Date()
  ) {
    this.readAt =
      this.constructor.normalizeDate(
        readAt
      );
    this.touch();
    return this;
  }
  /**
   * Mark notification unread.
   */
  markUnread() {
    this.readAt = null;
    this.touch();
    return this;
  }
  /**
   * Toggle read state.
   */
  toggleRead() {
    if (
      this.isRead()
    ) {
      return this.markUnread();
    }
    return this.markRead();
  }
  /**
   * Set metadata value.
   */
  setMetadata(
    key,
    value
  ) {
    if (
      typeof key !== "string" ||
      key.trim() === ""
    ) {
      const error =
        new Error(
          "Metadata key is required"
        );
      error.status = 422;
      error.code =
        "INVALID_METADATA_KEY";
      throw error;
    }
    if (
      !this.metadata ||
      typeof this.metadata !==
        "object" ||
      Array.isArray(
        this.metadata
      )
    ) {
      this.metadata = {};
    }
    const normalizedKey =
      key.trim();
    this.metadata[
      normalizedKey
    ] = value;
    this.touch();
    return this;
  }
  /**
   * Get metadata value.
   */
  getMetadata(
    key,
    fallback = null
  ) {
    if (
      !this.metadata ||
      typeof this.metadata !==
        "object"
    ) {
      return fallback;
    }
    return Object.prototype.hasOwnProperty.call(
      this.metadata,
      key
    )
      ? this.metadata[key]
      : fallback;
  }
  /**
   * Remove metadata key.
   */
  removeMetadata(
    key
  ) {
    if (
      this.metadata &&
      typeof this.metadata ===
        "object"
    ) {
      delete this.metadata[key];
      this.touch();
    }
    return this;
  }
  /**
   * Check notification type.
   */
  isType(
    type
  ) {
    return (
      this.type === type
    );
  }
  /**
   * Check if notification is actionable.
   */
  isActionable() {
    return Boolean(
      this.getMetadata(
        "actionUrl"
      ) ||
      this.getMetadata(
        "action"
      ) ||
      this.getMetadata(
        "actionType"
      )
    );
  }
  /**
   * Get action URL.
   */
  getActionUrl() {
    return this.getMetadata(
      "actionUrl"
    );
  }
  /**
   * Get related entity.
   */
  getRelatedEntity() {
    return {
      entityType:
        this.getMetadata(
          "entityType"
        ),
      entityId:
        this.getMetadata(
          "entityId"
        )
    };
  }
  /**
   * Return notification age.
   */
  getAgeMs(
    now = new Date()
  ) {
    const created =
      this.createdAt
        ? new Date(
            this.createdAt
          )
        : null;
    const current =
      new Date(now);
    if (
      !created ||
      Number.isNaN(
        created.getTime()
      ) ||
      Number.isNaN(
        current.getTime()
      )
    ) {
      return null;
    }
    return Math.max(
      0,
      current.getTime() -
        created.getTime()
    );
  }
  /**
   * Mark as read only if unread.
   */
  markReadIfUnread() {
    if (
      this.isUnread()
    ) {
      this.markRead();
    }
    return this;
  }
  /**
   * Return notification summary.
   */
  getSummary() {
    return {
      id:
        this.id ?? null,
      userId:
        this.userId,
      type:
        this.type,
      title:
        this.title,
      read:
        this.isRead(),
      unread:
        this.isUnread(),
      actionable:
        this.isActionable(),
      actionUrl:
        this.getActionUrl(),
      createdAt:
        this.createdAt,
      readAt:
        this.readAt ?? null
    };
  }
  /**
   * Safe API representation.
   */
  toJSON() {
    return {
      id:
        this.id ?? null,
      userId:
        this.userId,
      type:
        this.type,
      title:
        this.title,
      message:
        this.message,
      readAt:
        this.readAt ?? null,
      isRead:
        this.isRead(),
      metadata:
        this.metadata &&
        typeof this.metadata ===
          "object"
          ? {
              ...this.metadata
            }
          : {},
      createdAt:
        this.createdAt,
      updatedAt:
        this.updatedAt
    };
  }
}
module.exports = Notification;

This version keeps notification persistence compatible with your existing fields while adding the behavior GHAR needs for read/unread notifications, notification categories, action links, related entities, metadata, and user ownership checks.