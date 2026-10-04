"use strict";

const { ok, fail } = require("../utils/response");

async function list(req, res) {
  return ok(
    res,
    {
      resource: "property",
      items: [],
      query: req.query
    },
    "Properties retrieved"
  );
}

async function get(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      resource: "property"
    },
    "Property retrieved"
  );
}

async function create(req, res) {
  return ok(
    res,
    {
      ...req.body,
      resource: "property"
    },
    "Property created",
    201
  );
}

async function update(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      ...req.body,
      resource: "property"
    },
    "Property updated"
  );
}

async function remove(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      resource: "property"
    },
    "Property deleted"
  );
}

module.exports = {
  list,
  get,
  create,
  update,
  remove
};