const { EventEmitter } = require('events');

class RealtimeBus extends EventEmitter {
  publish(event, payload = {}) {
    this.emit(event, { event, payload, timestamp: new Date().toISOString() });
    return { event, delivered: true };
  }
}
module.exports = new RealtimeBus();
