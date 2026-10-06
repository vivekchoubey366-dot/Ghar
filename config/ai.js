'use strict';

/**
 * ============================================================
 * GHAR - AI Configuration
 * ============================================================
 *
 * Central configuration for all GHAR AI services.
 *
 * Used by:
 * - AI assistant
 * - Property recommendations
 * - Property search assistance
 * - Property descriptions
 * - Document assistance
 * - Loan assistance
 * - Admin AI
 * - Fraud/risk analysis
 * - Market insights
 *
 * Secrets are loaded from config/env.js.
 * ============================================================
 */

const env = require('./env');

/* ============================================================
   1. AI ENABLED
   ============================================================ */

const enabled = Boolean(
  env.ai &&
  env.ai.enabled
);

/* ============================================================
   2. AI PROVIDER
   ============================================================ */

const provider =
  process.env.AI_PROVIDER ||
  'openai';

/* ============================================================
   3. API CONFIGURATION
   ============================================================ */

const apiKey =
  env.ai.apiKey || null;

const apiUrl =
  env.ai.apiUrl ||
  'https://api.openai.com/v1';

const model =
  env.ai.model ||
  'gpt-5.6';

/* ============================================================
   4. REQUEST SETTINGS
   ============================================================ */

const timeout =
  Number(env.ai.timeout) || 30000;

const maxTokens =
  Number(env.ai.maxTokens) || 2000;

const temperature =
  Number(
    process.env.AI_TEMPERATURE || 0.2
  );

/* ============================================================
   5. RETRY SETTINGS
   ============================================================ */

const maxRetries =
  Number(
    process.env.AI_MAX_RETRIES || 3
  );

const retryDelayMs =
  Number(
    process.env.AI_RETRY_DELAY_MS || 1000
  );

/* ============================================================
   6. RATE LIMITING
   ============================================================ */

const rateLimitWindowMs =
  Number(
    process.env.AI_RATE_LIMIT_WINDOW_MS ||
    60 * 1000
  );

const rateLimitMax =
  Number(
    process.env.AI_RATE_LIMIT_MAX || 30
  );

/* ============================================================
   7. CONTEXT LIMITS
   ============================================================ */

const maxInputCharacters =
  Number(
    process.env.AI_MAX_INPUT_CHARACTERS ||
    20000
  );

const maxConversationMessages =
  Number(
    process.env.AI_MAX_CONVERSATION_MESSAGES ||
    20
  );

/* ============================================================
   8. SYSTEM IDENTITY
   ============================================================ */

const systemPrompt = `
You are GHAR AI, the intelligent assistant for the GHAR
real-estate platform.

Your responsibilities include helping users with:

- Property discovery
- Buying property
- Selling property
- Renting property
- Property comparisons
- Property recommendations
- Property searches
- Property descriptions
- Real-estate questions
- Loan-related guidance
- Application guidance
- Document guidance
- Property verification guidance
- General market information
- GHAR platform navigation

Rules:

1. Do not invent property information.
2. Do not invent prices, availability, legal status,
   ownership information, loan approvals, or verification
   results.
3. Clearly distinguish between verified GHAR data and
   general guidance.
4. Never claim that a loan, application, document, property,
   or payment has been approved unless the backend confirms it.
5. Never expose passwords, API keys, JWTs, OTPs, payment
   credentials, or other secrets.
6. Do not provide professional legal, financial, or tax
   advice as a substitute for a qualified professional.
7. When information is missing, say that it is unavailable
   rather than guessing.
8. Respect user privacy.
9. Keep responses clear, useful, and relevant to the user's
   request.
`.trim();

/* ============================================================
   9. AI FEATURE FLAGS
   ============================================================ */

const features = {
  assistant:
    process.env.AI_FEATURE_ASSISTANT !== 'false',

  propertyRecommendations:
    process.env.AI_FEATURE_PROPERTY_RECOMMENDATIONS !== 'false',

  propertySearch:
    process.env.AI_FEATURE_PROPERTY_SEARCH !== 'false',

  propertyDescription:
    process.env.AI_FEATURE_PROPERTY_DESCRIPTION !== 'false',

  propertyComparison:
    process.env.AI_FEATURE_PROPERTY_COMPARISON !== 'false',

  documentAssistant:
    process.env.AI_FEATURE_DOCUMENT_ASSISTANT !== 'false',

  loanAssistant:
    process.env.AI_FEATURE_LOAN_ASSISTANT !== 'false',

  marketInsights:
    process.env.AI_FEATURE_MARKET_INSIGHTS !== 'false',

  fraudDetection:
    process.env.AI_FEATURE_FRAUD_DETECTION !== 'false',

  adminAssistant:
    process.env.AI_FEATURE_ADMIN_ASSISTANT !== 'false',

  moderation:
    process.env.AI_FEATURE_MODERATION !== 'false'
};

/* ============================================================
   10. AI TASK CONFIGURATION
   ============================================================ */

const tasks = {
  assistant: {
    model:
      process.env.AI_ASSISTANT_MODEL ||
      model,

    maxTokens:
      Number(
        process.env.AI_ASSISTANT_MAX_TOKENS ||
        maxTokens
      ),

    temperature:
      Number(
        process.env.AI_ASSISTANT_TEMPERATURE ||
        temperature
      )
  },

  propertyRecommendations: {
    model:
      process.env.AI_RECOMMENDATION_MODEL ||
      model,

    maxTokens:
      Number(
        process.env.AI_RECOMMENDATION_MAX_TOKENS ||
        1200
      ),

    temperature:
      Number(
        process.env.AI_RECOMMENDATION_TEMPERATURE ||
        0.2
      )
  },

  propertyDescription: {
    model:
      process.env.AI_PROPERTY_DESCRIPTION_MODEL ||
      model,

    maxTokens:
      Number(
        process.env.AI_PROPERTY_DESCRIPTION_MAX_TOKENS ||
        1000
      ),

    temperature:
      Number(
        process.env.AI_PROPERTY_DESCRIPTION_TEMPERATURE ||
        0.7
      )
  },

  documentAssistant: {
    model:
      process.env.AI_DOCUMENT_MODEL ||
      model,

    maxTokens:
      Number(
        process.env.AI_DOCUMENT_MAX_TOKENS ||
        2000
      ),

    temperature:
      Number(
        process.env.AI_DOCUMENT_TEMPERATURE ||
        0.1
      )
  },

  loanAssistant: {
    model:
      process.env.AI_LOAN_MODEL ||
      model,

    maxTokens:
      Number(
        process.env.AI_LOAN_MAX_TOKENS ||
        1500
      ),

    temperature:
      Number(
        process.env.AI_LOAN_TEMPERATURE ||
        0.1
      )
  },

  marketInsights: {
    model:
      process.env.AI_MARKET_MODEL ||
      model,

    maxTokens:
      Number(
        process.env.AI_MARKET_MAX_TOKENS ||
        2000
      ),

    temperature:
      Number(
        process.env.AI_MARKET_TEMPERATURE ||
        0.2
      )
  },

  fraudDetection: {
    model:
      process.env.AI_FRAUD_MODEL ||
      model,

    maxTokens:
      Number(
        process.env.AI_FRAUD_MAX_TOKENS ||
        1000
      ),

    temperature:
      Number(
        process.env.AI_FRAUD_TEMPERATURE ||
        0
      )
  }
};

/* ============================================================
   11. SAFETY SETTINGS
   ============================================================ */

const safety = {
  enabled:
    process.env.AI_SAFETY_ENABLED !== 'false',

  redactSecrets:
    process.env.AI_REDACT_SECRETS !== 'false',

  redactPersonalData:
    process.env.AI_REDACT_PERSONAL_DATA !== 'false',

  allowFinancialDecisions:
    process.env.AI_ALLOW_FINANCIAL_DECISIONS === 'true',

  allowLegalDecisions:
    process.env.AI_ALLOW_LEGAL_DECISIONS === 'true',

  allowAutomaticApprovals:
    process.env.AI_ALLOW_AUTOMATIC_APPROVALS === 'true'
};

/* ============================================================
   12. CACHE
   ============================================================ */

const cache = {
  enabled:
    process.env.AI_CACHE_ENABLED === 'true',

  ttlSeconds:
    Number(
      process.env.AI_CACHE_TTL_SECONDS ||
      300
    )
};

/* ============================================================
   13. VECTOR / KNOWLEDGE SEARCH
   ============================================================ */

const knowledge = {
  enabled:
    process.env.AI_KNOWLEDGE_ENABLED === 'true',

  provider:
    process.env.AI_KNOWLEDGE_PROVIDER ||
    null,

  endpoint:
    process.env.AI_KNOWLEDGE_ENDPOINT ||
    null,

  apiKey:
    process.env.AI_KNOWLEDGE_API_KEY ||
    null,

  collection:
    process.env.AI_KNOWLEDGE_COLLECTION ||
    'ghar'
};

/* ============================================================
   14. VALIDATION
   ============================================================ */

function validate() {
  const warnings = [];
  const errors = [];

  if (!enabled) {
    warnings.push(
      '[GHAR AI] AI is disabled.'
    );
  }

  if (
    enabled &&
    !apiKey
  ) {
    warnings.push(
      '[GHAR AI] AI_ENABLED=true but AI_API_KEY is missing.'
    );
  }

  if (
    enabled &&
    !apiUrl
  ) {
    errors.push(
      'AI_API_URL is required when AI is enabled.'
    );
  }

  if (
    !model
  ) {
    warnings.push(
      '[GHAR AI] No default AI model configured.'
    );
  }

  if (
    timeout < 1000
  ) {
    warnings.push(
      '[GHAR AI] AI timeout is unusually low.'
    );
  }

  if (
    maxRetries < 0
  ) {
    errors.push(
      'AI_MAX_RETRIES cannot be negative.'
    );
  }

  for (const warning of warnings) {
    console.warn(warning);
  }

  if (errors.length) {
    throw new Error(
      `[GHAR AI CONFIG ERROR]\n- ${errors.join('\n- ')}`
    );
  }

  return true;
}

/* ============================================================
   15. FEATURE CHECK
   ============================================================ */

function isFeatureEnabled(
  feature
) {
  if (!enabled) {
    return false;
  }

  return features[feature] === true;
}

/* ============================================================
   16. TASK CONFIG
   ============================================================ */

function getTaskConfig(
  taskName
) {
  if (
    !tasks[taskName]
  ) {
    throw new Error(
      `Unknown GHAR AI task: ${taskName}`
    );
  }

  return {
    ...tasks[taskName]
  };
}

/* ============================================================
   17. SAFE CONFIGURATION
   ============================================================ */

function getSafeConfig() {
  return {
    enabled,

    provider,

    apiUrl,

    model,

    timeout,

    maxTokens,

    temperature,

    maxRetries,

    retryDelayMs,

    rateLimit: {
      windowMs:
        rateLimitWindowMs,

      max:
        rateLimitMax
    },

    limits: {
      maxInputCharacters,
      maxConversationMessages
    },

    features: {
      ...features
    },

    safety: {
      enabled:
        safety.enabled,

      redactSecrets:
        safety.redactSecrets,

      redactPersonalData:
        safety.redactPersonalData,

      allowFinancialDecisions:
        safety.allowFinancialDecisions,

      allowLegalDecisions:
        safety.allowLegalDecisions,

      allowAutomaticApprovals:
        safety.allowAutomaticApprovals
    },

    cache: {
      enabled:
        cache.enabled,

      ttlSeconds:
        cache.ttlSeconds
    },

    knowledge: {
      enabled:
        knowledge.enabled,

      provider:
        knowledge.provider,

      collection:
        knowledge.collection,

      configured:
        Boolean(
          knowledge.endpoint &&
          knowledge.apiKey
        )
    }
  };
}

/* ============================================================
   18. EXPORT
   ============================================================ */

const ai = {
  enabled,

  provider,

  apiKey,

  apiUrl,

  model,

  timeout,

  maxTokens,

  temperature,

  maxRetries,

  retryDelayMs,

  rateLimit: {
    windowMs:
      rateLimitWindowMs,

    max:
      rateLimitMax
  },

  limits: {
    maxInputCharacters,

    maxConversationMessages
  },

  systemPrompt,

  features,

  tasks,

  safety,

  cache,

  knowledge,

  isFeatureEnabled,

  getTaskConfig,

  getSafeConfig,

  validate
};

/* ============================================================
   19. VALIDATE ON LOAD
   ============================================================ */

validate();

/* ============================================================
   20. EXPORT
   ============================================================ */

module.exports = ai;