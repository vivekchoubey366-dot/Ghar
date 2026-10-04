"use strict";

const { ok, fail } = require("../utils/response");

/**
 * ============================================================
 * GHAR USER CONTROLLER
 * ============================================================
 */

async function list(req, res) {
  try {
    return ok(
      res,
      {
        resource: "user",
        items: [],
        query: req.query
      },
      "Users retrieved"
    );
  } catch (error) {
    console.error("[GHAR] user.list error:", error);

    return fail(
      res,
      "USER_LIST_FAILED",
      "Unable to retrieve users.",
      500
    );
  }
}

async function get(req, res) {
  try {
    return ok(
      res,
      {
        resource: "user",
        id: req.params.id
      },
      "User retrieved"
    );
  } catch (error) {
    console.error("[GHAR] user.get error:", error);

    return fail(
      res,
      "USER_GET_FAILED",
      "Unable to retrieve user.",
      500
    );
  }
}

async function create(req, res) {
  try {
    return ok(
      res,
      {
        resource: "user",
        ...req.body
      },
      "User created",
      201
    );
  } catch (error) {
    console.error("[GHAR] user.create error:", error);

    return fail(
      res,
      "USER_CREATE_FAILED",
      "Unable to create user.",
      500
    );
  }
}

async function update(req, res) {
  try {
    return ok(
      res,
      {
        resource: "user",
        id: req.params.id,
        ...req.body
      },
      "User updated"
    );
  } catch (error) {
    console.error("[GHAR] user.update error:", error);

    return fail(
      res,
      "USER_UPDATE_FAILED",
      "Unable to update user.",
      500
    );
  }
}

async function remove(req, res) {
  try {
    return ok(
      res,
      {
        resource: "user",
        id: req.params.id
      },
      "User deleted"
    );
  } catch (error) {
    console.error("[GHAR] user.remove error:", error);

    return fail(
      res,
      "USER_DELETE_FAILED",
      "Unable to delete user.",
      500
    );
  }
}

/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {
  list,
  get,
  create,
  update,
  remove
};