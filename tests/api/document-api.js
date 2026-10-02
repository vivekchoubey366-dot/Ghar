(function(window){"use strict";
window.GHAR=window.GHAR||{};window.GHAR.documentAPI={list:(p={})=>{const q=new URLSearchParams(p);return GHAR.api.get(`/documents${q.toString()?"?"+q:""}`)},upload:(file,m={})=>{const f=new FormData();f.append("file",file);Object.entries(m).forEach(([k,v])=>f.append(k,v));return GHAR.api.post("/documents",f)},get:id=>GHAR.api.get(`/documents/${encodeURIComponent(id)}`),remove:id=>GHAR.api.delete(`/documents/${encodeURIComponent(id)}`)};
})(window);
