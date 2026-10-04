const crypto = require('crypto');

const ITERATIONS = 210000;
const KEYLEN = 32;
const DIGEST = 'sha256';

function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8)
    throw new Error('Password must contain at least 8 characters');
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('base64url');
  return `pbkdf2$${DIGEST}$${ITERATIONS}$${salt}$${hash}`;
}

function verifyPassword(password, encoded) {
  try {
    const [scheme, digest, iterations, salt, stored] = String(encoded).split('$');
    if (scheme !== 'pbkdf2') return false;
    const derived = crypto.pbkdf2Sync(password, salt, Number(iterations), KEYLEN, digest).toString('base64url');
    return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(stored));
  } catch { return false; }
}

module.exports = { hashPassword, verifyPassword };
