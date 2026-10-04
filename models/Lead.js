const BaseModel = require('./_base');

class Lead extends BaseModel {
  static entity = 'Lead';
  static fields = ["id", "propertyId", "buyerId", "sellerId", "source", "status", "score", "notes"];

  static validate(data = {}) {
    const errors = [];
    for (const field of this.fields) {
      if (data[field] !== undefined && data[field] === null) errors.push(`${field} cannot be null`);
    }
    return { valid: errors.length === 0, errors };
  }

  static create(data = {}) {
    const check = this.validate(data);
    if (!check.valid) { const e = new Error('Validation failed'); e.status = 422; e.details = check.errors; throw e; }
    return new this(data);
  }
}

module.exports = Lead;
