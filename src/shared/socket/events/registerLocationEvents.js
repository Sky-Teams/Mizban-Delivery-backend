import { startLocationSync, stopLocationSync } from '../../../jobs/locationSync.js';
import { LocationService } from '#shared/utils/locationService.js';
import { SOCKET_EVENTS } from '#shared/utils/enums.js';

export const registerLocationEvents = (socket) => {
  socket.on(SOCKET_EVENTS.DRIVER.START_TRACKING, async () => {
    const driver = await LocationService.startDriverTracking(socket.userId);

    /** Start Location Sync With Database */
    startLocationSync(driver._id);
  });

  socket.on(SOCKET_EVENTS.DRIVER.UPDATE_LOCATION, async (data) => {
    /** Update Driver Location To Redis and Send Driver Location to Admin */
    await LocationService.updateLocation(socket.userId, data);
  });

  socket.on(SOCKET_EVENTS.DRIVER.STOP_TRACKING, async () => {
    const driver = await LocationService.stopDriverTracking(socket.userId);

    /** Stop Location Saving In Database */
    stopLocationSync(driver._id);
  });
};
