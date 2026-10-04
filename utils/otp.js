const { randomToken } = require('./crypto');

function generateOTP(length = 6) {
  const max = 10 ** length;
  const min = 10 ** (length - 1);
  const value = parseInt(randomToken(8).replace(/\D/g,''), 10) || Math.floor(Math.random() * (max-min) + min);
  return String(value % max).padStart(length, '0');
}

function createOTP(options = {}) {
  const ttlMs = options.ttlMs || 5 * 60 * 1000;
  return { code: generateOTP(options.length || 6), expiresAt: new Date(Date.now()+ttlMs).toISOString(), attempts: 0 };
}

function isExpired(otp) { return !otp?.expiresAt || Date.now() >= new Date(otp.expiresAt).getTime(); }

module.exports = { generateOTP, createOTP, isExpired };
