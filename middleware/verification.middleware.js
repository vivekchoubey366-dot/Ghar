"use strict";

const LEVELS = Object.freeze({
  UNVERIFIED: 0,
  BASIC_VERIFIED: 1,
  OWNER_VERIFIED: 2,
  DOCUMENT_VERIFIED: 3,
  PROPERTY_VERIFIED: 4
});

function normalizeVerificationStatus(value) {
  if (!value) return "UNVERIFIED";
  const key = String(value).trim().toLowerCase();
  const aliases = {
    unverified: "UNVERIFIED",
    basic_verified: "BASIC_VERIFIED",
    "basic-verified": "BASIC_VERIFIED",
    owner_verified: "OWNER_VERIFIED",
    "owner-verified": "OWNER_VERIFIED",
    document_verified: "DOCUMENT_VERIFIED",
    "document-verified": "DOCUMENT_VERIFIED",
    property_verified: "PROPERTY_VERIFIED",
    "property-verified": "PROPERTY_VERIFIED"
  };
  return aliases[key] || String(value).trim().toUpperCase();
}

function getVerificationStatus(req) {
  return normalizeVerificationStatus(
    req.user?.verificationStatus ||
    req.user?.verification_status ||
    req.user?.verificationLevel ||
    req.user?.verification_level
  );
}

function hasVerificationLevel(req, requiredLevel) {
  const current = LEVELS[getVerificationStatus(req)] ?? 0;
  const required = LEVELS[normalizeVerificationStatus(requiredLevel)] ?? 0;
  return current >= required;
}

function requireVerification(requiredLevel = "BASIC_VERIFIED") {
  return (req, res, next) => {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required.",
          requestId: req.requestId || null
        }
      });
    }

    const required = normalizeVerificationStatus(requiredLevel);
    const current = getVerificationStatus(req);

    if (!hasVerificationLevel(req, required)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "VERIFICATION_REQUIRED",
          message: `Verification level ${required} is required.`,
          currentLevel: current,
          requiredLevel: required,
          requestId: req.requestId || null
        }
      });
    }

    req.verification = {
      status: current,
      level: LEVELS[current] ?? 0
    };

    next();
  };
}

module.exports = {
  LEVELS,
  normalizeVerificationStatus,
  getVerificationStatus,
  hasVerificationLevel,
  requireVerification
};
