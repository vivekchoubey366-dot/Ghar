/* GHAR Tenant — tenant.js */
window.GHAR = window.GHAR || {};
GHAR.tenant = GHAR.tenant || {};
GHAR.tenant["tenant"] = GHAR.tenant["tenant"] || {};

GHAR.tenant["tenant"].init = function (options = {}) {
  return { module: "tenant", options };
};
