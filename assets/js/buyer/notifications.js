/**
 * GHAR Buyer Notifications
 */
"use strict";

window.GHARBuyerNotifications = {
  async list() {
    if (window.GHAR?.api?.get) return window.GHAR.api.get("/api/notifications");
    return { items: [] };
  },

  async markRead(notificationId) {
    if (!notificationId) throw new Error("notificationId is required.");
    if (window.GHAR?.api?.post) {
      return window.GHAR.api.post(
        `/api/notifications/${encodeURIComponent(notificationId)}/read`
      );
    }
    return null;
  }
};
