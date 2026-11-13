const EventEmitter = require('events');

class RealtimeEmitter extends EventEmitter {}
const realtimeEmitter = new RealtimeEmitter();

// Increase max listeners for many concurrent connected devices
realtimeEmitter.setMaxListeners(200);

// Notify all clients for a specific manager
const notifyManagerChange = (managerId, type, data = {}) => {
  if (!managerId) return;
  realtimeEmitter.emit(`change:${managerId.toString()}`, {
    type,
    data,
    timestamp: Date.now()
  });
};

module.exports = {
  realtimeEmitter,
  notifyManagerChange
};
