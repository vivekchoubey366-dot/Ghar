 /* =========================================================
    GHAR -- AI PROPERTY RECOMMENDATIONS
    ---------------------------------------------------------
    AI-powered property matching
    Preferences • Validation • Filters • Error Handling
    ========================================================= */

(function (window) {
    "use strict";

    window.GHAR = window.GHAR || {};
    window.GHAR.ai = window.GHAR.ai || {};

    const ai = window.GHAR.ai;

    const CONFIG = Object.freeze({
        endpoint: "/ai/property-recommendations",
        maxPreferencesSize: 20000
    });


    /* ---------------------------------------------------------
       NORMALIZE PREFERENCES
       --------------------------------------------------------- */

    function normalizePreferences(preferences) {

        if (
            !preferences ||
            typeof preferences !== "object" ||
            Array.isArray(preferences)
        ) {
            return {};
        }

        return { ...preferences };
    }


    /* ---------------------------------------------------------
       VALIDATE PREFERENCES
       --------------------------------------------------------- */

    function validatePreferences(preferences) {

        const serialized =
            JSON.stringify(preferences);

        if (
            serialized.length >
            CONFIG.maxPreferencesSize
        ) {
            throw new Error(
                "Property preferences are too large."
            );
        }

        return preferences;
    }


    /* ---------------------------------------------------------
       RECOMMEND PROPERTIES
       --------------------------------------------------------- */

    ai.recommendProperties = async function (
        preferences = {}
    ) {

        const normalized =
            normalizePreferences(preferences);

        validatePreferences(normalized);

        try {

            return await GHAR.api.request(
                CONFIG.endpoint,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify(
                        normalized
                    )
                }
            );

        } catch (error) {

            console.error(
                "[GHAR AI] Property recommendation request failed:",
                error
            );

            throw error;
        }
    };


    /* ---------------------------------------------------------
       ALIAS
       --------------------------------------------------------- */

    ai.recommend = ai.recommendProperties;


    /* ---------------------------------------------------------
       CONFIG
       --------------------------------------------------------- */

    ai.propertyRecommendationConfig =
        CONFIG;

})(window);