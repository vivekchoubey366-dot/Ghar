"use strict";

const { ok } = require("../utils/response");

async function list(req, res) {
  return ok(
    res,
    {
      resource: "user",
      items: [],
      query: req.query
    },
    "Users retrieved"
  );
}

async function get(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      resource: "user"
    },
    "User retrieved"
  );
}

async function create(req, res) {
  return ok(
    res,
    {
      ...req.body,
      resource: "user"
    },
    "User created",
    201
  );
}

async function update(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      ...req.body,
      resource: "user"
    },
    "User updated"
  );
}

async function remove(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      resource: "user"
    },
    "User deleted"
  );
}

module.exports = {
  list,
  get,
  create,
  update,
  remove
};