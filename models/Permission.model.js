"use strict";
const BaseModel = require("./_base");
class Permission extends BaseModel {
  static entity = "Permission";
  static fields = [
    "id",
    "name",
    "key",
    "description",
    "resource",
    "action",
    "scope",
    "status",
    "metadata"
  ];
  /**
   * Supported permission actions.
   */
  static actions = [
    "create",
    "read",
    "update",
    "delete",
    "list",
    "view",
    "manage",
    "approve",
    "reject",
    "verify",
    "upload",
    "download",
    "export",
    "publish",
    "assign",
    "invite",
    "moderate",
    "process",
    "refund"
  ];
  /**
   * Supported scopes.
   */
  static scopes = [
    "own",
    "user",
    "team",
    "organization",
    "property",
    "all"
  ];
  /**
   * Permission states.
   */
  static statuses = [
    "active",
    "inactive",
    "deprecated"
  ];
  static MAX_NAME_LENGTH = 150;
  static MAX_KEY_LENGTH = 150;
  static MAX_DESCRIPTION_LENGTH = 1000;
  static MAX_RESOURCE_LENGTH = 100;
  static MAX_METADATA_KEYS = 50;
  /**
   * Validate permission.
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
          "Permission data must be an object"
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
     * Name.
     */
    if (
      data.name !== undefined
    ) {
      if (
        typeof data.name !== "string"
      ) {
        errors.push(
          "name must be a string"
        );
      } else if (
        data.name.trim().length === 0
      ) {
        errors.push(
          "name cannot be empty"
        );
      } else if (
        data.name.length >
        this.MAX_NAME_LENGTH
      ) {
        errors.push(
          `name cannot exceed ${this.MAX_NAME_LENGTH} characters`
        );
      }
    }
    /**
     * Permission key.
     */
    if (
      data.key !== undefined
    ) {
      if (
        typeof data.key !== "string"
      ) {
        errors.push(
          "key must be a string"
        );
      } else if (
        data.key.trim().length === 0
      ) {
        errors.push(
          "key cannot be empty"
        );
      } else if (
        data.key.length >
        this.MAX_KEY_LENGTH
      ) {
        errors.push(
          `key cannot exceed ${this.MAX_KEY_LENGTH} characters`
        );
      } else if (
        !/^[a-z0-9._:-]+$/i.test(
          data.key
        )
      ) {
        errors.push(
          "key contains invalid characters"
        );
      }
    }
    /**
     * Description.
     */
    if (
      data.description !== undefined
    ) {
      if (
        typeof data.description !==
        "string"
      ) {
        errors.push(
          "description must be a string"
        );
      } else if (
        data.description.length >
        this.MAX_DESCRIPTION_LENGTH
      ) {
        errors.push(
          `description cannot exceed ${this.MAX_DESCRIPTION_LENGTH} characters`
        );
      }
    }
    /**
     * Resource.
     */
    if (
      data.resource !== undefined
    ) {
      if (
        typeof data.resource !==
        "string"
      ) {
        errors.push(
          "resource must be a string"
        );
      } else if (
        data.resource.trim().length === 0
      ) {
        errors.push(
          "resource cannot be empty"
        );
      } else if (
        data.resource.length >
        this.MAX_RESOURCE_LENGTH
      ) {
        errors.push(
          `resource cannot exceed ${this.MAX_RESOURCE_LENGTH} characters`
        );
      }
    }
    /**
     * Action.
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
        data.action !== "*" &&
        !this.actions.includes(
          data.action
        )
      ) {
        errors.push(
          `action must be one of: ${this.actions.join(", ")} or *`
        );
      }
    }
    /**
     * Scope.
     */
    if (
      data.scope !== undefined
    ) {
      if (
        typeof data.scope !== "string"
      ) {
        errors.push(
          "scope must be a string"
        );
      } else if (
        !this.scopes.includes(
          data.scope
        )
      ) {
        errors.push(
          `scope must be one of: ${this.scopes.join(", ")}`
        );
      }
    }
    /**
     * Status.
     */
    if (
      data.status !== undefined
    ) {
      if (
        typeof data.status !== "string"
      ) {
        errors.push(
          "status must be a string"
        );
      } else if (
        !this.statuses.includes(
          data.status
        )
      ) {
        errors.push(
          `status must be one of: ${this.statuses.join(", ")}`
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
        typeof data.metadata !==
          "object" ||
        Array.isArray(
          data.metadata
        )
      ) {
        errors.push(
          "metadata must be an object"
        );
      } else if (
        Object.keys(
          data.metadata
        ).length >
        this.MAX_METADATA_KEYS
      ) {
        errors.push(
          `metadata cannot contain more than ${this.MAX_METADATA_KEYS} keys`
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
   * Create permission.
   */
  static create(data = {}) {
    const normalized = {
      ...data
    };
    /**
     * Normalize text.
     */
    for (
      const field of [
        "name",
        "key",
        "description",
        "resource",
        "action",
        "scope",
        "status"
      ]
    ) {
      if (
        typeof normalized[field] ===
        "string"
      ) {
        normalized[field] =
          normalized[field].trim();
      }
    }
    /**
     * Normalize key.
     */
    if (
      typeof normalized.key ===
      "string"
    ) {
      normalized.key =
        normalized.key.toLowerCase();
    }
    /**
     * Normalize resource.
     */
    if (
      typeof normalized.resource ===
      "string"
    ) {
      normalized.resource =
        normalized.resource.toLowerCase();
    }
    /**
     * Normalize action.
     */
    if (
      typeof normalized.action ===
      "string"
    ) {
      normalized.action =
        normalized.action.toLowerCase();
    }
    /**
     * Defaults.
     */
    if (
      normalized.scope === undefined
    ) {
      normalized.scope = "all";
    }
    if (
      normalized.status === undefined
    ) {
      normalized.status = "active";
    }
    if (
      normalized.metadata === undefined
    ) {
      normalized.metadata = {};
    }
    /**
     * Generate permission key when
     * resource + action are supplied.
     */
    if (
      !normalized.key &&
      normalized.resource &&
      normalized.action
    ) {
      normalized.key =
        `${normalized.resource}.${normalized.action}`;
    }
    /**
     * Generate name when possible.
     */
    if (
      !normalized.name &&
      normalized.resource &&
      normalized.action
    ) {
      normalized.name =
        `${normalized.resource} ${normalized.action}`;
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
          "Permission validation failed"
        );
      error.status = 422;
      error.code =
        "PERMISSION_VALIDATION_ERROR";
      error.details =
        check.errors;
      throw error;
    }
    return new this(
      normalized
    );
  }
  /**
   * Check whether permission is active.
   */
  isActive() {
    return (
      this.status === "active"
    );
  }
  /**
   * Check whether permission is inactive.
   */
  isInactive() {
    return (
      this.status === "inactive"
    );
  }
  /**
   * Check whether permission is deprecated.
   */
  isDeprecated() {
    return (
      this.status === "deprecated"
    );
  }
  /**
   * Check resource.
   */
  matchesResource(
    resource
  ) {
    if (
      typeof resource !== "string"
    ) {
      return false;
    }
    return (
      this.resource === "*" ||
      this.resource ===
        resource.toLowerCase()
    );
  }
  /**
   * Check action.
   */
  matchesAction(
    action
  ) {
    if (
      typeof action !== "string"
    ) {
      return false;
    }
    return (
      this.action === "*" ||
      this.action ===
        action.toLowerCase()
    );
  }
  /**
   * Check scope.
   */
  matchesScope(
    scope
  ) {
    if (
      typeof scope !== "string"
    ) {
      return false;
    }
    return (
      this.scope === "all" ||
      this.scope === scope
    );
  }
  /**
   * Check complete permission.
   */
  allows(
    resource,
    action,
    scope = "all"
  ) {
    if (
      !this.isActive()
    ) {
      return false;
    }
    return (
      this.matchesResource(
        resource
      ) &&
      this.matchesAction(
        action
      ) &&
      this.matchesScope(
        scope
      )
    );
  }
  /**
   * Compare against a permission key.
   *
   * Examples:
   * properties.read
   * properties.*
   * *.read
   * *
   */
  matchesKey(
    permissionKey
  ) {
    if (
      typeof permissionKey !==
      "string"
    ) {
      return false;
    }
    if (
      !this.isActive()
    ) {
      return false;
    }
    const key =
      permissionKey
        .trim()
        .toLowerCase();
    if (
      this.key === "*" ||
      this.key === key
    ) {
      return true;
    }
    const ownParts =
      String(this.key || "")
        .split(".");
    const requestedParts =
      key.split(".");
    if (
      ownParts.length !==
      requestedParts.length
    ) {
      return false;
    }
    return ownParts.every(
      (part, index) =>
        part === "*" ||
        part ===
          requestedParts[index]
    );
  }
  /**
   * Set active.
   */
  activate() {
    this.status = "active";
    this.touch();
    return this;
  }
  /**
   * Disable permission.
   */
  deactivate() {
    this.status = "inactive";
    this.touch();
    return this;
  }
  /**
   * Deprecate permission.
   */
  deprecate() {
    this.status = "deprecated";
    this.touch();
    return this;
  }
  /**
   * Set metadata.
   */
  setMetadata(
    key,
    value
  ) {
    if (
      typeof key !== "string" ||
      key.trim() === ""
    ) {
      const error =
        new Error(
          "Metadata key is required"
        );
      error.status = 422;
      error.code =
        "INVALID_METADATA_KEY";
      throw error;
    }
    if (
      !this.metadata ||
      typeof this.metadata !==
        "object" ||
      Array.isArray(
        this.metadata
      )
    ) {
      this.metadata = {};
    }
    this.metadata[
      key.trim()
    ] = value;
    this.touch();
    return this;
  }
  /**
   * Get metadata.
   */
  getMetadata(
    key,
    fallback = null
  ) {
    if (
      !this.metadata ||
      typeof this.metadata !==
        "object"
    ) {
      return fallback;
    }
    return Object.prototype.hasOwnProperty.call(
      this.metadata,
      key
    )
      ? this.metadata[key]
      : fallback;
  }
  /**
   * Return permission summary.
   */
  getSummary() {
    return {
      id:
        this.id ?? null,
      name:
        this.name ?? null,
      key:
        this.key ?? null,
      resource:
        this.resource ?? null,
      action:
        this.action ?? null,
      scope:
        this.scope ?? null,
      status:
        this.status,
      active:
        this.isActive()
    };
  }
  /**
   * Safe API representation.
   */
  toJSON() {
    return {
      id:
        this.id ?? null,
      name:
        this.name ?? null,
      key:
        this.key ?? null,
      description:
        this.description ?? null,
      resource:
        this.resource ?? null,
      action:
        this.action ?? null,
      scope:
        this.scope ?? null,
      status:
        this.status,
      metadata:
        this.metadata &&
        typeof this.metadata ===
          "object"
          ? {
              ...this.metadata
            }
          : {},
      createdAt:
        this.createdAt,
      updatedAt:
        this.updatedAt
    };
  }
}
module.exports = Permission;

Recommended permission keys for GHAR:

users.read
users.create
users.update
users.delete
properties.read
properties.create
properties.update
properties.delete
properties.publish
properties.verify
offers.create
offers.read
offers.update
offers.accept
offers.reject
applications.create
applications.read
applications.approve
applications.reject
documents.upload
documents.read
documents.verify
documents.delete
payments.read
payments.create
payments.refund
loans.create
loans.read
loans.approve
loans.reject
subscriptions.read
subscriptions.create
subscriptions.cancel
support.create
support.read
support.manage
admin.*
*

This model can work directly with your existing role.middleware.js and admin.middleware.js to provide RBAC-style permission checks.