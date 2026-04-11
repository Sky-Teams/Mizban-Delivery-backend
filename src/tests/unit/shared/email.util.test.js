import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMailMock, createTransportMock } = vi.hoisted(() => {
  const sendMailMock = vi.fn().mockResolvedValue(true);
  const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }));
  return { sendMailMock, createTransportMock };
});

vi.mock('nodemailer', () => ({
  default: {
    createTransport: createTransportMock,
  },
}));

import { sendEmail } from '#shared/utils/email.js';

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.EMAIL_HOST = 'smtp.example.com';
    process.env.EMAIL_PORT = '587';
    process.env.EMAIL_USER = 'user';
    process.env.EMAIL_PASSWORD = 'pass';
    process.env.EMAIL_FROM = 'no-reply@example.com';
  });

  it('sends reset password email with reset link', async () => {
    await sendEmail({
      to: 'a@example.com',
      subject: 'Reset password requested',
      username: 'Alice',
      resetUrl: 'http://example.com/reset-password/abc',
      template: 'reset_password',
    });

    expect(createTransportMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(1);

    const mailArgs = sendMailMock.mock.calls[0][0];
    expect(mailArgs.subject).toBe('Reset password requested');
    expect(mailArgs.html).toContain('http://example.com/reset-password/abc');
    expect(mailArgs.html).toContain('Reset My Password');
  });

  it('sends verify email with verification link', async () => {
    await sendEmail({
      to: 'b@example.com',
      subject: 'Verify your email',
      username: 'Bob',
      verifyUrl: 'http://example.com/verify-email/xyz',
      template: 'verify_email',
    });

    expect(createTransportMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(1);

    const mailArgs = sendMailMock.mock.calls[0][0];
    expect(mailArgs.subject).toBe('Verify your email');
    expect(mailArgs.html).toContain('http://example.com/verify-email/xyz');
    expect(mailArgs.html).toContain('Verify My Email');
  });

  it('throws when verify_email template is missing verifyUrl', async () => {
    await expect(
      sendEmail({
        to: 'c@example.com',
        subject: 'Verify your email',
        username: 'Cat',
        template: 'verify_email',
      })
    ).rejects.toThrow('verifyUrl is required for verify_email template');
  });
});

