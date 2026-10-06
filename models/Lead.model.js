"use strict";
const BaseModel = require("./_base");
class Lead extends BaseModel {
  static entity = "Lead";
  static fields = [
    "id",
    "propertyId",
    "buyerId",
    "sellerId",
    "source",
    "status",
    "score",
    "notes"
  ];
  /**
   * Lead lifecycle statuses.
   */
  static statuses = [
    "new",
    "contacted",
    "qualified",
    "interested",
    "negotiating",
    "converted",
    "lost",
    "closed"
  ];
  /**
   * Lead sources.
   */
  static sources = [
    "website",
    "mobile_app",
    "property_listing",
    "search",
    "favourite",
    "saved_search",
    "referral",
    "advertisement",
    "social_media",
    "whatsapp",
    "phone",
    "email",
    "agent",
    "admin",
    "direct",
    "other"
  ];
  static MIN_SCORE = 0;
  static MAX_SCORE = 100;
  static MAX_NOTES_LENGTH = 5000;
  /**
   * Validate lead data.
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
          "Lead data must be an object"
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
        String(data.propertyId).trim() === ""
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
        String(data.buyerId).trim() === ""
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
        String(data.sellerId).trim() === ""
      ) {
        errors.push(
          "sellerId cannot be empty"
        );
      }
    }
    /**
     * At least one party should be identified.
     */
    if (
      data.buyerId === undefined &&
      data.sellerId === undefined
    ) {
      errors.push(
        "buyerId or sellerId is required"
      );
    }
    /**
     * Source.
     */
    if (
      data.source !== undefined
    ) {
      if (
        typeof data.source !== "string"
      ) {
        errors.push(
          "source must be a string"
        );
      } else if (
        !this.sources.includes(
          data.source
        )
      ) {
        errors.push(
          `source must be one of: ${this.sources.join(", ")}`
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
     * Score.
     */
    if (
      data.score !== undefined
    ) {
      const score =
        Number(data.score);
      if (
        !Number.isFinite(score)
      ) {
        errors.push(
          "score must be a valid number"
        );
      } else if (
        score < this.MIN_SCORE ||
        score > this.MAX_SCORE
      ) {
        errors.push(
          `score must be between ${this.MIN_SCORE} and ${this.MAX_SCORE}`
        );
      }
    }
    /**
     * Notes.
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
    /**
     * Buyer and seller should not be the same user.
     */
    if (
      data.buyerId !== undefined &&
      data.sellerId !== undefined &&
      String(data.buyerId) ===
        String(data.sellerId)
    ) {
      errors.push(
        "buyerId and sellerId cannot be the same user"
      );
    }
    return {
      valid:
        errors.length === 0,
      errors
    };
  }
  /**
   * Create a Lead.
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
     * Normalize source.
     */
    if (
      typeof normalized.source ===
      "string"
    ) {
      normalized.source =
        normalized.source
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
    /**
     * Normalize score.
     */
    if (
      normalized.score !== undefined &&
      normalized.score !== null
    ) {
      const score =
        Number(
          normalized.score
        );
      if (
        Number.isFinite(score)
      ) {
        normalized.score =
          Math.round(score);
      }
    }
    /**
     * Defaults.
     */
    if (
      normalized.status === undefined
    ) {
      normalized.status =
        "new";
    }
    if (
      normalized.source === undefined
    ) {
      normalized.source =
        "other";
    }
    if (
      normalized.score === undefined
    ) {
      normalized.score = 0;
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
          "Lead validation failed"
        );
      error.status = 422;
      error.code =
        "LEAD_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Validate status.
   */
  static isValidStatus(
    status
  ) {
    return this.statuses.includes(
      status
    );
  }
  /**
   * Validate source.
   */
  static isValidSource(
    source
  ) {
    return this.sources.includes(
      source
    );
  }
  /**
   * Check buyer.
   */
  belongsToBuyer(
    buyerId
  ) {
    if (
      buyerId === undefined ||
      buyerId === null
    ) {
      return false;
    }
    return (
      String(this.buyerId) ===
      String(buyerId)
    );
  }
  /**
   * Check seller.
   */
  belongsToSeller(
    sellerId
  ) {
    if (
      sellerId === undefined ||
      sellerId === null
    ) {
      return false;
    }
    return (
      String(this.sellerId) ===
      String(sellerId)
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
   * Update lead score.
   */
  setScore(
    score
  ) {
    const numericScore =
      Number(score);
    if (
      !Number.isFinite(
        numericScore
      ) ||
      numericScore <
        this.constructor.MIN_SCORE ||
      numericScore >
        this.constructor.MAX_SCORE
    ) {
      const error =
        new Error(
          `score must be between ${this.constructor.MIN_SCORE} and ${this.constructor.MAX_SCORE}`
        );
      error.status = 422;
      error.code =
        "INVALID_LEAD_SCORE";
      throw error;
    }
    this.score =
      Math.round(
        numericScore
      );
    this.touch();
    return this;
  }
  /**
   * Increase score.
   */
  increaseScore(
    amount
  ) {
    const value =
      Number(amount);
    if (
      !Number.isFinite(value)
    ) {
      const error =
        new Error(
          "Score increment must be a valid number"
        );
      error.status = 422;
      error.code =
        "INVALID_SCORE_INCREMENT";
      throw error;
    }
    return this.setScore(
      Number(this.score || 0) +
        value
    );
  }
  /**
   * Mark lead as contacted.
   */
  contact() {
    this.transitionTo(
      "contacted"
    );
    return this;
  }
  /**
   * Qualify lead.
   */
  qualify() {
    this.transitionTo(
      "qualified"
    );
    return this;
  }
  /**
   * Mark buyer as interested.
   */
  markInterested() {
    this.transitionTo(
      "interested"
    );
    return this;
  }
  /**
   * Start negotiation.
   */
  negotiate() {
    this.transitionTo(
      "negotiating"
    );
    return this;
  }
  /**
   * Convert lead.
   */
  convert() {
    this.transitionTo(
      "converted"
    );
    return this;
  }
  /**
   * Mark lead lost.
   */
  markLost() {
    this.transitionTo(
      "lost"
    );
    return this;
  }
  /**
   * Close lead.
   */
  close() {
    this.transitionTo(
      "closed"
    );
    return this;
  }
  /**
   * Controlled status transition.
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
          `Invalid lead status: ${nextStatus}`
        );
      error.status = 422;
      error.code =
        "INVALID_LEAD_STATUS";
      throw error;
    }
    const current =
      this.status;
    const transitions = {
      new: [
        "contacted",
        "qualified",
        "interested",
        "lost",
        "closed"
      ],
      contacted: [
        "qualified",
        "interested",
        "negotiating",
        "lost",
        "closed"
      ],
      qualified: [
        "interested",
        "negotiating",
        "converted",
        "lost",
        "closed"
      ],
      interested: [
        "negotiating",
        "converted",
        "lost",
        "closed"
      ],
      negotiating: [
        "converted",
        "lost",
        "closed"
      ],
      converted: [
        "closed"
      ],
      lost: [
        "new",
        "closed"
      ],
      closed: []
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
          `Cannot transition lead from ${current} to ${nextStatus}`
        );
      error.status = 409;
      error.code =
        "INVALID_LEAD_TRANSITION";
      throw error;
    }
    this.status =
      nextStatus;
    this.touch();
    return this;
  }
  /**
   * Determine whether lead is active.
   */
  isActive() {
    return ![
      "converted",
      "lost",
      "closed"
    ].includes(
      this.status
    );
  }
  /**
   * Determine whether lead is qualified.
   */
  isQualified() {
    return [
      "qualified",
      "interested",
      "negotiating",
      "converted"
    ].includes(
      this.status
    );
  }
  /**
   * Determine whether lead is converted.
   */
  isConverted() {
    return (
      this.status ===
      "converted"
    );
  }
  /**
   * Determine whether lead is closed.
   */
  isClosed() {
    return (
      this.status ===
      "closed"
    );
  }
  /**
   * Return a deterministic relationship key.
   *
   * Useful for application/database duplicate
   * detection.
   */
  get relationshipKey() {
    return [
      this.propertyId ?? "",
      this.buyerId ?? "",
      this.sellerId ?? ""
    ].join(":");
  }
  /**
   * Static relationship key.
   */
  static relationshipKey(
    propertyId,
    buyerId,
    sellerId
  ) {
    return [
      propertyId ?? "",
      buyerId ?? "",
      sellerId ?? ""
    ].join(":");
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
      buyerId:
        this.buyerId ?? null,
      sellerId:
        this.sellerId ?? null,
      source:
        this.source,
      status:
        this.status,
      score:
        this.score,
      notes:
        this.notes ?? null,
      createdAt:
        this.createdAt,
      updatedAt:
        this.updatedAt
    };
  }
}
module.exports = Lead;

GHAR Lead flow

new
 │
 ▼
contacted
 │
 ▼
qualified
 │
 ▼
interested
 │
 ▼
negotiating
 ├──────────────► converted ──► closed
 │
 └──────────────► lost ────────► closed

The model also allows leads generated from website, mobile app, property listings, favourites, saved searches, referrals, advertisements, agents, WhatsApp, phone, email, and other GHAR acquisition channels, while keeping the controller responsible for persistence and business workflows.