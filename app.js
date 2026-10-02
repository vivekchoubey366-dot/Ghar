/* =========================================================
   GHAR -- APPLICATION BOOTSTRAP
   ========================================================= */

(function (window, document) {
    "use strict";

    const GHAR = (window.GHAR = window.GHAR || {});

    function setApplicationState() {
        const root = document.documentElement;

        root.dataset.gharReady = "true";

        let authenticated = false;

        try {
            authenticated =
                typeof GHAR.session?.isAuthenticated === "function" &&
                GHAR.session.isAuthenticated();
        } catch (error) {
            console.warn(
                "[GHAR] Unable to determine authentication state:",
                error
            );
        }

        if (authenticated) {
            root.dataset.authenticated = "true";
        } else {
            delete root.dataset.authenticated;
        }
    }

    function dispatchReadyEvent() {
        document.dispatchEvent(
            new CustomEvent("ghar:ready", {
                detail: {
                    authenticated:
                        document.documentElement.dataset.authenticated ===
                        "true"
                }
            })
        );
    }

    function init() {
        if (document.documentElement.dataset.gharInitialized === "true") {
            return;
        }

        document.documentElement.dataset.gharInitialized = "true";

        setApplicationState();
        dispatchReadyEvent();

        console.info("[GHAR] Application ready");
    }

    GHAR.app = {
        init,
        version: "1.0.0"
    };

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            { once: true }
        );
    } else {
        init();
    }

})(window, document);