const { ok, fail } = require('../utils/response');
const { routeAI } = require('../services/ai/ai-router');

async function execute(req,res,next) {
  try {
    const moduleName = req.params.module || req.body.module || req.query.module;
    const result = await routeAI(moduleName, {
      user: req.user,
      body: req.body,
      query: req.query,
      params: req.params,
      requestId: req.id
    });
    return ok(res, result, 'AI request completed');
  } catch (err) { next(err); }
}
module.exports = { execute };
