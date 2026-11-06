import { CustomSocket } from '#config/socket.js';
import { eventBus } from '#shared/event-bus/eventBus.js';
import { EVENT_BUS_EVENTS, SOCKET_EVENTS } from '#shared/utils/enums.js';
import { LocationService } from '#shared/utils/locationService.js';
import { RouteOptimizationService } from '#shared/utils/routeOptimizationService.js';

export const registerLocationListeners = () => {
  eventBus.on(EVENT_BUS_EVENTS.DRIVER_LOCATION_AVAILABLE, async (data) => {
    try {
      await RouteOptimizationService.optimizeRoute(data.driverId);
    } catch (error) {
      console.error('Failed to optimize active batch:', error);
    }
  });

  eventBus.on(EVENT_BUS_EVENTS.STOP_DRIVER_TRACKING, async (data) => {
    // Stop driver tracking
    await LocationService.stopDriverTracking(data.userId);

    // Send an emit to driver
    CustomSocket.emitToOnlineUser(data.userId, SOCKET_EVENTS.DRIVER.STOP_TRACKING, {
      message:
        'There are no remaining orders in your delivery batch, and location tracking has been stopped.',
    });
  });
};
