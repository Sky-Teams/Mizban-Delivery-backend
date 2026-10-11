import { eventBus } from '#shared/event-bus/eventBus.js';
import { EVENT_BUS_EVENTS } from '#shared/utils/enums.js';
import { RouteOptimizationService } from '#shared/utils/routeOptimizationService.js';

export const registerLocationListeners = () => {
  eventBus.on(EVENT_BUS_EVENTS.DRIVER_LOCATION_AVAILABLE, async (data) => {
    console.log('Driver location available', data.driverId);

    try {
      // Return the active batch if one exists; otherwise, activate the oldest pending batch.
      const activeBatch = await RouteOptimizationService.activateNextBatch(data.driverId);
      if (!activeBatch?.routeOrder?.length) {
        await RouteOptimizationService.optimizeActiveBatchIfNeeded(activeBatch);
      }
    } catch (error) {
      console.error('Failed to optimize active batch:', error);
    }
  });
};
