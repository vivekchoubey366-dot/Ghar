class BaseModel {
  constructor(data = {}) {
    Object.assign(this, data);
    if (!this.createdAt) this.createdAt = new Date();
    this.updatedAt = new Date();
  }
  toJSON() { return { ...this }; }
  static validate(data) { return { valid: true, errors: [] }; }
  static from(data) { return new this(data); }
}
module.exports = BaseModel;
