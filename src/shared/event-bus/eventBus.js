import EventEmitter from 'events';

class EventBus extends EventEmitter {} // We can configure our EventBus in future if needed.

export const eventBus = new EventBus();
