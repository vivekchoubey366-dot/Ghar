const crypto = require('crypto');

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(payload, secret, options = {}) {
  if (!secret) throw new Error('JWT secret is required');
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: payload.iat || now };
  if (options.expiresInSeconds) body.exp = now + options.expiresInSeconds;
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedBody = base64url(JSON.stringify(body));
  const input = `${encodedHeader}.${encodedBody}`;
  const signature = crypto.createHmac('sha256', secret).update(input).digest('base64url');
  return `${input}.${signature}`;
}

function verify(token, secret) {
  if (!secret) throw new Error('JWT secret is required');
  const parts = String(token).split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const [header, body, signature] = parts;
  const expected = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a,b)) throw new Error('Invalid signature');
  const payload = JSON.parse(Buffer.from(body,'base64url').toString('utf8'));
  if (payload.exp && Math.floor(Date.now()/1000) >= payload.exp) throw new Error('Token expired');
  return payload;
}

function decode(token) {
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;
  try { return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')); }
  catch { return null; }
}

module.exports = { sign, verify, decode };
