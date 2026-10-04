"use strict";

const { ok } = require("../utils/response");

async function list(req, res) {
  return ok(
    res,
    {
      resource: "payment",
      items: [],
      query: req.query
    },
    "Payments retrieved"
  );
}

async function get(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      resource: "payment"
    },
    "Payment retrieved"
  );
}

async function create(req, res) {
  return ok(
    res,
    {
      ...req.body,
      resource: "payment"
    },
    "Payment created",
    201
  );
}

async function update(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      ...req.body,
      resource: "payment"
    },
    "Payment updated"
  );
}

async function remove(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      resource: "payment"
    },
    "Payment deleted"
  );
}

module.exports = {
  list,
  get,
  create,
  update,
  remove
};