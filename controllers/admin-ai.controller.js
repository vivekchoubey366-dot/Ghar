const { ok } = require('../utils/response');
const { getAIRegistry, getAIUsage } = require('../services/ai/ai-service');
async function modules(req,res){ return ok(res, getAIRegistry(), 'AI modules retrieved'); }
async function usage(req,res){ return ok(res, getAIUsage(), 'AI usage retrieved'); }
module.exports = { modules, usage };
