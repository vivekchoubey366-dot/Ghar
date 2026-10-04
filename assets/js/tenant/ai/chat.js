/* GHAR Tenant AI — chat.js */
window.GHAR = window.GHAR || {};
GHAR.tenant = GHAR.tenant || {};
GHAR.tenant.ai = GHAR.tenant.ai || {};
GHAR.tenant.ai["chat"] = GHAR.tenant.ai["chat"] || {};

GHAR.tenant.ai["chat"].init = function (options = {}) {
  return { module: "chat", options };
};
