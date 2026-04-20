import admin from '#config/firebaseAdmin.js';

/*
  * push notification with firebase FCM
 */
export const pushNotification = async (fcmToken, title, message) => {
  if (!fcmToken) return;

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title,
        body: message,
      }
    });

  } catch (err) {
    console.error("FCM Error:", err.message);
  }
};