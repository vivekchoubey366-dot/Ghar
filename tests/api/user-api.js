(function(window){"use strict";
window.GHAR=window.GHAR||{};window.GHAR.userAPI={profile:()=>GHAR.api.get("/users/me"),updateProfile:p=>GHAR.api.put("/users/me",p),get:id=>GHAR.api.get(`/users/${encodeURIComponent(id)}`),changePassword:p=>GHAR.api.post("/users/me/change-password",p),uploadAvatar:file=>{const f=new FormData();f.append("avatar",file);return GHAR.api.post("/users/me/avatar",f)}};
})(window);
