/* =========================================================
   GHAR -- ADMIN APPROVALS
   ---------------------------------------------------------
   • Pending approvals
   • Approve requests
   • Reject requests
   • Admin authorization
   • Safe ID encoding
   • Query parameter handling
   • Centralized API access
   ========================================================= */

(function (window) {

    "use strict";


    /* =====================================================
       NAMESPACE
       ===================================================== */

    window.GHAR = window.GHAR || {};

    const GHAR = window.GHAR;


    /* =====================================================
       CONFIG
       ===================================================== */

    const CONFIG = {
        endpoint: "/admin/approvals"
    };


    /* =====================================================
       ADMIN GUARD
       ===================================================== */

    function requireAdmin() {

        if (
            !GHAR.admin ||
            typeof GHAR.admin.requireAdmin !== "function"
        ) {
            throw new Error(
                "GHAR Admin authorization is unavailable."
            );
        }

        return GHAR.admin.requireAdmin();
    }


    /* =====================================================
       QUERY BUILDER
       ===================================================== */

    function buildQuery(params = {}) {

        const query = new URLSearchParams();

        if (
            !params ||
            typeof params !== "object"
        ) {
            return "";
        }

        Object.entries(params).forEach(
            ([key, value]) => {

                if (
                    value === undefined ||
                    value === null ||
                    value === ""
                ) {
                    return;
                }

                if (Array.isArray(value)) {

                    value.forEach(item => {

                        if (
                            item !== undefined &&
                            item !== null &&
                            item !== ""
                        ) {
                            query.append(
                                key,
                                String(item)
                            );
                        }

                    });

                    return;
                }

                query.set(
                    key,
                    String(value)
                );
            }
        );

        return query.toString();
    }


    /* =====================================================
       API VALIDATION
       ===================================================== */

    function ensureAPI() {

        if (
            !GHAR.api ||
            typeof GHAR.api.get !== "function" ||
            typeof GHAR.api.post !== "function"
        ) {
            throw new Error(
                "GHAR API client is unavailable."
            );
        }
    }


    /* =====================================================
       PENDING APPROVALS
       ===================================================== */

    async function pending(params = {}) {

        requireAdmin();

        ensureAPI();

        const query =
            buildQuery(params);

        const url =
            CONFIG.endpoint +
            (query ? `?${query}` : "");

        return GHAR.api.get(url);
    }


    /* =====================================================
       APPROVE
       ===================================================== */

    async function approve(
        id,
        type
    ) {

        requireAdmin();

        ensureAPI();

        if (
            id === undefined ||
            id === null ||
            String(id).trim() === ""
        ) {
            throw new Error(
                "Approval ID is required."
            );
        }

        if (
            type === undefined ||
            type === null ||
            String(type).trim() === ""
        ) {
            throw new Error(
                "Approval type is required."
            );
        }

        const approvalId =
            encodeURIComponent(
                String(id)
            );

        return GHAR.api.post(
            `${CONFIG.endpoint}/${approvalId}/approve`,
            {
                type: String(type)
            }
        );
    }


    /* =====================================================
       REJECT
       ===================================================== */

    async function reject(
        id,
        type,
        reason = ""
    ) {

        requireAdmin();

        ensureAPI();

        if (
            id === undefined ||
            id === null ||
            String(id).trim() === ""
        ) {
            throw new Error(
                "Approval ID is required."
            );
        }

        if (
            type === undefined ||
            type === null ||
            String(type).trim() === ""
        ) {
            throw new Error(
                "Approval type is required."
            );
        }

        const approvalId =
            encodeURIComponent(
                String(id)
            );

        return GHAR.api.post(
            `${CONFIG.endpoint}/${approvalId}/reject`,
            {
                type: String(type),
                reason: reason
                    ? String(reason).trim()
                    : ""
            }
        );
    }


    /* =====================================================
       APPROVAL BY ID
       ===================================================== */

    async function get(
        id,
        params = {}
    ) {

        requireAdmin();

        ensureAPI();

        if (
            id === undefined ||
            id === null ||
            String(id).trim() === ""
        ) {
            throw new Error(
                "Approval ID is required."
            );
        }

        const approvalId =
            encodeURIComponent(
                String(id)
            );

        const query =
            buildQuery(params);

        const url =
            `${CONFIG.endpoint}/${approvalId}` +
            (query ? `?${query}` : "");

        return GHAR.api.get(url);
    }


    /* =====================================================
       BULK APPROVAL
       ===================================================== */

    async function approveMany(
        items = []
    ) {

        requireAdmin();

        ensureAPI();

        if (!Array.isArray(items)) {
            throw new TypeError(
                "Approval items must be an array."
            );
        }

        if (!items.length) {
            return [];
        }

        return Promise.all(
            items.map(item =>
                approve(
                    item.id,
                    item.type
                )
            )
        );
    }


    /* =====================================================
       BULK REJECTION
       ===================================================== */

    async function rejectMany(
        items = [],
        reason = ""
    ) {

        requireAdmin();

        ensureAPI();

        if (!Array.isArray(items)) {
            throw new TypeError(
                "Approval items must be an array."
            );
        }

        if (!items.length) {
            return [];
        }

        return Promise.all(
            items.map(item =>
                reject(
                    item.id,
                    item.type,
                    reason
                )
            )
        );
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    GHAR.approvals = {

        config: CONFIG,

        pending,

        get,

        approve,

        reject,

        approveMany,

        rejectMany,

        buildQuery

    };


})(window);