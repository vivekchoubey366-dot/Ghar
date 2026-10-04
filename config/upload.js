"use strict";

/**
 * ============================================================
 * GHAR
 * Upload Configuration
 * ============================================================
 *
 * Central configuration for all GHAR file uploads.
 *
 * Handles:
 * - Property images
 * - Property videos
 * - Floor plans
 * - Profile images
 * - Documents
 * - Agreements
 * - Verification files
 *
 * Security principles:
 * - Never trust client-provided filenames.
 * - Never trust client-provided MIME types alone.
 * - Restrict extensions and MIME types.
 * - Restrict file sizes.
 * - Keep private documents outside public/static directories.
 * - Generate server-side filenames.
 * - Prevent executable uploads.
 * ============================================================
 */

const path = require("path");
const fs = require("fs");
const env = require("./env");

/* ============================================================
 * ROOT DIRECTORIES
 * ============================================================
 */

const rootUploadDir = path.resolve(
  process.cwd(),
  process.env.UPLOAD_DIR || "uploads"
);

const directories = {
  root: rootUploadDir,

  propertyImages: path.resolve(
    process.cwd(),
    process.env.PROPERTY_IMAGE_DIR ||
      "uploads/property-images"
  ),

  propertyVideos: path.resolve(
    process.cwd(),
    process.env.PROPERTY_VIDEO_DIR ||
      "uploads/property-videos"
  ),

  floorPlans: path.resolve(
    process.cwd(),
    process.env.FLOOR_PLAN_DIR ||
      "uploads/floor-plans"
  ),

  profileImages: path.resolve(
    process.cwd(),
    process.env.PROFILE_IMAGE_DIR ||
      "uploads/profile-images"
  ),

  documents: path.resolve(
    process.cwd(),
    process.env.DOCUMENT_DIR ||
      "uploads/documents"
  ),

  agreements: path.resolve(
    process.cwd(),
    process.env.AGREEMENT_DIR ||
      "uploads/agreements"
  ),

  verification: path.resolve(
    process.cwd(),
    process.env.VERIFICATION_DIR ||
      "uploads/verification"
  )
};

/* ============================================================
 * FILE SIZE LIMITS
 * ============================================================
 *
 * Values are bytes.
 */

const MB = 1024 * 1024;

const limits = {
  default:
    Number(process.env.UPLOAD_MAX_SIZE) ||
    10 * MB,

  propertyImage:
    Number(process.env.PROPERTY_IMAGE_MAX_SIZE) ||
    10 * MB,

  propertyVideo:
    Number(process.env.PROPERTY_VIDEO_MAX_SIZE) ||
    100 * MB,

  floorPlan:
    Number(process.env.FLOOR_PLAN_MAX_SIZE) ||
    20 * MB,

  profileImage:
    Number(process.env.PROFILE_IMAGE_MAX_SIZE) ||
    5 * MB,

  document:
    Number(process.env.DOCUMENT_MAX_SIZE) ||
    20 * MB,

  agreement:
    Number(process.env.AGREEMENT_MAX_SIZE) ||
    20 * MB,

  verification:
    Number(process.env.VERIFICATION_MAX_SIZE) ||
    20 * MB
};

/* ============================================================
 * MIME TYPES
 * ============================================================
 */

const mimeTypes = {
  image: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif"
  ],

  video: [
    "video/mp4",
    "video/webm"
  ],

  document: [
    "application/pdf"
  ]
};

/* ============================================================
 * EXTENSIONS
 * ============================================================
 */

const extensions = {
  image: [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".avif"
  ],

  video: [
    ".mp4",
    ".webm"
  ],

  document: [
    ".pdf"
  ]
};

/* ============================================================
 * UPLOAD TYPES
 * ============================================================
 */

const uploadTypes = {
  propertyImages: {
    directory: directories.propertyImages,

    mimeTypes: mimeTypes.image,

    extensions: extensions.image,

    maxSize:
      limits.propertyImage,

    maxFiles:
      Number(
        process.env.PROPERTY_IMAGE_MAX_FILES
      ) || 30
  },

  propertyVideos: {
    directory: directories.propertyVideos,

    mimeTypes: mimeTypes.video,

    extensions: extensions.video,

    maxSize:
      limits.propertyVideo,

    maxFiles:
      Number(
        process.env.PROPERTY_VIDEO_MAX_FILES
      ) || 5
  },

  floorPlans: {
    directory: directories.floorPlans,

    mimeTypes: [
      "application/pdf",
      ...mimeTypes.image
    ],

    extensions: [
      ".pdf",
      ...extensions.image
    ],

    maxSize:
      limits.floorPlan,

    maxFiles:
      Number(
        process.env.FLOOR_PLAN_MAX_FILES
      ) || 10
  },

  profileImages: {
    directory: directories.profileImages,

    mimeTypes: mimeTypes.image,

    extensions: extensions.image,

    maxSize:
      limits.profileImage,

    maxFiles: 1
  },

  documents: {
    directory: directories.documents,

    mimeTypes: mimeTypes.document,

    extensions: extensions.document,

    maxSize:
      limits.document,

    maxFiles:
      Number(
        process.env.DOCUMENT_MAX_FILES
      ) || 10
  },

  agreements: {
    directory: directories.agreements,

    mimeTypes: [
      "application/pdf"
    ],

    extensions: [
      ".pdf"
    ],

    maxSize:
      limits.agreement,

    maxFiles:
      Number(
        process.env.AGREEMENT_MAX_FILES
      ) || 5
  },

  verification: {
    directory: directories.verification,

    mimeTypes: [
      "application/pdf",
      ...mimeTypes.image
    ],

    extensions: [
      ".pdf",
      ...extensions.image
    ],

    maxSize:
      limits.verification,

    maxFiles:
      Number(
        process.env.VERIFICATION_MAX_FILES
      ) || 10
  }
};

/* ============================================================
 * SECURITY SETTINGS
 * ============================================================
 */

const security = {
  generateRandomNames: true,

  preserveOriginalName: false,

  sanitizeOriginalName: true,

  rejectExecutableFiles: true,

  rejectDoubleExtensions: true,

  rejectHiddenFiles: true,

  rejectPathTraversal: true,

  verifyMimeType: true,

  verifyExtension: true,

  virusScanning:
    process.env.UPLOAD_VIRUS_SCAN === "true",

  imageMetadataRemoval:
    process.env.REMOVE_IMAGE_METADATA !==
    "false",

  preventPublicDocuments:
    process.env.PUBLIC_DOCUMENT_UPLOADS !==
    "true"
};

/* ============================================================
 * BLOCKED EXTENSIONS
 * ============================================================
 */

const blockedExtensions = [
  ".exe",
  ".msi",
  ".com",
  ".bat",
  ".cmd",
  ".sh",
  ".bash",
  ".ps1",
  ".php",
  ".php3",
  ".php4",
  ".php5",
  ".phtml",
  ".jsp",
  ".asp",
  ".aspx",
  ".cgi",
  ".pl",
  ".py",
  ".rb",
  ".js",
  ".mjs",
  ".cjs",
  ".html",
  ".htm",
  ".svg",
  ".dll",
  ".so",
  ".dylib",
  ".jar",
  ".war"
];

/* ============================================================
 * HELPERS
 * ============================================================
 */

/**
 * Ensure an upload directory exists.
 *
 * @param {string} directory
 */
function ensureDirectory(directory) {
  if (!directory) {
    throw new Error(
      "Upload directory is required."
    );
  }

  fs.mkdirSync(directory, {
    recursive: true
  });

  return directory;
}

/**
 * Create all GHAR upload directories.
 */
function ensureUploadDirectories() {
  Object.values(directories).forEach(
    ensureDirectory
  );

  return directories;
}

/**
 * Get upload configuration by type.
 *
 * @param {string} type
 * @returns {Object|null}
 */
function getUploadType(type) {
  if (!type) {
    return null;
  }

  return (
    uploadTypes[String(type)] ||
    null
  );
}

/**
 * Check whether an extension is allowed.
 *
 * @param {string} extension
 * @param {string[]} allowedExtensions
 */
function isAllowedExtension(
  extension,
  allowedExtensions = []
) {
  if (!extension) {
    return false;
  }

  const normalized =
    String(extension)
      .trim()
      .toLowerCase();

  return allowedExtensions
    .map((item) =>
      String(item)
        .trim()
        .toLowerCase()
    )
    .includes(normalized);
}

/**
 * Check whether a MIME type is allowed.
 *
 * @param {string} mimeType
 * @param {string[]} allowedMimeTypes
 */
function isAllowedMimeType(
  mimeType,
  allowedMimeTypes = []
) {
  if (!mimeType) {
    return false;
  }

  return allowedMimeTypes
    .map((item) =>
      String(item)
        .trim()
        .toLowerCase()
    )
    .includes(
      String(mimeType)
        .trim()
        .toLowerCase()
    );
}

/**
 * Check whether an extension is dangerous.
 *
 * @param {string} extension
 */
function isBlockedExtension(
  extension
) {
  if (!extension) {
    return false;
  }

  const normalized =
    String(extension)
      .trim()
      .toLowerCase();

  return blockedExtensions.includes(
    normalized
  );
}

/**
 * Validate an upload.
 *
 * @param {Object} file
 * @param {string} type
 * @returns {Object}
 */
function validateUpload(
  file,
  type
) {
  const errors = [];

  if (!file) {
    return {
      valid: false,
      errors: [
        "No file was provided."
      ]
    };
  }

  const configuration =
    getUploadType(type);

  if (!configuration) {
    return {
      valid: false,
      errors: [
        `Unknown upload type: ${type}`
      ]
    };
  }

  const originalName =
    String(
      file.originalname || ""
    );

  const mimeType =
    String(
      file.mimetype || ""
    ).toLowerCase();

  const fileSize =
    Number(file.size) || 0;

  const extension =
    path.extname(
      originalName
    ).toLowerCase();

  /* ----------------------------------------------------------
   * Filename security
   * ---------------------------------------------------------- */

  if (!originalName) {
    errors.push(
      "Original filename is required."
    );
  }

  if (
    security.rejectPathTraversal &&
    (
      originalName.includes("..") ||
      originalName.includes("/") ||
      originalName.includes("\\")
    )
  ) {
    errors.push(
      "Invalid filename."
    );
  }

  if (
    security.rejectHiddenFiles &&
    originalName.startsWith(".")
  ) {
    errors.push(
      "Hidden files are not allowed."
    );
  }

  if (
    security.rejectDoubleExtensions &&
    /\.[a-z0-9]{1,10}\.[a-z0-9]{1,10}$/i.test(
      originalName
    )
  ) {
    errors.push(
      "Double file extensions are not allowed."
    );
  }

  /* ----------------------------------------------------------
   * Extension validation
   * ---------------------------------------------------------- */

  if (
    security.rejectExecutableFiles &&
    isBlockedExtension(extension)
  ) {
    errors.push(
      "Executable or server-side files are not allowed."
    );
  }

  if (
    !isAllowedExtension(
      extension,
      configuration.extensions
    )
  ) {
    errors.push(
      `File extension ${extension || "(missing)"} is not allowed.`
    );
  }

  /* ----------------------------------------------------------
   * MIME validation
   * ---------------------------------------------------------- */

  if (
    security.verifyMimeType &&
    !isAllowedMimeType(
      mimeType,
      configuration.mimeTypes
    )
  ) {
    errors.push(
      `MIME type ${mimeType || "(missing)"} is not allowed.`
    );
  }

  /* ----------------------------------------------------------
   * Size validation
   * ---------------------------------------------------------- */

  if (fileSize <= 0) {
    errors.push(
      "Uploaded file is empty."
    );
  }

  if (
    fileSize >
    configuration.maxSize
  ) {
    errors.push(
      `File exceeds the maximum allowed size of ${configuration.maxSize} bytes.`
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize a filename.
 *
 * This is for display/reference purposes only.
 * Stored filenames should still be generated server-side.
 *
 * @param {string} filename
 */
function sanitizeFilename(
  filename
) {
  return String(filename || "")
    .normalize("NFKC")
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^\.+/,
      ""
    )
    .slice(0, 180);
}

/**
 * Generate a safe server-side filename.
 *
 * @param {string} extension
 * @returns {string}
 */
function generateFilename(
  extension = ""
) {
  const crypto =
    require("crypto");

  const safeExtension =
    String(extension || "")
      .toLowerCase()
      .replace(
        /[^a-z0-9.]/g,
        ""
      );

  return `${Date.now()}-${crypto.randomBytes(16).toString("hex")}${safeExtension}`;
}

/* ============================================================
 * STATIC PUBLIC ACCESS POLICY
 * ============================================================
 *
 * Only explicitly public content should be served directly.
 * Documents, agreements and verification files should be
 * delivered through authenticated API endpoints.
 */

const publicDirectories = [
  directories.propertyImages,
  directories.propertyVideos,
  directories.floorPlans,
  directories.profileImages
];

const privateDirectories = [
  directories.documents,
  directories.agreements,
  directories.verification
];

/* ============================================================
 * EXPORT
 * ============================================================
 */

module.exports = {
  rootUploadDir,

  directories,

  limits,

  mimeTypes,

  extensions,

  uploadTypes,

  security,

  blockedExtensions,

  publicDirectories,

  privateDirectories,

  ensureDirectory,

  ensureUploadDirectories,

  getUploadType,

  isAllowedExtension,

  isAllowedMimeType,

  isBlockedExtension,

  validateUpload,

  sanitizeFilename,

  generateFilename
};