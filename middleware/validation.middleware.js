"use strict";

function validateRequest(validator) {
  if (typeof validator !== "function") {
    throw new TypeError("validateRequest expects a validator function.");
  }

  return async (req, res, next) => {
    try {
      const result = await validator({
        body: req.body,
        params: req.params,
        query: req.query,
        headers: req.headers,
        user: req.user,
        request: req
      });

      if (result === true || result == null) return next();

      const errors = Array.isArray(result)
        ? result
        : result.errors || ["Invalid request."];

      if (result?.valid === true) return next();

      return res.status(422).json({
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "One or more fields are invalid.",
          details: errors,
          requestId: req.requestId || null
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

function requireFields(fields = []) {
  const required = Array.isArray(fields) ? fields : [fields];

  return validateRequest(({ body }) => {
    const errors = [];

    for (const field of required) {
      const value = body?.[field];
      if (value === undefined || value === null || String(value).trim() === "") {
        errors.push({
          field,
          message: `${field} is required.`
        });
      }
    }

    return errors;
  });
}

module.exports = { validateRequest, requireFields };
