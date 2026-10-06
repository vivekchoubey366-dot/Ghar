'use strict';

/**
 * ============================================================
 * GHAR - AI Controller
 * ============================================================
 *
 * User-facing AI operations.
 *
 * Responsibilities:
 * - AI assistant/chat
 * - Property recommendations
 * - Property explanations
 * - Property search assistance
 * - EMI / affordability assistance
 * - General GHAR guidance
 * - AI conversation history
 *
 * IMPORTANT:
 * - Do not put API keys in this controller.
 * - Do not call the AI provider directly here.
 * - AI provider communication belongs in:
 *
 *      services/ai.service.js
 *
 * - Admin AI operations belong in:
 *
 *      controllers/admin-ai.controller.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE
   ============================================================ */

function getAIService() {
  try {
    return require('../services/ai.service');
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
   AUTHENTICATED USER
   ============================================================ */

function getUserId(req) {
  return (
    req.user?.id ||
    req.user?.userId ||
    null
  );
}

/* ============================================================
   VALIDATION
   ============================================================ */

function validateMessage(message) {
  if (
    typeof message !==
    'string'
  ) {
    return 'Message must be a string.';
  }

  const value =
    message.trim();

  if (!value) {
    return 'Message is required.';
  }

  const maxLength =
    Number(
      process.env.AI_MAX_MESSAGE_LENGTH ||
      10000
    );

  if (
    value.length >
    maxLength
  ) {
    return `Message cannot exceed ${maxLength} characters.`;
  }

  return null;
}

/* ============================================================
   1. AI CHAT
   ============================================================ */

/**
 * POST /api/ai/chat
 *
 * Body:
 *
 * {
 *   "message": "Find me a 3 BHK in Noida under 1 crore",
 *   "conversationId": "optional-id",
 *   "context": {}
 * }
 */

async function chat(
  req,
  res
) {
  try {
    const message =
      typeof req.body?.message ===
      'string'
        ? req.body.message.trim()
        : '';

    const validationError =
      validateMessage(message);

    if (
      validationError
    ) {
      return failure(
        res,
        400,
        validationError
      );
    }

    const aiService =
      getAIService();

    if (
      !aiService
    ) {
      return failure(
        res,
        503,
        'AI service is unavailable.'
      );
    }

    const userId =
      getUserId(req);

    const payload = {
      message,

      userId,

      conversationId:
        req.body?.conversationId ||
        null,

      context:
        req.body?.context ||
        {},

      metadata:
        req.body?.metadata ||
        {}
    };

    let result;

    if (
      typeof aiService.chat ===
      'function'
    ) {
      result =
        await aiService.chat(
          payload
        );
    } else if (
      typeof aiService.generateText ===
      'function'
    ) {
      result =
        await aiService.generateText({
          prompt: message,
          userId,
          context:
            payload.context
        });
    } else {
      return failure(
        res,
        501,
        'AI chat service is not implemented.'
      );
    }

    return success(
      res,
      result,
      'AI response generated.'
    );
  } catch (error) {
    console.error(
      '[AI] Chat error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to generate AI response.',
      error
    );
  }
}

/* ============================================================
   2. STREAM CHAT
   ============================================================ */

/**
 * POST /api/ai/chat/stream
 *
 * Streaming support.
 *
 * The service is responsible for producing the stream.
 */

async function streamChat(
  req,
  res
) {
  try {
    const message =
      typeof req.body?.message ===
      'string'
        ? req.body.message.trim()
        : '';

    const validationError =
      validateMessage(message);

    if (
      validationError
    ) {
      return failure(
        res,
        400,
        validationError
      );
    }

    const aiService =
      getAIService();

    if (
      !aiService
    ) {
      return failure(
        res,
        503,
        'AI service is unavailable.'
      );
    }

    if (
      typeof aiService.streamChat !==
      'function'
    ) {
      return failure(
        res,
        501,
        'AI streaming is not implemented.'
      );
    }

    /*
     * SSE headers.
     */

    res.setHeader(
      'Content-Type',
      'text/event-stream'
    );

    res.setHeader(
      'Cache-Control',
      'no-cache, no-transform'
    );

    res.setHeader(
      'Connection',
      'keep-alive'
    );

    if (
      typeof res.flushHeaders ===
      'function'
    ) {
      res.flushHeaders();
    }

    const userId =
      getUserId(req);

    await aiService.streamChat(
      {
        message,

        userId,

        conversationId:
          req.body?.conversationId ||
          null,

        context:
          req.body?.context ||
          {}
      },

      (chunk) => {
        if (
          res.writableEnded
        ) {
          return;
        }

        res.write(
          `data: ${JSON.stringify(
            chunk
          )}\n\n`
        );
      }
    );

    if (
      !res.writableEnded
    ) {
      res.write(
        'data: [DONE]\n\n'
      );

      res.end();
    }
  } catch (error) {
    console.error(
      '[AI] Stream error:',
      error
    );

    if (
      !res.headersSent
    ) {
      return failure(
        res,
        500,
        'Unable to start AI stream.',
        error
      );
    }

    if (
      !res.writableEnded
    ) {
      res.write(
        `data: ${JSON.stringify({
          error:
            'AI stream failed.'
        })}\n\n`
      );

      res.end();
    }
  }
}

/* ============================================================
   3. PROPERTY RECOMMENDATIONS
   ============================================================ */

/**
 * POST /api/ai/property-recommendations
 *
 * Body example:
 *
 * {
 *   "budget": 10000000,
 *   "location": "Noida",
 *   "propertyType": "apartment",
 *   "bedrooms": 3,
 *   "purpose": "buy"
 * }
 */

async function propertyRecommendations(
  req,
  res
) {
  try {
    const aiService =
      getAIService();

    if (
      !aiService
    ) {
      return failure(
        res,
        503,
        'AI service is unavailable.'
      );
    }

    const preferences =
      req.body || {};

    if (
      typeof preferences !==
      'object' ||
      Array.isArray(
        preferences
      )
    ) {
      return failure(
        res,
        400,
        'Property preferences must be an object.'
      );
    }

    const method =
      aiService.getPropertyRecommendations ||
      aiService.propertyRecommendations ||
      aiService.recommendProperties;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property recommendation service is not implemented.'
      );
    }

    const result =
      await method.call(
        aiService,
        {
          userId:
            getUserId(req),

          preferences,

          context:
            req.body?.context ||
            {}
        }
      );

    return success(
      res,
      result,
      'Property recommendations generated.'
    );
  } catch (error) {
    console.error(
      '[AI] Property recommendation error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to generate property recommendations.',
      error
    );
  }
}

/* ============================================================
   4. PROPERTY EXPLANATION
   ============================================================ */

/**
 * POST /api/ai/property/:id/explain
 */

async function explainProperty(
  req,
  res
) {
  try {
    const propertyId =
      req.params?.id;

    if (
      !propertyId
    ) {
      return failure(
        res,
        400,
        'Property ID is required.'
      );
    }

    const aiService =
      getAIService();

    if (
      !aiService
    ) {
      return failure(
        res,
        503,
        'AI service is unavailable.'
      );
    }

    const method =
      aiService.explainProperty ||
      aiService.analyzeProperty;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property explanation service is not implemented.'
      );
    }

    const result =
      await method.call(
        aiService,
        {
          propertyId,

          userId:
            getUserId(req),

          question:
            req.body?.question ||
            null
        }
      );

    return success(
      res,
      result,
      'Property analysis generated.'
    );
  } catch (error) {
    console.error(
      '[AI] Property explanation error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to analyze property.',
      error
    );
  }
}

/* ============================================================
   5. PROPERTY SEARCH ASSISTANT
   ============================================================ */

/**
 * POST /api/ai/property-search
 *
 * Converts natural language into structured
 * property-search criteria.
 */

async function propertySearch(
  req,
  res
) {
  try {
    const query =
      typeof req.body?.query ===
      'string'
        ? req.body.query.trim()
        : '';

    if (
      !query
    ) {
      return failure(
        res,
        400,
        'Property search query is required.'
      );
    }

    if (
      query.length >
      5000
    ) {
      return failure(
        res,
        400,
        'Property search query is too long.'
      );
    }

    const aiService =
      getAIService();

    if (
      !aiService
    ) {
      return failure(
        res,
        503,
        'AI service is unavailable.'
      );
    }

    const method =
      aiService.parsePropertySearch ||
      aiService.propertySearch ||
      aiService.searchPropertiesWithAI;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'AI property search is not implemented.'
      );
    }

    const result =
      await method.call(
        aiService,
        {
          query,

          userId:
            getUserId(req),

          filters:
            req.body?.filters ||
            {}
        }
      );

    return success(
      res,
      result,
      'AI property search completed.'
    );
  } catch (error) {
    console.error(
      '[AI] Property search error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to process AI property search.',
      error
    );
  }
}

/* ============================================================
   6. AFFORDABILITY ASSISTANT
   ============================================================ */

/**
 * POST /api/ai/affordability
 *
 * Body:
 *
 * {
 *   "income": 100000,
 *   "monthlyExpenses": 30000,
 *   "downPayment": 1000000,
 *   "interestRate": 8.5,
 *   "tenureYears": 20
 * }
 */

async function affordability(
  req,
  res
) {
  try {
    const aiService =
      getAIService();

    if (
      !aiService
    ) {
      return failure(
        res,
        503,
        'AI service is unavailable.'
      );
    }

    const financialData =
      req.body || {};

    const method =
      aiService.calculateAffordability ||
      aiService.affordabilityAnalysis ||
      aiService.analyzeAffordability;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'AI affordability service is not implemented.'
      );
    }

    const result =
      await method.call(
        aiService,
        {
          userId:
            getUserId(req),

          financialData
        }
      );

    return success(
      res,
      result,
      'Affordability analysis generated.'
    );
  } catch (error) {
    console.error(
      '[AI] Affordability error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to calculate affordability.',
      error
    );
  }
}

/* ============================================================
   7. EMI ASSISTANT
   ============================================================ */

/**
 * POST /api/ai/emi
 */

async function emi(
  req,
  res
) {
  try {
    const aiService =
      getAIService();

    if (
      !aiService
    ) {
      return failure(
        res,
        503,
        'AI service is unavailable.'
      );
    }

    const loanData =
      req.body || {};

    const method =
      aiService.calculateEMI ||
      aiService.calculateEmi ||
      aiService.emiAnalysis;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'AI EMI service is not implemented.'
      );
    }

    const result =
      await method.call(
        aiService,
        {
          userId:
            getUserId(req),

          loanData
        }
      );

    return success(
      res,
      result,
      'EMI analysis generated.'
    );
  } catch (error) {
    console.error(
      '[AI] EMI error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to calculate EMI.',
      error
    );
  }
}

/* ============================================================
   8. LOAN ASSISTANCE
   ============================================================ */

/**
 * POST /api/ai/loan-assistance
 */

async function loanAssistance(
  req,
  res
) {
  try {
    const aiService =
      getAIService();

    if (
      !aiService
    ) {
      return failure(
        res,
        503,
        'AI service is unavailable.'
      );
    }

    const method =
      aiService.loanAssistance ||
      aiService.analyzeLoan ||
      aiService.loanAnalysis;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'AI loan assistance is not implemented.'
      );
    }

    const result =
      await method.call(
        aiService,
        {
          userId:
            getUserId(req),

          loanData:
            req.body || {}
        }
      );

    return success(
      res,
      result,
      'Loan assistance generated.'
    );
  } catch (error) {
    console.error(
      '[AI] Loan assistance error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to provide loan assistance.',
      error
    );
  }
}

/* ============================================================
   9. DOCUMENT ASSISTANCE
   ============================================================ */

/**
 * POST /api/ai/document-assistance
 *
 * Provides AI guidance around documents.
 *
 * The actual document extraction/verification pipeline
 * belongs in document services.
 */

async function documentAssistance(
  req,
  res
) {
  try {
    const aiService =
      getAIService();

    if (
      !aiService
    ) {
      return failure(
        res,
        503,
        'AI service is unavailable.'
      );
    }

    const method =
      aiService.documentAssistance ||
      aiService.analyzeDocument ||
      aiService.documentAnalysis;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'AI document assistance is not implemented.'
      );
    }

    const result =
      await method.call(
        aiService,
        {
          userId:
            getUserId(req),

          documentId:
            req.body?.documentId ||
            null,

          question:
            req.body?.question ||
            null,

          context:
            req.body?.context ||
            {}
        }
      );

    return success(
      res,
      result,
      'Document assistance generated.'
    );
  } catch (error) {
    console.error(
      '[AI] Document assistance error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to provide document assistance.',
      error
    );
  }
}

/* ============================================================
   10. GENERAL GHAR ASSISTANT
   ============================================================ */

/**
 * POST /api/ai/assistant
 */

async function assistant(
  req,
  res
) {
  try {
    const message =
      typeof req.body?.message ===
      'string'
        ? req.body.message.trim()
        : '';

    const validationError =
      validateMessage(message);

    if (
      validationError
    ) {
      return failure(
        res,
        400,
        validationError
      );
    }

    const aiService =
      getAIService();

    if (
      !aiService
    ) {
      return failure(
        res,
        503,
        'AI service is unavailable.'
      );
    }

    const method =
      aiService.assistant ||
      aiService.chat ||
      aiService.generateText;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'GHAR AI assistant is not implemented.'
      );
    }

    const result =
      await method.call(
        aiService,
        {
          message,

          userId:
            getUserId(req),

          conversationId:
            req.body?.conversationId ||
            null,

          context:
            req.body?.context ||
            {}
        }
      );

    return success(
      res,
      result,
      'GHAR AI assistant response generated.'
    );
  } catch (error) {
    console.error(
      '[AI] Assistant error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to process AI assistant request.',
      error
    );
  }
}

/* ============================================================
   11. CONVERSATION HISTORY
   ============================================================ */

/**
 * GET /api/ai/conversations
 */

async function listConversations(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    if (
      !userId
    ) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const aiService =
      getAIService();

    const conversationService =
      aiService?.conversationService ||
      getAIService();

    const method =
      conversationService?.getConversations ||
      conversationService?.listConversations;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'AI conversation history is not implemented.'
      );
    }

    const result =
      await method.call(
        conversationService,
        {
          userId,

          page:
            Number.parseInt(
              req.query?.page,
              10
            ) || 1,

          limit:
            Math.min(
              Number.parseInt(
                req.query?.limit,
                10
              ) || 20,
              100
            )
        }
      );

    return success(
      res,
      result,
      'AI conversations retrieved.'
    );
  } catch (error) {
    console.error(
      '[AI] Conversation list error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve AI conversations.',
      error
    );
  }
}

/* ============================================================
   12. GET CONVERSATION
   ============================================================ */

/**
 * GET /api/ai/conversations/:id
 */

async function getConversation(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const conversationId =
      req.params?.id;

    if (
      !userId
    ) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (
      !conversationId
    ) {
      return failure(
        res,
        400,
        'Conversation ID is required.'
      );
    }

    const aiService =
      getAIService();

    const method =
      aiService?.getConversation ||
      aiService?.conversation;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'AI conversation retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        aiService,
        {
          userId,

          conversationId
        }
      );

    if (
      !result
    ) {
      return failure(
        res,
        404,
        'Conversation not found.'
      );
    }

    return success(
      res,
      result,
      'AI conversation retrieved.'
    );
  } catch (error) {
    console.error(
      '[AI] Conversation error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve AI conversation.',
      error
    );
  }
}

/* ============================================================
   13. DELETE CONVERSATION
   ============================================================ */

/**
 * DELETE /api/ai/conversations/:id
 */

async function deleteConversation(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const conversationId =
      req.params?.id;

    if (
      !userId
    ) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (
      !conversationId
    ) {
      return failure(
        res,
        400,
        'Conversation ID is required.'
      );
    }

    const aiService =
      getAIService();

    const method =
      aiService?.deleteConversation;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'AI conversation deletion is not implemented.'
      );
    }

    const result =
      await method.call(
        aiService,
        {
          userId,

          conversationId
        }
      );

    return success(
      res,
      result,
      'AI conversation deleted.'
    );
  } catch (error) {
    console.error(
      '[AI] Delete conversation error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to delete AI conversation.',
      error
    );
  }
}

/* ============================================================
   14. AI STATUS
   ============================================================ */

/**
 * GET /api/ai/status
 */

async function status(
  req,
  res
) {
  try {
    const ai =
      config?.ai;

    const aiService =
      getAIService();

    let serviceStatus = {
      available: false
    };

    if (
      aiService &&
      typeof aiService.getStatus ===
        'function'
    ) {
      serviceStatus =
        await aiService.getStatus();
    }

    return success(
      res,
      {
        enabled:
          Boolean(
            ai?.enabled
          ),

        provider:
          ai?.provider ||
          null,

        service:
          serviceStatus
      },
      'AI status retrieved.'
    );
  } catch (error) {
    console.error(
      '[AI] Status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve AI status.',
      error
    );
  }
}

/* ============================================================
   15. AI HEALTH
   ============================================================ */

/**
 * GET /api/ai/health
 */

async function health(
  req,
  res
) {
  try {
    const aiService =
      getAIService();

    if (
      !aiService
    ) {
      return res.status(503).json({
        success: false,
        healthy: false,
        message:
          'AI service is unavailable.'
      });
    }

    if (
      typeof aiService.healthCheck !==
      'function'
    ) {
      return res.status(501).json({
        success: false,
        healthy: false,
        message:
          'AI health check is not implemented.'
      });
    }

    const result =
      await aiService.healthCheck();

    const healthy =
      result === true ||
      result?.healthy === true;

    return res
      .status(
        healthy
          ? 200
          : 503
      )
      .json({
        success:
          healthy,

        healthy,

        message:
          healthy
            ? 'AI service is healthy.'
            : 'AI service is unhealthy.',

        data:
          typeof result ===
          'object'
            ? result
            : {}
      });
  } catch (error) {
    console.error(
      '[AI] Health error:',
      error
    );

    return res.status(503).json({
      success: false,
      healthy: false,
      message:
        'AI health check failed.'
    });
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  chat,

  streamChat,

  propertyRecommendations,

  explainProperty,

  propertySearch,

  affordability,

  emi,

  loanAssistance,

  documentAssistance,

  assistant,

  listConversations,

  getConversation,

  deleteConversation,

  status,

  health
};