const PLANS = {
  FREE: { code:'FREE', maxListings:1, aiRequestsPerDay:10 },
  BUYER_PLUS: { code:'BUYER_PLUS', maxListings:0, aiRequestsPerDay:100 },
  SELLER_PRO: { code:'SELLER_PRO', maxListings:25, aiRequestsPerDay:250 },
  AGENT_PRO: { code:'AGENT_PRO', maxListings:100, aiRequestsPerDay:500 },
  BUSINESS: { code:'BUSINESS', maxListings:1000, aiRequestsPerDay:5000 }
};

function getPlan(plan) { return PLANS[String(plan || 'FREE').toUpperCase()] || PLANS.FREE; }

function isActive(subscription = {}) {
  if (subscription.status !== 'active') return false;
  if (subscription.endAt && Date.now() >= new Date(subscription.endAt).getTime()) return false;
  return true;
}

function daysRemaining(subscription = {}) {
  if (!subscription.endAt) return Infinity;
  return Math.max(0, Math.ceil((new Date(subscription.endAt)-Date.now())/86400000));
}

module.exports = { PLANS, getPlan, isActive, daysRemaining };
