import { registerLocationEvents } from './events/registerLocationEvents.js';

export const registerSocketEvents = (socket, eventPublisher) => {
  registerLocationEvents(socket, eventPublisher);
};
