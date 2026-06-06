import admin from '#config/firebaseAdmin.js';
import { removeFCMToken } from '#modules/users/index.js';

/**
 * Push notification with firebase FCM
 * @param {String} fcmToken
 * @param {String} title
 * @param {String} message
 * @param {String} userId - userId can be used to delete invalid fcmToken of a user
 */
export const pushNotification = async (fcmToken, title, message, userId) => {
  if (!fcmToken) return;

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title,
        body: message,
      },
    });
  } catch (err) {
    // These errors are from firebase which show the fcmToken is invalid so we remove them from the database.
    const firebaseInvalidTokenErrors = [
      'messaging/registration-token-not-registered',
      'messaging/invalid-registration-token',
    ];

    if (firebaseInvalidTokenErrors.includes(err.code)) await removeFCMToken(userId, fcmToken);
    console.error('FCM Error:', err.code, err.message);
  }
};
