/* GHAR Tenant — payments.js */
window.GHAR = window.GHAR || {};
GHAR.tenant = GHAR.tenant || {};
GHAR.tenant["payments"] = GHAR.tenant["payments"] || {};

GHAR.tenant["payments"].init = function (options = {}) {
  return { module: "payments", options };
};
