/* =========================================================
   GHAR -- AUTH API TESTS
   File: tests/api/auth.js
   ========================================================= */

"use strict";

const request = require("supertest");
const { app, pool } = require("../../server");

describe("GHAR Authentication API", () => {

    const testUser = {
        name: "GHAR Test User",
        email: `test-${Date.now()}@example.com`,
        password: "TestPassword123!",
        phone: "9999999999",
        role: "buyer"
    };

    let token;

    afterAll(async () => {
        try {
            await pool.query(
                "DELETE FROM users WHERE email = $1",
                [testUser.email]
            );
        } finally {
            await pool.end();
        }
    });

    // ---------------------------------------------------------
    // SIGNUP
    // ---------------------------------------------------------

    test("POST /api/auth/signup should create a user", async () => {

        const response = await request(app)
            .post("/api/auth/signup")
            .send(testUser);

        expect(response.statusCode).toBe(201);

        expect(response.body.success).toBe(true);

        expect(response.body.token).toBeDefined();

        expect(response.body.user).toBeDefined();

        expect(response.body.user.email)
            .toBe(testUser.email);

        token = response.body.token;
    });

    // ---------------------------------------------------------
    // DUPLICATE SIGNUP
    // ---------------------------------------------------------

    test("POST /api/auth/signup should reject duplicate email", async () => {

        const response = await request(app)
            .post("/api/auth/signup")
            .send(testUser);

        expect(response.statusCode).toBe(409);

        expect(response.body.success).toBe(false);
    });

    // ---------------------------------------------------------
    // INVALID SIGNUP
    // ---------------------------------------------------------

    test("POST /api/auth/signup should reject missing fields", async () => {

        const response = await request(app)
            .post("/api/auth/signup")
            .send({
                name: "Incomplete User"
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);
    });

    // ---------------------------------------------------------
    // SHORT PASSWORD
    // ---------------------------------------------------------

    test("POST /api/auth/signup should reject short password", async () => {

        const response = await request(app)
            .post("/api/auth/signup")
            .send({
                ...testUser,
                email: `short-${Date.now()}@example.com`,
                password: "123"
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);
    });

    // ---------------------------------------------------------
    // LOGIN
    // ---------------------------------------------------------

    test("POST /api/auth/login should authenticate the user", async () => {

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.token).toBeDefined();

        expect(response.body.user.email)
            .toBe(testUser.email);

        token = response.body.token;
    });

    // ---------------------------------------------------------
    // WRONG PASSWORD
    // ---------------------------------------------------------

    test("POST /api/auth/login should reject incorrect password", async () => {

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: "WrongPassword123!"
            });

        expect(response.statusCode).toBe(401);

        expect(response.body.success).toBe(false);
    });

    // ---------------------------------------------------------
    // UNKNOWN USER
    // ---------------------------------------------------------

    test("POST /api/auth/login should reject unknown email", async () => {

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "does-not-exist@example.com",
                password: "TestPassword123!"
            });

        expect(response.statusCode).toBe(401);

        expect(response.body.success).toBe(false);
    });

    // ---------------------------------------------------------
    // CURRENT USER
    // ---------------------------------------------------------

    test("GET /api/auth/me should return authenticated user", async () => {

        if (!token) {
            throw new Error(
                "Authentication token was not created"
            );
        }

        const response = await request(app)
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.user).toBeDefined();

        expect(response.body.user.email)
            .toBe(testUser.email);
    });

    // ---------------------------------------------------------
    // NO TOKEN
    // ---------------------------------------------------------

    test("GET /api/auth/me should reject unauthenticated request", async () => {

        const response = await request(app)
            .get("/api/auth/me");

        expect(response.statusCode).toBe(401);

        expect(response.body.success).toBe(false);
    });

    // ---------------------------------------------------------
    // INVALID TOKEN
    // ---------------------------------------------------------

    test("GET /api/auth/me should reject invalid token", async () => {

        const response = await request(app)
            .get("/api/auth/me")
            .set(
                "Authorization",
                "Bearer invalid-token"
            );

        expect(response.statusCode).toBe(401);

        expect(response.body.success).toBe(false);
    });

});