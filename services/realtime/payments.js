const bus = require('./_event-bus');

function publish(data = {}) {
  if (!data || data.paymentId === undefined) throw new Error('paymentId is required');
  return bus.publish('payment.updated', data);
}

function subscribe(handler) {
  if (typeof handler !== 'function') throw new TypeError('handler must be a function');
  bus.on('payment.updated', handler);
  return () => bus.off('payment.updated', handler);
}

module.exports = { publish, subscribe, event: 'payment.updated' };
