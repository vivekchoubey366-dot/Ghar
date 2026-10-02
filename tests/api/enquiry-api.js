(function(window){"use strict";
window.GHAR=window.GHAR||{};window.GHAR.enquiryAPI={create:p=>GHAR.api.post("/enquiries",p),list:(p={})=>{const q=new URLSearchParams(p);return GHAR.api.get(`/enquiries${q.toString()?"?"+q:""}`)},get:id=>GHAR.api.get(`/enquiries/${encodeURIComponent(id)}`),update:(id,p)=>GHAR.api.patch(`/enquiries/${encodeURIComponent(id)}`,p)};
})(window);
