"use strict";
const BaseModel = require("./_base");
class Property extends BaseModel {
  static entity = "Property";
  static fields = [
    "id",
    "sellerId",
    "title",
    "description",
    "propertyType",
    "listingType",
    "status",
    "price",
    "rent",
    "currency",
    "address",
    "city",
    "state",
    "pincode",
    "latitude",
    "longitude",
    "bedrooms",
    "bathrooms",
    "area",
    "verificationStatus"
  ];
  /**
   * Property categories.
   */
  static propertyTypes = [
    "apartment",
    "flat",
    "villa",
    "house",
    "independent_house",
    "builder_floor",
    "penthouse",
    "studio",
    "plot",
    "land",
    "commercial",
    "office",
    "shop",
    "warehouse",
    "industrial",
    "farmhouse",
    "agricultural_land",
    "other"
  ];
  /**
   * Listing types.
   */
  static listingTypes = [
    "sale",
    "rent",
    "lease",
    "pg",
    "commercial_sale",
    "commercial_rent"
  ];
  /**
   * Property lifecycle.
   */
  static statuses = [
    "draft",
    "pending",
    "active",
    "published",
    "under_offer",
    "sold",
    "rented",
    "leased",
    "withdrawn",
    "expired",
    "rejected",
    "archived"
  ];
  /**
   * Verification lifecycle.
   */
  static verificationStatuses = [
    "pending",
    "submitted",
    "under_review",
    "verified",
    "rejected",
    "expired"
  ];
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
  static MAX_TITLE_LENGTH = 255;
  static MAX_DESCRIPTION_LENGTH = 10000;
  static MAX_PRICE = 1000000000000;
  static MAX_AREA = 100000000;
  /**
   * Validate property.
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
          "Property data must be an object"
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
     * Title.
     */
    if (
      data.title !== undefined
    ) {
      if (
        typeof data.title !== "string"
      ) {
        errors.push(
          "title must be a string"
        );
      } else if (
        data.title.trim().length === 0
      ) {
        errors.push(
          "title cannot be empty"
        );
      } else if (
        data.title.length >
        this.MAX_TITLE_LENGTH
      ) {
        errors.push(
          `title cannot exceed ${this.MAX_TITLE_LENGTH} characters`
        );
      }
    }
    /**
     * Description.
     */
    if (
      data.description !== undefined
    ) {
      if (
        typeof data.description !==
        "string"
      ) {
        errors.push(
          "description must be a string"
        );
      } else if (
        data.description.length >
        this.MAX_DESCRIPTION_LENGTH
      ) {
        errors.push(
          `description cannot exceed ${this.MAX_DESCRIPTION_LENGTH} characters`
        );
      }
    }
    /**
     * Property type.
     */
    if (
      data.propertyType !== undefined
    ) {
      if (
        typeof data.propertyType !==
        "string"
      ) {
        errors.push(
          "propertyType must be a string"
        );
      } else if (
        !this.propertyTypes.includes(
          data.propertyType
        )
      ) {
        errors.push(
          `propertyType must be one of: ${this.propertyTypes.join(", ")}`
        );
      }
    }
    /**
     * Listing type.
     */
    if (
      data.listingType !== undefined
    ) {
      if (
        typeof data.listingType !==
        "string"
      ) {
        errors.push(
          "listingType must be a string"
        );
      } else if (
        !this.listingTypes.includes(
          data.listingType
        )
      ) {
        errors.push(
          `listingType must be one of: ${this.listingTypes.join(", ")}`
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
     * Verification.
     */
    if (
      data.verificationStatus !==
      undefined
    ) {
      if (
        !this.verificationStatuses.includes(
          data.verificationStatus
        )
      ) {
        errors.push(
          `verificationStatus must be one of: ${this.verificationStatuses.join(", ")}`
        );
      }
    }
    /**
     * Price.
     */
    if (
      data.price !== undefined
    ) {
      const price =
        Number(data.price);
      if (
        !Number.isFinite(price)
      ) {
        errors.push(
          "price must be a valid number"
        );
      } else if (
        price < 0 ||
        price > this.MAX_PRICE
      ) {
        errors.push(
          `price must be between 0 and ${this.MAX_PRICE}`
        );
      }
    }
    /**
     * Rent.
     */
    if (
      data.rent !== undefined
    ) {
      const rent =
        Number(data.rent);
      if (
        !Number.isFinite(rent)
      ) {
        errors.push(
          "rent must be a valid number"
        );
      } else if (
        rent < 0 ||
        rent > this.MAX_PRICE
      ) {
        errors.push(
          `rent must be between 0 and ${this.MAX_PRICE}`
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
        typeof data.currency !==
        "string"
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
     * Address.
     */
    if (
      data.address !== undefined
    ) {
      if (
        typeof data.address !== "string"
      ) {
        errors.push(
          "address must be a string"
        );
      } else if (
        data.address.trim().length === 0
      ) {
        errors.push(
          "address cannot be empty"
        );
      }
    }
    /**
     * City.
     */
    if (
      data.city !== undefined
    ) {
      if (
        typeof data.city !== "string"
      ) {
        errors.push(
          "city must be a string"
        );
      } else if (
        data.city.trim().length === 0
      ) {
        errors.push(
          "city cannot be empty"
        );
      }
    }
    /**
     * State.
     */
    if (
      data.state !== undefined
    ) {
      if (
        typeof data.state !== "string"
      ) {
        errors.push(
          "state must be a string"
        );
      } else if (
        data.state.trim().length === 0
      ) {
        errors.push(
          "state cannot be empty"
        );
      }
    }
    /**
     * Indian pincode.
     */
    if (
      data.pincode !== undefined
    ) {
      if (
        !/^[0-9]{6}$/.test(
          String(data.pincode)
        )
      ) {
        errors.push(
          "pincode must be a valid 6-digit pincode"
        );
      }
    }
    /**
     * Latitude.
     */
    if (
      data.latitude !== undefined
    ) {
      const latitude =
        Number(data.latitude);
      if (
        !Number.isFinite(
          latitude
        ) ||
        latitude < -90 ||
        latitude > 90
      ) {
        errors.push(
          "latitude must be between -90 and 90"
        );
      }
    }
    /**
     * Longitude.
     */
    if (
      data.longitude !== undefined
    ) {
      const longitude =
        Number(data.longitude);
      if (
        !Number.isFinite(
          longitude
        ) ||
        longitude < -180 ||
        longitude > 180
      ) {
        errors.push(
          "longitude must be between -180 and 180"
        );
      }
    }
    /**
     * Bedrooms.
     */
    if (
      data.bedrooms !== undefined
    ) {
      const bedrooms =
        Number(data.bedrooms);
      if (
        !Number.isInteger(
          bedrooms
        ) ||
        bedrooms < 0 ||
        bedrooms > 100
      ) {
        errors.push(
          "bedrooms must be an integer between 0 and 100"
        );
      }
    }
    /**
     * Bathrooms.
     */
    if (
      data.bathrooms !== undefined
    ) {
      const bathrooms =
        Number(data.bathrooms);
      if (
        !Number.isFinite(
          bathrooms
        ) ||
        bathrooms < 0 ||
        bathrooms > 100
      ) {
        errors.push(
          "bathrooms must be between 0 and 100"
        );
      }
    }
    /**
     * Area.
     */
    if (
      data.area !== undefined
    ) {
      const area =
        Number(data.area);
      if (
        !Number.isFinite(area) ||
        area <= 0 ||
        area > this.MAX_AREA
      ) {
        errors.push(
          `area must be greater than 0 and less than ${this.MAX_AREA}`
        );
      }
    }
    /**
     * Coordinate pairing.
     */
    if (
      (data.latitude !== undefined &&
        data.longitude === undefined) ||
      (data.latitude === undefined &&
        data.longitude !== undefined)
    ) {
      errors.push(
        "latitude and longitude must be provided together"
      );
    }
    return {
      valid:
        errors.length === 0,
      errors
    };
  }
  /**
   * Create property.
   */
  static create(data = {}) {
    const normalized = {
      ...data
    };
    /**
     * Normalize IDs.
     */
    if (
      normalized.sellerId !== undefined &&
      normalized.sellerId !== null
    ) {
      normalized.sellerId =
        String(
          normalized.sellerId
        ).trim();
    }
    /**
     * Normalize text.
     */
    for (
      const field of [
        "title",
        "description",
        "address",
        "city",
        "state",
        "pincode"
      ]
    ) {
      if (
        typeof normalized[field] ===
        "string"
      ) {
        normalized[field] =
          normalized[field].trim();
      }
    }
    /**
     * Normalize enums.
     */
    for (
      const field of [
        "propertyType",
        "listingType",
        "status",
        "verificationStatus"
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
     * Normalize numeric fields.
     */
    for (
      const field of [
        "price",
        "rent",
        "latitude",
        "longitude",
        "bedrooms",
        "bathrooms",
        "area"
      ]
    ) {
      if (
        normalized[field] !== undefined &&
        normalized[field] !== null &&
        normalized[field] !== ""
      ) {
        const number =
          Number(
            normalized[field]
          );
        if (
          Number.isFinite(number)
        ) {
          normalized[field] =
            field === "price" ||
            field === "rent"
              ? Math.round(
                  number * 100
                ) / 100
              : number;
        }
      }
    }
    /**
     * Defaults.
     */
    if (
      normalized.currency === undefined
    ) {
      normalized.currency =
        "INR";
    }
    if (
      normalized.status === undefined
    ) {
      normalized.status =
        "draft";
    }
    if (
      normalized.verificationStatus ===
      undefined
    ) {
      normalized.verificationStatus =
        "pending";
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
          "Property validation failed"
        );
      error.status = 422;
      error.code =
        "PROPERTY_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Ownership.
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
   * Status helpers.
   */
  isDraft() {
    return (
      this.status === "draft"
    );
  }
  isActive() {
    return [
      "active",
      "published"
    ].includes(
      this.status
    );
  }
  isPublished() {
    return (
      this.status === "published"
    );
  }
  isAvailable() {
    return [
      "active",
      "published"
    ].includes(
      this.status
    );
  }
  isSold() {
    return (
      this.status === "sold"
    );
  }
  isRented() {
    return [
      "rented",
      "leased"
    ].includes(
      this.status
    );
  }
  isArchived() {
    return (
      this.status === "archived"
    );
  }
  /**
   * Verification helpers.
   */
  isVerified() {
    return (
      this.verificationStatus ===
      "verified"
    );
  }
  isVerificationPending() {
    return [
      "pending",
      "submitted",
      "under_review"
    ].includes(
      this.verificationStatus
    );
  }
  isVerificationRejected() {
    return (
      this.verificationStatus ===
      "rejected"
    );
  }
  /**
   * Listing helpers.
   */
  isForSale() {
    return [
      "sale",
      "commercial_sale"
    ].includes(
      this.listingType
    );
  }
  isForRent() {
    return [
      "rent",
      "commercial_rent",
      "lease",
      "pg"
    ].includes(
      this.listingType
    );
  }
  isCommercial() {
    return [
      "commercial",
      "commercial_sale",
      "commercial_rent"
    ].includes(
      this.propertyType
    ) ||
      [
        "commercial_sale",
        "commercial_rent"
      ].includes(
        this.listingType
      );
  }
  /**
   * Property lifecycle.
   */
  publish() {
    if (
      !this.isVerified()
    ) {
      const error =
        new Error(
          "Property must be verified before publishing"
        );
      error.status = 409;
      error.code =
        "PROPERTY_NOT_VERIFIED";
      throw error;
    }
    this.status =
      "published";
    this.touch();
    return this;
  }
  activate() {
    this.status =
      "active";
    this.touch();
    return this;
  }
  withdraw() {
    this.status =
      "withdrawn";
    this.touch();
    return this;
  }
  markSold() {
    this.status =
      "sold";
    this.touch();
    return this;
  }
  markRented() {
    this.status =
      "rented";
    this.touch();
    return this;
  }
  archive() {
    this.status =
      "archived";
    this.touch();
    return this;
  }
  /**
   * Verification lifecycle.
   */
  submitForVerification() {
    this.verificationStatus =
      "submitted";
    this.touch();
    return this;
  }
  startVerification() {
    this.verificationStatus =
      "under_review";
    this.touch();
    return this;
  }
  verify() {
    this.verificationStatus =
      "verified";
    this.touch();
    return this;
  }
  rejectVerification() {
    this.verificationStatus =
      "rejected";
    this.touch();
    return this;
  }
  /**
   * Price helper.
   */
  getDisplayPrice() {
    const amount =
      this.isForRent()
        ? this.rent
        : this.price;
    if (
      amount === undefined ||
      amount === null
    ) {
      return null;
    }
    try {
      return new Intl.NumberFormat(
        "en-IN",
        {
          style: "currency",
          currency:
            this.currency ||
            "INR",
          maximumFractionDigits: 2
        }
      ).format(
        Number(amount)
      );
    } catch {
      return `${this.currency || "INR"} ${amount}`;
    }
  }
  /**
   * Get coordinates.
   */
  getCoordinates() {
    if (
      this.latitude === undefined ||
      this.longitude === undefined
    ) {
      return null;
    }
    return {
      latitude:
        Number(this.latitude),
      longitude:
        Number(this.longitude)
    };
  }
  /**
   * Check whether coordinates exist.
   */
  hasCoordinates() {
    return Boolean(
      this.getCoordinates()
    );
  }
  /**
   * Get location.
   */
  getLocation() {
    return {
      address:
        this.address ?? null,
      city:
        this.city ?? null,
      state:
        this.state ?? null,
      pincode:
        this.pincode ?? null,
      latitude:
        this.latitude ?? null,
      longitude:
        this.longitude ?? null
    };
  }
  /**
   * Get property summary.
   */
  getSummary() {
    return {
      id:
        this.id ?? null,
      sellerId:
        this.sellerId,
      title:
        this.title,
      propertyType:
        this.propertyType,
      listingType:
        this.listingType,
      status:
        this.status,
      price:
        this.price ?? null,
      rent:
        this.rent ?? null,
      currency:
        this.currency,
      city:
        this.city ?? null,
      state:
        this.state ?? null,
      bedrooms:
        this.bedrooms ?? null,
      bathrooms:
        this.bathrooms ?? null,
      area:
        this.area ?? null,
      verified:
        this.isVerified(),
      available:
        this.isAvailable()
    };
  }
  /**
   * Safe API representation.
   */
  toJSON() {
    return {
      id:
        this.id ?? null,
      sellerId:
        this.sellerId,
      title:
        this.title,
      description:
        this.description ?? null,
      propertyType:
        this.propertyType,
      listingType:
        this.listingType,
      status:
        this.status,
      price:
        this.price ?? null,
      rent:
        this.rent ?? null,
      currency:
        this.currency,
      address:
        this.address ?? null,
      city:
        this.city ?? null,
      state:
        this.state ?? null,
      pincode:
        this.pincode ?? null,
      latitude:
        this.latitude ?? null,
      longitude:
        this.longitude ?? null,
      bedrooms:
        this.bedrooms ?? null,
      bathrooms:
        this.bathrooms ?? null,
      area:
        this.area ?? null,
      verificationStatus:
        this.verificationStatus,
      isVerified:
        this.isVerified(),
      isAvailable:
        this.isAvailable(),
      isForSale:
        this.isForSale(),
      isForRent:
        this.isForRent(),
      isCommercial:
        this.isCommercial(),
      createdAt:
        this.createdAt,
      updatedAt:
        this.updatedAt
    };
  }
}
module.exports = Property;

This keeps your existing 22 database/model fields intact while adding GHAR-specific validation and lifecycle behavior.