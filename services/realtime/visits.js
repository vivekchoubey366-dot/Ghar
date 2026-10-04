const bus = require('./_event-bus');

function publish(data = {}) {
  if (!data || data.visitId === undefined) throw new Error('visitId is required');
  return bus.publish('visit.updated', data);
}

function subscribe(handler) {
  if (typeof handler !== 'function') throw new TypeError('handler must be a function');
  bus.on('visit.updated', handler);
  return () => bus.off('visit.updated', handler);
}

module.exports = { publish, subscribe, event: 'visit.updated' };
