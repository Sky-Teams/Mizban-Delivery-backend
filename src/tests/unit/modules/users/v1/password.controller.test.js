import { describe, it, expect, beforeEach, vi } from 'vitest';
import { forgotPassword, resetPassword } from '#modules/users/controllers/v1/auth.controller.js';
import {
  forgotPasswordService,
  resetPasswordService,
} from '#modules/users/services/v1/auth.service.js';

vi.mock('#modules/users/services/v1/auth.service.js', () => ({
  registerUser: vi.fn(),
  doesUserExist: vi.fn(),
  loginService: vi.fn(),
  refreshService: vi.fn(),
  forgotPasswordService: vi.fn(),
  resetPasswordService: vi.fn(),
}));

describe('Auth controller - forgot/reset password', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      cookie: vi.fn(),
    };
  });

  it('forgotPassword should call forgotPasswordService and return success', async () => {
    req = { body: { email: 'user@example.com' } };
    forgotPasswordService.mockResolvedValue({ resetUrl: 'http://example.com/reset/token' });

    await forgotPassword(req, res);

    expect(forgotPasswordService).toHaveBeenCalledWith({ email: 'user@example.com' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Email sent' });
  });

  it('resetPassword should call resetPasswordService and return success', async () => {
    req = {
      params: { resetToken: 'token' },
      body: { newPassword: 'newpass123', confirmPassword: 'newpass123' },
    };
    resetPasswordService.mockResolvedValue(true);

    await resetPassword(req, res);

    expect(resetPasswordService).toHaveBeenCalledWith({
      resetToken: 'token',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Password updated successfully',
    });
  });
});

