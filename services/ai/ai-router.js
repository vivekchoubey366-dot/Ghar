const { run } = require('./ai-service');
async function routeAI(moduleName, context = {}) {
  if (!moduleName) throw Object.assign(new Error('AI module is required'), {status:400});
  return run(String(moduleName).toLowerCase(), context);
}
module.exports = { routeAI };
