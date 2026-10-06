"use strict";
const BaseModel = require("./_base");
class Payment extends BaseModel {
  static entity = "Payment";
  static fields = [
    "id",
    "userId",
    "propertyId",
    "type",
    "amount",
    "currency",
    "status",
    "provider",
    "providerReference"
  ];
  /**
   * Payment types supported by GHAR.
   */
  static types = [
    "property_purchase",
    "property_booking",
    "property_token",
    "rent",
    "deposit",
    "subscription",
    "loan_fee",
    "application_fee",
    "verification_fee",
    "service_fee",
    "listing_fee",
    "referral",
    "refund",
    "other"
  ];
  /**
   * Payment lifecycle.
   */
  static statuses = [
    "created",
    "pending",
    "processing",
    "authorized",
    "completed",
    "failed",
    "cancelled",
    "refunded",
    "partially_refunded",
    "expired"
  ];
  /**
   * ISO 4217 currencies supported.
   */
  static currencies = [
    "INR",
    "USD",
    "EUR",
    "GBP",
    "AED",
    "SGD",
    "AUD",
    "CAD"
  ];
  static MIN_AMOUNT = 0.01;
  static MAX_AMOUNT = 100000000000;
  static MAX_PROVIDER_REFERENCE_LENGTH = 255;
  /**
   * Validate payment data.
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
          "Payment data must be an object"
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
        String(
          data.userId
        ).trim() === ""
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
      data.propertyId !== undefined &&
      data.propertyId !== null
    ) {
      if (
        typeof data.propertyId !== "string" &&
        typeof data.propertyId !== "number"
      ) {
        errors.push(
          "propertyId must be a string or number"
        );
      } else if (
        String(
          data.propertyId
        ).trim() === ""
      ) {
        errors.push(
          "propertyId cannot be empty"
        );
      }
    }
    /**
     * Payment type.
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
     * Amount.
     */
    if (
      data.amount !== undefined
    ) {
      const amount =
        Number(
          data.amount
        );
      if (
        !Number.isFinite(
          amount
        )
      ) {
        errors.push(
          "amount must be a valid number"
        );
      } else if (
        amount <
          this.MIN_AMOUNT ||
        amount >
          this.MAX_AMOUNT
      ) {
        errors.push(
          `amount must be between ${this.MIN_AMOUNT} and ${this.MAX_AMOUNT}`
        );
      }
    }
    /**
     * Currency.
     */
    if (
      data.currency !== undefined
    ) {
      if (
        typeof data.currency !== "string"
      ) {
        errors.push(
          "currency must be a string"
        );
      } else if (
        !this.currencies.includes(
          data.currency
        )
      ) {
        errors.push(
          `currency must be one of: ${this.currencies.join(", ")}`
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
     * Provider.
     */
    if (
      data.provider !== undefined
    ) {
      if (
        typeof data.provider !== "string"
      ) {
        errors.push(
          "provider must be a string"
        );
      } else if (
        data.provider.trim().length === 0
      ) {
        errors.push(
          "provider cannot be empty"
        );
      }
    }
    /**
     * Provider reference.
     */
    if (
      data.providerReference !== undefined
    ) {
      if (
        typeof data.providerReference !== "string"
      ) {
        errors.push(
          "providerReference must be a string"
        );
      } else if (
        data.providerReference.length >
        this.MAX_PROVIDER_REFERENCE_LENGTH
      ) {
        errors.push(
          `providerReference cannot exceed ${this.MAX_PROVIDER_REFERENCE_LENGTH} characters`
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
   * Create payment.
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
        Number.isFinite(
          amount
        )
      ) {
        normalized.amount =
          Math.round(
            amount * 100
          ) / 100;
      }
    }
    /**
     * Normalize currency.
     */
    if (
      typeof normalized.currency ===
      "string"
    ) {
      normalized.currency =
        normalized.currency
          .trim()
          .toUpperCase();
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
     * Normalize provider.
     */
    if (
      typeof normalized.provider ===
      "string"
    ) {
      normalized.provider =
        normalized.provider.trim();
    }
    /**
     * Normalize provider reference.
     */
    if (
      typeof normalized.providerReference ===
      "string"
    ) {
      normalized.providerReference =
        normalized.providerReference.trim();
    }
    /**
     * Default currency.
     */
    if (
      normalized.currency === undefined
    ) {
      normalized.currency =
        "INR";
    }
    /**
     * Default status.
     */
    if (
      normalized.status === undefined
    ) {
      normalized.status =
        "created";
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
          "Payment validation failed"
        );
      error.status = 422;
      error.code =
        "PAYMENT_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Check payment type.
   */
  isType(
    type
  ) {
    return (
      this.type === type
    );
  }
  /**
   * Check ownership.
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
   * Check status.
   */
  isStatus(
    status
  ) {
    return (
      this.status === status
    );
  }
  /**
   * Payment completed.
   */
  isCompleted() {
    return (
      this.status ===
      "completed"
    );
  }
  /**
   * Payment successful.
   */
  isSuccessful() {
    return [
      "authorized",
      "completed"
    ].includes(
      this.status
    );
  }
  /**
   * Payment pending.
   */
  isPending() {
    return [
      "created",
      "pending",
      "processing"
    ].includes(
      this.status
    );
  }
  /**
   * Payment failed.
   */
  isFailed() {
    return (
      this.status ===
      "failed"
    );
  }
  /**
   * Payment refunded.
   */
  isRefunded() {
    return [
      "refunded",
      "partially_refunded"
    ].includes(
      this.status
    );
  }
  /**
   * Terminal state.
   */
  isTerminal() {
    return [
      "completed",
      "failed",
      "cancelled",
      "refunded",
      "partially_refunded",
      "expired"
    ].includes(
      this.status
    );
  }
  /**
   * Start payment processing.
   */
  startProcessing() {
    return this.transitionTo(
      "processing"
    );
  }
  /**
   * Authorize payment.
   */
  authorize() {
    return this.transitionTo(
      "authorized"
    );
  }
  /**
   * Complete payment.
   */
  complete(
    providerReference
  ) {
    if (
      providerReference !== undefined
    ) {
      this.setProviderReference(
        providerReference
      );
    }
    return this.transitionTo(
      "completed"
    );
  }
  /**
   * Fail payment.
   */
  fail() {
    return this.transitionTo(
      "failed"
    );
  }
  /**
   * Cancel payment.
   */
  cancel() {
    return this.transitionTo(
      "cancelled"
    );
  }
  /**
   * Refund payment.
   */
  refund() {
    if (
      !this.isSuccessful()
    ) {
      const error =
        new Error(
          "Only successful payments can be refunded"
        );
      error.status = 409;
      error.code =
        "PAYMENT_NOT_REFUNDABLE";
      throw error;
    }
    return this.transitionTo(
      "refunded"
    );
  }
  /**
   * Partial refund.
   */
  partialRefund() {
    if (
      !this.isSuccessful()
    ) {
      const error =
        new Error(
          "Only successful payments can be partially refunded"
        );
      error.status = 409;
      error.code =
        "PAYMENT_NOT_REFUNDABLE";
      throw error;
    }
    return this.transitionTo(
      "partially_refunded"
    );
  }
  /**
   * Expire payment.
   */
  expire() {
    if (
      this.isTerminal()
    ) {
      return this;
    }
    return this.transitionTo(
      "expired"
    );
  }
  /**
   * Controlled payment lifecycle.
   */
  transitionTo(
    nextStatus
  ) {
    if (
      !this.constructor.statuses.includes(
        nextStatus
      )
    ) {
      const error =
        new Error(
          `Invalid payment status: ${nextStatus}`
        );
      error.status = 422;
      error.code =
        "INVALID_PAYMENT_STATUS";
      throw error;
    }
    const current =
      this.status;
    const transitions = {
      created: [
        "pending",
        "processing",
        "cancelled",
        "expired"
      ],
      pending: [
        "processing",
        "authorized",
        "failed",
        "cancelled",
        "expired"
      ],
      processing: [
        "authorized",
        "completed",
        "failed",
        "cancelled",
        "expired"
      ],
      authorized: [
        "completed",
        "failed",
        "cancelled"
      ],
      completed: [
        "refunded",
        "partially_refunded"
      ],
      failed: [],
      cancelled: [],
      refunded: [],
      partially_refunded: [
        "refunded"
      ],
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
          `Cannot transition payment from ${current} to ${nextStatus}`
        );
      error.status = 409;
      error.code =
        "INVALID_PAYMENT_TRANSITION";
      throw error;
    }
    this.status =
      nextStatus;
    this.touch();
    return this;
  }
  /**
   * Set provider reference.
   */
  setProviderReference(
    reference
  ) {
    if (
      reference === undefined ||
      reference === null
    ) {
      const error =
        new Error(
          "Provider reference is required"
        );
      error.status = 422;
      error.code =
        "PROVIDER_REFERENCE_REQUIRED";
      throw error;
    }
    const normalized =
      String(
        reference
      ).trim();
    if (
      normalized.length === 0 ||
      normalized.length >
        this.constructor
          .MAX_PROVIDER_REFERENCE_LENGTH
    ) {
      const error =
        new Error(
          "Invalid provider reference"
        );
      error.status = 422;
      error.code =
        "INVALID_PROVIDER_REFERENCE";
      throw error;
    }
    this.providerReference =
      normalized;
    this.touch();
    return this;
  }
  /**
   * Get amount in smallest currency unit.
   *
   * INR 100.50 -> 10050
   */
  getMinorAmount() {
    return Math.round(
      Number(this.amount) * 100
    );
  }
  /**
   * Get formatted amount.
   */
  getFormattedAmount() {
    try {
      return new Intl.NumberFormat(
        "en-IN",
        {
          style: "currency",
          currency:
            this.currency || "INR"
        }
      ).format(
        Number(this.amount)
      );
    } catch {
      return `${this.currency || "INR"} ${this.amount}`;
    }
  }
  /**
   * Get payment summary.
   */
  getSummary() {
    return {
      id:
        this.id ?? null,
      userId:
        this.userId,
      propertyId:
        this.propertyId ?? null,
      type:
        this.type,
      amount:
        this.amount,
      currency:
        this.currency,
      status:
        this.status,
      successful:
        this.isSuccessful(),
      pending:
        this.isPending(),
      failed:
        this.isFailed(),
      refunded:
        this.isRefunded(),
      provider:
        this.provider ?? null,
      providerReference:
        this.providerReference ?? null,
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
      userId:
        this.userId,
      propertyId:
        this.propertyId ?? null,
      type:
        this.type,
      amount:
        this.amount,
      currency:
        this.currency,
      status:
        this.status,
      provider:
        this.provider ?? null,
      providerReference:
        this.providerReference ?? null,
      isSuccessful:
        this.isSuccessful(),
      isPending:
        this.isPending(),
      isRefunded:
        this.isRefunded(),
      createdAt:
        this.createdAt,
      updatedAt:
        this.updatedAt
    };
  }
}
module.exports = Payment;

Note: this keeps your original database fields intact. The additional methods are model-level behavior and don’t require extra DB columns. The payment status flow is:

created
   ↓
pending
   ↓
processing
   ↓
authorized ──► completed
                   │
                   ├──► partially_refunded ──► refunded
                   │
                   └──► refunded
Failure path:     failed
Cancellation:     cancelled
Timeout:          expired