"use strict";
const BaseModel = require("./_base");
class Document extends BaseModel {
  static entity = "Document";
  static fields = [
    "id",
    "ownerId",
    "type",
    "name",
    "url",
    "storageKey",
    "status",
    "verifiedAt"
  ];
  /**
   * Supported GHAR document types.
   */
  static types = [
    "aadhaar",
    "pan",
    "passport",
    "driving_license",
    "voter_id",
    "address_proof",
    "identity_proof",
    "income_proof",
    "bank_statement",
    "salary_slip",
    "itr",
    "employment_proof",
    "property_document",
    "sale_deed",
    "lease_agreement",
    "rent_agreement",
    "ownership_proof",
    "loan_document",
    "application_document",
    "verification_document",
    "other"
  ];
  /**
   * Document lifecycle.
   */
  static statuses = [
    "uploaded",
    "pending",
    "under_review",
    "verified",
    "rejected",
    "expired",
    "deleted"
  ];
  static MAX_NAME_LENGTH = 255;
  static MAX_URL_LENGTH = 2048;
  static MAX_STORAGE_KEY_LENGTH = 500;
  /**
   * Validate document data.
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
          "Document data must be an object"
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
     * ownerId.
     */
    if (
      data.ownerId !== undefined
    ) {
      if (
        typeof data.ownerId !== "string" &&
        typeof data.ownerId !== "number"
      ) {
        errors.push(
          "ownerId must be a string or number"
        );
      } else if (
        String(data.ownerId).trim() === ""
      ) {
        errors.push(
          "ownerId cannot be empty"
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
     * name.
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
        data.name.trim() === ""
      ) {
        errors.push(
          "name cannot be empty"
        );
      } else if (
        data.name.length >
        this.MAX_NAME_LENGTH
      ) {
        errors.push(
          `name cannot exceed ${this.MAX_NAME_LENGTH} characters`
        );
      }
    }
    /**
     * URL.
     */
    if (
      data.url !== undefined
    ) {
      if (
        typeof data.url !== "string"
      ) {
        errors.push(
          "url must be a string"
        );
      } else if (
        data.url.length >
        this.MAX_URL_LENGTH
      ) {
        errors.push(
          `url cannot exceed ${this.MAX_URL_LENGTH} characters`
        );
      }
    }
    /**
     * Storage key.
     */
    if (
      data.storageKey !== undefined
    ) {
      if (
        typeof data.storageKey !== "string"
      ) {
        errors.push(
          "storageKey must be a string"
        );
      } else if (
        data.storageKey.trim() === ""
      ) {
        errors.push(
          "storageKey cannot be empty"
        );
      } else if (
        data.storageKey.length >
        this.MAX_STORAGE_KEY_LENGTH
      ) {
        errors.push(
          `storageKey cannot exceed ${this.MAX_STORAGE_KEY_LENGTH} characters`
        );
      }
    }
    /**
     * Status.
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
     * Verification timestamp.
     */
    if (
      data.verifiedAt !== undefined
    ) {
      const verifiedAt =
        this.normalizeDate(
          data.verifiedAt
        );
      if (
        !verifiedAt
      ) {
        errors.push(
          "verifiedAt must be a valid date"
        );
      }
    }
    /**
     * A verified document must have verifiedAt.
     */
    if (
      data.status === "verified" &&
      data.verifiedAt === undefined
    ) {
      errors.push(
        "verifiedAt is required for verified documents"
      );
    }
    return {
      valid:
        errors.length === 0,
      errors
    };
  }
  /**
   * Create document.
   */
  static create(data = {}) {
    const normalized = {
      ...data
    };
    /**
     * Normalize owner ID.
     */
    if (
      normalized.ownerId !== undefined &&
      normalized.ownerId !== null
    ) {
      normalized.ownerId =
        String(
          normalized.ownerId
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
     * Normalize name.
     */
    if (
      typeof normalized.name ===
      "string"
    ) {
      normalized.name =
        normalized.name.trim();
    }
    /**
     * Normalize URL.
     */
    if (
      typeof normalized.url ===
      "string"
    ) {
      normalized.url =
        normalized.url.trim();
    }
    /**
     * Normalize storage key.
     */
    if (
      typeof normalized.storageKey ===
      "string"
    ) {
      normalized.storageKey =
        normalized.storageKey.trim();
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
     * Default status.
     */
    if (
      normalized.status === undefined
    ) {
      normalized.status =
        "uploaded";
    }
    /**
     * Normalize verification timestamp.
     */
    if (
      normalized.verifiedAt !== undefined &&
      normalized.verifiedAt !== null
    ) {
      normalized.verifiedAt =
        this.normalizeDate(
          normalized.verifiedAt
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
          "Document validation failed"
        );
      error.status = 422;
      error.code =
        "DOCUMENT_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Type validation.
   */
  static isValidType(
    type
  ) {
    return this.types.includes(
      type
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
   * Check document state.
   */
  isUploaded() {
    return (
      this.status ===
      "uploaded"
    );
  }
  isPending() {
    return (
      this.status ===
      "pending"
    );
  }
  isUnderReview() {
    return (
      this.status ===
      "under_review"
    );
  }
  isVerified() {
    return (
      this.status ===
      "verified"
    );
  }
  isRejected() {
    return (
      this.status ===
      "rejected"
    );
  }
  isExpired() {
    return (
      this.status ===
      "expired"
    );
  }
  isDeleted() {
    return (
      this.status ===
      "deleted"
    );
  }
  /**
   * Move document into review.
   */
  submitForReview() {
    if (
      ![
        "uploaded",
        "rejected"
      ].includes(
        this.status
      )
    ) {
      const error =
        new Error(
          "Only uploaded or rejected documents can be submitted for review"
        );
      error.status = 409;
      error.code =
        "INVALID_DOCUMENT_TRANSITION";
      throw error;
    }
    this.status =
      "under_review";
    this.touch();
    return this;
  }
  /**
   * Mark document as verified.
   */
  verify(
    verifiedAt = new Date()
  ) {
    if (
      ![
        "pending",
        "under_review",
        "uploaded"
      ].includes(
        this.status
      )
    ) {
      const error =
        new Error(
          "This document cannot be verified in its current state"
        );
      error.status = 409;
      error.code =
        "INVALID_DOCUMENT_TRANSITION";
      throw error;
    }
    const timestamp =
      this.normalizeDate(
        verifiedAt
      );
    if (
      !timestamp
    ) {
      const error =
        new Error(
          "Invalid verification timestamp"
        );
      error.status = 422;
      error.code =
        "INVALID_VERIFICATION_DATE";
      throw error;
    }
    this.status =
      "verified";
    this.verifiedAt =
      timestamp;
    this.touch();
    return this;
  }
  /**
   * Reject document.
   */
  reject() {
    if (
      [
        "verified",
        "deleted"
      ].includes(
        this.status
      )
    ) {
      const error =
        new Error(
          "This document cannot be rejected"
        );
      error.status = 409;
      error.code =
        "INVALID_DOCUMENT_TRANSITION";
      throw error;
    }
    this.status =
      "rejected";
    this.verifiedAt =
      null;
    this.touch();
    return this;
  }
  /**
   * Mark document as expired.
   */
  expire() {
    if (
      this.status ===
      "deleted"
    ) {
      const error =
        new Error(
          "Deleted documents cannot be expired"
        );
      error.status = 409;
      error.code =
        "INVALID_DOCUMENT_TRANSITION";
      throw error;
    }
    this.status =
      "expired";
    this.verifiedAt =
      null;
    this.touch();
    return this;
  }
  /**
   * Soft-delete document.
   */
  remove() {
    this.status =
      "deleted";
    this.touch();
    return this;
  }
  /**
   * Restore a rejected/expired document.
   */
  restore() {
    if (
      ![
        "rejected",
        "expired",
        "deleted"
      ].includes(
        this.status
      )
    ) {
      const error =
        new Error(
          "This document cannot be restored"
        );
      error.status = 409;
      error.code =
        "INVALID_DOCUMENT_TRANSITION";
      throw error;
    }
    this.status =
      "uploaded";
    this.verifiedAt =
      null;
    this.touch();
    return this;
  }
  /**
   * Check ownership.
   */
  belongsTo(
    ownerId
  ) {
    if (
      ownerId === undefined ||
      ownerId === null
    ) {
      return false;
    }
    return (
      String(this.ownerId) ===
      String(ownerId)
    );
  }
  /**
   * Return safe representation.
   *
   * storageKey is intentionally omitted from normal
   * API serialization because it is an internal
   * storage implementation detail.
   */
  toJSON() {
    return {
      id:
        this.id,
      ownerId:
        this.ownerId,
      type:
        this.type,
      name:
        this.name,
      url:
        this.url ?? null,
      status:
        this.status,
      verifiedAt:
        this.verifiedAt ?? null
    };
  }
}
module.exports = Document;

Document lifecycle

uploaded
   │
   ▼
under_review
   │
   ├──────────────► verified
   │
   └──────────────► rejected
                         │
                         └── restore() → uploaded
verified
   │
   └── expire() → expired
any eligible state
   │
   └── remove() → deleted

One important security choice: storageKey is not exposed by toJSON(). For GHAR, that should remain an internal storage-layer value; clients should receive a controlled URL or signed download endpoint instead.