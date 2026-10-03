// ============================================================
// GHAR -- REAL ESTATE PLATFORM
// Production Express API
// server.js
// ============================================================

"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

// ============================================================
// CONFIG
// ============================================================

const app = express();

const PORT =
    Number(process.env.PORT) || 5000;

const NODE_ENV =
    process.env.NODE_ENV || "development";

const IS_PRODUCTION =
    NODE_ENV === "production";

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "development-only-change-this-secret";

const JWT_EXPIRES_IN =
    process.env.JWT_EXPIRES_IN || "7d";

const CLIENT_URL =
    process.env.CLIENT_URL ||
    `http://localhost:${PORT}`;

const DB_POOL_MAX =
    Number(process.env.DB_POOL_MAX) || 10;


// ============================================================
// PRODUCTION SECURITY CHECK
// ============================================================

if (IS_PRODUCTION) {

    if (
        !process.env.JWT_SECRET ||
        process.env.JWT_SECRET.length < 32
    ) {

        console.error(
            "ERROR: JWT_SECRET must contain at least 32 characters."
        );

        process.exit(1);
    }

    if (!process.env.DATABASE_URL) {

        console.error(
            "ERROR: DATABASE_URL is required in production."
        );

        process.exit(1);
    }
}


// ============================================================
// DATABASE
// ============================================================

const pool = new Pool({

    connectionString:
        process.env.DATABASE_URL,

    ssl:
        IS_PRODUCTION
            ? { rejectUnauthorized: false }
            : false,

    max:
        DB_POOL_MAX,

    idleTimeoutMillis:
        30000,

    connectionTimeoutMillis:
        10000

});


pool.on(
    "error",
    error => {

        console.error(
            "PostgreSQL pool error:",
            error
        );

    }
);


// ============================================================
// CORS
// ============================================================

const allowedOrigins =
    (process.env.CORS_ORIGINS || CLIENT_URL)
        .split(",")
        .map(value => value.trim())
        .filter(Boolean);


app.use(
    cors({

        origin(
            origin,
            callback
        ) {

            // Server-to-server / curl / Postman
            if (!origin) {

                return callback(
                    null,
                    true
                );

            }

            // Development
            if (!IS_PRODUCTION) {

                return callback(
                    null,
                    true
                );

            }

            // Production whitelist
            if (
                allowedOrigins.includes(origin)
            ) {

                return callback(
                    null,
                    true
                );

            }

            return callback(
                new Error(
                    "CORS origin not allowed"
                )
            );

        },

        credentials: true

    })
);


// ============================================================
// SECURITY
// ============================================================

app.use(
    helmet({

        contentSecurityPolicy:
            false

    })
);

app.disable(
    "x-powered-by"
);


if (IS_PRODUCTION) {

    app.set(
        "trust proxy",
        1
    );

}


// ============================================================
// BODY PARSING
// ============================================================

app.use(
    express.json({

        limit:
            "10mb"

    })
);


app.use(
    express.urlencoded({

        extended:
            true,

        limit:
            "10mb"

    })
);


// ============================================================
// REQUEST LOGGER
// ============================================================

app.use(
    (req, res, next) => {

        const started =
            Date.now();


        res.on(
            "finish",
            () => {

                const duration =
                    Date.now() - started;


                console.log(

                    `${new Date().toISOString()} ` +
                    `${req.method} ` +
                    `${req.originalUrl} ` +
                    `${res.statusCode} ` +
                    `${duration}ms`

                );

            }
        );


        next();

    }
);


// ============================================================
// STATIC GHAR FRONTEND
// ============================================================

const FRONTEND_ROOT =
    __dirname;


app.use(
    express.static(
        FRONTEND_ROOT,
        {

            index:
                false,

            extensions:
                false,

            maxAge:
                IS_PRODUCTION
                    ? "1h"
                    : 0

        }
    )
);


// ============================================================
// HELPERS
// ============================================================

function sendError(
    res,
    status,
    message,
    error = null
) {

    if (error) {

        console.error(
            message,
            error
        );

    }


    return res.status(
        status
    ).json({

        success:
            false,

        message

    });

}


function isValidId(
    value
) {

    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {

        return false;

    }


    const number =
        Number(value);


    return (
        Number.isInteger(number) &&
        number > 0
    );

}


function toId(
    value
) {

    return Number(value);

}


function positiveNumber(
    value
) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number) ||
        number <= 0
    ) {

        return null;

    }


    return number;

}


function optionalPositiveNumber(
    value
) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return null;

    }


    return positiveNumber(
        value
    );

}


function parseLimit(
    value,
    fallback = 20
) {

    const number =
        Number(value);


    if (
        !Number.isInteger(number) ||
        number < 1
    ) {

        return fallback;

    }


    return Math.min(
        number,
        100
    );

}


function parseOffset(
    value
) {

    const number =
        Number(value);


    if (
        !Number.isInteger(number) ||
        number < 0
    ) {

        return 0;

    }


    return number;

}


function cleanString(
    value,
    maxLength = 5000
) {

    if (
        value === undefined ||
        value === null
    ) {

        return null;

    }


    const string =
        String(value).trim();


    if (!string) {

        return null;

    }


    return string.slice(
        0,
        maxLength
    );

}


// ============================================================
// HEALTH
// ============================================================

app.get(
    "/api/health",
    async (
        req,
        res
    ) => {

        try {

            const result =
                await pool.query(
                    "SELECT NOW() AS time"
                );


            return res.json({

                success:
                    true,

                service:
                    "GHAR API",

                version:
                    "3.0.0",

                status:
                    "healthy",

                database:
                    "connected",

                environment:
                    NODE_ENV,

                time:
                    result.rows[0].time

            });

        } catch (error) {

            return sendError(
                res,
                503,
                "Database unavailable",
                error
            );

        }

    }
);


// ============================================================
// API INFORMATION
// ============================================================

app.get(
    "/api",
    (
        req,
        res
    ) => {

        res.json({

            success:
                true,

            name:
                "GHAR API",

            version:
                "3.0.0",

            status:
                "running",

            endpoints: {

                health:
                    "/api/health",

                auth:
                    "/api/auth",

                users:
                    "/api/users",

                properties:
                    "/api/properties",

                enquiries:
                    "/api/enquiries",

                bookings:
                    "/api/bookings",

                payments:
                    "/api/payments",

                documents:
                    "/api/documents",

                notifications:
                    "/api/notifications",

                saved:
                    "/api/saved",

                admin:
                    "/api/admin"

            }

        });

    }
);


// ============================================================
// AUTHENTICATION
// ============================================================

function authenticateToken(
    req,
    res,
    next
) {

    const authorization =
        req.headers.authorization;


    if (!authorization) {

        return res.status(
            401
        ).json({

            success:
                false,

            message:
                "Authentication required"

        });

    }


    const parts =
        authorization
            .trim()
            .split(/\s+/);


    if (
        parts.length !== 2 ||
        parts[0].toLowerCase() !== "bearer"
    ) {

        return res.status(
            401
        ).json({

            success:
                false,

            message:
                "Invalid authorization format"

        });

    }


    try {

        const decoded =
            jwt.verify(
                parts[1],
                JWT_SECRET
            );


        req.user =
            decoded;


        next();

    } catch (error) {

        return res.status(
            401
        ).json({

            success:
                false,

            message:
                "Invalid or expired token"

        });

    }

}


// ============================================================
// ADMIN AUTHORIZATION
// ============================================================

function requireAdmin(
    req,
    res,
    next
) {

    if (!req.user) {

        return res.status(
            401
        ).json({

            success:
                false,

            message:
                "Authentication required"

        });

    }


    if (
        req.user.role !== "admin"
    ) {

        return res.status(
            403
        ).json({

            success:
                false,

            message:
                "Administrator access required"

        });

    }


    next();

}


// ============================================================
// AUTH -- SIGNUP
// ============================================================

app.post(
    "/api/auth/signup",
    async (
        req,
        res
    ) => {

        try {

            const {
                name,
                email,
                password,
                phone,
                role
            } = req.body;


            const safeName =
                cleanString(
                    name,
                    150
                );


            const normalizedEmail =
                String(
                    email || ""
                )
                    .trim()
                    .toLowerCase();


            const safePhone =
                cleanString(
                    phone,
                    30
                );


            if (
                !safeName ||
                !normalizedEmail ||
                !password
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Name, email and password are required"

                });

            }


            if (
                password.length < 8
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Password must contain at least 8 characters"

                });

            }


            const allowedRoles = [

                "buyer",
                "seller",
                "tenant",
                "agent"

            ];


            const safeRole =
                allowedRoles.includes(
                    role
                )
                    ? role
                    : "buyer";


            const existing =
                await pool.query(

                    `SELECT id
                     FROM users
                     WHERE LOWER(email) = $1
                     LIMIT 1`,

                    [
                        normalizedEmail
                    ]

                );


            if (
                existing.rows.length
            ) {

                return res.status(
                    409
                ).json({

                    success:
                        false,

                    message:
                        "Email is already registered"

                });

            }


            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );


            const result =
                await pool.query(

                    `INSERT INTO users
                    (
                        name,
                        email,
                        password_hash,
                        phone,
                        role,
                        status,
                        created_at,
                        updated_at
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        'active',
                        NOW(),
                        NOW()
                    )
                    RETURNING
                        id,
                        name,
                        email,
                        phone,
                        role,
                        status,
                        created_at`,

                    [

                        safeName,
                        normalizedEmail,
                        passwordHash,
                        safePhone,
                        safeRole

                    ]

                );


            const user =
                result.rows[0];


            const token =
                jwt.sign(

                    {

                        id:
                            user.id,

                        email:
                            user.email,

                        role:
                            user.role

                    },

                    JWT_SECRET,

                    {

                        expiresIn:
                            JWT_EXPIRES_IN

                    }

                );


            return res.status(
                201
            ).json({

                success:
                    true,

                message:
                    "Account created successfully",

                token,

                user

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to create account",
                error
            );

        }

    }
);


// ============================================================
// AUTH -- LOGIN
// ============================================================

app.post(
    "/api/auth/login",
    async (
        req,
        res
    ) => {

        try {

            const email =
                String(
                    req.body.email || ""
                )
                    .trim()
                    .toLowerCase();


            const password =
                req.body.password;


            if (
                !email ||
                !password
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Email and password are required"

                });

            }


            const result =
                await pool.query(

                    `SELECT
                        id,
                        name,
                        email,
                        password_hash,
                        phone,
                        role,
                        status,
                        created_at

                     FROM users

                     WHERE LOWER(email) = $1

                     LIMIT 1`,

                    [
                        email
                    ]

                );


            if (
                !result.rows.length
            ) {

                return res.status(
                    401
                ).json({

                    success:
                        false,

                    message:
                        "Invalid email or password"

                });

            }


            const user =
                result.rows[0];


            const valid =
                await bcrypt.compare(
                    password,
                    user.password_hash
                );


            if (!valid) {

                return res.status(
                    401
                ).json({

                    success:
                        false,

                    message:
                        "Invalid email or password"

                });

            }


            if (
                user.status &&
                user.status !== "active"
            ) {

                return res.status(
                    403
                ).json({

                    success:
                        false,

                    message:
                        "Your account is not active"

                });

            }


            const token =
                jwt.sign(

                    {

                        id:
                            user.id,

                        email:
                            user.email,

                        role:
                            user.role

                    },

                    JWT_SECRET,

                    {

                        expiresIn:
                            JWT_EXPIRES_IN

                    }

                );


            delete user.password_hash;


            return res.json({

                success:
                    true,

                message:
                    "Login successful",

                token,

                user

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to login",
                error
            );

        }

    }
);


// ============================================================
// AUTH -- CURRENT USER
// ============================================================

app.get(
    "/api/auth/me",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            const result =
                await pool.query(

                    `SELECT
                        id,
                        name,
                        email,
                        phone,
                        role,
                        status,
                        created_at,
                        updated_at

                     FROM users

                     WHERE id = $1

                     LIMIT 1`,

                    [
                        req.user.id
                    ]

                );


            if (
                !result.rows.length
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,

                    message:
                        "User not found"

                });

            }


            return res.json({

                success:
                    true,

                user:
                    result.rows[0]

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to retrieve user",
                error
            );

        }

    }
);


// ============================================================
// USERS -- PROFILE
// ============================================================

app.get(
    "/api/users/profile",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            const result =
                await pool.query(

                    `SELECT
                        id,
                        name,
                        email,
                        phone,
                        role,
                        status,
                        created_at,
                        updated_at

                     FROM users

                     WHERE id = $1`,

                    [
                        req.user.id
                    ]

                );


            return res.json({

                success:
                    true,

                user:
                    result.rows[0] || null

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to load profile",
                error
            );

        }

    }
);


// ============================================================
// USERS -- UPDATE PROFILE
// ============================================================

app.patch(
    "/api/users/profile",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            const name =
                cleanString(
                    req.body.name,
                    150
                );


            const phone =
                cleanString(
                    req.body.phone,
                    30
                );


            const result =
                await pool.query(

                    `UPDATE users

                     SET
                        name =
                            COALESCE($1, name),

                        phone =
                            COALESCE($2, phone),

                        updated_at =
                            NOW()

                     WHERE id = $3

                     RETURNING
                        id,
                        name,
                        email,
                        phone,
                        role,
                        status,
                        created_at,
                        updated_at`,

                    [

                        name,
                        phone,
                        req.user.id

                    ]

                );


            if (
                !result.rows.length
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,

                    message:
                        "User not found"

                });

            }


            return res.json({

                success:
                    true,

                message:
                    "Profile updated successfully",

                user:
                    result.rows[0]

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to update profile",
                error
            );

        }

    }
);


// ============================================================
// PROPERTIES -- PUBLIC LIST
// ============================================================

app.get(
    "/api/properties",
    async (
        req,
        res
    ) => {

        try {

            const {
                type,
                listingType,
                city,
                state,
                minPrice,
                maxPrice,
                bedrooms
            } = req.query;


            const limit =
                parseLimit(
                    req.query.limit
                );


            const offset =
                parseOffset(
                    req.query.offset
                );


            const conditions = [

                "status = 'approved'"

            ];


            const values = [];


            function addCondition(
                sql,
                value
            ) {

                values.push(
                    value
                );


                conditions.push(

                    sql.replace(
                        "?",
                        `$${values.length}`
                    )

                );

            }


            if (type) {

                addCondition(
                    "property_type = ?",
                    cleanString(
                        type,
                        100
                    )
                );

            }


            if (listingType) {

                addCondition(
                    "listing_type = ?",
                    cleanString(
                        listingType,
                        50
                    )
                );

            }


            if (city) {

                addCondition(
                    "LOWER(city) = LOWER(?)",
                    cleanString(
                        city,
                        100
                    )
                );

            }


            if (state) {

                addCondition(
                    "LOWER(state) = LOWER(?)",
                    cleanString(
                        state,
                        100
                    )
                );

            }


            const minimumPrice =
                optionalPositiveNumber(
                    minPrice
                );


            if (
                minimumPrice !== null
            ) {

                addCondition(
                    "price >= ?",
                    minimumPrice
                );

            }


            const maximumPrice =
                optionalPositiveNumber(
                    maxPrice
                );


            if (
                maximumPrice !== null
            ) {

                addCondition(
                    "price <= ?",
                    maximumPrice
                );

            }


            const bedroomCount =
                optionalPositiveNumber(
                    bedrooms
                );


            if (
                bedroomCount !== null
            ) {

                addCondition(
                    "bedrooms = ?",
                    bedroomCount
                );

            }


            const where =
                `WHERE ${conditions.join(
                    " AND "
                )}`;


            const limitParameter =
                values.length + 1;


            values.push(
                limit
            );


            const offsetParameter =
                values.length + 1;


            values.push(
                offset
            );


            const result =
                await pool.query(

                    `SELECT *

                     FROM properties

                     ${where}

                     ORDER BY created_at DESC

                     LIMIT $${limitParameter}

                     OFFSET $${offsetParameter}`,

                    values

                );


            return res.json({

                success:
                    true,

                count:
                    result.rows.length,

                limit,

                offset,

                properties:
                    result.rows

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to load properties",
                error
            );

        }

    }
);


// ============================================================
// PROPERTY -- SINGLE
// ============================================================

app.get(
    "/api/properties/:id",
    async (
        req,
        res
    ) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Invalid property ID"

                });

            }


            const result =
                await pool.query(

                    `SELECT *

                     FROM properties

                     WHERE id = $1
                     AND status = 'approved'

                     LIMIT 1`,

                    [

                        toId(
                            req.params.id
                        )

                    ]

                );


            if (
                !result.rows.length
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,

                    message:
                        "Property not found"

                });

            }


            return res.json({

                success:
                    true,

                property:
                    result.rows[0]

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to load property",
                error
            );

        }

    }
);


// ============================================================
// PROPERTY -- CREATE
// ============================================================

app.post(
    "/api/properties",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            const {

                title,
                description,
                propertyType,
                listingType,
                price,
                bedrooms,
                bathrooms,
                area,
                address,
                city,
                state,
                pincode,
                latitude,
                longitude,
                images

            } = req.body;


            const safeTitle =
                cleanString(
                    title,
                    250
                );


            const safeCity =
                cleanString(
                    city,
                    100
                );


            const safePropertyType =
                cleanString(
                    propertyType,
                    100
                );


            const safeListingType =
                cleanString(
                    listingType,
                    50
                );


            const propertyPrice =
                positiveNumber(
                    price
                );


            if (
                !safeTitle ||
                !safePropertyType ||
                !safeListingType ||
                propertyPrice === null ||
                !safeCity
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Title, property type, listing type, valid price and city are required"

                });

            }


            const propertyImages =
                Array.isArray(images)
                    ? images
                        .filter(
                            image =>
                                typeof image === "string"
                        )
                        .slice(
                            0,
                            50
                        )
                    : [];


            const result =
                await pool.query(

                    `INSERT INTO properties
                    (
                        owner_id,
                        title,
                        description,
                        property_type,
                        listing_type,
                        price,
                        bedrooms,
                        bathrooms,
                        area,
                        address,
                        city,
                        state,
                        pincode,
                        latitude,
                        longitude,
                        images,
                        status,
                        created_at,
                        updated_at
                    )

                    VALUES
                    (
                        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                        $11,$12,$13,$14,$15,$16,
                        'pending',
                        NOW(),
                        NOW()
                    )

                    RETURNING *`,

                    [

                        req.user.id,

                        safeTitle,

                        cleanString(
                            description,
                            10000
                        ),

                        safePropertyType,

                        safeListingType,

                        propertyPrice,

                        optionalPositiveNumber(
                            bedrooms
                        ),

                        optionalPositiveNumber(
                            bathrooms
                        ),

                        optionalPositiveNumber(
                            area
                        ),

                        cleanString(
                            address,
                            500
                        ),

                        safeCity,

                        cleanString(
                            state,
                            100
                        ),

                        cleanString(
                            pincode,
                            20
                        ),

                        optionalPositiveNumber(
                            latitude
                        ),

                        optionalPositiveNumber(
                            longitude
                        ),

                        propertyImages

                    ]

                );


            return res.status(
                201
            ).json({

                success:
                    true,

                message:
                    "Property submitted successfully and is awaiting approval",

                property:
                    result.rows[0]

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to create property",
                error
            );

        }

    }
);


// ============================================================
// PROPERTY -- MY PROPERTIES
// ============================================================

app.get(
    "/api/properties/my",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            const result =
                await pool.query(

                    `SELECT *

                     FROM properties

                     WHERE owner_id = $1

                     ORDER BY created_at DESC`,

                    [
                        req.user.id
                    ]

                );


            return res.json({

                success:
                    true,

                properties:
                    result.rows

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to load your properties",
                error
            );

        }

    }
);


// ============================================================
// PROPERTY -- UPDATE
// ============================================================

app.put(
    "/api/properties/:id",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Invalid property ID"

                });

            }


            const {

                title,
                description,
                price,
                bedrooms,
                bathrooms,
                area,
                address,
                city,
                state,
                pincode,
                images

            } = req.body;


            const safeImages =
                Array.isArray(images)
                    ? images
                        .filter(
                            image =>
                                typeof image === "string"
                        )
                        .slice(
                            0,
                            50
                        )
                    : null;


            const result =
                await pool.query(

                    `UPDATE properties

                     SET

                        title =
                            COALESCE(
                                $1,
                                title
                            ),

                        description =
                            COALESCE(
                                $2,
                                description
                            ),

                        price =
                            COALESCE(
                                $3,
                                price
                            ),

                        bedrooms =
                            COALESCE(
                                $4,
                                bedrooms
                            ),

                        bathrooms =
                            COALESCE(
                                $5,
                                bathrooms
                            ),

                        area =
                            COALESCE(
                                $6,
                                area
                            ),

                        address =
                            COALESCE(
                                $7,
                                address
                            ),

                        city =
                            COALESCE(
                                $8,
                                city
                            ),

                        state =
                            COALESCE(
                                $9,
                                state
                            ),

                        pincode =
                            COALESCE(
                                $10,
                                pincode
                            ),

                        images =
                            COALESCE(
                                $11,
                                images
                            ),

                        status =
                            CASE
                                WHEN status = 'approved'
                                THEN 'pending'
                                ELSE status
                            END,

                        updated_at =
                            NOW()

                     WHERE id = $12
                     AND owner_id = $13

                     RETURNING *`,

                    [

                        cleanString(
                            title,
                            250
                        ),

                        cleanString(
                            description,
                            10000
                        ),

                        optionalPositiveNumber(
                            price
                        ),

                        optionalPositiveNumber(
                            bedrooms
                        ),

                        optionalPositiveNumber(
                            bathrooms
                        ),

                        optionalPositiveNumber(
                            area
                        ),

                        cleanString(
                            address,
                            500
                        ),

                        cleanString(
                            city,
                            100
                        ),

                        cleanString(
                            state,
                            100
                        ),

                        cleanString(
                            pincode,
                            20
                        ),

                        safeImages,

                        toId(
                            req.params.id
                        ),

                        req.user.id

                    ]

                );


            if (
                !result.rows.length
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,

                    message:
                        "Property not found or you are not the owner"

                });

            }


            return res.json({

                success:
                    true,

                message:
                    "Property updated successfully",

                property:
                    result.rows[0]

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to update property",
                error
            );

        }

    }
);


// ============================================================
// PROPERTY -- DELETE
// ============================================================

app.delete(
    "/api/properties/:id",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Invalid property ID"

                });

            }


            const result =
                await pool.query(

                    `DELETE FROM properties

                     WHERE id = $1
                     AND owner_id = $2

                     RETURNING id`,

                    [

                        toId(
                            req.params.id
                        ),

                        req.user.id

                    ]

                );


            if (
                !result.rows.length
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,

                    message:
                        "Property not found"

                });

            }


            return res.json({

                success:
                    true,

                message:
                    "Property deleted successfully"

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to delete property",
                error
            );

        }

    }
);


// ============================================================
// ENQUIRIES -- CREATE
// ============================================================

app.post(
    "/api/enquiries",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            const propertyId =
                req.body.propertyId;


            const message =
                cleanString(
                    req.body.message,
                    5000
                );


            const phone =
                cleanString(
                    req.body.phone,
                    30
                );


            if (
                !isValidId(
                    propertyId
                ) ||
                !message
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Valid property ID and message are required"

                });

            }


            const property =
                await pool.query(

                    `SELECT
                        id,
                        owner_id,
                        status

                     FROM properties

                     WHERE id = $1

                     LIMIT 1`,

                    [
                        toId(
                            propertyId
                        )
                    ]

                );


            if (
                !property.rows.length
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,

                    message:
                        "Property not found"

                });

            }


            const result =
                await pool.query(

                    `INSERT INTO enquiries
                    (
                        property_id,
                        user_id,
                        message,
                        phone,
                        status,
                        created_at
                    )

                    VALUES
                    ($1,$2,$3,$4,'new',NOW())

                    RETURNING *`,

                    [

                        toId(
                            propertyId
                        ),

                        req.user.id,

                        message,

                        phone

                    ]

                );


            return res.status(
                201
            ).json({

                success:
                    true,

                message:
                    "Enquiry submitted successfully",

                enquiry:
                    result.rows[0]

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to submit enquiry",
                error
            );

        }

    }
);


// ============================================================
// ENQUIRIES -- MY
// ============================================================

app.get(
    "/api/enquiries/my",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            const result =
                await pool.query(

                    `SELECT
                        e.*,
                        p.title AS property_title

                     FROM enquiries e

                     LEFT JOIN properties p
                     ON p.id = e.property_id

                     WHERE e.user_id = $1

                     ORDER BY
                        e.created_at DESC`,

                    [
                        req.user.id
                    ]

                );


            return res.json({

                success:
                    true,

                enquiries:
                    result.rows

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to load enquiries",
                error
            );

        }

    }
);


// ============================================================
// BOOKINGS -- CREATE
// ============================================================

app.post(
    "/api/bookings",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            const propertyId =
                req.body.propertyId;


            const visitDate =
                req.body.visitDate;


            const notes =
                cleanString(
                    req.body.notes,
                    3000
                );


            if (
                !isValidId(
                    propertyId
                ) ||
                !visitDate
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Property and visit date are required"

                });

            }


            const property =
                await pool.query(

                    `SELECT id
                     FROM properties
                     WHERE id = $1
                     AND status = 'approved'
                     LIMIT 1`,

                    [
                        toId(
                            propertyId
                        )
                    ]

                );


            if (
                !property.rows.length
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,

                    message:
                        "Approved property not found"

                });

            }


            const result =
                await pool.query(

                    `INSERT INTO bookings
                    (
                        property_id,
                        user_id,
                        visit_date,
                        notes,
                        status,
                        created_at
                    )

                    VALUES
                    ($1,$2,$3,$4,'pending',NOW())

                    RETURNING *`,

                    [

                        toId(
                            propertyId
                        ),

                        req.user.id,

                        visitDate,

                        notes

                    ]

                );


            return res.status(
                201
            ).json({

                success:
                    true,

                message:
                    "Visit request submitted",

                booking:
                    result.rows[0]

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to create booking",
                error
            );

        }

    }
);


// ============================================================
// BOOKINGS -- MY
// ============================================================

app.get(
    "/api/bookings/my",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            const result =
                await pool.query(

                    `SELECT
                        b.*,
                        p.title AS property_title

                     FROM bookings b

                     LEFT JOIN properties p
                     ON p.id = b.property_id

                     WHERE b.user_id = $1

                     ORDER BY
                        b.created_at DESC`,

                    [
                        req.user.id
                    ]

                );


            return res.json({

                success:
                    true,

                bookings:
                    result.rows

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to load bookings",
                error
            );

        }

    }
);


// ============================================================
// PAYMENTS -- CREATE RECORD
// ============================================================

app.post(
    "/api/payments",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            const amount =
                positiveNumber(
                    req.body.amount
                );


            const purpose =
                cleanString(
                    req.body.purpose,
                    200
                );


            const reference =
                cleanString(
                    req.body.reference,
                    200
                );


            if (
                amount === null ||
                !purpose
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Valid amount and payment purpose are required"

                });

            }


            const result =
                await pool.query(

                    `INSERT INTO payments
                    (
                        user_id,
                        amount,
                        purpose,
                        reference,
                        status,
                        created_at
                    )

                    VALUES
                    ($1,$2,$3,$4,'pending',NOW())

                    RETURNING *`,

                    [

                        req.user.id,

                        amount,

                        purpose,

                        reference

                    ]

                );


            return res.status(
                201
            ).json({

                success:
                    true,

                message:
                    "Payment record created",

                payment:
                    result.rows[0]

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to create payment",
                error
            );

        }

    }
);


// ============================================================
// PAYMENTS -- MY
// ============================================================

app.get(
    "/api/payments/my",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            const result =
                await pool.query(

                    `SELECT *

                     FROM payments

                     WHERE user_id = $1

                     ORDER BY
                        created_at DESC`,

                    [
                        req.user.id
                    ]

                );


            return res.json({

                success:
                    true,

                payments:
                    result.rows

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to load payments",
                error
            );

        }

    }
);


// ============================================================
// DOCUMENTS -- CREATE
// ============================================================

app.post(
    "/api/documents",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            const name =
                cleanString(
                    req.body.name,
                    250
                );


            const fileUrl =
                cleanString(
                    req.body.fileUrl,
                    2000
                );


            const documentType =
                cleanString(
                    req.body.documentType,
                    100
                );


            if (
                !name ||
                !fileUrl ||
                !documentType
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Document name, URL and type are required"

                });

            }


            const result =
                await pool.query(

                    `INSERT INTO documents
                    (
                        user_id,
                        name,
                        file_url,
                        document_type,
                        status,
                        created_at
                    )

                    VALUES
                    ($1,$2,$3,$4,'submitted',NOW())

                    RETURNING *`,

                    [

                        req.user.id,

                        name,

                        fileUrl,

                        documentType

                    ]

                );


            return res.status(
                201
            ).json({

                success:
                    true,

                message:
                    "Document submitted",

                document:
                    result.rows[0]

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to submit document",
                error
            );

        }

    }
);


// ============================================================
// DOCUMENTS -- MY
// ============================================================

app.get(
    "/api/documents/my",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            const result =
                await pool.query(

                    `SELECT *

                     FROM documents

                     WHERE user_id = $1

                     ORDER BY
                        created_at DESC`,

                    [
                        req.user.id
                    ]

                );


            return res.json({

                success:
                    true,

                documents:
                    result.rows

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to load documents",
                error
            );

        }

    }
);


// ============================================================
// NOTIFICATIONS
// ============================================================

app.get(
    "/api/notifications",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            const result =
                await pool.query(

                    `SELECT *

                     FROM notifications

                     WHERE user_id = $1

                     ORDER BY
                        created_at DESC`,

                    [
                        req.user.id
                    ]

                );


            return res.json({

                success:
                    true,

                notifications:
                    result.rows

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to load notifications",
                error
            );

        }

    }
);


// ============================================================
// NOTIFICATION -- MARK READ
// ============================================================

app.patch(
    "/api/notifications/:id/read",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Invalid notification ID"

                });

            }


            const result =
                await pool.query(

                    `UPDATE notifications

                     SET
                        is_read = TRUE

                     WHERE id = $1
                     AND user_id = $2

                     RETURNING *`,

                    [

                        toId(
                            req.params.id
                        ),

                        req.user.id

                    ]

                );


            if (
                !result.rows.length
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,

                    message:
                        "Notification not found"

                });

            }


            return res.json({

                success:
                    true,

                notification:
                    result.rows[0]

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to update notification",
                error
            );

        }

    }
);


// ============================================================
// SAVED PROPERTIES -- SAVE
// ============================================================

app.post(
    "/api/saved",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            const propertyId =
                req.body.propertyId;


            if (
                !isValidId(
                    propertyId
                )
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Valid property ID is required"

                });

            }


            const property =
                await pool.query(

                    `SELECT id
                     FROM properties
                     WHERE id = $1
                     AND status = 'approved'
                     LIMIT 1`,

                    [
                        toId(
                            propertyId
                        )
                    ]

                );


            if (
                !property.rows.length
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,

                    message:
                        "Approved property not found"

                });

            }


            const result =
                await pool.query(

                    `INSERT INTO saved_properties
                    (
                        user_id,
                        property_id,
                        created_at
                    )

                    VALUES
                    ($1,$2,NOW())

                    ON CONFLICT
                    (
                        user_id,
                        property_id
                    )

                    DO NOTHING

                    RETURNING *`,

                    [

                        req.user.id,

                        toId(
                            propertyId
                        )

                    ]

                );


            return res.status(
                201
            ).json({

                success:
                    true,

                message:
                    result.rows.length
                        ? "Property saved"
                        : "Property already saved",

                saved:
                    result.rows[0] || null

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to save property",
                error
            );

        }

    }
);


// ============================================================
// SAVED PROPERTIES -- LIST
// ============================================================

app.get(
    "/api/saved",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            const result =
                await pool.query(

                    `SELECT
                        sp.id AS saved_id,
                        sp.created_at AS saved_at,
                        p.*

                     FROM saved_properties sp

                     JOIN properties p
                     ON p.id = sp.property_id

                     WHERE sp.user_id = $1

                     ORDER BY
                        sp.created_at DESC`,

                    [
                        req.user.id
                    ]

                );


            return res.json({

                success:
                    true,

                properties:
                    result.rows

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to load saved properties",
                error
            );

        }

    }
);


// ============================================================
// SAVED PROPERTIES -- REMOVE
// ============================================================

app.delete(
    "/api/saved/:propertyId",
    authenticateToken,
    async (
        req,
        res
    ) => {

        try {

            if (
                !isValidId(
                    req.params.propertyId
                )
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Invalid property ID"

                });

            }


            await pool.query(

                `DELETE FROM saved_properties

                 WHERE user_id = $1
                 AND property_id = $2`,

                [

                    req.user.id,

                    toId(
                        req.params.propertyId
                    )

                ]

            );


            return res.json({

                success:
                    true,

                message:
                    "Property removed from saved list"

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to remove saved property",
                error
            );

        }

    }
);


// ============================================================
// ADMIN -- DASHBOARD
// ============================================================

app.get(
    "/api/admin/dashboard",
    authenticateToken,
    requireAdmin,
    async (
        req,
        res
    ) => {

        try {

            const [

                users,
                properties,
                pendingProperties,
                enquiries,
                bookings,
                payments

            ] = await Promise.all([

                pool.query(
                    "SELECT COUNT(*) FROM users"
                ),

                pool.query(
                    "SELECT COUNT(*) FROM properties"
                ),

                pool.query(
                    `SELECT COUNT(*)
                     FROM properties
                     WHERE status = 'pending'`
                ),

                pool.query(
                    "SELECT COUNT(*) FROM enquiries"
                ),

                pool.query(
                    "SELECT COUNT(*) FROM bookings"
                ),

                pool.query(
                    "SELECT COUNT(*) FROM payments"
                )

            ]);


            return res.json({

                success:
                    true,

                dashboard: {

                    users:
                        Number(
                            users.rows[0].count
                        ),

                    properties:
                        Number(
                            properties.rows[0].count
                        ),

                    pendingProperties:
                        Number(
                            pendingProperties.rows[0].count
                        ),

                    enquiries:
                        Number(
                            enquiries.rows[0].count
                        ),

                    bookings:
                        Number(
                            bookings.rows[0].count
                        ),

                    payments:
                        Number(
                            payments.rows[0].count
                        )

                }

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to load admin dashboard",
                error
            );

        }

    }
);


// ============================================================
// ADMIN -- USERS
// ============================================================

app.get(
    "/api/admin/users",
    authenticateToken,
    requireAdmin,
    async (
        req,
        res
    ) => {

        try {

            const result =
                await pool.query(

                    `SELECT
                        id,
                        name,
                        email,
                        phone,
                        role,
                        status,
                        created_at,
                        updated_at

                     FROM users

                     ORDER BY
                        created_at DESC

                     LIMIT 500`

                );


            return res.json({

                success:
                    true,

                users:
                    result.rows

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to load users",
                error
            );

        }

    }
);


// ============================================================
// ADMIN -- PROPERTIES
// ============================================================

app.get(
    "/api/admin/properties",
    authenticateToken,
    requireAdmin,
    async (
        req,
        res
    ) => {

        try {

            const result =
                await pool.query(

                    `SELECT
                        p.*,
                        u.name AS owner_name,
                        u.email AS owner_email,
                        u.phone AS owner_phone

                     FROM properties p

                     LEFT JOIN users u
                     ON u.id = p.owner_id

                     ORDER BY
                        p.created_at DESC

                     LIMIT 500`

                );


            return res.json({

                success:
                    true,

                properties:
                    result.rows

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to load admin properties",
                error
            );

        }

    }
);


// ============================================================
// ADMIN -- PROPERTY STATUS
// ============================================================

app.patch(
    "/api/admin/properties/:id/status",
    authenticateToken,
    requireAdmin,
    async (
        req,
        res
    ) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Invalid property ID"

                });

            }


            const allowedStatuses = [

                "pending",
                "approved",
                "rejected",
                "sold",
                "rented",
                "inactive"

            ];


            const status =
                req.body.status;


            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Invalid property status"

                });

            }


            const result =
                await pool.query(

                    `UPDATE properties

                     SET
                        status = $1,
                        updated_at = NOW()

                     WHERE id = $2

                     RETURNING *`,

                    [

                        status,

                        toId(
                            req.params.id
                        )

                    ]

                );


            if (
                !result.rows.length
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,

                    message:
                        "Property not found"

                });

            }


            return res.json({

                success:
                    true,

                message:
                    "Property status updated",

                property:
                    result.rows[0]

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to update property status",
                error
            );

        }

    }
);


// ============================================================
// ADMIN -- ENQUIRIES
// ============================================================

app.get(
    "/api/admin/enquiries",
    authenticateToken,
    requireAdmin,
    async (
        req,
        res
    ) => {

        try {

            const result =
                await pool.query(

                    `SELECT
                        e.*,
                        p.title AS property_title,
                        u.name AS user_name,
                        u.email AS user_email,
                        u.phone AS user_phone

                     FROM enquiries e

                     LEFT JOIN properties p
                     ON p.id = e.property_id

                     LEFT JOIN users u
                     ON u.id = e.user_id

                     ORDER BY
                        e.created_at DESC

                     LIMIT 500`

                );


            return res.json({

                success:
                    true,

                enquiries:
                    result.rows

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to load enquiries",
                error
            );

        }

    }
);


// ============================================================
// ADMIN -- BOOKINGS
// ============================================================

app.get(
    "/api/admin/bookings",
    authenticateToken,
    requireAdmin,
    async (
        req,
        res
    ) => {

        try {

            const result =
                await pool.query(

                    `SELECT
                        b.*,
                        p.title AS property_title,
                        u.name AS user_name,
                        u.email AS user_email,
                        u.phone AS user_phone

                     FROM bookings b

                     LEFT JOIN properties p
                     ON p.id = b.property_id

                     LEFT JOIN users u
                     ON u.id = b.user_id

                     ORDER BY
                        b.created_at DESC

                     LIMIT 500`

                );


            return res.json({

                success:
                    true,

                bookings:
                    result.rows

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to load bookings",
                error
            );

        }

    }
);


// ============================================================
// ADMIN -- BOOKING STATUS
// ============================================================

app.patch(
    "/api/admin/bookings/:id/status",
    authenticateToken,
    requireAdmin,
    async (
        req,
        res
    ) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Invalid booking ID"

                });

            }


            const allowed = [

                "pending",
                "confirmed",
                "completed",
                "cancelled",
                "rejected"

            ];


            const status =
                req.body.status;


            if (
                !allowed.includes(
                    status
                )
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Invalid booking status"

                });

            }


            const result =
                await pool.query(

                    `UPDATE bookings

                     SET
                        status = $1

                     WHERE id = $2

                     RETURNING *`,

                    [

                        status,

                        toId(
                            req.params.id
                        )

                    ]

                );


            if (
                !result.rows.length
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,

                    message:
                        "Booking not found"

                });

            }


            return res.json({

                success:
                    true,

                message:
                    "Booking status updated",

                booking:
                    result.rows[0]

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to update booking",
                error
            );

        }

    }
);


// ============================================================
// ADMIN -- PAYMENTS
// ============================================================

app.get(
    "/api/admin/payments",
    authenticateToken,
    requireAdmin,
    async (
        req,
        res
    ) => {

        try {

            const result =
                await pool.query(

                    `SELECT
                        p.*,
                        u.name AS user_name,
                        u.email AS user_email

                     FROM payments p

                     LEFT JOIN users u
                     ON u.id = p.user_id

                     ORDER BY
                        p.created_at DESC

                     LIMIT 500`

                );


            return res.json({

                success:
                    true,

                payments:
                    result.rows

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to load payments",
                error
            );

        }

    }
);


// ============================================================
// ADMIN -- USER STATUS
// ============================================================

app.patch(
    "/api/admin/users/:id/status",
    authenticateToken,
    requireAdmin,
    async (
        req,
        res
    ) => {

        try {

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Invalid user ID"

                });

            }


            const allowed = [

                "active",
                "inactive",
                "suspended",
                "blocked"

            ];


            const status =
                req.body.status;


            if (
                !allowed.includes(
                    status
                )
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "Invalid user status"

                });

            }


            if (
                Number(
                    req.params.id
                ) ===
                Number(
                    req.user.id
                )
            ) {

                return res.status(
                    400
                ).json({

                    success:
                        false,

                    message:
                        "You cannot change your own account status"

                });

            }


            const result =
                await pool.query(

                    `UPDATE users

                     SET
                        status = $1,
                        updated_at = NOW()

                     WHERE id = $2

                     RETURNING
                        id,
                        name,
                        email,
                        phone,
                        role,
                        status,
                        created_at,
                        updated_at`,

                    [

                        status,

                        toId(
                            req.params.id
                        )

                    ]

                );


            if (
                !result.rows.length
            ) {

                return res.status(
                    404
                ).json({

                    success:
                        false,

                    message:
                        "User not found"

                });

            }


            return res.json({

                success:
                    true,

                message:
                    "User status updated",

                user:
                    result.rows[0]

            });

        } catch (error) {

            return sendError(
                res,
                500,
                "Unable to update user",
                error
            );

        }

    }
);


// ============================================================
// API 404
// ============================================================

app.use(
    "/api",
    (
        req,
        res
    ) => {

        return res.status(
            404
        ).json({

            success:
                false,

            message:
                "API endpoint not found",

            path:
                req.originalUrl

        });

    }
);


// ============================================================
// FRONTEND ROUTING
// ============================================================

// Root
app.get(
    "/",
    (
        req,
        res
    ) => {

        res.sendFile(
            path.join(
                FRONTEND_ROOT,
                "index.html"
            )
        );

    }
);


// Existing HTML files
app.get(
    "/*.html",
    (
        req,
        res,
        next
    ) => {

        const requestedFile =
            path.join(
                FRONTEND_ROOT,
                req.path
            );


        res.sendFile(
            requestedFile,
            error => {

                if (error) {

                    next();

                }

            }
        );

    }
);


// Frontend route fallback
app.get(
    "*splat",
    (
        req,
        res,
        next
    ) => {

        if (
            req.originalUrl.startsWith(
                "/api/"
            )
        ) {

            return next();

        }


        if (
            path.extname(
                req.path
            )
        ) {

            return next();

        }


        return res.sendFile(
            path.join(
                FRONTEND_ROOT,
                "index.html"
            ),
            error => {

                if (error) {

                    next(error);

                }

            }
        );

    }
);


// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "Unhandled server error:",
            error
        );


        if (
            res.headersSent
        ) {

            return next(error);

        }


        return res.status(
            error.status || 500
        ).json({

            success:
                false,

            message:
                IS_PRODUCTION
                    ? "Internal server error"
                    : error.message

        });

    }
);


// ============================================================
// START SERVER
// ============================================================

async function startServer() {

    try {

        await pool.query(
            "SELECT 1"
        );


        console.log(
            "PostgreSQL connection successful."
        );


        const server =
            app.listen(
                PORT,
                () => {

                    console.log("");

                    console.log(
                        "================================================"
                    );

                    console.log(
                        "                 GHAR SERVER"
                    );

                    console.log(
                        "================================================"
                    );

                    console.log(
                        `Environment : ${NODE_ENV}`
                    );

                    console.log(
                        `Port        : ${PORT}`
                    );

                    console.log(
                        `Frontend    : ${CLIENT_URL}`
                    );

                    console.log(
                        `API         : ${CLIENT_URL}/api`
                    );

                    console.log(
                        `Health      : ${CLIENT_URL}/api/health`
                    );

                    console.log(
                        "================================================"
                    );

                    console.log("");

                }
            );


        // ====================================================
        // GRACEFUL SHUTDOWN
        // ====================================================

        async function shutdown(
            signal
        ) {

            console.log(
                `${signal} received. Shutting down...`
            );


            server.close(
                async error => {

                    if (error) {

                        console.error(
                            "Server shutdown error:",
                            error
                        );

                    }


                    try {

                        await pool.end();


                        console.log(
                            "PostgreSQL pool closed."
                        );


                        process.exit(
                            error
                                ? 1
                                : 0
                        );

                    } catch (
                        dbError
                    ) {

                        console.error(
                            "Database shutdown error:",
                            dbError
                        );


                        process.exit(
                            1
                        );

                    }

                }
            );

        }


        process.once(
            "SIGTERM",
            () =>
                shutdown(
                    "SIGTERM"
                )
        );


        process.once(
            "SIGINT",
            () =>
                shutdown(
                    "SIGINT"
                )
        );


    } catch (error) {

        console.error(
            "Unable to connect to PostgreSQL."
        );


        console.error(
            error
        );


        process.exit(
            1
        );

    }

}


startServer();


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    app,

    pool,

    authenticateToken,

    requireAdmin

};