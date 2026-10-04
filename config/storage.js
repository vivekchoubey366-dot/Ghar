"use strict";

/**
 * ============================================================
 * GHAR - STORAGE CONFIGURATION
 * ============================================================
 *
 * Central storage configuration for:
 *
 * - Local filesystem
 * - AWS S3
 * - Cloudflare R2
 * - MinIO
 * - S3-compatible providers
 *
 * GHAR storage categories:
 *
 * property-images
 * property-videos
 * floor-plans
 * profile-images
 * documents
 * agreements
 * verification
 *
 * IMPORTANT:
 *
 * - Never expose storage credentials.
 * - Private files must not be publicly served.
 * - Documents must be accessed through authorization.
 * - Signed URLs should be short-lived.
 * - File paths must be protected against traversal.
 * - Storage configuration must work in development and production.
 */

const fs = require("fs");
const path = require("path");

const env = require("./env");

/* ============================================================
 * SUPPORTED PROVIDERS
 * ============================================================
 */

const SUPPORTED_PROVIDERS = Object.freeze([
  "local",
  "s3",
  "aws-s3",
  "r2",
  "minio"
]);

const provider = String(
  env.storage?.provider || "local"
)
  .trim()
  .toLowerCase();

/* ============================================================
 * STORAGE ROOT
 * ============================================================
 */

const uploadRoot = path.resolve(
  env.uploadDir ||
    path.join(process.cwd(), "uploads")
);

/* ============================================================
 * STORAGE PATHS
 * ============================================================
 */

const storagePaths = Object.freeze({
  propertyImages:
    process.env.PROPERTY_IMAGE_DIR ||
    "uploads/property-images",

  propertyVideos:
    process.env.PROPERTY_VIDEO_DIR ||
    "uploads/property-videos",

  floorPlans:
    process.env.FLOOR_PLAN_DIR ||
    "uploads/floor-plans",

  profileImages:
    process.env.PROFILE_IMAGE_DIR ||
    "uploads/profile-images",

  documents:
    process.env.DOCUMENT_DIR ||
    "uploads/documents",

  agreements:
    process.env.AGREEMENT_DIR ||
    "uploads/agreements",

  verification:
    process.env.VERIFICATION_DIR ||
    "uploads/verification"
});

/* ============================================================
 * NORMALIZE STORAGE DIRECTORY
 * ============================================================
 *
 * Local paths may be:
 *
 * uploads/documents
 *
 * while object-storage keys should be:
 *
 * documents
 *
 * This helper removes the configured local upload root.
 */

function normalizeStoragePrefix(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^uploads\//i, "")
    .replace(/\/+$/, "");
}

const storagePrefixes = Object.freeze({
  propertyImages: normalizeStoragePrefix(
    storagePaths.propertyImages
  ),

  propertyVideos: normalizeStoragePrefix(
    storagePaths.propertyVideos
  ),

  floorPlans: normalizeStoragePrefix(
    storagePaths.floorPlans
  ),

  profileImages: normalizeStoragePrefix(
    storagePaths.profileImages
  ),

  documents: normalizeStoragePrefix(
    storagePaths.documents
  ),

  agreements: normalizeStoragePrefix(
    storagePaths.agreements
  ),

  verification: normalizeStoragePrefix(
    storagePaths.verification
  )
});

/* ============================================================
 * ACCESS POLICY
 * ============================================================
 */

const access = Object.freeze({
  propertyImages:
    process.env.STORAGE_PROPERTY_IMAGES_ACCESS ||
    "public",

  propertyVideos:
    process.env.STORAGE_PROPERTY_VIDEOS_ACCESS ||
    "public",

  floorPlans:
    process.env.STORAGE_FLOOR_PLANS_ACCESS ||
    "private",

  profileImages:
    process.env.STORAGE_PROFILE_IMAGES_ACCESS ||
    "public",

  documents:
    process.env.STORAGE_DOCUMENTS_ACCESS ||
    "private",

  agreements:
    process.env.STORAGE_AGREEMENTS_ACCESS ||
    "private",

  verification:
    process.env.STORAGE_VERIFICATION_ACCESS ||
    "private"
});

/* ============================================================
 * STORAGE CONFIG
 * ============================================================
 */

const storageConfig = {
  /**
   * Active provider.
   */
  provider,

  /**
   * Provider enabled.
   */
  enabled:
    SUPPORTED_PROVIDERS.includes(provider),

  /**
   * Local filesystem.
   */
  local: {
    root: uploadRoot,

    publicPath:
      process.env.UPLOAD_PUBLIC_PATH ||
      "/uploads",

    createDirectories:
      process.env.STORAGE_CREATE_DIRECTORIES !==
      "false"
  },

  /**
   * S3-compatible storage.
   */
  s3: {
    bucket:
      env.storage?.bucket || "",

    region:
      env.storage?.region ||
      "ap-south-1",

    accessKey:
      env.storage?.accessKey || "",

    secretKey:
      env.storage?.secretKey || "",

    endpoint:
      process.env.STORAGE_ENDPOINT || "",

    publicUrl:
      process.env.STORAGE_PUBLIC_URL || "",

    forcePathStyle:
      process.env.STORAGE_FORCE_PATH_STYLE ===
      "true",

    useSSL:
      process.env.STORAGE_USE_SSL !==
      "false"
  },

  /**
   * Object storage settings.
   */
  objectStorage: {
    multipartEnabled:
      process.env.STORAGE_MULTIPART_ENABLED !==
      "false",

    multipartPartSize:
      Number(
        process.env.STORAGE_MULTIPART_PART_SIZE
      ) ||
      5 * 1024 * 1024,

    maxConcurrency:
      Number(
        process.env.STORAGE_MAX_CONCURRENCY
      ) || 3
  },

  /**
   * Storage prefixes.
   */
  paths: storagePrefixes,

  /**
   * File access policy.
   */
  access,

  /**
   * File naming policy.
   */
  files: {
    generateUniqueNames:
      process.env.STORAGE_UNIQUE_NAMES !==
      "false",

    preserveOriginalNames:
      process.env.STORAGE_PRESERVE_NAMES ===
      "true",

    overwriteExisting:
      process.env.STORAGE_ALLOW_OVERWRITE ===
      "true",

    sanitizeNames:
      process.env.STORAGE_SANITIZE_NAMES !==
      "false",

    useUUID:
      process.env.STORAGE_USE_UUID !==
      "false"
  },

  /**
   * Signed URL configuration.
   */
  signedUrls: {
    enabled:
      process.env.STORAGE_SIGNED_URLS !==
      "false",

    expiresIn:
      Number(
        process.env.STORAGE_SIGNED_URL_EXPIRY
      ) || 900,

    maxExpiresIn:
      Number(
        process.env.STORAGE_SIGNED_URL_MAX_EXPIRY
      ) || 3600
  },

  /**
   * File security.
   */
  security: {
    validateMimeType:
      process.env.STORAGE_VALIDATE_MIME !==
      "false",

    validateExtension:
      process.env.STORAGE_VALIDATE_EXTENSION !==
      "false",

    scanFiles:
      process.env.STORAGE_SCAN_FILES ===
      "true",

    rejectExecutables:
      process.env.STORAGE_REJECT_EXECUTABLES !==
      "false",

    rejectDoubleExtensions:
      process.env.STORAGE_REJECT_DOUBLE_EXTENSIONS !==
      "false",

    preventPathTraversal:
      process.env.STORAGE_PREVENT_PATH_TRAVERSAL !==
      "false",

    blockHiddenFiles:
      process.env.STORAGE_BLOCK_HIDDEN_FILES !==
      "false"
  },

  /**
   * Lifecycle management.
   */
  lifecycle: {
    softDelete:
      process.env.STORAGE_SOFT_DELETE !==
      "false",

    deleteOrphans:
      process.env.STORAGE_DELETE_ORPHANS ===
      "true",

    orphanRetentionDays:
      Number(
        process.env.STORAGE_ORPHAN_RETENTION_DAYS
      ) || 7
  },

  /**
   * Cache configuration.
   */
  cache: {
    enabled:
      process.env.STORAGE_CACHE_ENABLED !==
      "false",

    maxAge:
      Number(
        process.env.STORAGE_CACHE_MAX_AGE
      ) || 86400,

    immutable:
      process.env.STORAGE_CACHE_IMMUTABLE ===
      "true"
  },

  /**
   * Logging.
   */
  logging: {
    enabled:
      process.env.STORAGE_LOGGING !==
      "false",

    logUploads:
      process.env.STORAGE_LOG_UPLOADS !==
      "false",

    logDeletes:
      process.env.STORAGE_LOG_DELETES !==
      "false",

    logDownloads:
      process.env.STORAGE_LOG_DOWNLOADS ===
      "true",

    logFileNames:
      process.env.STORAGE_LOG_FILENAMES ===
      "true"
  }
};

/* ============================================================
 * CATEGORY HELPERS
 * ============================================================
 */

/**
 * Check whether a storage category exists.
 *
 * @param {string} category
 * @returns {boolean}
 */
function isValidCategory(category) {
  return Boolean(
    category &&
      Object.prototype.hasOwnProperty.call(
        storageConfig.paths,
        category
      )
  );
}

/**
 * Get object-storage prefix.
 *
 * @param {string} category
 * @returns {string|null}
 */
function getStoragePath(category) {
  if (!isValidCategory(category)) {
    return null;
  }

  return storageConfig.paths[category];
}

/**
 * Get local absolute directory.
 *
 * @param {string} category
 * @returns {string|null}
 */
function getLocalStoragePath(category) {
  if (!isValidCategory(category)) {
    return null;
  }

  const configuredPath =
    storagePaths[category];

  const normalized =
    String(configuredPath)
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

  return path.resolve(
    process.cwd(),
    normalized
  );
}

/**
 * Get access mode.
 *
 * @param {string} category
 * @returns {"public"|"private"}
 */
function getAccessMode(category) {
  if (!isValidCategory(category)) {
    return "private";
  }

  return access[category] === "public"
    ? "public"
    : "private";
}

/**
 * Check public category.
 *
 * @param {string} category
 * @returns {boolean}
 */
function isPublicCategory(category) {
  return (
    getAccessMode(category) ===
    "public"
  );
}

/**
 * Check private category.
 *
 * @param {string} category
 * @returns {boolean}
 */
function isPrivateCategory(category) {
  return (
    getAccessMode(category) ===
    "private"
  );
}

/* ============================================================
 * PROVIDER HELPERS
 * ============================================================
 */

/**
 * Local storage active.
 */
function isLocalStorage() {
  return provider === "local";
}

/**
 * Object storage active.
 */
function isObjectStorage() {
  return [
    "s3",
    "aws-s3",
    "r2",
    "minio"
  ].includes(provider);
}

/**
 * Check object storage credentials.
 */
function isS3Configured() {
  return Boolean(
    storageConfig.s3.bucket &&
      storageConfig.s3.accessKey &&
      storageConfig.s3.secretKey
  );
}

/**
 * Check whether storage is configured.
 */
function isStorageConfigured() {
  if (!storageConfig.enabled) {
    return false;
  }

  if (isLocalStorage()) {
    return Boolean(
      storageConfig.local.root
    );
  }

  if (isObjectStorage()) {
    return isS3Configured();
  }

  return false;
}

/* ============================================================
 * LOCAL DIRECTORY MANAGEMENT
 * ============================================================
 */

/**
 * Create all GHAR local storage directories.
 *
 * Safe to run repeatedly.
 */
function ensureLocalDirectories() {
  if (
    !isLocalStorage() ||
    !storageConfig.local.createDirectories
  ) {
    return;
  }

  for (const category of Object.keys(
    storageConfig.paths
  )) {
    const directory =
      getLocalStoragePath(category);

    if (!directory) {
      continue;
    }

    fs.mkdirSync(directory, {
      recursive: true
    });
  }
}

/* ============================================================
 * PATH SECURITY
 * ============================================================
 */

/**
 * Validate storage path.
 *
 * @param {string} value
 * @returns {boolean}
 */
function isSafePath(value) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return false;
  }

  const normalized =
    value.replace(/\\/g, "/");

  if (
    normalized.includes("\0") ||
    normalized.includes("../") ||
    normalized.includes("/..") ||
    normalized.startsWith("../") ||
    normalized.startsWith("/")
  ) {
    return false;
  }

  return true;
}

/**
 * Sanitize filename.
 *
 * @param {string} filename
 * @returns {string}
 */
function sanitizeFilename(filename) {
  if (
    typeof filename !== "string" ||
    !filename.trim()
  ) {
    return "";
  }

  let safeName =
    path.basename(filename);

  safeName = safeName
    .replace(
      /[<>:"/\\|?*\x00-\x1F]/g,
      "-"
    )
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .trim();

  if (
    storageConfig.security
      .rejectDoubleExtensions
  ) {
    const extensionCount =
      (safeName.match(/\./g) || [])
        .length;

    if (extensionCount > 1) {
      return "";
    }
  }

  return safeName;
}

/* ============================================================
 * OBJECT STORAGE KEY
 * ============================================================
 */

/**
 * Build a safe object-storage key.
 *
 * Example:
 *
 * property-images/abc123.webp
 *
 * @param {string} category
 * @param {string} filename
 * @returns {string|null}
 */
function buildObjectKey(
  category,
  filename
) {
  if (
    !isValidCategory(category) ||
    !filename
  ) {
    return null;
  }

  const safeFilename =
    sanitizeFilename(filename);

  if (!safeFilename) {
    return null;
  }

  return `${getStoragePath(
    category
  )}/${safeFilename}`;
}

/* ============================================================
 * PUBLIC URL
 * ============================================================
 */

/**
 * Generate a public URL.
 *
 * Only public categories are allowed.
 *
 * @param {string} category
 * @param {string} filename
 * @returns {string|null}
 */
function getPublicUrl(
  category,
  filename
) {
  if (
    !isValidCategory(category) ||
    !isPublicCategory(category)
  ) {
    return null;
  }

  const key =
    buildObjectKey(
      category,
      filename
    );

  if (!key) {
    return null;
  }

  if (isLocalStorage()) {
    return `${storageConfig.local.publicPath}/${key}`;
  }

  if (storageConfig.s3.publicUrl) {
    return `${storageConfig.s3.publicUrl.replace(
      /\/$/,
      ""
    )}/${key}`;
  }

  return null;
}

/* ============================================================
 * SIGNED URL SUPPORT
 * ============================================================
 */

/**
 * Check whether signed URLs can be generated.
 *
 * @param {string} category
 * @returns {boolean}
 */
function canGenerateSignedUrl(
  category
) {
  return Boolean(
    storageConfig.signedUrls.enabled &&
      isPrivateCategory(category) &&
      isObjectStorage() &&
      isS3Configured()
  );
}

/**
 * Get signed URL expiry.
 *
 * @param {number} requestedSeconds
 * @returns {number}
 */
function getSignedUrlExpiry(
  requestedSeconds
) {
  const requested =
    Number(requestedSeconds);

  if (
    !Number.isFinite(requested) ||
    requested <= 0
  ) {
    return storageConfig.signedUrls
      .expiresIn;
  }

  return Math.min(
    requested,
    storageConfig.signedUrls
      .maxExpiresIn
  );
}

/* ============================================================
 * CONFIGURATION VALIDATION
 * ============================================================
 */

/**
 * Validate storage configuration.
 *
 * Production fails fast.
 * Development returns diagnostic information.
 *
 * @returns {Object}
 */
function validateStorageConfig() {
  const errors = [];

  if (
    !SUPPORTED_PROVIDERS.includes(
      provider
    )
  ) {
    errors.push(
      `Unsupported STORAGE_PROVIDER: ${provider}`
    );
  }

  if (
    storageConfig.signedUrls
      .expiresIn <= 0
  ) {
    errors.push(
      "STORAGE_SIGNED_URL_EXPIRY must be greater than 0."
    );
  }

  if (
    storageConfig.signedUrls
      .expiresIn >
    storageConfig.signedUrls
      .maxExpiresIn
  ) {
    errors.push(
      "STORAGE_SIGNED_URL_EXPIRY cannot exceed STORAGE_SIGNED_URL_MAX_EXPIRY."
    );
  }

  if (
    isObjectStorage() &&
    !isS3Configured()
  ) {
    errors.push(
      "Object storage requires STORAGE_BUCKET, STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY."
    );
  }

  if (
    env.nodeEnv === "production" &&
    errors.length > 0
  ) {
    throw new Error(
      `Invalid GHAR storage configuration:\n- ${errors.join(
        "\n- "
      )}`
    );
  }

  return {
    valid:
      errors.length === 0,

    configured:
      isStorageConfigured(),

    provider,

    errors
  };
}

/* ============================================================
 * SAFE DIAGNOSTICS
 * ============================================================
 */

/**
 * Return safe storage configuration.
 *
 * NEVER returns:
 * - accessKey
 * - secretKey
 */
function getSafeStorageConfig() {
  return {
    enabled:
      storageConfig.enabled,

    configured:
      isStorageConfigured(),

    provider:
      storageConfig.provider,

    local: {
      root:
        storageConfig.local.root,

      publicPath:
        storageConfig.local.publicPath
    },

    objectStorage: {
      bucket:
        storageConfig.s3.bucket,

      region:
        storageConfig.s3.region,

      endpoint:
        storageConfig.s3.endpoint,

      publicUrl:
        storageConfig.s3.publicUrl,

      forcePathStyle:
        storageConfig.s3.forcePathStyle
    },

    paths:
      storageConfig.paths,

    access:
      storageConfig.access,

    signedUrls: {
      enabled:
        storageConfig.signedUrls.enabled,

      expiresIn:
        storageConfig.signedUrls.expiresIn,

      maxExpiresIn:
        storageConfig.signedUrls
          .maxExpiresIn
    },

    security: {
      validateMimeType:
        storageConfig.security
          .validateMimeType,

      validateExtension:
        storageConfig.security
          .validateExtension,

      scanFiles:
        storageConfig.security
          .scanFiles,

      rejectExecutables:
        storageConfig.security
          .rejectExecutables,

      rejectDoubleExtensions:
        storageConfig.security
          .rejectDoubleExtensions,

      preventPathTraversal:
        storageConfig.security
          .preventPathTraversal
    }
  };
}

/* ============================================================
 * STARTUP
 * ============================================================
 */

validateStorageConfig();

if (
  isLocalStorage() &&
  storageConfig.local
    .createDirectories
) {
  ensureLocalDirectories();
}

/* ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  storageConfig,

  SUPPORTED_PROVIDERS,

  isLocalStorage,
  isObjectStorage,
  isS3Configured,
  isStorageConfigured,

  isValidCategory,

  getStoragePath,
  getLocalStoragePath,

  getAccessMode,
  isPublicCategory,
  isPrivateCategory,

  ensureLocalDirectories,

  isSafePath,
  sanitizeFilename,
  buildObjectKey,

  getPublicUrl,

  canGenerateSignedUrl,
  getSignedUrlExpiry,

  validateStorageConfig,
  getSafeStorageConfig
};