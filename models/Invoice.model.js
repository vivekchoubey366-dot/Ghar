"use strict";
const BaseModel = require("./_base");
class Invoice extends BaseModel {
  static entity = "Invoice";
  static fields = [
    "id",
    "userId",
    "paymentId",
    "number",
    "amount",
    "currency",
    "status",
    "issuedAt",
    "dueAt"
  ];
  /**
   * Supported invoice statuses.
   */
  static statuses = [
    "draft",
    "issued",
    "paid",
    "partially_paid",
    "overdue",
    "cancelled",
    "refunded"
  ];
  /**
   * Supported currencies for GHAR.
   */
  static currencies = [
    "INR",
    "USD",
    "EUR",
    "GBP",
    "AED"
  ];
  static MAX_NUMBER_LENGTH = 100;
  /**
   * Validate invoice data.
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
          "Invoice data must be an object"
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
     * userId.
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
     * paymentId.
     */
    if (
      data.paymentId !== undefined
    ) {
      if (
        typeof data.paymentId !== "string" &&
        typeof data.paymentId !== "number"
      ) {
        errors.push(
          "paymentId must be a string or number"
        );
      } else if (
        String(data.paymentId).trim() === ""
      ) {
        errors.push(
          "paymentId cannot be empty"
        );
      }
    }
    /**
     * Invoice number.
     */
    if (
      data.number !== undefined
    ) {
      if (
        typeof data.number !== "string"
      ) {
        errors.push(
          "number must be a string"
        );
      } else if (
        data.number.trim() === ""
      ) {
        errors.push(
          "number cannot be empty"
        );
      } else if (
        data.number.length >
        this.MAX_NUMBER_LENGTH
      ) {
        errors.push(
          `number cannot exceed ${this.MAX_NUMBER_LENGTH} characters`
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
        Number(data.amount);
      if (
        !Number.isFinite(amount)
      ) {
        errors.push(
          "amount must be a valid number"
        );
      } else if (
        amount < 0
      ) {
        errors.push(
          "amount cannot be negative"
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
     * Issued date.
     */
    if (
      data.issuedAt !== undefined
    ) {
      if (
        !this.normalizeDate(
          data.issuedAt
        )
      ) {
        errors.push(
          "issuedAt must be a valid date"
        );
      }
    }
    /**
     * Due date.
     */
    if (
      data.dueAt !== undefined
    ) {
      if (
        !this.normalizeDate(
          data.dueAt
        )
      ) {
        errors.push(
          "dueAt must be a valid date"
        );
      }
    }
    /**
     * Due date cannot be before issue date.
     */
    if (
      data.issuedAt !== undefined &&
      data.dueAt !== undefined
    ) {
      const issuedAt =
        this.normalizeDate(
          data.issuedAt
        );
      const dueAt =
        this.normalizeDate(
          data.dueAt
        );
      if (
        issuedAt &&
        dueAt &&
        dueAt < issuedAt
      ) {
        errors.push(
          "dueAt cannot be earlier than issuedAt"
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
   * Create invoice.
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
      normalized.paymentId !== undefined &&
      normalized.paymentId !== null
    ) {
      normalized.paymentId =
        String(
          normalized.paymentId
        ).trim();
    }
    /**
     * Normalize invoice number.
     */
    if (
      typeof normalized.number ===
      "string"
    ) {
      normalized.number =
        normalized.number.trim();
    }
    /**
     * Normalize amount.
     *
     * Monetary values are kept at two decimal
     * places at the model boundary.
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
        "draft";
    }
    /**
     * Normalize dates.
     */
    if (
      normalized.issuedAt !== undefined &&
      normalized.issuedAt !== null
    ) {
      normalized.issuedAt =
        this.normalizeDate(
          normalized.issuedAt
        );
    }
    if (
      normalized.dueAt !== undefined &&
      normalized.dueAt !== null
    ) {
      normalized.dueAt =
        this.normalizeDate(
          normalized.dueAt
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
          "Invoice validation failed"
        );
      error.status = 422;
      error.code =
        "INVOICE_VALIDATION_ERROR";
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
   * Check valid currency.
   */
  static isValidCurrency(
    currency
  ) {
    return this.currencies.includes(
      currency
    );
  }
  /**
   * Mark invoice as issued.
   */
  issue(
    issuedAt = new Date(),
    dueAt = this.dueAt
  ) {
    if (
      ![
        "draft"
      ].includes(
        this.status
      )
    ) {
      const error =
        new Error(
          "Only draft invoices can be issued"
        );
      error.status = 409;
      error.code =
        "INVALID_INVOICE_TRANSITION";
      throw error;
    }
    const issueDate =
      this.normalizeDate(
        issuedAt
      );
    if (
      !issueDate
    ) {
      throw this.constructor.createError(
        "Invalid invoice issue date",
        422,
        "INVALID_ISSUE_DATE"
      );
    }
    let dueDate =
      dueAt
        ? this.normalizeDate(dueAt)
        : null;
    if (
      dueDate &&
      dueDate < issueDate
    ) {
      throw this.constructor.createError(
        "Due date cannot be earlier than issue date",
        422,
        "INVALID_DUE_DATE"
      );
    }
    this.status =
      "issued";
    this.issuedAt =
      issueDate;
    this.dueAt =
      dueDate;
    this.touch();
    return this;
  }
  /**
   * Mark invoice as paid.
   */
  markPaid() {
    if (
      ![
        "issued",
        "partially_paid",
        "overdue"
      ].includes(
        this.status
      )
    ) {
      const error =
        new Error(
          "Invoice cannot be marked as paid in its current state"
        );
      error.status = 409;
      error.code =
        "INVALID_INVOICE_TRANSITION";
      throw error;
    }
    this.status =
      "paid";
    this.touch();
    return this;
  }
  /**
   * Mark invoice as partially paid.
   */
  markPartiallyPaid() {
    if (
      ![
        "issued",
        "overdue"
      ].includes(
        this.status
      )
    ) {
      const error =
        new Error(
          "Invoice cannot be marked as partially paid"
        );
      error.status = 409;
      error.code =
        "INVALID_INVOICE_TRANSITION";
      throw error;
    }
    this.status =
      "partially_paid";
    this.touch();
    return this;
  }
  /**
   * Mark invoice overdue.
   */
  markOverdue() {
    if (
      ![
        "issued",
        "partially_paid"
      ].includes(
        this.status
      )
    ) {
      const error =
        new Error(
          "Invoice cannot be marked overdue"
        );
      error.status = 409;
      error.code =
        "INVALID_INVOICE_TRANSITION";
      throw error;
    }
    this.status =
      "overdue";
    this.touch();
    return this;
  }
  /**
   * Cancel invoice.
   */
  cancel() {
    if (
      [
        "paid",
        "refunded",
        "cancelled"
      ].includes(
        this.status
      )
    ) {
      const error =
        new Error(
          "This invoice cannot be cancelled"
        );
      error.status = 409;
      error.code =
        "INVALID_INVOICE_TRANSITION";
      throw error;
    }
    this.status =
      "cancelled";
    this.touch();
    return this;
  }
  /**
   * Mark invoice refunded.
   */
  refund() {
    if (
      this.status !==
      "paid"
    ) {
      const error =
        new Error(
          "Only paid invoices can be refunded"
        );
      error.status = 409;
      error.code =
        "INVALID_INVOICE_TRANSITION";
      throw error;
    }
    this.status =
      "refunded";
    this.touch();
    return this;
  }
  /**
   * Check whether invoice is paid.
   */
  isPaid() {
    return (
      this.status ===
      "paid"
    );
  }
  /**
   * Check whether invoice is overdue.
   */
  isOverdue() {
    return (
      this.status ===
      "overdue"
    );
  }
  /**
   * Check whether invoice is cancelled.
   */
  isCancelled() {
    return (
      this.status ===
      "cancelled"
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
   * Return amount in minor units.
   *
   * Example:
   * ₹1,250.50 -> 125050
   */
  getMinorAmount() {
    return Math.round(
      Number(this.amount || 0) *
      100
    );
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
      paymentId:
        this.paymentId ?? null,
      number:
        this.number,
      amount:
        this.amount,
      currency:
        this.currency,
      status:
        this.status,
      issuedAt:
        this.issuedAt ?? null,
      dueAt:
        this.dueAt ?? null
    };
  }
}
module.exports = Invoice;