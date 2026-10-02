/* =========================================================
   GHAR -- ADMIN USERS
   ---------------------------------------------------------
   User Management
   List • Update • Deactivate
   Secure • Query-safe • Lightweight
   ========================================================= */

(function (window) {
    "use strict";

    window.GHAR = window.GHAR || {};

    const adminUsers = {

        /* -----------------------------------------------------
           BUILD QUERY
           ----------------------------------------------------- */

        buildQuery(params = {}) {
            const query = new URLSearchParams();

            Object.entries(params).forEach(([key, value]) => {

                if (
                    value !== undefined &&
                    value !== null &&
                    String(value).trim() !== ""
                ) {
                    query.set(key, String(value));
                }

            });

            const qs = query.toString();

            return qs ? `?${qs}` : "";
        },


        /* -----------------------------------------------------
           VALIDATE USER ID
           ----------------------------------------------------- */

        requireId(id) {

            if (
                id === undefined ||
                id === null ||
                String(id).trim() === ""
            ) {
                throw new Error("User ID is required.");
            }

            return encodeURIComponent(String(id));
        },


        /* -----------------------------------------------------
           LIST USERS
           ----------------------------------------------------- */

        list(params = {}) {

            GHAR.admin.requireAdmin();

            return GHAR.api.get(
                `/admin/users${this.buildQuery(params)}`
            );
        },


        /* -----------------------------------------------------
           UPDATE USER
           ----------------------------------------------------- */

        update(id, payload = {}) {

            GHAR.admin.requireAdmin();

            const userId = this.requireId(id);

            if (
                !payload ||
                typeof payload !== "object" ||
                Array.isArray(payload)
            ) {
                throw new Error(
                    "A valid user update payload is required."
                );
            }

            return GHAR.api.patch(
                `/admin/users/${userId}`,
                payload
            );
        },


        /* -----------------------------------------------------
           DEACTIVATE USER
           ----------------------------------------------------- */

        deactivate(id) {

            GHAR.admin.requireAdmin();

            const userId = this.requireId(id);

            return GHAR.api.post(
                `/admin/users/${userId}/deactivate`
            );
        }

    };


    /* ---------------------------------------------------------
       PUBLIC GHAR API
       --------------------------------------------------------- */

    window.GHAR.adminUsers =
        Object.freeze(adminUsers);

})(window);