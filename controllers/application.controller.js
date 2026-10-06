'use strict';

/**
 * ============================================================
 * GHAR - Application Controller
 * ============================================================
 *
 * Handles property / loan / service applications.
 *
 * Controller responsibilities:
 * - Create applications
 * - Retrieve applications
 * - Update applications
 * - Submit applications
 * - Withdraw applications
 * - Track application status
 * - Application documents
 * - Application history
 *
 * Business logic belongs in:
 *
 *     services/application.service.js
 *
 * Database logic belongs in:
 *
 *     repositories/*
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE
   ============================================================ */

function getApplicationService() {
  try {
    return require('../services/application.service');
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

/* ============================================================
   PAGINATION
   ============================================================ */

function getPagination(req) {
  const page =
    Math.max(
      Number.parseInt(
        req.query?.page,
        10
      ) || 1,
      1
    );

  const limit =
    Math.min(
      Math.max(
        Number.parseInt(
          req.query?.limit,
          10
        ) || 20,
        1
      ),
      100
    );

  return {
    page,
    limit,
    offset:
      (page - 1) * limit
  };
}

/* ============================================================
   AUDIT
   ============================================================ */

async function createAuditLog(
  req,
  action,
  applicationId = null,
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
        'application',

      resourceId:
        applicationId,

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.['user-agent'] ||
        null
    });
  } catch (error) {
    console.error(
      '[APPLICATION AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. CREATE APPLICATION
   ============================================================ */

/**
 * POST /api/applications
 */

async function createApplication(
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
      getApplicationService();

    if (!service) {
      return failure(
        res,
        503,
        'Application service is unavailable.'
      );
    }

    if (
      typeof service.createApplication !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Application creation is not implemented.'
      );
    }

    const application =
      await service.createApplication({
        userId,

        data:
          req.body || {},

        files:
          req.files || [],

        metadata:
          req.body?.metadata ||
          {}
      });

    await createAuditLog(
      req,
      'APPLICATION_CREATED',
      application?.id || null
    );

    return success(
      res,
      application,
      'Application created successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[APPLICATION] Create error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to create application.',
      error
    );
  }
}

/* ============================================================
   2. GET MY APPLICATIONS
   ============================================================ */

/**
 * GET /api/applications
 */

async function listMyApplications(
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
      getApplicationService();

    if (!service) {
      return failure(
        res,
        503,
        'Application service is unavailable.'
      );
    }

    const pagination =
      getPagination(req);

    const method =
      service.getUserApplications ||
      service.listUserApplications ||
      service.listApplications;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Application listing is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          ...req.query,

          ...pagination
        }
      );

    return success(
      res,
      result,
      'Applications retrieved.'
    );
  } catch (error) {
    console.error(
      '[APPLICATION] List error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve applications.',
      error
    );
  }
}

/* ============================================================
   3. GET APPLICATION
   ============================================================ */

/**
 * GET /api/applications/:id
 */

async function getApplication(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const applicationId =
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
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
      getApplicationService();

    if (!service) {
      return failure(
        res,
        503,
        'Application service is unavailable.'
      );
    }

    const method =
      service.getApplication ||
      service.getApplicationById ||
      service.findById;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Application retrieval is not implemented.'
      );
    }

    const application =
      await method.call(
        service,
        {
          applicationId,

          userId
        }
      );

    if (!application) {
      return failure(
        res,
        404,
        'Application not found.'
      );
    }

    return success(
      res,
      application,
      'Application retrieved.'
    );
  } catch (error) {
    console.error(
      '[APPLICATION] Get error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve application.',
      error
    );
  }
}

/* ============================================================
   4. UPDATE APPLICATION
   ============================================================ */

/**
 * PATCH /api/applications/:id
 */

async function updateApplication(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const applicationId =
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
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
      getApplicationService();

    if (!service) {
      return failure(
        res,
        503,
        'Application service is unavailable.'
      );
    }

    const method =
      service.updateApplication ||
      service.update;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Application update is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          applicationId,

          userId,

          data:
            req.body || {},

          files:
            req.files || []
        }
      );

    await createAuditLog(
      req,
      'APPLICATION_UPDATED',
      applicationId,
      {
        fields:
          Object.keys(
            req.body || {}
          )
      }
    );

    return success(
      res,
      result,
      'Application updated successfully.'
    );
  } catch (error) {
    console.error(
      '[APPLICATION] Update error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update application.',
      error
    );
  }
}

/* ============================================================
   5. SUBMIT APPLICATION
   ============================================================ */

/**
 * POST /api/applications/:id/submit
 */

async function submitApplication(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const applicationId =
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
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
      getApplicationService();

    if (!service) {
      return failure(
        res,
        503,
        'Application service is unavailable.'
      );
    }

    const method =
      service.submitApplication ||
      service.submit;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Application submission is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          applicationId,

          userId
        }
      );

    await createAuditLog(
      req,
      'APPLICATION_SUBMITTED',
      applicationId
    );

    return success(
      res,
      result,
      'Application submitted successfully.'
    );
  } catch (error) {
    console.error(
      '[APPLICATION] Submit error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to submit application.',
      error
    );
  }
}

/* ============================================================
   6. WITHDRAW APPLICATION
   ============================================================ */

/**
 * POST /api/applications/:id/withdraw
 */

async function withdrawApplication(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const applicationId =
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
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
      getApplicationService();

    if (!service) {
      return failure(
        res,
        503,
        'Application service is unavailable.'
      );
    }

    const method =
      service.withdrawApplication ||
      service.withdraw;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Application withdrawal is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          applicationId,

          userId,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'APPLICATION_WITHDRAWN',
      applicationId,
      {
        reason:
          req.body?.reason ||
          null
      }
    );

    return success(
      res,
      result,
      'Application withdrawn successfully.'
    );
  } catch (error) {
    console.error(
      '[APPLICATION] Withdraw error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to withdraw application.',
      error
    );
  }
}

/* ============================================================
   7. APPLICATION STATUS
   ============================================================ */

/**
 * GET /api/applications/:id/status
 */

async function getApplicationStatus(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const applicationId =
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
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
      getApplicationService();

    if (!service) {
      return failure(
        res,
        503,
        'Application service is unavailable.'
      );
    }

    const method =
      service.getApplicationStatus ||
      service.getStatus;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Application status service is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          applicationId,

          userId
        }
      );

    return success(
      res,
      result,
      'Application status retrieved.'
    );
  } catch (error) {
    console.error(
      '[APPLICATION] Status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve application status.',
      error
    );
  }
}

/* ============================================================
   8. APPLICATION TIMELINE
   ============================================================ */

/**
 * GET /api/applications/:id/timeline
 */

async function getApplicationTimeline(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const applicationId =
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
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
      getApplicationService();

    const method =
      service?.getTimeline ||
      service?.getApplicationTimeline;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Application timeline is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          applicationId,

          userId
        }
      );

    return success(
      res,
      result,
      'Application timeline retrieved.'
    );
  } catch (error) {
    console.error(
      '[APPLICATION] Timeline error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve application timeline.',
      error
    );
  }
}

/* ============================================================
   9. APPLICATION DOCUMENTS
   ============================================================ */

/**
 * GET /api/applications/:id/documents
 */

async function getApplicationDocuments(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const applicationId =
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
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
      getApplicationService();

    const method =
      service?.getApplicationDocuments ||
      service?.getDocuments;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Application document retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          applicationId,

          userId
        }
      );

    return success(
      res,
      result,
      'Application documents retrieved.'
    );
  } catch (error) {
    console.error(
      '[APPLICATION] Documents error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve application documents.',
      error
    );
  }
}

/* ============================================================
   10. ADD APPLICATION DOCUMENT
   ============================================================ */

/**
 * POST /api/applications/:id/documents
 */

async function addApplicationDocument(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const applicationId =
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
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
      getApplicationService();

    const method =
      service?.addDocument ||
      service?.uploadDocument;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Application document upload is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          applicationId,

          userId,

          files:
            req.files || [],

          body:
            req.body || {}
        }
      );

    await createAuditLog(
      req,
      'APPLICATION_DOCUMENT_ADDED',
      applicationId
    );

    return success(
      res,
      result,
      'Application document added successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[APPLICATION] Document upload error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to add application document.',
      error
    );
  }
}

/* ============================================================
   11. REMOVE APPLICATION DOCUMENT
   ============================================================ */

/**
 * DELETE /api/applications/:id/documents/:documentId
 */

async function removeApplicationDocument(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const applicationId =
      req.params?.id;

    const documentId =
      req.params?.documentId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!applicationId) {
      return failure(
        res,
        400,
        'Application ID is required.'
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
      getApplicationService();

    const method =
      service?.removeDocument ||
      service?.deleteDocument;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Application document removal is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          applicationId,

          documentId,

          userId
        }
      );

    await createAuditLog(
      req,
      'APPLICATION_DOCUMENT_REMOVED',
      applicationId,
      {
        documentId
      }
    );

    return success(
      res,
      result,
      'Application document removed.'
    );
  } catch (error) {
    console.error(
      '[APPLICATION] Document removal error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to remove application document.',
      error
    );
  }
}

/* ============================================================
   12. APPLICATION HISTORY
   ============================================================ */

/**
 * GET /api/applications/:id/history
 */

async function getApplicationHistory(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const applicationId =
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
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
      getApplicationService();

    const method =
      service?.getHistory ||
      service?.getApplicationHistory;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Application history is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          applicationId,

          userId
        }
      );

    return success(
      res,
      result,
      'Application history retrieved.'
    );
  } catch (error) {
    console.error(
      '[APPLICATION] History error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve application history.',
      error
    );
  }
}

/* ============================================================
   13. APPLICATION PAYMENTS
   ============================================================ */

/**
 * GET /api/applications/:id/payments
 */

async function getApplicationPayments(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const applicationId =
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
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
      getApplicationService();

    const method =
      service?.getPayments ||
      service?.getApplicationPayments;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Application payment retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          applicationId,

          userId
        }
      );

    return success(
      res,
      result,
      'Application payments retrieved.'
    );
  } catch (error) {
    console.error(
      '[APPLICATION] Payments error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve application payments.',
      error
    );
  }
}

/* ============================================================
   14. APPLICATION VALIDATION
   ============================================================ */

/**
 * POST /api/applications/:id/validate
 */

async function validateApplication(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const applicationId =
      req.params?.id;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
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
      getApplicationService();

    const method =
      service?.validateApplication ||
      service?.validate;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Application validation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          applicationId,

          userId
        }
      );

    return success(
      res,
      result,
      'Application validation completed.'
    );
  } catch (error) {
    console.error(
      '[APPLICATION] Validation error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to validate application.',
      error
    );
  }
}

/* ============================================================
   15. ADMIN - LIST APPLICATIONS
   ============================================================ */

/**
 * GET /api/admin/applications
 *
 * This method is intentionally available here for route
 * compatibility if admin.routes.js uses application.controller.
 *
 * Prefer using admin.controller.js for administrative
 * application management.
 */

async function adminListApplications(
  req,
  res
) {
  try {
    const service =
      getApplicationService();

    if (!service) {
      return failure(
        res,
        503,
        'Application service is unavailable.'
      );
    }

    const pagination =
      getPagination(req);

    const method =
      service.getAdminApplications ||
      service.listApplications;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Administrative application listing is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          ...req.query,

          ...pagination
        }
      );

    return success(
      res,
      result,
      'Applications retrieved.'
    );
  } catch (error) {
    console.error(
      '[APPLICATION] Admin list error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve applications.',
      error
    );
  }
}

/* ============================================================
   16. ADMIN - UPDATE APPLICATION STATUS
   ============================================================ */

/**
 * PATCH /api/admin/applications/:id/status
 */

async function adminUpdateApplicationStatus(
  req,
  res
) {
  try {
    const applicationId =
      req.params?.id;

    const status =
      req.body?.status;

    if (!applicationId) {
      return failure(
        res,
        400,
        'Application ID is required.'
      );
    }

    if (
      typeof status !==
      'string' ||
      !status.trim()
    ) {
      return failure(
        res,
        400,
        'Application status is required.'
      );
    }

    const service =
      getApplicationService();

    const method =
      service?.adminUpdateStatus ||
      service?.updateStatus;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Administrative application status management is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          applicationId,

          status:
            status.trim(),

          adminId:
            getUserId(req),

          data:
            req.body || {}
        }
      );

    await createAuditLog(
      req,
      'ADMIN_APPLICATION_STATUS_CHANGED',
      applicationId,
      {
        status:
          status.trim()
      }
    );

    return success(
      res,
      result,
      'Application status updated.'
    );
  } catch (error) {
    console.error(
      '[APPLICATION] Admin status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update application status.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  createApplication,

  listMyApplications,

  getApplication,

  updateApplication,

  submitApplication,

  withdrawApplication,

  getApplicationStatus,

  getApplicationTimeline,

  getApplicationDocuments,

  addApplicationDocument,

  removeApplicationDocument,

  getApplicationHistory,

  getApplicationPayments,

  validateApplication,

  adminListApplications,

  adminUpdateApplicationStatus
};