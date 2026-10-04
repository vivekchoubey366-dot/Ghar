const LEVELS = ['UNVERIFIED','BASIC_VERIFIED','OWNER_VERIFIED','DOCUMENT_VERIFIED','PROPERTY_VERIFIED'];
const ORDER = Object.fromEntries(LEVELS.map((v,i)=>[v,i]));

function normalizeLevel(level) {
  return LEVELS.includes(level) ? level : LEVELS[0];
}

function hasReached(current, required) {
  return ORDER[normalizeLevel(current)] >= ORDER[normalizeLevel(required)];
}

function nextLevel(current) {
  const index = ORDER[normalizeLevel(current)];
  return LEVELS[Math.min(index + 1, LEVELS.length - 1)];
}

function canPublishProperty(level) {
  return hasReached(level, 'OWNER_VERIFIED');
}

function canMarkPropertyVerified(level) {
  return hasReached(level, 'DOCUMENT_VERIFIED');
}

module.exports = { LEVELS, normalizeLevel, hasReached, nextLevel, canPublishProperty, canMarkPropertyVerified };
