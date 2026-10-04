/* GHAR Tenant — applications.js */
window.GHAR = window.GHAR || {};
GHAR.tenant = GHAR.tenant || {};
GHAR.tenant["applications"] = GHAR.tenant["applications"] || {};

GHAR.tenant["applications"].init = function (options = {}) {
  return { module: "applications", options };
};
