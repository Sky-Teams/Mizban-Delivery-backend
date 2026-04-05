import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerUser, doesUserExist } from '#modules/users/index.js';
import { register } from '#modules/users/index.js';
import { AppError } from '#shared/errors/error.js';

vi.mock('#modules/users/services/v1/auth.service.js', () => ({
  registerUser: vi.fn(),
  doesUserExist: vi.fn(),
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
