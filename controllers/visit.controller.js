"use strict";

const { ok } = require("../utils/response");

async function list(req, res) {
  return ok(
    res,
    {
      resource: "visit",
      items: [],
      query: req.query
    },
    "Visits retrieved"
  );
}

async function get(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      resource: "visit"
    },
    "Visit retrieved"
  );
}

async function create(req, res) {
  return ok(
    res,
    {
      ...req.body,
      resource: "visit"
    },
    "Visit created",
    201
  );
}

async function update(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      ...req.body,
      resource: "visit"
    },
    "Visit updated"
  );
}

async function remove(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      resource: "visit"
    },
    "Visit deleted"
  );
}

module.exports = {
  list,
  get,
  create,
  update,
  remove
};