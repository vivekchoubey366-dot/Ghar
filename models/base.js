"use strict";
/**
 * GHAR BaseModel
 *
 * Common foundation for all application models.
 *
 * Responsibilities:
 * - Safe data initialization
 * - createdAt / updatedAt timestamps
 * - model serialization
 * - validation helpers
 * - cloning
 * - updating model data
 * - dirty-field tracking
 * - safe error creation
 */
class BaseModel {
  /**
   * Create a model instance.
   *
   * @param {Object} data
   */
  constructor(data = {}) {
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      const error = new TypeError(
        "Model data must be an object"
      );
      error.code =
        "INVALID_MODEL_DATA";
      throw error;
    }
    /**
     * Copy supplied properties.
     */
    Object.assign(
      this,
      data
    );
    /**
     * Normalize timestamps.
     */
    this.createdAt =
      this.normalizeDate(
        this.createdAt
      ) || new Date();
    this.updatedAt =
      this.normalizeDate(
        this.updatedAt
      ) || new Date();
    /**
     * Internal original-state snapshot.
     *
     * Used for dirty-field detection.
     */
    this._originalData =
      this._snapshot();
  }
  /**
   * Normalize date values.
   *
   * Supports:
   * - Date
   * - date strings
   * - timestamps
   */
  static normalizeDate(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return null;
    }
    if (
      value instanceof Date
    ) {
      if (
        Number.isNaN(
          value.getTime()
        )
      ) {
        return null;
      }
      return new Date(
        value.getTime()
      );
    }
    const date =
      new Date(value);
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null;
    }
    return date;
  }
  normalizeDate(value) {
    return this.constructor.normalizeDate(
      value
    );
  }
  /**
   * Default validation.
   *
   * Child models override this.
   */
  static validate(data = {}) {
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return {
        valid: false,
        errors: [
          "Model data must be an object"
        ]
      };
    }
    return {
      valid: true,
      errors: []
    };
  }
  /**
   * Create model from raw data.
   */
  static from(data = {}) {
    const validation =
      this.validate(data);
    if (
      !validation.valid
    ) {
      const error =
        new Error(
          "Model validation failed"
        );
      error.status = 422;
      error.code =
        "MODEL_VALIDATION_ERROR";
      error.details =
        validation.errors;
      throw error;
    }
    return new this(data);
  }
  /**
   * Create a model without validation.
   *
   * Useful for trusted database records.
   */
  static fromDatabase(data = {}) {
    return new this(data);
  }
  /**
   * Return model name.
   */
  static get modelName() {
    return (
      this.entity ||
      this.name
    );
  }
  /**
   * Return instance model name.
   */
  get modelName() {
    return (
      this.constructor.entity ||
      this.constructor.name
    );
  }
  /**
   * Update model properties.
   *
   * Automatically updates updatedAt.
   *
   * @param {Object} data
   * @returns {BaseModel}
   */
  update(data = {}) {
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      const error =
        new TypeError(
          "Update data must be an object"
        );
      error.code =
        "INVALID_UPDATE_DATA";
      throw error;
    }
    /**
     * Never allow callers to directly replace
     * internal model state.
     */
    delete data._originalData;
    Object.assign(
      this,
      data
    );
    this.touch();
    return this;
  }
  /**
   * Update a single field.
   */
  set(
    field,
    value
  ) {
    if (
      typeof field !== "string" ||
      field.trim() === ""
    ) {
      throw new TypeError(
        "Model field must be a non-empty string"
      );
    }
    this[field] =
      value;
    this.touch();
    return this;
  }
  /**
   * Read a field.
   */
  get(
    field,
    defaultValue = undefined
  ) {
    if (
      !Object.prototype.hasOwnProperty.call(
        this,
        field
      )
    ) {
      return defaultValue;
    }
    return this[field];
  }
  /**
   * Check whether a field exists.
   */
  has(field) {
    return (
      Object.prototype.hasOwnProperty.call(
        this,
        field
      )
    );
  }
  /**
   * Update updatedAt timestamp.
   */
  touch() {
    this.updatedAt =
      new Date();
    return this;
  }
  /**
   * Mark the current state as persisted.
   *
   * Call this after INSERT/UPDATE succeeds.
   */
  markClean() {
    this._originalData =
      this._snapshot();
    return this;
  }
  /**
   * Get changed fields.
   */
  getChangedFields() {
    const changed = [];
    const current =
      this._snapshot();
    const original =
      this._originalData || {};
    const keys = new Set([
      ...Object.keys(
        original
      ),
      ...Object.keys(
        current
      )
    ]);
    for (
      const key of keys
    ) {
      if (
        key === "_originalData"
      ) {
        continue;
      }
      if (
        !this._isEqual(
          original[key],
          current[key]
        )
      ) {
        changed.push(
          key
        );
      }
    }
    return changed;
  }
  /**
   * Check whether model has changed.
   */
  isDirty() {
    return (
      this.getChangedFields()
        .length > 0
    );
  }
  /**
   * Check whether one field changed.
   */
  isFieldDirty(field) {
    return this
      .getChangedFields()
      .includes(field);
  }
  /**
   * Internal snapshot.
   */
  _snapshot() {
    const result = {};
    for (
      const key of Object.keys(this)
    ) {
      if (
        key === "_originalData"
      ) {
        continue;
      }
      result[key] =
        this._cloneValue(
          this[key]
        );
    }
    return result;
  }
  /**
   * Deep clone supported model values.
   */
  _cloneValue(value) {
    if (
      value instanceof Date
    ) {
      return new Date(
        value.getTime()
      );
    }
    if (
      Array.isArray(value)
    ) {
      return value.map(
        (item) =>
          this._cloneValue(
            item
          )
      );
    }
    if (
      value &&
      typeof value === "object"
    ) {
      const result = {};
      for (
        const [
          key,
          item
        ] of Object.entries(
          value
        )
      ) {
        result[key] =
          this._cloneValue(
            item
          );
      }
      return result;
    }
    return value;
  }
  /**
   * Deep equality helper.
   */
  _isEqual(
    first,
    second
  ) {
    if (
      first === second
    ) {
      return true;
    }
    if (
      first instanceof Date &&
      second instanceof Date
    ) {
      return (
        first.getTime() ===
        second.getTime()
      );
    }
    if (
      first === null ||
      second === null ||
      first === undefined ||
      second === undefined
    ) {
      return false;
    }
    if (
      typeof first !== "object" ||
      typeof second !== "object"
    ) {
      return false;
    }
    if (
      Array.isArray(first) !==
      Array.isArray(second)
    ) {
      return false;
    }
    const firstKeys =
      Object.keys(first);
    const secondKeys =
      Object.keys(second);
    if (
      firstKeys.length !==
      secondKeys.length
    ) {
      return false;
    }
    for (
      const key of firstKeys
    ) {
      if (
        !Object.prototype.hasOwnProperty.call(
          second,
          key
        )
      ) {
        return false;
      }
      if (
        !this._isEqual(
          first[key],
          second[key]
        )
      ) {
        return false;
      }
    }
    return true;
  }
  /**
   * Return plain object representation.
   *
   * Internal fields are excluded.
   */
  toObject() {
    const result = {};
    for (
      const key of Object.keys(this)
    ) {
      if (
        key === "_originalData"
      ) {
        continue;
      }
      result[key] =
        this._cloneValue(
          this[key]
        );
    }
    return result;
  }
  /**
   * JSON serialization.
   *
   * Child models can override this when necessary.
   */
  toJSON() {
    return this.toObject();
  }
  /**
   * Return database-ready representation.
   */
  toDatabase() {
    return this.toObject();
  }
  /**
   * Validate current model instance.
   */
  validate() {
    return this.constructor.validate(
      this.toObject()
    );
  }
  /**
   * Throw if model is invalid.
   */
  assertValid() {
    const result =
      this.validate();
    if (
      !result.valid
    ) {
      const error =
        new Error(
          "Model validation failed"
        );
      error.status = 422;
      error.code =
        "MODEL_VALIDATION_ERROR";
      error.details =
        result.errors;
      throw error;
    }
    return this;
  }
  /**
   * Check whether model has an ID.
   */
  isPersisted() {
    return (
      this.id !== undefined &&
      this.id !== null &&
      String(this.id).trim() !== ""
    );
  }
  /**
   * Convert to a plain cloned object.
   */
  cloneData() {
    return this.toObject();
  }
  /**
   * Clone the model itself.
   */
  clone() {
    return new this.constructor(
      this.cloneData()
    );
  }
  /**
   * Remove a field.
   */
  unset(field) {
    if (
      typeof field !== "string"
    ) {
      return this;
    }
    delete this[field];
    this.touch();
    return this;
  }
  /**
   * Return a selected set of fields.
   */
  pick(fields = []) {
    if (
      !Array.isArray(fields)
    ) {
      return {};
    }
    const result = {};
    for (
      const field of fields
    ) {
      if (
        typeof field !== "string"
      ) {
        continue;
      }
      if (
        Object.prototype.hasOwnProperty.call(
          this,
          field
        )
      ) {
        result[field] =
          this._cloneValue(
            this[field]
          );
      }
    }
    return result;
  }
  /**
   * Return all fields except supplied fields.
   */
  omit(fields = []) {
    const excluded =
      new Set(
        Array.isArray(fields)
          ? fields
          : []
      );
    const result = {};
    for (
      const key of Object.keys(this)
    ) {
      if (
        key === "_originalData" ||
        excluded.has(key)
      ) {
        continue;
      }
      result[key] =
        this._cloneValue(
          this[key]
        );
    }
    return result;
  }
  /**
   * Create a standardized model error.
   */
  static createError(
    message,
    status = 422,
    code = "MODEL_ERROR",
    details = []
  ) {
    const error =
      new Error(
        message
      );
    error.status =
      status;
    error.code =
      code;
    error.details =
      Array.isArray(details)
        ? details
        : [details];
    return error;
  }
  /**
   * Convert model to string.
   */
  toString() {
    const name =
      this.modelName;
    if (
      this.id !== undefined &&
      this.id !== null
    ) {
      return `${name}(${this.id})`;
    }
    return name;
  }
}
module.exports = BaseModel;

One important correction

With this upgraded base model, your child models can continue doing:

class Application extends BaseModel {
  // ...
}

and still use:

const application =
  Application.create(data);
application.update({
  status: "submitted"
});
application.isDirty();
application.getChangedFields();
application.toDatabase();
application.assertValid();

The most important addition for your GHAR architecture is getChangedFields() / isDirty(). That will be useful with your audit.middleware.js, because you can record exactly which fields changed rather than logging only "property updated" or "user updated".

Also, fromDatabase() deliberately skips validation. That is useful because database rows are already trusted at the model boundary, while from() validates external/application data.