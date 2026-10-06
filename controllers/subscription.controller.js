'use strict';

/**
 * ============================================================
 * GHAR - Subscription Controller
 * ============================================================
 *
 * Handles:
 * - Subscription plans
 * - Active subscriptions
 * - Create subscription
 * - Checkout
 * - Subscription status
 * - Upgrade / downgrade
 * - Cancel subscription
 * - Resume subscription
 * - Renew subscription
 * - Billing history
 * - Invoices
 * - Payment method
 * - Subscription entitlements
 *
 * Business logic:
 *     services/subscription.service.js
 *
 * Database logic:
 *     repositories/subscription.repository.js
 *
 * Payment processing:
 *     services/payment.service.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE LOADER
   ============================================================ */

function getSubscriptionService() {
  try {
    return require('../services/subscription.service');
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
   NUMBER
   ============================================================ */

function parseNumber(value) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
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
        'subscription',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.['user-agent'] ||
        null
    });
  } catch (error) {
    console.error(
      '[SUBSCRIPTION AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. GET SUBSCRIPTION PLANS
   ============================================================ */

/**
 * GET /api/subscriptions/plans
 */

async function getPlans(
  req,
  res
) {
  try {
    const service =
      getSubscriptionService();

    const method =
      service?.getPlans ||
      service?.listPlans;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Subscription plans are not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          type:
            req.query?.type ||
            null,

          billingCycle:
            req.query?.billingCycle ||
            null,

          activeOnly:
            req.query?.activeOnly !==
              'false'
        }
      );

    return success(
      res,
      result,
      'Subscription plans retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Plans error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve subscription plans.',
      error
    );
  }
}

/* ============================================================
   2. GET PLAN
   ============================================================ */

/**
 * GET /api/subscriptions/plans/:planId
 */

async function getPlan(
  req,
  res
) {
  try {
    const planId =
      req.params?.planId;

    if (!planId) {
      return failure(
        res,
        400,
        'Plan ID is required.'
      );
    }

    const service =
      getSubscriptionService();

    const method =
      service?.getPlan;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Subscription plan retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          planId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Subscription plan not found.'
      );
    }

    return success(
      res,
      result,
      'Subscription plan retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Plan error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve subscription plan.',
      error
    );
  }
}

/* ============================================================
   3. GET MY SUBSCRIPTION
   ============================================================ */

/**
 * GET /api/subscriptions/me
 */

async function getMySubscription(
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
      getSubscriptionService();

    const method =
      service?.getMySubscription ||
      service?.getUserSubscription;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Subscription retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId
        }
      );

    return success(
      res,
      result,
      'Subscription retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] My subscription error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve subscription.',
      error
    );
  }
}

/* ============================================================
   4. CREATE SUBSCRIPTION
   ============================================================ */

/**
 * POST /api/subscriptions
 */

async function createSubscription(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const planId =
      req.body?.planId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!planId) {
      return failure(
        res,
        400,
        'Plan ID is required.'
      );
    }

    const service =
      getSubscriptionService();

    const method =
      service?.createSubscription;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Subscription creation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          planId,

          billingCycle:
            req.body?.billingCycle ||
            null,

          couponCode:
            req.body?.couponCode ||
            null,

          metadata:
            req.body?.metadata ||
            {}
        }
      );

    await createAuditLog(
      req,
      'SUBSCRIPTION_CREATED',
      {
        subscriptionId:
          result?.id ||
          result?.subscriptionId ||
          null,

        planId
      }
    );

    return success(
      res,
      result,
      'Subscription created successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Create error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to create subscription.',
      error
    );
  }
}

/* ============================================================
   5. CREATE CHECKOUT
   ============================================================ */

/**
 * POST /api/subscriptions/checkout
 */

async function createCheckout(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const planId =
      req.body?.planId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!planId) {
      return failure(
        res,
        400,
        'Plan ID is required.'
      );
    }

    const service =
      getSubscriptionService();

    const method =
      service?.createCheckout ||
      service?.createCheckoutSession;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Subscription checkout is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          planId,

          billingCycle:
            req.body?.billingCycle ||
            null,

          couponCode:
            req.body?.couponCode ||
            null,

          successUrl:
            req.body?.successUrl ||
            null,

          cancelUrl:
            req.body?.cancelUrl ||
            null
        }
      );

    return success(
      res,
      result,
      'Subscription checkout created successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Checkout error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to create subscription checkout.',
      error
    );
  }
}

/* ============================================================
   6. GET SUBSCRIPTION BY ID
   ============================================================ */

/**
 * GET /api/subscriptions/:subscriptionId
 */

async function getSubscription(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const subscriptionId =
      req.params?.subscriptionId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!subscriptionId) {
      return failure(
        res,
        400,
        'Subscription ID is required.'
      );
    }

    const service =
      getSubscriptionService();

    const method =
      service?.getSubscription;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Subscription retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          subscriptionId,

          userId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Subscription not found.'
      );
    }

    return success(
      res,
      result,
      'Subscription retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Get error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve subscription.',
      error
    );
  }
}

/* ============================================================
   7. SUBSCRIPTION STATUS
   ============================================================ */

/**
 * GET /api/subscriptions/:subscriptionId/status
 */

async function getSubscriptionStatus(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const subscriptionId =
      req.params?.subscriptionId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!subscriptionId) {
      return failure(
        res,
        400,
        'Subscription ID is required.'
      );
    }

    const service =
      getSubscriptionService();

    const method =
      service?.getSubscriptionStatus;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Subscription status is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          subscriptionId,

          userId
        }
      );

    return success(
      res,
      result,
      'Subscription status retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve subscription status.',
      error
    );
  }
}

/* ============================================================
   8. UPGRADE SUBSCRIPTION
   ============================================================ */

/**
 * POST /api/subscriptions/:subscriptionId/upgrade
 */

async function upgradeSubscription(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const subscriptionId =
      req.params?.subscriptionId;

    const planId =
      req.body?.planId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!subscriptionId) {
      return failure(
        res,
        400,
        'Subscription ID is required.'
      );
    }

    if (!planId) {
      return failure(
        res,
        400,
        'New plan ID is required.'
      );
    }

    const service =
      getSubscriptionService();

    const method =
      service?.upgradeSubscription;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Subscription upgrade is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          subscriptionId,

          userId,

          planId,

          proration:
            req.body?.proration !==
              false
        }
      );

    await createAuditLog(
      req,
      'SUBSCRIPTION_UPGRADED',
      {
        subscriptionId,

        planId
      }
    );

    return success(
      res,
      result,
      'Subscription upgraded successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Upgrade error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to upgrade subscription.',
      error
    );
  }
}

/* ============================================================
   9. DOWNGRADE SUBSCRIPTION
   ============================================================ */

/**
 * POST /api/subscriptions/:subscriptionId/downgrade
 */

async function downgradeSubscription(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const subscriptionId =
      req.params?.subscriptionId;

    const planId =
      req.body?.planId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!subscriptionId) {
      return failure(
        res,
        400,
        'Subscription ID is required.'
      );
    }

    if (!planId) {
      return failure(
        res,
        400,
        'New plan ID is required.'
      );
    }

    const service =
      getSubscriptionService();

    const method =
      service?.downgradeSubscription;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Subscription downgrade is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          subscriptionId,

          userId,

          planId,

          effectiveImmediately:
            req.body?.effectiveImmediately ===
            true
        }
      );

    await createAuditLog(
      req,
      'SUBSCRIPTION_DOWNGRADED',
      {
        subscriptionId,

        planId
      }
    );

    return success(
      res,
      result,
      'Subscription downgrade processed successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Downgrade error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to downgrade subscription.',
      error
    );
  }
}

/* ============================================================
   10. CANCEL SUBSCRIPTION
   ============================================================ */

/**
 * POST /api/subscriptions/:subscriptionId/cancel
 */

async function cancelSubscription(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const subscriptionId =
      req.params?.subscriptionId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!subscriptionId) {
      return failure(
        res,
        400,
        'Subscription ID is required.'
      );
    }

    const service =
      getSubscriptionService();

    const method =
      service?.cancelSubscription;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Subscription cancellation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          subscriptionId,

          userId,

          immediately:
            req.body?.immediately ===
            true,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'SUBSCRIPTION_CANCELLED',
      {
        subscriptionId
      }
    );

    return success(
      res,
      result,
      'Subscription cancellation processed successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Cancel error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to cancel subscription.',
      error
    );
  }
}

/* ============================================================
   11. RESUME SUBSCRIPTION
   ============================================================ */

/**
 * POST /api/subscriptions/:subscriptionId/resume
 */

async function resumeSubscription(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const subscriptionId =
      req.params?.subscriptionId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!subscriptionId) {
      return failure(
        res,
        400,
        'Subscription ID is required.'
      );
    }

    const service =
      getSubscriptionService();

    const method =
      service?.resumeSubscription;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Subscription resume is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          subscriptionId,

          userId
        }
      );

    await createAuditLog(
      req,
      'SUBSCRIPTION_RESUMED',
      {
        subscriptionId
      }
    );

    return success(
      res,
      result,
      'Subscription resumed successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Resume error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to resume subscription.',
      error
    );
  }
}

/* ============================================================
   12. RENEW SUBSCRIPTION
   ============================================================ */

/**
 * POST /api/subscriptions/:subscriptionId/renew
 */

async function renewSubscription(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const subscriptionId =
      req.params?.subscriptionId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!subscriptionId) {
      return failure(
        res,
        400,
        'Subscription ID is required.'
      );
    }

    const service =
      getSubscriptionService();

    const method =
      service?.renewSubscription;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Subscription renewal is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          subscriptionId,

          userId
        }
      );

    await createAuditLog(
      req,
      'SUBSCRIPTION_RENEWED',
      {
        subscriptionId
      }
    );

    return success(
      res,
      result,
      'Subscription renewed successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Renew error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to renew subscription.',
      error
    );
  }
}

/* ============================================================
   13. BILLING HISTORY
   ============================================================ */

/**
 * GET /api/subscriptions/billing
 */

async function getBillingHistory(
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
      getSubscriptionService();

    const method =
      service?.getBillingHistory ||
      service?.getBilling;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Billing history is not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          userId,

          subscriptionId:
            req.query?.subscriptionId ||
            null,

          status:
            req.query?.status ||
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
      'Billing history retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Billing error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve billing history.',
      error
    );
  }
}

/* ============================================================
   14. INVOICES
   ============================================================ */

/**
 * GET /api/subscriptions/invoices
 */

async function getInvoices(
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
      getSubscriptionService();

    const method =
      service?.getInvoices ||
      service?.listInvoices;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Invoice retrieval is not implemented.'
      );
    }

    const pagination =
      getPagination(req);

    const result =
      await method.call(
        service,
        {
          userId,

          subscriptionId:
            req.query?.subscriptionId ||
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
      'Invoices retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Invoices error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve invoices.',
      error
    );
  }
}

/* ============================================================
   15. GET INVOICE
   ============================================================ */

/**
 * GET /api/subscriptions/invoices/:invoiceId
 */

async function getInvoice(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const invoiceId =
      req.params?.invoiceId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!invoiceId) {
      return failure(
        res,
        400,
        'Invoice ID is required.'
      );
    }

    const service =
      getSubscriptionService();

    const method =
      service?.getInvoice;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Invoice retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          invoiceId,

          userId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Invoice not found.'
      );
    }

    return success(
      res,
      result,
      'Invoice retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Invoice error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve invoice.',
      error
    );
  }
}

/* ============================================================
   16. PAYMENT METHOD
   ============================================================ */

/**
 * GET /api/subscriptions/payment-method
 */

async function getPaymentMethod(
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
      getSubscriptionService();

    const method =
      service?.getPaymentMethod;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Payment method retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId
        }
      );

    return success(
      res,
      result,
      'Payment method retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Payment method error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve payment method.',
      error
    );
  }
}

/* ============================================================
   17. UPDATE PAYMENT METHOD
   ============================================================ */

/**
 * POST /api/subscriptions/payment-method
 */

async function updatePaymentMethod(
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
      getSubscriptionService();

    const method =
      service?.updatePaymentMethod;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Payment method update is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          paymentMethodId:
            req.body?.paymentMethodId,

          provider:
            req.body?.provider ||
            null
        }
      );

    return success(
      res,
      result,
      'Payment method updated successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Update payment method error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update payment method.',
      error
    );
  }
}

/* ============================================================
   18. SUBSCRIPTION ENTITLEMENTS
   ============================================================ */

/**
 * GET /api/subscriptions/entitlements
 */

async function getEntitlements(
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
      getSubscriptionService();

    const method =
      service?.getEntitlements ||
      service?.getUserEntitlements;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Subscription entitlements are not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId
        }
      );

    return success(
      res,
      result,
      'Subscription entitlements retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Entitlements error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve subscription entitlements.',
      error
    );
  }
}

/* ============================================================
   19. APPLY COUPON
   ============================================================ */

/**
 * POST /api/subscriptions/coupon/validate
 */

async function validateCoupon(
  req,
  res
) {
  try {
    const code =
      String(
        req.body?.code ||
        ''
      ).trim();

    const planId =
      req.body?.planId ||
      null;

    if (!code) {
      return failure(
        res,
        400,
        'Coupon code is required.'
      );
    }

    const service =
      getSubscriptionService();

    const method =
      service?.validateCoupon;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Coupon validation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          code,

          planId,

          userId:
            getUserId(req) ||
            null
        }
      );

    return success(
      res,
      result,
      'Coupon validated successfully.'
    );
  } catch (error) {
    console.error(
      '[SUBSCRIPTION] Coupon error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to validate coupon.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  getPlans,

  getPlan,

  getMySubscription,

  createSubscription,

  createCheckout,

  getSubscription,

  getSubscriptionStatus,

  upgradeSubscription,

  downgradeSubscription,

  cancelSubscription,

  resumeSubscription,

  renewSubscription,

  getBillingHistory,

  getInvoices,

  getInvoice,

  getPaymentMethod,

  updatePaymentMethod,

  getEntitlements,

  validateCoupon
};