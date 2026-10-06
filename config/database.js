'use strict';

/**
 * ============================================================
 * GHAR - Database Configuration
 * ============================================================
 *
 * PostgreSQL database configuration for GHAR.
 *
 * Supports:
 * - Neon PostgreSQL
 * - Render PostgreSQL
 * - Local PostgreSQL
 * - DATABASE_URL connection strings
 * - Individual DB_* variables
 * - Connection pooling
 * - Health checks
 * - Transactions
 * - Graceful shutdown
 *
 * ============================================================
 */

const { Pool } = require('pg');
const env = require('./env');

/* ============================================================
   1. DATABASE CONFIGURATION
   ============================================================ */

const databaseConfig = {
  max:
    Number(env.database.poolMax) || 10,

  min:
    Number(env.database.poolMin) || 2,

  idleTimeoutMillis:
    Number(env.database.idleTimeout) || 30000,

  connectionTimeoutMillis:
    Number(env.database.connectionTimeout) || 10000,

  allowExitOnIdle:
    false,

  maxUses:
    Number(
      process.env.DB_MAX_USES || 7500
    ),

  keepAlive:
    true,

  keepAliveInitialDelayMillis:
    Number(
      process.env.DB_KEEPALIVE_DELAY || 10000
    )
};

/* ============================================================
   2. SSL CONFIGURATION
   ============================================================ */

const sslEnabled =
  Boolean(env.database.ssl);

const sslConfig = sslEnabled
  ? {
      rejectUnauthorized:
        process.env.DB_SSL_REJECT_UNAUTHORIZED !==
        'false'
    }
  : false;

/* ============================================================
   3. CONNECTION CONFIGURATION
   ============================================================ */

const connectionConfig = env.database.url
  ? {
      connectionString:
        env.database.url,

      ...databaseConfig,

      ssl:
        sslConfig
    }
  : {
      host:
        env.database.host,

      port:
        env.database.port,

      database:
        env.database.name,

      user:
        env.database.user,

      password:
        env.database.password,

      ...databaseConfig,

      ssl:
        sslConfig
    };

/* ============================================================
   4. VALIDATION
   ============================================================ */

function validateDatabaseConfig() {
  const errors = [];

  /*
   * DATABASE_URL is preferred for Neon/Render.
   */

  if (
    !env.database.url &&
    !env.database.host
  ) {
    errors.push(
      'DATABASE_URL or DB_HOST must be configured.'
    );
  }

  /*
   * If individual connection variables are used,
   * validate the required fields.
   */

  if (
    !env.database.url
  ) {
    if (!env.database.name) {
      errors.push(
        'DB_NAME is required when DATABASE_URL is not used.'
      );
    }

    if (!env.database.user) {
      errors.push(
        'DB_USER is required when DATABASE_URL is not used.'
      );
    }

    if (
      env.app.environment === 'production' &&
      !env.database.password
    ) {
      errors.push(
        'DB_PASSWORD is required when DATABASE_URL is not used.'
      );
    }
  }

  if (
    databaseConfig.max < 1
  ) {
    errors.push(
      'DB_POOL_MAX must be greater than 0.'
    );
  }

  if (
    databaseConfig.min < 0
  ) {
    errors.push(
      'DB_POOL_MIN cannot be negative.'
    );
  }

  if (
    databaseConfig.min >
    databaseConfig.max
  ) {
    errors.push(
      'DB_POOL_MIN cannot be greater than DB_POOL_MAX.'
    );
  }

  if (
    errors.length > 0
  ) {
    throw new Error(
      `[GHAR DATABASE CONFIG ERROR]\n- ${errors.join('\n- ')}`
    );
  }

  return true;
}

validateDatabaseConfig();

/* ============================================================
   5. CREATE CONNECTION POOL
   ============================================================ */

const pool =
  new Pool(connectionConfig);

/* ============================================================
   6. POOL ERROR HANDLER
   ============================================================ */

pool.on(
  'error',
  (error) => {
    console.error(
      '[GHAR DATABASE] Unexpected idle client error:',
      error
    );
  }
);

/* ============================================================
   7. CONNECT EVENT
   ============================================================ */

pool.on(
  'connect',
  () => {
    if (
      process.env.NODE_ENV !==
      'production'
    ) {
      console.log(
        '[GHAR DATABASE] PostgreSQL client connected.'
      );
    }
  }
);

/* ============================================================
   8. REMOVE EVENT
   ============================================================ */

pool.on(
  'remove',
  () => {
    if (
      process.env.NODE_ENV !==
      'production'
    ) {
      console.log(
        '[GHAR DATABASE] PostgreSQL client removed from pool.'
      );
    }
  }
);

/* ============================================================
   9. DATABASE CONNECT
   ============================================================ */

let databaseConnected = false;

async function connectDatabase() {
  try {
    const client =
      await pool.connect();

    try {
      await client.query(
        'SELECT 1'
      );

      databaseConnected =
        true;

      console.log(
        '[GHAR DATABASE] PostgreSQL connection successful.'
      );

      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    databaseConnected =
      false;

    console.error(
      '[GHAR DATABASE] PostgreSQL connection failed:',
      error.message
    );

    throw error;
  }
}

/* ============================================================
   10. HEALTH CHECK
   ============================================================ */

async function healthCheck() {
  try {
    await pool.query(
      'SELECT 1'
    );

    databaseConnected =
      true;

    return true;
  } catch (error) {
    databaseConnected =
      false;

    return false;
  }
}

/* ============================================================
   11. DETAILED HEALTH CHECK
   ============================================================ */

async function getHealth() {
  const startedAt =
    Date.now();

  try {
    const result =
      await pool.query(
        `
        SELECT
          NOW() AS database_time,
          current_database() AS database_name,
          current_user AS database_user,
          version() AS version
        `
      );

    return {
      healthy: true,

      responseTimeMs:
        Date.now() - startedAt,

      database:
        result.rows[0]?.database_name ||
        null,

      user:
        result.rows[0]?.database_user ||
        null,

      databaseTime:
        result.rows[0]?.database_time ||
        null,

      version:
        result.rows[0]?.version ||
        null,

      pool: {
        total:
          pool.totalCount,

        idle:
          pool.idleCount,

        waiting:
          pool.waitingCount
      }
    };
  } catch (error) {
    return {
      healthy: false,

      responseTimeMs:
        Date.now() - startedAt,

      error:
        error.message,

      pool: {
        total:
          pool.totalCount,

        idle:
          pool.idleCount,

        waiting:
          pool.waitingCount
      }
    };
  }
}

/* ============================================================
   12. QUERY
   ============================================================ */

/**
 * Execute a parameterized SQL query.
 *
 * Example:
 *
 * const result = await query(
 *   'SELECT * FROM users WHERE id = $1',
 *   [userId]
 * );
 */

async function query(
  text,
  params = []
) {
  const startedAt =
    Date.now();

  try {
    const result =
      await pool.query(
        text,
        params
      );

    if (
      process.env.DB_LOG_QUERIES ===
      'true'
    ) {
      console.log(
        `[GHAR DATABASE] Query completed in ${
          Date.now() - startedAt
        }ms`
      );
    }

    databaseConnected =
      true;

    return result;
  } catch (error) {
    databaseConnected =
      false;

    console.error(
      '[GHAR DATABASE] Query failed:',
      {
        message:
          error.message,

        code:
          error.code,

        durationMs:
          Date.now() - startedAt
      }
    );

    throw error;
  }
}

/* ============================================================
   13. TRANSACTION
   ============================================================ */

/**
 * Execute multiple operations inside a transaction.
 *
 * Example:
 *
 * await transaction(async (client) => {
 *
 *   await client.query(...);
 *
 *   await client.query(...);
 *
 * });
 */

async function transaction(
  callback
) {
  const client =
    await pool.connect();

  try {
    await client.query(
      'BEGIN'
    );

    const result =
      await callback(client);

    await client.query(
      'COMMIT'
    );

    return result;
  } catch (error) {
    try {
      await client.query(
        'ROLLBACK'
      );
    } catch (rollbackError) {
      console.error(
        '[GHAR DATABASE] Rollback failed:',
        rollbackError
      );
    }

    throw error;
  } finally {
    client.release();
  }
}

/* ============================================================
   14. GET CLIENT
   ============================================================ */

async function getClient() {
  return pool.connect();
}

/* ============================================================
   15. DATABASE VERSION
   ============================================================ */

async function getDatabaseVersion() {
  const result =
    await pool.query(
      'SELECT version() AS version'
    );

  return (
    result.rows[0]?.version ||
    null
  );
}

/* ============================================================
   16. DATABASE TIME
   ============================================================ */

async function getDatabaseTime() {
  const result =
    await pool.query(
      'SELECT NOW() AS now'
    );

  return (
    result.rows[0]?.now ||
    null
  );
}

/* ============================================================
   17. POOL INFORMATION
   ============================================================ */

function getPoolStats() {
  return {
    total:
      pool.totalCount,

    idle:
      pool.idleCount,

    waiting:
      pool.waitingCount,

    max:
      databaseConfig.max,

    min:
      databaseConfig.min
  };
}

/* ============================================================
   18. CONNECTION STATUS
   ============================================================ */

function isConnected() {
  return databaseConnected;
}

/* ============================================================
   19. CLOSE DATABASE
   ============================================================ */

let databaseClosed = false;

async function closeDatabase() {
  if (
    databaseClosed
  ) {
    return;
  }

  databaseClosed =
    true;

  try {
    await pool.end();

    databaseConnected =
      false;

    console.log(
      '[GHAR DATABASE] PostgreSQL pool closed.'
    );
  } catch (error) {
    databaseClosed =
      false;

    console.error(
      '[GHAR DATABASE] Failed to close PostgreSQL pool:',
      error
    );

    throw error;
  }
}

/* ============================================================
   20. SAFE CONFIGURATION
   ============================================================ */

function getSafeConfig() {
  return {
    provider:
      'postgresql',

    connectionMode:
      env.database.url
        ? 'DATABASE_URL'
        : 'individual',

    host:
      env.database.url
        ? '[connection-string]'
        : env.database.host,

    port:
      env.database.port,

    database:
      env.database.url
        ? '[configured]'
        : env.database.name,

    ssl:
      Boolean(env.database.ssl),

    pool: {
      min:
        databaseConfig.min,

      max:
        databaseConfig.max,

      idleTimeoutMs:
        databaseConfig.idleTimeoutMillis,

      connectionTimeoutMs:
        databaseConfig.connectionTimeoutMillis
    }
  };
}

/* ============================================================
   21. EXPORT
   ============================================================ */

module.exports = {
  pool,

  connectDatabase,

  healthCheck,

  getHealth,

  query,

  transaction,

  getClient,

  getDatabaseVersion,

  getDatabaseTime,

  getPoolStats,

  isConnected,

  closeDatabase,

  getSafeConfig
};