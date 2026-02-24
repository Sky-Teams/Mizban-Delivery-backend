import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { registerUser } from '#modules/users/index.js';
import { UserModel } from '#modules/users/index.js';
import { AppError } from '#shared/errors/error.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

vi.mock('bcryptjs');
vi.mock('#modules/users/models/user.model.js', () => ({
  UserModel: {
    exists: vi.fn(),
    create: vi.fn(),
  },
}));

describe('Auth Service - registerUser', () => {
  const userData = {
    email: 'test@gmail.com',
    name: 'test',
    phone: '1233456576',
    password: 'password123',
  };
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw an error if email already exists', async () => {
    UserModel.exists.mockResolvedValue(true);

    await expect(registerUser(userData)).rejects.toThrow(AppError);
    await expect(registerUser(userData)).rejects.toMatchObject({
      message: 'Email already exists',
      code: ERROR_CODES.DUPLICATE,
    });
  });

  it('should create a new user with hashed password', async () => {
    UserModel.exists.mockResolvedValue(false);
    bcrypt.hash.mockResolvedValue('hashedPassword');

    const fakeUser = {
      _id: '12',
      email: userData.email,
    };
    UserModel.create.mockResolvedValue(fakeUser);

    const result = await registerUser(userData);

    expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
    expect(UserModel.create).toHaveBeenCalledWith({
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      password: 'hashedPassword',
    });

    expect(result).toEqual({
      id: fakeUser._id,
      email: fakeUser.email,
    });
  });
});
