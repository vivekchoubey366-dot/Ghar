"use strict";
const BaseModel = require("./_base");
class Offer extends BaseModel {
  static entity = "Offer";
  static fields = [
    "id",
    "propertyId",
    "buyerId",
    "sellerId",
    "amount",
    "status",
    "message",
    "expiresAt"
  ];
  /**
   * Offer lifecycle.
   */
  static statuses = [
    "draft",
    "pending",
    "countered",
    "accepted",
    "rejected",
    "withdrawn",
    "expired",
    "cancelled"
  ];
  static MIN_AMOUNT = 1;
  static MAX_AMOUNT = 100000000000; // ₹1,000 Crore
  static MAX_MESSAGE_LENGTH = 5000;
  /**
   * Validate offer.
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
          "Offer data must be an object"
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
     * Buyer.
     */
    if (
      data.buyerId !== undefined
    ) {
      if (
        typeof data.buyerId !== "string" &&
        typeof data.buyerId !== "number"
      ) {
        errors.push(
          "buyerId must be a string or number"
        );
      } else if (
        String(
          data.buyerId
        ).trim() === ""
      ) {
        errors.push(
          "buyerId cannot be empty"
        );
      }
    }
    /**
     * Seller.
     */
    if (
      data.sellerId !== undefined
    ) {
      if (
        typeof data.sellerId !== "string" &&
        typeof data.sellerId !== "number"
      ) {
        errors.push(
          "sellerId must be a string or number"
        );
      } else if (
        String(
          data.sellerId
        ).trim() === ""
      ) {
        errors.push(
          "sellerId cannot be empty"
        );
      }
    }
    /**
     * Buyer and seller cannot be the same user.
     */
    if (
      data.buyerId !== undefined &&
      data.sellerId !== undefined &&
      String(data.buyerId) ===
        String(data.sellerId)
    ) {
      errors.push(
        "buyerId and sellerId cannot be the same"
      );
    }
    /**
     * Amount.
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
        data.message.length >
        this.MAX_MESSAGE_LENGTH
      ) {
        errors.push(
          `message cannot exceed ${this.MAX_MESSAGE_LENGTH} characters`
        );
      }
    }
    /**
     * Expiration.
     */
    if (
      data.expiresAt !== undefined
    ) {
      if (
        !this.isValidDate(
          data.expiresAt
        )
      ) {
        errors.push(
          "expiresAt must be a valid date"
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
   * Create offer.
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
        "propertyId",
        "buyerId",
        "sellerId"
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
     * Normalize expiry.
     */
    if (
      normalized.expiresAt !== undefined &&
      normalized.expiresAt !== null
    ) {
      normalized.expiresAt =
        this.normalizeDate(
          normalized.expiresAt
        );
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
    if (
      !check.valid
    ) {
      const error =
        new Error(
          "Offer validation failed"
        );
      error.status = 422;
      error.code =
        "OFFER_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Date validation.
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
   * Check offer ownership.
   */
  belongsToBuyer(
    userId
  ) {
    if (
      userId === undefined ||
      userId === null
    ) {
      return false;
    }
    return (
      String(this.buyerId) ===
      String(userId)
    );
  }
  /**
   * Check seller ownership.
   */
  belongsToSeller(
    userId
  ) {
    if (
      userId === undefined ||
      userId === null
    ) {
      return false;
    }
    return (
      String(this.sellerId) ===
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
      this.status ===
      status
    );
  }
  /**
   * Check whether offer is pending.
   */
  isPending() {
    return [
      "pending",
      "countered"
    ].includes(
      this.status
    );
  }
  /**
   * Check whether accepted.
   */
  isAccepted() {
    return (
      this.status ===
      "accepted"
    );
  }
  /**
   * Check whether rejected.
   */
  isRejected() {
    return (
      this.status ===
      "rejected"
    );
  }
  /**
   * Check whether withdrawn.
   */
  isWithdrawn() {
    return (
      this.status ===
      "withdrawn"
    );
  }
  /**
   * Check whether expired.
   */
  isExpired() {
    if (
      this.status ===
      "expired"
    ) {
      return true;
    }
    if (
      !this.expiresAt
    ) {
      return false;
    }
    const expiry =
      new Date(
        this.expiresAt
      );
    return (
      !Number.isNaN(
        expiry.getTime()
      ) &&
      expiry.getTime() <=
        Date.now()
    );
  }
  /**
   * Check terminal state.
   */
  isTerminal() {
    return [
      "accepted",
      "rejected",
      "withdrawn",
      "expired",
      "cancelled"
    ].includes(
      this.status
    );
  }
  /**
   * Submit offer.
   */
  submit() {
    return this.transitionTo(
      "pending"
    );
  }
  /**
   * Counter offer.
   */
  counter(
    amount,
    message = ""
  ) {
    const normalizedAmount =
      Number(amount);
    if (
      !Number.isFinite(
        normalizedAmount
      ) ||
      normalizedAmount <
        this.constructor.MIN_AMOUNT ||
      normalizedAmount >
        this.constructor.MAX_AMOUNT
    ) {
      const error =
        new Error(
          "Invalid counter-offer amount"
        );
      error.status = 422;
      error.code =
        "INVALID_COUNTER_OFFER_AMOUNT";
      throw error;
    }
    this.amount =
      Math.round(
        normalizedAmount * 100
      ) / 100;
    if (
      typeof message === "string"
    ) {
      this.message =
        message.trim();
    }
    this.status =
      "countered";
    this.touch();
    return this;
  }
  /**
   * Accept offer.
   */
  accept() {
    if (
      this.isExpired()
    ) {
      this.status =
        "expired";
      this.touch();
      const error =
        new Error(
          "Cannot accept an expired offer"
        );
      error.status = 409;
      error.code =
        "OFFER_EXPIRED";
      throw error;
    }
    return this.transitionTo(
      "accepted"
    );
  }
  /**
   * Reject offer.
   */
  reject() {
    return this.transitionTo(
      "rejected"
    );
  }
  /**
   * Withdraw offer.
   */
  withdraw() {
    return this.transitionTo(
      "withdrawn"
    );
  }
  /**
   * Cancel offer.
   */
  cancel() {
    return this.transitionTo(
      "cancelled"
    );
  }
  /**
   * Expire offer.
   */
  expire() {
    if (
      !this.isTerminal()
    ) {
      this.status =
        "expired";
      this.touch();
    }
    return this;
  }
  /**
   * Controlled lifecycle.
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
          `Invalid offer status: ${nextStatus}`
        );
      error.status = 422;
      error.code =
        "INVALID_OFFER_STATUS";
      throw error;
    }
    const current =
      this.status;
    const transitions = {
      draft: [
        "pending",
        "cancelled"
      ],
      pending: [
        "countered",
        "accepted",
        "rejected",
        "withdrawn",
        "expired",
        "cancelled"
      ],
      countered: [
        "pending",
        "accepted",
        "rejected",
        "withdrawn",
        "expired",
        "cancelled"
      ],
      accepted: [],
      rejected: [],
      withdrawn: [],
      expired: [],
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
          `Cannot transition offer from ${current} to ${nextStatus}`
        );
      error.status = 409;
      error.code =
        "INVALID_OFFER_TRANSITION";
      throw error;
    }
    this.status =
      nextStatus;
    this.touch();
    return this;
  }
  /**
   * Update expiration.
   */
  setExpiration(
    expiresAt
  ) {
    const date =
      this.constructor.normalizeDate(
        expiresAt
      );
    if (
      !date ||
      Number.isNaN(
        date.getTime()
      )
    ) {
      const error =
        new Error(
          "Invalid expiration date"
        );
      error.status = 422;
      error.code =
        "INVALID_OFFER_EXPIRATION";
      throw error;
    }
    if (
      date.getTime() <=
      Date.now()
    ) {
      const error =
        new Error(
          "Offer expiration must be in the future"
        );
      error.status = 422;
      error.code =
        "EXPIRATION_MUST_BE_FUTURE";
      throw error;
    }
    this.expiresAt =
      date;
    this.touch();
    return this;
  }
  /**
   * Time remaining until expiry.
   */
  getTimeUntilExpiry(
    now = new Date()
  ) {
    if (
      !this.expiresAt
    ) {
      return null;
    }
    const expiry =
      new Date(
        this.expiresAt
      );
    const current =
      new Date(now);
    if (
      Number.isNaN(
        expiry.getTime()
      ) ||
      Number.isNaN(
        current.getTime()
      )
    ) {
      return null;
    }
    return Math.max(
      0,
      expiry.getTime() -
        current.getTime()
    );
  }
  /**
   * Check whether expiry has been reached.
   */
  checkExpiry(
    now = new Date()
  ) {
    if (
      !this.expiresAt ||
      this.isTerminal()
    ) {
      return this;
    }
    const expiry =
      new Date(
        this.expiresAt
      );
    const current =
      new Date(now);
    if (
      !Number.isNaN(
        expiry.getTime()
      ) &&
      !Number.isNaN(
        current.getTime()
      ) &&
      current.getTime() >=
        expiry.getTime()
    ) {
      this.status =
        "expired";
      this.touch();
    }
    return this;
  }
  /**
   * Get offer summary.
   */
  getSummary() {
    return {
      id:
        this.id ?? null,
      propertyId:
        this.propertyId,
      buyerId:
        this.buyerId,
      sellerId:
        this.sellerId,
      amount:
        this.amount,
      status:
        this.status,
      pending:
        this.isPending(),
      accepted:
        this.isAccepted(),
      expired:
        this.isExpired(),
      expiresAt:
        this.expiresAt ?? null,
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
      propertyId:
        this.propertyId,
      buyerId:
        this.buyerId,
      sellerId:
        this.sellerId,
      amount:
        this.amount,
      status:
        this.status,
      message:
        this.message ?? null,
      expiresAt:
        this.expiresAt ?? null,
      isExpired:
        this.isExpired(),
      createdAt:
        this.createdAt,
      updatedAt:
        this.updatedAt
    };
  }
}
module.exports = Offer;

Offer flow

draft
  │
  ▼
pending
  │
  ├──► accepted
  │
  ├──► rejected
  │
  ├──► withdrawn
  │
  ├──► expired
  │
  └──► countered
          │
          ├──► pending
          ├──► accepted
          ├──► rejected
          ├──► withdrawn
          └──► expired

This version remains compatible with your original database fields while adding the business logic needed for buyer → seller offers, counter-offers, expiration, acceptance, rejection, withdrawal, and ownership checks.