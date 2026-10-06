"use strict";
/**
 * GHAR Model Registry
 *
 * Central export point for all application models.
 *
 * Usage:
 *
 * const {
 *   User,
 *   Property,
 *   Favourite
 * } = require("./models");
 *
 * const favourite =
 *   Favourite.create({
 *     userId: user.id,
 *     propertyId: property.id
 *   });
 */
/* =========================================================
 * BASE
 * ========================================================= */
const BaseModel = require("./_base");
/* =========================================================
 * USER / AUTH
 * ========================================================= */
const User = require("./User");
/* =========================================================
 * PROPERTY
 * ========================================================= */
const Property = require("./Property");
const PropertyImage = require("./PropertyImage");
const PropertyDocument = require("./PropertyDocument");
const Favourite = require("./Favourite.model");
const SavedSearch = require("./SavedSearch");
/* =========================================================
 * LEADS / OFFERS / VISITS
 * ========================================================= */
const Offer = require("./Offer");
const Visit = require("./Visit");
const Lead = require("./Lead");
/* =========================================================
 * APPLICATIONS / DOCUMENTS / VERIFICATION
 * ========================================================= */
const Application = require("./Application");
const Document = require("./Document");
const Verification = require("./Verification");
/* =========================================================
 * PAYMENTS / BILLING
 * ========================================================= */
const Payment = require("./Payment");
const Invoice = require("./Invoice");
const Subscription = require("./Subscription");
/* =========================================================
 * REFERRALS / NOTIFICATIONS
 * ========================================================= */
const Referral = require("./Referral");
const Notification = require("./Notification");
/* =========================================================
 * COMMUNICATION
 * ========================================================= */
const Message = require("./Message");
const Conversation = require("./Conversation");
/* =========================================================
 * SUPPORT
 * ========================================================= */
const SupportTicket = require("./SupportTicket");
/* =========================================================
 * LOANS
 * ========================================================= */
const Loan = require("./Loan");
const LoanApplication = require("./LoanApplication");
/* =========================================================
 * AI
 * ========================================================= */
const AIConversation = require("./AIConversation");
const AIMessage = require("./AIMessage");
const AIUsage = require("./AIUsage");
const AIRequest = require("./AIRequest");
const AIRecommendation = require("./AIRecommendation");
const AIPrediction = require("./AIPrediction");
const AIModel = require("./AIModel");
/* =========================================================
 * AUDIT / SECURITY
 * ========================================================= */
const AuditLog = require("./AuditLog");
/* =========================================================
 * MODEL REGISTRY
 * ========================================================= */
const models = {
  BaseModel,
  /* User / Auth */
  User,
  /* Property */
  Property,
  PropertyImage,
  PropertyDocument,
  Favourite,
  SavedSearch,
  /* Leads / Offers / Visits */
  Offer,
  Visit,
  Lead,
  /* Applications / Documents */
  Application,
  Document,
  Verification,
  /* Payments / Billing */
  Payment,
  Invoice,
  Subscription,
  /* Referrals / Notifications */
  Referral,
  Notification,
  /* Communication */
  Message,
  Conversation,
  /* Support */
  SupportTicket,
  /* Loans */
  Loan,
  LoanApplication,
  /* AI */
  AIConversation,
  AIMessage,
  AIUsage,
  AIRequest,
  AIRecommendation,
  AIPrediction,
  AIModel,
  /* Audit / Security */
  AuditLog
};
/* =========================================================
 * MODEL VALIDATION
 * ========================================================= */
/**
 * Validate that every registered model is a constructor.
 */
for (
  const [name, Model] of Object.entries(models)
) {
  if (
    typeof Model !== "function"
  ) {
    throw new TypeError(
      `GHAR model "${name}" must export a class/function`
    );
  }
}
/* =========================================================
 * MODEL METADATA
 * ========================================================= */
/**
 * Return all registered model names.
 */
Object.defineProperty(
  models,
  "modelNames",
  {
    enumerable: false,
    configurable: false,
    get() {
      return Object.keys(
        this
      ).filter(
        (key) =>
          key !== "modelNames" &&
          key !== "get" &&
          key !== "has"
      );
    }
  }
);
/**
 * Check whether a model exists.
 */
Object.defineProperty(
  models,
  "has",
  {
    enumerable: false,
    configurable: false,
    value(name) {
      return Boolean(
        name &&
        Object.prototype.hasOwnProperty.call(
          this,
          name
        )
      );
    }
  }
);
/**
 * Retrieve a model by name.
 */
Object.defineProperty(
  models,
  "get",
  {
    enumerable: false,
    configurable: false,
    value(name) {
      if (
        !this.has(name)
      ) {
        const error =
          new Error(
            `Unknown GHAR model: ${name}`
          );
        error.code =
          "MODEL_NOT_FOUND";
        throw error;
      }
      return this[name];
    }
  }
);
/* =========================================================
 * EXPORT
 * ========================================================= */
module.exports = models;

Important change

Your new file is named:

Favourite.model.js

while your old registry had:

Favourite: require("./Favourite")

Those do not point to the same file. The updated registry therefore uses:

Favourite: require("./Favourite.model")

So your model directory should consistently follow either:

Favourite.model.js

or:

Favourite.js

but don’t keep both unless you deliberately need compatibility aliases.

You can now use:

const {
  User,
  Property,
  Favourite,
  Document,
  Application,
  Payment,
  Loan,
  AuditLog
} = require("./models");

and, for example:

const favourite = Favourite.create({
  userId: user.id,
  propertyId: property.id
});

This keeps the controllers, services, middleware, and database layer from importing individual model files all over the project.