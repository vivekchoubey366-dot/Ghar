'use strict';

/**
 * ============================================================
 * GHAR - Configuration Index
 * ============================================================
 *
 * Central configuration loader for the GHAR backend.
 *
 * Usage:
 *
 * const config = require('./config');
 *
 * Examples:
 *
 * config.env
 * config.database
 * config.security
 * config.cors
 * config.email
 * config.ai
 *
 * ============================================================
 */

/* ============================================================
   1. LOAD CONFIGURATION MODULES
   ============================================================ */

const env = require('./env');

const database =
  require('./database');

const security =
  require('./security');

const cors =
  require('./cors');

const email =
  require('./email');

const ai =
  require('./ai');

/* ============================================================
   2. APPLICATION CONFIGURATION
   ============================================================ */

const app = {
  name:
    env.app.name || 'GHAR',

  environment:
    env.app.environment,

  port:
    env.app.port,

  host:
    env.app.host,

  url:
    env.app.url,

  version:
    env.app.version
};

/* ============================================================
   3. CONFIGURATION VALIDATION
   ============================================================ */

function validate() {
  const results = {
    env: true,
    database: true,
    security: true,
    email: true,
    ai: true
  };

  /*
   * env.js is already responsible for validating
   * environment variables.
   */

  /*
   * Database configuration.
   */

  if (
    database &&
    typeof database.getSafeConfig ===
      'function'
  ) {
    database.getSafeConfig();
  }

  /*
   * Security configuration.
   */

  if (
    security &&
    typeof security.validate ===
      'function'
  ) {
    security.validate();
  }

  /*
   * Email configuration.
   */

  if (
    email &&
    typeof email.validate ===
      'function'
  ) {
    email.validate();
  }

  /*
   * AI configuration.
   */

  if (
    ai &&
    typeof ai.validate ===
      'function'
  ) {
    ai.validate();
  }

  return results;
}

/* ============================================================
   4. SAFE CONFIGURATION
   ============================================================ */

function getSafeConfig() {
  return {
    app: {
      name:
        app.name,

      environment:
        app.environment,

      port:
        app.port,

      host:
        app.host,

      url:
        app.url,

      version:
        app.version
    },

    database:
      database &&
      typeof database.getSafeConfig ===
        'function'
        ? database.getSafeConfig()
        : null,

    security:
      security &&
      typeof security.getSafeConfig ===
        'function'
        ? security.getSafeConfig()
        : null,

    email:
      email &&
      typeof email.getSafeConfig ===
        'function'
        ? email.getSafeConfig()
        : null,

    ai:
      ai &&
      typeof ai.getSafeConfig ===
        'function'
        ? ai.getSafeConfig()
        : null
  };
}

/* ============================================================
   5. CONFIGURATION STATUS
   ============================================================ */

function getStatus() {
  return {
    application: {
      name:
        app.name,

      environment:
        app.environment,

      version:
        app.version
    },

    database: {
      configured:
        Boolean(
          database
        )
    },

    security: {
      configured:
        Boolean(
          security
        )
    },

    email: {
      enabled:
        Boolean(
          email &&
          email.enabled
        )
    },

    ai: {
      enabled:
        Boolean(
          ai &&
          ai.enabled
        )
    }
  };
}

/* ============================================================
   6. EXPORT
   ============================================================ */

module.exports = {
  /*
   * Application
   */

  app,

  /*
   * Core environment configuration
   */

  env,

  /*
   * Infrastructure
   */

  database,

  /*
   * Security
   */

  security,

  /*
   * Cross-origin configuration
   */

  cors,

  /*
   * Email
   */

  email,

  /*
   * Artificial intelligence
   */

  ai,

  /*
   * Helpers
   */

  validate,

  getSafeConfig,

  getStatus
};