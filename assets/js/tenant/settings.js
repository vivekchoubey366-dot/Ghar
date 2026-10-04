/* GHAR Tenant — settings.js */
window.GHAR = window.GHAR || {};
GHAR.tenant = GHAR.tenant || {};
GHAR.tenant["settings"] = GHAR.tenant["settings"] || {};

GHAR.tenant["settings"].init = function (options = {}) {
  return { module: "settings", options };
};
