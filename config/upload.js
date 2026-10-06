'use strict';

/**
 * ============================================================
 * GHAR - Upload Configuration
 * ============================================================
 *
 * Central upload configuration for the GHAR backend.
 *
 * Responsibilities:
 * - Multipart upload limits
 * - File validation
 * - MIME/type restrictions
 * - Upload categories
 * - Filename security
 * - Request limits
 * - Document/image/video rules
 *
 * Storage destination is handled by:
 *
 * config/storage.js
 *
 * Actual upload middleware belongs in:
 *
 * middleware/upload.middleware.js
 *
 * ============================================================
 */

const path = require('path');
const crypto = require('crypto');
const env = require('./env');
const storage = require('./storage');

/* ============================================================
   1. BASIC CONFIGURATION
   ============================================================ */

const enabled =
  process.env.UPLOADS_ENABLED !== 'false';

const environment =
  (
    env.app.environment ||
    'development'
  ).toLowerCase();

/* ============================================================
   2. MULTIPART CONFIGURATION
   ============================================================ */

const multipart = {
  fieldName:
    process.env.UPLOAD_FIELD_NAME ||
    'file',

  maxFiles:
    Number(
      process.env.UPLOAD_MAX_FILES ||
      10
    ),

  maxFields:
    Number(
      process.env.UPLOAD_MAX_FIELDS ||
      50
    ),

  maxFieldSize:
    Number(
      process.env.UPLOAD_MAX_FIELD_SIZE ||
      1024 * 1024
    ),

  maxFileSize:
    Number(
      process.env.UPLOAD_MAX_FILE_SIZE ||
      20 * 1024 * 1024
    ),

  maxTotalSize:
    Number(
      process.env.UPLOAD_MAX_TOTAL_SIZE ||
      100 * 1024 * 1024
    )
};

/* ============================================================
   3. CATEGORY-SPECIFIC LIMITS
   ============================================================ */

const categories = {
  propertyImages: {
    maxFiles:
      Number(
        process.env.UPLOAD_PROPERTY_IMAGES_MAX_FILES ||
        30
      ),

    maxFileSize:
      Number(
        process.env.UPLOAD_PROPERTY_IMAGES_MAX_SIZE ||
        10 * 1024 * 1024
      ),

    allowedTypes:
      [
        'image/jpeg',
        'image/png',
        'image/webp'
      ]
  },

  propertyVideos: {
    maxFiles:
      Number(
        process.env.UPLOAD_PROPERTY_VIDEOS_MAX_FILES ||
        5
      ),

    maxFileSize:
      Number(
        process.env.UPLOAD_PROPERTY_VIDEOS_MAX_SIZE ||
        100 * 1024 * 1024
      ),

    allowedTypes:
      [
        'video/mp4',
        'video/webm',
        'video/quicktime'
      ]
  },

  avatar: {
    maxFiles:
      1,

    maxFileSize:
      Number(
        process.env.UPLOAD_AVATAR_MAX_SIZE ||
        5 * 1024 * 1024
      ),

    allowedTypes:
      [
        'image/jpeg',
        'image/png',
        'image/webp'
      ]
  },

  identityDocument: {
    maxFiles:
      Number(
        process.env.UPLOAD_IDENTITY_MAX_FILES ||
        5
      ),

    maxFileSize:
      Number(
        process.env.UPLOAD_IDENTITY_MAX_SIZE ||
        10 * 1024 * 1024
      ),

    allowedTypes:
      [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf'
      ]
  },

  propertyDocument: {
    maxFiles:
      Number(
        process.env.UPLOAD_PROPERTY_DOCUMENT_MAX_FILES ||
        20
      ),

    maxFileSize:
      Number(
        process.env.UPLOAD_PROPERTY_DOCUMENT_MAX_SIZE ||
        20 * 1024 * 1024
      ),

    allowedTypes:
      [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
  },

  financialDocument: {
    maxFiles:
      Number(
        process.env.UPLOAD_FINANCIAL_MAX_FILES ||
        20
      ),

    maxFileSize:
      Number(
        process.env.UPLOAD_FINANCIAL_MAX_SIZE ||
        20 * 1024 * 1024
      ),

    allowedTypes:
      [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp'
      ]
  },

  loanDocument: {
    maxFiles:
      Number(
        process.env.UPLOAD_LOAN_MAX_FILES ||
        20
      ),

    maxFileSize:
      Number(
        process.env.UPLOAD_LOAN_MAX_SIZE ||
        20 * 1024 * 1024
      ),

    allowedTypes:
      [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp'
      ]
  },

  applicationDocument: {
    maxFiles:
      Number(
        process.env.UPLOAD_APPLICATION_MAX_FILES ||
        20
      ),

    maxFileSize:
      Number(
        process.env.UPLOAD_APPLICATION_MAX_SIZE ||
        20 * 1024 * 1024
      ),

    allowedTypes:
      [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
  },

  paymentDocument: {
    maxFiles:
      Number(
        process.env.UPLOAD_PAYMENT_MAX_FILES ||
        10
      ),

    maxFileSize:
      Number(
        process.env.UPLOAD_PAYMENT_MAX_SIZE ||
        10 * 1024 * 1024
      ),

    allowedTypes:
      [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp'
      ]
  }
};

/* ============================================================
   4. GLOBAL MIME TYPES
   ============================================================ */

const mimeTypes = {
  images: [
    'image/jpeg',
    'image/png',
    'image/webp'
  ],

  documents: [
    'application/pdf',

    'application/msword',

    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

    'application/vnd.ms-excel',

    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

    'text/plain'
  ],

  videos: [
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
};

/* ============================================================
   5. FILE EXTENSIONS
   ============================================================ */

const extensions = {
  images: [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp'
  ],

  documents: [
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.txt'
  ],

  videos: [
    '.mp4',
    '.webm',
    '.mov'
  ]
};

/* ============================================================
   6. SECURITY CONFIGURATION
   ============================================================ */

const security = {
  sanitizeFilename:
    process.env.UPLOAD_SANITIZE_FILENAME !==
    'false',

  generateUniqueFilename:
    process.env.UPLOAD_UNIQUE_FILENAME !==
    'false',

  preserveOriginalFilename:
    process.env.UPLOAD_PRESERVE_FILENAME ===
    'true',

  rejectDoubleExtensions:
    process.env.UPLOAD_REJECT_DOUBLE_EXTENSION !==
    'false',

  rejectExecutableFiles:
    process.env.UPLOAD_REJECT_EXECUTABLES !==
    'false',

  validateMimeAndExtension:
    process.env.UPLOAD_VALIDATE_MIME_EXTENSION !==
    'false'
};

/* ============================================================
   7. DANGEROUS EXTENSIONS
   ============================================================ */

const dangerousExtensions = [
  '.exe',
  '.dll',
  '.bat',
  '.cmd',
  '.com',
  '.msi',
  '.scr',
  '.pif',
  '.jar',
  '.js',
  '.mjs',
  '.cjs',
  '.php',
  '.phtml',
  '.asp',
  '.aspx',
  '.jsp',
  '.sh',
  '.bash',
  '.ps1',
  '.vbs',
  '.vbe',
  '.wsf',
  '.wsh'
];

/* ============================================================
   8. FILENAME GENERATION
   ============================================================ */

function generateFilename(
  originalName
) {
  const extension =
    path.extname(
      originalName || ''
    ).toLowerCase();

  const random =
    crypto.randomBytes(
      16
    ).toString('hex');

  const timestamp =
    Date.now();

  return (
    `${timestamp}-` +
    `${random}` +
    `${extension}`
  );
}

/* ============================================================
   9. FILENAME SANITIZATION
   ============================================================ */

function sanitizeFilename(
  filename
) {
  if (!filename) {
    return 'file';
  }

  let sanitized =
    path.basename(
      filename
    );

  sanitized =
    sanitized
      .replace(
        /[\u0000-\u001F\u007F]/g,
        ''
      )
      .replace(
        /[^a-zA-Z0-9._-]/g,
        '_'
      )
      .replace(
        /_+/g,
        '_'
      );

  if (
    !sanitized
  ) {
    sanitized =
      'file';
  }

  return sanitized;
}

/* ============================================================
   10. EXTENSION VALIDATION
   ============================================================ */

function getExtension(
  filename
) {
  return path
    .extname(
      filename || ''
    )
    .toLowerCase();
}

function isAllowedExtension(
  filename,
  category
) {
  const extension =
    getExtension(
      filename
    );

  if (
    !extension
  ) {
    return false;
  }

  const categoryConfig =
    categories[
      category
    ];

  if (
    categoryConfig
  ) {
    const allowed =
      [
        ...extensions.images,
        ...extensions.documents,
        ...extensions.videos
      ];

    return allowed.includes(
      extension
    );
  }

  return [
    ...extensions.images,
    ...extensions.documents,
    ...extensions.videos
  ].includes(
    extension
  );
}

/* ============================================================
   11. DANGEROUS FILE CHECK
   ============================================================ */

function isDangerousExtension(
  filename
) {
  const extension =
    getExtension(
      filename
    );

  return dangerousExtensions.includes(
    extension
  );
}

/* ============================================================
   12. DOUBLE EXTENSION CHECK
   ============================================================ */

function hasDoubleExtension(
  filename
) {
  if (!filename) {
    return false;
  }

  const base =
    path.basename(
      filename
    );

  const parts =
    base.split('.');

  if (
    parts.length <= 2
  ) {
    return false;
  }

  /*
   * Example:
   *
   * document.pdf.exe
   * image.jpg.php
   */

  const lastExtension =
    `.${parts[parts.length - 1]}`
      .toLowerCase();

  return dangerousExtensions.includes(
    lastExtension
  );
}

/* ============================================================
   13. MIME TYPE VALIDATION
   ============================================================ */

function isAllowedMimeType(
  mimeType,
  category
) {
  if (!mimeType) {
    return false;
  }

  const normalized =
    mimeType
      .toLowerCase()
      .trim();

  const categoryConfig =
    categories[
      category
    ];

  if (
    categoryConfig
  ) {
    return categoryConfig.allowedTypes.includes(
      normalized
    );
  }

  return Object.values(
    mimeTypes
  )
    .flat()
    .includes(
      normalized
    );
}

/* ============================================================
   14. MIME + EXTENSION VALIDATION
   ============================================================ */

function validateFileType(
  filename,
  mimeType,
  category
) {
  if (
    !filename ||
    !mimeType
  ) {
    return {
      valid: false,
      reason:
        'Filename and MIME type are required.'
    };
  }

  if (
    security.rejectExecutableFiles &&
    isDangerousExtension(
      filename
    )
  ) {
    return {
      valid: false,
      reason:
        'Executable file types are not allowed.'
    };
  }

  if (
    security.rejectDoubleExtensions &&
    hasDoubleExtension(
      filename
    )
  ) {
    return {
      valid: false,
      reason:
        'Files with dangerous double extensions are not allowed.'
    };
  }

  const extensionValid =
    isAllowedExtension(
      filename,
      category
    );

  const mimeValid =
    isAllowedMimeType(
      mimeType,
      category
    );

  if (
    security.validateMimeAndExtension &&
    (
      !extensionValid ||
      !mimeValid
    )
  ) {
    return {
      valid: false,
      reason:
        'File type is not allowed.'
    };
  }

  return {
    valid: true
  };
}

/* ============================================================
   15. FILE SIZE VALIDATION
   ============================================================ */

function validateFileSize(
  size,
  category
) {
  const numericSize =
    Number(size);

  if (
    !Number.isFinite(
      numericSize
    ) ||
    numericSize < 0
  ) {
    return {
      valid: false,
      reason:
        'Invalid file size.'
    };
  }

  const config =
    categories[
      category
    ];

  const maximum =
    config
      ? config.maxFileSize
      : multipart.maxFileSize;

  if (
    numericSize >
    maximum
  ) {
    return {
      valid: false,
      reason:
        `File exceeds the maximum allowed size of ${Math.round(
          maximum / 1024 / 1024
        )} MB.`
    };
  }

  return {
    valid: true
  };
}

/* ============================================================
   16. COMPLETE FILE VALIDATION
   ============================================================ */

function validateFile(
  file,
  category
) {
  if (!file) {
    return {
      valid: false,
      reason:
        'No file supplied.'
    };
  }

  const typeResult =
    validateFileType(
      file.originalname ||
        file.filename,
      file.mimetype,
      category
    );

  if (
    !typeResult.valid
  ) {
    return typeResult;
  }

  const sizeResult =
    validateFileSize(
      file.size,
      category
    );

  if (
    !sizeResult.valid
  ) {
    return sizeResult;
  }

  return {
    valid: true
  };
}

/* ============================================================
   17. CATEGORY CHECK
   ============================================================ */

function isCategorySupported(
  category
) {
  return Boolean(
    categories[
      category
    ]
  );
}

/* ============================================================
   18. CATEGORY CONFIGURATION
   ============================================================ */

function getCategoryConfig(
  category
) {
  if (
    !isCategorySupported(
      category
    )
  ) {
    throw new Error(
      `Unsupported upload category: ${category}`
    );
  }

  return categories[
    category
  ];
}

/* ============================================================
   19. FILE COUNT VALIDATION
   ============================================================ */

function validateFileCount(
  count,
  category
) {
  const numericCount =
    Number(count);

  const config =
    categories[
      category
    ];

  const maximum =
    config
      ? config.maxFiles
      : multipart.maxFiles;

  if (
    !Number.isFinite(
      numericCount
    ) ||
    numericCount < 0
  ) {
    return {
      valid: false,
      reason:
        'Invalid file count.'
    };
  }

  if (
    numericCount >
    maximum
  ) {
    return {
      valid: false,
      reason:
        `Maximum ${maximum} file(s) allowed for ${category}.`
    };
  }

  return {
    valid: true
  };
}

/* ============================================================
   20. UPLOAD PATH
   ============================================================ */

function getUploadFolder(
  category
) {
  const folderMap = {
    propertyImages:
      storage.folders.propertyImages,

    propertyVideos:
      storage.folders.propertyVideos,

    avatar:
      storage.folders.avatars,

    identityDocument:
      storage.folders.identityDocuments,

    propertyDocument:
      storage.folders.propertyDocuments,

    financialDocument:
      storage.folders.financialDocuments,

    loanDocument:
      storage.folders.loanDocuments,

    applicationDocument:
      storage.folders.applicationDocuments,

    paymentDocument:
      storage.folders.paymentDocuments
  };

  return (
    folderMap[
      category
    ] ||
    storage.folders.temporary
  );
}

/* ============================================================
   21. UPLOAD FEATURES
   ============================================================ */

const features = {
  propertyImages:
    process.env.UPLOAD_FEATURE_PROPERTY_IMAGES !==
    'false',

  propertyVideos:
    process.env.UPLOAD_FEATURE_PROPERTY_VIDEOS !==
    'false',

  avatars:
    process.env.UPLOAD_FEATURE_AVATARS !==
    'false',

  identityDocuments:
    process.env.UPLOAD_FEATURE_IDENTITY_DOCUMENTS !==
    'false',

  propertyDocuments:
    process.env.UPLOAD_FEATURE_PROPERTY_DOCUMENTS !==
    'false',

  financialDocuments:
    process.env.UPLOAD_FEATURE_FINANCIAL_DOCUMENTS !==
    'false',

  loanDocuments:
    process.env.UPLOAD_FEATURE_LOAN_DOCUMENTS !==
    'false',

  applicationDocuments:
    process.env.UPLOAD_FEATURE_APPLICATION_DOCUMENTS !==
    'false',

  paymentDocuments:
    process.env.UPLOAD_FEATURE_PAYMENT_DOCUMENTS !==
    'false'
};

/* ============================================================
   22. FEATURE CHECK
   ============================================================ */

function isFeatureEnabled(
  feature
) {
  return (
    enabled &&
    features[
      feature
    ] === true
  );
}

/* ============================================================
   23. VALIDATION
   ============================================================ */

function validate() {
  const errors = [];
  const warnings = [];

  if (
    multipart.maxFiles <= 0
  ) {
    errors.push(
      'UPLOAD_MAX_FILES must be greater than zero.'
    );
  }

  if (
    multipart.maxFileSize <= 0
  ) {
    errors.push(
      'UPLOAD_MAX_FILE_SIZE must be greater than zero.'
    );
  }

  if (
    multipart.maxTotalSize <= 0
  ) {
    errors.push(
      'UPLOAD_MAX_TOTAL_SIZE must be greater than zero.'
    );
  }

  if (
    environment === 'production' &&
    !enabled
  ) {
    warnings.push(
      '[GHAR UPLOAD] Upload functionality is disabled in production.'
    );
  }

  if (
    !storage.enabled
  ) {
    warnings.push(
      '[GHAR UPLOAD] Storage is disabled.'
    );
  }

  if (
    !storage.isProviderConfigured()
  ) {
    warnings.push(
      '[GHAR UPLOAD] Configured storage provider is not fully configured.'
    );
  }

  for (
    const warning of warnings
  ) {
    console.warn(
      warning
    );
  }

  if (
    errors.length > 0
  ) {
    throw new Error(
      `[GHAR UPLOAD CONFIG ERROR]\n- ${errors.join('\n- ')}`
    );
  }

  return true;
}

/* ============================================================
   24. SAFE CONFIGURATION
   ============================================================ */

function getSafeConfig() {
  return {
    enabled,

    environment,

    multipart: {
      fieldName:
        multipart.fieldName,

      maxFiles:
        multipart.maxFiles,

      maxFields:
        multipart.maxFields,

      maxFileSize:
        multipart.maxFileSize,

      maxTotalSize:
        multipart.maxTotalSize
    },

    categories:
      Object.fromEntries(
        Object.entries(
          categories
        ).map(
          ([name, config]) => [
            name,
            {
              maxFiles:
                config.maxFiles,

              maxFileSize:
                config.maxFileSize,

              allowedTypes:
                config.allowedTypes
            }
          ]
        )
      ),

    security: {
      sanitizeFilename:
        security.sanitizeFilename,

      generateUniqueFilename:
        security.generateUniqueFilename,

      preserveOriginalFilename:
        security.preserveOriginalFilename,

      rejectDoubleExtensions:
        security.rejectDoubleExtensions,

      rejectExecutableFiles:
        security.rejectExecutableFiles,

      validateMimeAndExtension:
        security.validateMimeAndExtension
    },

    features: {
      ...features
    }
  };
}

/* ============================================================
   25. EXPORT
   ============================================================ */

const upload = {
  enabled,

  environment,

  multipart,

  categories,

  mimeTypes,

  extensions,

  security,

  dangerousExtensions,

  features,

  generateFilename,

  sanitizeFilename,

  getExtension,

  isAllowedExtension,

  isDangerousExtension,

  hasDoubleExtension,

  isAllowedMimeType,

  validateFileType,

  validateFileSize,

  validateFile,

  isCategorySupported,

  getCategoryConfig,

  validateFileCount,

  getUploadFolder,

  isFeatureEnabled,

  getSafeConfig,

  validate
};

/* ============================================================
   26. VALIDATE ON LOAD
   ============================================================ */

validate();

/* ============================================================
   27. EXPORT
   ============================================================ */

module.exports = upload;