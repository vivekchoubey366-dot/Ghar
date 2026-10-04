"use strict";

const { ok } = require("../utils/response");

async function list(req, res) {
  return ok(
    res,
    {
      resource: "message",
      items: [],
      query: req.query
    },
    "Messages retrieved"
  );
}

async function get(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      resource: "message"
    },
    "Message retrieved"
  );
}

async function create(req, res) {
  return ok(
    res,
    {
      ...req.body,
      resource: "message"
    },
    "Message created",
    201
  );
}

async function update(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      ...req.body,
      resource: "message"
    },
    "Message updated"
  );
}

async function remove(req, res) {
  return ok(
    res,
    {
      id: req.params.id,
      resource: "message"
    },
    "Message deleted"
  );
}

module.exports = {
  list,
  get,
  create,
  update,
  remove
};