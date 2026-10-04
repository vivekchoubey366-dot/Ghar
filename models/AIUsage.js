const BaseModel = require('./_base');

class AIUsage extends BaseModel {
  static entity = 'AIUsage';
  static fields = ["id", "userId", "module", "requestId", "inputTokens", "outputTokens", "latencyMs", "cost", "status"];

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

module.exports = AIUsage;
