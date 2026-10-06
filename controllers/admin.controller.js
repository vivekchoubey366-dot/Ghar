'use strict';

/**
 * ============================================================
 * GHAR - Admin Controller
 * ============================================================
 *
 * Main administrative controller.
 *
 * Responsibilities:
 * - Admin dashboard
 * - User management
 * - Property management
 * - Application management
 * - Payment management
 * - Loan management
 * - Document management
 * - Reports
 * - Audit logs
 * - Administrative actions
 *
 * IMPORTANT:
 * - Protect these endpoints with authentication + admin
 *   authorization middleware.
 * - Never expose passwords, tokens, API keys or secrets.
 * - Business/database logic belongs in services.
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE HELPERS
   ============================================================ */

function loadService(name) {
  try {
    return require(`../services/${name}`);
  } catch (error) {
    return null;
  }
}

function getService(...names) {
  for (const name of names) {
    const service = loadService(name);

    if (service) {
      return service;
    }
  }

  return null;
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

  /*
   * Never expose internal errors in production.
   */

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

  const offset =
    (page - 1) * limit;

  return {
    page,
    limit,
    offset
  };
}

/* ============================================================
   SAFE ADMIN
   ============================================================ */

function getAdminId(req) {
  return (
    req.user?.id ||
    req.user?.userId ||
    req.admin?.id ||
    null
  );
}

/* ============================================================
   AUDIT LOG
   ============================================================ */

async function createAuditLog(
  req,
  action,
  resource,
  resourceId = null,
  metadata = {}
) {
  try {
    const auditService =
      getService(
        'audit.service',
        'admin-audit.service'
      );

    if (
      auditService &&
      typeof auditService.create ===
        'function'
    ) {
      await auditService.create({
        adminId:
          getAdminId(req),

        action,

        resource,

        resourceId,

        metadata,

        ipAddress:
          req.ip ||
          req.headers?.['x-forwarded-for'] ||
          null,

        userAgent:
          req.headers?.['user-agent'] ||
          null
      });
    }
  } catch (error) {
    /*
     * Audit failure should not normally break
     * the primary administrative operation.
     */

    console.error(
      '[ADMIN AUDIT] Failed to create audit log:',
      error
    );
  }
}

/* ============================================================
   1. ADMIN DASHBOARD
   ============================================================ */

/**
 * GET /api/admin/dashboard
 */

async function getDashboard(
  req,
  res
) {
  try {
    const dashboardService =
      getService(
        'dashboard.service',
        'admin-dashboard.service'
      );

    if (
      dashboardService &&
      typeof dashboardService.getAdminDashboard ===
        'function'
    ) {
      const data =
        await dashboardService.getAdminDashboard();

      return success(
        res,
        data,
        'Admin dashboard retrieved.'
      );
    }

    /*
     * Fallback using individual services.
     */

    const userService =
      getService(
        'user.service',
        'users.service'
      );

    const propertyService =
      getService(
        'property.service',
        'properties.service'
      );

    const applicationService =
      getService(
        'application.service',
        'applications.service'
      );

    const paymentService =
      getService(
        'payment.service',
        'payments.service'
      );

    const loanService =
      getService(
        'loan.service',
        'loans.service'
      );

    const results = await Promise.all([
      userService?.getAdminStats
        ? userService.getAdminStats()
        : null,

      propertyService?.getAdminStats
        ? propertyService.getAdminStats()
        : null,

      applicationService?.getAdminStats
        ? applicationService.getAdminStats()
        : null,

      paymentService?.getAdminStats
        ? paymentService.getAdminStats()
        : null,

      loanService?.getAdminStats
        ? loanService.getAdminStats()
        : null
    ]);

    return success(
      res,
      {
        users: results[0],
        properties: results[1],
        applications: results[2],
        payments: results[3],
        loans: results[4]
      },
      'Admin dashboard retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Dashboard error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve admin dashboard.',
      error
    );
  }
}

/* ============================================================
   2. DASHBOARD STATISTICS
   ============================================================ */

/**
 * GET /api/admin/statistics
 */

async function getStatistics(
  req,
  res
) {
  try {
    const service =
      getService(
        'analytics.service',
        'admin-analytics.service',
        'dashboard.service'
      );

    if (
      !service
    ) {
      return failure(
        res,
        501,
        'Admin analytics service is not configured.'
      );
    }

    const method =
      service.getAdminStatistics ||
      service.getStatistics ||
      service.getDashboardStatistics;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Admin statistics are not implemented.'
      );
    }

    const data =
      await method.call(
        service,
        req.query
      );

    return success(
      res,
      data,
      'Admin statistics retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Statistics error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve admin statistics.',
      error
    );
  }
}

/* ============================================================
   3. LIST USERS
   ============================================================ */

/**
 * GET /api/admin/users
 */

async function listUsers(
  req,
  res
) {
  try {
    const service =
      getService(
        'user.service',
        'users.service'
      );

    if (
      !service
    ) {
      return failure(
        res,
        501,
        'User service is not configured.'
      );
    }

    const pagination =
      getPagination(req);

    const method =
      service.getAdminUsers ||
      service.listUsers ||
      service.getUsers;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'User listing is not implemented.'
      );
    }

    const data =
      await method.call(
        service,
        {
          ...req.query,
          ...pagination
        }
      );

    return success(
      res,
      data,
      'Users retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] List users error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve users.',
      error
    );
  }
}

/* ============================================================
   4. GET USER
   ============================================================ */

/**
 * GET /api/admin/users/:id
 */

async function getUser(
  req,
  res
) {
  try {
    const userId =
      req.params?.id;

    if (
      !userId
    ) {
      return failure(
        res,
        400,
        'User ID is required.'
      );
    }

    const service =
      getService(
        'user.service',
        'users.service'
      );

    if (
      !service
    ) {
      return failure(
        res,
        501,
        'User service is not configured.'
      );
    }

    const method =
      service.getAdminUser ||
      service.getUserById ||
      service.findById;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'User retrieval is not implemented.'
      );
    }

    const data =
      await method.call(
        service,
        userId
      );

    if (
      !data
    ) {
      return failure(
        res,
        404,
        'User not found.'
      );
    }

    return success(
      res,
      data,
      'User retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Get user error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve user.',
      error
    );
  }
}

/* ============================================================
   5. UPDATE USER
   ============================================================ */

/**
 * PATCH /api/admin/users/:id
 */

async function updateUser(
  req,
  res
) {
  try {
    const userId =
      req.params?.id;

    if (
      !userId
    ) {
      return failure(
        res,
        400,
        'User ID is required.'
      );
    }

    const service =
      getService(
        'user.service',
        'users.service'
      );

    if (
      !service
    ) {
      return failure(
        res,
        501,
        'User service is not configured.'
      );
    }

    const method =
      service.adminUpdateUser ||
      service.updateUser;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'User update is not implemented.'
      );
    }

    const data =
      await method.call(
        service,
        userId,
        req.body || {}
      );

    await createAuditLog(
      req,
      'USER_UPDATED',
      'user',
      userId,
      {
        fields:
          Object.keys(
            req.body || {}
          )
      }
    );

    return success(
      res,
      data,
      'User updated.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Update user error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update user.',
      error
    );
  }
}

/* ============================================================
   6. CHANGE USER STATUS
   ============================================================ */

/**
 * PATCH /api/admin/users/:id/status
 */

async function updateUserStatus(
  req,
  res
) {
  try {
    const userId =
      req.params?.id;

    const status =
      req.body?.status;

    if (
      !userId
    ) {
      return failure(
        res,
        400,
        'User ID is required.'
      );
    }

    if (
      !status ||
      typeof status !==
        'string'
    ) {
      return failure(
        res,
        400,
        'User status is required.'
      );
    }

    const service =
      getService(
        'user.service',
        'users.service'
      );

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
        'User status management is not implemented.'
      );
    }

    const data =
      await method.call(
        service,
        userId,
        status
      );

    await createAuditLog(
      req,
      'USER_STATUS_CHANGED',
      'user',
      userId,
      {
        status
      }
    );

    return success(
      res,
      data,
      'User status updated.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] User status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update user status.',
      error
    );
  }
}

/* ============================================================
   7. LIST PROPERTIES
   ============================================================ */

/**
 * GET /api/admin/properties
 */

async function listProperties(
  req,
  res
) {
  try {
    const service =
      getService(
        'property.service',
        'properties.service'
      );

    if (
      !service
    ) {
      return failure(
        res,
        501,
        'Property service is not configured.'
      );
    }

    const pagination =
      getPagination(req);

    const method =
      service.getAdminProperties ||
      service.listProperties ||
      service.getProperties;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property listing is not implemented.'
      );
    }

    const data =
      await method.call(
        service,
        {
          ...req.query,
          ...pagination
        }
      );

    return success(
      res,
      data,
      'Properties retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Properties error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve properties.',
      error
    );
  }
}

/* ============================================================
   8. PROPERTY MODERATION
   ============================================================ */

/**
 * PATCH /api/admin/properties/:id/status
 */

async function updatePropertyStatus(
  req,
  res
) {
  try {
    const propertyId =
      req.params?.id;

    const status =
      req.body?.status;

    if (
      !propertyId
    ) {
      return failure(
        res,
        400,
        'Property ID is required.'
      );
    }

    if (
      !status
    ) {
      return failure(
        res,
        400,
        'Property status is required.'
      );
    }

    const service =
      getService(
        'property.service',
        'properties.service'
      );

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
        'Property moderation is not implemented.'
      );
    }

    const data =
      await method.call(
        service,
        propertyId,
        status,
        {
          adminId:
            getAdminId(req)
        }
      );

    await createAuditLog(
      req,
      'PROPERTY_STATUS_CHANGED',
      'property',
      propertyId,
      {
        status
      }
    );

    return success(
      res,
      data,
      'Property status updated.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Property moderation error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update property status.',
      error
    );
  }
}

/* ============================================================
   9. FEATURE / UNFEATURE PROPERTY
   ============================================================ */

/**
 * PATCH /api/admin/properties/:id/featured
 */

async function updatePropertyFeatured(
  req,
  res
) {
  try {
    const propertyId =
      req.params?.id;

    const featured =
      req.body?.featured;

    if (
      !propertyId
    ) {
      return failure(
        res,
        400,
        'Property ID is required.'
      );
    }

    if (
      typeof featured !==
      'boolean'
    ) {
      return failure(
        res,
        400,
        'featured must be a boolean.'
      );
    }

    const service =
      getService(
        'property.service',
        'properties.service'
      );

    const method =
      service?.setFeatured ||
      service?.updateFeatured;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property featuring is not implemented.'
      );
    }

    const data =
      await method.call(
        service,
        propertyId,
        featured,
        getAdminId(req)
      );

    await createAuditLog(
      req,
      featured
        ? 'PROPERTY_FEATURED'
        : 'PROPERTY_UNFEATURED',
      'property',
      propertyId
    );

    return success(
      res,
      data,
      featured
        ? 'Property featured.'
        : 'Property unfeatured.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Featured property error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update featured property.',
      error
    );
  }
}

/* ============================================================
   10. LIST APPLICATIONS
   ============================================================ */

/**
 * GET /api/admin/applications
 */

async function listApplications(
  req,
  res
) {
  try {
    const service =
      getService(
        'application.service',
        'applications.service'
      );

    if (
      !service
    ) {
      return failure(
        res,
        501,
        'Application service is not configured.'
      );
    }

    const pagination =
      getPagination(req);

    const method =
      service.getAdminApplications ||
      service.listApplications ||
      service.getApplications;

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

    const data =
      await method.call(
        service,
        {
          ...req.query,
          ...pagination
        }
      );

    return success(
      res,
      data,
      'Applications retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Applications error:',
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
   11. UPDATE APPLICATION
   ============================================================ */

/**
 * PATCH /api/admin/applications/:id/status
 */

async function updateApplicationStatus(
  req,
  res
) {
  try {
    const applicationId =
      req.params?.id;

    const status =
      req.body?.status;

    if (
      !applicationId
    ) {
      return failure(
        res,
        400,
        'Application ID is required.'
      );
    }

    if (
      !status
    ) {
      return failure(
        res,
        400,
        'Application status is required.'
      );
    }

    const service =
      getService(
        'application.service',
        'applications.service'
      );

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
        'Application status management is not implemented.'
      );
    }

    const data =
      await method.call(
        service,
        applicationId,
        status,
        {
          adminId:
            getAdminId(req)
        }
      );

    await createAuditLog(
      req,
      'APPLICATION_STATUS_CHANGED',
      'application',
      applicationId,
      {
        status
      }
    );

    return success(
      res,
      data,
      'Application status updated.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Application status error:',
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
   12. LIST PAYMENTS
   ============================================================ */

/**
 * GET /api/admin/payments
 */

async function listPayments(
  req,
  res
) {
  try {
    const service =
      getService(
        'payment.service',
        'payments.service'
      );

    if (
      !service
    ) {
      return failure(
        res,
        501,
        'Payment service is not configured.'
      );
    }

    const pagination =
      getPagination(req);

    const method =
      service.getAdminPayments ||
      service.listPayments ||
      service.getPayments;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Payment listing is not implemented.'
      );
    }

    const data =
      await method.call(
        service,
        {
          ...req.query,
          ...pagination
        }
      );

    return success(
      res,
      data,
      'Payments retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Payments error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve payments.',
      error
    );
  }
}

/* ============================================================
   13. PAYMENT DETAILS
   ============================================================ */

/**
 * GET /api/admin/payments/:id
 */

async function getPayment(
  req,
  res
) {
  try {
    const paymentId =
      req.params?.id;

    if (
      !paymentId
    ) {
      return failure(
        res,
        400,
        'Payment ID is required.'
      );
    }

    const service =
      getService(
        'payment.service',
        'payments.service'
      );

    const method =
      service?.getAdminPayment ||
      service?.getPaymentById ||
      service?.findById;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Payment retrieval is not implemented.'
      );
    }

    const data =
      await method.call(
        service,
        paymentId
      );

    if (
      !data
    ) {
      return failure(
        res,
        404,
        'Payment not found.'
      );
    }

    return success(
      res,
      data,
      'Payment retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Payment details error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve payment.',
      error
    );
  }
}

/* ============================================================
   14. LIST LOANS
   ============================================================ */

/**
 * GET /api/admin/loans
 */

async function listLoans(
  req,
  res
) {
  try {
    const service =
      getService(
        'loan.service',
        'loans.service'
      );

    if (
      !service
    ) {
      return failure(
        res,
        501,
        'Loan service is not configured.'
      );
    }

    const pagination =
      getPagination(req);

    const method =
      service.getAdminLoans ||
      service.listLoans ||
      service.getLoans;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Loan listing is not implemented.'
      );
    }

    const data =
      await method.call(
        service,
        {
          ...req.query,
          ...pagination
        }
      );

    return success(
      res,
      data,
      'Loans retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Loans error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve loans.',
      error
    );
  }
}

/* ============================================================
   15. UPDATE LOAN STATUS
   ============================================================ */

/**
 * PATCH /api/admin/loans/:id/status
 */

async function updateLoanStatus(
  req,
  res
) {
  try {
    const loanId =
      req.params?.id;

    const status =
      req.body?.status;

    if (
      !loanId
    ) {
      return failure(
        res,
        400,
        'Loan ID is required.'
      );
    }

    if (
      !status
    ) {
      return failure(
        res,
        400,
        'Loan status is required.'
      );
    }

    const service =
      getService(
        'loan.service',
        'loans.service'
      );

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
        'Loan status management is not implemented.'
      );
    }

    const data =
      await method.call(
        service,
        loanId,
        status,
        {
          adminId:
            getAdminId(req)
        }
      );

    await createAuditLog(
      req,
      'LOAN_STATUS_CHANGED',
      'loan',
      loanId,
      {
        status
      }
    );

    return success(
      res,
      data,
      'Loan status updated.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Loan status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update loan status.',
      error
    );
  }
}

/* ============================================================
   16. LIST DOCUMENTS
   ============================================================ */

/**
 * GET /api/admin/documents
 */

async function listDocuments(
  req,
  res
) {
  try {
    const service =
      getService(
        'document.service',
        'documents.service'
      );

    if (
      !service
    ) {
      return failure(
        res,
        501,
        'Document service is not configured.'
      );
    }

    const pagination =
      getPagination(req);

    const method =
      service.getAdminDocuments ||
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

    const data =
      await method.call(
        service,
        {
          ...req.query,
          ...pagination
        }
      );

    return success(
      res,
      data,
      'Documents retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Documents error:',
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
   17. UPDATE DOCUMENT STATUS
   ============================================================ */

/**
 * PATCH /api/admin/documents/:id/status
 */

async function updateDocumentStatus(
  req,
  res
) {
  try {
    const documentId =
      req.params?.id;

    const status =
      req.body?.status;

    if (
      !documentId
    ) {
      return failure(
        res,
        400,
        'Document ID is required.'
      );
    }

    if (
      !status
    ) {
      return failure(
        res,
        400,
        'Document status is required.'
      );
    }

    const service =
      getService(
        'document.service',
        'documents.service'
      );

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
        'Document status management is not implemented.'
      );
    }

    const data =
      await method.call(
        service,
        documentId,
        status,
        {
          adminId:
            getAdminId(req)
        }
      );

    await createAuditLog(
      req,
      'DOCUMENT_STATUS_CHANGED',
      'document',
      documentId,
      {
        status
      }
    );

    return success(
      res,
      data,
      'Document status updated.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Document status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update document status.',
      error
    );
  }
}

/* ============================================================
   18. LIST AUDIT LOGS
   ============================================================ */

/**
 * GET /api/admin/audit-logs
 */

async function listAuditLogs(
  req,
  res
) {
  try {
    const service =
      getService(
        'audit.service',
        'admin-audit.service'
      );

    if (
      !service
    ) {
      return failure(
        res,
        501,
        'Audit service is not configured.'
      );
    }

    const pagination =
      getPagination(req);

    const method =
      service.list ||
      service.getLogs ||
      service.getAuditLogs;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Audit log retrieval is not implemented.'
      );
    }

    const data =
      await method.call(
        service,
        {
          ...req.query,
          ...pagination
        }
      );

    return success(
      res,
      data,
      'Audit logs retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Audit logs error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve audit logs.',
      error
    );
  }
}

/* ============================================================
   19. ADMIN REPORT
   ============================================================ */

/**
 * GET /api/admin/reports
 */

async function getReports(
  req,
  res
) {
  try {
    const service =
      getService(
        'report.service',
        'reports.service',
        'analytics.service'
      );

    if (
      !service
    ) {
      return failure(
        res,
        501,
        'Reporting service is not configured.'
      );
    }

    const method =
      service.getAdminReports ||
      service.getReports ||
      service.generateReport;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Admin reporting is not implemented.'
      );
    }

    const data =
      await method.call(
        service,
        req.query
      );

    return success(
      res,
      data,
      'Admin reports retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Reports error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve reports.',
      error
    );
  }
}

/* ============================================================
   20. SEARCH ADMIN DATA
   ============================================================ */

/**
 * GET /api/admin/search
 */

async function search(
  req,
  res
) {
  try {
    const query =
      typeof req.query?.q ===
      'string'
        ? req.query.q.trim()
        : '';

    if (
      !query
    ) {
      return failure(
        res,
        400,
        'Search query is required.'
      );
    }

    if (
      query.length >
      200
    ) {
      return failure(
        res,
        400,
        'Search query is too long.'
      );
    }

    const service =
      getService(
        'admin-search.service',
        'search.service'
      );

    if (
      !service
    ) {
      return failure(
        res,
        501,
        'Admin search service is not configured.'
      );
    }

    const method =
      service.adminSearch ||
      service.search;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Admin search is not implemented.'
      );
    }

    const data =
      await method.call(
        service,
        {
          query,
          ...req.query
        }
      );

    return success(
      res,
      data,
      'Admin search completed.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Search error:',
      error
    );

    return failure(
      res,
      500,
      'Admin search failed.',
      error
    );
  }
}

/* ============================================================
   21. SYSTEM HEALTH
   ============================================================ */

/**
 * GET /api/admin/system/health
 */

async function systemHealth(
  req,
  res
) {
  try {
    const healthService =
      getService(
        'health.service',
        'system.service'
      );

    const result = {
      timestamp:
        new Date().toISOString(),

      environment:
        config?.env?.app?.environment ||
        null,

      database:
        null,

      services:
        {}
    };

    if (
      healthService &&
      typeof healthService.getSystemHealth ===
        'function'
    ) {
      result.services =
        await healthService.getSystemHealth();
    }

    const database =
      config?.database;

    if (
      database &&
      typeof database.isConnected ===
        'function'
    ) {
      result.database = {
        connected:
          database.isConnected()
      };
    }

    return success(
      res,
      result,
      'System health retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] System health error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve system health.',
      error
    );
  }
}

/* ============================================================
   22. SYSTEM INFORMATION
   ============================================================ */

/**
 * GET /api/admin/system
 */

async function systemInfo(
  req,
  res
) {
  try {
    return success(
      res,
      {
        application:
          'GHAR',

        environment:
          config?.env?.app?.environment ||
          process.env.NODE_ENV ||
          'development',

        version:
          config?.env?.app?.version ||
          process.env.npm_package_version ||
          null,

        node:
          process.version,

        platform:
          process.platform,

        architecture:
          process.arch,

        uptime:
          process.uptime(),

        timestamp:
          new Date().toISOString()
      },
      'System information retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] System information error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve system information.',
      error
    );
  }
}

/* ============================================================
   23. ADMIN PROFILE
   ============================================================ */

/**
 * GET /api/admin/me
 */

async function getCurrentAdmin(
  req,
  res
) {
  try {
    const adminId =
      getAdminId(req);

    if (
      !adminId
    ) {
      return failure(
        res,
        401,
        'Administrator authentication required.'
      );
    }

    const service =
      getService(
        'user.service',
        'users.service',
        'admin.service'
      );

    const method =
      service?.getAdminById ||
      service?.getUserById ||
      service?.findById;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Admin profile retrieval is not implemented.'
      );
    }

    const admin =
      await method.call(
        service,
        adminId
      );

    if (
      !admin
    ) {
      return failure(
        res,
        404,
        'Administrator not found.'
      );
    }

    return success(
      res,
      admin,
      'Administrator profile retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN] Profile error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve administrator profile.',
      error
    );
  }
}

/* ============================================================
   24. EXPORTS
   ============================================================ */

module.exports = {
  getDashboard,

  getStatistics,

  listUsers,

  getUser,

  updateUser,

  updateUserStatus,

  listProperties,

  updatePropertyStatus,

  updatePropertyFeatured,

  listApplications,

  updateApplicationStatus,

  listPayments,

  getPayment,

  listLoans,

  updateLoanStatus,

  listDocuments,

  updateDocumentStatus,

  listAuditLogs,

  getReports,

  search,

  systemHealth,

  systemInfo,

  getCurrentAdmin
};