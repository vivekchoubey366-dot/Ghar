"use strict";
const BaseModel = require("./_base");
class Conversation extends BaseModel {
  static entity = "Conversation";
  static fields = [
    "id",
    "participantIds",
    "propertyId",
    "lastMessageAt",
    "status"
  ];
  /**
   * Supported conversation statuses.
   */
  static statuses = [
    "active",
    "archived",
    "blocked",
    "closed"
  ];
  /**
   * A conversation must have at least two participants.
   */
  static MIN_PARTICIPANTS = 2;
  /**
   * Maximum participants supported by the model.
   */
  static MAX_PARTICIPANTS = 100;
  /**
   * Validate conversation data.
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
     * participantIds.
     */
    if (
      data.participantIds !== undefined
    ) {
      if (
        !Array.isArray(
          data.participantIds
        )
      ) {
        errors.push(
          "participantIds must be an array"
        );
      } else {
        if (
          data.participantIds.length <
          this.MIN_PARTICIPANTS
        ) {
          errors.push(
            `conversation requires at least ${this.MIN_PARTICIPANTS} participants`
          );
        }
        if (
          data.participantIds.length >
          this.MAX_PARTICIPANTS
        ) {
          errors.push(
            `conversation cannot have more than ${this.MAX_PARTICIPANTS} participants`
          );
        }
        const uniqueIds =
          new Set(
            data.participantIds.map(
              (id) => String(id)
            )
          );
        if (
          uniqueIds.size !==
          data.participantIds.length
        ) {
          errors.push(
            "participantIds cannot contain duplicates"
          );
        }
        for (
          const id of data.participantIds
        ) {
          if (
            typeof id !== "string" &&
            typeof id !== "number"
          ) {
            errors.push(
              "every participantId must be a string or number"
            );
            break;
          }
          if (
            String(id).trim() === ""
          ) {
            errors.push(
              "participantId cannot be empty"
            );
            break;
          }
        }
      }
    }
    /**
     * propertyId.
     *
     * Optional because conversations may also be
     * general user-to-user conversations.
     */
    if (
      data.propertyId !== undefined
    ) {
      if (
        typeof data.propertyId !== "string" &&
        typeof data.propertyId !== "number"
      ) {
        errors.push(
          "propertyId must be a string or number"
        );
      } else if (
        String(data.propertyId).trim() === ""
      ) {
        errors.push(
          "propertyId cannot be empty"
        );
      }
    }
    /**
     * lastMessageAt.
     */
    if (
      data.lastMessageAt !== undefined
    ) {
      const date =
        this.normalizeDate(
          data.lastMessageAt
        );
      if (
        !date
      ) {
        errors.push(
          "lastMessageAt must be a valid date"
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
   * Create conversation.
   */
  static create(data = {}) {
    const normalized = {
      ...data
    };
    /**
     * Normalize participants.
     */
    if (
      Array.isArray(
        normalized.participantIds
      )
    ) {
      normalized.participantIds =
        [
          ...new Set(
            normalized.participantIds
              .map(
                (id) =>
                  String(id).trim()
              )
              .filter(Boolean)
          )
        ];
    }
    /**
     * Normalize property ID.
     */
    if (
      normalized.propertyId !== undefined &&
      normalized.propertyId !== null
    ) {
      normalized.propertyId =
        String(
          normalized.propertyId
        ).trim();
    }
    /**
     * Normalize status.
     */
    if (
      typeof normalized.status ===
      "string"
    ) {
      normalized.status =
        normalized.status
          .trim()
          .toLowerCase();
    }
    /**
     * Normalize last message timestamp.
     */
    if (
      normalized.lastMessageAt !== undefined &&
      normalized.lastMessageAt !== null
    ) {
      normalized.lastMessageAt =
        this.normalizeDate(
          normalized.lastMessageAt
        );
    }
    /**
     * Default status.
     */
    if (
      normalized.status === undefined
    ) {
      normalized.status =
        "active";
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
          "Conversation validation failed"
        );
      error.status = 422;
      error.code =
        "CONVERSATION_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Check valid status.
   */
  static isValidStatus(
    status
  ) {
    return this.statuses.includes(
      status
    );
  }
  /**
   * Check whether user participates.
   */
  hasParticipant(
    userId
  ) {
    if (
      userId === undefined ||
      userId === null
    ) {
      return false;
    }
    return (
      Array.isArray(
        this.participantIds
      ) &&
      this.participantIds.some(
        (id) =>
          String(id) ===
          String(userId)
      )
    );
  }
  /**
   * Add participant.
   */
  addParticipant(
    userId
  ) {
    if (
      userId === undefined ||
      userId === null ||
      String(userId).trim() === ""
    ) {
      const error =
        new Error(
          "A valid userId is required"
        );
      error.status = 422;
      error.code =
        "INVALID_CONVERSATION_PARTICIPANT";
      throw error;
    }
    if (
      this.hasParticipant(
        userId
      )
    ) {
      return this;
    }
    if (
      this.participantIds.length >=
      this.constructor.MAX_PARTICIPANTS
    ) {
      const error =
        new Error(
          "Conversation participant limit reached"
        );
      error.status = 422;
      error.code =
        "PARTICIPANT_LIMIT_REACHED";
      throw error;
    }
    this.participantIds.push(
      String(userId).trim()
    );
    this.touch();
    return this;
  }
  /**
   * Remove participant.
   */
  removeParticipant(
    userId
  ) {
    const id =
      String(userId);
    const remaining =
      this.participantIds.filter(
        (participantId) =>
          String(
            participantId
          ) !== id
      );
    if (
      remaining.length <
      this.constructor.MIN_PARTICIPANTS
    ) {
      const error =
        new Error(
          "A conversation must have at least two participants"
        );
      error.status = 422;
      error.code =
        "MINIMUM_PARTICIPANTS_REQUIRED";
      throw error;
    }
    this.participantIds =
      remaining;
    this.touch();
    return this;
  }
  /**
   * Record a new message activity.
   */
  recordMessage(
    date = new Date()
  ) {
    const timestamp =
      this.normalizeDate(
        date
      );
    if (
      !timestamp
    ) {
      const error =
        new Error(
          "Invalid message timestamp"
        );
      error.status = 422;
      error.code =
        "INVALID_MESSAGE_TIMESTAMP";
      throw error;
    }
    this.lastMessageAt =
      timestamp;
    /**
     * Sending a message reactivates an active
     * conversation unless it has been blocked.
     */
    if (
      this.status ===
      "archived"
    ) {
      this.status =
        "active";
    }
    this.touch();
    return this;
  }
  /**
   * Archive conversation.
   */
  archive() {
    if (
      this.status ===
      "blocked"
    ) {
      const error =
        new Error(
          "Blocked conversations cannot be archived"
        );
      error.status = 409;
      error.code =
        "INVALID_CONVERSATION_TRANSITION";
      throw error;
    }
    this.status =
      "archived";
    this.touch();
    return this;
  }
  /**
   * Reactivate conversation.
   */
  activate() {
    if (
      this.status ===
      "blocked"
    ) {
      const error =
        new Error(
          "Blocked conversations cannot be activated"
        );
      error.status = 409;
      error.code =
        "INVALID_CONVERSATION_TRANSITION";
      throw error;
    }
    this.status =
      "active";
    this.touch();
    return this;
  }
  /**
   * Block conversation.
   */
  block() {
    this.status =
      "blocked";
    this.touch();
    return this;
  }
  /**
   * Close conversation.
   */
  close() {
    this.status =
      "closed";
    this.touch();
    return this;
  }
  /**
   * Check active state.
   */
  isActive() {
    return (
      this.status ===
      "active"
    );
  }
  /**
   * Check archived state.
   */
  isArchived() {
    return (
      this.status ===
      "archived"
    );
  }
  /**
   * Check blocked state.
   */
  isBlocked() {
    return (
      this.status ===
      "blocked"
    );
  }
  /**
   * Check closed state.
   */
  isClosed() {
    return (
      this.status ===
      "closed"
    );
  }
  /**
   * Get participant count.
   */
  getParticipantCount() {
    return Array.isArray(
      this.participantIds
    )
      ? this.participantIds.length
      : 0;
  }
  /**
   * Return safe representation.
   */
  toJSON() {
    return {
      id:
        this.id,
      participantIds:
        Array.isArray(
          this.participantIds
        )
          ? [
              ...this.participantIds
            ]
          : [],
      propertyId:
        this.propertyId ?? null,
      lastMessageAt:
        this.lastMessageAt ?? null,
      status:
        this.status
    };
  }
}
module.exports = Conversation;

Recommended GHAR conversation flow:

Conversation.create()
        │
        ▼
     active
        │
        ├── recordMessage() ──► active
        │
        ├── archive() ────────► archived
        │                              │
        │                              └── activate() ──► active
        │
        ├── block() ──────────► blocked
        │
        └── close() ──────────► closed

This also integrates cleanly with your message.controller.js: whenever a message is successfully created, call conversation.recordMessage() so lastMessageAt stays synchronized.