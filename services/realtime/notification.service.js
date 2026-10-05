const bus = require('./_event-bus');

function publish(data = {}) {
  if (!data || data.userId === undefined) throw new Error('userId is required');
  return bus.publish('notification.created', data);
}

function subscribe(handler) {
  if (typeof handler !== 'function') throw new TypeError('handler must be a function');
  bus.on('notification.created', handler);
  return () => bus.off('notification.created', handler);
}

module.exports = { publish, subscribe, event: 'notification.created' };
