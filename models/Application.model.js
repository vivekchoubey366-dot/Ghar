"use strict";
const BaseModel = require("./_base");
class Application extends BaseModel {
  static entity = "Application";
  static fields = [
    "id",
    "propertyId",
    "applicantId",
    "type",
    "status",
    "notes"
  ];
  /**
   * Supported application types.
   */
  static types = [
    "purchase",
    "rent",
    "lease",
    "loan",
    "property_inquiry",
    "verification"
  ];
  /**
   * Application lifecycle statuses.
   */
  static statuses = [
    "draft",
    "submitted",
    "under_review",
    "approved",
    "rejected",
    "withdrawn",
    "cancelled"
  ];
  static MAX_NOTES_LENGTH = 10000;
  /**
   * Validate application data.
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
          "Application data must be an object"
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
     * applicantId.
     */
    if (
      data.applicantId !== undefined
    ) {
      if (
        typeof data.applicantId !== "string" ||
        data.applicantId.trim() === ""
      ) {
        errors.push(
          "applicantId must be a non-empty string"
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
     * notes.
     */
    if (
      data.notes !== undefined
    ) {
      if (
        typeof data.notes !== "string"
      ) {
        errors.push(
          "notes must be a string"
        );
      } else if (
        data.notes.length >
        this.MAX_NOTES_LENGTH
      ) {
        errors.push(
          `notes cannot exceed ${this.MAX_NOTES_LENGTH} characters`
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
   * Create application.
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
        "draft";
    }
    /**
     * Normalize IDs.
     */
    if (
      typeof normalized.propertyId ===
      "string"
    ) {
      normalized.propertyId =
        normalized.propertyId.trim();
    }
    if (
      typeof normalized.applicantId ===
      "string"
    ) {
      normalized.applicantId =
        normalized.applicantId.trim();
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
     * Normalize notes.
     */
    if (
      typeof normalized.notes ===
      "string"
    ) {
      normalized.notes =
        normalized.notes.trim();
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
          "Application validation failed"
        );
      error.status = 422;
      error.code =
        "APPLICATION_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Check supported application type.
   */
  static isValidType(
    type
  ) {
    return this.types.includes(
      type
    );
  }
  /**
   * Check supported application status.
   */
  static isValidStatus(
    status
  ) {
    return this.statuses.includes(
      status
    );
  }
  /**
   * Status helpers.
   */
  isDraft() {
    return this.status === "draft";
  }
  isSubmitted() {
    return this.status === "submitted";
  }
  isUnderReview() {
    return this.status === "under_review";
  }
  isApproved() {
    return this.status === "approved";
  }
  isRejected() {
    return this.status === "rejected";
  }
  isWithdrawn() {
    return this.status === "withdrawn";
  }
  isCancelled() {
    return this.status === "cancelled";
  }
  /**
   * Check whether application is still active.
   */
  isActive() {
    return [
      "submitted",
      "under_review"
    ].includes(
      this.status
    );
  }
  /**
   * Check whether application has reached
   * a terminal state.
   */
  isFinal() {
    return [
      "approved",
      "rejected",
      "withdrawn",
      "cancelled"
    ].includes(
      this.status
    );
  }
  /**
   * Submit application.
   */
  submit() {
    if (
      ![
        "draft"
      ].includes(
        this.status
      )
    ) {
      const error =
        new Error(
          "Only draft applications can be submitted"
        );
      error.status = 409;
      error.code =
        "INVALID_APPLICATION_TRANSITION";
      throw error;
    }
    this.status =
      "submitted";
    return this;
  }
  /**
   * Move application into review.
   */
  startReview() {
    if (
      ![
        "submitted"
      ].includes(
        this.status
      )
    ) {
      const error =
        new Error(
          "Only submitted applications can enter review"
        );
      error.status = 409;
      error.code =
        "INVALID_APPLICATION_TRANSITION";
      throw error;
    }
    this.status =
      "under_review";
    return this;
  }
  /**
   * Approve application.
   */
  approve() {
    if (
      ![
        "submitted",
        "under_review"
      ].includes(
        this.status
      )
    ) {
      const error =
        new Error(
          "Only submitted or under-review applications can be approved"
        );
      error.status = 409;
      error.code =
        "INVALID_APPLICATION_TRANSITION";
      throw error;
    }
    this.status =
      "approved";
    return this;
  }
  /**
   * Reject application.
   */
  reject(
    reason = null
  ) {
    if (
      ![
        "submitted",
        "under_review"
      ].includes(
        this.status
      )
    ) {
      const error =
        new Error(
          "Only submitted or under-review applications can be rejected"
        );
      error.status = 409;
      error.code =
        "INVALID_APPLICATION_TRANSITION";
      throw error;
    }
    this.status =
      "rejected";
    if (
      reason !== null &&
      reason !== undefined
    ) {
      this.setNotes(
        reason
      );
    }
    return this;
  }
  /**
   * Withdraw application.
   */
  withdraw() {
    if (
      [
        "approved",
        "rejected",
        "cancelled"
      ].includes(
        this.status
      )
    ) {
      const error =
        new Error(
          "This application cannot be withdrawn"
        );
      error.status = 409;
      error.code =
        "INVALID_APPLICATION_TRANSITION";
      throw error;
    }
    this.status =
      "withdrawn";
    return this;
  }
  /**
   * Cancel application.
   */
  cancel() {
    if (
      this.status ===
      "approved"
    ) {
      const error =
        new Error(
          "An approved application cannot be cancelled"
        );
      error.status = 409;
      error.code =
        "INVALID_APPLICATION_TRANSITION";
      throw error;
    }
    this.status =
      "cancelled";
    return this;
  }
  /**
   * Update notes.
   */
  setNotes(
    notes = ""
  ) {
    if (
      typeof notes !== "string"
    ) {
      const error =
        new Error(
          "notes must be a string"
        );
      error.status = 422;
      error.code =
        "INVALID_APPLICATION_NOTES";
      throw error;
    }
    const value =
      notes.trim();
    if (
      value.length >
      this.constructor.MAX_NOTES_LENGTH
    ) {
      const error =
        new Error(
          `notes cannot exceed ${this.constructor.MAX_NOTES_LENGTH} characters`
        );
      error.status = 422;
      error.code =
        "APPLICATION_NOTES_TOO_LONG";
      throw error;
    }
    this.notes =
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
      propertyId:
        this.propertyId,
      applicantId:
        this.applicantId,
      type:
        this.type,
      status:
        this.status,
      notes:
        this.notes || null
    };
  }
}
module.exports = Application;

Application flow

draft
  │
  ▼
submitted
  │
  ▼
under_review
  │
  ├──────────────► approved
  │
  └──────────────► rejected
draft/submitted/under_review
              │
              ▼
          withdrawn
draft/submitted/under_review
              │
              ▼
          cancelled

This is a better fit for your existing GHAR controllers and database layer because the model now prevents invalid lifecycle transitions instead of allowing arbitrary status changes.