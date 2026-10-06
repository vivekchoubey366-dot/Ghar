"use strict";

const BaseModel = require("./_base");

class Favourite extends BaseModel {
  static entity = "Favourite";

  static fields = [
    "id",
    "userId",
    "propertyId",
    "createdAt",
    "updatedAt"
  ];

  /**
   * Validate Favourite data.
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
          "Favourite data must be an object"
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
     * propertyId.
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
     * A favourite must identify both sides
     * of the relationship.
     */
    if (
      data.userId === undefined
    ) {
      errors.push(
        "userId is required"
      );
    }

    if (
      data.propertyId === undefined
    ) {
      errors.push(
        "propertyId is required"
      );
    }

    /**
     * createdAt.
     */
    if (
      data.createdAt !== undefined &&
      !this.normalizeDate(
        data.createdAt
      )
    ) {
      errors.push(
        "createdAt must be a valid date"
      );
    }

    /**
     * updatedAt.
     */
    if (
      data.updatedAt !== undefined &&
      !this.normalizeDate(
        data.updatedAt
      )
    ) {
      errors.push(
        "updatedAt must be a valid date"
      );
    }

    return {
      valid:
        errors.length === 0,

      errors
    };
  }

  /**
   * Create a Favourite.
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
     * Normalize timestamps if supplied.
     */
    if (
      normalized.createdAt !== undefined
    ) {
      normalized.createdAt =
        this.normalizeDate(
          normalized.createdAt
        );
    }

    if (
      normalized.updatedAt !== undefined
    ) {
      normalized.updatedAt =
        this.normalizeDate(
          normalized.updatedAt
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
          "Favourite validation failed"
        );

      error.status = 422;

      error.code =
        "FAVOURITE_VALIDATION_ERROR";

      error.details =
        check.errors;

      throw error;
    }

    return new this(
      normalized
    );
  }

  /**
   * Create a Favourite from a user/property pair.
   */
  static forProperty(
    userId,
    propertyId
  ) {
    return this.create({
      userId,
      propertyId
    });
  }

  /**
   * Compare a Favourite against a user/property pair.
   */
  matches(
    userId,
    propertyId
  ) {
    return (
      String(this.userId) ===
        String(userId) &&
      String(this.propertyId) ===
        String(propertyId)
    );
  }

  /**
   * Check whether this Favourite belongs
   * to a particular user.
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
   * Check whether this Favourite references
   * a particular property.
   */
  referencesProperty(
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
   * Generate a deterministic relationship key.
   *
   * Useful for enforcing application-level
   * uniqueness and database UNIQUE constraints.
   */
  get relationshipKey() {
    return [
      String(this.userId),
      String(this.propertyId)
    ].join(":");
  }

  /**
   * Static relationship key helper.
   */
  static relationshipKey(
    userId,
    propertyId
  ) {
    return [
      String(userId),
      String(propertyId)
    ].join(":");
  }

  /**
   * Check whether another Favourite represents
   * the same user/property relationship.
   */
  isDuplicateOf(
    favourite
  ) {
    if (
      !favourite ||
      typeof favourite !== "object"
    ) {
      return false;
    }

    return this.matches(
      favourite.userId,
      favourite.propertyId
    );
  }

  /**
   * Refresh updated timestamp.
   */
  touchFavourite() {
    this.touch();

    return this;
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
        this.propertyId,

      createdAt:
        this.createdAt,

      updatedAt:
        this.updatedAt
    };
  }
}

module.exports = Favourite;