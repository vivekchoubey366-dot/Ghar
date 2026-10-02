(function(window){"use strict";
const api=window.GHAR.propertyAPI={};
api.list=(p={})=>{const q=new URLSearchParams(p);return GHAR.api.get(`/properties${q.toString()?"?"+q:""}`)};api.get=id=>GHAR.api.get(`/properties/${encodeURIComponent(id)}`);api.create=p=>GHAR.api.post("/properties",p);api.update=(id,p)=>GHAR.api.put(`/properties/${encodeURIComponent(id)}`,p);api.remove=id=>GHAR.api.delete(`/properties/${encodeURIComponent(id)}`);api.save=id=>GHAR.api.post(`/properties/${encodeURIComponent(id)}/save`);api.unsave=id=>GHAR.api.delete(`/properties/${encodeURIComponent(id)}/save`);api.saved=()=>GHAR.api.get("/properties/saved");api.compare=ids=>GHAR.api.post("/properties/compare",{ids});
})(window);
