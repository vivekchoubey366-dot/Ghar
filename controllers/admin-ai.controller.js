'use strict';

/**
 * ============================================================
 * GHAR - Admin AI Controller
 * ============================================================
 *
 * Administrative AI operations.
 *
 * Responsibilities:
 * - AI service status
 * - AI configuration status
 * - AI health checks
 * - Model information
 * - Prompt testing
 * - Usage/statistics
 * - AI configuration inspection
 *
 * IMPORTANT:
 * - This controller must be protected by admin authentication.
 * - Never return API keys or secrets.
 * - Never expose internal credentials to the frontend.
 * - Business AI operations belong in services/ai.service.js.
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   HELPERS
   ============================================================ */

/**
 * Safely retrieve the AI service.
 *
 * The actual AI implementation should live in:
 *
 * services/ai.service.js
 *
 * This controller does not directly implement AI logic.
 */

function getAIService() {
  try {
    return require('../services/ai.service');
  } catch (error) {
    return null;
  }
}

/**
 * Send a standardized success response.
 */

function success(
  res,
  data = {},
  message = 'Success'
) {
  return res.status(200).json({
    success: true,
    message,
    data
  });
}

/**
 * Send a standardized error response.
 */

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
   * Never expose stack traces or secrets
   * in production.
   */

  if (
    config.env.app.environment !==
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
   1. GET AI STATUS
   ============================================================ */

/**
 * GET /api/admin-ai/status
 *
 * Returns the current AI service status.
 */

async function getStatus(
  req,
  res
) {
  try {
    const ai =
      config.ai;

    const aiService =
      getAIService();

    let serviceStatus = {
      available: false,
      configured: false
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
            ai &&
            ai.enabled
          ),

        provider:
          ai?.provider ||
          null,

        configured:
          ai &&
          typeof ai.isConfigured ===
            'function'
            ? ai.isConfigured()
            : Boolean(
                ai &&
                ai.enabled
              ),

        service:
          serviceStatus
      },
      'AI status retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN AI] Status error:',
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
   2. AI HEALTH CHECK
   ============================================================ */

/**
 * GET /api/admin-ai/health
 *
 * Performs a live AI service health check.
 */

async function healthCheck(
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

    if (
      typeof aiService.healthCheck !==
      'function'
    ) {
      return failure(
        res,
        501,
        'AI health check is not implemented.'
      );
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

        message:
          healthy
            ? 'AI service is healthy.'
            : 'AI service health check failed.',

        data:
          typeof result ===
          'object'
            ? result
            : {
                healthy
              }
      });
  } catch (error) {
    console.error(
      '[ADMIN AI] Health check error:',
      error
    );

    return failure(
      res,
      503,
      'AI service health check failed.',
      error
    );
  }
}

/* ============================================================
   3. GET AI CONFIGURATION
   ============================================================ */

/**
 * GET /api/admin-ai/config
 *
 * Returns SAFE AI configuration.
 *
 * Secrets/API keys must never be returned.
 */

async function getConfig(
  req,
  res
) {
  try {
    const ai =
      config.ai;

    let safeConfig = null;

    if (
      ai &&
      typeof ai.getSafeConfig ===
        'function'
    ) {
      safeConfig =
        ai.getSafeConfig();
    } else {
      safeConfig = {
        enabled:
          Boolean(
            ai &&
            ai.enabled
          ),

        provider:
          ai?.provider ||
          null
      };
    }

    return success(
      res,
      safeConfig,
      'AI configuration retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN AI] Configuration error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve AI configuration.',
      error
    );
  }
}

/* ============================================================
   4. GET AI MODEL
   ============================================================ */

/**
 * GET /api/admin-ai/model
 *
 * Returns the active model information.
 */

async function getModel(
  req,
  res
) {
  try {
    const ai =
      config.ai;

    const aiService =
      getAIService();

    let model = {
      provider:
        ai?.provider ||
        null,

      model:
        ai?.model ||
        null
    };

    if (
      aiService &&
      typeof aiService.getModel ===
        'function'
    ) {
      model =
        await aiService.getModel();
    }

    return success(
      res,
      model,
      'AI model information retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN AI] Model error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve AI model information.',
      error
    );
  }
}

/* ============================================================
   5. TEST AI PROMPT
   ============================================================ */

/**
 * POST /api/admin-ai/test
 *
 * Body:
 *
 * {
 *   "prompt": "Summarize this property..."
 * }
 *
 * This endpoint is intended for administrators.
 */

async function testPrompt(
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

    const prompt =
      typeof req.body?.prompt ===
      'string'
        ? req.body.prompt.trim()
        : '';

    if (
      !prompt
    ) {
      return failure(
        res,
        400,
        'Prompt is required.'
      );
    }

    /*
     * Prevent unnecessarily large administrative
     * test requests.
     */

    const maxPromptLength =
      Number(
        process.env.ADMIN_AI_MAX_PROMPT_LENGTH ||
        10000
      );

    if (
      prompt.length >
      maxPromptLength
    ) {
      return failure(
        res,
        400,
        `Prompt cannot exceed ${maxPromptLength} characters.`
      );
    }

    let result;

    if (
      typeof aiService.generateText ===
      'function'
    ) {
      result =
        await aiService.generateText({
          prompt
        });
    } else if (
      typeof aiService.generate ===
      'function'
    ) {
      result =
        await aiService.generate({
          prompt
        });
    } else {
      return failure(
        res,
        501,
        'AI text generation is not implemented.'
      );
    }

    return success(
      res,
      {
        result
      },
      'AI prompt executed successfully.'
    );
  } catch (error) {
    console.error(
      '[ADMIN AI] Prompt test error:',
      error
    );

    return failure(
      res,
      500,
      'AI prompt execution failed.',
      error
    );
  }
}

/* ============================================================
   6. GET AI USAGE
   ============================================================ */

/**
 * GET /api/admin-ai/usage
 *
 * Returns AI usage statistics when the AI service
 * provides them.
 */

async function getUsage(
  req,
  res
) {
  try {
    const aiService =
      getAIService();

    if (
      aiService &&
      typeof aiService.getUsage ===
        'function'
    ) {
      const usage =
        await aiService.getUsage();

      return success(
        res,
        usage,
        'AI usage retrieved.'
      );
    }

    /*
     * If usage tracking has not yet been implemented,
     * return an explicit response rather than inventing
     * statistics.
     */

    return success(
      res,
      {
        available: false,
        message:
          'AI usage tracking is not configured.'
      },
      'AI usage information is unavailable.'
    );
  } catch (error) {
    console.error(
      '[ADMIN AI] Usage error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve AI usage.',
      error
    );
  }
}

/* ============================================================
   7. GET AI STATISTICS
   ============================================================ */

/**
 * GET /api/admin-ai/statistics
 *
 * Returns administrative AI statistics.
 */

async function getStatistics(
  req,
  res
) {
  try {
    const aiService =
      getAIService();

    if (
      aiService &&
      typeof aiService.getStatistics ===
        'function'
    ) {
      const statistics =
        await aiService.getStatistics();

      return success(
        res,
        statistics,
        'AI statistics retrieved.'
      );
    }

    return success(
      res,
      {
        available: false,
        message:
          'AI statistics are not configured.'
      },
      'AI statistics are unavailable.'
    );
  } catch (error) {
    console.error(
      '[ADMIN AI] Statistics error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve AI statistics.',
      error
    );
  }
}

/* ============================================================
   8. RESET AI USAGE
   ============================================================ */

/**
 * POST /api/admin-ai/usage/reset
 *
 * Resets usage counters if supported by the AI service.
 *
 * This operation should be protected by a stronger
 * admin permission in the route/middleware layer.
 */

async function resetUsage(
  req,
  res
) {
  try {
    const aiService =
      getAIService();

    if (
      !aiService ||
      typeof aiService.resetUsage !==
        'function'
    ) {
      return failure(
        res,
        501,
        'AI usage reset is not implemented.'
      );
    }

    const result =
      await aiService.resetUsage();

    return success(
      res,
      result,
      'AI usage counters reset.'
    );
  } catch (error) {
    console.error(
      '[ADMIN AI] Usage reset error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to reset AI usage.',
      error
    );
  }
}

/* ============================================================
   9. GET AI FEATURES
   ============================================================ */

/**
 * GET /api/admin-ai/features
 *
 * Returns AI feature availability.
 */

async function getFeatures(
  req,
  res
) {
  try {
    const ai =
      config.ai;

    let features = {};

    if (
      ai &&
      ai.features
    ) {
      features = {
        ...ai.features
      };
    }

    return success(
      res,
      {
        enabled:
          Boolean(
            ai &&
            ai.enabled
          ),

        features
      },
      'AI features retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN AI] Features error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve AI features.',
      error
    );
  }
}

/* ============================================================
   10. RELOAD AI CONFIGURATION
   ============================================================ */

/**
 * POST /api/admin-ai/reload
 *
 * Configuration is normally loaded at application startup.
 *
 * This endpoint intentionally does not mutate process
 * environment variables. If the service supports runtime
 * configuration reload, it may expose reloadConfig().
 */

async function reloadConfig(
  req,
  res
) {
  try {
    const aiService =
      getAIService();

    if (
      !aiService ||
      typeof aiService.reloadConfig !==
        'function'
    ) {
      return success(
        res,
        {
          reloaded: false,
          message:
            'AI runtime configuration is loaded at application startup.'
        },
        'No runtime AI configuration reload is configured.'
      );
    }

    const result =
      await aiService.reloadConfig();

    return success(
      res,
      result,
      'AI configuration reloaded.'
    );
  } catch (error) {
    console.error(
      '[ADMIN AI] Configuration reload error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to reload AI configuration.',
      error
    );
  }
}

/* ============================================================
   11. GET AI SAFE DIAGNOSTICS
   ============================================================ */

/**
 * GET /api/admin-ai/diagnostics
 *
 * Returns diagnostic information without exposing secrets.
 */

async function diagnostics(
  req,
  res
) {
  try {
    const ai =
      config.ai;

    const database =
      config.database;

    const result = {
      timestamp:
        new Date().toISOString(),

      application: {
        environment:
          config.env.app.environment,

        version:
          config.env.app.version
      },

      ai: {
        enabled:
          Boolean(
            ai &&
            ai.enabled
          ),

        provider:
          ai?.provider ||
          null,

        configured:
          ai &&
          typeof ai.isConfigured ===
            'function'
            ? ai.isConfigured()
            : false
      },

      database: {
        available:
          Boolean(
            database
          ),

        connected:
          database &&
          typeof database.isConnected ===
            'function'
            ? database.isConnected()
            : false
      }
    };

    const aiService =
      getAIService();

    if (
      aiService &&
      typeof aiService.getDiagnostics ===
        'function'
    ) {
      result.ai =
        {
          ...result.ai,

          ...(
            await aiService.getDiagnostics()
          )
        };
    }

    return success(
      res,
      result,
      'AI diagnostics retrieved.'
    );
  } catch (error) {
    console.error(
      '[ADMIN AI] Diagnostics error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve AI diagnostics.',
      error
    );
  }
}

/* ============================================================
   12. EXPORT CONTROLLER
   ============================================================ */

module.exports = {
  getStatus,

  healthCheck,

  getConfig,

  getModel,

  testPrompt,

  getUsage,

  getStatistics,

  resetUsage,

  getFeatures,

  reloadConfig,

  diagnostics
};