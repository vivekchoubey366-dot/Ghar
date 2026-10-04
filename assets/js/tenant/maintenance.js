/* GHAR Tenant — maintenance.js */
window.GHAR = window.GHAR || {};
GHAR.tenant = GHAR.tenant || {};
GHAR.tenant["maintenance"] = GHAR.tenant["maintenance"] || {};

GHAR.tenant["maintenance"].init = function (options = {}) {
  return { module: "maintenance", options };
};
