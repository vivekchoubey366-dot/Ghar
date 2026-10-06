"use strict";
const BaseModel = require("./_base");
class Loan extends BaseModel {
  static entity = "Loan";
  static fields = [
    "id",
    "userId",
    "propertyId",
    "lender",
    "amount",
    "interestRate",
    "tenureMonths",
    "status"
  ];
  /**
   * Loan lifecycle.
   */
  static statuses = [
    "draft",
    "submitted",
    "under_review",
    "approved",
    "rejected",
    "disbursed",
    "active",
    "closed",
    "cancelled",
    "defaulted"
  ];
  static MIN_AMOUNT = 1;
  static MAX_AMOUNT = 1000000000; // ₹100 Crore
  static MIN_INTEREST_RATE = 0;
  static MAX_INTEREST_RATE = 100;
  static MIN_TENURE_MONTHS = 1;
  static MAX_TENURE_MONTHS = 600;
  static MAX_LENDER_LENGTH = 255;
  /**
   * Validate loan data.
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
          "Loan data must be an object"
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
     * User.
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
     * Property.
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
     * Lender.
     */
    if (
      data.lender !== undefined
    ) {
      if (
        typeof data.lender !== "string"
      ) {
        errors.push(
          "lender must be a string"
        );
      } else if (
        data.lender.trim() === ""
      ) {
        errors.push(
          "lender cannot be empty"
        );
      } else if (
        data.lender.length >
        this.MAX_LENDER_LENGTH
      ) {
        errors.push(
          `lender cannot exceed ${this.MAX_LENDER_LENGTH} characters`
        );
      }
    }
    /**
     * Loan amount.
     */
    if (
      data.amount !== undefined
    ) {
      const amount =
        Number(data.amount);
      if (
        !Number.isFinite(amount)
      ) {
        errors.push(
          "amount must be a valid number"
        );
      } else if (
        amount < this.MIN_AMOUNT ||
        amount > this.MAX_AMOUNT
      ) {
        errors.push(
          `amount must be between ${this.MIN_AMOUNT} and ${this.MAX_AMOUNT}`
        );
      }
    }
    /**
     * Interest rate.
     */
    if (
      data.interestRate !== undefined
    ) {
      const rate =
        Number(
          data.interestRate
        );
      if (
        !Number.isFinite(rate)
      ) {
        errors.push(
          "interestRate must be a valid number"
        );
      } else if (
        rate <
          this.MIN_INTEREST_RATE ||
        rate >
          this.MAX_INTEREST_RATE
      ) {
        errors.push(
          `interestRate must be between ${this.MIN_INTEREST_RATE} and ${this.MAX_INTEREST_RATE}`
        );
      }
    }
    /**
     * Tenure.
     */
    if (
      data.tenureMonths !== undefined
    ) {
      const tenure =
        Number(
          data.tenureMonths
        );
      if (
        !Number.isInteger(
          tenure
        )
      ) {
        errors.push(
          "tenureMonths must be an integer"
        );
      } else if (
        tenure <
          this.MIN_TENURE_MONTHS ||
        tenure >
          this.MAX_TENURE_MONTHS
      ) {
        errors.push(
          `tenureMonths must be between ${this.MIN_TENURE_MONTHS} and ${this.MAX_TENURE_MONTHS}`
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
    return {
      valid:
        errors.length === 0,
      errors
    };
  }
  /**
   * Create a Loan.
   */
  static create(data = {}) {
    const normalized = {
      ...data
    };
    /**
     * Normalize IDs.
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
     * Normalize lender.
     */
    if (
      typeof normalized.lender ===
      "string"
    ) {
      normalized.lender =
        normalized.lender.trim();
    }
    /**
     * Normalize amount.
     */
    if (
      normalized.amount !== undefined &&
      normalized.amount !== null
    ) {
      const amount =
        Number(
          normalized.amount
        );
      if (
        Number.isFinite(amount)
      ) {
        normalized.amount =
          Math.round(
            amount * 100
          ) / 100;
      }
    }
    /**
     * Normalize interest rate.
     */
    if (
      normalized.interestRate !== undefined &&
      normalized.interestRate !== null
    ) {
      const rate =
        Number(
          normalized.interestRate
        );
      if (
        Number.isFinite(rate)
      ) {
        normalized.interestRate =
          Math.round(
            rate * 100
          ) / 100;
      }
    }
    /**
     * Normalize tenure.
     */
    if (
      normalized.tenureMonths !== undefined &&
      normalized.tenureMonths !== null
    ) {
      const tenure =
        Number(
          normalized.tenureMonths
        );
      if (
        Number.isFinite(tenure)
      ) {
        normalized.tenureMonths =
          Math.trunc(tenure);
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
          "Loan validation failed"
        );
      error.status = 422;
      error.code =
        "LOAN_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
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
   * Check borrower ownership.
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
   * Check property relationship.
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
   * Calculate monthly EMI.
   *
   * interestRate is annual percentage.
   */
  calculateEMI() {
    const principal =
      Number(this.amount);
    const annualRate =
      Number(
        this.interestRate
      );
    const months =
      Number(
        this.tenureMonths
      );
    if (
      !Number.isFinite(principal) ||
      !Number.isFinite(annualRate) ||
      !Number.isInteger(months) ||
      principal <= 0 ||
      months <= 0
    ) {
      return null;
    }
    /**
     * Zero-interest loan.
     */
    if (
      annualRate === 0
    ) {
      return Math.round(
        (principal / months) *
          100
      ) / 100;
    }
    const monthlyRate =
      annualRate /
      100 /
      12;
    const factor =
      Math.pow(
        1 + monthlyRate,
        months
      );
    const emi =
      principal *
      monthlyRate *
      factor /
      (factor - 1);
    return Math.round(
      emi * 100
    ) / 100;
  }
  /**
   * Calculate total payable amount.
   */
  calculateTotalPayable() {
    const emi =
      this.calculateEMI();
    if (
      emi === null
    ) {
      return null;
    }
    return Math.round(
      emi *
        Number(
          this.tenureMonths
        ) *
        100
    ) / 100;
  }
  /**
   * Calculate total interest.
   */
  calculateTotalInterest() {
    const total =
      this.calculateTotalPayable();
    if (
      total === null
    ) {
      return null;
    }
    return Math.round(
      (total -
        Number(this.amount)) *
        100
    ) / 100;
  }
  /**
   * Transition loan status.
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
          `Invalid loan status: ${nextStatus}`
        );
      error.status = 422;
      error.code =
        "INVALID_LOAN_STATUS";
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
        "under_review",
        "approved",
        "rejected",
        "cancelled"
      ],
      under_review: [
        "approved",
        "rejected",
        "cancelled"
      ],
      approved: [
        "disbursed",
        "cancelled"
      ],
      rejected: [
        "draft",
        "cancelled"
      ],
      disbursed: [
        "active"
      ],
      active: [
        "closed",
        "defaulted"
      ],
      defaulted: [
        "active",
        "closed"
      ],
      closed: [],
      cancelled: []
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
          `Cannot transition loan from ${current} to ${nextStatus}`
        );
      error.status = 409;
      error.code =
        "INVALID_LOAN_TRANSITION";
      throw error;
    }
    this.status =
      nextStatus;
    this.touch();
    return this;
  }
  /**
   * Submit loan.
   */
  submit() {
    return this.transitionTo(
      "submitted"
    );
  }
  /**
   * Put loan under review.
   */
  startReview() {
    return this.transitionTo(
      "under_review"
    );
  }
  /**
   * Approve loan.
   */
  approve() {
    return this.transitionTo(
      "approved"
    );
  }
  /**
   * Reject loan.
   */
  reject() {
    return this.transitionTo(
      "rejected"
    );
  }
  /**
   * Mark loan disbursed.
   */
  disburse() {
    return this.transitionTo(
      "disbursed"
    );
  }
  /**
   * Activate loan.
   */
  activate() {
    return this.transitionTo(
      "active"
    );
  }
  /**
   * Close loan.
   */
  close() {
    return this.transitionTo(
      "closed"
    );
  }
  /**
   * Mark loan defaulted.
   */
  markDefaulted() {
    return this.transitionTo(
      "defaulted"
    );
  }
  /**
   * Cancel loan.
   */
  cancel() {
    return this.transitionTo(
      "cancelled"
    );
  }
  /**
   * State helpers.
   */
  isDraft() {
    return this.status === "draft";
  }
  isPending() {
    return [
      "submitted",
      "under_review"
    ].includes(
      this.status
    );
  }
  isApproved() {
    return [
      "approved",
      "disbursed",
      "active"
    ].includes(
      this.status
    );
  }
  isActive() {
    return this.status === "active";
  }
  isClosed() {
    return this.status === "closed";
  }
  isDefaulted() {
    return this.status === "defaulted";
  }
  /**
   * Return financial summary.
   */
  getFinancialSummary() {
    return {
      principal:
        Number(this.amount),
      interestRate:
        Number(
          this.interestRate
        ),
      tenureMonths:
        Number(
          this.tenureMonths
        ),
      monthlyEMI:
        this.calculateEMI(),
      totalPayable:
        this.calculateTotalPayable(),
      totalInterest:
        this.calculateTotalInterest()
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
      propertyId:
        this.propertyId ?? null,
      lender:
        this.lender,
      amount:
        this.amount,
      interestRate:
        this.interestRate,
      tenureMonths:
        this.tenureMonths,
      status:
        this.status,
      financialSummary:
        this.getFinancialSummary(),
      createdAt:
        this.createdAt,
      updatedAt:
        this.updatedAt
    };
  }
}
module.exports = Loan;

GHAR loan flow

draft
  │
  ▼
submitted
  │
  ▼
under_review
  │
  ├────────► approved ──► disbursed ──► active
  │                                      │
  │                                      ├──► closed
  │                                      │
  │                                      └──► defaulted ──► closed
  │
  └────────► rejected
                 │
                 └──► draft

The model keeps EMI calculation and loan-state rules inside the model, while your loan.controller.js should handle authentication, database operations, lender/API integrations, document checks, and HTTP responses.