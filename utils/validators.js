function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function required(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value) {
  return typeof value === 'string' && /^\+?[1-9]\d{7,14}$/.test(value.replace(/[\s()-]/g, ''));
}

function isStrongPassword(value) {
  return typeof value === 'string' &&
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value);
}

function validate(data = {}, rules = {}) {
  const errors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    if (rule.required && !required(value)) errors[field] = 'Required';
    if (value !== undefined && rule.type === 'email' && !isEmail(value)) errors[field] = 'Invalid email';
    if (value !== undefined && rule.type === 'phone' && !isPhone(value)) errors[field] = 'Invalid phone';
    if (value !== undefined && rule.minLength && String(value).length < rule.minLength)
      errors[field] = `Minimum length is ${rule.minLength}`;
    if (value !== undefined && rule.maxLength && String(value).length > rule.maxLength)
      errors[field] = `Maximum length is ${rule.maxLength}`;
    if (value !== undefined && rule.enum && !rule.enum.includes(value))
      errors[field] = 'Invalid value';
    if (value !== undefined && rule.custom && !rule.custom(value, data))
      errors[field] = rule.message || 'Invalid value';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

function assertValid(data, rules) {
  const result = validate(data, rules);
  if (!result.valid) {
    const { ValidationError } = require('./errors');
    throw new ValidationError('Validation failed', result.errors);
  }
  return data;
}

module.exports = { isObject, required, isEmail, isPhone, isStrongPassword, validate, assertValid };
