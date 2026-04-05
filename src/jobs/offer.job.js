import { OfferService } from '#shared/utils/offerService.js';
import { agenda } from '../config/agenda.js';
export async function defineOfferJobs() {
  agenda.define('offer:timeout', async (job) => {
    await OfferService.handleOfferTimeout(job.attrs.data);
  });
}
