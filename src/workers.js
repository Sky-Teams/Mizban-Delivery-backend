import 'dotenv/config';
import { agenda } from './config/agenda.js';
import { defineOfferJobs } from './jobs/offer.job.js';
import { connectDB } from '#config/db.js';

async function startWorker() {
  await connectDB();

  await defineOfferJobs(agenda);

  // Start the worker so it begins checking for jobs in MongoDB
  await agenda.start();
  console.log('Worker is running...');

  process.on('SIGTERM', graceful);
  process.on('SIGINT', graceful);
}

startWorker().catch((err) => {
  console.error('Failed to start worker:', err);
});
