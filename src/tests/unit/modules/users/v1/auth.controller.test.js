import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerUser, doesUserExist, authenticateWithGoogle } from '#modules/users/index.js';
import { register, googleLogin } from '#modules/users/index.js';
import { AppError } from '#shared/errors/error.js';

vi.mock('#modules/users/services/v1/auth.service.js', () => ({
  registerUser: vi.fn(),
  doesUserExist: vi.fn(),
  authenticateWithGoogle: vi.fn(),
}));

describe('Auth controller - register', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {
        email: 'user@gmail.com',
        name: 'username',
        phone: '13223123',
        password: 'password',
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw error if user already exists', async () => {
    doesUserExist.mockResolvedValue(true);

    await expect(register(req, res)).rejects.toThrow(AppError);

    expect(doesUserExist).toHaveBeenCalledWith({ email: req.body.email });
    expect(registerUser).not.toHaveBeenCalled();
  });

  it('should call registerUser and return success response', async () => {
    doesUserExist.mockResolvedValue(false);
    registerUser.mockResolvedValue({ id: '123', email: 'user@gmail.com' });

    await register(req, res);

    expect(doesUserExist).toHaveBeenCalledWith({ email: 'user@gmail.com' });
    expect(registerUser).toHaveBeenCalledWith(req.body);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'User registered successfully',
    });
  });

  it('Password not returned in response', async () => {
    doesUserExist.mockResolvedValue(false);
    registerUser.mockResolvedValue({
      id: '123',
      email: 'user@gmail.com',
      password: 'hashed_password',
    });

    await register(req, res);

    const responseCall = res.json.mock.calls[0][0];
    expect(responseCall).not.toHaveProperty('password');
  });
});

describe('Auth controller - googleLogin', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {
        id_token: 'google-token',
      },
      cookies: {
        deviceId: 'device-1',
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      cookie: vi.fn(),
    };
  });

  it('should return 200 with success response', async () => {
    const mockFakeUser = {
      id: 'user1',
      name: 'test',
      email: 'test@example.com',
      role: 'driver',
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
    };
    authenticateWithGoogle.mockResolvedValue(mockFakeUser);

    await googleLogin(req, res);
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token-123',
      expect.any(Object)
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        token: 'access-token-123',
        id: 'user1',
        email: 'test@example.com',
        role: 'driver',
      },
    });
  });
  it('should return an error if google token missing', async () => {
    req = {
      body: {},
      cookies: {
        deviceId: 'device-1',
      },
    };

    expect(googleLogin(req, res)).rejects.toThrow();
  });
});
