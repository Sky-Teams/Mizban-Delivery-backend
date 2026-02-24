import { describe, it, expect, beforeEach } from 'vitest';
import { registerUser } from '#modules/users/index.js';
import { register } from '#modules/users/index.js';

vi.mock('#modules/users/services/v1/auth.service.js', () => ({
  registerUser: vi.fn(),
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

  it('should call registerUser and return success response', async () => {
    await register(req, res);

    expect(registerUser).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'User register successfully',
    });
  });
});
