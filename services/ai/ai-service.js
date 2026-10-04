const registry = {
  search: './ai-search',
  recommendations: './ai-recommendations',
  pricing: './ai-pricing',
  investment: './ai-investment',
  loans: './ai-loans',
  documents: './ai-documents',
  'property-content': './ai-property-content',
  rental: './ai-rental',
  moderation: './ai-moderation',
  fraud: './ai-fraud-detection',
  chat: './ai-chat'
};
function getAIRegistry(){ return Object.keys(registry); }
function getAIUsage(){ return { note:'Replace this in production with persistent AIUsage/AIRequest model queries.', modules:getAIRegistry() }; }
async function run(moduleName, context){
  const target=registry[moduleName];
  if(!target) throw Object.assign(new Error(`Unsupported AI module: ${moduleName}`),{status:400});
  return require(target).run(context);
}
module.exports={registry,getAIRegistry,getAIUsage,run};
