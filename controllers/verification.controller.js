"use strict";

const { ok } = require("../utils/response");

async function list(req, res) {
  return ok(
    res,
    {
      resource: "verification",
      items: [],
      query: req.query
    },
    "Verification records retrieved"
  );
}

async function get(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      resource: "verification"
    },
    "Verification record retrieved"
  );
}

async function create(req, res) {
  return ok(
    res,
    {
      ...req.body,
      resource: "verification"
    },
    "Verification created",
    201
  );
}

async function update(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      ...req.body,
      resource: "verification"
    },
    "Verification updated"
  );
}

async function remove(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      resource: "verification"
    },
    "Verification deleted"
  );
}

module.exports = {
  list,
  get,
  create,
  update,
  remove
};