'use strict';

/**
 * ============================================================
 * GHAR - Storage Configuration
 * ============================================================
 *
 * Central storage configuration for the GHAR backend.
 *
 * Supports:
 * - Local filesystem
 * - Cloudinary
 * - AWS S3
 * - Cloudflare R2
 *
 * Storage operations belong in:
 *
 * services/storage.service.js
 * middleware/upload.middleware.js
 *
 * ============================================================
 */

const path = require('path');
const env = require('./env');

/* ============================================================
   1. BASIC CONFIGURATION
   ============================================================ */

const enabled =
  process.env.STORAGE_ENABLED !== 'false';

const provider =
  (
    process.env.STORAGE_PROVIDER ||
    'local'
  ).toLowerCase();

const environment =
  (
    env.app.environment ||
    'development'
  ).toLowerCase();

/* ============================================================
   2. LOCAL STORAGE
   ============================================================ */

const local = {
  root:
    process.env.STORAGE_LOCAL_ROOT ||
    path.join(
      process.cwd(),
      'storage'
    ),

  uploads:
    process.env.STORAGE_LOCAL_UPLOADS ||
    'uploads',

  properties:
    process.env.STORAGE_LOCAL_PROPERTIES ||
    'properties',

  users:
    process.env.STORAGE_LOCAL_USERS ||
    'users',

  documents:
    process.env.STORAGE_LOCAL_DOCUMENTS ||
    'documents',

  applications:
    process.env.STORAGE_LOCAL_APPLICATIONS ||
    'applications',

  temp:
    process.env.STORAGE_LOCAL_TEMP ||
    'temp'
};

/* ============================================================
   3. CLOUDINARY
   ============================================================ */

const cloudinary = {
  cloudName:
    process.env.CLOUDINARY_CLOUD_NAME ||
    null,

  apiKey:
    process.env.CLOUDINARY_API_KEY ||
    null,

  apiSecret:
    process.env.CLOUDINARY_API_SECRET ||
    null,

  folder:
    process.env.CLOUDINARY_FOLDER ||
    'ghar',

  secure:
    process.env.CLOUDINARY_SECURE !==
    'false'
};

/* ============================================================
   4. AWS S3
   ============================================================ */

const s3 = {
  bucket:
    process.env.S3_BUCKET ||
    null,

  region:
    process.env.S3_REGION ||
    'ap-south-1',

  accessKeyId:
    process.env.S3_ACCESS_KEY_ID ||
    null,

  secretAccessKey:
    process.env.S3_SECRET_ACCESS_KEY ||
    null,

  endpoint:
    process.env.S3_ENDPOINT ||
    null,

  publicUrl:
    process.env.S3_PUBLIC_URL ||
    null,

  forcePathStyle:
    process.env.S3_FORCE_PATH_STYLE ===
    'true'
};

/* ============================================================
   5. CLOUDFLARE R2
   ============================================================ */

const r2 = {
  bucket:
    process.env.R2_BUCKET ||
    null,

  accountId:
    process.env.R2_ACCOUNT_ID ||
    null,

  accessKeyId:
    process.env.R2_ACCESS_KEY_ID ||
    null,

  secretAccessKey:
    process.env.R2_SECRET_ACCESS_KEY ||
    null,

  endpoint:
    process.env.R2_ENDPOINT ||
    null,

  publicUrl:
    process.env.R2_PUBLIC_URL ||
    null
};

/* ============================================================
   6. FILE SIZE LIMITS
   ============================================================ */

const limits = {
  image:
    Number(
      process.env.STORAGE_MAX_IMAGE_MB ||
      10
    ),

  document:
    Number(
      process.env.STORAGE_MAX_DOCUMENT_MB ||
      20
    ),

  pdf:
    Number(
      process.env.STORAGE_MAX_PDF_MB ||
      20
    ),

  video:
    Number(
      process.env.STORAGE_MAX_VIDEO_MB ||
      100
    ),

  total:
    Number(
      process.env.STORAGE_MAX_FILE_MB ||
      100
    )
};

/* ============================================================
   7. ALLOWED FILE TYPES
   ============================================================ */

const allowedMimeTypes = {
  images: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
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
   8. STORAGE FOLDERS
   ============================================================ */

const folders = {
  properties:
    'properties',

  propertyImages:
    'properties/images',

  propertyVideos:
    'properties/videos',

  users:
    'users',

  avatars:
    'users/avatars',

  documents:
    'documents',

  identityDocuments:
    'documents/identity',

  addressDocuments:
    'documents/address',

  financialDocuments:
    'documents/financial',

  propertyDocuments:
    'documents/property',

  applicationDocuments:
    'applications',

  loanDocuments:
    'loans',

  paymentDocuments:
    'payments',

  contracts:
    'contracts',

  reports:
    'reports',

  temporary:
    'temporary'
};

/* ============================================================
   9. STORAGE ACCESS
   ============================================================ */

const access = {
  /*
   * Public property images may be publicly readable.
   */

  propertyImagesPublic:
    process.env.STORAGE_PROPERTY_IMAGES_PUBLIC ===
    'true',

  /*
   * User documents should remain private.
   */

  userDocumentsPrivate:
    process.env.STORAGE_USER_DOCUMENTS_PRIVATE !==
    'false',

  /*
   * KYC documents must remain private.
   */

  kycDocumentsPrivate:
    process.env.STORAGE_KYC_DOCUMENTS_PRIVATE !==
    'false',

  /*
   * Payment documents should remain private.
   */

  paymentDocumentsPrivate:
    process.env.STORAGE_PAYMENT_DOCUMENTS_PRIVATE !==
    'false'
};

/* ============================================================
   10. SIGNED URL CONFIGURATION
   ============================================================ */

const signedUrls = {
  enabled:
    process.env.STORAGE_SIGNED_URLS_ENABLED !==
    'false',

  expiresInSeconds:
    Number(
      process.env.STORAGE_SIGNED_URL_EXPIRY ||
      900
    )
};

/* ============================================================
   11. IMAGE PROCESSING
   ============================================================ */

const imageProcessing = {
  enabled:
    process.env.STORAGE_IMAGE_PROCESSING !==
    'false',

  maxWidth:
    Number(
      process.env.STORAGE_IMAGE_MAX_WIDTH ||
      2400
    ),

  maxHeight:
    Number(
      process.env.STORAGE_IMAGE_MAX_HEIGHT ||
      2400
    ),

  quality:
    Number(
      process.env.STORAGE_IMAGE_QUALITY ||
      82
    ),

  format:
    process.env.STORAGE_IMAGE_FORMAT ||
    'webp'
};

/* ============================================================
   12. FILE NAME SETTINGS
   ============================================================ */

const filenames = {
  /*
   * Never trust user-supplied file names as storage keys.
   */

  sanitize:
    process.env.STORAGE_SANITIZE_FILENAMES !==
    'false',

  preserveOriginalName:
    process.env.STORAGE_PRESERVE_ORIGINAL_NAME ===
    'true',

  useUniqueNames:
    process.env.STORAGE_UNIQUE_FILENAMES !==
    'false'
};

/* ============================================================
   13. RETENTION
   ============================================================ */

const retention = {
  temporaryFilesHours:
    Number(
      process.env.STORAGE_TEMP_RETENTION_HOURS ||
      24
    ),

  deletedFilesDays:
    Number(
      process.env.STORAGE_DELETED_RETENTION_DAYS ||
      30
    )
};

/* ============================================================
   14. PROVIDER SUPPORT
   ============================================================ */

function isProviderSupported() {
  return [
    'local',
    'cloudinary',
    's3',
    'r2'
  ].includes(provider);
}

/* ============================================================
   15. PROVIDER CONFIGURATION CHECK
   ============================================================ */

function isProviderConfigured() {
  if (!enabled) {
    return false;
  }

  switch (provider) {
    case 'local':
      return Boolean(
        local.root
      );

    case 'cloudinary':
      return Boolean(
        cloudinary.cloudName &&
        cloudinary.apiKey &&
        cloudinary.apiSecret
      );

    case 's3':
      return Boolean(
        s3.bucket &&
        s3.region &&
        s3.accessKeyId &&
        s3.secretAccessKey
      );

    case 'r2':
      return Boolean(
        r2.bucket &&
        r2.accountId &&
        r2.accessKeyId &&
        r2.secretAccessKey
      );

    default:
      return false;
  }
}

/* ============================================================
   16. ACTIVE PROVIDER CONFIGURATION
   ============================================================ */

function getProviderConfig() {
  switch (provider) {
    case 'local':
      return local;

    case 'cloudinary':
      return cloudinary;

    case 's3':
      return s3;

    case 'r2':
      return r2;

    default:
      throw new Error(
        `Unsupported storage provider: ${provider}`
      );
  }
}

/* ============================================================
   17. FILE TYPE CHECK
   ============================================================ */

function isAllowedMimeType(
  mimeType,
  category = 'documents'
) {
  if (
    !mimeType ||
    !allowedMimeTypes[category]
  ) {
    return false;
  }

  return allowedMimeTypes[
    category
  ].includes(
    mimeType.toLowerCase()
  );
}

/* ============================================================
   18. FILE SIZE CHECK
   ============================================================ */

function validateFileSize(
  bytes,
  category = 'document'
) {
  const size =
    Number(bytes);

  if (
    !Number.isFinite(size) ||
    size < 0
  ) {
    return {
      valid: false,
      reason:
        'Invalid file size.'
    };
  }

  const maxMb =
    limits[
      category
    ] ||
    limits.total;

  const maxBytes =
    maxMb *
    1024 *
    1024;

  if (
    size > maxBytes
  ) {
    return {
      valid: false,
      reason:
        `File exceeds the ${maxMb} MB ${category} limit.`
    };
  }

  return {
    valid: true
  };
}

/* ============================================================
   19. STORAGE PATH
   ============================================================ */

function getLocalPath(
  folder,
  filename
) {
  return path.join(
    local.root,
    folder,
    filename
  );
}

/* ============================================================
   20. PUBLIC URL
   ============================================================ */

function getPublicUrl(
  key
) {
  if (!key) {
    return null;
  }

  switch (provider) {
    case 'cloudinary':
      if (
        cloudinary.secure &&
        cloudinary.cloudName
      ) {
        return (
          `https://res.cloudinary.com/` +
          `${cloudinary.cloudName}/` +
          `image/upload/` +
          `${key}`
        );
      }

      return null;

    case 's3':
      if (s3.publicUrl) {
        return (
          `${s3.publicUrl.replace(/\/$/, '')}/` +
          `${key}`
        );
      }

      return null;

    case 'r2':
      if (r2.publicUrl) {
        return (
          `${r2.publicUrl.replace(/\/$/, '')}/` +
          `${key}`
        );
      }

      return null;

    case 'local':
      return null;

    default:
      return null;
  }
}

/* ============================================================
   21. FEATURE SETTINGS
   ============================================================ */

const features = {
  propertyImages:
    process.env.STORAGE_FEATURE_PROPERTY_IMAGES !==
    'false',

  propertyVideos:
    process.env.STORAGE_FEATURE_PROPERTY_VIDEOS !==
    'false',

  userAvatars:
    process.env.STORAGE_FEATURE_AVATARS !==
    'false',

  identityDocuments:
    process.env.STORAGE_FEATURE_IDENTITY_DOCUMENTS !==
    'false',

  propertyDocuments:
    process.env.STORAGE_FEATURE_PROPERTY_DOCUMENTS !==
    'false',

  loanDocuments:
    process.env.STORAGE_FEATURE_LOAN_DOCUMENTS !==
    'false',

  applicationDocuments:
    process.env.STORAGE_FEATURE_APPLICATION_DOCUMENTS !==
    'false',

  paymentDocuments:
    process.env.STORAGE_FEATURE_PAYMENT_DOCUMENTS !==
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
    features[feature] === true
  );
}

/* ============================================================
   23. VALIDATION
   ============================================================ */

function validate() {
  const errors = [];
  const warnings = [];

  if (
    !isProviderSupported()
  ) {
    errors.push(
      `Unsupported STORAGE_PROVIDER: ${provider}. ` +
      `Supported providers: local, cloudinary, s3, r2.`
    );
  }

  if (
    enabled &&
    !isProviderConfigured()
  ) {
    warnings.push(
      `[GHAR STORAGE] ${provider} storage is not fully configured.`
    );
  }

  if (
    environment === 'production' &&
    provider === 'local'
  ) {
    warnings.push(
      '[GHAR STORAGE] Local filesystem storage is being used in production. Use persistent/object storage for production deployments.'
    );
  }

  if (
    limits.image <= 0
  ) {
    errors.push(
      'STORAGE_MAX_IMAGE_MB must be greater than zero.'
    );
  }

  if (
    limits.document <= 0
  ) {
    errors.push(
      'STORAGE_MAX_DOCUMENT_MB must be greater than zero.'
    );
  }

  if (
    limits.pdf <= 0
  ) {
    errors.push(
      'STORAGE_MAX_PDF_MB must be greater than zero.'
    );
  }

  if (
    limits.video <= 0
  ) {
    errors.push(
      'STORAGE_MAX_VIDEO_MB must be greater than zero.'
    );
  }

  if (
    signedUrls.expiresInSeconds <= 0
  ) {
    errors.push(
      'STORAGE_SIGNED_URL_EXPIRY must be greater than zero.'
    );
  }

  if (
    imageProcessing.quality < 1 ||
    imageProcessing.quality > 100
  ) {
    errors.push(
      'STORAGE_IMAGE_QUALITY must be between 1 and 100.'
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
      `[GHAR STORAGE CONFIG ERROR]\n- ${errors.join('\n- ')}`
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

    provider,

    environment,

    providerConfigured:
      isProviderConfigured(),

    local: {
      root:
        provider === 'local'
          ? local.root
          : '[not active]'
    },

    cloudinary: {
      configured:
        Boolean(
          cloudinary.cloudName &&
          cloudinary.apiKey &&
          cloudinary.apiSecret
        ),

      cloudName:
        cloudinary.cloudName
          ? '[configured]'
          : null
    },

    s3: {
      configured:
        Boolean(
          s3.bucket &&
          s3.accessKeyId &&
          s3.secretAccessKey
        ),

      bucket:
        s3.bucket
          ? '[configured]'
          : null,

      region:
        s3.region
    },

    r2: {
      configured:
        Boolean(
          r2.bucket &&
          r2.accountId &&
          r2.accessKeyId &&
          r2.secretAccessKey
        ),

      bucket:
        r2.bucket
          ? '[configured]'
          : null
    },

    limits: {
      ...limits
    },

    signedUrls: {
      enabled:
        signedUrls.enabled,

      expiresInSeconds:
        signedUrls.expiresInSeconds
    },

    imageProcessing: {
      ...imageProcessing
    },

    access: {
      ...access
    },

    features: {
      ...features
    }
  };
}

/* ============================================================
   25. EXPORT
   ============================================================ */

const storage = {
  enabled,

  provider,

  environment,

  local,

  cloudinary,

  s3,

  r2,

  limits,

  allowedMimeTypes,

  folders,

  access,

  signedUrls,

  imageProcessing,

  filenames,

  retention,

  features,

  isProviderSupported,

  isProviderConfigured,

  getProviderConfig,

  isAllowedMimeType,

  validateFileSize,

  getLocalPath,

  getPublicUrl,

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

module.exports = storage;