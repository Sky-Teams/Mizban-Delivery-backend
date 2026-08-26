import { LocationService } from '#shared/utils/locationService.js';

export const registerLocationEvents = (socket) => {
  socket.on('update_location', async (data) => {
    const driver = await LocationService.updateLocation(socket.userId, data);
    console.log(`Location updated requested for driver: ${driver._id}`);
  });
};
