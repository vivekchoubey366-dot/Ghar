"use strict";

const { ok } = require("../utils/response");

async function list(req, res) {
  return ok(
    res,
    {
      resource: "offer",
      items: [],
      query: req.query
    },
    "Offers retrieved"
  );
}

async function get(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      resource: "offer"
    },
    "Offer retrieved"
  );
}

async function create(req, res) {
  return ok(
    res,
    {
      ...req.body,
      resource: "offer"
    },
    "Offer created",
    201
  );
}

async function update(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      ...req.body,
      resource: "offer"
    },
    "Offer updated"
  );
}

async function remove(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      resource: "offer"
    },
    "Offer deleted"
  );
}

module.exports = {
  list,
  get,
  create,
  update,
  remove
};