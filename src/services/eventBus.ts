import { EventEmitter } from 'node:events';

/**
 * Event shape used by the local in-memory bus.
 */
type BusEvent = { type: string; payload?: unknown; ts: string };
const emitter = new EventEmitter();
const lastEvents: BusEvent[] = [];

/**
 * Lightweight in-memory event bus used by diagnostics and smoke tests.
 *
 * This is intentionally not a broker abstraction. It only simulates async
 * event publication while downstream Kafka or another real transport is not
 * wired into the gateway.
 */
export const eventBus = {
    /**
     * Publishes an event and stores it in the bounded recent-events buffer.
     */
    publish(type: string, payload?: unknown): BusEvent {
        const ev: BusEvent = { type, payload, ts: new Date().toISOString() };

        lastEvents.push(ev);

        if (lastEvents.length > 50) {
            lastEvents.shift();
        }

        // Emit asynchronously to approximate broker delivery timing.
        setTimeout(() => emitter.emit(type, ev), 0);

        return ev;
    },

    /**
     * Registers an event listener for a specific event type.
     */
    on(type: string, handler: (ev: BusEvent) => void) { emitter.on(type, handler); },

    /**
     * Returns a snapshot of recent events for diagnostics.
     */
    recent() { return [...lastEvents]; },
};
