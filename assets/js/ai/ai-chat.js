// ============================================================
// GHAR AI - CHAT
// assets/js/ai/ai-chat.js
// ============================================================

"use strict";

(function (window, document) {

  const GHAR = window.GHAR = window.GHAR || {};
  const AI = GHAR.AI = GHAR.AI || {};

  const CONFIG = {
    endpoint: "/api/ai/chat",
    timeout: 30000,
    maxMessageLength: 4000
  };

  function getClient() {
    return AI.Client || window.GHARAIClient || null;
  }

  function createId(prefix = "msg") {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;
  }

  function cleanMessage(message) {
    return String(message || "")
      .trim()
      .slice(0, CONFIG.maxMessageLength);
  }

  async function send(message, options = {}) {

    const text = cleanMessage(message);

    if (!text) {
      throw new Error("Message cannot be empty.");
    }

    const payload = {
      message: text,
      conversationId:
        options.conversationId || null,
      context:
        options.context || {},
      propertyId:
        options.propertyId || null,
      history:
        Array.isArray(options.history)
          ? options.history
          : []
    };

    const client = getClient();

    if (client && typeof client.post === "function") {
      return client.post(
        options.endpoint || CONFIG.endpoint,
        payload,
        options
      );
    }

    const response = await fetch(
      options.endpoint || CONFIG.endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        "AI chat request failed."
      );
    }

    return data;
  }

  function addMessage(messages, role, content) {

    const list = Array.isArray(messages)
      ? messages
      : [];

    list.push({
      id: createId(),
      role,
      content: String(content || ""),
      timestamp: new Date().toISOString()
    });

    return list;
  }

  function renderMessage(container, message) {

    if (!container) return;

    const item = document.createElement("div");

    item.className =
      `ghar-ai-message ghar-ai-message-${message.role}`;

    item.dataset.messageId =
      message.id || createId();

    item.textContent =
      message.content || "";

    container.appendChild(item);

    container.scrollTop =
      container.scrollHeight;

    return item;
  }

  function bind(options = {}) {

    const form =
      document.querySelector(
        options.form ||
        "[data-ghar-ai-chat]"
      );

    if (!form) return null;

    const input =
      form.querySelector(
        options.input ||
        "[name='message'], textarea, input"
      );

    const container =
      document.querySelector(
        options.container ||
        "[data-ai-chat-messages]"
      );

    form.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const message =
          cleanMessage(input?.value);

        if (!message) return;

        addMessage(
          window.GHAR_AI_CHAT_MESSAGES ||
          (window.GHAR_AI_CHAT_MESSAGES = []),
          "user",
          message
        );

        renderMessage(
          container,
          {
            id: createId(),
            role: "user",
            content: message
          }
        );

        if (input) {
          input.value = "";
        }

        try {

          const result =
            await send(message, options);

          const reply =
            result.reply ||
            result.message ||
            result.response ||
            result.data?.reply ||
            "I could not generate a response.";

          renderMessage(
            container,
            {
              id: createId(),
              role: "assistant",
              content: reply
            }
          );

        } catch (error) {

          renderMessage(
            container,
            {
              id: createId(),
              role: "error",
              content:
                error.message ||
                "Unable to connect to GHAR AI."
            }
          );

        }

      }
    );

    return form;
  }

  AI.Chat = {
    config: CONFIG,
    send,
    addMessage,
    renderMessage,
    bind
  };

  window.GHARAIChat = AI.Chat;

})(window, document);