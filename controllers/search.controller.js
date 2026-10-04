"use strict";

const { ok } = require("../utils/response");

async function search(req, res) {
  return ok(
    res,
    {
      resource: "search",
      items: [],
      query: req.query
    },
    "Search completed"
  );
}

module.exports = {
  search
};