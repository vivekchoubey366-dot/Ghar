(function(window){"use strict";
window.GHAR=window.GHAR||{};window.GHAR.paymentAPI={createOrder:p=>GHAR.api.post("/payments/orders",p),verify:p=>GHAR.api.post("/payments/verify",p),history:(p={})=>{const q=new URLSearchParams(p);return GHAR.api.get(`/payments${q.toString()?"?"+q:""}`)},get:id=>GHAR.api.get(`/payments/${encodeURIComponent(id)}`),invoice:id=>GHAR.api.get(`/payments/${encodeURIComponent(id)}/invoice`)};
})(window);
