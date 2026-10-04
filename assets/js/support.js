// ============================================================
// GHAR - REAL ESTATE PLATFORM
// support.js
// Support tickets, FAQ, knowledge base and contact support
// ============================================================

"use strict";

(function (window, document) {

  const GHAR = window.GHAR || {};

  const CONFIG = {
    API_BASE:
      GHAR.API_BASE ||
      window.GHAR_API_BASE ||
      "/api",

    ENDPOINTS: {
      TICKETS: "/support/tickets",
      TICKET: "/support/tickets",
      FAQ: "/support/faq",
      KNOWLEDGE_BASE: "/support/knowledge-base"
    },

    SELECTORS: {
      form:
        "#supportForm, #support-form, [data-support-form]",

      ticketForm:
        "#ticketForm, #ticket-form, [data-ticket-form]",

      subject:
        "#subject, [name='subject'], [data-support-subject]",

      category:
        "#category, [name='category'], [data-support-category]",

      priority:
        "#priority, [name='priority'], [data-support-priority]",

      message:
        "#message, [name='message'], textarea[data-support-message]",

      email:
        "#email, [name='email'], [data-support-email]",

      ticketId:
        "[data-ticket-id], #ticketId",

      ticketList:
        "[data-ticket-list], #ticketList",

      faqList:
        "[data-faq-list], #faqList",

      knowledgeBase:
        "[data-knowledge-base], #knowledgeBase",

      search:
        "#supportSearch, #faqSearch, [data-support-search]",

      status:
        "[data-support-status], #supportStatus",

      loading:
        "[data-support-loading], #supportLoading"
    }
  };

  // ==========================================================
  // STATE
  // ==========================================================

  const state = {
    tickets: [],
    faq: [],
    articles: [],
    loading: false,
    currentTicket: null,
    searchTerm: ""
  };

  // ==========================================================
  // HELPERS
  // ==========================================================

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setStatus(message, type = "info") {
    const element = qs(CONFIG.SELECTORS.status);

    if (!element) return;

    element.textContent = message;

    element.dataset.status = type;

    element.classList.remove(
      "is-success",
      "is-error",
      "is-warning",
      "is-info"
    );

    element.classList.add(`is-${type}`);
  }

  function setLoading(loading) {
    state.loading = loading;

    qsa(
      CONFIG.SELECTORS.loading
    ).forEach(element => {
      element.hidden = !loading;
    });

    qsa(
      "button[type='submit'], [data-support-submit]"
    ).forEach(button => {
      if (
        button.closest(
          CONFIG.SELECTORS.form
        ) ||
        button.closest(
          CONFIG.SELECTORS.ticketForm
        )
      ) {
        button.disabled = loading;
      }
    });
  }

  function getAuthToken() {
    try {
      return (
        localStorage.getItem("ghar_access_token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("ghar_access_token") ||
        ""
      );
    } catch {
      return "";
    }
  }

  function buildHeaders() {
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    const token = getAuthToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // ==========================================================
  // API
  // ==========================================================

  async function apiRequest(
    endpoint,
    options = {}
  ) {
    const response = await fetch(
      `${CONFIG.API_BASE}${endpoint}`,
      {
        credentials: "include",

        ...options,

        headers: {
          ...buildHeaders(),
          ...(options.headers || {})
        }
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const error = new Error(
        data?.error ||
        data?.message ||
        `Request failed (${response.status})`
      );

      error.status = response.status;
      error.data = data;

      throw error;
    }

    return data;
  }

  // ==========================================================
  // VALIDATION
  // ==========================================================

  function validateTicket(data) {
    const errors = [];

    if (!data.subject) {
      errors.push("Subject is required.");
    }

    if (
      data.subject &&
      data.subject.length < 3
    ) {
      errors.push(
        "Subject must contain at least 3 characters."
      );
    }

    if (!data.category) {
      errors.push("Please select a category.");
    }

    if (!data.message) {
      errors.push("Message is required.");
    }

    if (
      data.message &&
      data.message.length < 10
    ) {
      errors.push(
        "Message must contain at least 10 characters."
      );
    }

    if (
      data.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        data.email
      )
    ) {
      errors.push(
        "Please enter a valid email address."
      );
    }

    return errors;
  }

  // ==========================================================
  // CREATE SUPPORT TICKET
  // ==========================================================

  async function createTicket(data) {
    const errors =
      validateTicket(data);

    if (errors.length) {
      throw new Error(
        errors.join(" ")
      );
    }

    setLoading(true);
    setStatus(
      "Creating support ticket...",
      "info"
    );

    try {
      const result =
        await apiRequest(
          CONFIG.ENDPOINTS.TICKETS,
          {
            method: "POST",
            body: JSON.stringify(data)
          }
        );

      const ticket =
        result.ticket ||
        result.data ||
        result;

      if (ticket) {
        state.tickets.unshift(ticket);
      }

      setStatus(
        "Support ticket created successfully.",
        "success"
      );

      return ticket;

    } catch (error) {

      setStatus(
        error.message ||
        "Unable to create support ticket.",
        "error"
      );

      throw error;

    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // GET TICKETS
  // ==========================================================

  async function loadTickets() {
    try {
      setLoading(true);

      const result =
        await apiRequest(
          CONFIG.ENDPOINTS.TICKETS
        );

      state.tickets =
        result.tickets ||
        result.data ||
        [];

      renderTickets();

      return state.tickets;

    } catch (error) {

      setStatus(
        error.message ||
        "Unable to load support tickets.",
        "error"
      );

      return [];

    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // GET SINGLE TICKET
  // ==========================================================

  async function loadTicket(ticketId) {
    if (!ticketId) {
      throw new Error(
        "Ticket ID is required."
      );
    }

    try {

      setLoading(true);

      const result =
        await apiRequest(
          `${CONFIG.ENDPOINTS.TICKET}/${encodeURIComponent(
            ticketId
          )}`
        );

      state.currentTicket =
        result.ticket ||
        result.data ||
        result;

      renderCurrentTicket();

      return state.currentTicket;

    } catch (error) {

      setStatus(
        error.message ||
        "Unable to load ticket.",
        "error"
      );

      throw error;

    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // UPDATE TICKET
  // ==========================================================

  async function updateTicket(
    ticketId,
    data
  ) {
    if (!ticketId) {
      throw new Error(
        "Ticket ID is required."
      );
    }

    try {

      setLoading(true);

      const result =
        await apiRequest(
          `${CONFIG.ENDPOINTS.TICKET}/${encodeURIComponent(
            ticketId
          )}`,
          {
            method: "PATCH",
            body: JSON.stringify(data)
          }
        );

      const updated =
        result.ticket ||
        result.data ||
        result;

      state.currentTicket =
        updated;

      state.tickets =
        state.tickets.map(ticket =>
          String(ticket.id || ticket._id) ===
          String(ticketId)
            ? {
                ...ticket,
                ...updated
              }
            : ticket
        );

      renderTickets();
      renderCurrentTicket();

      setStatus(
        "Ticket updated successfully.",
        "success"
      );

      return updated;

    } catch (error) {

      setStatus(
        error.message ||
        "Unable to update ticket.",
        "error"
      );

      throw error;

    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // CLOSE TICKET
  // ==========================================================

  async function closeTicket(ticketId) {
    return updateTicket(
      ticketId,
      {
        status: "CLOSED"
      }
    );
  }

  // ==========================================================
  // FAQ
  // ==========================================================

  async function loadFAQ() {
    try {

      const result =
        await apiRequest(
          CONFIG.ENDPOINTS.FAQ
        );

      state.faq =
        result.faq ||
        result.data ||
        [];

      renderFAQ();

      return state.faq;

    } catch (error) {

      setStatus(
        error.message ||
        "Unable to load FAQs.",
        "error"
      );

      return [];

    }
  }

  // ==========================================================
  // KNOWLEDGE BASE
  // ==========================================================

  async function loadKnowledgeBase() {
    try {

      const result =
        await apiRequest(
          CONFIG.ENDPOINTS.KNOWLEDGE_BASE
        );

      state.articles =
        result.articles ||
        result.data ||
        [];

      renderKnowledgeBase();

      return state.articles;

    } catch (error) {

      setStatus(
        error.message ||
        "Unable to load knowledge base.",
        "error"
      );

      return [];

    }
  }

  // ==========================================================
  // RENDER TICKETS
  // ==========================================================

  function renderTickets() {
    const container =
      qs(CONFIG.SELECTORS.ticketList);

    if (!container) return;

    if (!state.tickets.length) {

      container.innerHTML = `
        <div class="ghar-empty-state">
          <p>No support tickets found.</p>
        </div>
      `;

      return;
    }

    container.innerHTML =
      state.tickets
        .map(ticket => {

          const id =
            ticket.id ||
            ticket._id ||
            ticket.ticketId ||
            "";

          const status =
            ticket.status ||
            "OPEN";

          return `
            <article
              class="support-ticket-card"
              data-ticket-id="${escapeHTML(id)}"
            >

              <div class="support-ticket-card__header">

                <h3>
                  ${escapeHTML(
                    ticket.subject ||
                    "Support Request"
                  )}
                </h3>

                <span
                  class="support-ticket-status"
                  data-status="${escapeHTML(
                    status
                  )}"
                >
                  ${escapeHTML(status)}
                </span>

              </div>

              <div class="support-ticket-card__meta">

                <span>
                  Ticket:
                  ${escapeHTML(id)}
                </span>

                <span>
                  ${escapeHTML(
                    ticket.category ||
                    "General"
                  )}
                </span>

                <span>
                  ${escapeHTML(
                    ticket.priority ||
                    "NORMAL"
                  )}
                </span>

              </div>

              <p>
                ${escapeHTML(
                  ticket.message ||
                  ticket.description ||
                  ""
                )}
              </p>

              <button
                type="button"
                class="ghar-button"
                data-action="open-ticket"
                data-ticket-id="${escapeHTML(id)}"
              >
                View Ticket
              </button>

            </article>
          `;
        })
        .join("");
  }

  // ==========================================================
  // RENDER CURRENT TICKET
  // ==========================================================

  function renderCurrentTicket() {
    const ticket =
      state.currentTicket;

    if (!ticket) return;

    const elements =
      qsa(
        "[data-current-ticket]"
      );

    elements.forEach(element => {

      element.textContent =
        ticket.subject ||
        ticket.title ||
        `Ticket ${
          ticket.id ||
          ticket.ticketId ||
          ""
        }`;
    });

    const messageElement =
      qs("[data-current-ticket-message]");

    if (messageElement) {
      messageElement.textContent =
        ticket.message ||
        ticket.description ||
        "";
    }

    const statusElement =
      qs("[data-current-ticket-status]");

    if (statusElement) {
      statusElement.textContent =
        ticket.status ||
        "OPEN";
    }
  }

  // ==========================================================
  // RENDER FAQ
  // ==========================================================

  function renderFAQ() {
    const container =
      qs(CONFIG.SELECTORS.faqList);

    if (!container) return;

    if (!state.faq.length) {

      container.innerHTML = `
        <div class="ghar-empty-state">
          <p>No FAQ articles available.</p>
        </div>
      `;

      return;
    }

    container.innerHTML =
      state.faq
        .map((item, index) => {

          const question =
            item.question ||
            item.title ||
            "Question";

          const answer =
            item.answer ||
            item.content ||
            "";

          return `
            <details
              class="support-faq"
              data-faq-index="${index}"
            >

              <summary>
                ${escapeHTML(question)}
              </summary>

              <div class="support-faq__answer">
                ${escapeHTML(answer)}
              </div>

            </details>
          `;
        })
        .join("");
  }

  // ==========================================================
  // RENDER KNOWLEDGE BASE
  // ==========================================================

  function renderKnowledgeBase() {
    const container =
      qs(CONFIG.SELECTORS.knowledgeBase);

    if (!container) return;

    if (!state.articles.length) {

      container.innerHTML = `
        <div class="ghar-empty-state">
          <p>No knowledge-base articles available.</p>
        </div>
      `;

      return;
    }

    container.innerHTML =
      state.articles
        .map(article => {

          const id =
            article.id ||
            article._id ||
            "";

          return `
            <article
              class="knowledge-base-card"
              data-article-id="${escapeHTML(id)}"
            >

              <h3>
                ${escapeHTML(
                  article.title ||
                  "Support Article"
                )}
              </h3>

              <p>
                ${escapeHTML(
                  article.excerpt ||
                  article.description ||
                  article.content ||
                  ""
                )}
              </p>

              <a
                href="${
                  article.url ||
                  "#"
                }"
                data-support-article
              >
                Read Article
              </a>

            </article>
          `;
        })
        .join("");
  }

  // ==========================================================
  // SEARCH
  // ==========================================================

  function search(term) {
    state.searchTerm =
      String(term || "")
        .trim()
        .toLowerCase();

    const ticketCards =
      qsa(
        ".support-ticket-card"
      );

    ticketCards.forEach(card => {

      const text =
        card.textContent
          .toLowerCase();

      card.hidden =
        Boolean(
          state.searchTerm &&
          !text.includes(
            state.searchTerm
          )
        );
    });

    const faqItems =
      qsa(
        ".support-faq"
      );

    faqItems.forEach(item => {

      const text =
        item.textContent
          .toLowerCase();

      item.hidden =
        Boolean(
          state.searchTerm &&
          !text.includes(
            state.searchTerm
          )
        );
    });

    const articles =
      qsa(
        ".knowledge-base-card"
      );

    articles.forEach(article => {

      const text =
        article.textContent
          .toLowerCase();

      article.hidden =
        Boolean(
          state.searchTerm &&
          !text.includes(
            state.searchTerm
          )
        );
    });
  }

  // ==========================================================
  // FORM DATA
  // ==========================================================

  function getFormData(form) {

    const formData =
      new FormData(form);

    return {
      subject:
        String(
          formData.get("subject") ||
          ""
        ).trim(),

      category:
        String(
          formData.get("category") ||
          "GENERAL"
        ).trim(),

      priority:
        String(
          formData.get("priority") ||
          "NORMAL"
        ).trim(),

      message:
        String(
          formData.get("message") ||
          formData.get("description") ||
          ""
        ).trim(),

      email:
        String(
          formData.get("email") ||
          ""
        ).trim()
    };
  }

  // ==========================================================
  // EVENT HANDLERS
  // ==========================================================

  function handleSubmit(event) {
    event.preventDefault();

    const form =
      event.currentTarget;

    const data =
      getFormData(form);

    createTicket(data)
      .then(ticket => {

        if (
          form &&
          typeof form.reset ===
            "function"
        ) {
          form.reset();
        }

        const ticketId =
          ticket?.id ||
          ticket?._id ||
          ticket?.ticketId;

        if (ticketId) {
          form.dataset.ticketId =
            ticketId;
        }

      })
      .catch(() => {});
  }

  function handleSearch(event) {
    search(
      event.target.value
    );
  }

  function handleClick(event) {

    const button =
      event.target.closest(
        "[data-action='open-ticket']"
      );

    if (!button) return;

    const ticketId =
      button.dataset.ticketId;

    if (!ticketId) return;

    loadTicket(ticketId)
      .catch(() => {});
  }

  // ==========================================================
  // INITIALIZATION
  // ==========================================================

  function initForms() {

    qsa(
      CONFIG.SELECTORS.form
    ).forEach(form => {

      form.addEventListener(
        "submit",
        handleSubmit
      );
    });

    qsa(
      CONFIG.SELECTORS.ticketForm
    ).forEach(form => {

      if (
        !form.matches(
          CONFIG.SELECTORS.form
        )
      ) {
        form.addEventListener(
          "submit",
          handleSubmit
        );
      }
    });
  }

  function initSearch() {

    qsa(
      CONFIG.SELECTORS.search
    ).forEach(input => {

      input.addEventListener(
        "input",
        handleSearch
      );
    });
  }

  function initActions() {
    document.addEventListener(
      "click",
      handleClick
    );
  }

  async function initData() {

    const page =
      document.body?.dataset?.page ||
      "";

    if (
      page === "support" ||
      qs(CONFIG.SELECTORS.ticketList)
    ) {
      await loadTickets();
    }

    if (
      page === "help" ||
      page === "help-centre" ||
      qs(CONFIG.SELECTORS.faqList)
    ) {
      await loadFAQ();
    }

    if (
      page === "knowledge-base" ||
      qs(CONFIG.SELECTORS.knowledgeBase)
    ) {
      await loadKnowledgeBase();
    }

    const ticketId =
      document.body?.dataset?.ticketId ||
      qs(
        CONFIG.SELECTORS.ticketId
      )?.value;

    if (ticketId) {
      await loadTicket(ticketId)
        .catch(() => {});
    }
  }

  function init() {

    initForms();
    initSearch();
    initActions();

    initData()
      .catch(error => {
        console.error(
          "GHAR Support initialization failed:",
          error
        );
      });
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  const Support = {

    state,

    createTicket,

    loadTickets,

    loadTicket,

    updateTicket,

    closeTicket,

    loadFAQ,

    loadKnowledgeBase,

    search,

    renderTickets,

    renderFAQ,

    renderKnowledgeBase,

    init
  };

  GHAR.Support =
    Support;

  window.GHAR =
    GHAR;

  window.GHARSupport =
    Support;

  // ==========================================================
  // AUTO INIT
  // ==========================================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );

  } else {

    init();

  }

})(window, document);