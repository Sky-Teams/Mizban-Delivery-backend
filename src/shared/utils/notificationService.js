import { CustomSocket } from '#config/socket.js';
import { createNotificationForAdmins } from '#modules/notifications/index.js';

export class NotificationService {
  /**
   * Central notification sender
   * @param {string} to - admins, driver, user
   * @param {string} event
   * @param {Object} payload
   * @param {string|null} userId
   * @param {boolean} persist
   */
  static async send(to, event, payload, userId = null, persist = true) {
    switch (to) {
      case 'admins':
        CustomSocket.emitToAdmins(event, payload);

        if (persist) {
          await createNotificationForAdmins(payload.type, payload.title, payload.message);
        }
        break;

      case 'driver':
        if (!userId) {
          throw new Error('userId is required for driver/user notifications');
        }

        CustomSocket.emitToUser(userId, event, payload);

        if (persist) {
          // we can store notification in db in here if we need it in future
        }
        break;

      default:
        throw new Error(`Unknown notification target: ${to}`);
    }
  }
}
