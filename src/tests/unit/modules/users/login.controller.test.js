import { describe, expect, it, vi } from 'vitest';

const { loginService } = vi.hoisted(() => ({
  loginService: vi.fn(),
}));

vi.mock('#modules/users/services/v1/auth.service.js', () => ({
  loginService,
}));

import { login } from '#modules/users/controllers/v1/auth.controller.js';

describe('login controller', () => {
  it('calls loginService with req.body', async () => {
    const req = {
      body: {
        email: 'user@example.com',
        password: '123456',
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    loginService.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      role: 'customer',
      token: 'token-123',
    });

    await login(req, res);

    expect(loginService).toHaveBeenCalledWith(req.body);
  });

  it('returns 200 with success response', async () => {
    const req = {
      body: {
        email: 'user@example.com',
        password: '123456',
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const serviceResult = {
      id: 'u1',
      email: 'user@example.com',
      role: 'customer',
      token: 'token-123',
    };

    loginService.mockResolvedValue(serviceResult);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: serviceResult,
    });
  });
});
