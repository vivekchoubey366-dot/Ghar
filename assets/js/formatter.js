// ============================================================
// GHAR - Formatter.js
// Global formatting utilities
// ============================================================

"use strict";

(function (window) {

  const GHAR = window.GHAR = window.GHAR || {};

  const Formatter = {

    currency(value, currency = "INR", locale = "en-IN") {
      const amount = Number(value);

      if (!Number.isFinite(amount)) {
        return "₹0";
      }

      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0
      }).format(amount);
    },

    number(value, locale = "en-IN") {
      const number = Number(value);

      if (!Number.isFinite(number)) {
        return "0";
      }

      return new Intl.NumberFormat(locale).format(number);
    },

    compactNumber(value, locale = "en-IN") {
      const number = Number(value);

      if (!Number.isFinite(number)) {
        return "0";
      }

      return new Intl.NumberFormat(locale, {
        notation: "compact",
        maximumFractionDigits: 1
      }).format(number);
    },

    area(value, unit = "sq ft") {
      const number = Number(value);

      if (!Number.isFinite(number)) {
        return `0 ${unit}`;
      }

      return `${this.number(number)} ${unit}`;
    },

    percentage(value, decimals = 2) {
      const number = Number(value);

      if (!Number.isFinite(number)) {
        return "0%";
      }

      return `${number.toFixed(decimals)}%`;
    },

    date(value, options = {}) {
      if (!value) {
        return "--";
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return "--";
      }

      return new Intl.DateTimeFormat(
        options.locale || "en-IN",
        options.format || {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }
      ).format(date);
    },

    dateTime(value) {
      if (!value) {
        return "--";
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return "--";
      }

      return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(date);
    },

    relativeTime(value) {
      if (!value) {
        return "--";
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return "--";
      }

      const diff =
        Date.now() - date.getTime();

      const seconds =
        Math.floor(diff / 1000);

      if (seconds < 60) {
        return "Just now";
      }

      const minutes =
        Math.floor(seconds / 60);

      if (minutes < 60) {
        return `${minutes}m ago`;
      }

      const hours =
        Math.floor(minutes / 60);

      if (hours < 24) {
        return `${hours}h ago`;
      }

      const days =
        Math.floor(hours / 24);

      if (days < 30) {
        return `${days}d ago`;
      }

      return this.date(value);
    },

    phone(value) {
      if (!value) {
        return "--";
      }

      const digits =
        String(value).replace(
          /\D/g,
          ""
        );

      if (digits.length === 10) {
        return digits.replace(
          /(\d{5})(\d{5})/,
          "$1 $2"
        );
      }

      return String(value);
    },

    maskPhone(value) {
      const digits =
        String(value || "").replace(
          /\D/g,
          ""
        );

      if (digits.length < 4) {
        return "****";
      }

      return `${"*".repeat(
        Math.max(0, digits.length - 4)
      )}${digits.slice(-4)}`;
    },

    maskEmail(value) {
      if (!value || !String(value).includes("@")) {
        return "--";
      }

      const [name, domain] =
        String(value).split("@");

      const visible =
        name.length > 2
          ? name.slice(0, 2)
          : name.slice(0, 1);

      return `${visible}***@${domain}`;
    },

    fileSize(bytes) {
      const value = Number(bytes);

      if (!Number.isFinite(value) || value <= 0) {
        return "0 Bytes";
      }

      const units = [
        "Bytes",
        "KB",
        "MB",
        "GB",
        "TB"
      ];

      const index = Math.min(
        Math.floor(
          Math.log(value) /
          Math.log(1024)
        ),
        units.length - 1
      );

      return `${(
        value /
        Math.pow(1024, index)
      ).toFixed(index === 0 ? 0 : 2)} ${
        units[index]
      }`;
    },

    propertyPrice(value) {
      const amount = Number(value);

      if (!Number.isFinite(amount)) {
        return "₹0";
      }

      if (amount >= 10000000) {
        return `₹${(
          amount / 10000000
        ).toFixed(2)} Cr`;
      }

      if (amount >= 100000) {
        return `₹${(
          amount / 100000
        ).toFixed(2)} L`;
      }

      return this.currency(amount);
    },

    pricePerSqft(price, area) {
      const p = Number(price);
      const a = Number(area);

      if (
        !Number.isFinite(p) ||
        !Number.isFinite(a) ||
        a <= 0
      ) {
        return "₹0/sq ft";
      }

      return `${this.currency(
        p / a
      )}/sq ft`;
    },

    slug(value) {
      return String(value || "")
        .toLowerCase()
        .trim()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        );
    },

    capitalize(value) {
      if (!value) {
        return "";
      }

      return String(value)
        .charAt(0)
        .toUpperCase() +
        String(value).slice(1);
    },

    title(value) {
      return String(value || "")
        .toLowerCase()
        .replace(
          /\b\w/g,
          char => char.toUpperCase()
        );
    },

    status(value) {
      if (!value) {
        return "Unknown";
      }

      return String(value)
        .replace(/[_-]/g, " ")
        .replace(
          /\b\w/g,
          char => char.toUpperCase()
        );
    },

    truncate(value, length = 100) {
      const text =
        String(value || "");

      if (
        text.length <= length
      ) {
        return text;
      }

      return `${text.slice(
        0,
        Math.max(0, length - 3)
      )}...`;
    },

    initials(value) {
      const words =
        String(value || "")
          .trim()
          .split(/\s+/)
          .filter(Boolean);

      return words
        .slice(0, 2)
        .map(
          word =>
            word
              .charAt(0)
              .toUpperCase()
        )
        .join("");
    }

  };

  GHAR.Formatter = Formatter;

  window.GHARFormatter = Formatter;

})(window);