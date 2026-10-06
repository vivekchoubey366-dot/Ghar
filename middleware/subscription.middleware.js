"use strict";

/**
 * ============================================================
 * GHAR - SUBSCRIPTION MIDDLEWARE
 * ============================================================
 *
 * Responsibilities:
 * - Require an authenticated user
 * - Validate subscription status
 * - Check subscription plan
 * - Check subscription expiry
 * - Check feature access
 * - Check usage limits
 * - Protect premium/subscriber-only routes
 * - Prevent expired subscriptions from accessing paid features
 *
 * IMPORTANT:
 * This middleware performs authorization checks.
 *
 * Actual subscription creation, payment, renewal, cancellation
 * and database updates belong in:
 *
 *   subscription.controller.js
 *
 * and the corresponding service/database layer.
 *
 * ============================================================
 */

const DEFAULT_PLAN =
  String(
    process.env.DEFAULT_SUBSCRIPTION_PLAN ||
    "free"
  )
    .trim()
    .toLowerCase();


/**
 * ============================================================
 * SUBSCRIPTION PLANS
 * ============================================================
 *
 * Keep these names synchronized with:
 *
 * - db/schema.sql
 * - db/seed.sql
 * - subscription.controller.js
 * - frontend subscription configuration
 *
 * Current GHAR model:
 *
 * free
 * basic
 * premium
 * business
 * enterprise
 *
 * ============================================================
 */

const SUBSCRIPTION_PLANS =
  Object.freeze({
    free: Object.freeze({
      name: "free",
      level: 0,

      propertyListings: 1,
      savedProperties: 10,
      monthlyApplications: 2,
      monthlyMessages: 50,
      monthlyAiRequests: 5,

      advancedSearch: false,
      aiAssistant: false,
      prioritySupport: false,
      featuredListings: false,
      analytics: false,
      loanAssistance: false
    }),

    basic: Object.freeze({
      name: "basic",
      level: 10,

      propertyListings: 5,
      savedProperties: 50,
      monthlyApplications: 10,
      monthlyMessages: 250,
      monthlyAiRequests: 25,

      advancedSearch: true,
      aiAssistant: true,
      prioritySupport: false,
      featuredListings: false,
      analytics: false,
      loanAssistance: true
    }),

    premium: Object.freeze({
      name: "premium",
      level: 20,

      propertyListings: 25,
      savedProperties: 250,
      monthlyApplications: 50,
      monthlyMessages: 1000,
      monthlyAiRequests: 100,

      advancedSearch: true,
      aiAssistant: true,
      prioritySupport: true,
      featuredListings: true,
      analytics: true,
      loanAssistance: true
    }),

    business: Object.freeze({
      name: "business",
      level: 30,

      propertyListings: 100,
      savedProperties: 1000,
      monthlyApplications: 250,
      monthlyMessages: 5000,
      monthlyAiRequests: 500,

      advancedSearch: true,
      aiAssistant: true,
      prioritySupport: true,
      featuredListings: true,
      analytics: true,
      loanAssistance: true
    }),

    enterprise: Object.freeze({
      name: "enterprise",
      level: 40,

      propertyListings: 1000,
      savedProperties: 10000,
      monthlyApplications: 1000,
      monthlyMessages: 25000,
      monthlyAiRequests: 2500,

      advancedSearch: true,
      aiAssistant: true,
      prioritySupport: true,
      featuredListings: true,
      analytics: true,
      loanAssistance: true
    })
  });


/**
 * ============================================================
 * STATUS DEFINITIONS
 * ============================================================
 */

const ACTIVE_STATUSES =
  new Set([
    "active",
    "trialing"
  ]);

const INACTIVE_STATUSES =
  new Set([
    "cancelled",
    "canceled",
    "expired",
    "inactive",
    "suspended",
    "past_due",
    "unpaid"
  ]);


/**
 * ============================================================
 * ERROR HELPER
 * ============================================================
 */

function sendSubscriptionError(
  res,
  status,
  code,
  message,
  requestId
) {
  return res.status(status).json({
    success: false,

    error: {
      code,
      message,
      requestId:
        requestId || null
    }
  });
}


/**
 * ============================================================
 * NORMALIZE PLAN
 * ============================================================
 */

function normalizePlan(
  plan
) {
  if (
    plan === undefined ||
    plan === null ||
    plan === ""
  ) {
    return DEFAULT_PLAN;
  }

  return String(plan)
    .trim()
    .toLowerCase();
}


/**
 * ============================================================
 * NORMALIZE STATUS
 * ============================================================
 */

function normalizeStatus(
  status
) {
  if (
    status === undefined ||
    status === null ||
    status === ""
  ) {
    return "inactive";
  }

  return String(status)
    .trim()
    .toLowerCase();
}


/**
 * ============================================================
 * GET PLAN
 * ============================================================
 */

function getPlan(
  plan
) {
  const normalized =
    normalizePlan(plan);

  return (
    SUBSCRIPTION_PLANS[
      normalized
    ] || null
  );
}


/**
 * ============================================================
 * GET USER SUBSCRIPTION
 * ============================================================
 *
 * Supports the following possible locations:
 *
 * req.subscription
 * req.user.subscription
 * req.user.subscriptionPlan
 *
 * This makes the middleware compatible with the existing
 * auth.middleware.js structure.
 *
 * ============================================================
 */

function getUserSubscription(
  req
) {
  const subscription =
    req.subscription ||
    req.user?.subscription ||
    null;

  if (
    subscription &&
    typeof subscription ===
      "object"
  ) {
    return {
      plan:
        normalizePlan(
          subscription.plan ||
          subscription.name ||
          req.user?.subscriptionPlan
        ),

      status:
        normalizeStatus(
          subscription.status
        ),

      startsAt:
        subscription.startsAt ||
        subscription.startDate ||
        subscription.startedAt ||
        null,

      expiresAt:
        subscription.expiresAt ||
        subscription.endDate ||
        subscription.renewalDate ||
        subscription.currentPeriodEnd ||
        null,

      cancelAtPeriodEnd:
        Boolean(
          subscription.cancelAtPeriodEnd ||
          subscription.cancel_at_period_end
        ),

      subscriptionId:
        subscription.id ||
        subscription.subscriptionId ||
        null
    };
  }

  /**
   * Existing auth middleware places the plan directly on
   * req.user.subscriptionPlan.
   */

  if (
    req.user?.subscriptionPlan
  ) {
    return {
      plan:
        normalizePlan(
          req.user.subscriptionPlan
        ),

      status:
        normalizeStatus(
          req.user.subscriptionStatus ||
          "active"
        ),

      startsAt:
        req.user.subscriptionStartsAt ||
        null,

      expiresAt:
        req.user.subscriptionExpiresAt ||
        null,

      cancelAtPeriodEnd:
        Boolean(
          req.user.subscriptionCancelAtPeriodEnd
        ),

      subscriptionId:
        req.user.subscriptionId ||
        null
    };
  }

  return {
    plan:
      DEFAULT_PLAN,

    status:
      "inactive",

    startsAt:
      null,

    expiresAt:
      null,

    cancelAtPeriodEnd:
      false,

    subscriptionId:
      null
  };
}


/**
 * ============================================================
 * CHECK EXPIRY
 * ============================================================
 */

function isSubscriptionExpired(
  subscription
) {
  if (
    !subscription?.expiresAt
  ) {
    return false;
  }

  const expiresAt =
    new Date(
      subscription.expiresAt
    ).getTime();

  if (
    Number.isNaN(
      expiresAt
    )
  ) {
    return true;
  }

  return (
    Date.now() >=
    expiresAt
  );
}


/**
 * ============================================================
 * CHECK ACTIVE SUBSCRIPTION
 * ============================================================
 */

function isSubscriptionActive(
  subscription
) {
  if (
    !subscription
  ) {
    return false;
  }

  const status =
    normalizeStatus(
      subscription.status
    );

  if (
    !ACTIVE_STATUSES.has(
      status
    )
  ) {
    return false;
  }

  if (
    isSubscriptionExpired(
      subscription
    )
  ) {
    return false;
  }

  return true;
}


/**
 * ============================================================
 * GET EFFECTIVE PLAN
 * ============================================================
 */

function getEffectivePlan(
  req
) {
  const subscription =
    getUserSubscription(req);

  /**
   * Free plan is always available as the fallback.
   */

  if (
    !isSubscriptionActive(
      subscription
    )
  ) {
    return getPlan("free");
  }

  return (
    getPlan(
      subscription.plan
    ) ||
    getPlan("free")
  );
}


/**
 * ============================================================
 * REQUIRE AUTHENTICATED USER
 * ============================================================
 */

function requireSubscriptionUser(
  req,
  res,
  next
) {
  if (
    !req.user ||
    !req.user.id
  ) {
    return sendSubscriptionError(
      res,
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication is required to access subscription features.",
      req.requestId
    );
  }

  return next();
}


/**
 * ============================================================
 * REQUIRE ACTIVE SUBSCRIPTION
 * ============================================================
 *
 * Allows active/trial subscriptions.
 *
 * Free users are rejected.
 *
 * ============================================================
 */

function requireActiveSubscription(
  req,
  res,
  next
) {
  if (
    !req.user ||
    !req.user.id
  ) {
    return sendSubscriptionError(
      res,
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
      req.requestId
    );
  }

  const subscription =
    getUserSubscription(req);

  if (
    !isSubscriptionActive(
      subscription
    )
  ) {
    if (
      isSubscriptionExpired(
        subscription
      )
    ) {
      return sendSubscriptionError(
        res,
        403,
        "SUBSCRIPTION_EXPIRED",
        "Your subscription has expired. Please renew your subscription to continue.",
        req.requestId
      );
    }

    return sendSubscriptionError(
      res,
      403,
      "ACTIVE_SUBSCRIPTION_REQUIRED",
      "An active subscription is required to access this feature.",
      req.requestId
    );
  }

  return next();
}


/**
 * ============================================================
 * REQUIRE PLAN
 * ============================================================
 *
 * Example:
 *
 * requirePlan("premium")
 *
 * A premium user can access premium.
 * A business/enterprise user can also access it because they
 * have a higher plan level.
 *
 * ============================================================
 */

function requirePlan(
  minimumPlan
) {
  const required =
    getPlan(
      minimumPlan
    );

  if (
    !required
  ) {
    throw new TypeError(
      `Unknown subscription plan: ${minimumPlan}`
    );
  }

  return function planMiddleware(
    req,
    res,
    next
  ) {
    if (
      !req.user ||
      !req.user.id
    ) {
      return sendSubscriptionError(
        res,
        401,
        "AUTHENTICATION_REQUIRED",
        "Authentication is required.",
        req.requestId
      );
    }

    const subscription =
      getUserSubscription(req);

    if (
      !isSubscriptionActive(
        subscription
      )
    ) {
      return sendSubscriptionError(
        res,
        403,
        "ACTIVE_SUBSCRIPTION_REQUIRED",
        "An active subscription is required.",
        req.requestId
      );
    }

    const current =
      getPlan(
        subscription.plan
      );

    if (
      !current
    ) {
      return sendSubscriptionError(
        res,
        403,
        "INVALID_SUBSCRIPTION_PLAN",
        "Your subscription plan is invalid.",
        req.requestId
      );
    }

    if (
      current.level <
      required.level
    ) {
      return sendSubscriptionError(
        res,
        403,
        "UPGRADE_REQUIRED",
        `The ${required.name} subscription or higher is required for this feature.`,
        req.requestId
      );
    }

    req.subscription =
      subscription;

    req.subscriptionPlan =
      current;

    return next();
  };
}


/**
 * ============================================================
 * REQUIRE EXACT PLAN
 * ============================================================
 */

function requireExactPlan(
  plan
) {
  const required =
    getPlan(plan);

  if (
    !required
  ) {
    throw new TypeError(
      `Unknown subscription plan: ${plan}`
    );
  }

  return function exactPlanMiddleware(
    req,
    res,
    next
  ) {
    if (
      !req.user ||
      !req.user.id
    ) {
      return sendSubscriptionError(
        res,
        401,
        "AUTHENTICATION_REQUIRED",
        "Authentication is required.",
        req.requestId
      );
    }

    const subscription =
      getUserSubscription(req);

    if (
      !isSubscriptionActive(
        subscription
      )
    ) {
      return sendSubscriptionError(
        res,
        403,
        "ACTIVE_SUBSCRIPTION_REQUIRED",
        "An active subscription is required.",
        req.requestId
      );
    }

    if (
      normalizePlan(
        subscription.plan
      ) !==
      required.name
    ) {
      return sendSubscriptionError(
        res,
        403,
        "EXACT_PLAN_REQUIRED",
        `The ${required.name} subscription is required for this feature.`,
        req.requestId
      );
    }

    req.subscription =
      subscription;

    req.subscriptionPlan =
      required;

    return next();
  };
}


/**
 * ============================================================
 * REQUIRE FEATURE
 * ============================================================
 *
 * Example:
 *
 * requireFeature("advancedSearch")
 * requireFeature("aiAssistant")
 * requireFeature("analytics")
 *
 * ============================================================
 */

function requireFeature(
  feature
) {
  const featureName =
    String(
      feature || ""
    ).trim();

  if (
    !featureName
  ) {
    throw new TypeError(
      "requireFeature requires a feature name."
    );
  }

  return function featureMiddleware(
    req,
    res,
    next
  ) {
    if (
      !req.user ||
      !req.user.id
    ) {
      return sendSubscriptionError(
        res,
        401,
        "AUTHENTICATION_REQUIRED",
        "Authentication is required.",
        req.requestId
      );
    }

    const plan =
      getEffectivePlan(req);

    if (
      !plan
    ) {
      return sendSubscriptionError(
        res,
        403,
        "SUBSCRIPTION_REQUIRED",
        "A valid subscription plan is required.",
        req.requestId
      );
    }

    if (
      plan[featureName] !== true
    ) {
      return sendSubscriptionError(
        res,
        403,
        "FEATURE_NOT_AVAILABLE",
        `The "${featureName}" feature is not available on your current subscription plan.`,
        req.requestId
      );
    }

    req.subscriptionPlan =
      plan;

    return next();
  };
}


/**
 * ============================================================
 * CHECK USAGE LIMIT
 * ============================================================
 *
 * The usage lookup is supplied by the caller because different
 * resources use different database queries.
 *
 * Example:
 *
 * requireUsageLimit({
 *   limit: "propertyListings",
 *   getUsage: async (req) => {
 *     return propertyService.countUserListings(req.user.id);
 *   }
 * })
 *
 * ============================================================
 */

function requireUsageLimit({
  limit,
  getUsage
} = {}) {
  if (
    !limit
  ) {
    throw new TypeError(
      "requireUsageLimit requires a limit."
    );
  }

  if (
    typeof getUsage !==
    "function"
  ) {
    throw new TypeError(
      "requireUsageLimit requires getUsage."
    );
  }

  return async function usageLimitMiddleware(
    req,
    res,
    next
  ) {
    if (
      !req.user ||
      !req.user.id
    ) {
      return sendSubscriptionError(
        res,
        401,
        "AUTHENTICATION_REQUIRED",
        "Authentication is required.",
        req.requestId
      );
    }

    const plan =
      getEffectivePlan(req);

    const configuredLimit =
      Number(
        plan[limit]
      );

    if (
      !Number.isFinite(
        configuredLimit
      )
    ) {
      return sendSubscriptionError(
        res,
        403,
        "USAGE_LIMIT_UNAVAILABLE",
        `The ${limit} usage limit is not configured for your subscription.`,
        req.requestId
      );
    }

    try {
      const usage =
        Number(
          await getUsage(req)
        );

      if (
        !Number.isFinite(
          usage
        ) ||
        usage < 0
      ) {
        throw new Error(
          "Invalid subscription usage value."
        );
      }

      if (
        usage >=
        configuredLimit
      ) {
        return sendSubscriptionError(
          res,
          403,
          "SUBSCRIPTION_LIMIT_REACHED",
          `You have reached your ${limit} limit for the current subscription.`,
          req.requestId
        );
      }

      req.subscription =
        getUserSubscription(req);

      req.subscriptionPlan =
        plan;

      req.subscriptionUsage =
        usage;

      req.subscriptionLimit =
        configuredLimit;

      return next();

    } catch (error) {
      return next(error);
    }
  };
}


/**
 * ============================================================
 * ATTACH SUBSCRIPTION
 * ============================================================
 *
 * Non-blocking middleware.
 *
 * Useful when controllers simply need subscription information.
 *
 * ============================================================
 */

function attachSubscription(
  req,
  res,
  next
) {
  const subscription =
    getUserSubscription(req);

  const active =
    isSubscriptionActive(
      subscription
    );

  const plan =
    active
      ? getPlan(
          subscription.plan
        )
      : getPlan("free");

  req.subscription =
    subscription;

  req.subscriptionPlan =
    plan;

  req.subscriptionActive =
    active;

  return next();
}


/**
 * ============================================================
 * CHECK SUBSCRIPTION WITHOUT BLOCKING
 * ============================================================
 */

function checkSubscription(
  req
) {
  const subscription =
    getUserSubscription(req);

  const active =
    isSubscriptionActive(
      subscription
    );

  const plan =
    active
      ? getPlan(
          subscription.plan
        )
      : getPlan("free");

  return {
    subscription,
    active,
    expired:
      isSubscriptionExpired(
        subscription
      ),
    plan
  };
}


/**
 * ============================================================
 * GET REMAINING USAGE
 * ============================================================
 */

function getRemainingUsage(
  plan,
  usage
) {
  const configuredLimit =
    Number(
      plan?.[usage]
    );

  if (
    !Number.isFinite(
      configuredLimit
    )
  ) {
    return null;
  }

  return Math.max(
    0,
    configuredLimit -
      Number(usage || 0)
  );
}


/**
 * ============================================================
 * ADMIN BYPASS
 * ============================================================
 *
 * Administrative users can access subscription management
 * functions without being blocked by their own subscription.
 *
 * This should only be used for administrative operations.
 *
 * ============================================================
 */

function subscriptionAdminBypass(
  req,
  res,
  next
) {
  const role =
    String(
      req.user?.role ||
      ""
    )
      .trim()
      .toLowerCase();

  if (
    role === "admin" ||
    role === "super_admin"
  ) {
    return next();
  }

  return requireActiveSubscription(
    req,
    res,
    next
  );
}


/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  SUBSCRIPTION_PLANS,

  ACTIVE_STATUSES,

  INACTIVE_STATUSES,

  normalizePlan,

  normalizeStatus,

  getPlan,

  getUserSubscription,

  getEffectivePlan,

  isSubscriptionActive,

  isSubscriptionExpired,

  requireSubscriptionUser,

  requireActiveSubscription,

  requirePlan,

  requireExactPlan,

  requireFeature,

  requireUsageLimit,

  attachSubscription,

  checkSubscription,

  getRemainingUsage,

  subscriptionAdminBypass,

  sendSubscriptionError
};