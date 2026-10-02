/* =========================================================
   GHAR -- ADMIN REPORTS
   ---------------------------------------------------------
   Summary • Property Reports • User Reports
   Secure • Query-safe • Lightweight
   ========================================================= */

(function (window) {
    "use strict";

    window.GHAR = window.GHAR || {};

    const reports = {

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
           REPORT SUMMARY
           ----------------------------------------------------- */

        summary(params = {}) {
            GHAR.admin.requireAdmin();

            return GHAR.api.get(
                `/admin/reports/summary${this.buildQuery(params)}`
            );
        },


        /* -----------------------------------------------------
           PROPERTY REPORT
           ----------------------------------------------------- */

        properties(params = {}) {
            GHAR.admin.requireAdmin();

            return GHAR.api.get(
                `/admin/reports/properties${this.buildQuery(params)}`
            );
        },


        /* -----------------------------------------------------
           USER REPORT
           ----------------------------------------------------- */

        users(params = {}) {
            GHAR.admin.requireAdmin();

            return GHAR.api.get(
                `/admin/reports/users${this.buildQuery(params)}`
            );
        }

    };


    /* ---------------------------------------------------------
       PUBLIC API
       --------------------------------------------------------- */

    window.GHAR.reports = Object.freeze(reports);

})(window);