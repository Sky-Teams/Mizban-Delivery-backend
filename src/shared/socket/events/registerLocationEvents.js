import { startLocationSync, stopLocationSync } from '../../../jobs/locationSync.js';
import { LocationService } from '#shared/utils/locationService.js';

export const registerLocationEvents = (socket) => {
  socket.on('start_tracking', async () => {
    const driver = await LocationService.startDriverTracking(socket.userId);

    /** Start Location Sync With Database */
    startLocationSync(driver._id);
  });

  socket.on('update_location', async (data) => {
    /** Update Driver Location To Redis and Send Driver Location to Admin */
    await LocationService.updateLocation(socket.userId, data);
  });

  socket.on('stop_tracking', async () => {
    const driver = await LocationService.stopDriverTracking(socket.userId);
    
    /** Stop Location Saving In Database */
    stopLocationSync(driver._id);
  });
};
