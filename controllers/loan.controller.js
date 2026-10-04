const { ok, fail } = require('../utils/response');

async function list(req,res) {
  return ok(res, { resource: 'loan', items: [], query: req.query }, 'List retrieved');
}
async function get(req,res) {
  return ok(res, { id: req.params.id, resource: 'loan' }, 'Resource retrieved');
}
async function create(req,res) {
  return ok(res, { ...req.body, resource: 'loan' }, 'Resource created', 201);
}
async function update(req,res) {
  return ok(res, { id: req.params.id, ...req.body, resource: 'loan' }, 'Resource updated');
}
async function remove(req,res) {
  return ok(res, { id: req.params.id, resource: 'loan' }, 'Resource deleted');
}
module.exports = { list, get, create, update, remove };
