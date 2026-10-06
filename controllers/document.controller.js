'use strict';

/**
 * ============================================================
 * GHAR - Document Controller
 * ============================================================
 *
 * Handles:
 * - Upload documents
 * - List user documents
 * - Get document
 * - Download document
 * - Update document metadata
 * - Verify documents
 * - Reject documents
 * - Delete documents
 * - Document status
 * - Application/property document association
 * - Admin document review
 *
 * Business logic:
 *     services/document.service.js
 *
 * Database logic:
 *     repositories/document.repository.js
 *
 * File/storage logic:
 *     services/storage.service.js
 *     config/storage.js
 *     config/upload.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE
   ============================================================ */

function getDocumentService() {
  try {
    return require('../services/document.service');
  } catch (error) {
    return null;
  }
}

/* ============================================================
   RESPONSE HELPERS
   ============================================================ */

function success(
  res,
  data = {},
  message = 'Success',
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function failure(
  res,
  statusCode,
  message,
  error = null
) {
  const response = {
    success: false,
    message
  };

  if (
    config?.env?.app?.environment !==
    'production'
  ) {
    if (error) {
      response.error =
        error.message ||
        String(error);
    }
  }

  return res
    .status(statusCode)
    .json(response);
}

/* ============================================================
   USER
   ============================================================ */

function getUserId(req) {
  return (
    req.user?.id ||
    req.user?.userId ||
    null
  );
}

function getUserRole(req) {
  return (
    req.user?.role ||
    req.user?.userRole ||
    null
  );
}

/* ============================================================
   FILE HELPERS
   ============================================================ */

function getUploadedFiles(req) {
  if (
    Array.isArray(req.files)
  ) {
    return req.files;
  }

  if (
    req.files &&
    typeof req.files === 'object'
  ) {
    return Object.values(
      req.files
    ).flat();
  }

  if (req.file) {
    return [req.file];
  }

  return [];
}

function normalizeFile(file) {
  if (!file) {
    return null;
  }

  return {
    fieldName:
      file.fieldname ||
      null,

    originalName:
      file.originalname ||
      file.originalName ||
      null,

    filename:
      file.filename ||
      null,

    mimetype:
      file.mimetype ||
      null,

    size:
      file.size ||
      null,

    path:
      file.path ||
      null,

    destination:
      file.destination ||
      null,

    buffer:
      file.buffer ||
      null
  };
}

function normalizeFiles(req) {
  return getUploadedFiles(req)
    .map(normalizeFile)
    .filter(Boolean);
}

/* ============================================================
   DOCUMENT ID
   ============================================================ */

function getDocumentId(req) {
  return (
    req.params?.id ||
    req.params?.documentId ||
    req.body?.documentId ||
    null
  );
}

/* ============================================================
   AUDIT
   ============================================================ */

async function createAuditLog(
  req,
  action,
  metadata = {}
) {
  try {
    let auditService = null;

    try {
      auditService =
        require('../services/audit.service');
    } catch {
      return;
    }

    if (
      typeof auditService.create !==
      'function'
    ) {
      return;
    }

    await auditService.create({
      userId:
        getUserId(req),

      action,

      resource:
        'document',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.[
          'user-agent'
        ] || null
    });
  } catch (error) {
    console.error(
      '[DOCUMENT AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. UPLOAD DOCUMENT
   ============================================================ */

/**
 * POST /api/documents
 *
 * Authentication required.
 *
 * multipart/form-data
 *
 * Fields:
 * - documentType
 * - category
 * - propertyId
 * - applicationId
 * - description
 *
 * Files:
 * - document
 * - documents[]
 */

async function uploadDocument(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const files =
      normalizeFiles(req);

    if (!files.length) {
      return failure(
        res,
        400,
        'At least one document file is required.'
      );
    }

    const service =
      getDocumentService();

    if (!service) {
      return failure(
        res,
        503,
        'Document service is unavailable.'
      );
    }

    const method =
      service.uploadDocument ||
      service.createDocument ||
      service.upload;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Document upload is not implemented.'
      );
    }

    const results = [];

    for (const file of files) {
      const result =
        await method.call(
          service,
          {
            userId,

            file,

            documentType:
              req.body?.documentType ||
              req.body?.type ||
              'other',

            category:
              req.body?.category ||
              null,

            propertyId:
              req.body?.propertyId ||
              null,

            applicationId:
              req.body?.applicationId ||
              null,

            description:
              req.body?.description ||
              null,

            metadata:
              req.body?.metadata ||
              {}
          }
        );

      results.push(result);
    }

    await createAuditLog(
      req,
      'DOCUMENT_UPLOADED',
      {
        documentIds:
          results
            .map(
              item =>
                item?.id ||
                item?.documentId
            )
            .filter(Boolean)
      }
    );

    return success(
      res,
      {
        documents:
          results
      },
      'Document uploaded successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] Upload error:',
      error
    );

    if (
      error?.code ===
      'FILE_TOO_LARGE'
    ) {
      return failure(
        res,
        413,
        'Document file is too large.'
      );
    }

    if (
      error?.code ===
      'INVALID_FILE_TYPE'
    ) {
      return failure(
        res,
        415,
        'This document file type is not supported.'
      );
    }

    return failure(
      res,
      500,
      'Unable to upload document.',
      error
    );
  }
}

/* ============================================================
   2. LIST MY DOCUMENTS
   ============================================================ */

/**
 * GET /api/documents
 */

async function listDocuments(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const service =
      getDocumentService();

    if (!service) {
      return failure(
        res,
        503,
        'Document service is unavailable.'
      );
    }

    const method =
      service.getUserDocuments ||
      service.listDocuments ||
      service.getDocuments;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Document listing is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          documentType:
            req.query?.documentType ||
            req.query?.type ||
            null,

          category:
            req.query?.category ||
            null,

          status:
            req.query?.status ||
            null,

          propertyId:
            req.query?.propertyId ||
            null,

          applicationId:
            req.query?.applicationId ||
            null,

          page:
            Number(
              req.query?.page
            ) || 1,

          limit:
            Math.min(
              Number(
                req.query?.limit
              ) || 20,
              100
            )
        }
      );

    return success(
      res,
      result,
      'Documents retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] List error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve documents.',
      error
    );
  }
}

/* ============================================================
   3. GET DOCUMENT
   ============================================================ */

/**
 * GET /api/documents/:id
 */

async function getDocument(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const documentId =
      getDocumentId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!documentId) {
      return failure(
        res,
        400,
        'Document ID is required.'
      );
    }

    const service =
      getDocumentService();

    if (!service) {
      return failure(
        res,
        503,
        'Document service is unavailable.'
      );
    }

    const method =
      service.getDocument ||
      service.findDocument;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Document retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          documentId,

          userId,

          role:
            getUserRole(req)
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Document not found.'
      );
    }

    return success(
      res,
      result,
      'Document retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] Get error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve document.',
      error
    );
  }
}

/* ============================================================
   4. DOWNLOAD DOCUMENT
   ============================================================ */

/**
 * GET /api/documents/:id/download
 */

async function downloadDocument(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const documentId =
      getDocumentId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!documentId) {
      return failure(
        res,
        400,
        'Document ID is required.'
      );
    }

    const service =
      getDocumentService();

    if (!service) {
      return failure(
        res,
        503,
        'Document service is unavailable.'
      );
    }

    const method =
      service.getDownload ||
      service.downloadDocument ||
      service.getDocumentFile;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Document download is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          documentId,

          userId,

          role:
            getUserRole(req)
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Document file not found.'
      );
    }

    /*
     * If the service returns a stream,
     * pipe it directly to the response.
     */

    if (
      typeof result.pipe ===
      'function'
    ) {
      return result.pipe(res);
    }

    /*
     * If the service returns a local path.
     */

    if (
      result.path &&
      typeof res.download ===
        'function'
    ) {
      return res.download(
        result.path,
        result.filename ||
          undefined
      );
    }

    /*
     * If the service returns a
     * signed URL, redirect.
     */

    if (
      result.url
    ) {
      return res.redirect(
        result.url
      );
    }

    return success(
      res,
      result,
      'Document download information retrieved.'
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] Download error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to download document.',
      error
    );
  }
}

/* ============================================================
   5. UPDATE DOCUMENT
   ============================================================ */

/**
 * PATCH /api/documents/:id
 */

async function updateDocument(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const documentId =
      getDocumentId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!documentId) {
      return failure(
        res,
        400,
        'Document ID is required.'
      );
    }

    const service =
      getDocumentService();

    if (!service) {
      return failure(
        res,
        503,
        'Document service is unavailable.'
      );
    }

    const method =
      service.updateDocument;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Document update is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          documentId,

          userId,

          documentType:
            req.body?.documentType,

          category:
            req.body?.category,

          description:
            req.body?.description,

          propertyId:
            req.body?.propertyId,

          applicationId:
            req.body?.applicationId,

          metadata:
            req.body?.metadata
        }
      );

    await createAuditLog(
      req,
      'DOCUMENT_UPDATED',
      {
        documentId
      }
    );

    return success(
      res,
      result,
      'Document updated successfully.'
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] Update error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update document.',
      error
    );
  }
}

/* ============================================================
   6. DELETE DOCUMENT
   ============================================================ */

/**
 * DELETE /api/documents/:id
 */

async function deleteDocument(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const documentId =
      getDocumentId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!documentId) {
      return failure(
        res,
        400,
        'Document ID is required.'
      );
    }

    const service =
      getDocumentService();

    if (!service) {
      return failure(
        res,
        503,
        'Document service is unavailable.'
      );
    }

    const method =
      service.deleteDocument ||
      service.removeDocument;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Document deletion is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          documentId,

          userId
        }
      );

    await createAuditLog(
      req,
      'DOCUMENT_DELETED',
      {
        documentId
      }
    );

    return success(
      res,
      result,
      'Document deleted successfully.'
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] Delete error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to delete document.',
      error
    );
  }
}

/* ============================================================
   7. DOCUMENT STATUS
   ============================================================ */

/**
 * GET /api/documents/:id/status
 */

async function getDocumentStatus(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const documentId =
      getDocumentId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!documentId) {
      return failure(
        res,
        400,
        'Document ID is required.'
      );
    }

    const service =
      getDocumentService();

    const method =
      service?.getDocumentStatus ||
      service?.getStatus;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Document status service is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          documentId,

          userId,

          role:
            getUserRole(req)
        }
      );

    return success(
      res,
      result,
      'Document status retrieved.'
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] Status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve document status.',
      error
    );
  }
}

/* ============================================================
   8. VERIFY DOCUMENT - ADMIN
   ============================================================ */

/**
 * POST /api/documents/:id/verify
 */

async function verifyDocument(
  req,
  res
) {
  try {
    const adminId =
      getUserId(req);

    const documentId =
      getDocumentId(req);

    if (!adminId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!documentId) {
      return failure(
        res,
        400,
        'Document ID is required.'
      );
    }

    const service =
      getDocumentService();

    const method =
      service?.verifyDocument ||
      service?.approveDocument;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Document verification is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          documentId,

          reviewerId:
            adminId,

          notes:
            req.body?.notes ||
            null,

          metadata:
            req.body?.metadata ||
            {}
        }
      );

    await createAuditLog(
      req,
      'DOCUMENT_VERIFIED',
      {
        documentId
      }
    );

    return success(
      res,
      result,
      'Document verified successfully.'
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] Verify error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to verify document.',
      error
    );
  }
}

/* ============================================================
   9. REJECT DOCUMENT - ADMIN
   ============================================================ */

/**
 * POST /api/documents/:id/reject
 */

async function rejectDocument(
  req,
  res
) {
  try {
    const adminId =
      getUserId(req);

    const documentId =
      getDocumentId(req);

    if (!adminId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!documentId) {
      return failure(
        res,
        400,
        'Document ID is required.'
      );
    }

    const reason =
      typeof req.body?.reason ===
      'string'
        ? req.body.reason.trim()
        : '';

    if (!reason) {
      return failure(
        res,
        400,
        'A rejection reason is required.'
      );
    }

    const service =
      getDocumentService();

    const method =
      service?.rejectDocument;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Document rejection is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          documentId,

          reviewerId:
            adminId,

          reason,

          metadata:
            req.body?.metadata ||
            {}
        }
      );

    await createAuditLog(
      req,
      'DOCUMENT_REJECTED',
      {
        documentId,

        reason
      }
    );

    return success(
      res,
      result,
      'Document rejected successfully.'
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] Reject error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to reject document.',
      error
    );
  }
}

/* ============================================================
   10. REQUEST DOCUMENT
   ============================================================ */

/**
 * POST /api/documents/request
 *
 * Used by admin/staff when requesting
 * missing documents from a user.
 */

async function requestDocument(
  req,
  res
) {
  try {
    const requesterId =
      getUserId(req);

    if (!requesterId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const targetUserId =
      req.body?.userId;

    const documentType =
      req.body?.documentType ||
      req.body?.type;

    if (!targetUserId) {
      return failure(
        res,
        400,
        'User ID is required.'
      );
    }

    if (!documentType) {
      return failure(
        res,
        400,
        'Document type is required.'
      );
    }

    const service =
      getDocumentService();

    const method =
      service?.requestDocument;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Document request service is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          requesterId,

          userId:
            targetUserId,

          documentType,

          category:
            req.body?.category ||
            null,

          description:
            req.body?.description ||
            null,

          dueDate:
            req.body?.dueDate ||
            null,

          applicationId:
            req.body?.applicationId ||
            null
        }
      );

    await createAuditLog(
      req,
      'DOCUMENT_REQUESTED',
      {
        targetUserId,

        documentType
      }
    );

    return success(
      res,
      result,
      'Document request created successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] Request error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to create document request.',
      error
    );
  }
}

/* ============================================================
   11. LIST DOCUMENT REQUESTS
   ============================================================ */

/**
 * GET /api/documents/requests
 */

async function listDocumentRequests(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const service =
      getDocumentService();

    const method =
      service?.getDocumentRequests ||
      service?.listDocumentRequests;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Document request listing is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          status:
            req.query?.status ||
            null,

          page:
            Number(
              req.query?.page
            ) || 1,

          limit:
            Math.min(
              Number(
                req.query?.limit
              ) || 20,
              100
            )
        }
      );

    return success(
      res,
      result,
      'Document requests retrieved.'
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] Requests error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve document requests.',
      error
    );
  }
}

/* ============================================================
   12. LINK DOCUMENT TO PROPERTY
   ============================================================ */

/**
 * POST /api/documents/:id/link/property
 */

async function linkToProperty(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const documentId =
      getDocumentId(req);

    const propertyId =
      req.body?.propertyId ||
      req.params?.propertyId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!documentId) {
      return failure(
        res,
        400,
        'Document ID is required.'
      );
    }

    if (!propertyId) {
      return failure(
        res,
        400,
        'Property ID is required.'
      );
    }

    const service =
      getDocumentService();

    const method =
      service?.linkToProperty ||
      service?.attachToProperty;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property document linking is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          documentId,

          propertyId,

          userId
        }
      );

    await createAuditLog(
      req,
      'DOCUMENT_LINKED_PROPERTY',
      {
        documentId,

        propertyId
      }
    );

    return success(
      res,
      result,
      'Document linked to property successfully.'
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] Property link error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to link document to property.',
      error
    );
  }
}

/* ============================================================
   13. LINK DOCUMENT TO APPLICATION
   ============================================================ */

/**
 * POST /api/documents/:id/link/application
 */

async function linkToApplication(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const documentId =
      getDocumentId(req);

    const applicationId =
      req.body?.applicationId ||
      req.params?.applicationId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!documentId) {
      return failure(
        res,
        400,
        'Document ID is required.'
      );
    }

    if (!applicationId) {
      return failure(
        res,
        400,
        'Application ID is required.'
      );
    }

    const service =
      getDocumentService();

    const method =
      service?.linkToApplication ||
      service?.attachToApplication;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Application document linking is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          documentId,

          applicationId,

          userId
        }
      );

    await createAuditLog(
      req,
      'DOCUMENT_LINKED_APPLICATION',
      {
        documentId,

        applicationId
      }
    );

    return success(
      res,
      result,
      'Document linked to application successfully.'
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] Application link error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to link document to application.',
      error
    );
  }
}

/* ============================================================
   14. DOCUMENT VERIFICATION HISTORY
   ============================================================ */

/**
 * GET /api/documents/:id/history
 */

async function getDocumentHistory(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const documentId =
      getDocumentId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!documentId) {
      return failure(
        res,
        400,
        'Document ID is required.'
      );
    }

    const service =
      getDocumentService();

    const method =
      service?.getDocumentHistory ||
      service?.getVerificationHistory;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Document history is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          documentId,

          userId,

          role:
            getUserRole(req)
        }
      );

    return success(
      res,
      result,
      'Document history retrieved.'
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] History error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve document history.',
      error
    );
  }
}

/* ============================================================
   15. ADMIN DOCUMENT LIST
   ============================================================ */

/**
 * GET /api/documents/admin/all
 */

async function adminListDocuments(
  req,
  res
) {
  try {
    const adminId =
      getUserId(req);

    if (!adminId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const service =
      getDocumentService();

    const method =
      service?.adminListDocuments ||
      service?.getAllDocuments ||
      service?.listAllDocuments;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Admin document listing is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          adminId,

          userId:
            req.query?.userId ||
            null,

          status:
            req.query?.status ||
            null,

          documentType:
            req.query?.documentType ||
            null,

          propertyId:
            req.query?.propertyId ||
            null,

          applicationId:
            req.query?.applicationId ||
            null,

          page:
            Number(
              req.query?.page
            ) || 1,

          limit:
            Math.min(
              Number(
                req.query?.limit
              ) || 50,
              100
            )
        }
      );

    return success(
      res,
      result,
      'Admin document list retrieved.'
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] Admin list error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve admin document list.',
      error
    );
  }
}

/* ============================================================
   16. ADMIN DOCUMENT REVIEW
   ============================================================ */

/**
 * GET /api/documents/admin/pending
 */

async function getPendingDocuments(
  req,
  res
) {
  try {
    const adminId =
      getUserId(req);

    if (!adminId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const service =
      getDocumentService();

    const method =
      service?.getPendingDocuments ||
      service?.listPendingDocuments;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Pending document review is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          adminId,

          page:
            Number(
              req.query?.page
            ) || 1,

          limit:
            Math.min(
              Number(
                req.query?.limit
              ) || 50,
              100
            )
        }
      );

    return success(
      res,
      result,
      'Pending documents retrieved.'
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] Pending error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve pending documents.',
      error
    );
  }
}

/* ============================================================
   17. DOCUMENT METADATA
   ============================================================ */

/**
 * GET /api/documents/:id/metadata
 */

async function getDocumentMetadata(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const documentId =
      getDocumentId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!documentId) {
      return failure(
        res,
        400,
        'Document ID is required.'
      );
    }

    const service =
      getDocumentService();

    const method =
      service?.getDocumentMetadata ||
      service?.getMetadata;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Document metadata retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          documentId,

          userId,

          role:
            getUserRole(req)
        }
      );

    return success(
      res,
      result,
      'Document metadata retrieved.'
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] Metadata error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve document metadata.',
      error
    );
  }
}

/* ============================================================
   18. AI DOCUMENT EXTRACTION
   ============================================================ */

/**
 * POST /api/documents/:id/extract
 *
 * Delegates OCR / AI extraction to the
 * document service.
 */

async function extractDocumentData(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const documentId =
      getDocumentId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!documentId) {
      return failure(
        res,
        400,
        'Document ID is required.'
      );
    }

    const service =
      getDocumentService();

    const method =
      service?.extractDocumentData ||
      service?.extractData ||
      service?.processWithAI;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'AI document extraction is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          documentId,

          userId,

          fields:
            req.body?.fields ||
            [],

          force:
            Boolean(
              req.body?.force
            )
        }
      );

    await createAuditLog(
      req,
      'DOCUMENT_AI_EXTRACTION',
      {
        documentId
      }
    );

    return success(
      res,
      result,
      'Document data extracted successfully.'
    );
  } catch (error) {
    console.error(
      '[DOCUMENT] AI extraction error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to extract document data.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  uploadDocument,

  listDocuments,

  getDocument,

  downloadDocument,

  updateDocument,

  deleteDocument,

  getDocumentStatus,

  verifyDocument,

  rejectDocument,

  requestDocument,

  listDocumentRequests,

  linkToProperty,

  linkToApplication,

  getDocumentHistory,

  adminListDocuments,

  getPendingDocuments,

  getDocumentMetadata,

  extractDocumentData
};