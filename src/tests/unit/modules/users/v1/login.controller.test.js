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
      cookies: {
        deviceId: 'device-1',
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      cookie: vi.fn(),
      json: vi.fn(),
    };

    loginService.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      role: 'driver',
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
    });

    await login(req, res);

    expect(loginService).toHaveBeenCalledWith(req.body, 'device-1');
  });

  it('returns 200 with success response', async () => {
    const req = {
      body: {
        email: 'user@example.com',
        password: '123456',
      },
      cookies: {
        deviceId: 'device-1',
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      cookie: vi.fn(),
      json: vi.fn(),
    };

    const serviceResult = {
      id: 'u1',
      email: 'user@example.com',
      role: 'driver',
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
    };

    loginService.mockResolvedValue(serviceResult);

    await login(req, res);

    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token-123',
      expect.any(Object)
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        accessToken: 'access-token-123',
        id: 'u1',
        email: 'user@example.com',
        role: 'driver',
      },
    });
  });
});
