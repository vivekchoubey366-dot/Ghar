const crypto = require('crypto');

function randomBytes(size = 32) {
  return crypto.randomBytes(size);
}

function randomHex(size = 32) {
  return randomBytes(size).toString('hex');
}

function randomToken(size = 32) {
  return randomBytes(size).toString('base64url');
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function hmacSha256(value, secret) {
  return crypto.createHmac('sha256', secret).update(String(value)).digest('hex');
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function encrypt(text, secret) {
  const key = crypto.createHash('sha256').update(String(secret)).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decrypt(payload, secret) {
  const [ivRaw, tagRaw, dataRaw] = String(payload).split('.');
  if (!ivRaw || !tagRaw || !dataRaw) throw new Error('Invalid encrypted payload');
  const key = crypto.createHash('sha256').update(String(secret)).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ivRaw,'base64url'), key);
  decipher.setAuthTag(Buffer.from(tagRaw,'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataRaw,'base64url')), decipher.final()
  ]).toString('utf8');
}

module.exports = { randomBytes, randomHex, randomToken, sha256, hmacSha256, timingSafeEqual, encrypt, decrypt };
