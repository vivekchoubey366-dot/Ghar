/* =========================================================
   GHAR -- AI ASSISTANT
   ---------------------------------------------------------
   AI Property & Real Estate Assistant
   Ask • Context • Error Handling • Safe Requests
   ========================================================= */

(function (window) {
    "use strict";

    window.GHAR = window.GHAR || {};
    window.GHAR.ai = window.GHAR.ai || {};

    const ai = window.GHAR.ai;


    /* ---------------------------------------------------------
       CONFIGURATION
       --------------------------------------------------------- */

    const CONFIG = Object.freeze({
        endpoint: "/ai/assistant",
        maxMessageLength: 8000
    });


    /* ---------------------------------------------------------
       VALIDATE MESSAGE
       --------------------------------------------------------- */

    function validateMessage(message) {

        if (
            message === undefined ||
            message === null
        ) {
            throw new Error("AI message is required.");
        }

        const value = String(message).trim();

        if (!value) {
            throw new Error("Please enter a message.");
        }

        if (value.length > CONFIG.maxMessageLength) {
            throw new Error(
                `Message cannot exceed ${CONFIG.maxMessageLength} characters.`
            );
        }

        return value;
    }


    /* ---------------------------------------------------------
       NORMALIZE CONTEXT
       --------------------------------------------------------- */

    function normalizeContext(context) {

        if (
            !context ||
            typeof context !== "object" ||
            Array.isArray(context)
        ) {
            return {};
        }

        return { ...context };
    }


    /* ---------------------------------------------------------
       ASK AI
       --------------------------------------------------------- */

    ai.ask = async function (message, context = {}) {

        const cleanMessage =
            validateMessage(message);

        const safeContext =
            normalizeContext(context);

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
                        message: cleanMessage,
                        context: safeContext
                    })
                }
            );

        } catch (error) {

            console.error(
                "[GHAR AI] Assistant request failed:",
                error
            );

            throw error;
        }
    };


    /* ---------------------------------------------------------
       OPTIONAL STREAM-FRIENDLY ALIAS
       --------------------------------------------------------- */

    ai.send = ai.ask;


    /* ---------------------------------------------------------
       CONFIG ACCESS
       --------------------------------------------------------- */

    ai.config = CONFIG;


})(window);