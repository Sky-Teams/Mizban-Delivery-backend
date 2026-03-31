import { OfferService } from '#shared/utils/offerService.js';
import { agenda } from '../config/agenda.js';
export async function defineOfferJobs() {
  agenda.define('offer:send', async (job) => {
    await OfferService.sendOfferToDriver(
      job.attrs.data.orderId,
      job.attrs.data.drivers,
      job.attrs.data.driverIndex
    );
  });

  agenda.define('offer:timeout', async (job) => {
    await OfferService.handleOfferTimeout(job.attrs.data);
  });
}
