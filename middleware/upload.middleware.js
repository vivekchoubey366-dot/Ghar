"use strict";

/**
 * ============================================================
 * GHAR - UPLOAD MIDDLEWARE
 * ============================================================
 *
 * Responsibilities:
 * - Handle multipart/form-data uploads
 * - Validate uploaded files
 * - Restrict file types
 * - Restrict file sizes
 * - Protect against dangerous filenames
 * - Support document, image and property uploads
 * - Provide reusable upload configurations
 *
 * Storage responsibility:
 * - This middleware validates/receives files.
 * - config/storage.js decides where files are stored.
 *
 * Recommended flow:
 *
 * Client
 *   ↓
 * auth.middleware
 *   ↓
 * upload.middleware
 *   ↓
 * validation
 *   ↓
 * controller
 *   ↓
 * storage service
 *
 * ============================================================
 */

const multer = require("multer");
const path = require("path");
const crypto = require("crypto");


/**
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const MAX_FILE_SIZE_MB =
  Number(
    process.env.UPLOAD_MAX_FILE_SIZE_MB ||
    10
  );

const MAX_FILE_SIZE =
  MAX_FILE_SIZE_MB *
  1024 *
  1024;


/**
 * Maximum number of files allowed in one request.
 */

const MAX_FILES =
  Number(
    process.env.UPLOAD_MAX_FILES ||
    10
  );


/**
 * ============================================================
 * ALLOWED MIME TYPES
 * ============================================================
 */

const MIME_TYPES =
  Object.freeze({

    /**
     * Images
     */

    image: [
      "image/jpeg",
      "image/png",
      "image/webp"
    ],

    /**
     * Documents
     */

    document: [
      "application/pdf",

      "application/msword",

      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

      "application/vnd.ms-excel",

      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

      "text/plain"
    ],

    /**
     * Property images.
     */

    propertyImage: [
      "image/jpeg",
      "image/png",
      "image/webp"
    ],

    /**
     * Verification documents.
     */

    verification: [
      "image/jpeg",
      "image/png",
      "application/pdf"
    ],

    /**
     * Loan documents.
     */

    loan: [
      "application/pdf",
      "image/jpeg",
      "image/png"
    ],

    /**
     * Application documents.
     */

    application: [
      "application/pdf",
      "image/jpeg",
      "image/png"
    ]
  });


/**
 * ============================================================
 * EXTENSION MAP
 * ============================================================
 *
 * Used as an additional validation layer.
 *
 * MIME type alone should never be blindly trusted.
 *
 * ============================================================
 */

const EXTENSION_MIME_MAP =
  Object.freeze({

    ".jpg": [
      "image/jpeg"
    ],

    ".jpeg": [
      "image/jpeg"
    ],

    ".png": [
      "image/png"
    ],

    ".webp": [
      "image/webp"
    ],

    ".pdf": [
      "application/pdf"
    ],

    ".doc": [
      "application/msword"
    ],

    ".docx": [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],

    ".xls": [
      "application/vnd.ms-excel"
    ],

    ".xlsx": [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ],

    ".txt": [
      "text/plain"
    ]
  });


/**
 * ============================================================
 * STORAGE
 * ============================================================
 *
 * Files are kept in memory here so the controller/storage layer
 * can decide whether to send them to:
 *
 * - local storage
 * - S3
 * - Cloudinary
 * - another object-storage provider
 *
 * This avoids coupling upload validation with storage.
 *
 * ============================================================
 */

const storage =
  multer.memoryStorage();


/**
 * ============================================================
 * NORMALIZE MIME TYPE
 * ============================================================
 */

function normalizeMimeType(
  mimeType
) {
  return String(
    mimeType || ""
  )
    .trim()
    .toLowerCase();
}


/**
 * ============================================================
 * NORMALIZE EXTENSION
 * ============================================================
 */

function getExtension(
  filename
) {
  return path
    .extname(
      String(
        filename || ""
      )
    )
    .toLowerCase();
}


/**
 * ============================================================
 * SAFE FILENAME
 * ============================================================
 *
 * The original filename is never used as the storage filename.
 *
 * ============================================================
 */

function sanitizeFilename(
  filename
) {
  const original =
    String(
      filename || ""
    );

  const extension =
    getExtension(
      original
    );

  const safeExtension =
    /^[a-z0-9.]+$/i.test(
      extension
    )
      ? extension
      : "";

  const randomName =
    crypto.randomBytes(
      16
    ).toString("hex");

  return `${Date.now()}-${randomName}${safeExtension}`;
}


/**
 * ============================================================
 * VALIDATE EXTENSION + MIME
 * ============================================================
 */

function isValidFileType(
  file
) {
  if (
    !file
  ) {
    return false;
  }

  const mimeType =
    normalizeMimeType(
      file.mimetype
    );

  const extension =
    getExtension(
      file.originalname
    );

  const allowedMimes =
    EXTENSION_MIME_MAP[
      extension
    ];

  if (
    !allowedMimes
  ) {
    return false;
  }

  return allowedMimes.includes(
    mimeType
  );
}


/**
 * ============================================================
 * FILE TYPE FACTORY
 * ============================================================
 */

function createFileFilter(
  allowedTypes
) {
  const allowedMimes =
    Array.isArray(
      allowedTypes
    )
      ? allowedTypes.map(
          normalizeMimeType
        )
      : [];

  return function fileFilter(
    req,
    file,
    callback
  ) {
    if (
      !file
    ) {
      return callback(
        null,
        false
      );
    }

    const mimeType =
      normalizeMimeType(
        file.mimetype
      );

    const extension =
      getExtension(
        file.originalname
      );

    /**
     * Check MIME type.
     */

    if (
      !allowedMimes.includes(
        mimeType
      )
    ) {
      const error =
        new Error(
          `File type ${mimeType || "unknown"} is not allowed.`
        );

      error.code =
        "INVALID_FILE_TYPE";

      return callback(
        error,
        false
      );
    }

    /**
     * Check extension against MIME type.
     */

    const extensionMimes =
      EXTENSION_MIME_MAP[
        extension
      ];

    if (
      !extensionMimes ||
      !extensionMimes.includes(
        mimeType
      )
    ) {
      const error =
        new Error(
          "The file extension does not match the supplied file type."
        );

      error.code =
        "FILE_EXTENSION_MISMATCH";

      return callback(
        error,
        false
      );
    }

    /**
     * Reject suspicious filenames.
     */

    if (
      /[\/\\\0]/.test(
        String(
          file.originalname
        )
      )
    ) {
      const error =
        new Error(
          "The uploaded filename is invalid."
        );

      error.code =
        "INVALID_FILENAME";

      return callback(
        error,
        false
      );
    }

    return callback(
      null,
      true
    );
  };
}


/**
 * ============================================================
 * CREATE UPLOAD INSTANCE
 * ============================================================
 */

function createUpload({
  allowedTypes,
  maxFileSize =
    MAX_FILE_SIZE,
  maxFiles =
    MAX_FILES
} = {}) {

  if (
    !Array.isArray(
      allowedTypes
    ) ||
    allowedTypes.length === 0
  ) {
    throw new TypeError(
      "createUpload requires allowedTypes."
    );
  }

  return multer({

    storage,

    limits: {
      fileSize:
        maxFileSize,

      files:
        maxFiles,

      fields:
        50,

      parts:
        maxFiles + 50,

      headerPairs:
        2000
    },

    fileFilter:
      createFileFilter(
        allowedTypes
      )
  });
}


/**
 * ============================================================
 * GENERAL IMAGE UPLOAD
 * ============================================================
 */

const uploadImage =
  createUpload({
    allowedTypes:
      MIME_TYPES.image,

    maxFileSize:
      10 * 1024 * 1024,

    maxFiles:
      10
  });


/**
 * ============================================================
 * GENERAL DOCUMENT UPLOAD
 * ============================================================
 */

const uploadDocument =
  createUpload({
    allowedTypes:
      MIME_TYPES.document,

    maxFileSize:
      20 * 1024 * 1024,

    maxFiles:
      10
  });


/**
 * ============================================================
 * PROPERTY IMAGE UPLOAD
 * ============================================================
 */

const uploadPropertyImages =
  createUpload({
    allowedTypes:
      MIME_TYPES.propertyImage,

    maxFileSize:
      10 * 1024 * 1024,

    maxFiles:
      20
  });


/**
 * ============================================================
 * VERIFICATION DOCUMENT UPLOAD
 * ============================================================
 */

const uploadVerification =
  createUpload({
    allowedTypes:
      MIME_TYPES.verification,

    maxFileSize:
      15 * 1024 * 1024,

    maxFiles:
      5
  });


/**
 * ============================================================
 * LOAN DOCUMENT UPLOAD
 * ============================================================
 */

const uploadLoanDocuments =
  createUpload({
    allowedTypes:
      MIME_TYPES.loan,

    maxFileSize:
      20 * 1024 * 1024,

    maxFiles:
      10
  });


/**
 * ============================================================
 * APPLICATION DOCUMENT UPLOAD
 * ============================================================
 */

const uploadApplicationDocuments =
  createUpload({
    allowedTypes:
      MIME_TYPES.application,

    maxFileSize:
      20 * 1024 * 1024,

    maxFiles:
      10
  });


/**
 * ============================================================
 * SINGLE FILE
 * ============================================================
 */

function singleUpload(
  fieldName,
  uploader = uploadDocument
) {
  if (
    !fieldName
  ) {
    throw new TypeError(
      "singleUpload requires a field name."
    );
  }

  return uploader.single(
    fieldName
  );
}


/**
 * ============================================================
 * MULTIPLE FILES
 * ============================================================
 */

function multipleUpload(
  fieldName,
  maxCount = 10,
  uploader = uploadDocument
) {
  if (
    !fieldName
  ) {
    throw new TypeError(
      "multipleUpload requires a field name."
    );
  }

  return uploader.array(
    fieldName,
    maxCount
  );
}


/**
 * ============================================================
 * MULTIPLE NAMED FIELDS
 * ============================================================
 *
 * Example:
 *
 * uploadFields({
 *   idProof: 1,
 *   addressProof: 1,
 *   incomeProof: 3
 * })
 *
 * ============================================================
 */

function uploadFields(
  fields,
  uploader = uploadDocument
) {
  if (
    !Array.isArray(
      fields
    ) ||
    fields.length === 0
  ) {
    throw new TypeError(
      "uploadFields requires a field configuration."
    );
  }

  return uploader.fields(
    fields
  );
}


/**
 * ============================================================
 * PROPERTY IMAGE FIELDS
 * ============================================================
 *
 * Allows:
 *
 * coverImage
 * gallery
 *
 * ============================================================
 */

const propertyUploadFields =
  uploadPropertyImages.fields([
    {
      name:
        "coverImage",

      maxCount:
        1
    },

    {
      name:
        "gallery",

      maxCount:
        20
    }
  ]);


/**
 * ============================================================
 * DOCUMENT FIELDS
 * ============================================================
 */

const verificationUploadFields =
  uploadVerification.fields([
    {
      name:
        "identityDocument",

      maxCount:
        1
    },

    {
      name:
        "addressDocument",

      maxCount:
        1
    },

    {
      name:
        "supportingDocuments",

      maxCount:
        3
    }
  ]);


/**
 * ============================================================
 * APPLICATION FIELDS
 * ============================================================
 */

const applicationUploadFields =
  uploadApplicationDocuments.fields([
    {
      name:
        "documents",

      maxCount:
        10
    }
  ]);


/**
 * ============================================================
 * LOAN FIELDS
 * ============================================================
 */

const loanUploadFields =
  uploadLoanDocuments.fields([
    {
      name:
        "identityDocuments",

      maxCount:
        2
    },

    {
      name:
        "incomeDocuments",

      maxCount:
        5
    },

    {
      name:
        "propertyDocuments",

      maxCount:
        5
    },

    {
      name:
        "bankDocuments",

      maxCount:
        5
    }
  ]);


/**
 * ============================================================
 * NORMALIZE UPLOADED FILE
 * ============================================================
 */

function normalizeUploadedFile(
  file
) {
  if (
    !file
  ) {
    return null;
  }

  return {
    originalName:
      file.originalname,

    filename:
      sanitizeFilename(
        file.originalname
      ),

    mimeType:
      normalizeMimeType(
        file.mimetype
      ),

    size:
      file.size,

    encoding:
      file.encoding,

    fieldName:
      file.fieldname
  };
}


/**
 * ============================================================
 * VALIDATE UPLOADED FILE AFTER MULTER
 * ============================================================
 *
 * Useful as an additional controller-level validation layer.
 * ============================================================
 */

function validateUploadedFile(
  file
) {
  if (
    !file
  ) {
    const error =
      new Error(
        "No file was uploaded."
      );

    error.code =
      "FILE_REQUIRED";

    return {
      valid:
        false,

      error
    };
  }

  if (
    !isValidFileType(
      file
    )
  ) {
    const error =
      new Error(
        "The uploaded file type is invalid."
      );

    error.code =
      "INVALID_FILE_TYPE";

    return {
      valid:
        false,

      error
    };
  }

  if (
    file.size >
    MAX_FILE_SIZE
  ) {
    const error =
      new Error(
        "The uploaded file is too large."
      );

    error.code =
      "FILE_TOO_LARGE";

    return {
      valid:
        false,

      error
    };
  }

  return {
    valid:
      true,

    error:
      null
  };
}


/**
 * ============================================================
 * MULTER ERROR HANDLER
 * ============================================================
 *
 * Keep this AFTER the multer upload middleware.
 *
 * Example:
 *
 * router.post(
 *   "/documents",
 *   requireAuth,
 *   uploadDocument.single("document"),
 *   handleUploadError,
 *   controller
 * );
 *
 * ============================================================
 */

function handleUploadError(
  error,
  req,
  res,
  next
) {
  if (
    !error
  ) {
    return next();
  }

  if (
    error instanceof
    multer.MulterError
  ) {
    let status =
      400;

    let code =
      "UPLOAD_ERROR";

    let message =
      error.message ||
      "The file upload failed.";

    switch (
      error.code
    ) {
      case "LIMIT_FILE_SIZE":

        code =
          "FILE_TOO_LARGE";

        message =
          "The uploaded file is too large.";

        break;

      case "LIMIT_FILE_COUNT":

        code =
          "TOO_MANY_FILES";

        message =
          "Too many files were uploaded.";

        break;

      case "LIMIT_UNEXPECTED_FILE":

        code =
          "UNEXPECTED_FILE";

        message =
          "An unexpected file field was uploaded.";

        break;

      case "LIMIT_FIELD_COUNT":

        code =
          "TOO_MANY_FIELDS";

        message =
          "Too many form fields were submitted.";

        break;

      case "LIMIT_FIELD_KEY":

        code =
          "FIELD_NAME_TOO_LONG";

        message =
          "A form field name is too long.";

        break;

      case "LIMIT_FIELD_VALUE":

        code =
          "FIELD_VALUE_TOO_LARGE";

        message =
          "A form field value is too large.";

        break;

      case "LIMIT_PART_COUNT":

        code =
          "TOO_MANY_MULTIPART_PARTS";

        message =
          "The multipart request contains too many parts.";

        break;

      case "LIMIT_UNEXPECTED_FILE":

        status =
          400;

        break;

      default:
        break;
    }

    return res.status(
      status
    ).json({
      success:
        false,

      error: {
        code,

        message,

        requestId:
          req.requestId ||
          null
      }
    });
  }


  /**
   * Our custom file validation errors.
   */

  const customCodes =
    new Set([
      "INVALID_FILE_TYPE",
      "FILE_EXTENSION_MISMATCH",
      "INVALID_FILENAME",
      "FILE_REQUIRED",
      "FILE_TOO_LARGE"
    ]);

  if (
    customCodes.has(
      error.code
    )
  ) {
    return res.status(400).json({
      success:
        false,

      error: {
        code:
          error.code,

        message:
          error.message ||
          "The uploaded file is invalid.",

        requestId:
          req.requestId ||
          null
      }
    });
  }

  return next(error);
}


/**
 * ============================================================
 * UPLOAD CONFIGURATION
 * ============================================================
 */

const uploadConfig =
  Object.freeze({
    maxFileSize:
      MAX_FILE_SIZE,

    maxFileSizeMB:
      MAX_FILE_SIZE_MB,

    maxFiles:
      MAX_FILES,

    mimeTypes:
      MIME_TYPES
  });


/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {

  /**
   * Configuration
   */

  uploadConfig,

  MIME_TYPES,

  EXTENSION_MIME_MAP,

  MAX_FILE_SIZE,

  MAX_FILE_SIZE_MB,

  MAX_FILES,


  /**
   * Upload instances
   */

  uploadImage,

  uploadDocument,

  uploadPropertyImages,

  uploadVerification,

  uploadLoanDocuments,

  uploadApplicationDocuments,


  /**
   * Preconfigured field sets
   */

  propertyUploadFields,

  verificationUploadFields,

  applicationUploadFields,

  loanUploadFields,


  /**
   * Factories
   */

  createUpload,

  singleUpload,

  multipleUpload,

  uploadFields,


  /**
   * Validation
   */

  isValidFileType,

  validateUploadedFile,

  normalizeUploadedFile,

  sanitizeFilename,

  getExtension,

  normalizeMimeType,


  /**
   * Error handling
   */

  handleUploadError
};