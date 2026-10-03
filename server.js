"use strict";

/*
============================================================
 GHAR REAL ESTATE PLATFORM
 Production Express Server
 Render-compatible
 Node.js 20+
============================================================
*/

const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const dotenv = require("dotenv");

// ------------------------------------------------------------
// ENVIRONMENT
// ------------------------------------------------------------

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 10000;
const HOST = "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "production";


// ------------------------------------------------------------
// PROJECT PATH
// ------------------------------------------------------------

const ROOT_DIR = __dirname;


// ------------------------------------------------------------
// FRONTEND PATH AUTO-DETECTION
// ------------------------------------------------------------
//
// The server checks all common GHAR frontend locations.
//
// 1. /index.html
// 2. /public/index.html
// 3. /frontend/index.html
// 4. /client/index.html
// 5. /www/index.html
// 6. /dist/index.html
//
// The first location containing index.html is used.
// ------------------------------------------------------------

const FRONTEND_CANDIDATES = [
    ROOT_DIR,
    path.join(ROOT_DIR, "public"),
    path.join(ROOT_DIR, "frontend"),
    path.join(ROOT_DIR, "client"),
    path.join(ROOT_DIR, "www"),
    path.join(ROOT_DIR, "dist")
];

let FRONTEND_DIR = null;

for (const candidate of FRONTEND_CANDIDATES) {

    const indexFile = path.join(candidate, "index.html");

    if (fs.existsSync(indexFile)) {

        FRONTEND_DIR = candidate;

        break;
    }
}


// ------------------------------------------------------------
// FRONTEND ERROR
// ------------------------------------------------------------

if (!FRONTEND_DIR) {

    console.error("");
    console.error("==============================================");
    console.error(" GHAR FRONTEND ERROR");
    console.error("==============================================");

    console.error("index.html was not found.");

    console.error("");
    console.error("Checked:");

    for (const candidate of FRONTEND_CANDIDATES) {
        console.error(" - " + candidate);
    }

    console.error("");
    console.error("Your index.html must exist in one of");
    console.error("the locations above.");

    console.error("==============================================");
    console.error("");

    // Keep server running so Render can display
    // useful diagnostics instead of crashing.

    FRONTEND_DIR = ROOT_DIR;
}


// ------------------------------------------------------------
// STARTUP INFORMATION
// ------------------------------------------------------------

console.log("");
console.log("==============================================");
console.log(" GHAR SERVER");
console.log("==============================================");
console.log("Root directory:");
console.log(ROOT_DIR);

console.log("");

console.log("Frontend directory:");
console.log(FRONTEND_DIR);

console.log("");

console.log("Environment:");
console.log(NODE_ENV);

console.log("");

console.log("Port:");
console.log(PORT);

console.log("==============================================");
console.log("");


// ------------------------------------------------------------
// SECURITY
// ------------------------------------------------------------

app.disable("x-powered-by");


// ------------------------------------------------------------
// CORS
// ------------------------------------------------------------

app.use(
    cors({
        origin: true,
        credentials: true
    })
);


// ------------------------------------------------------------
// BODY PARSERS
// ------------------------------------------------------------

app.use(
    express.json({
        limit: "10mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb"
    })
);


// ------------------------------------------------------------
// REQUEST LOGGER
// ------------------------------------------------------------

app.use((req, res, next) => {

    console.log(
        `[GHAR] ${req.method} ${req.originalUrl}`
    );

    next();
});


// ============================================================
// API HEALTH
// ============================================================

app.get("/api/health", (req, res) => {

    res.status(200).json({

        ok: true,

        service: "GHAR API",

        status: "running",

        environment: NODE_ENV,

        frontend: FRONTEND_DIR,

        timestamp: new Date().toISOString()

    });

});


// ============================================================
// API ROOT
// ============================================================

app.get("/api", (req, res) => {

    res.json({

        ok: true,

        service: "GHAR API",

        version: "1.0.0",

        endpoints: {

            health: "/api/health",

            auth: "/api/auth",

            users: "/api/users",

            properties: "/api/properties",

            enquiries: "/api/enquiries",

            appointments: "/api/appointments",

            chat: "/api/chat",

            subscriptions: "/api/subscriptions",

            payments: "/api/payments",

            notifications: "/api/notifications",

            reports: "/api/reports",

            admin: "/api/admin"

        }

    });

});


// ============================================================
// STATIC ASSET DIRECTORIES
// ============================================================
//
// These work whether the folders are in the project root
// or inside the detected frontend directory.
// ============================================================

const STATIC_DIRECTORIES = [

    "assets",

    "css",

    "js",

    "images",

    "img",

    "fonts",

    "uploads",

    "media",

    "documents"

];


for (const directory of STATIC_DIRECTORIES) {

    const rootDirectory =
        path.join(FRONTEND_DIR, directory);

    if (fs.existsSync(rootDirectory)) {

        app.use(
            `/${directory}`,
            express.static(rootDirectory, {
                fallthrough: true,
                maxAge:
                    NODE_ENV === "production"
                        ? "1d"
                        : 0
            })
        );

        console.log(
            `[GHAR] Static: /${directory}`
        );
    }

}


// ============================================================
// FRONTEND FILE RESOLVER
// ============================================================
//
// IMPORTANT:
//
// DO NOT use:
//
// app.get("/*.html", ...)
//
// Express 5 / path-to-regexp rejects that pattern.
//
// This middleware safely resolves files instead.
// ============================================================

app.use((req, res, next) => {

    // Only frontend GET / HEAD requests
    if (
        req.method !== "GET" &&
        req.method !== "HEAD"
    ) {

        return next();

    }


    // Never allow frontend resolver to handle API
    if (
        req.path === "/api" ||
        req.path.startsWith("/api/")
    ) {

        return next();

    }


    // Block sensitive directories
    const blockedPrefixes = [

        "/server",

        "/node_modules",

        "/.git",

        "/.env",

        "/data"

    ];


    const lowerPath =
        req.path.toLowerCase();


    for (const blocked of blockedPrefixes) {

        if (
            lowerPath === blocked ||
            lowerPath.startsWith(blocked + "/")
        ) {

            return res.status(403).send(
                "Forbidden"
            );

        }

    }


    // Decode URL
    let requestedPath;

    try {

        requestedPath =
            decodeURIComponent(req.path);

    } catch {

        return res.status(400).send(
            "Invalid URL."
        );

    }


    // Remove leading slash
    requestedPath =
        requestedPath.replace(/^\/+/, "");


    // Empty request
    if (!requestedPath) {

        return next();

    }


    // Path traversal protection
    if (
        requestedPath.includes("..") ||
        requestedPath.includes("\0")
    ) {

        return res.status(400).send(
            "Invalid path."
        );

    }


    // --------------------------------------------------------
    // Exact file
    // --------------------------------------------------------

    const exactPath =
        path.resolve(
            FRONTEND_DIR,
            requestedPath
        );


    const exactRelative =
        path.relative(
            FRONTEND_DIR,
            exactPath
        );


    // Make sure file remains inside frontend
    if (
        exactRelative.startsWith("..") ||
        path.isAbsolute(exactRelative)
    ) {

        return res.status(403).send(
            "Forbidden."
        );

    }


    if (
        fs.existsSync(exactPath) &&
        fs.statSync(exactPath).isFile()
    ) {

        return res.sendFile(exactPath);

    }


    // --------------------------------------------------------
    // Try .html automatically
    //
    // Example:
    //
    // /login
    //
    // becomes:
    //
    // /login.html
    // --------------------------------------------------------

    if (!path.extname(requestedPath)) {

        const htmlPath =
            path.resolve(
                FRONTEND_DIR,
                requestedPath + ".html"
            );


        const htmlRelative =
            path.relative(
                FRONTEND_DIR,
                htmlPath
            );


        if (
            !htmlRelative.startsWith("..") &&
            !path.isAbsolute(htmlRelative) &&
            fs.existsSync(htmlPath) &&
            fs.statSync(htmlPath).isFile()
        ) {

            return res.sendFile(htmlPath);

        }

    }


    // --------------------------------------------------------
    // Directory index
    //
    // Example:
    //
    // /admin/
    //
    // becomes:
    //
    // /admin/index.html
    // --------------------------------------------------------

    const directoryPath =
        path.resolve(
            FRONTEND_DIR,
            requestedPath
        );


    if (
        fs.existsSync(directoryPath) &&
        fs.statSync(directoryPath).isDirectory()
    ) {

        const directoryIndex =
            path.join(
                directoryPath,
                "index.html"
            );


        if (
            fs.existsSync(directoryIndex) &&
            fs.statSync(directoryIndex).isFile()
        ) {

            return res.sendFile(
                directoryIndex
            );

        }

    }


    return next();

});


// ============================================================
// OPTIONAL BACKEND ROUTES
// ============================================================
//
// The server automatically loads route files if they exist.
//
// Missing route files do NOT crash the server.
// ============================================================

function mountRoute(url, relativeFile) {

    const routeFile =
        path.join(
            ROOT_DIR,
            relativeFile
        );


    if (!fs.existsSync(routeFile)) {

        console.log(
            `[GHAR] Route not found: ${relativeFile}`
        );

        return;

    }


    try {

        const router =
            require(routeFile);


        if (
            typeof router === "function"
        ) {

            app.use(
                url,
                router
            );

            console.log(
                `[GHAR] Mounted: ${url}`
            );

        } else {

            console.warn(
                `[GHAR] Invalid router: ${relativeFile}`
            );

        }

    } catch (error) {

        console.error(
            `[GHAR] Failed route: ${relativeFile}`
        );

        console.error(
            error.message
        );

    }

}


// ------------------------------------------------------------
// GHAR API ROUTES
// ------------------------------------------------------------

mountRoute(
    "/api/auth",
    "server/routes/auth.js"
);

mountRoute(
    "/api/users",
    "server/routes/users.js"
);

mountRoute(
    "/api/properties",
    "server/routes/properties.js"
);

mountRoute(
    "/api/enquiries",
    "server/routes/enquiries.js"
);

mountRoute(
    "/api/appointments",
    "server/routes/appointments.js"
);

mountRoute(
    "/api/chat",
    "server/routes/chat.js"
);

mountRoute(
    "/api/subscriptions",
    "server/routes/subscriptions.js"
);

mountRoute(
    "/api/payments",
    "server/routes/payments.js"
);

mountRoute(
    "/api/notifications",
    "server/routes/notifications.js"
);

mountRoute(
    "/api/reports",
    "server/routes/reports.js"
);

mountRoute(
    "/api/admin",
    "server/routes/admin.js"
);


// ============================================================
// ROOT HOMEPAGE
// ============================================================

app.get("/", (req, res) => {

    const indexPath =
        path.join(
            FRONTEND_DIR,
            "index.html"
        );


    console.log(
        `[GHAR] Homepage: ${indexPath}`
    );


    if (
        fs.existsSync(indexPath) &&
        fs.statSync(indexPath).isFile()
    ) {

        return res.sendFile(
            indexPath
        );

    }


    return res.status(404).send(`

<!doctype html>

<html>

<head>

<meta charset="utf-8">

<meta
    name="viewport"
    content="width=device-width,initial-scale=1"
>

<title>GHAR - Frontend Error</title>

<style>

* {
    box-sizing:border-box;
}

body {

    margin:0;

    min-height:100vh;

    display:grid;

    place-items:center;

    padding:25px;

    font-family:Arial,sans-serif;

    background:
        linear-gradient(
            135deg,
            #08140f,
            #162d25,
            #213c31
        );

    color:#f7f0df;

}

.box {

    width:min(700px,100%);

    padding:45px;

    border-radius:25px;

    background:
        rgba(255,255,255,.07);

    border:
        1px solid
        rgba(255,255,255,.15);

    text-align:center;

}

h1 {

    margin:0 0 15px;

    font-size:42px;

}

p {

    line-height:1.7;

    opacity:.85;

}

code {

    display:block;

    margin-top:20px;

    padding:15px;

    background:
        rgba(0,0,0,.25);

    border-radius:10px;

    overflow:auto;

    text-align:left;

}

</style>

</head>

<body>

<div class="box">

<h1>GHAR Frontend Not Found</h1>

<p>
The server is running, but
<strong>index.html</strong>
could not be found.
</p>

<code>${FRONTEND_DIR}/index.html</code>

</div>

</body>

</html>

`);

});


// ============================================================
// API 404
// ============================================================

app.use((req, res, next) => {

    if (
        req.path === "/api" ||
        req.path.startsWith("/api/")
    ) {

        return res.status(404).json({

            ok: false,

            error: "API endpoint not found",

            path: req.path

        });

    }

    next();

});


// ============================================================
// FRONTEND 404
// ============================================================

app.use((req, res) => {

    res.status(404).send(`

<!doctype html>

<html lang="en">

<head>

<meta charset="utf-8">

<meta
    name="viewport"
    content="width=device-width,initial-scale=1"
>

<title>404 - GHAR</title>

<style>

* {
    box-sizing:border-box;
}

body {

    margin:0;

    min-height:100vh;

    display:grid;

    place-items:center;

    padding:24px;

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    background:
        linear-gradient(
            135deg,
            #08140f,
            #162d25,
            #213c31
        );

    color:#f7f0df;

}

.box {

    width:min(650px,100%);

    padding:50px 35px;

    border-radius:28px;

    text-align:center;

    background:
        rgba(255,255,255,.07);

    border:
        1px solid
        rgba(255,255,255,.16);

    backdrop-filter:
        blur(20px);

}

h1 {

    font-size:80px;

    margin:0;

}

h2 {

    font-size:30px;

    margin:10px 0 15px;

}

p {

    opacity:.8;

    line-height:1.6;

}

a {

    display:inline-block;

    margin-top:25px;

    padding:15px 25px;

    border-radius:13px;

    background:#d8b878;

    color:#162d25;

    text-decoration:none;

    font-weight:700;

}

</style>

</head>

<body>

<div class="box">

<h1>404</h1>

<h2>Page Not Found</h2>

<p>
The GHAR page you requested could not be found.
</p>

<a href="/">
Return to GHAR
</a>

</div>

</body>

</html>

`);

});


// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "[GHAR ERROR]",
            error
        );


        if (res.headersSent) {

            return next(error);

        }


        if (
            req.path === "/api" ||
            req.path.startsWith("/api/")
        ) {

            return res.status(500).json({

                ok:false,

                error:
                    "Internal server error",

                message:
                    NODE_ENV === "production"
                        ? "Something went wrong."
                        : error.message

            });

        }


        return res.status(500).send(
            "Internal server error."
        );

    }
);


// ============================================================
// START SERVER
// ============================================================

const server =
    app.listen(
        PORT,
        HOST,
        () => {

            console.log("");
            console.log(
                "=============================================="
            );

            console.log(
                "        GHAR SERVER STARTED"
            );

            console.log(
                "=============================================="
            );

            console.log(
                `URL       : http://${HOST}:${PORT}`
            );

            console.log(
                `Environment: ${NODE_ENV}`
            );

            console.log(
                `Frontend   : ${FRONTEND_DIR}`
            );

            console.log(
                `Homepage   : ${path.join(
                    FRONTEND_DIR,
                    "index.html"
                )}`
            );

            console.log(
                "=============================================="
            );

            console.log("");

        }
    );


// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

function shutdown(signal) {

    console.log(
        `[GHAR] ${signal} received.`
    );


    server.close(() => {

        console.log(
            "[GHAR] Server closed."
        );

        process.exit(0);

    });


    setTimeout(() => {

        console.error(
            "[GHAR] Forced shutdown."
        );

        process.exit(1);

    }, 10000);

}


process.on(
    "SIGTERM",
    () => shutdown("SIGTERM")
);

process.on(
    "SIGINT",
    () => shutdown("SIGINT")
);


// ============================================================
// PROCESS ERRORS
// ============================================================

process.on(
    "unhandledRejection",
    (reason) => {

        console.error(
            "[GHAR] Unhandled Promise Rejection:",
            reason
        );

    }
);


process.on(
    "uncaughtException",
    (error) => {

        console.error(
            "[GHAR] Uncaught Exception:",
            error
        );

    }
);