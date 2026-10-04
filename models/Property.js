const BaseModel = require('./_base');

class Property extends BaseModel {
  static entity = 'Property';
  static fields = ["id", "sellerId", "title", "description", "propertyType", "listingType", "status", "price", "rent", "currency", "address", "city", "state", "pincode", "latitude", "longitude", "bedrooms", "bathrooms", "area", "verificationStatus"];

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

module.exports = Property;
