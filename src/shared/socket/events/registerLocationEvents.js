import { LocationService } from '#shared/utils/locationService.js';

export const registerLocationEvents = (socket) => {
  socket.on('update_location', async (data) => {
    await LocationService.updateLocation(socket.userId, data);
  });
};
