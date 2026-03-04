import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '#shared/errors/error.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

// Create mocked versions of external dependencies
// These replace real DB calls, password compare, and token generation
const { findOne, compare, generateAccessToken } = vi.hoisted(() => ({
  findOne: vi.fn(), // mock for UserModel.findOne
  compare: vi.fn(), // mock for bcrypt.compare
  generateAccessToken: vi.fn(), // mock for JWT generator
}));

// Replace real UserModel with mocked version
vi.mock('#modules/users/models/user.model.js', () => ({
  UserModel: { findOne },
}));

// Replace real bcrypt with mocked compare function
vi.mock('bcryptjs', () => ({
  default: { compare },
}));

// Replace real JWT util with mocked generator
vi.mock('#shared/utils/jwt.js', () => ({
  generateAccessToken,
}));

// Import the service AFTER mocks (important)
import { loginService } from '#modules/users/services/v1/auth.service.js';

describe('loginService', () => {
  // Clear all mock calls before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws INVALID_CREDENTIAL when user not found', async () => {
    // Simulate: user not found in database
    findOne.mockResolvedValue(null);

    // Expect service to reject with 401
    await expect(loginService({ email: 'x@test.com', password: '123456' })).rejects.toMatchObject({
      status: 401,
      code: ERROR_CODES.INVALID_CREDENTIAL,
    });

    // Password comparison should NOT run if user doesn't exist
    expect(compare).not.toHaveBeenCalled();
  });

  it('throws INVALID_CREDENTIAL when password mismatch', async () => {
    // Simulate: user exists
    findOne.mockResolvedValue({
      _id: 'u1',
      email: 'x@test.com',
      password: 'hashed',
      role: 'customer',
      isActive: true,
    });

    // Simulate: wrong password
    compare.mockResolvedValue(false);

    // Expect AppError
    await expect(
      loginService({ email: 'x@test.com', password: 'wrongpass' })
    ).rejects.toBeInstanceOf(AppError);

    // Expect 401 invalid credential
    await expect(
      loginService({ email: 'x@test.com', password: 'wrongpass' })
    ).rejects.toMatchObject({
      status: 401,
      code: ERROR_CODES.INVALID_CREDENTIAL,
    });
  });

  it('throws ACCOUNT_DISABLED for inactive user', async () => {
    // Simulate: user exists but account is disabled
    findOne.mockResolvedValue({
      _id: 'u1',
      email: 'x@test.com',
      password: 'hashed',
      role: 'customer',
      isActive: false,
    });

    // Password is correct
    compare.mockResolvedValue(true);

    // Expect 403 forbidden
    await expect(loginService({ email: 'x@test.com', password: '123456' })).rejects.toMatchObject({
      status: 403,
      code: ERROR_CODES.ACCOUNT_DISABLED,
    });
  });

  it('returns safe user payload with token on success', async () => {
    const user = {
      _id: 'u1',
      email: 'x@test.com',
      password: 'hashed',
      role: 'customer',
      isActive: true,
    };

    // Simulate successful login flow
    findOne.mockResolvedValue(user);
    compare.mockResolvedValue(true);
    generateAccessToken.mockReturnValue('token-123');

    const result = await loginService({
      email: 'x@test.com',
      password: '123456',
    });

    // Service should return safe user data (no password!)
    expect(result).toEqual({
      id: 'u1',
      email: 'x@test.com',
      role: 'customer',
      token: 'token-123',
    });
  });
});
