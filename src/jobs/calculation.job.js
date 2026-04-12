import { agenda } from '#config/agenda.js';
import { fetchDriverByUserId } from '#modules/drivers/index.js';
import { OfferModel } from '#modules/offers/index.js';

export async function defineCalculationJobs() {
  agenda.define('calculate-acceptance-rate', async (job) => {
    const { userId } = job.attrs.data;

    const driver = await fetchDriverByUserId(userId);
    if (!driver) return;

    // Instead of using two query to calculate the acceptance rate, we use aggregate function
    const result = await OfferModel.aggregate([
      {
        $match: {
          driver: driver._id,
          status: { $in: ['accepted', 'rejected', 'expired'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          accepted: {
            $sum: {
              $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0],
            },
          },
        },
      },
    ]);

    const total = result[0]?.total || 0;
    const accepted = result[0]?.accepted || 0;

    const acceptanceRate = total === 0 ? 0 : Number((accepted / total).toFixed(4));

    driver.acceptanceRate = acceptanceRate;
    await driver.save();
  });
}
