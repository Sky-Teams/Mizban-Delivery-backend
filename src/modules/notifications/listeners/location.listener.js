import { eventBus } from '#shared/event-bus/eventBus.js';
import { EVENT_BUS_EVENTS } from '#shared/utils/enums.js';
import { RouteOptimizationService } from '#shared/utils/routeOptimizationService.js';

export const registerLocationListeners = () => {
  eventBus.on(EVENT_BUS_EVENTS.DRIVER_LOCATION_AVAILABLE, async (data) => {
    try {
      await RouteOptimizationService.optimizeRoute(data.driverId);
    } catch (error) {
      console.error('Failed to optimize active batch:', error);
    }
  });
};
