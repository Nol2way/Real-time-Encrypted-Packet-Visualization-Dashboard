import { EventEmitter } from 'events';
import { insertPacketBatch } from './database.js';

class PacketBatcher extends EventEmitter {
  constructor(batchIntervalMs = 500) {
    super();
    this.batchIntervalMs = batchIntervalMs;
    this.packetBuffer = [];
    this.interval = null;
    this.start();
  }

  addPacket(packet) {
    this.packetBuffer.push(packet);
  }

  start() {
    this.interval = setInterval(() => {
      this.flush();
    }, this.batchIntervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.flush();
  }

  flush() {
    if (this.packetBuffer.length === 0) return;

    const batch = [...this.packetBuffer];
    this.packetBuffer = [];

    // Persist to DB
    try {
      insertPacketBatch(batch);
    } catch (err) {
      console.error('Error inserting packet batch:', err);
    }

    // Emit event for socket broadcasting
    this.emit('batch', batch);
  }
}

export default new PacketBatcher();
