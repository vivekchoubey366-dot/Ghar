"use strict";
const BaseModel = require("./_base");
class LoanApplication extends BaseModel {
  static entity = "LoanApplication";
  static fields = [
    "id",
    "loanId",
    "userId",
    "propertyId",
    "requestedAmount",
    "status",
    "documents",
    "decisionAt"
  ];
  /**
   * Loan application lifecycle.
   */
  static statuses = [
    "draft",
    "submitted",
    "documents_pending",
    "under_review",
    "verification",
    "approved",
    "conditionally_approved",
    "rejected",
    "withdrawn",
    "cancelled",
    "expired"
  ];
  static MIN_AMOUNT = 1;
  static MAX_AMOUNT = 1000000000; // ₹100 Crore
  static MAX_DOCUMENTS = 100;
  /**
   * Validate loan application.
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
          "Loan application data must be an object"
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
     * Loan ID.
     */
    if (
      data.loanId !== undefined
    ) {
      if (
        typeof data.loanId !== "string" &&
        typeof data.loanId !== "number"
      ) {
        errors.push(
          "loanId must be a string or number"
        );
      } else if (
        String(data.loanId).trim() === ""
      ) {
        errors.push(
          "loanId cannot be empty"
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
     * Property ID.
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
     * Requested amount.
     */
    if (
      data.requestedAmount !== undefined
    ) {
      const amount =
        Number(
          data.requestedAmount
        );
      if (
        !Number.isFinite(amount)
      ) {
        errors.push(
          "requestedAmount must be a valid number"
        );
      } else if (
        amount <
          this.MIN_AMOUNT ||
        amount >
          this.MAX_AMOUNT
      ) {
        errors.push(
          `requestedAmount must be between ${this.MIN_AMOUNT} and ${this.MAX_AMOUNT}`
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
     * Documents.
     */
    if (
      data.documents !== undefined
    ) {
      if (
        !Array.isArray(
          data.documents
        )
      ) {
        errors.push(
          "documents must be an array"
        );
      } else if (
        data.documents.length >
        this.MAX_DOCUMENTS
      ) {
        errors.push(
          `documents cannot contain more than ${this.MAX_DOCUMENTS} items`
        );
      }
    }
    /**
     * Decision date.
     */
    if (
      data.decisionAt !== undefined
    ) {
      if (
        !this.normalizeDate(
          data.decisionAt
        )
      ) {
        errors.push(
          "decisionAt must be a valid date"
        );
      }
    }
    /**
     * A decision date should normally exist only
     * once a decision has been made.
     */
    if (
      data.decisionAt !== undefined &&
      data.decisionAt !== null
    ) {
      const decisionStatuses = [
        "approved",
        "conditionally_approved",
        "rejected"
      ];
      if (
        data.status !== undefined &&
        !decisionStatuses.includes(
          data.status
        )
      ) {
        errors.push(
          "decisionAt can only be set for a decided application"
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
     * Normalize identifiers.
     */
    for (
      const field of [
        "loanId",
        "userId",
        "propertyId"
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
     * Normalize amount.
     */
    if (
      normalized.requestedAmount !== undefined &&
      normalized.requestedAmount !== null
    ) {
      const amount =
        Number(
          normalized.requestedAmount
        );
      if (
        Number.isFinite(amount)
      ) {
        normalized.requestedAmount =
          Math.round(
            amount * 100
          ) / 100;
      }
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
     * Documents must always be an array.
     */
    if (
      normalized.documents === undefined
    ) {
      normalized.documents = [];
    }
    /**
     * Copy documents to prevent accidental
     * mutation of the original input.
     */
    if (
      Array.isArray(
        normalized.documents
      )
    ) {
      normalized.documents =
        normalized.documents.map(
          (document) => {
            if (
              document &&
              typeof document === "object"
            ) {
              return {
                ...document
              };
            }
            return document;
          }
        );
    }
    /**
     * Normalize decision date.
     */
    if (
      normalized.decisionAt !== undefined &&
      normalized.decisionAt !== null
    ) {
      normalized.decisionAt =
        this.normalizeDate(
          normalized.decisionAt
        );
    }
    /**
     * Default status.
     */
    if (
      normalized.status === undefined
    ) {
      normalized.status =
        "draft";
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
          "Loan application validation failed"
        );
      error.status = 422;
      error.code =
        "LOAN_APPLICATION_VALIDATION_ERROR";
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
   * Check application ownership.
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
   * Check property.
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
   * Check loan.
   */
  belongsToLoan(
    loanId
  ) {
    if (
      loanId === undefined ||
      loanId === null
    ) {
      return false;
    }
    return (
      String(this.loanId) ===
      String(loanId)
    );
  }
  /**
   * Add a document.
   */
  addDocument(
    document
  ) {
    if (
      !document
    ) {
      const error =
        new Error(
          "Document is required"
        );
      error.status = 422;
      error.code =
        "DOCUMENT_REQUIRED";
      throw error;
    }
    if (
      !Array.isArray(
        this.documents
      )
    ) {
      this.documents = [];
    }
    if (
      this.documents.length >=
      this.constructor.MAX_DOCUMENTS
    ) {
      const error =
        new Error(
          `Maximum of ${this.constructor.MAX_DOCUMENTS} documents allowed`
        );
      error.status = 422;
      error.code =
        "DOCUMENT_LIMIT_REACHED";
      throw error;
    }
    const normalized =
      typeof document === "object"
        ? {
            ...document
          }
        : document;
    this.documents.push(
      normalized
    );
    /**
     * A newly added document can move an
     * application out of documents_pending.
     */
    if (
      this.status ===
      "documents_pending"
    ) {
      this.status =
        "under_review";
    }
    this.touch();
    return this;
  }
  /**
   * Remove document by ID.
   */
  removeDocument(
    documentId
  ) {
    if (
      !Array.isArray(
        this.documents
      )
    ) {
      return this;
    }
    this.documents =
      this.documents.filter(
        (document) => {
          if (
            document &&
            typeof document === "object"
          ) {
            return String(
              document.id
            ) !==
              String(
                documentId
              );
          }
          return String(
            document
          ) !==
            String(
              documentId
            );
        }
      );
    this.touch();
    return this;
  }
  /**
   * Number of uploaded documents.
   */
  getDocumentCount() {
    return Array.isArray(
      this.documents
    )
      ? this.documents.length
      : 0;
  }
  /**
   * Check whether documents exist.
   */
  hasDocuments() {
    return (
      this.getDocumentCount() >
      0
    );
  }
  /**
   * Submit application.
   */
  submit() {
    return this.transitionTo(
      "submitted"
    );
  }
  /**
   * Request documents.
   */
  requestDocuments() {
    return this.transitionTo(
      "documents_pending"
    );
  }
  /**
   * Start review.
   */
  startReview() {
    return this.transitionTo(
      "under_review"
    );
  }
  /**
   * Start verification.
   */
  startVerification() {
    return this.transitionTo(
      "verification"
    );
  }
  /**
   * Approve application.
   */
  approve(
    decisionAt = new Date()
  ) {
    this.transitionTo(
      "approved"
    );
    this.decisionAt =
      this.constructor.normalizeDate(
        decisionAt
      );
    this.touch();
    return this;
  }
  /**
   * Conditionally approve.
   */
  conditionallyApprove(
    decisionAt = new Date()
  ) {
    this.transitionTo(
      "conditionally_approved"
    );
    this.decisionAt =
      this.constructor.normalizeDate(
        decisionAt
      );
    this.touch();
    return this;
  }
  /**
   * Reject application.
   */
  reject(
    decisionAt = new Date()
  ) {
    this.transitionTo(
      "rejected"
    );
    this.decisionAt =
      this.constructor.normalizeDate(
        decisionAt
      );
    this.touch();
    return this;
  }
  /**
   * Withdraw application.
   */
  withdraw() {
    return this.transitionTo(
      "withdrawn"
    );
  }
  /**
   * Cancel application.
   */
  cancel() {
    return this.transitionTo(
      "cancelled"
    );
  }
  /**
   * Expire application.
   */
  expire() {
    return this.transitionTo(
      "expired"
    );
  }
  /**
   * Controlled lifecycle transition.
   */
  transitionTo(
    nextStatus
  ) {
    if (
      !this.constructor.isValidStatus(
        nextStatus
      )
    ) {
      const error =
        new Error(
          `Invalid loan application status: ${nextStatus}`
        );
      error.status = 422;
      error.code =
        "INVALID_LOAN_APPLICATION_STATUS";
      throw error;
    }
    const current =
      this.status;
    const transitions = {
      draft: [
        "submitted",
        "cancelled"
      ],
      submitted: [
        "documents_pending",
        "under_review",
        "withdrawn",
        "cancelled"
      ],
      documents_pending: [
        "submitted",
        "under_review",
        "withdrawn",
        "cancelled"
      ],
      under_review: [
        "documents_pending",
        "verification",
        "approved",
        "conditionally_approved",
        "rejected",
        "withdrawn"
      ],
      verification: [
        "documents_pending",
        "approved",
        "conditionally_approved",
        "rejected",
        "withdrawn"
      ],
      approved: [
        "cancelled"
      ],
      conditionally_approved: [
        "approved",
        "rejected",
        "cancelled"
      ],
      rejected: [],
      withdrawn: [],
      cancelled: [],
      expired: []
    };
    if (
      current !== nextStatus &&
      !(
        transitions[current] || []
      ).includes(
        nextStatus
      )
    ) {
      const error =
        new Error(
          `Cannot transition loan application from ${current} to ${nextStatus}`
        );
      error.status = 409;
      error.code =
        "INVALID_LOAN_APPLICATION_TRANSITION";
      throw error;
    }
    this.status =
      nextStatus;
    this.touch();
    return this;
  }
  /**
   * State helpers.
   */
  isDraft() {
    return this.status === "draft";
  }
  isSubmitted() {
    return [
      "submitted",
      "documents_pending",
      "under_review",
      "verification"
    ].includes(
      this.status
    );
  }
  isUnderReview() {
    return [
      "under_review",
      "verification"
    ].includes(
      this.status
    );
  }
  isApproved() {
    return [
      "approved",
      "conditionally_approved"
    ].includes(
      this.status
    );
  }
  isRejected() {
    return (
      this.status ===
      "rejected"
    );
  }
  isWithdrawn() {
    return (
      this.status ===
      "withdrawn"
    );
  }
  isCancelled() {
    return (
      this.status ===
      "cancelled"
    );
  }
  isTerminal() {
    return [
      "approved",
      "rejected",
      "withdrawn",
      "cancelled",
      "expired"
    ].includes(
      this.status
    );
  }
  /**
   * Return application summary.
   */
  getSummary() {
    return {
      id:
        this.id ?? null,
      loanId:
        this.loanId ?? null,
      userId:
        this.userId ?? null,
      propertyId:
        this.propertyId ?? null,
      requestedAmount:
        this.requestedAmount,
      status:
        this.status,
      documentCount:
        this.getDocumentCount(),
      decisionAt:
        this.decisionAt ?? null
    };
  }
  /**
   * Safe API representation.
   */
  toJSON() {
    return {
      id:
        this.id ?? null,
      loanId:
        this.loanId ?? null,
      userId:
        this.userId,
      propertyId:
        this.propertyId ?? null,
      requestedAmount:
        this.requestedAmount,
      status:
        this.status,
      documents:
        Array.isArray(
          this.documents
        )
          ? this.documents.map(
              (document) =>
                document &&
                typeof document ===
                  "object"
                  ? {
                      ...document
                    }
                  : document
            )
          : [],
      decisionAt:
        this.decisionAt ?? null,
      createdAt:
        this.createdAt,
      updatedAt:
        this.updatedAt
    };
  }
}
module.exports = LoanApplication;

Application flow

draft
  │
  ▼
submitted
  │
  ▼
documents_pending ◄──────┐
  │                      │
  ▼                      │
under_review              │
  │                       │
  ▼                       │
verification ─────────────┘
  │
  ├──► approved
  │
  ├──► conditionally_approved ──► approved
  │
  └──► rejected

This keeps LoanApplication separate from Loan: the application represents the user’s request and underwriting process, while Loan represents the actual financial facility after approval/disbursement.