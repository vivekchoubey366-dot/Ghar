/* =========================================================
   GHAR -- ADMIN DOCUMENT MANAGEMENT
   ---------------------------------------------------------
   • Admin document listing
   • Document review / update
   • Filtering and pagination
   • Safe ID encoding
   • Query parameter handling
   • Centralized authorization
   • API validation
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
        endpoint: "/admin/documents"
    };


    /* =====================================================
       ADMIN AUTHORIZATION
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
       API VALIDATION
       ===================================================== */

    function ensureAPI() {

        if (
            !GHAR.api ||
            typeof GHAR.api.get !== "function" ||
            typeof GHAR.api.patch !== "function"
        ) {
            throw new Error(
                "GHAR API client is unavailable."
            );
        }
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
       LIST DOCUMENTS
       ===================================================== */

    async function list(params = {}) {

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
       GET DOCUMENT
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
                "Document ID is required."
            );
        }

        const documentId =
            encodeURIComponent(
                String(id)
            );

        const query =
            buildQuery(params);

        const url =
            `${CONFIG.endpoint}/${documentId}` +
            (query ? `?${query}` : "");

        return GHAR.api.get(url);
    }


    /* =====================================================
       REVIEW / UPDATE DOCUMENT
       ===================================================== */

    async function review(
        id,
        payload = {}
    ) {

        requireAdmin();

        ensureAPI();

        if (
            id === undefined ||
            id === null ||
            String(id).trim() === ""
        ) {
            throw new Error(
                "Document ID is required."
            );
        }

        if (
            !payload ||
            typeof payload !== "object" ||
            Array.isArray(payload)
        ) {
            throw new TypeError(
                "Document review payload must be an object."
            );
        }

        const documentId =
            encodeURIComponent(
                String(id)
            );

        return GHAR.api.patch(
            `${CONFIG.endpoint}/${documentId}`,
            payload
        );
    }


    /* =====================================================
       APPROVE DOCUMENT
       ===================================================== */

    async function approve(
        id,
        extra = {}
    ) {

        return review(
            id,
            {
                ...extra,
                status: "approved"
            }
        );
    }


    /* =====================================================
       REJECT DOCUMENT
       ===================================================== */

    async function reject(
        id,
        reason = "",
        extra = {}
    ) {

        return review(
            id,
            {
                ...extra,
                status: "rejected",
                reason: reason
                    ? String(reason).trim()
                    : ""
            }
        );
    }


    /* =====================================================
       REQUEST CHANGES
       ===================================================== */

    async function requestChanges(
        id,
        reason = "",
        extra = {}
    ) {

        return review(
            id,
            {
                ...extra,
                status: "changes_requested",
                reason: reason
                    ? String(reason).trim()
                    : ""
            }
        );
    }


    /* =====================================================
       BULK REVIEW
       ===================================================== */

    async function reviewMany(
        documents = [],
        status,
        extra = {}
    ) {

        requireAdmin();

        if (!Array.isArray(documents)) {
            throw new TypeError(
                "Documents must be an array."
            );
        }

        if (!documents.length) {
            return [];
        }

        if (!status) {
            throw new Error(
                "Document review status is required."
            );
        }

        return Promise.all(
            documents.map(document => {

                const id =
                    typeof document === "object"
                        ? document.id
                        : document;

                return review(
                    id,
                    {
                        ...extra,
                        status
                    }
                );

            })
        );
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    GHAR.adminDocuments = {

        config: CONFIG,

        list,

        get,

        review,

        approve,

        reject,

        requestChanges,

        reviewMany,

        buildQuery

    };


})(window);