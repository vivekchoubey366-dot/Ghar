const BaseModel = require('./_base');

class Referral extends BaseModel {
  static entity = 'Referral';
  static fields = ["id", "referrerId", "referredUserId", "code", "status", "rewardAmount", "rewardStatus"];

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

module.exports = Referral;
