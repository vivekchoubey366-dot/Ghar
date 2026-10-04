"use strict";

const { ok } = require("../utils/response");

async function list(req, res) {
  return ok(
    res,
    {
      resource: "search",
      items: [],
      query: req.query
    },
    "Search results retrieved"
  );
}

async function get(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      resource: "search"
    },
    "Search result retrieved"
  );
}

async function create(req, res) {
  return ok(
    res,
    {
      ...req.body,
      resource: "search"
    },
    "Search created",
    201
  );
}

async function update(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      ...req.body,
      resource: "search"
    },
    "Search updated"
  );
}

async function remove(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      resource: "search"
    },
    "Search deleted"
  );
}

module.exports = {
  list,
  get,
  create,
  update,
  remove
};