"use strict";

/**
 * GHAR Subscription Authorization Middleware
 *
 * Subscription tiers:
 *
 * FREE
 * BUYER_PLUS
 * SELLER_PRO
 * AGENT_PRO
 * BUSINESS
 *
 * Subscription fields:
 * - subscription_plan
 * - subscription_status
 * - subscription_start
 * - subscription_end
 *
 * Authentication is handled by:
 *   auth.middleware.js
 *
 * Role authorization is handled by:
 *   role.middleware.js
 */

const PLANS = Object.freeze({
  FREE: "FREE",
  BUYER_PLUS: "BUYER_PLUS",
  SELLER_PRO: "SELLER_PRO",
  AGENT_PRO: "AGENT_PRO",
  BUSINESS: "BUSINESS"
});

const ACTIVE_STATUSES = new Set([
  "active",
  "trialing"
]);

const PLAN_ALIASES = Object.freeze({
  free: PLANS.FREE,
  buyer_plus: PLANS.BUYER_PLUS,
  "buyer-plus": PLANS.BUYER_PLUS,
  buyerplus: PLANS.BUYER_PLUS,

  seller_pro: PLANS.SELLER_PRO,
  "seller-pro": PLANS.SELLER_PRO,
  sellerpro: PLANS.SELLER_PRO,

  agent_pro: PLANS.AGENT_PRO,
  "agent-pro": PLANS.AGENT_PRO,
  agentpro: PLANS.AGENT_PRO,

  business: PLANS.BUSINESS
});

function normalizePlan(plan) {
  if (!plan) {
    return null;
  }

  const normalized = String(plan)
    .trim()
    .toLowerCase();

  return (
    PLAN_ALIASES[normalized] ||
    String(plan).trim().toUpperCase()
  );
}

function normalizeStatus(status) {
  if (!status) {
    return null;
  }

  return String(status)
    .trim()
    .toLowerCase();
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

/**
 * Determine whether a subscription is currently active.
 *
 * The middleware checks:
 * - status
 * - start date
 * - end date
 */
function isSubscriptionActive(subscription) {
  if (!subscription) {
    return false;
  }

  const status = normalizeStatus(
    subscription.subscription_status ||
      subscription.status
  );

  if (!ACTIVE_STATUSES.has(status)) {
    return false;
  }

  const now = new Date();

  const start = parseDate(
    subscription.subscription_start ||
      subscription.start
  );

  const end = parseDate(
    subscription.subscription_end ||
      subscription.end
  );

  if (start && now < start) {
    return false;
  }

  if (end && now > end) {
    return false;
  }

  return true;
}

function sendAuthenticationRequired(
  req,
  res
) {
  return res.status(401).json({
    success: false,
    error: {
      code: "AUTHENTICATION_REQUIRED",
      message: "Authentication is required.",
      requestId: req.requestId || null
    }
  });
}

function sendSubscriptionRequired(
  req,
  res,
  requiredPlans
) {
  return res.status(403).json({
    success: false,
    error: {
      code: "SUBSCRIPTION_REQUIRED",
      message:
        "An active subscription is required to access this resource.",
      requiredPlans,
      requestId: req.requestId || null
    }
  });
}

/**
 * Read subscription information from req.user.
 *
 * This supports both:
 *
 * req.user.subscriptionPlan
 *
 * and:
 *
 * req.user.subscription_plan
 */
function getSubscriptionFromUser(req) {
  const user = req.user || {};

  return {
    subscription_plan:
      user.subscriptionPlan ||
      user.subscription_plan ||
      PLANS.FREE,

    subscription_status:
      user.subscriptionStatus ||
      user.subscription_status ||
      "inactive",

    subscription_start:
      user.subscriptionStart ||
      user.subscription_start ||
      null,

    subscription_end:
      user.subscriptionEnd ||
      user.subscription_end ||
      null
  };
}

/**
 * Require an active subscription.
 *
 * Example:
 *
 * requireSubscription()
 */
function requireSubscription() {
  return (req, res, next) => {
    if (!req.user?.userId) {
      return sendAuthenticationRequired(
        req,
        res
      );
    }

    const subscription =
      getSubscriptionFromUser(req);

    if (
      !isSubscriptionActive(
        subscription
      )
    ) {
      return sendSubscriptionRequired(
        req,
        res,
        Object.values(PLANS).filter(
          (plan) => plan !== PLANS.FREE
        )
      );
    }

    req.subscription = {
      ...subscription,
      plan: normalizePlan(
        subscription.subscription_plan
      ),
      status: normalizeStatus(
        subscription.subscription_status
      ),
      active: true
    };

    next();
  };
}

/**
 * Require one of the specified plans.
 *
 * Example:
 *
 * requireSubscriptionPlan(
 *   PLANS.SELLER_PRO,
 *   PLANS.BUSINESS
 * )
 */
function requireSubscriptionPlan(
  ...requiredPlans
) {
  const normalizedPlans =
    requiredPlans
      .flat()
      .map(normalizePlan)
      .filter(Boolean);

  return (req, res, next) => {
    if (!req.user?.userId) {
      return sendAuthenticationRequired(
        req,
        res
      );
    }

    const subscription =
      getSubscriptionFromUser(req);

    if (
      !isSubscriptionActive(
        subscription
      )
    ) {
      return sendSubscriptionRequired(
        req,
        res,
        normalizedPlans
      );
    }

    const currentPlan =
      normalizePlan(
        subscription.subscription_plan
      );

    if (
      !normalizedPlans.includes(
        currentPlan
      )
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: "INSUFFICIENT_SUBSCRIPTION",
          message:
            "Your current subscription does not include this feature.",
          currentPlan,
          requiredPlans: normalizedPlans,
          requestId:
            req.requestId || null
        }
      });
    }

    req.subscription = {
      ...subscription,
      plan: currentPlan,
      status: normalizeStatus(
        subscription.subscription_status
      ),
      active: true
    };

    next();
  };
}

/**
 * Check whether the current user has a
 * particular subscription plan.
 */
function hasSubscriptionPlan(
  req,
  plan
) {
  const subscription =
    getSubscriptionFromUser(req);

  if (
    !isSubscriptionActive(
      subscription
    )
  ) {
    return false;
  }

  return (
    normalizePlan(
      subscription.subscription_plan
    ) === normalizePlan(plan)
  );
}

/**
 * Check whether the current subscription is active.
 */
function hasActiveSubscription(req) {
  return isSubscriptionActive(
    getSubscriptionFromUser(req)
  );
}

module.exports = {
  PLANS,
  ACTIVE_STATUSES,
  normalizePlan,
  normalizeStatus,
  isSubscriptionActive,
  getSubscriptionFromUser,
  requireSubscription,
  requireSubscriptionPlan,
  hasSubscriptionPlan,
  hasActiveSubscription
};