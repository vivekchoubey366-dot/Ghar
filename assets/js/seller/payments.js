/* GHAR Seller — payments.js */
window.GHAR = window.GHAR || {};
GHAR.seller = GHAR.seller || {};
GHAR.seller["payments"] = GHAR.seller["payments"] || {};

GHAR.seller["payments"].init = function (options = {}) {
  return { module: "payments", options };
};
