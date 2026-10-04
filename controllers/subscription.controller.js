const { ok, fail } = require('../utils/response');

async function list(req,res) {
  return ok(res, { resource: 'subscription', items: [], query: req.query }, 'List retrieved');
}
async function get(req,res) {
  return ok(res, { id: req.params.id, resource: 'subscription' }, 'Resource retrieved');
}
async function create(req,res) {
  return ok(res, { ...req.body, resource: 'subscription' }, 'Resource created', 201);
}
async function update(req,res) {
  return ok(res, { id: req.params.id, ...req.body, resource: 'subscription' }, 'Resource updated');
}
async function remove(req,res) {
  return ok(res, { id: req.params.id, resource: 'subscription' }, 'Resource deleted');
}
module.exports = { list, get, create, update, remove };
