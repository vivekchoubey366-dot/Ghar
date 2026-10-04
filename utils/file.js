const path = require('path');
const crypto = require('crypto');

const ALLOWED_EXTENSIONS = new Set(['.jpg','.jpeg','.png','.webp','.pdf','.doc','.docx','.txt']);

function safeFilename(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  const base = path.basename(filename || 'file', ext).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0,80);
  return `${base || 'file'}-${crypto.randomBytes(8).toString('hex')}${ext}`;
}

function validateExtension(filename, allowed = ALLOWED_EXTENSIONS) {
  return allowed.has(path.extname(filename || '').toLowerCase());
}

function validateSize(bytes, maxBytes = 10 * 1024 * 1024) {
  return Number(bytes) >= 0 && Number(bytes) <= maxBytes;
}

function extension(filename) { return path.extname(filename || '').toLowerCase(); }

module.exports = { safeFilename, validateExtension, validateSize, extension, ALLOWED_EXTENSIONS };
