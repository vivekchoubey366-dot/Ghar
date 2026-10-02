/* =========================================================
   GHAR -- ADMIN PROPERTIES
   ---------------------------------------------------------
   Admin property moderation
   List • Approve • Reject • Remove
   ========================================================= */

(function (window) {
    "use strict";

    window.GHAR = window.GHAR || {};

    const adminProperties = {

        /* -----------------------------------------------------
           LIST PROPERTIES
           ----------------------------------------------------- */

        list(params = {}) {
            GHAR.admin.requireAdmin();

            const query = new URLSearchParams();

            Object.entries(params).forEach(([key, value]) => {
                if (
                    value !== undefined &&
                    value !== null &&
                    String(value).trim() !== ""
                ) {
                    query.set(key, value);
                }
            });

            const qs = query.toString();

            return GHAR.api.get(
                `/admin/properties${qs ? "?" + qs : ""}`
            );
        },


        /* -----------------------------------------------------
           APPROVE PROPERTY
           ----------------------------------------------------- */

        approve(id) {
            GHAR.admin.requireAdmin();

            if (!id) {
                return Promise.reject(
                    new Error("Property ID is required.")
                );
            }

            return GHAR.api.post(
                `/admin/properties/${encodeURIComponent(id)}/approve`
            );
        },


        /* -----------------------------------------------------
           REJECT PROPERTY
           ----------------------------------------------------- */

        reject(id, reason) {
            GHAR.admin.requireAdmin();

            if (!id) {
                return Promise.reject(
                    new Error("Property ID is required.")
                );
            }

            const rejectionReason =
                String(reason || "").trim();

            if (!rejectionReason) {
                return Promise.reject(
                    new Error("Rejection reason is required.")
                );
            }

            return GHAR.api.post(
                `/admin/properties/${encodeURIComponent(id)}/reject`,
                {
                    reason: rejectionReason
                }
            );
        },


        /* -----------------------------------------------------
           REMOVE PROPERTY
           ----------------------------------------------------- */

        remove(id) {
            GHAR.admin.requireAdmin();

            if (!id) {
                return Promise.reject(
                    new Error("Property ID is required.")
                );
            }

            return GHAR.api.delete(
                `/admin/properties/${encodeURIComponent(id)}`
            );
        }

    };


    /* ---------------------------------------------------------
       PUBLIC GHAR API
       --------------------------------------------------------- */

    window.GHAR.adminProperties =
        Object.freeze(adminProperties);

})(window);