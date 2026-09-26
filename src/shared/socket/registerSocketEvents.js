import { registerLocationEvents } from './events/registerLocationEvents.js';

export const registerSocketEvents = (socket) => {
  registerLocationEvents(socket);
};
