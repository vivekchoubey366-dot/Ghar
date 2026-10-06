'use strict';

/**
 * ============================================================
 * GHAR - Support Controller
 * ============================================================
 *
 * Handles:
 * - Support categories
 * - FAQs
 * - Create support ticket
 * - Get support tickets
 * - Get support ticket
 * - Update support ticket
 * - Close support ticket
 * - Reopen support ticket
 * - Add ticket message
 * - Ticket attachments
 * - Contact support
 * - Help articles
 * - Support feedback
 *
 * Business logic:
 *     services/support.service.js
 *
 * Database logic:
 *     repositories/support.repository.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE LOADER
   ============================================================ */

function getSupportService() {
  try {
    return require('../services/support.service');
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
    config?.env?.app?.environment !== 'production' &&
    error
  ) {
    response.error =
      error.message ||
      String(error);
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
  const page = Math.max(
    parseInt(req.query?.page, 10) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      parseInt(req.query?.limit, 10) || 20,
      1
    ),
    100
  );

  return {
    page,
    limit,
    offset: (page - 1) * limit
  };
}

/* ============================================================
   AUDIT LOG
   ============================================================ */

async function createAuditLog(
  req,
  action,
  metadata = {}
) {
  try {
    let auditService;

    try {
      auditService =
        require('../services/audit.service');
    } catch {
      return;
    }

    if (
      typeof auditService?.create !==
      'function'
    ) {
      return;
    }

    await auditService.create({
      userId:
        getUserId(req),

      action,

      resource:
        'support',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.['user-agent'] ||
        null
    });
  } catch (error) {
    console.error(
      '[SUPPORT AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. SUPPORT CATEGORIES
   ============================================================ */

/**
 * GET /api/support/categories
 */

async function getSupportCategories(
  req,
  res
) {
  try {
    const service =
      getSupportService();

    const method =
      service?.getSupportCategories ||
      service?.getCategories;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Support categories are not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          activeOnly:
            req.query?.activeOnly !==
              'false'
        }
      );

    return success(
      res,
      result,
      'Support categories retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SUPPORT] Categories error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve support categories.',
      error
    );
  }
}

/* ============================================================
   2. FAQS
   ============================================================ */

/**
 * GET /api/support/faqs
 */

async function getFAQs(
  req,
  res
) {
  try {
    const service =
      getSupportService();

    const method =
      service?.getFAQs ||
      service?.getFaqs;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'FAQs are not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          category:
            req.query?.category ||
            null,

          query:
            req.query?.q ||
            req.query?.query ||
            null,

          page:
            pagination.page,

          limit:
            pagination.limit
        }
      );

    return success(
      res,
      result,
      'FAQs retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SUPPORT] FAQ error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve FAQs.',
      error
    );
  }
}

/* ============================================================
   3. FAQ BY ID
   ============================================================ */

/**
 * GET /api/support/faqs/:faqId
 */

async function getFAQ(
  req,
  res
) {
  try {
    const faqId =
      req.params?.faqId;

    if (!faqId) {
      return failure(
        res,
        400,
        'FAQ ID is required.'
      );
    }

    const service =
      getSupportService();

    const method =
      service?.getFAQ ||
      service?.getFaq;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'FAQ retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          faqId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'FAQ not found.'
      );
    }

    return success(
      res,
      result,
      'FAQ retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SUPPORT] Get FAQ error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve FAQ.',
      error
    );
  }
}

/* ============================================================
   4. CREATE SUPPORT TICKET
   ============================================================ */

/**
 * POST /api/support/tickets
 */

async function createTicket(
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

    const subject =
      String(
        req.body?.subject ||
        ''
      ).trim();

    const description =
      String(
        req.body?.description ||
        ''
      ).trim();

    if (!subject) {
      return failure(
        res,
        400,
        'Ticket subject is required.'
      );
    }

    if (!description) {
      return failure(
        res,
        400,
        'Ticket description is required.'
      );
    }

    const service =
      getSupportService();

    const method =
      service?.createTicket;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Support ticket creation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          subject,

          description,

          category:
            req.body?.category ||
            null,

          priority:
            req.body?.priority ||
            'normal',

          propertyId:
            req.body?.propertyId ||
            null,

          applicationId:
            req.body?.applicationId ||
            null,

          transactionId:
            req.body?.transactionId ||
            null,

          metadata:
            req.body?.metadata ||
            {}
        }
      );

    await createAuditLog(
      req,
      'SUPPORT_TICKET_CREATED',
      {
        ticketId:
          result?.id ||
          result?.ticketId ||
          null
      }
    );

    return success(
      res,
      result,
      'Support ticket created successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[SUPPORT] Create ticket error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to create support ticket.',
      error
    );
  }
}

/* ============================================================
   5. MY TICKETS
   ============================================================ */

/**
 * GET /api/support/tickets
 */

async function getMyTickets(
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
      getSupportService();

    const method =
      service?.getMyTickets ||
      service?.getTickets;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Support ticket listing is not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          userId,

          status:
            req.query?.status ||
            null,

          category:
            req.query?.category ||
            null,

          priority:
            req.query?.priority ||
            null,

          page:
            pagination.page,

          limit:
            pagination.limit
        }
      );

    return success(
      res,
      result,
      'Support tickets retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SUPPORT] Ticket listing error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve support tickets.',
      error
    );
  }
}

/* ============================================================
   6. GET TICKET
   ============================================================ */

/**
 * GET /api/support/tickets/:ticketId
 */

async function getTicket(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const ticketId =
      req.params?.ticketId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!ticketId) {
      return failure(
        res,
        400,
        'Ticket ID is required.'
      );
    }

    const service =
      getSupportService();

    const method =
      service?.getTicket;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Support ticket retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          ticketId,

          userId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Support ticket not found.'
      );
    }

    return success(
      res,
      result,
      'Support ticket retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SUPPORT] Get ticket error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve support ticket.',
      error
    );
  }
}

/* ============================================================
   7. UPDATE TICKET
   ============================================================ */

/**
 * PATCH /api/support/tickets/:ticketId
 */

async function updateTicket(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const ticketId =
      req.params?.ticketId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!ticketId) {
      return failure(
        res,
        400,
        'Ticket ID is required.'
      );
    }

    const allowedFields = [
      'subject',
      'category',
      'priority'
    ];

    const updates = {};

    for (
      const field of allowedFields
    ) {
      if (
        req.body?.[field] !==
        undefined
      ) {
        updates[field] =
          req.body[field];
      }
    }

    const service =
      getSupportService();

    const method =
      service?.updateTicket;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Support ticket update is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          ticketId,

          userId,

          updates
        }
      );

    return success(
      res,
      result,
      'Support ticket updated successfully.'
    );
  } catch (error) {
    console.error(
      '[SUPPORT] Update ticket error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update support ticket.',
      error
    );
  }
}

/* ============================================================
   8. ADD MESSAGE
   ============================================================ */

/**
 * POST /api/support/tickets/:ticketId/messages
 */

async function addTicketMessage(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const ticketId =
      req.params?.ticketId;

    const message =
      String(
        req.body?.message ||
        ''
      ).trim();

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!ticketId) {
      return failure(
        res,
        400,
        'Ticket ID is required.'
      );
    }

    if (!message) {
      return failure(
        res,
        400,
        'Message is required.'
      );
    }

    const service =
      getSupportService();

    const method =
      service?.addTicketMessage ||
      service?.addMessage;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Ticket messaging is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          ticketId,

          userId,

          message,

          attachments:
            req.body?.attachments ||
            []
        }
      );

    await createAuditLog(
      req,
      'SUPPORT_TICKET_MESSAGE_ADDED',
      {
        ticketId
      }
    );

    return success(
      res,
      result,
      'Ticket message added successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[SUPPORT] Add message error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to add ticket message.',
      error
    );
  }
}

/* ============================================================
   9. CLOSE TICKET
   ============================================================ */

/**
 * POST /api/support/tickets/:ticketId/close
 */

async function closeTicket(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const ticketId =
      req.params?.ticketId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!ticketId) {
      return failure(
        res,
        400,
        'Ticket ID is required.'
      );
    }

    const service =
      getSupportService();

    const method =
      service?.closeTicket;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Ticket closing is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          ticketId,

          userId,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'SUPPORT_TICKET_CLOSED',
      {
        ticketId
      }
    );

    return success(
      res,
      result,
      'Support ticket closed successfully.'
    );
  } catch (error) {
    console.error(
      '[SUPPORT] Close ticket error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to close support ticket.',
      error
    );
  }
}

/* ============================================================
   10. REOPEN TICKET
   ============================================================ */

/**
 * POST /api/support/tickets/:ticketId/reopen
 */

async function reopenTicket(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const ticketId =
      req.params?.ticketId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!ticketId) {
      return failure(
        res,
        400,
        'Ticket ID is required.'
      );
    }

    const service =
      getSupportService();

    const method =
      service?.reopenTicket;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Ticket reopening is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          ticketId,

          userId,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'SUPPORT_TICKET_REOPENED',
      {
        ticketId
      }
    );

    return success(
      res,
      result,
      'Support ticket reopened successfully.'
    );
  } catch (error) {
    console.error(
      '[SUPPORT] Reopen ticket error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to reopen support ticket.',
      error
    );
  }
}

/* ============================================================
   11. CONTACT SUPPORT
   ============================================================ */

/**
 * POST /api/support/contact
 */

async function contactSupport(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const name =
      String(
        req.body?.name ||
        ''
      ).trim();

    const email =
      String(
        req.body?.email ||
        ''
      ).trim();

    const message =
      String(
        req.body?.message ||
        ''
      ).trim();

    if (!message) {
      return failure(
        res,
        400,
        'Message is required.'
      );
    }

    const service =
      getSupportService();

    const method =
      service?.contactSupport;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Contact support is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId:

            userId,

          name,

          email,

          phone:
            req.body?.phone ||
            null,

          subject:
            req.body?.subject ||
            null,

          category:
            req.body?.category ||
            null,

          message
        }
      );

    return success(
      res,
      result,
      'Your support request has been submitted successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[SUPPORT] Contact error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to contact support.',
      error
    );
  }
}

/* ============================================================
   12. HELP ARTICLES
   ============================================================ */

/**
 * GET /api/support/articles
 */

async function getHelpArticles(
  req,
  res
) {
  try {
    const service =
      getSupportService();

    const method =
      service?.getHelpArticles ||
      service?.getArticles;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Help articles are not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          category:
            req.query?.category ||
            null,

          query:
            req.query?.q ||
            req.query?.query ||
            null,

          page:
            pagination.page,

          limit:
            pagination.limit
        }
      );

    return success(
      res,
      result,
      'Help articles retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SUPPORT] Articles error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve help articles.',
      error
    );
  }
}

/* ============================================================
   13. HELP ARTICLE BY ID
   ============================================================ */

/**
 * GET /api/support/articles/:articleId
 */

async function getHelpArticle(
  req,
  res
) {
  try {
    const articleId =
      req.params?.articleId;

    if (!articleId) {
      return failure(
        res,
        400,
        'Article ID is required.'
      );
    }

    const service =
      getSupportService();

    const method =
      service?.getHelpArticle ||
      service?.getArticle;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Help article retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          articleId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Help article not found.'
      );
    }

    return success(
      res,
      result,
      'Help article retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SUPPORT] Article error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve help article.',
      error
    );
  }
}

/* ============================================================
   14. SUBMIT SUPPORT FEEDBACK
   ============================================================ */

/**
 * POST /api/support/feedback
 */

async function submitFeedback(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const rating =
      Number(
        req.body?.rating
      );

    if (
      !Number.isFinite(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return failure(
        res,
        400,
        'Rating must be between 1 and 5.'
      );
    }

    const service =
      getSupportService();

    const method =
      service?.submitFeedback ||
      service?.createFeedback;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Support feedback is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId:

            userId,

          ticketId:
            req.body?.ticketId ||
            null,

          rating,

          feedback:
            req.body?.feedback ||
            null
        }
      );

    await createAuditLog(
      req,
      'SUPPORT_FEEDBACK_SUBMITTED',
      {
        ticketId:
          req.body?.ticketId ||
          null,

        rating
      }
    );

    return success(
      res,
      result,
      'Support feedback submitted successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[SUPPORT] Feedback error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to submit support feedback.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  getSupportCategories,

  getFAQs,

  getFAQ,

  createTicket,

  getMyTickets,

  getTicket,

  updateTicket,

  addTicketMessage,

  closeTicket,

  reopenTicket,

  contactSupport,

  getHelpArticles,

  getHelpArticle,

  submitFeedback
};