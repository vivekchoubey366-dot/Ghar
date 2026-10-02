/* =========================================================
   GHAR -- CHATBOT
   ---------------------------------------------------------
   Frontend Chatbot Interface
   Uses GHAR AI Assistant
   Send • Context • Validation • Error Handling
   ========================================================= */

(function (window) {
    "use strict";

    window.GHAR = window.GHAR || {};
    window.GHAR.chatbot = window.GHAR.chatbot || {};

    const chatbot = window.GHAR.chatbot;


    /* ---------------------------------------------------------
       CONFIGURATION
       --------------------------------------------------------- */

    const CONFIG = Object.freeze({
        maxMessageLength: 8000
    });


    /* ---------------------------------------------------------
       SEND MESSAGE
       --------------------------------------------------------- */

    chatbot.send = async function (
        message,
        context = {}
    ) {

        const cleanMessage =
            String(message ?? "").trim();

        if (!cleanMessage) {
            throw new Error(
                "Please enter a message."
            );
        }

        if (
            cleanMessage.length >
            CONFIG.maxMessageLength
        ) {
            throw new Error(
                `Message cannot exceed ${CONFIG.maxMessageLength} characters.`
            );
        }

        if (
            !GHAR.ai ||
            typeof GHAR.ai.ask !== "function"
        ) {
            throw new Error(
                "GHAR AI Assistant is not available."
            );
        }

        try {

            return await GHAR.ai.ask(
                cleanMessage,
                context
            );

        } catch (error) {

            console.error(
                "[GHAR Chatbot] Request failed:",
                error
            );

            throw error;
        }
    };


    /* ---------------------------------------------------------
       ALIAS
       --------------------------------------------------------- */

    chatbot.ask = chatbot.send;


    /* ---------------------------------------------------------
       CLEAR CHAT STATE
       --------------------------------------------------------- */

    chatbot.clear = function (container) {

        if (!container) {
            return;
        }

        if (typeof container === "string") {
            container =
                document.querySelector(container);
        }

        if (!container) {
            return;
        }

        container.innerHTML = "";
    };


    /* ---------------------------------------------------------
       CONFIG
       --------------------------------------------------------- */

    chatbot.config = CONFIG;


})(window);