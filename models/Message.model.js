"use strict";
const BaseModel = require("./_base");
class Message extends BaseModel {
  static entity = "Message";
  static fields = [
    "id",
    "conversationId",
    "senderId",
    "recipientId",
    "body",
    "attachments",
    "readAt"
  ];
  static MAX_BODY_LENGTH = 10000;
  static MAX_ATTACHMENTS = 20;
  static statuses = [
    "sent",
    "delivered",
    "read",
    "deleted"
  ];
  /**
   * Validate message data.
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
          "Message data must be an object"
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
     * Conversation.
     */
    if (
      data.conversationId !== undefined
    ) {
      if (
        typeof data.conversationId !== "string" &&
        typeof data.conversationId !== "number"
      ) {
        errors.push(
          "conversationId must be a string or number"
        );
      } else if (
        String(data.conversationId).trim() === ""
      ) {
        errors.push(
          "conversationId cannot be empty"
        );
      }
    }
    /**
     * Sender.
     */
    if (
      data.senderId !== undefined
    ) {
      if (
        typeof data.senderId !== "string" &&
        typeof data.senderId !== "number"
      ) {
        errors.push(
          "senderId must be a string or number"
        );
      } else if (
        String(data.senderId).trim() === ""
      ) {
        errors.push(
          "senderId cannot be empty"
        );
      }
    }
    /**
     * Recipient.
     */
    if (
      data.recipientId !== undefined
    ) {
      if (
        typeof data.recipientId !== "string" &&
        typeof data.recipientId !== "number"
      ) {
        errors.push(
          "recipientId must be a string or number"
        );
      } else if (
        String(data.recipientId).trim() === ""
      ) {
        errors.push(
          "recipientId cannot be empty"
        );
      }
    }
    /**
     * Sender and recipient cannot be identical.
     */
    if (
      data.senderId !== undefined &&
      data.recipientId !== undefined &&
      String(data.senderId) ===
        String(data.recipientId)
    ) {
      errors.push(
        "senderId and recipientId cannot be the same"
      );
    }
    /**
     * Body.
     */
    if (
      data.body !== undefined
    ) {
      if (
        typeof data.body !== "string"
      ) {
        errors.push(
          "body must be a string"
        );
      } else if (
        data.body.length >
        this.MAX_BODY_LENGTH
      ) {
        errors.push(
          `body cannot exceed ${this.MAX_BODY_LENGTH} characters`
        );
      }
    }
    /**
     * Attachments.
     */
    if (
      data.attachments !== undefined
    ) {
      if (
        !Array.isArray(
          data.attachments
        )
      ) {
        errors.push(
          "attachments must be an array"
        );
      } else if (
        data.attachments.length >
        this.MAX_ATTACHMENTS
      ) {
        errors.push(
          `attachments cannot contain more than ${this.MAX_ATTACHMENTS} items`
        );
      }
    }
    /**
     * Read date.
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
     * A message needs content or an attachment.
     */
    const hasBody =
      typeof data.body === "string" &&
      data.body.trim().length > 0;
    const hasAttachments =
      Array.isArray(data.attachments) &&
      data.attachments.length > 0;
    if (
      data.body !== undefined &&
      data.attachments !== undefined &&
      !hasBody &&
      !hasAttachments
    ) {
      errors.push(
        "message must contain body or attachments"
      );
    }
    return {
      valid:
        errors.length === 0,
      errors
    };
  }
  /**
   * Create message.
   */
  static create(data = {}) {
    const normalized = {
      ...data
    };
    /**
     * Normalize identifiers.
     */
    for (
      const field of [
        "conversationId",
        "senderId",
        "recipientId"
      ]
    ) {
      if (
        normalized[field] !== undefined &&
        normalized[field] !== null
      ) {
        normalized[field] =
          String(
            normalized[field]
          ).trim();
      }
    }
    /**
     * Normalize body.
     */
    if (
      typeof normalized.body ===
      "string"
    ) {
      normalized.body =
        normalized.body.trim();
    }
    /**
     * Normalize attachments.
     */
    if (
      normalized.attachments === undefined
    ) {
      normalized.attachments = [];
    }
    if (
      Array.isArray(
        normalized.attachments
      )
    ) {
      normalized.attachments =
        normalized.attachments.map(
          (attachment) => {
            if (
              attachment &&
              typeof attachment ===
                "object"
            ) {
              return {
                ...attachment
              };
            }
            return attachment;
          }
        );
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
          "Message validation failed"
        );
      error.status = 422;
      error.code =
        "MESSAGE_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Check valid date.
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
   * Check sender.
   */
  isSender(userId) {
    if (
      userId === undefined ||
      userId === null
    ) {
      return false;
    }
    return (
      String(this.senderId) ===
      String(userId)
    );
  }
  /**
   * Check recipient.
   */
  isRecipient(userId) {
    if (
      userId === undefined ||
      userId === null
    ) {
      return false;
    }
    return (
      String(this.recipientId) ===
      String(userId)
    );
  }
  /**
   * Check conversation.
   */
  belongsToConversation(
    conversationId
  ) {
    if (
      conversationId === undefined ||
      conversationId === null
    ) {
      return false;
    }
    return (
      String(this.conversationId) ===
      String(conversationId)
    );
  }
  /**
   * Mark message as delivered.
   */
  markDelivered() {
    this.deliveredAt =
      this.deliveredAt ||
      new Date();
    this.touch();
    return this;
  }
  /**
   * Mark message as read.
   */
  markRead(
    readAt = new Date()
  ) {
    this.readAt =
      this.constructor.normalizeDate(
        readAt
      );
    this.status =
      "read";
    this.touch();
    return this;
  }
  /**
   * Check whether message is read.
   */
  isRead() {
    return Boolean(
      this.readAt
    );
  }
  /**
   * Check whether message is delivered.
   */
  isDelivered() {
    return Boolean(
      this.deliveredAt
    );
  }
  /**
   * Add attachment.
   */
  addAttachment(
    attachment
  ) {
    if (
      !attachment
    ) {
      const error =
        new Error(
          "Attachment is required"
        );
      error.status = 422;
      error.code =
        "ATTACHMENT_REQUIRED";
      throw error;
    }
    if (
      !Array.isArray(
        this.attachments
      )
    ) {
      this.attachments = [];
    }
    if (
      this.attachments.length >=
      this.constructor.MAX_ATTACHMENTS
    ) {
      const error =
        new Error(
          `Maximum of ${this.constructor.MAX_ATTACHMENTS} attachments allowed`
        );
      error.status = 422;
      error.code =
        "ATTACHMENT_LIMIT_REACHED";
      throw error;
    }
    const normalized =
      attachment &&
      typeof attachment ===
        "object"
        ? {
            ...attachment
          }
        : attachment;
    this.attachments.push(
      normalized
    );
    this.touch();
    return this;
  }
  /**
   * Remove attachment.
   */
  removeAttachment(
    attachmentId
  ) {
    if (
      !Array.isArray(
        this.attachments
      )
    ) {
      return this;
    }
    this.attachments =
      this.attachments.filter(
        (attachment) => {
          if (
            attachment &&
            typeof attachment ===
              "object"
          ) {
            return String(
              attachment.id
            ) !==
              String(
                attachmentId
              );
          }
          return String(
            attachment
          ) !==
            String(
              attachmentId
            );
        }
      );
    this.touch();
    return this;
  }
  /**
   * Edit message body.
   */
  editBody(
    body
  ) {
    if (
      typeof body !== "string"
    ) {
      const error =
        new Error(
          "Message body must be a string"
        );
      error.status = 422;
      error.code =
        "INVALID_MESSAGE_BODY";
      throw error;
    }
    const normalized =
      body.trim();
    if (
      normalized.length === 0
    ) {
      const error =
        new Error(
          "Message body cannot be empty"
        );
      error.status = 422;
      error.code =
        "EMPTY_MESSAGE_BODY";
      throw error;
    }
    if (
      normalized.length >
      this.constructor.MAX_BODY_LENGTH
    ) {
      const error =
        new Error(
          `Message body cannot exceed ${this.constructor.MAX_BODY_LENGTH} characters`
        );
      error.status = 422;
      error.code =
        "MESSAGE_BODY_TOO_LONG";
      throw error;
    }
    this.body =
      normalized;
    this.editedAt =
      new Date();
    this.touch();
    return this;
  }
  /**
   * Soft-delete message.
   */
  delete() {
    this.status =
      "deleted";
    this.deletedAt =
      new Date();
    this.touch();
    return this;
  }
  /**
   * Check deleted state.
   */
  isDeleted() {
    return (
      this.status ===
      "deleted"
    );
  }
  /**
   * Get attachment count.
   */
  getAttachmentCount() {
    return Array.isArray(
      this.attachments
    )
      ? this.attachments.length
      : 0;
  }
  /**
   * Check whether message has attachments.
   */
  hasAttachments() {
    return (
      this.getAttachmentCount() >
      0
    );
  }
  /**
   * Get message type.
   */
  getType() {
    const hasBody =
      typeof this.body === "string" &&
      this.body.trim().length > 0;
    const hasAttachments =
      this.hasAttachments();
    if (
      hasBody &&
      hasAttachments
    ) {
      return "mixed";
    }
    if (
      hasAttachments
    ) {
      return "attachment";
    }
    return "text";
  }
  /**
   * Return message summary.
   */
  getSummary() {
    return {
      id:
        this.id ?? null,
      conversationId:
        this.conversationId,
      senderId:
        this.senderId,
      recipientId:
        this.recipientId,
      type:
        this.getType(),
      attachmentCount:
        this.getAttachmentCount(),
      read:
        this.isRead(),
      delivered:
        this.isDelivered(),
      deleted:
        this.isDeleted(),
      createdAt:
        this.createdAt,
      updatedAt:
        this.updatedAt
    };
  }
  /**
   * Safe API representation.
   */
  toJSON() {
    return {
      id:
        this.id ?? null,
      conversationId:
        this.conversationId,
      senderId:
        this.senderId,
      recipientId:
        this.recipientId,
      body:
        this.isDeleted()
          ? null
          : this.body ?? null,
      attachments:
        Array.isArray(
          this.attachments
        )
          ? this.attachments.map(
              (attachment) =>
                attachment &&
                typeof attachment ===
                  "object"
                  ? {
                      ...attachment
                    }
                  : attachment
            )
          : [],
      status:
        this.status ||
        (
          this.isRead()
            ? "read"
            : "sent"
        ),
      readAt:
        this.readAt ?? null,
      deliveredAt:
        this.deliveredAt ?? null,
      editedAt:
        this.editedAt ?? null,
      deletedAt:
        this.deletedAt ?? null,
      createdAt:
        this.createdAt,
      updatedAt:
        this.updatedAt
    };
  }
}
module.exports = Message;

Important: because this upgraded model adds deliveredAt, editedAt, deletedAt, and status, your db/schema.sql / messages.sql should contain corresponding columns if you persist those fields.