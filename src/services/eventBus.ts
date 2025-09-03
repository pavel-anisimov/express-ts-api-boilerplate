import { EventEmitter } from 'node:events';

type BusEvent = { type: string; payload?: unknown; ts: string };
const emitter = new EventEmitter();
const lastEvents: BusEvent[] = [];

export const eventBus = {
  publish(type: string, payload?: unknown) {
    const ev: BusEvent = { type, payload, ts: new Date().toISOString() };

    lastEvents.push(ev); if (lastEvents.length > 50) lastEvents.shift();
    setTimeout(() => emitter.emit(type, ev), 0); // async kafka simulation

      return ev;
  },

  on(type: string, handler: (ev: BusEvent) => void) { emitter.on(type, handler); },
  recent() { return [...lastEvents]; },
};

