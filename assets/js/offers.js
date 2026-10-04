// ============================================================
// GHAR - REAL ESTATE PLATFORM
// assets/js/offers.js
// Offers Management
// Buyer / Seller / Tenant / Admin compatible
// ============================================================

"use strict";

(() => {
  const GHAR = window.GHAR || {};
  const config = GHAR.config || {};
  const api = GHAR.api || {};

  const STORAGE_KEY =
    config.storageKeys?.offers ||
    "ghar_offers";

  const API_BASE =
    config.apiBaseUrl ||
    "/api";

  // ----------------------------------------------------------
  // CONSTANTS
  // ----------------------------------------------------------

  const OFFER_STATUS = Object.freeze({
    DRAFT: "DRAFT",
    SUBMITTED: "SUBMITTED",
    PENDING: "PENDING",
    COUNTERED: "COUNTERED",
    ACCEPTED: "ACCEPTED",
    REJECTED: "REJECTED",
    WITHDRAWN: "WITHDRAWN",
    EXPIRED: "EXPIRED",
    CANCELLED: "CANCELLED"
  });

  const OFFER_TYPES = Object.freeze({
    PURCHASE: "PURCHASE",
    RENTAL: "RENTAL",
    LEASE: "LEASE"
  });

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  function normalizeId(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return null;
    }

    const id = String(value).trim();

    return id || null;
  }

  function getPropertyId(property) {
    if (!property) return null;

    return normalizeId(
      property.id ||
      property.propertyId ||
      property.property_id
    );
  }

  function getUserId(user) {
    if (!user) return null;

    return normalizeId(
      user.id ||
      user.userId ||
      user.user_id
    );
  }

  function dispatch(name, detail = {}) {
    document.dispatchEvent(
      new CustomEvent(`ghar:${name}`, {
        detail
      })
    );
  }

  function generateLocalId() {
    return `OFFER-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)
      .toUpperCase()}`;
  }

  // ----------------------------------------------------------
  // LOCAL STORAGE
  // ----------------------------------------------------------

  function readLocalOffers() {
    try {
      if (
        GHAR.storage &&
        typeof GHAR.storage.get === "function"
      ) {
        const result =
          GHAR.storage.get(STORAGE_KEY);

        return Array.isArray(result)
          ? result
          : [];
      }

      const raw =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!raw) return [];

      const data =
        JSON.parse(raw);

      return Array.isArray(data)
        ? data
        : [];
    } catch (error) {
      console.error(
        "[GHAR Offers] Failed reading offers:",
        error
      );

      return [];
    }
  }

  function saveLocalOffers(offers) {
    try {
      if (
        GHAR.storage &&
        typeof GHAR.storage.set === "function"
      ) {
        GHAR.storage.set(
          STORAGE_KEY,
          offers
        );

        return true;
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(offers)
      );

      return true;
    } catch (error) {
      console.error(
        "[GHAR Offers] Failed saving offers:",
        error
      );

      return false;
    }
  }

  // ----------------------------------------------------------
  // API REQUEST
  // ----------------------------------------------------------

  async function request(
    endpoint,
    options = {}
  ) {
    const url =
      endpoint.startsWith("/")
        ? endpoint
        : `${API_BASE}${endpoint}`;

    try {
      if (
        typeof api.request === "function"
      ) {
        return await api.request(
          url,
          options
        );
      }

      const response =
        await fetch(
          url,
          {
            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",

              ...(options.headers || {})
            },

            ...options
          }
        );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      const data =
        contentType.includes(
          "application/json"
        )
          ? await response.json()
          : await response.text();

      if (!response.ok) {
        const error =
          new Error(
            data?.error ||
            `Request failed: ${response.status}`
          );

        error.status =
          response.status;

        throw error;
      }

      return data;
    } catch (error) {
      console.warn(
        "[GHAR Offers] API request failed:",
        error.message
      );

      throw error;
    }
  }

  // ----------------------------------------------------------
  // CREATE OFFER OBJECT
  // ----------------------------------------------------------

  function createOffer(data = {}) {
    const now =
      new Date().toISOString();

    return {
      id:
        normalizeId(
          data.id ||
          data.offerId ||
          data.offer_id
        ) ||
        generateLocalId(),

      propertyId:
        getPropertyId(data) ||
        normalizeId(
          data.propertyId
        ),

      buyerId:
        normalizeId(
          data.buyerId ||
          data.buyer_id
        ),

      sellerId:
        normalizeId(
          data.sellerId ||
          data.seller_id
        ),

      tenantId:
        normalizeId(
          data.tenantId ||
          data.tenant_id
        ),

      amount:
        Number(data.amount) || 0,

      currency:
        data.currency ||
        "INR",

      type:
        data.type ||
        OFFER_TYPES.PURCHASE,

      status:
        data.status ||
        OFFER_STATUS.DRAFT,

      message:
        data.message ||
        "",

      counterAmount:
        data.counterAmount ??
        null,

      counterMessage:
        data.counterMessage ||
        "",

      expiresAt:
        data.expiresAt ||
        null,

      createdAt:
        data.createdAt ||
        now,

      updatedAt:
        now,

      metadata:
        data.metadata ||
        {}
    };
  }

  // ----------------------------------------------------------
  // CREATE OFFER
  // ----------------------------------------------------------

  async function create(data = {}, options = {}) {
    const offer =
      createOffer(data);

    try {
      const response =
        await request(
          "/offers",
          {
            method: "POST",

            body:
              JSON.stringify(
                offer
              ),

            ...options
          }
        );

      const created =
        response?.offer ||
        response?.data ||
        response ||
        offer;

      dispatch(
        "offer-created",
        {
          offer: created
        }
      );

      return created;
    } catch (error) {
      // Offline/local fallback.
      const offers =
        readLocalOffers();

      offers.push(offer);

      saveLocalOffers(offers);

      dispatch(
        "offer-created",
        {
          offer,
          local: true
        }
      );

      return offer;
    }
  }

  // ----------------------------------------------------------
  // GET ALL OFFERS
  // ----------------------------------------------------------

  async function getAll(filters = {}) {
    try {
      const query =
        new URLSearchParams();

      Object.entries(filters)
        .forEach(
          ([key, value]) => {
            if (
              value !== undefined &&
              value !== null &&
              value !== ""
            ) {
              query.set(
                key,
                value
              );
            }
          }
        );

      const endpoint =
        query.toString()
          ? `/offers?${query.toString()}`
          : "/offers";

      const response =
        await request(endpoint);

      return (
        response?.offers ||
        response?.data ||
        response ||
        []
      );
    } catch (error) {
      return readLocalOffers();
    }
  }

  // ----------------------------------------------------------
  // GET OFFER
  // ----------------------------------------------------------

  async function get(id) {
    const offerId =
      normalizeId(id);

    if (!offerId) {
      return null;
    }

    try {
      const response =
        await request(
          `/offers/${encodeURIComponent(
            offerId
          )}`
        );

      return (
        response?.offer ||
        response?.data ||
        response
      );
    } catch (error) {
      return (
        readLocalOffers().find(
          offer =>
            normalizeId(
              offer.id
            ) === offerId
        ) || null
      );
    }
  }

  // ----------------------------------------------------------
  // UPDATE OFFER
  // ----------------------------------------------------------

  async function update(
    id,
    changes = {}
  ) {
    const offerId =
      normalizeId(id);

    if (!offerId) {
      throw new Error(
        "Offer ID is required."
      );
    }

    try {
      const response =
        await request(
          `/offers/${encodeURIComponent(
            offerId
          )}`,
          {
            method: "PATCH",

            body:
              JSON.stringify(
                changes
              )
          }
        );

      const offer =
        response?.offer ||
        response?.data ||
        response;

      dispatch(
        "offer-updated",
        {
          offer
        }
      );

      return offer;
    } catch (error) {
      const offers =
        readLocalOffers();

      const index =
        offers.findIndex(
          offer =>
            normalizeId(
              offer.id
            ) === offerId
        );

      if (index === -1) {
        throw error;
      }

      offers[index] = {
        ...offers[index],
        ...changes,
        updatedAt:
          new Date().toISOString()
      };

      saveLocalOffers(
        offers
      );

      dispatch(
        "offer-updated",
        {
          offer:
            offers[index],
          local: true
        }
      );

      return offers[index];
    }
  }

  // ----------------------------------------------------------
  // WITHDRAW OFFER
  // ----------------------------------------------------------

  async function withdraw(id) {
    return update(
      id,
      {
        status:
          OFFER_STATUS.WITHDRAWN
      }
    );
  }

  // ----------------------------------------------------------
  // ACCEPT OFFER
  // ----------------------------------------------------------

  async function accept(id) {
    const offerId =
      normalizeId(id);

    try {
      const response =
        await request(
          `/offers/${encodeURIComponent(
            offerId
          )}/accept`,
          {
            method: "POST"
          }
        );

      const offer =
        response?.offer ||
        response?.data ||
        response;

      dispatch(
        "offer-accepted",
        {
          offer
        }
      );

      return offer;
    } catch (error) {
      return update(
        offerId,
        {
          status:
            OFFER_STATUS.ACCEPTED
        }
      );
    }
  }

  // ----------------------------------------------------------
  // REJECT OFFER
  // ----------------------------------------------------------

  async function reject(id, reason = "") {
    const offerId =
      normalizeId(id);

    try {
      const response =
        await request(
          `/offers/${encodeURIComponent(
            offerId
          )}/reject`,
          {
            method: "POST",

            body:
              JSON.stringify({
                reason
              })
          }
        );

      const offer =
        response?.offer ||
        response?.data ||
        response;

      dispatch(
        "offer-rejected",
        {
          offer
        }
      );

      return offer;
    } catch (error) {
      return update(
        offerId,
        {
          status:
            OFFER_STATUS.REJECTED,

          rejectionReason:
            reason
        }
      );
    }
  }

  // ----------------------------------------------------------
  // COUNTER OFFER
  // ----------------------------------------------------------

  async function counter(
    id,
    amount,
    message = ""
  ) {
    const offerId =
      normalizeId(id);

    const counterAmount =
      Number(amount);

    if (
      !Number.isFinite(
        counterAmount
      ) ||
      counterAmount <= 0
    ) {
      throw new Error(
        "A valid counter offer amount is required."
      );
    }

    try {
      const response =
        await request(
          `/offers/${encodeURIComponent(
            offerId
          )}/counter`,
          {
            method: "POST",

            body:
              JSON.stringify({
                amount:
                  counterAmount,

                message
              })
          }
        );

      const offer =
        response?.offer ||
        response?.data ||
        response;

      dispatch(
        "offer-countered",
        {
          offer
        }
      );

      return offer;
    } catch (error) {
      return update(
        offerId,
        {
          status:
            OFFER_STATUS.COUNTERED,

          counterAmount,

          counterMessage:
            message
        }
      );
    }
  }

  // ----------------------------------------------------------
  // DELETE LOCAL OFFER
  // ----------------------------------------------------------

  function removeLocal(id) {
    const offerId =
      normalizeId(id);

    const offers =
      readLocalOffers();

    const filtered =
      offers.filter(
        offer =>
          normalizeId(
            offer.id
          ) !== offerId
      );

    if (
      filtered.length ===
      offers.length
    ) {
      return false;
    }

    saveLocalOffers(
      filtered
    );

    dispatch(
      "offer-removed",
      {
        offerId
      }
    );

    return true;
  }

  // ----------------------------------------------------------
  // FILTER
  // ----------------------------------------------------------

  function filter(
    offers,
    filters = {}
  ) {
    if (!Array.isArray(offers)) {
      return [];
    }

    return offers.filter(
      offer => {

        if (
          filters.status &&
          offer.status !==
            filters.status
        ) {
          return false;
        }

        if (
          filters.propertyId &&
          normalizeId(
            offer.propertyId
          ) !==
            normalizeId(
              filters.propertyId
            )
        ) {
          return false;
        }

        if (
          filters.buyerId &&
          normalizeId(
            offer.buyerId
          ) !==
            normalizeId(
              filters.buyerId
            )
        ) {
          return false;
        }

        if (
          filters.sellerId &&
          normalizeId(
            offer.sellerId
          ) !==
            normalizeId(
              filters.sellerId
            )
        ) {
          return false;
        }

        if (
          filters.type &&
          offer.type !==
            filters.type
        ) {
          return false;
        }

        return true;
      }
    );
  }

  // ----------------------------------------------------------
  // STATUS HELPERS
  // ----------------------------------------------------------

  function isPending(offer) {
    return [
      OFFER_STATUS.SUBMITTED,
      OFFER_STATUS.PENDING,
      OFFER_STATUS.COUNTERED
    ].includes(
      offer?.status
    );
  }

  function isFinal(offer) {
    return [
      OFFER_STATUS.ACCEPTED,
      OFFER_STATUS.REJECTED,
      OFFER_STATUS.WITHDRAWN,
      OFFER_STATUS.EXPIRED,
      OFFER_STATUS.CANCELLED
    ].includes(
      offer?.status
    );
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  function updateStatusElement(
    element,
    status
  ) {
    if (!element) return;

    element.textContent =
      String(status || "")
        .replaceAll(
          "_",
          " "
        );

    element.dataset.status =
      status || "";
  }

  function updateUI() {
    document
      .querySelectorAll(
        "[data-offer-status]"
      )
      .forEach(element => {

        const status =
          element.dataset.offerStatus;

        updateStatusElement(
          element,
          status
        );
      });
  }

  // ----------------------------------------------------------
  // OFFER FORM
  // ----------------------------------------------------------

  async function handleFormSubmit(
    event
  ) {
    const form =
      event.target.closest(
        "[data-offer-form]"
      );

    if (!form) return;

    event.preventDefault();

    const formData =
      new FormData(form);

    const data = {
      propertyId:
        formData.get(
          "propertyId"
        ),

      amount:
        Number(
          formData.get(
            "amount"
          )
        ),

      type:
        formData.get(
          "type"
        ) ||
        OFFER_TYPES.PURCHASE,

      message:
        formData.get(
          "message"
        ) ||
        "",

      expiresAt:
        formData.get(
          "expiresAt"
        ) ||
        null
    };

    const submitButton =
      form.querySelector(
        '[type="submit"]'
      );

    if (submitButton) {
      submitButton.disabled =
        true;

      submitButton.dataset
        .originalText =
        submitButton.textContent;

      submitButton.textContent =
        "Submitting...";
    }

    try {
      const offer =
        await create(data);

      form.reset();

      form.dispatchEvent(
        new CustomEvent(
          "ghar:offer-success",
          {
            detail: {
              offer
            }
          }
        )
      );

      dispatch(
        "offer-form-success",
        {
          offer,
          form
        }
      );
    } catch (error) {
      console.error(
        "[GHAR Offers]",
        error
      );

      dispatch(
        "offer-form-error",
        {
          error,
          form
        }
      );
    } finally {
      if (submitButton) {
        submitButton.disabled =
          false;

        submitButton.textContent =
          submitButton.dataset
            .originalText ||
          "Submit Offer";
      }
    }
  }

  // ----------------------------------------------------------
  // BUTTON ACTIONS
  // ----------------------------------------------------------

  async function handleAction(
    event
  ) {
    const button =
      event.target.closest(
        "[data-offer-action]"
      );

    if (!button) return;

    const action =
      button.dataset.offerAction;

    const offerId =
      button.dataset.offerId;

    if (!offerId) {
      console.warn(
        "[GHAR Offers] Missing offer ID."
      );

      return;
    }

    try {
      button.disabled = true;

      switch (action) {

        case "accept":
          await accept(offerId);
          break;

        case "reject":
          await reject(
            offerId,
            button.dataset.reason ||
              ""
          );
          break;

        case "withdraw":
          await withdraw(
            offerId
          );
          break;

        case "counter": {
          const amount =
            Number(
              button.dataset.amount
            );

          await counter(
            offerId,
            amount,
            button.dataset.message ||
              ""
          );

          break;
        }

        default:
          console.warn(
            `[GHAR Offers] Unknown action: ${action}`
          );
      }

      updateUI();
    } catch (error) {
      console.error(
        "[GHAR Offers] Action failed:",
        error
      );
    } finally {
      button.disabled =
        false;
    }
  }

  // ----------------------------------------------------------
  // INITIALIZATION
  // ----------------------------------------------------------

  function init() {
    document.addEventListener(
      "submit",
      handleFormSubmit
    );

    document.addEventListener(
      "click",
      handleAction
    );

    updateUI();

    dispatch(
      "offers-ready",
      {
        count:
          readLocalOffers()
            .length
      }
    );
  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  const offers = {
    OFFER_STATUS,
    OFFER_TYPES,

    create,
    createOffer,

    getAll,
    get,
    update,

    accept,
    reject,
    counter,
    withdraw,

    removeLocal,

    filter,

    isPending,
    isFinal,

    updateUI
  };

  GHAR.offers =
    offers;

  window.GHAR =
    GHAR;

  window.GHAROffers =
    offers;

  // ----------------------------------------------------------
  // START
  // ----------------------------------------------------------

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();