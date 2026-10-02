/* =========================================================
   GHAR -- TEST API CLIENT
   Location: tests/api/api.js
   ========================================================= */

"use strict";

const BASE_URL =
    process.env.GHAR_API_BASE_URL ||
    "http://localhost:5000/api";

async function request(path, options = {}) {
    const {
        method = "GET",
        body = null,
        headers = {}
    } = options;

    const config = {
        method,
        headers: {
            Accept: "application/json",
            ...headers
        }
    };

    if (body !== null && body !== undefined) {
        config.headers["Content-Type"] = "application/json";
        config.body = JSON.stringify(body);
    }

    const response = await fetch(
        `${BASE_URL}${path}`,
        config
    );

    const contentType =
        response.headers.get("content-type") || "";

    const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const message =
            data?.message ||
            data?.error ||
            `Request failed with status ${response.status}`;

        const error = new Error(message);

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}

const api = {
    baseURL: BASE_URL,

    request,

    get(path, options = {}) {
        return request(path, {
            ...options,
            method: "GET"
        });
    },

    post(path, body, options = {}) {
        return request(path, {
            ...options,
            method: "POST",
            body
        });
    },

    put(path, body, options = {}) {
        return request(path, {
            ...options,
            method: "PUT",
            body
        });
    },

    patch(path, body, options = {}) {
        return request(path, {
            ...options,
            method: "PATCH",
            body
        });
    },

    delete(path, options = {}) {
        return request(path, {
            ...options,
            method: "DELETE"
        });
    }
};

module.exports = api;