/* GHAR Seller module */
window.GHAR = window.GHAR || {};
GHAR.seller = GHAR.seller || {};
GHAR.seller.init = function () {
  document.dispatchEvent(new CustomEvent("ghar:seller:ready"));
};
