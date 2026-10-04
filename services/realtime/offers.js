const bus = require('./_event-bus');

function publish(data = {}) {
  if (!data || data.offerId === undefined) throw new Error('offerId is required');
  return bus.publish('offer.updated', data);
}

function subscribe(handler) {
  if (typeof handler !== 'function') throw new TypeError('handler must be a function');
  bus.on('offer.updated', handler);
  return () => bus.off('offer.updated', handler);
}

module.exports = { publish, subscribe, event: 'offer.updated' };
