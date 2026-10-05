/**
 * GHAR Buyer Documents
 */
"use strict";

window.GHARBuyerDocuments = {
  async list() {
    if (window.GHAR?.api?.get) return window.GHAR.api.get("/api/documents");
    return { items: [] };
  },

  async upload(formData) {
    if (!(formData instanceof FormData)) {
      throw new TypeError("upload expects FormData.");
    }
    if (window.GHAR?.api?.upload) return window.GHAR.api.upload("/api/documents", formData);
    return null;
  }
};
