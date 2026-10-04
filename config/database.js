"use strict";

/**
 * ============================================================
 * GHAR - DATABASE CONFIGURATION
 * ============================================================
 *
 * PostgreSQL connection configuration using node-postgres.
 *
 * Responsibilities:
 * - Create PostgreSQL connection pool
 * - Support DATABASE_URL
 * - Support individual DB_* variables
 * - Configure pool limits
 * - Configure SSL
 * - Provide database health checks
 * - Handle graceful shutdown
 * - Prevent application crashes from idle DB errors
 * ============================================================
 */

const { Pool } = require("pg");

/* ------------------------------------------------------------
 * ENVIRONMENT
 * ------------------------------------------------------------ */

const env = require("./env");

/* ------------------------------------------------------------
 * DATABASE CONFIGURATION
 * ------------------------------------------------------------ */

const databaseConfig = {
  max:
    Number(env.database?.poolMax) ||
    Number(process.env.DB_POOL_MAX) ||
    10,

  min:
    Number(env.database?.poolMin) ||
    Number(process.env.DB_POOL_MIN) ||
    2,

  idleTimeoutMillis:
    Number(process.env.DB_IDLE_TIMEOUT_MS) ||
    30_000,

  connectionTimeoutMillis:
    Number(process.env.DB_CONNECTION_TIMEOUT_MS) ||
    10_000,

  statementTimeout:
    Number(process.env.DB_STATEMENT_TIMEOUT_MS) ||
    30_000,

  query_timeout:
    Number(process.env.DB_QUERY_TIMEOUT_MS) ||
    30_000,

  allowExitOnIdle:
    process.env.NODE_ENV === "test"
};

/* ------------------------------------------------------------
 * SSL
 * ------------------------------------------------------------ */

const dbSsl =
  String(process.env.DB_SSL || "false").toLowerCase() === "true";

if (dbSsl) {
  databaseConfig.ssl = {
    rejectUnauthorized:
      String(
        process.env.DB_SSL_REJECT_UNAUTHORIZED || "true"
      ).toLowerCase() === "true"
  };
}

/* ------------------------------------------------------------
 * DATABASE CONNECTION
 * ------------------------------------------------------------ */

let poolConfig;

/*
 * Prefer DATABASE_URL when supplied.
 *
 * This works well with:
 * - Render
 * - Railway
 * - Supabase
 * - Neon
 * - AWS
 * - managed PostgreSQL
 */

if (env.databaseUrl) {
  poolConfig = {
    connectionString: env.databaseUrl,
    ...databaseConfig
  };
} else {
  /*
   * Local development fallback.
   */

  poolConfig = {
    host:
      env.database?.host ||
      process.env.DB_HOST ||
      "localhost",

    port:
      Number(env.database?.port) ||
      Number(process.env.DB_PORT) ||
      5432,

    database:
      env.database?.name ||
      process.env.DB_NAME ||
      "ghar",

    user:
      env.database?.user ||
      process.env.DB_USER ||
      "postgres",

    password:
      env.database?.password ||
      process.env.DB_PASSWORD ||
      "",

    ...databaseConfig
  };
}

/* ------------------------------------------------------------
 * CONNECTION POOL
 * ------------------------------------------------------------ */

const pool = new Pool(poolConfig);

/* ------------------------------------------------------------
 * ERROR HANDLING
 * ------------------------------------------------------------ */

pool.on("error", (error) => {
  console.error(
    "[GHAR DATABASE] Unexpected PostgreSQL pool error:",
    error
  );
});

/* ------------------------------------------------------------
 * CONNECTION EVENT
 * ------------------------------------------------------------ */

pool.on("connect", () => {
  if (process.env.NODE_ENV !== "test") {
    console.log("[GHAR DATABASE] PostgreSQL connection established");
  }
});

/* ------------------------------------------------------------
 * HEALTH CHECK
 * ------------------------------------------------------------ */

async function checkDatabase() {
  const start = Date.now();

  try {
    const result = await pool.query(
      "SELECT NOW() AS current_time"
    );

    return {
      ok: true,
      connected: true,
      latencyMs: Date.now() - start,
      time: result.rows[0]?.current_time || null
    };
  } catch (error) {
    return {
      ok: false,
      connected: false,
      latencyMs: Date.now() - start,
      error:
        process.env.NODE_ENV === "production"
          ? "Database connection failed"
          : error.message
    };
  }
}

/* ------------------------------------------------------------
 * SIMPLE QUERY HELPER
 * ------------------------------------------------------------ */

async function query(text, params = []) {
  return pool.query(text, params);
}

/* ------------------------------------------------------------
 * TRANSACTION HELPER
 * ------------------------------------------------------------ */

async function transaction(callback) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "[GHAR DATABASE] Rollback failed:",
        rollbackError
      );
    }

    throw error;
  } finally {
    client.release();
  }
}

/* ------------------------------------------------------------
 * GRACEFUL SHUTDOWN
 * ------------------------------------------------------------ */

async function closeDatabase() {
  try {
    await pool.end();

    console.log(
      "[GHAR DATABASE] PostgreSQL pool closed"
    );
  } catch (error) {
    console.error(
      "[GHAR DATABASE] Failed to close PostgreSQL pool:",
      error
    );

    throw error;
  }
}

/* ------------------------------------------------------------
 * DATABASE INFORMATION
 * ------------------------------------------------------------ */

function getDatabaseInfo() {
  return {
    provider: "postgresql",

    host:
      env.databaseUrl
        ? "DATABASE_URL"
        : env.database?.host ||
          process.env.DB_HOST ||
          "localhost",

    database:
      env.databaseUrl
        ? "DATABASE_URL"
        : env.database?.name ||
          process.env.DB_NAME ||
          "ghar",

    poolMin: databaseConfig.min,

    poolMax: databaseConfig.max,

    ssl: Boolean(databaseConfig.ssl),

    environment: env.nodeEnv
  };
}

/* ------------------------------------------------------------
 * EXPORTS
 * ------------------------------------------------------------ */

module.exports = {
  pool,
  query,
  transaction,
  checkDatabase,
  closeDatabase,
  getDatabaseInfo
};