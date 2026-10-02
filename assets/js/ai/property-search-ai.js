/* =========================================================
   GHAR -- AI PROPERTY SEARCH
   ---------------------------------------------------------
   Natural-language property search
   Query Validation • Context • Error Handling
   ========================================================= */

(function (window) {
    "use strict";

    window.GHAR = window.GHAR || {};
    window.GHAR.ai = window.GHAR.ai || {};

    const ai = window.GHAR.ai;

    const CONFIG = Object.freeze({
        endpoint: "/ai/property-search",
        maxQueryLength: 4000
    });


    /* ---------------------------------------------------------
       NORMALIZE QUERY
       --------------------------------------------------------- */

    function normalizeQuery(query) {

        if (
            query === undefined ||
            query === null
        ) {
            return "";
        }

        return String(query)
            .replace(/\s+/g, " ")
            .trim();
    }


    /* ---------------------------------------------------------
       SEARCH PROPERTIES
       --------------------------------------------------------- */

    ai.searchProperties = async function (
        query,
        context = {}
    ) {

        const cleanQuery =
            normalizeQuery(query);

        if (!cleanQuery) {
            throw new Error(
                "Please enter a property search."
            );
        }

        if (
            cleanQuery.length >
            CONFIG.maxQueryLength
        ) {
            throw new Error(
                `Search query cannot exceed ${CONFIG.maxQueryLength} characters.`
            );
        }

        const safeContext =
            context &&
            typeof context === "object" &&
            !Array.isArray(context)
                ? { ...context }
                : {};

        try {

            return await GHAR.api.request(
                CONFIG.endpoint,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        query: cleanQuery,
                        context: safeContext
                    })
                }
            );

        } catch (error) {

            console.error(
                "[GHAR AI] Property search failed:",
                error
            );

            throw error;
        }
    };


    /* ---------------------------------------------------------
       ALIAS
       --------------------------------------------------------- */

    ai.propertySearch =
        ai.searchProperties;


    /* ---------------------------------------------------------
       CONFIG
       --------------------------------------------------------- */

    ai.propertySearchConfig =
        CONFIG;


})(window);