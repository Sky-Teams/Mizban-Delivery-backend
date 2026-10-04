import { registerOfferListeners } from './offer.listeners.js';
import { registerOrderListeners } from './order.listeners.js';
import { registerMizbanListeners } from './mizban.listeners.js';

export const registerNotificationListeners = () => {
  registerOrderListeners();
  registerOfferListeners();
  registerMizbanListeners();
};
