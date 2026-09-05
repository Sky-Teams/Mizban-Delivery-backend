import { LocationService } from '#shared/utils/locationService.js';
import { SOCKET_EVENTS } from '#shared/utils/enums.js';

export const registerLocationEvents = (socket) => {
  socket.on(SOCKET_EVENTS.DRIVER.START_TRACKING, async (callback) => {
    /** Save location in DB */
    const result = await LocationService.startDriverTracking(socket.userId);
    callback(result);
  });

  socket.on(SOCKET_EVENTS.DRIVER.UPDATE_LOCATION, async (data) => {
    /** Update Driver Location To Redis and Send Driver Location to Admin */
    await LocationService.updateLocation(socket.userId, data);
  });

  socket.on(SOCKET_EVENTS.DRIVER.STOP_TRACKING, async () => {
    /** Save last location in DB and stop tracking */
    await LocationService.stopDriverTracking(socket.userId);
  });
};
