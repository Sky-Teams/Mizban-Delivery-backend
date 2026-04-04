import 'dotenv/config';

import { agenda } from './config/agenda.js';

import { defineResetPasswordEmailJobs } from './jobs/email.job.js';

async function startWorker() {
  // Register the email job so agenda knows how to execute it
  await defineResetPasswordEmailJobs(agenda);

  // This event runs when a job --fails-- and is retried
  agenda.on('retry', (job, details) => {
    console.log(`Job ${job.attrs.name} retry # ${details.attempt}`); // retry attempt number
    console.log(`Next run ${details.nextRunAt}`); // when the job will run again
    console.log(`Delay ${details.delay}`); // waiting time before retry
    console.log(`Error ${details.error.message}`); // error that caused retry
  });

  // This event runs when the reset password email job --succeeds--
  agenda.on('success:send-reset-password-email', (job) => {
    const { email } = job.attrs.data;

    const startTime = job.attrs.lastRunAt;
    const endTime = new Date();

    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`Job ${job.attrs.name} finished in ${duration} seconds.`);
    console.log(`Email send successful to: ${email}`);
  });

  // Start the worker so it begins checking for jobs in MongoDB
  await agenda.start();
  console.log('Worker is running...');

  // Graceful shutdown:
  // if the process stops, finish current jobs before exiting
  const graceful = async () => {
    console.log('Stopping worker...');
    await agenda.stop(); // stop agenda safely
    process.exit(0); // exit process
  };

  // SIGTERM → used by servers or docker to stop the process
  process.on('SIGTERM', graceful);

  // SIGINT → triggered when we press Ctrl + C in the terminal
  process.on('SIGINT', graceful);
}

// Start the worker
startWorker().catch((err) => {
  console.error('Failed to start worker:', err);
});
