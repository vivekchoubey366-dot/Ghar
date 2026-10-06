"use strict";
const BaseModel = require("./_base");
class PropertyDocument extends BaseModel {
  static entity = "PropertyDocument";
  static fields = [
    "id",
    "propertyId",
    "documentId",
    "type",
    "status",
    "url"
  ];
  static documentTypes = [
    "ownership",
    "sale_deed",
    "title_deed",
    "registry",
    "mutation",
    "tax_receipt",
    "encumbrance_certificate",
    "occupancy_certificate",
    "completion_certificate",
    "building_plan",
    "approved_plan",
    "noc",
    "electricity_bill",
    "water_bill",
    "identity",
    "address_proof",
    "loan_document",
    "agreement",
    "other"
  ];
  static statuses = [
    "pending",
    "submitted",
    "under_review",
    "verified",
    "rejected",
    "expired",
    "archived"
  ];
  static MAX_URL_LENGTH = 2048;
  /**
   * Validate property-document relationship.
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
          "PropertyDocument data must be an object"
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
     * Property ID.
     */
    if (data.propertyId !== undefined) {
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
     * Document ID.
     */
    if (data.documentId !== undefined) {
      if (
        typeof data.documentId !== "string" &&
        typeof data.documentId !== "number"
      ) {
        errors.push(
          "documentId must be a string or number"
        );
      } else if (
        String(data.documentId).trim() === ""
      ) {
        errors.push(
          "documentId cannot be empty"
        );
      }
    }
    /**
     * Document type.
     */
    if (data.type !== undefined) {
      if (
        typeof data.type !== "string"
      ) {
        errors.push(
          "type must be a string"
        );
      } else if (
        data.type.trim().length === 0
      ) {
        errors.push(
          "type cannot be empty"
        );
      } else if (
        !this.documentTypes.includes(
          data.type.toLowerCase()
        )
      ) {
        errors.push(
          `type must be one of: ${this.documentTypes.join(", ")}`
        );
      }
    }
    /**
     * Status.
     */
    if (data.status !== undefined) {
      if (
        typeof data.status !== "string"
      ) {
        errors.push(
          "status must be a string"
        );
      } else if (
        !this.statuses.includes(
          data.status.toLowerCase()
        )
      ) {
        errors.push(
          `status must be one of: ${this.statuses.join(", ")}`
        );
      }
    }
    /**
     * URL.
     */
    if (data.url !== undefined) {
      if (
        typeof data.url !== "string"
      ) {
        errors.push(
          "url must be a string"
        );
      } else if (
        data.url.trim().length === 0
      ) {
        errors.push(
          "url cannot be empty"
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
    return {
      valid: errors.length === 0,
      errors
    };
  }
  /**
   * Create a property document.
   */
  static create(data = {}) {
    const normalized = {
      ...data
    };
    /**
     * Normalize IDs.
     */
    for (
      const field of [
        "propertyId",
        "documentId"
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
     * Normalize document type.
     */
    if (
      typeof normalized.type === "string"
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
      typeof normalized.status === "string"
    ) {
      normalized.status =
        normalized.status
          .trim()
          .toLowerCase();
    }
    /**
     * Normalize URL.
     */
    if (
      typeof normalized.url === "string"
    ) {
      normalized.url =
        normalized.url.trim();
    }
    /**
     * Default status.
     */
    if (
      normalized.status === undefined
    ) {
      normalized.status =
        "pending";
    }
    const check =
      this.validate(
        normalized
      );
    if (!check.valid) {
      const error =
        new Error(
          "PropertyDocument validation failed"
        );
      error.status = 422;
      error.code =
        "PROPERTY_DOCUMENT_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Check verification status.
   */
  isVerified() {
    return (
      this.status === "verified"
    );
  }
  /**
   * Check pending status.
   */
  isPending() {
    return [
      "pending",
      "submitted",
      "under_review"
    ].includes(
      this.status
    );
  }
  /**
   * Check rejected status.
   */
  isRejected() {
    return (
      this.status === "rejected"
    );
  }
  /**
   * Check expired status.
   */
  isExpired() {
    return (
      this.status === "expired"
    );
  }
  /**
   * Check archived status.
   */
  isArchived() {
    return (
      this.status === "archived"
    );
  }
  /**
   * Check ownership document.
   */
  isOwnershipDocument() {
    return [
      "ownership",
      "sale_deed",
      "title_deed",
      "registry",
      "mutation"
    ].includes(
      this.type
    );
  }
  /**
   * Check whether document is
   * financial/property-tax related.
   */
  isFinancialDocument() {
    return [
      "tax_receipt",
      "loan_document"
    ].includes(
      this.type
    );
  }
  /**
   * Check government/property approval.
   */
  isApprovalDocument() {
    return [
      "encumbrance_certificate",
      "occupancy_certificate",
      "completion_certificate",
      "building_plan",
      "approved_plan",
      "noc"
    ].includes(
      this.type
    );
  }
  /**
   * Check if attached to property.
   */
  belongsToProperty(
    propertyId
  ) {
    if (
      propertyId === undefined ||
      propertyId === null
    ) {
      return false;
    }
    return (
      String(this.propertyId) ===
      String(propertyId)
    );
  }
  /**
   * Check document identity.
   */
  belongsToDocument(
    documentId
  ) {
    if (
      documentId === undefined ||
      documentId === null
    ) {
      return false;
    }
    return (
      String(this.documentId) ===
      String(documentId)
    );
  }
  /**
   * Submit document.
   */
  submit() {
    this.status =
      "submitted";
    this.touch();
    return this;
  }
  /**
   * Start verification.
   */
  startReview() {
    this.status =
      "under_review";
    this.touch();
    return this;
  }
  /**
   * Verify document.
   */
  verify() {
    this.status =
      "verified";
    this.touch();
    return this;
  }
  /**
   * Reject document.
   */
  reject() {
    this.status =
      "rejected";
    this.touch();
    return this;
  }
  /**
   * Mark expired.
   */
  expire() {
    this.status =
      "expired";
    this.touch();
    return this;
  }
  /**
   * Archive document.
   */
  archive() {
    this.status =
      "archived";
    this.touch();
    return this;
  }
  /**
   * Get document summary.
   */
  getSummary() {
    return {
      id:
        this.id ?? null,
      propertyId:
        this.propertyId ?? null,
      documentId:
        this.documentId ?? null,
      type:
        this.type ?? null,
      status:
        this.status ?? null,
      verified:
        this.isVerified(),
      pending:
        this.isPending(),
      rejected:
        this.isRejected(),
      url:
        this.url ?? null
    };
  }
  /**
   * Safe API representation.
   */
  toJSON() {
    return {
      id:
        this.id ?? null,
      propertyId:
        this.propertyId ?? null,
      documentId:
        this.documentId ?? null,
      type:
        this.type ?? null,
      status:
        this.status ?? null,
      url:
        this.url ?? null,
      isVerified:
        this.isVerified(),
      isPending:
        this.isPending(),
      isRejected:
        this.isRejected(),
      createdAt:
        this.createdAt,
      updatedAt:
        this.updatedAt
    };
  }
}
module.exports = PropertyDocument;

Important: this remains compatible with your existing PropertyDocument fields, so you don’t need to change your model index just because this file is upgraded.