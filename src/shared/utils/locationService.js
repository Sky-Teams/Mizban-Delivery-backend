import { CustomSocket } from '#config/socket.js';
import { updateDriverLocation } from '#modules/locations/index.js';
import { SOCKET_EVENTS } from './enums.js';
import { NotificationService } from './notificationService.js';

export class LocationService {
  /**
   * Update driver's current location.
   * @param {string} userId
   * @param {object} data
   */
  static async updateLocation(userId, data) {
    try {
      /** TODO: Implement Redis caching in future */

      let driver = await updateDriverLocation(userId, data);

      /** TODO: Emit LOCATION_UPDATED event */
      return driver;
    } catch (error) {
      /** If a validation error occurs, notify the client and stop the update process */
      if (error.name === 'ZodError') {
        console.warn(`Validation error ${error.message}`);

        const payload = {
          code: 'VALIDATION_ERROR',
          message: error.message,
        };
        await NotificationService.send(
          'driver',
          SOCKET_EVENTS.DRIVER.LOCATION_ERROR,
          payload,
          userId,
          false
        );

        return;
      }

      /** If the driver is not found, notify the driver and stop the location update process */
      if (error.status === 404) {
        console.warn(error);

        const payload = {
          code: 'DRIVER_NOT_FOUND',
          message: error.message,
        };
        await NotificationService.send(
          'driver',
          SOCKET_EVENTS.DRIVER.LOCATION_ERROR,
          payload,
          userId,
          false
        );
        return;
      }

      /** For unexpected errors, notify admins and send a socket event to the driver */
      console.error('Error in Location Update:', error);
      const systemErrorPayload = NotificationPayloads.systemError(error.message);
      /** Send notification to admin */
      await NotificationService.send('admins', SOCKET_EVENTS.ADMIN.SYSTEM, systemErrorPayload);
      /** Send a socket event to user */
      await NotificationService.send(
        'driver',
        SOCKET_EVENTS.DRIVER.LOCATION_ERROR,
        {
          code: 'SYSTEM_ERROR',
          message: 'System error',
        },
        userId,
        false
      );

      return;
    }
  }
}
