"use strict";
const BaseModel = require("./_base");
class Referral extends BaseModel {
  static entity = "Referral";
  static fields = [
    "id",
    "referrerId",
    "referredUserId",
    "code",
    "status",
    "rewardAmount",
    "rewardStatus"
  ];
  /**
   * Referral lifecycle.
   */
  static statuses = [
    "pending",
    "registered",
    "qualified",
    "completed",
    "cancelled",
    "expired",
    "rejected"
  ];
  /**
   * Reward lifecycle.
   */
  static rewardStatuses = [
    "pending",
    "eligible",
    "processing",
    "paid",
    "failed",
    "cancelled",
    "reversed"
  ];
  static MAX_CODE_LENGTH = 50;
  static MAX_REWARD_AMOUNT = 100000000;
  /**
   * Validate referral.
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
          "Referral data must be an object"
        ]
      };
    }
    /**
     * Reject explicit null values.
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
     * Referrer ID.
     */
    if (
      data.referrerId !== undefined
    ) {
      if (
        typeof data.referrerId !== "string" &&
        typeof data.referrerId !== "number"
      ) {
        errors.push(
          "referrerId must be a string or number"
        );
      } else if (
        String(
          data.referrerId
        ).trim() === ""
      ) {
        errors.push(
          "referrerId cannot be empty"
        );
      }
    }
    /**
     * Referred user ID.
     */
    if (
      data.referredUserId !== undefined
    ) {
      if (
        typeof data.referredUserId !== "string" &&
        typeof data.referredUserId !== "number"
      ) {
        errors.push(
          "referredUserId must be a string or number"
        );
      } else if (
        String(
          data.referredUserId
        ).trim() === ""
      ) {
        errors.push(
          "referredUserId cannot be empty"
        );
      }
    }
    /**
     * Prevent self-referral.
     */
    if (
      data.referrerId !== undefined &&
      data.referredUserId !== undefined &&
      data.referrerId !== null &&
      data.referredUserId !== null &&
      String(data.referrerId) ===
        String(data.referredUserId)
    ) {
      errors.push(
        "referrerId and referredUserId cannot be the same user"
      );
    }
    /**
     * Referral code.
     */
    if (
      data.code !== undefined
    ) {
      if (
        typeof data.code !== "string"
      ) {
        errors.push(
          "code must be a string"
        );
      } else if (
        data.code.trim() === ""
      ) {
        errors.push(
          "code cannot be empty"
        );
      } else if (
        data.code.length >
        this.MAX_CODE_LENGTH
      ) {
        errors.push(
          `code cannot exceed ${this.MAX_CODE_LENGTH} characters`
        );
      } else if (
        !/^[A-Z0-9_-]+$/i.test(
          data.code.trim()
        )
      ) {
        errors.push(
          "code may contain only letters, numbers, underscores and hyphens"
        );
      }
    }
    /**
     * Referral status.
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
            .trim()
            .toLowerCase()
        )
      ) {
        errors.push(
          `status must be one of: ${this.statuses.join(", ")}`
        );
      }
    }
    /**
     * Reward status.
     */
    if (
      data.rewardStatus !== undefined
    ) {
      if (
        typeof data.rewardStatus !==
        "string"
      ) {
        errors.push(
          "rewardStatus must be a string"
        );
      } else if (
        !this.rewardStatuses.includes(
          data.rewardStatus
            .trim()
            .toLowerCase()
        )
      ) {
        errors.push(
          `rewardStatus must be one of: ${this.rewardStatuses.join(", ")}`
        );
      }
    }
    /**
     * Reward amount.
     */
    if (
      data.rewardAmount !== undefined
    ) {
      const amount =
        Number(
          data.rewardAmount
        );
      if (
        !Number.isFinite(amount)
      ) {
        errors.push(
          "rewardAmount must be a valid number"
        );
      } else if (
        amount < 0 ||
        amount > this.MAX_REWARD_AMOUNT
      ) {
        errors.push(
          `rewardAmount must be between 0 and ${this.MAX_REWARD_AMOUNT}`
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
   * Create validated referral.
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
        "referrerId",
        "referredUserId"
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
     * Normalize referral code.
     */
    if (
      typeof normalized.code ===
      "string"
    ) {
      normalized.code =
        normalized.code
          .trim()
          .toUpperCase();
    }
    /**
     * Normalize statuses.
     */
    for (
      const field of [
        "status",
        "rewardStatus"
      ]
    ) {
      if (
        typeof normalized[field] ===
        "string"
      ) {
        normalized[field] =
          normalized[field]
            .trim()
            .toLowerCase();
      }
    }
    /**
     * Normalize reward amount.
     */
    if (
      normalized.rewardAmount !==
        undefined &&
      normalized.rewardAmount !==
        null &&
      normalized.rewardAmount !== ""
    ) {
      const amount =
        Number(
          normalized.rewardAmount
        );
      if (
        Number.isFinite(amount)
      ) {
        normalized.rewardAmount =
          Math.round(
            amount * 100
          ) / 100;
      }
    }
    /**
     * Defaults.
     */
    if (
      normalized.status === undefined
    ) {
      normalized.status =
        "pending";
    }
    if (
      normalized.rewardStatus ===
      undefined
    ) {
      normalized.rewardStatus =
        "pending";
    }
    if (
      normalized.rewardAmount ===
      undefined
    ) {
      normalized.rewardAmount = 0;
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
          "Referral validation failed"
        );
      error.status = 422;
      error.code =
        "REFERRAL_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Identity helpers.
   */
  belongsToReferrer(
    userId
  ) {
    if (
      userId === undefined ||
      userId === null
    ) {
      return false;
    }
    return (
      String(this.referrerId) ===
      String(userId)
    );
  }
  belongsToReferredUser(
    userId
  ) {
    if (
      userId === undefined ||
      userId === null
    ) {
      return false;
    }
    return (
      String(this.referredUserId) ===
      String(userId)
    );
  }
  involvesUser(
    userId
  ) {
    return (
      this.belongsToReferrer(
        userId
      ) ||
      this.belongsToReferredUser(
        userId
      )
    );
  }
  /**
   * Referral status helpers.
   */
  isPending() {
    return (
      this.status === "pending"
    );
  }
  isRegistered() {
    return (
      this.status === "registered"
    );
  }
  isQualified() {
    return (
      this.status === "qualified"
    );
  }
  isCompleted() {
    return (
      this.status === "completed"
    );
  }
  isCancelled() {
    return (
      this.status === "cancelled"
    );
  }
  isExpired() {
    return (
      this.status === "expired"
    );
  }
  isRejected() {
    return (
      this.status === "rejected"
    );
  }
  isSuccessful() {
    return (
      this.status ===
      "completed"
    );
  }
  /**
   * Reward helpers.
   */
  isRewardPending() {
    return (
      this.rewardStatus ===
      "pending"
    );
  }
  isRewardEligible() {
    return (
      this.rewardStatus ===
      "eligible"
    );
  }
  isRewardProcessing() {
    return (
      this.rewardStatus ===
      "processing"
    );
  }
  isRewardPaid() {
    return (
      this.rewardStatus ===
      "paid"
    );
  }
  isRewardFailed() {
    return (
      this.rewardStatus ===
      "failed"
    );
  }
  isRewardCancelled() {
    return (
      this.rewardStatus ===
      "cancelled"
    );
  }
  isRewardReversed() {
    return (
      this.rewardStatus ===
      "reversed"
    );
  }
  hasReward() {
    return (
      Number(
        this.rewardAmount || 0
      ) > 0
    );
  }
  isRewardPayable() {
    return (
      this.isCompleted() &&
      this.hasReward() &&
      (
        this.isRewardEligible() ||
        this.isRewardPending()
      )
    );
  }
  /**
   * Referral lifecycle.
   */
  register() {
    this.status =
      "registered";
    this.touch();
    return this;
  }
  qualify() {
    this.status =
      "qualified";
    this.rewardStatus =
      "eligible";
    this.touch();
    return this;
  }
  complete() {
    this.status =
      "completed";
    if (
      this.hasReward() &&
      this.rewardStatus ===
        "pending"
    ) {
      this.rewardStatus =
        "eligible";
    }
    this.touch();
    return this;
  }
  cancel() {
    this.status =
      "cancelled";
    if (
      !this.isRewardPaid()
    ) {
      this.rewardStatus =
        "cancelled";
    }
    this.touch();
    return this;
  }
  expire() {
    this.status =
      "expired";
    if (
      !this.isRewardPaid()
    ) {
      this.rewardStatus =
        "cancelled";
    }
    this.touch();
    return this;
  }
  reject() {
    this.status =
      "rejected";
    if (
      !this.isRewardPaid()
    ) {
      this.rewardStatus =
        "cancelled";
    }
    this.touch();
    return this;
  }
  /**
   * Reward lifecycle.
   */
  markRewardEligible() {
    if (
      !this.isCompleted() &&
      !this.isQualified()
    ) {
      const error =
        new Error(
          "Referral must be qualified or completed before reward eligibility"
        );
      error.status = 409;
      error.code =
        "REFERRAL_NOT_ELIGIBLE";
      throw error;
    }
    this.rewardStatus =
      "eligible";
    this.touch();
    return this;
  }
  processReward() {
    if (
      !this.isRewardEligible()
    ) {
      const error =
        new Error(
          "Reward is not eligible for processing"
        );
      error.status = 409;
      error.code =
        "REWARD_NOT_ELIGIBLE";
      throw error;
    }
    this.rewardStatus =
      "processing";
    this.touch();
    return this;
  }
  markRewardPaid() {
    if (
      !this.isRewardProcessing() &&
      !this.isRewardEligible()
    ) {
      const error =
        new Error(
          "Reward cannot be marked as paid from the current state"
        );
      error.status = 409;
      error.code =
        "INVALID_REWARD_STATE";
      throw error;
    }
    this.rewardStatus =
      "paid";
    this.touch();
    return this;
  }
  markRewardFailed() {
    this.rewardStatus =
      "failed";
    this.touch();
    return this;
  }
  reverseReward() {
    if (
      !this.isRewardPaid()
    ) {
      const error =
        new Error(
          "Only a paid reward can be reversed"
        );
      error.status = 409;
      error.code =
        "REWARD_NOT_PAID";
      throw error;
    }
    this.rewardStatus =
      "reversed";
    this.touch();
    return this;
  }
  /**
   * Update reward amount safely.
   */
  setRewardAmount(
    amount
  ) {
    const value =
      Number(amount);
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      value > this.MAX_REWARD_AMOUNT
    ) {
      const error =
        new Error(
          "Invalid reward amount"
        );
      error.status = 422;
      error.code =
        "INVALID_REWARD_AMOUNT";
      throw error;
    }
    if (
      this.isRewardPaid()
    ) {
      const error =
        new Error(
          "Paid referral rewards cannot be changed"
        );
      error.status = 409;
      error.code =
        "REWARD_ALREADY_PAID";
      throw error;
    }
    this.rewardAmount =
      Math.round(
        value * 100
      ) / 100;
    this.touch();
    return this;
  }
  /**
   * Get reward amount as number.
   */
  getRewardAmount() {
    return Number(
      this.rewardAmount || 0
    );
  }
  /**
   * Get referral summary.
   */
  getSummary() {
    return {
      id:
        this.id ?? null,
      referrerId:
        this.referrerId ?? null,
      referredUserId:
        this.referredUserId ?? null,
      code:
        this.code ?? null,
      status:
        this.status ?? null,
      rewardAmount:
        this.getRewardAmount(),
      rewardStatus:
        this.rewardStatus ?? null,
      successful:
        this.isSuccessful(),
      rewardPayable:
        this.isRewardPayable()
    };
  }
  /**
   * Safe API representation.
   */
  toJSON() {
    return {
      id:
        this.id ?? null,
      referrerId:
        this.referrerId ?? null,
      referredUserId:
        this.referredUserId ?? null,
      code:
        this.code ?? null,
      status:
        this.status ?? null,
      rewardAmount:
        this.getRewardAmount(),
      rewardStatus:
        this.rewardStatus ?? null,
      isCompleted:
        this.isCompleted(),
      isRewardPaid:
        this.isRewardPaid(),
      isRewardPayable:
        this.isRewardPayable(),
      createdAt:
        this.createdAt,
      updatedAt:
        this.updatedAt
    };
  }
}
module.exports = Referral;

This gives the GHAR referral system a clear flow:

PENDING
   ↓
REGISTERED
   ↓
QUALIFIED
   ↓
COMPLETED
   ↓
REWARD ELIGIBLE
   ↓
PROCESSING
   ↓
PAID

With protected terminal/exception states:

CANCELLED
EXPIRED
REJECTED
FAILED
REVERSED

One important architectural point: the model should validate the referral, but the database should enforce uniqueness on the referral code and whatever business rule you choose for one referral per referred user.