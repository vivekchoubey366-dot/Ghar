const bus = require('./_event-bus');

function publish(data = {}) {
  if (!data || data.conversationId === undefined) throw new Error('conversationId is required');
  return bus.publish('message.created', data);
}

function subscribe(handler) {
  if (typeof handler !== 'function') throw new TypeError('handler must be a function');
  bus.on('message.created', handler);
  return () => bus.off('message.created', handler);
}

module.exports = { publish, subscribe, event: 'message.created' };
