'use strict';

/**
 * ============================================================
 * GHAR - Message Controller
 * ============================================================
 *
 * Handles:
 * - Conversations
 * - Direct messages
 * - Property enquiry messages
 * - Sending messages
 * - Reading messages
 * - Marking messages as read
 * - Unread counts
 * - Message deletion
 * - Conversation archiving
 * - Blocking/reporting users
 *
 * Business logic:
 *     services/message.service.js
 *
 * Database logic:
 *     repositories/message.repository.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE
   ============================================================ */

function getMessageService() {
  try {
    return require('../services/message.service');
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
   USER HELPERS
   ============================================================ */

function getUserId(req) {
  return (
    req.user?.id ||
    req.user?.userId ||
    null
  );
}

/* ============================================================
   PARAMETER HELPERS
   ============================================================ */

function getConversationId(req) {
  return (
    req.params?.conversationId ||
    req.params?.id ||
    req.body?.conversationId ||
    null
  );
}

function getMessageId(req) {
  return (
    req.params?.messageId ||
    req.params?.id ||
    req.body?.messageId ||
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
      parseInt(req.query?.limit, 10) || 30,
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
   AUDIT
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
      userId: getUserId(req),
      action,
      resource: 'message',
      metadata,
      ipAddress: req.ip || null,
      userAgent:
        req.headers?.['user-agent'] || null
    });
  } catch (error) {
    console.error(
      '[MESSAGE AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. CONVERSATIONS
   ============================================================ */

/**
 * GET /api/messages/conversations
 */

async function getConversations(
  req,
  res
) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const service = getMessageService();

    const method =
      service?.getConversations ||
      service?.listConversations;

    if (typeof method !== 'function') {
      return failure(
        res,
        501,
        'Conversation service is not implemented.'
      );
    }

    const pagination = getPagination(req);

    const result = await method.call(
      service,
      {
        userId,
        page: pagination.page,
        limit: pagination.limit,
        status:
          req.query?.status || 'active'
      }
    );

    return success(
      res,
      result,
      'Conversations retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Conversations error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve conversations.',
      error
    );
  }
}

/* ============================================================
   2. CONVERSATION DETAILS
   ============================================================ */

/**
 * GET /api/messages/conversations/:conversationId
 */

async function getConversation(
  req,
  res
) {
  try {
    const userId = getUserId(req);
    const conversationId =
      getConversationId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!conversationId) {
      return failure(
        res,
        400,
        'Conversation ID is required.'
      );
    }

    const service = getMessageService();

    const method =
      service?.getConversation ||
      service?.findConversation;

    if (typeof method !== 'function') {
      return failure(
        res,
        501,
        'Conversation retrieval is not implemented.'
      );
    }

    const result = await method.call(
      service,
      {
        conversationId,
        userId
      }
    );

    if (!result) {
      return failure(
        res,
        404,
        'Conversation not found.'
      );
    }

    return success(
      res,
      result,
      'Conversation retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Get conversation error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve conversation.',
      error
    );
  }
}

/* ============================================================
   3. CREATE CONVERSATION
   ============================================================ */

/**
 * POST /api/messages/conversations
 *
 * Body:
 * {
 *   recipientId: "...",
 *   propertyId: "...",
 *   subject: "Property enquiry"
 * }
 */

async function createConversation(
  req,
  res
) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const recipientId =
      req.body?.recipientId ||
      req.body?.userId ||
      null;

    if (!recipientId) {
      return failure(
        res,
        400,
        'Recipient ID is required.'
      );
    }

    if (
      String(recipientId) ===
      String(userId)
    ) {
      return failure(
        res,
        400,
        'You cannot create a conversation with yourself.'
      );
    }

    const service = getMessageService();

    const method =
      service?.createConversation ||
      service?.startConversation;

    if (typeof method !== 'function') {
      return failure(
        res,
        501,
        'Conversation creation is not implemented.'
      );
    }

    const result = await method.call(
      service,
      {
        userId,
        recipientId,

        propertyId:
          req.body?.propertyId || null,

        applicationId:
          req.body?.applicationId || null,

        offerId:
          req.body?.offerId || null,

        subject:
          req.body?.subject || null
      }
    );

    await createAuditLog(
      req,
      'CONVERSATION_CREATED',
      {
        conversationId:
          result?.id ||
          result?.conversationId ||
          null
      }
    );

    return success(
      res,
      result,
      'Conversation created successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Create conversation error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to create conversation.',
      error
    );
  }
}

/* ============================================================
   4. SEND MESSAGE
   ============================================================ */

/**
 * POST /api/messages
 */

async function sendMessage(
  req,
  res
) {
  try {
    const senderId = getUserId(req);

    if (!senderId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const content =
      typeof req.body?.content === 'string'
        ? req.body.content.trim()
        : '';

    if (!content) {
      return failure(
        res,
        400,
        'Message content is required.'
      );
    }

    if (content.length > 10000) {
      return failure(
        res,
        400,
        'Message is too long.'
      );
    }

    const service = getMessageService();

    const method =
      service?.sendMessage ||
      service?.createMessage;

    if (typeof method !== 'function') {
      return failure(
        res,
        501,
        'Message sending is not implemented.'
      );
    }

    const result = await method.call(
      service,
      {
        senderId,

        recipientId:
          req.body?.recipientId ||
          null,

        conversationId:
          req.body?.conversationId ||
          null,

        propertyId:
          req.body?.propertyId ||
          null,

        applicationId:
          req.body?.applicationId ||
          null,

        offerId:
          req.body?.offerId ||
          null,

        content,

        messageType:
          req.body?.messageType ||
          'text',

        attachments:
          Array.isArray(
            req.body?.attachments
          )
            ? req.body.attachments
            : []
      }
    );

    await createAuditLog(
      req,
      'MESSAGE_SENT',
      {
        messageId:
          result?.id ||
          result?.messageId ||
          null,

        conversationId:
          result?.conversationId ||
          req.body?.conversationId ||
          null
      }
    );

    return success(
      res,
      result,
      'Message sent successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Send error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to send message.',
      error
    );
  }
}

/* ============================================================
   5. GET MESSAGES
   ============================================================ */

/**
 * GET /api/messages/conversations/:conversationId/messages
 */

async function getMessages(
  req,
  res
) {
  try {
    const userId = getUserId(req);
    const conversationId =
      getConversationId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!conversationId) {
      return failure(
        res,
        400,
        'Conversation ID is required.'
      );
    }

    const service = getMessageService();

    const method =
      service?.getMessages ||
      service?.listMessages;

    if (typeof method !== 'function') {
      return failure(
        res,
        501,
        'Message retrieval is not implemented.'
      );
    }

    const pagination = getPagination(req);

    const result = await method.call(
      service,
      {
        userId,
        conversationId,
        page: pagination.page,
        limit: pagination.limit,
        before:
          req.query?.before || null,
        after:
          req.query?.after || null
      }
    );

    return success(
      res,
      result,
      'Messages retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Get messages error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve messages.',
      error
    );
  }
}

/* ============================================================
   6. GET SINGLE MESSAGE
   ============================================================ */

/**
 * GET /api/messages/:messageId
 */

async function getMessage(
  req,
  res
) {
  try {
    const userId = getUserId(req);
    const messageId =
      getMessageId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!messageId) {
      return failure(
        res,
        400,
        'Message ID is required.'
      );
    }

    const service = getMessageService();

    const method =
      service?.getMessage ||
      service?.findMessage;

    if (typeof method !== 'function') {
      return failure(
        res,
        501,
        'Message retrieval is not implemented.'
      );
    }

    const result = await method.call(
      service,
      {
        messageId,
        userId
      }
    );

    if (!result) {
      return failure(
        res,
        404,
        'Message not found.'
      );
    }

    return success(
      res,
      result,
      'Message retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Get message error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve message.',
      error
    );
  }
}

/* ============================================================
   7. MARK MESSAGE AS READ
   ============================================================ */

/**
 * PATCH /api/messages/:messageId/read
 */

async function markMessageRead(
  req,
  res
) {
  try {
    const userId = getUserId(req);
    const messageId =
      getMessageId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!messageId) {
      return failure(
        res,
        400,
        'Message ID is required.'
      );
    }

    const service = getMessageService();

    const method =
      service?.markMessageRead ||
      service?.markAsRead;

    if (typeof method !== 'function') {
      return failure(
        res,
        501,
        'Message read tracking is not implemented.'
      );
    }

    const result = await method.call(
      service,
      {
        messageId,
        userId
      }
    );

    return success(
      res,
      result,
      'Message marked as read.'
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Mark read error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to mark message as read.',
      error
    );
  }
}

/* ============================================================
   8. MARK CONVERSATION AS READ
   ============================================================ */

/**
 * PATCH /api/messages/conversations/:conversationId/read
 */

async function markConversationRead(
  req,
  res
) {
  try {
    const userId = getUserId(req);
    const conversationId =
      getConversationId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!conversationId) {
      return failure(
        res,
        400,
        'Conversation ID is required.'
      );
    }

    const service = getMessageService();

    const method =
      service?.markConversationRead ||
      service?.markAllConversationMessagesRead;

    if (typeof method !== 'function') {
      return failure(
        res,
        501,
        'Conversation read tracking is not implemented.'
      );
    }

    const result = await method.call(
      service,
      {
        conversationId,
        userId
      }
    );

    return success(
      res,
      result,
      'Conversation marked as read.'
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Conversation read error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to mark conversation as read.',
      error
    );
  }
}

/* ============================================================
   9. UNREAD COUNT
   ============================================================ */

/**
 * GET /api/messages/unread-count
 */

async function getUnreadCount(
  req,
  res
) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const service = getMessageService();

    const method =
      service?.getUnreadCount ||
      service?.countUnreadMessages;

    if (typeof method !== 'function') {
      return success(
        res,
        {
          count: 0
        },
        'Unread message count retrieved successfully.'
      );
    }

    const result = await method.call(
      service,
      {
        userId
      }
    );

    return success(
      res,
      result,
      'Unread message count retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Unread count error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve unread count.',
      error
    );
  }
}

/* ============================================================
   10. ARCHIVE CONVERSATION
   ============================================================ */

/**
 * PATCH /api/messages/conversations/:conversationId/archive
 */

async function archiveConversation(
  req,
  res
) {
  try {
    const userId = getUserId(req);
    const conversationId =
      getConversationId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!conversationId) {
      return failure(
        res,
        400,
        'Conversation ID is required.'
      );
    }

    const service = getMessageService();

    const method =
      service?.archiveConversation ||
      service?.archive;

    if (typeof method !== 'function') {
      return failure(
        res,
        501,
        'Conversation archiving is not implemented.'
      );
    }

    const result = await method.call(
      service,
      {
        conversationId,
        userId
      }
    );

    await createAuditLog(
      req,
      'CONVERSATION_ARCHIVED',
      {
        conversationId
      }
    );

    return success(
      res,
      result,
      'Conversation archived successfully.'
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Archive error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to archive conversation.',
      error
    );
  }
}

/* ============================================================
   11. UNARCHIVE CONVERSATION
   ============================================================ */

/**
 * PATCH /api/messages/conversations/:conversationId/unarchive
 */

async function unarchiveConversation(
  req,
  res
) {
  try {
    const userId = getUserId(req);
    const conversationId =
      getConversationId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!conversationId) {
      return failure(
        res,
        400,
        'Conversation ID is required.'
      );
    }

    const service = getMessageService();

    const method =
      service?.unarchiveConversation ||
      service?.unarchive;

    if (typeof method !== 'function') {
      return failure(
        res,
        501,
        'Conversation unarchiving is not implemented.'
      );
    }

    const result = await method.call(
      service,
      {
        conversationId,
        userId
      }
    );

    return success(
      res,
      result,
      'Conversation restored successfully.'
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Unarchive error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to restore conversation.',
      error
    );
  }
}

/* ============================================================
   12. DELETE MESSAGE
   ============================================================ */

/**
 * DELETE /api/messages/:messageId
 */

async function deleteMessage(
  req,
  res
) {
  try {
    const userId = getUserId(req);
    const messageId =
      getMessageId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!messageId) {
      return failure(
        res,
        400,
        'Message ID is required.'
      );
    }

    const service = getMessageService();

    const method =
      service?.deleteMessage ||
      service?.removeMessage;

    if (typeof method !== 'function') {
      return failure(
        res,
        501,
        'Message deletion is not implemented.'
      );
    }

    const result = await method.call(
      service,
      {
        messageId,
        userId
      }
    );

    await createAuditLog(
      req,
      'MESSAGE_DELETED',
      {
        messageId
      }
    );

    return success(
      res,
      result,
      'Message deleted successfully.'
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Delete error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to delete message.',
      error
    );
  }
}

/* ============================================================
   13. DELETE CONVERSATION
   ============================================================ */

/**
 * DELETE /api/messages/conversations/:conversationId
 */

async function deleteConversation(
  req,
  res
) {
  try {
    const userId = getUserId(req);
    const conversationId =
      getConversationId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!conversationId) {
      return failure(
        res,
        400,
        'Conversation ID is required.'
      );
    }

    const service = getMessageService();

    const method =
      service?.deleteConversation ||
      service?.removeConversation;

    if (typeof method !== 'function') {
      return failure(
        res,
        501,
        'Conversation deletion is not implemented.'
      );
    }

    const result = await method.call(
      service,
      {
        conversationId,
        userId
      }
    );

    await createAuditLog(
      req,
      'CONVERSATION_DELETED',
      {
        conversationId
      }
    );

    return success(
      res,
      result,
      'Conversation deleted successfully.'
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Delete conversation error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to delete conversation.',
      error
    );
  }
}

/* ============================================================
   14. PROPERTY ENQUIRY
   ============================================================ */

/**
 * POST /api/messages/property-enquiry
 */

async function sendPropertyEnquiry(
  req,
  res
) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const propertyId =
      req.body?.propertyId;

    if (!propertyId) {
      return failure(
        res,
        400,
        'Property ID is required.'
      );
    }

    const content =
      typeof req.body?.content === 'string'
        ? req.body.content.trim()
        : '';

    if (!content) {
      return failure(
        res,
        400,
        'Enquiry message is required.'
      );
    }

    const service = getMessageService();

    const method =
      service?.sendPropertyEnquiry ||
      service?.createPropertyEnquiry;

    if (typeof method !== 'function') {
      return failure(
        res,
        501,
        'Property enquiry service is not implemented.'
      );
    }

    const result = await method.call(
      service,
      {
        userId,

        propertyId,

        content,

        recipientId:
          req.body?.recipientId ||
          null
      }
    );

    await createAuditLog(
      req,
      'PROPERTY_ENQUIRY_SENT',
      {
        propertyId
      }
    );

    return success(
      res,
      result,
      'Property enquiry sent successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Property enquiry error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to send property enquiry.',
      error
    );
  }
}

/* ============================================================
   15. REPORT USER / MESSAGE
   ============================================================ */

/**
 * POST /api/messages/report
 */

async function reportMessage(
  req,
  res
) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const messageId =
      req.body?.messageId || null;

    const conversationId =
      req.body?.conversationId || null;

    const reason =
      typeof req.body?.reason === 'string'
        ? req.body.reason.trim()
        : '';

    if (!messageId && !conversationId) {
      return failure(
        res,
        400,
        'Message ID or conversation ID is required.'
      );
    }

    if (!reason) {
      return failure(
        res,
        400,
        'Report reason is required.'
      );
    }

    const service = getMessageService();

    const method =
      service?.reportMessage ||
      service?.createMessageReport;

    if (typeof method !== 'function') {
      return failure(
        res,
        501,
        'Message reporting is not implemented.'
      );
    }

    const result = await method.call(
      service,
      {
        userId,
        messageId,
        conversationId,
        reason,
        description:
          req.body?.description || null
      }
    );

    await createAuditLog(
      req,
      'MESSAGE_REPORTED',
      {
        messageId,
        conversationId
      }
    );

    return success(
      res,
      result,
      'Report submitted successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Report error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to submit report.',
      error
    );
  }
}

/* ============================================================
   16. BLOCK USER
   ============================================================ */

/**
 * POST /api/messages/block
 */

async function blockUser(
  req,
  res
) {
  try {
    const userId = getUserId(req);
    const blockedUserId =
      req.body?.userId ||
      req.body?.blockedUserId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!blockedUserId) {
      return failure(
        res,
        400,
        'User ID to block is required.'
      );
    }

    if (
      String(userId) ===
      String(blockedUserId)
    ) {
      return failure(
        res,
        400,
        'You cannot block yourself.'
      );
    }

    const service = getMessageService();

    const method =
      service?.blockUser ||
      service?.createBlock;

    if (typeof method !== 'function') {
      return failure(
        res,
        501,
        'User blocking is not implemented.'
      );
    }

    const result = await method.call(
      service,
      {
        userId,
        blockedUserId
      }
    );

    await createAuditLog(
      req,
      'USER_BLOCKED',
      {
        blockedUserId
      }
    );

    return success(
      res,
      result,
      'User blocked successfully.'
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Block user error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to block user.',
      error
    );
  }
}

/* ============================================================
   17. UNBLOCK USER
   ============================================================ */

/**
 * DELETE /api/messages/block/:userId
 */

async function unblockUser(
  req,
  res
) {
  try {
    const userId = getUserId(req);
    const blockedUserId =
      req.params?.userId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!blockedUserId) {
      return failure(
        res,
        400,
        'User ID is required.'
      );
    }

    const service = getMessageService();

    const method =
      service?.unblockUser ||
      service?.removeBlock;

    if (typeof method !== 'function') {
      return failure(
        res,
        501,
        'User unblocking is not implemented.'
      );
    }

    const result = await method.call(
      service,
      {
        userId,
        blockedUserId
      }
    );

    return success(
      res,
      result,
      'User unblocked successfully.'
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Unblock user error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to unblock user.',
      error
    );
  }
}

/* ============================================================
   18. MESSAGE SEARCH
   ============================================================ */

/**
 * GET /api/messages/search
 */

async function searchMessages(
  req,
  res
) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const query =
      typeof req.query?.q === 'string'
        ? req.query.q.trim()
        : '';

    if (!query) {
      return failure(
        res,
        400,
        'Search query is required.'
      );
    }

    const service = getMessageService();

    const method =
      service?.searchMessages ||
      service?.search;

    if (typeof method !== 'function') {
      return failure(
        res,
        501,
        'Message search is not implemented.'
      );
    }

    const pagination = getPagination(req);

    const result = await method.call(
      service,
      {
        userId,
        query,
        conversationId:
          req.query?.conversationId ||
          null,
        page: pagination.page,
        limit: pagination.limit
      }
    );

    return success(
      res,
      result,
      'Message search completed successfully.'
    );
  } catch (error) {
    console.error(
      '[MESSAGE] Search error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to search messages.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  getConversations,
  getConversation,
  createConversation,

  sendMessage,
  getMessages,
  getMessage,

  markMessageRead,
  markConversationRead,

  getUnreadCount,

  archiveConversation,
  unarchiveConversation,

  deleteMessage,
  deleteConversation,

  sendPropertyEnquiry,

  reportMessage,

  blockUser,
  unblockUser,

  searchMessages
};