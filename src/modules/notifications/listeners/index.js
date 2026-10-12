import { registerOfferListeners } from './offer.listeners.js';
import { registerOrderListeners } from './order.listeners.js';

export const registerNotificationListeners = () => {
  registerOrderListeners();
  registerOfferListeners();
};
