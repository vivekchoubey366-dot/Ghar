'use strict';

/**
 * ============================================================
 * GHAR - Payment Controller
 * ============================================================
 *
 * Handles:
 * - Create payment orders
 * - Initiate payments
 * - Verify payments
 * - Payment status
 * - Payment history
 * - Refunds
 * - Cancelled payments
 * - Webhooks
 * - Subscription payments
 * - Property transaction payments
 * - Loan/application related payments
 * - Invoice retrieval
 *
 * Business logic:
 *     services/payment.service.js
 *
 * Database logic:
 *     repositories/payment.repository.js
 *
 * Payment provider:
 *     config/payments.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE
   ============================================================ */

function getPaymentService() {
  try {
    return require('../services/payment.service');
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
      'production' &&
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

function getPaymentId(req) {
  return (
    req.params?.paymentId ||
    req.params?.id ||
    req.body?.paymentId ||
    null
  );
}

function getOrderId(req) {
  return (
    req.params?.orderId ||
    req.body?.orderId ||
    null
  );
}

/* ============================================================
   NUMBER HELPERS
   ============================================================ */

function parseAmount(value) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const amount = Number(value);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return null;
  }

  return amount;
}

/* ============================================================
   PAGINATION
   ============================================================ */

function getPagination(req) {
  const page = Math.max(
    parseInt(
      req.query?.page,
      10
    ) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      parseInt(
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
        'payment',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.['user-agent'] ||
        null
    });
  } catch (error) {
    console.error(
      '[PAYMENT AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. CREATE PAYMENT ORDER
   ============================================================ */

/**
 * POST /api/payments/order
 */

async function createOrder(
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

    const amount =
      parseAmount(
        req.body?.amount
      );

    if (amount === null) {
      return failure(
        res,
        400,
        'A valid payment amount is required.'
      );
    }

    const service =
      getPaymentService();

    const method =
      service?.createOrder ||
      service?.createPaymentOrder;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Payment order creation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          amount,

          currency:
            req.body?.currency ||
            'INR',

          paymentType:
            req.body?.paymentType ||
            'property',

          propertyId:
            req.body?.propertyId ||
            null,

          offerId:
            req.body?.offerId ||
            null,

          applicationId:
            req.body?.applicationId ||
            null,

          loanId:
            req.body?.loanId ||
            null,

          subscriptionId:
            req.body?.subscriptionId ||
            null,

          description:
            req.body?.description ||
            null,

          metadata:
            req.body?.metadata ||
            {}
        }
      );

    await createAuditLog(
      req,
      'PAYMENT_ORDER_CREATED',
      {
        orderId:
          result?.orderId ||
          result?.id ||
          null,

        amount
      }
    );

    return success(
      res,
      result,
      'Payment order created successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[PAYMENT] Create order error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to create payment order.',
      error
    );
  }
}

/* ============================================================
   2. INITIATE PAYMENT
   ============================================================ */

/**
 * POST /api/payments/initiate
 */

async function initiatePayment(
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

    const orderId =
      getOrderId(req);

    if (!orderId) {
      return failure(
        res,
        400,
        'Payment order ID is required.'
      );
    }

    const service =
      getPaymentService();

    const method =
      service?.initiatePayment ||
      service?.createPayment;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Payment initiation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          orderId,

          paymentMethod:
            req.body?.paymentMethod ||
            null,

          provider:
            req.body?.provider ||
            null,

          returnUrl:
            req.body?.returnUrl ||
            null
        }
      );

    await createAuditLog(
      req,
      'PAYMENT_INITIATED',
      {
        orderId
      }
    );

    return success(
      res,
      result,
      'Payment initiated successfully.'
    );
  } catch (error) {
    console.error(
      '[PAYMENT] Initiate error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to initiate payment.',
      error
    );
  }
}

/* ============================================================
   3. VERIFY PAYMENT
   ============================================================ */

/**
 * POST /api/payments/verify
 */

async function verifyPayment(
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
      getPaymentService();

    const method =
      service?.verifyPayment ||
      service?.verifyTransaction;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Payment verification is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          paymentId:
            req.body?.paymentId ||
            null,

          orderId:
            req.body?.orderId ||
            null,

          transactionId:
            req.body?.transactionId ||
            null,

          provider:
            req.body?.provider ||
            null,

          signature:
            req.body?.signature ||
            null,

          providerPaymentId:
            req.body?.providerPaymentId ||
            null
        }
      );

    await createAuditLog(
      req,
      'PAYMENT_VERIFIED',
      {
        paymentId:
          result?.paymentId ||
          req.body?.paymentId ||
          null,

        orderId:
          result?.orderId ||
          req.body?.orderId ||
          null
      }
    );

    return success(
      res,
      result,
      'Payment verified successfully.'
    );
  } catch (error) {
    console.error(
      '[PAYMENT] Verify error:',
      error
    );

    return failure(
      res,
      400,
      'Payment verification failed.',
      error
    );
  }
}

/* ============================================================
   4. PAYMENT STATUS
   ============================================================ */

/**
 * GET /api/payments/:paymentId/status
 */

async function getPaymentStatus(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const paymentId =
      getPaymentId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!paymentId) {
      return failure(
        res,
        400,
        'Payment ID is required.'
      );
    }

    const service =
      getPaymentService();

    const method =
      service?.getPaymentStatus ||
      service?.getStatus;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Payment status retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          paymentId,

          userId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Payment not found.'
      );
    }

    return success(
      res,
      result,
      'Payment status retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[PAYMENT] Status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve payment status.',
      error
    );
  }
}

/* ============================================================
   5. GET PAYMENT
   ============================================================ */

/**
 * GET /api/payments/:paymentId
 */

async function getPayment(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const paymentId =
      getPaymentId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!paymentId) {
      return failure(
        res,
        400,
        'Payment ID is required.'
      );
    }

    const service =
      getPaymentService();

    const method =
      service?.getPayment ||
      service?.findPayment;

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

    const result =
      await method.call(
        service,
        {
          paymentId,

          userId
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Payment not found.'
      );
    }

    return success(
      res,
      result,
      'Payment retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[PAYMENT] Get payment error:',
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
   6. PAYMENT HISTORY
   ============================================================ */

/**
 * GET /api/payments
 */

async function getPaymentHistory(
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
      getPaymentService();

    const method =
      service?.getPaymentHistory ||
      service?.listPayments;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Payment history is not implemented.'
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

          paymentType:
            req.query?.paymentType ||
            null,

          propertyId:
            req.query?.propertyId ||
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
      'Payment history retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[PAYMENT] History error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve payment history.',
      error
    );
  }
}

/* ============================================================
   7. REFUND PAYMENT
   ============================================================ */

/**
 * POST /api/payments/:paymentId/refund
 */

async function refundPayment(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const paymentId =
      getPaymentId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!paymentId) {
      return failure(
        res,
        400,
        'Payment ID is required.'
      );
    }

    const amount =
      req.body?.amount !== undefined
        ? parseAmount(
            req.body.amount
          )
        : null;

    const service =
      getPaymentService();

    const method =
      service?.refundPayment ||
      service?.createRefund;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Payment refund is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          paymentId,

          userId,

          amount,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'PAYMENT_REFUND_REQUESTED',
      {
        paymentId,

        amount
      }
    );

    return success(
      res,
      result,
      'Refund request processed successfully.'
    );
  } catch (error) {
    console.error(
      '[PAYMENT] Refund error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to process refund.',
      error
    );
  }
}

/* ============================================================
   8. CANCEL PAYMENT
   ============================================================ */

/**
 * POST /api/payments/:paymentId/cancel
 */

async function cancelPayment(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const paymentId =
      getPaymentId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!paymentId) {
      return failure(
        res,
        400,
        'Payment ID is required.'
      );
    }

    const service =
      getPaymentService();

    const method =
      service?.cancelPayment ||
      service?.voidPayment;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Payment cancellation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          paymentId,

          userId,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'PAYMENT_CANCELLED',
      {
        paymentId
      }
    );

    return success(
      res,
      result,
      'Payment cancelled successfully.'
    );
  } catch (error) {
    console.error(
      '[PAYMENT] Cancel error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to cancel payment.',
      error
    );
  }
}

/* ============================================================
   9. INVOICE
   ============================================================ */

/**
 * GET /api/payments/:paymentId/invoice
 */

async function getInvoice(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const paymentId =
      getPaymentId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!paymentId) {
      return failure(
        res,
        400,
        'Payment ID is required.'
      );
    }

    const service =
      getPaymentService();

    const method =
      service?.getInvoice ||
      service?.generateInvoice;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Invoice generation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          paymentId,

          userId
        }
      );

    return success(
      res,
      result,
      'Invoice retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[PAYMENT] Invoice error:',
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
   10. SUBSCRIPTION PAYMENT
   ============================================================ */

/**
 * POST /api/payments/subscription
 */

async function createSubscriptionPayment(
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

    const planId =
      req.body?.planId;

    if (!planId) {
      return failure(
        res,
        400,
        'Subscription plan ID is required.'
      );
    }

    const service =
      getPaymentService();

    const method =
      service?.createSubscriptionPayment ||
      service?.subscribe;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Subscription payment is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          planId,

          provider:
            req.body?.provider ||
            null,

          couponCode:
            req.body?.couponCode ||
            null
        }
      );

    await createAuditLog(
      req,
      'SUBSCRIPTION_PAYMENT_CREATED',
      {
        planId
      }
    );

    return success(
      res,
      result,
      'Subscription payment created successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[PAYMENT] Subscription error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to create subscription payment.',
      error
    );
  }
}

/* ============================================================
   11. PROPERTY PAYMENT
   ============================================================ */

/**
 * POST /api/payments/property
 */

async function createPropertyPayment(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const propertyId =
      req.body?.propertyId;

    const amount =
      parseAmount(
        req.body?.amount
      );

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!propertyId) {
      return failure(
        res,
        400,
        'Property ID is required.'
      );
    }

    if (amount === null) {
      return failure(
        res,
        400,
        'A valid payment amount is required.'
      );
    }

    const service =
      getPaymentService();

    const method =
      service?.createPropertyPayment;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Property payment is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          propertyId,

          offerId:
            req.body?.offerId ||
            null,

          amount,

          currency:
            req.body?.currency ||
            'INR',

          paymentType:
            req.body?.paymentType ||
            'booking'
        }
      );

    await createAuditLog(
      req,
      'PROPERTY_PAYMENT_CREATED',
      {
        propertyId,

        amount
      }
    );

    return success(
      res,
      result,
      'Property payment created successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[PAYMENT] Property payment error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to create property payment.',
      error
    );
  }
}

/* ============================================================
   12. WEBHOOK
   ============================================================ */

/**
 * POST /api/payments/webhook
 *
 * IMPORTANT:
 * This endpoint should NOT use normal authenticated
 * user middleware.
 *
 * The payment service must validate the provider
 * signature before processing the webhook.
 */

async function webhook(
  req,
  res
) {
  try {
    const service =
      getPaymentService();

    const method =
      service?.handleWebhook ||
      service?.processWebhook;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Payment webhook handling is not implemented.'
      );
    }

    const signature =
      req.headers?.[
        'x-razorpay-signature'
      ] ||
      req.headers?.[
        'stripe-signature'
      ] ||
      req.headers?.[
        'x-payment-signature'
      ] ||
      null;

    const result =
      await method.call(
        service,
        {
          body:
            req.body,

          rawBody:
            req.rawBody ||
            null,

          signature,

          headers:
            req.headers
        }
      );

    return success(
      res,
      result,
      'Webhook processed successfully.'
    );
  } catch (error) {
    console.error(
      '[PAYMENT] Webhook error:',
      error
    );

    return failure(
      res,
      400,
      'Payment webhook processing failed.',
      error
    );
  }
}

/* ============================================================
   13. PAYMENT RECEIPT
   ============================================================ */

/**
 * GET /api/payments/:paymentId/receipt
 */

async function getReceipt(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const paymentId =
      getPaymentId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!paymentId) {
      return failure(
        res,
        400,
        'Payment ID is required.'
      );
    }

    const service =
      getPaymentService();

    const method =
      service?.getReceipt ||
      service?.generateReceipt;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Payment receipt generation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          paymentId,

          userId
        }
      );

    return success(
      res,
      result,
      'Payment receipt retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[PAYMENT] Receipt error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve payment receipt.',
      error
    );
  }
}

/* ============================================================
   14. PAYMENT STATISTICS
   ============================================================ */

/**
 * GET /api/payments/statistics
 */

async function getPaymentStatistics(
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
      getPaymentService();

    const method =
      service?.getPaymentStatistics ||
      service?.getStatistics;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Payment statistics are not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          from:
            req.query?.from ||
            null,

          to:
            req.query?.to ||
            null
        }
      );

    return success(
      res,
      result,
      'Payment statistics retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[PAYMENT] Statistics error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve payment statistics.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  createOrder,

  initiatePayment,

  verifyPayment,

  getPaymentStatus,

  getPayment,

  getPaymentHistory,

  refundPayment,

  cancelPayment,

  getInvoice,

  createSubscriptionPayment,

  createPropertyPayment,

  webhook,

  getReceipt,

  getPaymentStatistics
};