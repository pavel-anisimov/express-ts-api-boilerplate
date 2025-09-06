import { EventEmitter } from 'node:events';

type BusEvent = { type: string; payload?: unknown; ts: string };
const emitter = new EventEmitter();
const lastEvents: BusEvent[] = [];

/**
 * The eventBus object serves as a lightweight event handling system,
 * enabling the ability to publish and subscribe to events. It maintains a
 * record of the most recent events for retrieval.
 *
 * Properties:
 * - publish: Publishes an event with a specified type and optional payload.
 *            A timestamped event object is created and emitted asynchronously.
 *            The most recent events (up to a maximum of 50) are stored in memory.
 * - on: Subscribes to an event type and registers a handler that will be executed
 *       when an event of the specified type is emitted.
 * - recent: Retrieves a list of the most recent events that have been published.
 *
 * This object facilitates the management of event-driven communication by
 * providing publishing capabilities, listener subscription, and history access.
 */
export const eventBus = {
    /**
     * Publishes an event to the event emitter with a specified type and optional payload.
     * The event is also added to a temporary store of recent events, maintaining a maximum size.
     *
     * @param {string} type - The type of event being published.
     * @param {unknown} [payload] - Optional payload data associated with the event.
     * @return {BusEvent} The event object that was published, containing type, payload, and timestamp.
     */
    publish(type: string, payload?: unknown): BusEvent {
        const ev: BusEvent = { type, payload, ts: new Date().toISOString() };

        lastEvents.push(ev);

        if (lastEvents.length > 50) {
            lastEvents.shift();
        }
        setTimeout(() => emitter.emit(type, ev), 0); // async kafka simulation

        return ev;
    },

    /**
     * Registers an event listener for a specific event type.
     *
     * @param type The type of the event to listen for.
     * @param handler The callback function to execute when the event is triggered, receiving a BusEvent object as an argument.
     * @return void
     */
    on(type: string, handler: (ev: BusEvent) => void) { emitter.on(type, handler); },
    recent() { return [...lastEvents]; },
};

