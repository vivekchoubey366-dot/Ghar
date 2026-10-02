/* =========================================================
   GHAR -- ADMIN CORE
   ---------------------------------------------------------
   Purpose:
   • Admin authentication
   • Role protection
   • Audit log access
   • Admin API helpers
   • Safe URL query handling
   • Centralized admin utilities
   ========================================================= */

(function (window, document) {
    "use strict";

    /* =====================================================
       GHAR NAMESPACE
       ===================================================== */

    window.GHAR = window.GHAR || {};

    const GHAR = window.GHAR;


    /* =====================================================
       ADMIN CONFIG
       ===================================================== */

    const CONFIG = {
        loginUrl: "/login.html",
        role: "ADMIN",
        auditEndpoint: "/admin/audit-logs"
    };


    /* =====================================================
       REQUIRE ADMIN
       ===================================================== */

    function requireAdmin() {

        if (!GHAR.auth || typeof GHAR.auth.requireRole !== "function") {
            console.error(
                "GHAR Admin: GHAR.auth.requireRole() is unavailable."
            );

            return false;
        }

        return GHAR.auth.requireRole(
            CONFIG.ROLE,
            CONFIG.loginUrl
        );
    }


    /* =====================================================
       BUILD QUERY STRING
       ===================================================== */

    function buildQuery(params = {}) {

        const query = new URLSearchParams();

        if (!params || typeof params !== "object") {
            return "";
        }

        Object.entries(params).forEach(([key, value]) => {

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
                        query.append(key, String(item));
                    }

                });

                return;
            }

            query.set(key, String(value));
        });

        return query.toString();
    }


    /* =====================================================
       ADMIN API REQUEST
       ===================================================== */

    async function adminGet(endpoint, params = {}) {

        if (!requireAdmin()) {
            return null;
        }

        if (
            !GHAR.api ||
            typeof GHAR.api.get !== "function"
        ) {
            console.error(
                "GHAR Admin: GHAR.api.get() is unavailable."
            );

            return null;
        }

        const query = buildQuery(params);

        const url =
            endpoint +
            (query ? `?${query}` : "");

        return GHAR.api.get(url);
    }


    /* =====================================================
       AUDIT LOGS
       ===================================================== */

    async function auditLog(params = {}) {

        return adminGet(
            CONFIG.auditEndpoint,
            params
        );
    }


    /* =====================================================
       AUDIT LOG HELPERS
       ===================================================== */

    async function getAuditLogs(params = {}) {

        return auditLog(params);
    }


    /* =====================================================
       PAGINATED AUDIT LOGS
       ===================================================== */

    async function getAuditPage(
        page = 1,
        limit = 25,
        extra = {}
    ) {

        return auditLog({
            ...extra,
            page,
            limit
        });
    }


    /* =====================================================
       ADMIN SESSION CHECK
       ===================================================== */

    function isAdmin() {

        if (
            !GHAR.auth ||
            typeof GHAR.auth.requireRole !== "function"
        ) {
            return false;
        }

        try {

            return !!GHAR.auth.requireRole(
                CONFIG.ROLE,
                null
            );

        } catch (error) {

            console.warn(
                "GHAR Admin: Unable to verify admin role.",
                error
            );

            return false;
        }
    }


    /* =====================================================
       ADMIN PAGE GUARD
       ===================================================== */

    function protectPage() {

        return requireAdmin();
    }


    /* =====================================================
       LOGOUT
       ===================================================== */

    function logout() {

        if (
            GHAR.auth &&
            typeof GHAR.auth.logout === "function"
        ) {
            return GHAR.auth.logout(
                CONFIG.loginUrl
            );
        }

        window.location.href = CONFIG.loginUrl;
    }


    /* =====================================================
       ADMIN NAVIGATION
       ===================================================== */

    function goTo(path) {

        if (!requireAdmin()) {
            return false;
        }

        if (!path || typeof path !== "string") {
            return false;
        }

        window.location.href = path;

        return true;
    }


    /* =====================================================
       DOM HELPERS
       ===================================================== */

    function $(selector, scope = document) {

        if (!selector) {
            return null;
        }

        return scope.querySelector(selector);
    }


    function $$(selector, scope = document) {

        if (!selector) {
            return [];
        }

        return Array.from(
            scope.querySelectorAll(selector)
        );
    }


    /* =====================================================
       ADMIN DATA ATTRIBUTE ACTIONS
       ===================================================== */

    function bindNavigation() {

        $$("[data-admin-link]").forEach(element => {

            element.addEventListener("click", function (event) {

                const target =
                    this.getAttribute("data-admin-link");

                if (!target) {
                    return;
                }

                event.preventDefault();

                goTo(target);
            });

        });
    }


    /* =====================================================
       ADMIN LOGOUT BUTTONS
       ===================================================== */

    function bindLogout() {

        $$("[data-admin-logout]").forEach(button => {

            button.addEventListener("click", function (event) {

                event.preventDefault();

                logout();
            });

        });
    }


    /* =====================================================
       INITIALIZE ADMIN PAGE
       ===================================================== */

    function init() {

        if (!protectPage()) {
            return false;
        }

        bindNavigation();
        bindLogout();

        document.documentElement.classList.add(
            "ghar-admin-ready"
        );

        return true;
    }


    /* =====================================================
       PUBLIC ADMIN API
       ===================================================== */

    GHAR.admin = {

        config: CONFIG,

        requireAdmin,

        protectPage,

        isAdmin,

        logout,

        goTo,

        auditLog,

        getAuditLogs,

        getAuditPage,

        adminGet,

        buildQuery,

        $, 
        $$,

        init
    };


    /* =====================================================
       AUTO INIT
       ===================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            { once: true }
        );

    } else {

        init();

    }

})(window, document);