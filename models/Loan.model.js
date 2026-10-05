const BaseModel = require('./_base');

class Loan extends BaseModel {
  static entity = 'Loan';
  static fields = ["id", "userId", "propertyId", "lender", "amount", "interestRate", "tenureMonths", "status"];

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

module.exports = Loan;
