"use strict";
const BaseModel = require("./_base");
class AuditLog extends BaseModel {
  static entity = "AuditLog";
  static fields = [
    "id",
    "actorId",
    "action",
    "entityType",
    "entityId",
    "ip",
    "userAgent",
    "metadata"
  ];
  /**
   * Common GHAR audit actions.
   *
   * Additional actions can be added as the application grows.
   */
  static actions = [
    "create",
    "read",
    "update",
    "delete",
    "login",
    "logout",
    "login_failed",
    "register",
    "password_changed",
    "password_reset",
    "email_verified",
    "phone_verified",
    "document_uploaded",
    "document_deleted",
    "verification_submitted",
    "verification_approved",
    "verification_rejected",
    "application_submitted",
    "application_approved",
    "application_rejected",
    "application_withdrawn",
    "property_created",
    "property_updated",
    "property_deleted",
    "offer_created",
    "offer_accepted",
    "offer_rejected",
    "payment_created",
    "payment_completed",
    "payment_failed",
    "refund_created",
    "subscription_created",
    "subscription_updated",
    "subscription_cancelled",
    "loan_created",
    "loan_updated",
    "ai_request",
    "admin_action",
    "security_event"
  ];
  /**
   * Entities that can be audited.
   */
  static entityTypes = [
    "User",
    "Admin",
    "Property",
    "Application",
    "Document",
    "Loan",
    "Offer",
    "Payment",
    "Subscription",
    "AIRequest",
    "AIUsage",
    "AIConversation",
    "AIMessage",
    "AIPrediction",
    "AIRecommendation",
    "Visit",
    "Message",
    "Referral",
    "Marketplace",
    "Verification",
    "Search",
    "System"
  ];
  static MAX_ACTION_LENGTH = 100;
  static MAX_ENTITY_TYPE_LENGTH = 100;
  static MAX_ENTITY_ID_LENGTH = 200;
  static MAX_IP_LENGTH = 100;
  static MAX_USER_AGENT_LENGTH = 1000;
  /**
   * Validate audit log data.
   */
  static validate(data = {}) {
    const errors = [];
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return {
        valid: false,
        errors: [
          "Audit log data must be an object"
        ]
      };
    }
    /**
     * Null protection.
     */
    for (const field of this.fields) {
      if (
        Object.prototype.hasOwnProperty.call(
          data,
          field
        ) &&
        data[field] === null
      ) {
        errors.push(
          `${field} cannot be null`
        );
      }
    }
    /**
     * actorId.
     *
     * actorId may be omitted for system-generated
     * events.
     */
    if (
      data.actorId !== undefined
    ) {
      if (
        typeof data.actorId !== "string" ||
        data.actorId.trim() === ""
      ) {
        errors.push(
          "actorId must be a non-empty string"
        );
      }
    }
    /**
     * action.
     */
    if (
      data.action !== undefined
    ) {
      if (
        typeof data.action !== "string"
      ) {
        errors.push(
          "action must be a string"
        );
      } else if (
        data.action.trim().length === 0
      ) {
        errors.push(
          "action cannot be empty"
        );
      } else if (
        data.action.length >
        this.MAX_ACTION_LENGTH
      ) {
        errors.push(
          `action cannot exceed ${this.MAX_ACTION_LENGTH} characters`
        );
      }
    }
    /**
     * entityType.
     */
    if (
      data.entityType !== undefined
    ) {
      if (
        typeof data.entityType !== "string"
      ) {
        errors.push(
          "entityType must be a string"
        );
      } else if (
        data.entityType.trim().length === 0
      ) {
        errors.push(
          "entityType cannot be empty"
        );
      } else if (
        data.entityType.length >
        this.MAX_ENTITY_TYPE_LENGTH
      ) {
        errors.push(
          `entityType cannot exceed ${this.MAX_ENTITY_TYPE_LENGTH} characters`
        );
      }
    }
    /**
     * entityId.
     */
    if (
      data.entityId !== undefined
    ) {
      if (
        typeof data.entityId !== "string" &&
        typeof data.entityId !== "number"
      ) {
        errors.push(
          "entityId must be a string or number"
        );
      } else if (
        String(data.entityId).trim() === ""
      ) {
        errors.push(
          "entityId cannot be empty"
        );
      } else if (
        String(data.entityId).length >
        this.MAX_ENTITY_ID_LENGTH
      ) {
        errors.push(
          `entityId cannot exceed ${this.MAX_ENTITY_ID_LENGTH} characters`
        );
      }
    }
    /**
     * IP address.
     *
     * IPv4, IPv6 and proxy-derived values are supported.
     * Exact IP parsing can remain at the middleware layer.
     */
    if (
      data.ip !== undefined
    ) {
      if (
        typeof data.ip !== "string"
      ) {
        errors.push(
          "ip must be a string"
        );
      } else if (
        data.ip.length >
        this.MAX_IP_LENGTH
      ) {
        errors.push(
          `ip cannot exceed ${this.MAX_IP_LENGTH} characters`
        );
      }
    }
    /**
     * User agent.
     */
    if (
      data.userAgent !== undefined
    ) {
      if (
        typeof data.userAgent !== "string"
      ) {
        errors.push(
          "userAgent must be a string"
        );
      } else if (
        data.userAgent.length >
        this.MAX_USER_AGENT_LENGTH
      ) {
        errors.push(
          `userAgent cannot exceed ${this.MAX_USER_AGENT_LENGTH} characters`
        );
      }
    }
    /**
     * Metadata.
     */
    if (
      data.metadata !== undefined
    ) {
      if (
        typeof data.metadata !== "object" ||
        Array.isArray(data.metadata)
      ) {
        errors.push(
          "metadata must be an object"
        );
      }
    }
    return {
      valid:
        errors.length === 0,
      errors
    };
  }
  /**
   * Create an audit log.
   */
  static create(data = {}) {
    const normalized = {
      ...data
    };
    /**
     * Normalize actor ID.
     */
    if (
      typeof normalized.actorId ===
      "string"
    ) {
      normalized.actorId =
        normalized.actorId.trim();
    }
    /**
     * Normalize action.
     */
    if (
      typeof normalized.action ===
      "string"
    ) {
      normalized.action =
        normalized.action
          .trim()
          .toLowerCase();
    }
    /**
     * Normalize entity type.
     */
    if (
      typeof normalized.entityType ===
      "string"
    ) {
      normalized.entityType =
        normalized.entityType.trim();
    }
    /**
     * Normalize entity ID.
     */
    if (
      normalized.entityId !== undefined &&
      normalized.entityId !== null
    ) {
      normalized.entityId =
        String(
          normalized.entityId
        ).trim();
    }
    /**
     * Normalize network information.
     */
    if (
      typeof normalized.ip ===
      "string"
    ) {
      normalized.ip =
        normalized.ip.trim();
    }
    if (
      typeof normalized.userAgent ===
      "string"
    ) {
      normalized.userAgent =
        normalized.userAgent.trim();
    }
    /**
     * Default metadata.
     */
    if (
      normalized.metadata === undefined
    ) {
      normalized.metadata = {};
    }
    const check =
      this.validate(
        normalized
      );
    if (
      !check.valid
    ) {
      const error =
        new Error(
          "Audit log validation failed"
        );
      error.status = 422;
      error.code =
        "AUDIT_LOG_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Check whether an action is supported.
   */
  static isValidAction(
    action
  ) {
    return this.actions.includes(
      action
    );
  }
  /**
   * Check whether an entity type is supported.
   */
  static isValidEntityType(
    entityType
  ) {
    return this.entityTypes.includes(
      entityType
    );
  }
  /**
   * Check whether this is a system-generated event.
   */
  isSystemAction() {
    return (
      !this.actorId ||
      this.entityType ===
      "System"
    );
  }
  /**
   * Check whether this action is security-sensitive.
   */
  isSecurityEvent() {
    return [
      "login",
      "logout",
      "login_failed",
      "password_changed",
      "password_reset",
      "email_verified",
      "phone_verified",
      "security_event",
      "admin_action"
    ].includes(
      this.action
    );
  }
  /**
   * Check whether this action modified data.
   */
  isMutation() {
    return [
      "create",
      "update",
      "delete",
      "property_created",
      "property_updated",
      "property_deleted",
      "application_submitted",
      "application_approved",
      "application_rejected",
      "offer_created",
      "offer_accepted",
      "offer_rejected",
      "payment_created",
      "payment_completed",
      "payment_failed",
      "subscription_created",
      "subscription_updated",
      "subscription_cancelled"
    ].includes(
      this.action
    );
  }
  /**
   * Add metadata without replacing existing metadata.
   */
  setMetadata(
    metadata = {}
  ) {
    if (
      !metadata ||
      typeof metadata !== "object" ||
      Array.isArray(metadata)
    ) {
      const error =
        new Error(
          "metadata must be an object"
        );
      error.status = 422;
      error.code =
        "INVALID_AUDIT_METADATA";
      throw error;
    }
    this.metadata = {
      ...(this.metadata || {}),
      ...metadata
    };
    return this;
  }
  /**
   * Get a metadata value.
   */
  getMetadata(
    key,
    defaultValue = null
  ) {
    if (
      !this.metadata ||
      typeof this.metadata !== "object"
    ) {
      return defaultValue;
    }
    return (
      this.metadata[key] ??
      defaultValue
    );
  }
  /**
   * Return a safe API representation.
   *
   * Audit logs should generally be exposed only to
   * authorized administrators/security personnel.
   */
  toJSON() {
    return {
      id:
        this.id,
      actorId:
        this.actorId ?? null,
      action:
        this.action,
      entityType:
        this.entityType,
      entityId:
        this.entityId ?? null,
      ip:
        this.ip ?? null,
      userAgent:
        this.userAgent ?? null,
      metadata:
        this.metadata || {}
    };
  }
}
module.exports = AuditLog;

GHAR audit flow

Request
   │
   ▼
request-id.middleware
   │
   ▼
auth.middleware
   │
   ▼
controller / service
   │
   ├── success ──────┐
   └── failure ──────┤
                     ▼
              audit.middleware
                     │
                     ▼
                 AuditLog
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
        actor      entity     metadata
        user       changed    context

One important architectural point: don’t allow normal clients to directly create or modify AuditLog records. Your audit.middleware/audit service should create them server-side, and your admin routes should normally expose them read-only. This preserves the audit trail’s integrity.