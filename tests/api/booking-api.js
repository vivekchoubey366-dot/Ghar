(function(window){"use strict";
window.GHAR=window.GHAR||{};window.GHAR.bookingAPI={createVisit:p=>GHAR.api.post("/visits",p),visits:(p={})=>{const q=new URLSearchParams(p);return GHAR.api.get(`/visits${q.toString()?"?"+q:""}`)},updateVisit:(id,p)=>GHAR.api.patch(`/visits/${encodeURIComponent(id)}`,p),createBooking:p=>GHAR.api.post("/bookings",p),bookings:(p={})=>{const q=new URLSearchParams(p);return GHAR.api.get(`/bookings${q.toString()?"?"+q:""}`)},cancelBooking:id=>GHAR.api.post(`/bookings/${encodeURIComponent(id)}/cancel`)};
})(window);
