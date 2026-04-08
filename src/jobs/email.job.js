import { backoffStrategies } from 'agenda';
import { sendEmail } from '#shared/utils/email.js';

export const defineResetPasswordEmailJobs = async (agenda) => {
  agenda.define(
    'send-reset-password-email',
    async (job) => {
      const { email, username, resetUrl } = job.attrs.data;

      try {
        await sendEmail({
          to: email,
          subject: 'Reset password requested',
          username: username,
          resetUrl: resetUrl,
          template: 'reset_password',
        });
      } catch (error) {
        throw error;
      }
    },
    {
      backoff: backoffStrategies.exponential({
        delay: 1000,
        maxRetries: 4,
        factor: 2,
        jitter: 0.2,
      }),
      concurrency: 5,
      lockLimit: 5,
      lockLifetime: 30000,
      removeOnComplete: true,
    }
  );
};

export const defineEmailVerificationEmailJobs = async (agenda) => {
  agenda.define(
    'send-email-verification-token',
    async (job) => {
      const { email, username, verifyUrl } = job.attrs.data;

      try {
        await sendEmail({
          to: email,
          subject: 'Verify your email',
          username: username,
          verifyUrl: verifyUrl,
          template: 'verify_email',
        });
      } catch (error) {
        throw error;
      }
    },
    {
      backoff: backoffStrategies.exponential({
        delay: 1000,
        maxRetries: 4,
        factor: 2,
        jitter: 0.2,
      }),
      concurrency: 5,
      lockLimit: 5,
      lockLifetime: 30000,
      removeOnComplete: true,
    }
  );
};
