'use strict';

/**
 * ============================================================
 * GHAR - Loan Controller
 * ============================================================
 *
 * Handles:
 * - Loan eligibility
 * - Loan applications
 * - Loan application details
 * - Loan application listing
 * - Loan updates
 * - Loan document submission
 * - Loan status
 * - EMI calculation
 * - Loan offers
 * - Loan approval / rejection
 * - Loan cancellation
 * - Admin loan review
 *
 * Business logic:
 *     services/loan.service.js
 *
 * Database logic:
 *     repositories/loan.repository.js
 *
 * ============================================================
 */

const config = require('../config');

/* ============================================================
   SERVICE
   ============================================================ */

function getLoanService() {
  try {
    return require('../services/loan.service');
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

function getUserRole(req) {
  return (
    req.user?.role ||
    req.user?.userRole ||
    null
  );
}

/* ============================================================
   ID HELPERS
   ============================================================ */

function getLoanId(req) {
  return (
    req.params?.loanId ||
    req.params?.id ||
    req.body?.loanId ||
    null
  );
}

function getApplicationId(req) {
  return (
    req.params?.applicationId ||
    req.body?.applicationId ||
    null
  );
}

/* ============================================================
   NUMBER HELPERS
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

function positiveNumber(value) {
  const number =
    parseNumber(value);

  return (
    number !== null &&
    number > 0
  );
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
    let auditService = null;

    try {
      auditService =
        require('../services/audit.service');
    } catch {
      return;
    }

    if (
      typeof auditService.create !==
      'function'
    ) {
      return;
    }

    await auditService.create({
      userId:
        getUserId(req),

      action,

      resource:
        'loan',

      metadata,

      ipAddress:
        req.ip || null,

      userAgent:
        req.headers?.['user-agent'] ||
        null
    });
  } catch (error) {
    console.error(
      '[LOAN AUDIT] Error:',
      error
    );
  }
}

/* ============================================================
   1. CALCULATE EMI
   ============================================================ */

/**
 * POST /api/loans/emi
 *
 * Body:
 * {
 *   "principal": 5000000,
 *   "annualInterestRate": 8.5,
 *   "tenureMonths": 240
 * }
 */

async function calculateEMI(
  req,
  res
) {
  try {
    const principal =
      parseNumber(
        req.body?.principal ||
        req.body?.loanAmount ||
        req.body?.amount
      );

    const annualInterestRate =
      parseNumber(
        req.body?.annualInterestRate ||
        req.body?.interestRate ||
        req.body?.rate
      );

    const tenureMonths =
      parseNumber(
        req.body?.tenureMonths ||
        req.body?.tenure
      );

    if (
      !positiveNumber(
        principal
      )
    ) {
      return failure(
        res,
        400,
        'A valid loan amount is required.'
      );
    }

    if (
      annualInterestRate === null ||
      annualInterestRate < 0
    ) {
      return failure(
        res,
        400,
        'A valid interest rate is required.'
      );
    }

    if (
      !positiveNumber(
        tenureMonths
      )
    ) {
      return failure(
        res,
        400,
        'A valid loan tenure is required.'
      );
    }

    const service =
      getLoanService();

    if (service) {
      const method =
        service.calculateEMI ||
        service.calculateEmi;

      if (
        typeof method ===
        'function'
      ) {
        const result =
          await method.call(
            service,
            {
              principal,
              annualInterestRate,
              tenureMonths
            }
          );

        return success(
          res,
          result,
          'EMI calculated successfully.'
        );
      }
    }

    /*
     * Fallback calculation.
     */

    const monthlyRate =
      annualInterestRate /
      12 /
      100;

    let emi;

    if (
      monthlyRate === 0
    ) {
      emi =
        principal /
        tenureMonths;
    } else {
      emi =
        principal *
        monthlyRate *
        Math.pow(
          1 + monthlyRate,
          tenureMonths
        ) /
        (
          Math.pow(
            1 + monthlyRate,
            tenureMonths
          ) - 1
        );
    }

    const totalPayment =
      emi * tenureMonths;

    const totalInterest =
      totalPayment -
      principal;

    return success(
      res,
      {
        principal,

        annualInterestRate,

        tenureMonths,

        monthlyEMI:
          Number(
            emi.toFixed(2)
          ),

        totalInterest:
          Number(
            totalInterest.toFixed(2)
          ),

        totalPayment:
          Number(
            totalPayment.toFixed(2)
          )
      },
      'EMI calculated successfully.'
    );
  } catch (error) {
    console.error(
      '[LOAN] EMI error:',
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
   2. CHECK ELIGIBILITY
   ============================================================ */

/**
 * POST /api/loans/eligibility
 */

async function checkEligibility(
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
      getLoanService();

    if (!service) {
      return failure(
        res,
        503,
        'Loan service is unavailable.'
      );
    }

    const method =
      service.checkEligibility ||
      service.checkLoanEligibility ||
      service.calculateEligibility;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Loan eligibility service is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          propertyId:
            req.body?.propertyId ||
            null,

          loanAmount:
            parseNumber(
              req.body?.loanAmount
            ),

          monthlyIncome:
            parseNumber(
              req.body?.monthlyIncome
            ),

          monthlyObligations:
            parseNumber(
              req.body?.monthlyObligations
            ),

          employmentType:
            req.body?.employmentType ||
            null,

          employmentStatus:
            req.body?.employmentStatus ||
            null,

          creditScore:
            parseNumber(
              req.body?.creditScore
            ),

          downPayment:
            parseNumber(
              req.body?.downPayment
            ),

          tenureMonths:
            parseNumber(
              req.body?.tenureMonths
            )
        }
      );

    await createAuditLog(
      req,
      'LOAN_ELIGIBILITY_CHECKED',
      {
        propertyId:
          req.body?.propertyId ||
          null
      }
    );

    return success(
      res,
      result,
      'Loan eligibility checked successfully.'
    );
  } catch (error) {
    console.error(
      '[LOAN] Eligibility error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to check loan eligibility.',
      error
    );
  }
}

/* ============================================================
   3. CREATE LOAN APPLICATION
   ============================================================ */

/**
 * POST /api/loans
 */

async function createLoanApplication(
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

    const loanAmount =
      parseNumber(
        req.body?.loanAmount ||
        req.body?.amount
      );

    if (
      loanAmount !== null &&
      loanAmount <= 0
    ) {
      return failure(
        res,
        400,
        'Loan amount must be greater than zero.'
      );
    }

    const service =
      getLoanService();

    if (!service) {
      return failure(
        res,
        503,
        'Loan service is unavailable.'
      );
    }

    const method =
      service.createLoanApplication ||
      service.createApplication ||
      service.applyForLoan;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Loan application service is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          userId,

          propertyId:
            req.body?.propertyId ||
            null,

          loanType:
            req.body?.loanType ||
            'home_loan',

          loanAmount,

          propertyValue:
            parseNumber(
              req.body?.propertyValue
            ),

          downPayment:
            parseNumber(
              req.body?.downPayment
            ),

          tenureMonths:
            parseNumber(
              req.body?.tenureMonths
            ),

          employmentType:
            req.body?.employmentType ||
            null,

          employmentStatus:
            req.body?.employmentStatus ||
            null,

          monthlyIncome:
            parseNumber(
              req.body?.monthlyIncome
            ),

          monthlyObligations:
            parseNumber(
              req.body?.monthlyObligations
            ),

          creditScore:
            parseNumber(
              req.body?.creditScore
            ),

          bankPreference:
            req.body?.bankPreference ||
            null,

          notes:
            req.body?.notes ||
            null
        }
      );

    await createAuditLog(
      req,
      'LOAN_APPLICATION_CREATED',
      {
        loanId:
          result?.id ||
          result?.loanId ||
          null,

        propertyId:
          req.body?.propertyId ||
          null
      }
    );

    return success(
      res,
      result,
      'Loan application created successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[LOAN] Create application error:',
      error
    );

    if (
      error?.code ===
      'PROPERTY_NOT_FOUND'
    ) {
      return failure(
        res,
        404,
        'Property not found.'
      );
    }

    if (
      error?.code ===
      'INELIGIBLE'
    ) {
      return failure(
        res,
        422,
        'You are not currently eligible for this loan.'
      );
    }

    return failure(
      res,
      500,
      'Unable to create loan application.',
      error
    );
  }
}

/* ============================================================
   4. LIST MY LOANS
   ============================================================ */

/**
 * GET /api/loans
 */

async function listLoans(
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
      getLoanService();

    if (!service) {
      return failure(
        res,
        503,
        'Loan service is unavailable.'
      );
    }

    const method =
      service.getUserLoans ||
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

    const result =
      await method.call(
        service,
        {
          userId,

          status:
            req.query?.status ||
            null,

          loanType:
            req.query?.loanType ||
            null,

          propertyId:
            req.query?.propertyId ||
            null,

          page:
            Math.max(
              Number(
                req.query?.page
              ) || 1,
              1
            ),

          limit:
            Math.min(
              Math.max(
                Number(
                  req.query?.limit
                ) || 20,
                1
              ),
              100
            )
        }
      );

    return success(
      res,
      result,
      'Loan applications retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[LOAN] List error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve loan applications.',
      error
    );
  }
}

/* ============================================================
   5. GET LOAN APPLICATION
   ============================================================ */

/**
 * GET /api/loans/:id
 */

async function getLoan(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const loanId =
      getLoanId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!loanId) {
      return failure(
        res,
        400,
        'Loan ID is required.'
      );
    }

    const service =
      getLoanService();

    if (!service) {
      return failure(
        res,
        503,
        'Loan service is unavailable.'
      );
    }

    const method =
      service.getLoan ||
      service.getLoanApplication ||
      service.findLoan;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Loan retrieval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          loanId,

          userId,

          role:
            getUserRole(req)
        }
      );

    if (!result) {
      return failure(
        res,
        404,
        'Loan application not found.'
      );
    }

    return success(
      res,
      result,
      'Loan application retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[LOAN] Get error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve loan application.',
      error
    );
  }
}

/* ============================================================
   6. UPDATE LOAN APPLICATION
   ============================================================ */

/**
 * PATCH /api/loans/:id
 */

async function updateLoan(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const loanId =
      getLoanId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!loanId) {
      return failure(
        res,
        400,
        'Loan ID is required.'
      );
    }

    const service =
      getLoanService();

    if (!service) {
      return failure(
        res,
        503,
        'Loan service is unavailable.'
      );
    }

    const method =
      service.updateLoan ||
      service.updateLoanApplication;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Loan update is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          loanId,

          userId,

          loanAmount:
            parseNumber(
              req.body?.loanAmount
            ),

          propertyValue:
            parseNumber(
              req.body?.propertyValue
            ),

          downPayment:
            parseNumber(
              req.body?.downPayment
            ),

          tenureMonths:
            parseNumber(
              req.body?.tenureMonths
            ),

          employmentType:
            req.body?.employmentType,

          employmentStatus:
            req.body?.employmentStatus,

          monthlyIncome:
            parseNumber(
              req.body?.monthlyIncome
            ),

          monthlyObligations:
            parseNumber(
              req.body?.monthlyObligations
            ),

          bankPreference:
            req.body?.bankPreference,

          notes:
            req.body?.notes
        }
      );

    await createAuditLog(
      req,
      'LOAN_APPLICATION_UPDATED',
      {
        loanId
      }
    );

    return success(
      res,
      result,
      'Loan application updated successfully.'
    );
  } catch (error) {
    console.error(
      '[LOAN] Update error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to update loan application.',
      error
    );
  }
}

/* ============================================================
   7. LOAN STATUS
   ============================================================ */

/**
 * GET /api/loans/:id/status
 */

async function getLoanStatus(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const loanId =
      getLoanId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!loanId) {
      return failure(
        res,
        400,
        'Loan ID is required.'
      );
    }

    const service =
      getLoanService();

    const method =
      service?.getLoanStatus ||
      service?.getStatus;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Loan status service is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          loanId,

          userId,

          role:
            getUserRole(req)
        }
      );

    return success(
      res,
      result,
      'Loan status retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[LOAN] Status error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve loan status.',
      error
    );
  }
}

/* ============================================================
   8. LOAN OFFERS
   ============================================================ */

/**
 * GET /api/loans/:id/offers
 */

async function getLoanOffers(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const loanId =
      getLoanId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!loanId) {
      return failure(
        res,
        400,
        'Loan ID is required.'
      );
    }

    const service =
      getLoanService();

    const method =
      service?.getLoanOffers ||
      service?.getOffers;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Loan offers are not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          loanId,

          userId
        }
      );

    return success(
      res,
      result,
      'Loan offers retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[LOAN] Offers error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve loan offers.',
      error
    );
  }
}

/* ============================================================
   9. ACCEPT LOAN OFFER
   ============================================================ */

/**
 * POST /api/loans/:id/offers/:offerId/accept
 */

async function acceptLoanOffer(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const loanId =
      getLoanId(req);

    const offerId =
      req.params?.offerId;

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!loanId || !offerId) {
      return failure(
        res,
        400,
        'Loan ID and offer ID are required.'
      );
    }

    const service =
      getLoanService();

    const method =
      service?.acceptLoanOffer ||
      service?.acceptOffer;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Loan offer acceptance is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          loanId,

          offerId,

          userId
        }
      );

    await createAuditLog(
      req,
      'LOAN_OFFER_ACCEPTED',
      {
        loanId,

        offerId
      }
    );

    return success(
      res,
      result,
      'Loan offer accepted successfully.'
    );
  } catch (error) {
    console.error(
      '[LOAN] Accept offer error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to accept loan offer.',
      error
    );
  }
}

/* ============================================================
   10. CANCEL LOAN
   ============================================================ */

/**
 * POST /api/loans/:id/cancel
 */

async function cancelLoan(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const loanId =
      getLoanId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!loanId) {
      return failure(
        res,
        400,
        'Loan ID is required.'
      );
    }

    const service =
      getLoanService();

    const method =
      service?.cancelLoan ||
      service?.cancelLoanApplication;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Loan cancellation is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          loanId,

          userId,

          reason:
            req.body?.reason ||
            null
        }
      );

    await createAuditLog(
      req,
      'LOAN_CANCELLED',
      {
        loanId
      }
    );

    return success(
      res,
      result,
      'Loan application cancelled successfully.'
    );
  } catch (error) {
    console.error(
      '[LOAN] Cancel error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to cancel loan application.',
      error
    );
  }
}

/* ============================================================
   11. SUBMIT LOAN DOCUMENT
   ============================================================ */

/**
 * POST /api/loans/:id/documents
 *
 * This controller expects the upload middleware
 * to populate req.file / req.files.
 */

async function uploadLoanDocument(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const loanId =
      getLoanId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!loanId) {
      return failure(
        res,
        400,
        'Loan ID is required.'
      );
    }

    const files = [];

    if (req.file) {
      files.push(req.file);
    }

    if (
      Array.isArray(
        req.files
      )
    ) {
      files.push(
        ...req.files
      );
    }

    if (
      req.files &&
      !Array.isArray(req.files) &&
      typeof req.files ===
        'object'
    ) {
      Object.values(
        req.files
      ).forEach(group => {
        if (Array.isArray(group)) {
          files.push(
            ...group
          );
        }
      });
    }

    if (!files.length) {
      return failure(
        res,
        400,
        'At least one loan document is required.'
      );
    }

    const service =
      getLoanService();

    const method =
      service?.uploadLoanDocument ||
      service?.addLoanDocument ||
      service?.submitLoanDocument;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Loan document upload is not implemented.'
      );
    }

    const results = [];

    for (
      const file of files
    ) {
      const result =
        await method.call(
          service,
          {
            loanId,

            userId,

            file,

            documentType:
              req.body?.documentType ||
              req.body?.type ||
              'other',

            description:
              req.body?.description ||
              null
          }
        );

      results.push(result);
    }

    await createAuditLog(
      req,
      'LOAN_DOCUMENT_UPLOADED',
      {
        loanId,

        count:
          results.length
      }
    );

    return success(
      res,
      {
        documents:
          results
      },
      'Loan document uploaded successfully.',
      201
    );
  } catch (error) {
    console.error(
      '[LOAN] Document upload error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to upload loan document.',
      error
    );
  }
}

/* ============================================================
   12. LOAN DOCUMENTS
   ============================================================ */

/**
 * GET /api/loans/:id/documents
 */

async function getLoanDocuments(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const loanId =
      getLoanId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!loanId) {
      return failure(
        res,
        400,
        'Loan ID is required.'
      );
    }

    const service =
      getLoanService();

    const method =
      service?.getLoanDocuments ||
      service?.listLoanDocuments;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Loan document listing is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          loanId,

          userId
        }
      );

    return success(
      res,
      result,
      'Loan documents retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[LOAN] Documents error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve loan documents.',
      error
    );
  }
}

/* ============================================================
   13. ADMIN LIST LOANS
   ============================================================ */

/**
 * GET /api/loans/admin/all
 */

async function adminListLoans(
  req,
  res
) {
  try {
    const adminId =
      getUserId(req);

    if (!adminId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    const service =
      getLoanService();

    const method =
      service?.adminListLoans ||
      service?.getAllLoans ||
      service?.listAllLoans;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Admin loan listing is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          adminId,

          userId:
            req.query?.userId ||
            null,

          status:
            req.query?.status ||
            null,

          loanType:
            req.query?.loanType ||
            null,

          page:
            Math.max(
              Number(
                req.query?.page
              ) || 1,
              1
            ),

          limit:
            Math.min(
              Math.max(
                Number(
                  req.query?.limit
                ) || 50,
                1
              ),
              100
            )
        }
      );

    return success(
      res,
      result,
      'Loan applications retrieved for administration.'
    );
  } catch (error) {
    console.error(
      '[LOAN] Admin list error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve admin loan applications.',
      error
    );
  }
}

/* ============================================================
   14. ADMIN APPROVE LOAN
   ============================================================ */

/**
 * POST /api/loans/:id/approve
 */

async function approveLoan(
  req,
  res
) {
  try {
    const adminId =
      getUserId(req);

    const loanId =
      getLoanId(req);

    if (!adminId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!loanId) {
      return failure(
        res,
        400,
        'Loan ID is required.'
      );
    }

    const service =
      getLoanService();

    const method =
      service?.approveLoan ||
      service?.approveLoanApplication;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Loan approval is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          loanId,

          reviewerId:
            adminId,

          approvedAmount:
            parseNumber(
              req.body?.approvedAmount
            ),

          interestRate:
            parseNumber(
              req.body?.interestRate
            ),

          tenureMonths:
            parseNumber(
              req.body?.tenureMonths
            ),

          notes:
            req.body?.notes ||
            null
        }
      );

    await createAuditLog(
      req,
      'LOAN_APPROVED',
      {
        loanId
      }
    );

    return success(
      res,
      result,
      'Loan approved successfully.'
    );
  } catch (error) {
    console.error(
      '[LOAN] Approve error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to approve loan.',
      error
    );
  }
}

/* ============================================================
   15. ADMIN REJECT LOAN
   ============================================================ */

/**
 * POST /api/loans/:id/reject
 */

async function rejectLoan(
  req,
  res
) {
  try {
    const adminId =
      getUserId(req);

    const loanId =
      getLoanId(req);

    const reason =
      typeof req.body?.reason ===
      'string'
        ? req.body.reason.trim()
        : '';

    if (!adminId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!loanId) {
      return failure(
        res,
        400,
        'Loan ID is required.'
      );
    }

    if (!reason) {
      return failure(
        res,
        400,
        'A rejection reason is required.'
      );
    }

    const service =
      getLoanService();

    const method =
      service?.rejectLoan ||
      service?.rejectLoanApplication;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Loan rejection is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          loanId,

          reviewerId:
            adminId,

          reason
        }
      );

    await createAuditLog(
      req,
      'LOAN_REJECTED',
      {
        loanId,

        reason
      }
    );

    return success(
      res,
      result,
      'Loan rejected successfully.'
    );
  } catch (error) {
    console.error(
      '[LOAN] Reject error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to reject loan.',
      error
    );
  }
}

/* ============================================================
   16. LOAN REVIEW / NOTES
   ============================================================ */

/**
 * POST /api/loans/:id/review
 */

async function reviewLoan(
  req,
  res
) {
  try {
    const reviewerId =
      getUserId(req);

    const loanId =
      getLoanId(req);

    if (!reviewerId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!loanId) {
      return failure(
        res,
        400,
        'Loan ID is required.'
      );
    }

    const service =
      getLoanService();

    const method =
      service?.reviewLoan ||
      service?.addLoanReview;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Loan review is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          loanId,

          reviewerId,

          status:
            req.body?.status ||
            null,

          notes:
            req.body?.notes ||
            null,

          decision:
            req.body?.decision ||
            null
        }
      );

    await createAuditLog(
      req,
      'LOAN_REVIEWED',
      {
        loanId
      }
    );

    return success(
      res,
      result,
      'Loan review saved successfully.'
    );
  } catch (error) {
    console.error(
      '[LOAN] Review error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to save loan review.',
      error
    );
  }
}

/* ============================================================
   17. LOAN HISTORY
   ============================================================ */

/**
 * GET /api/loans/:id/history
 */

async function getLoanHistory(
  req,
  res
) {
  try {
    const userId =
      getUserId(req);

    const loanId =
      getLoanId(req);

    if (!userId) {
      return failure(
        res,
        401,
        'Authentication required.'
      );
    }

    if (!loanId) {
      return failure(
        res,
        400,
        'Loan ID is required.'
      );
    }

    const service =
      getLoanService();

    const method =
      service?.getLoanHistory ||
      service?.getHistory;

    if (
      typeof method !==
      'function'
    ) {
      return failure(
        res,
        501,
        'Loan history is not implemented.'
      );
    }

    const result =
      await method.call(
        service,
        {
          loanId,

          userId,

          role:
            getUserRole(req)
        }
      );

    return success(
      res,
      result,
      'Loan history retrieved successfully.'
    );
  } catch (error) {
    console.error(
      '[LOAN] History error:',
      error
    );

    return failure(
      res,
      500,
      'Unable to retrieve loan history.',
      error
    );
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  calculateEMI,

  checkEligibility,

  createLoanApplication,

  listLoans,

  getLoan,

  updateLoan,

  getLoanStatus,

  getLoanOffers,

  acceptLoanOffer,

  cancelLoan,

  uploadLoanDocument,

  getLoanDocuments,

  adminListLoans,

  approveLoan,

  rejectLoan,

  reviewLoan,

  getLoanHistory
};