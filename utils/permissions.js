const ROLE_PERMISSIONS = {
  admin: ['*'],
  agent: ['properties:read','properties:create','properties:update','leads:read','visits:manage','offers:manage'],
  seller: ['properties:read','properties:create','properties:update','properties:delete','offers:read','visits:manage'],
  buyer: ['properties:read','offers:create','visits:create','documents:manage','payments:read'],
  tenant: ['properties:read','applications:create','visits:create','payments:read','maintenance:create']
};

function permissionsForRole(role) { return ROLE_PERMISSIONS[role] || []; }

function can(role, permission) {
  const list = permissionsForRole(role);
  return list.includes('*') || list.includes(permission);
}

function assertCan(role, permission) {
  if (!can(role, permission)) {
    const { AuthorizationError } = require('./errors');
    throw new AuthorizationError(`Permission denied: ${permission}`);
  }
  return true;
}

module.exports = { ROLE_PERMISSIONS, permissionsForRole, can, assertCan };
