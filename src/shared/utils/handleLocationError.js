import { SOCKET_EVENTS } from './enums.js';
import { buildErrorMessages } from './errorMessageBuilder.js';
import { NotificationPayloads } from './notificationPayloadBuilder.js';
import { NotificationService } from './notificationService.js';

export const handleLocationError = async (error, userId) => {
  /** If order not exists, notify to client and stop location update process */
  if (error.status === 400) {
    console.warn(error);

    const { messages } = buildErrorMessages(error.code);
    const payload = {
      code: 'TRACKING_NOT_AVAILABLE',
      message: error.message,
      messages,
    };

    await notifyDriver(userId, payload);

    return;
  }

  /** If a validation error occurs, notify the client and stop the update process */
  if (error.name === 'ZodError') {
    console.warn(`Validation error ${error.message}`);

    const { messages } = buildErrorMessages(error.code);
    const payload = {
      code: 'VALIDATION_ERROR',
      message: error.message,
      messages,
    };

    await notifyDriver(userId, payload);

    return;
  }

  /** If the driver is not found, notify the driver and stop the location update process */
  if (error.status === 404) {
    console.warn(error);

    const { messages } = buildErrorMessages(error.code);
    const payload = {
      code: 'NOT_FOUND',
      message: error.message,
      messages,
    };

    await notifyDriver(userId, payload);

    return;
  }

  /** For unexpected errors, notify admins and send a socket event to the driver */
  console.error('Error in Location Update:', error);
  const systemErrorPayload = NotificationPayloads.systemError(error.message);
  /** Send notification to admin */
  await NotificationService.send('admins', SOCKET_EVENTS.ADMIN.SYSTEM, systemErrorPayload);
  /** Send a socket event to user */
  const { messages } = buildErrorMessages(error.code);
  const payload = {
    code: 'SYSTEM_ERROR',
    message: 'System error',
    messages,
  };

  await notifyDriver(userId, payload);

  return;
};

const notifyDriver = async (userId, payload) => {
  await NotificationService.send(
    'driver',
    SOCKET_EVENTS.DRIVER.LOCATION_ERROR,
    payload,
    userId,
    false
  );
};
