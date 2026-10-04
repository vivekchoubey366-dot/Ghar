module.exports = {
  auth: require('./auth.routes'),
  users: require('./user.routes'),
  properties: require('./property.routes'),
  search: require('./search.routes'),
  visits: require('./visit.routes'),
  offers: require('./offer.routes'),
  applications: require('./application.routes'),
  documents: require('./document.routes'),
  verification: require('./verification.routes'),
  payments: require('./payment.routes')
};