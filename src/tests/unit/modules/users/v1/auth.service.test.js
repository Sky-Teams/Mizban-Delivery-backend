import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { registerUser, doesUserExist } from '#modules/users/index.js';
import { UserModel } from '#modules/users/index.js';

vi.mock('#config/agenda.js', () => ({
  agenda: {
    now: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}));
vi.mock('#modules/users/models/user.model.js', () => ({
  UserModel: {
    exists: vi.fn(),
    create: vi.fn(),
  },
}));

describe('Auth Service ', () => {
  const userData = {
    email: 'test@gmail.com',
    name: 'test',
    phone: '1233456576',
    password: 'password123',
  };
  const fakeUser = { _id: '12', email: userData.email, name: userData.name };
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FRONTEND_URL = 'http://example.com';
  });

  describe('doesUserExist', () => {
    it('should return true if email exists in UserModel', async () => {
      UserModel.exists.mockResolvedValue(true);
      const result = await doesUserExist({ email: userData.email });

      expect(result).toBe(true);
    });

    it('should return false if email does not exists', async () => {
      UserModel.exists.mockResolvedValue(false);
      const result = await doesUserExist({ email: userData.email });

      expect(result).toBe(false);
    });
  });

  describe('registerUser', () => {
    it('bcrypt.hash is called with the correct password', async () => {
      bcrypt.hash.mockResolvedValue('hash_password');

      UserModel.create.mockResolvedValue({
        ...fakeUser,
        createToken: vi.fn(() => 'verify-token'),
        save: vi.fn().mockResolvedValue(true),
      });
      await registerUser(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });

    it('bcrypt.hash throws an error -> AppError is thrown', async () => {
      bcrypt.hash.mockRejectedValue(new Error('Hashing failed'));

      expect(UserModel.create).not.toHaveBeenCalled();
    });

    it('should throw an error if the database fails', async () => {
      bcrypt.hash.mockResolvedValue('hashed_password');

      UserModel.create.mockRejectedValue(new Error('Database connection failed'));

      await expect(registerUser(userData)).rejects.toThrow('Database connection failed');
    });

    it('should create a new user with hashed password', async () => {
      bcrypt.hash.mockResolvedValue('hashedPassword');

      UserModel.create.mockResolvedValue({
        ...fakeUser,
        createToken: vi.fn(() => 'verify-token'),
        save: vi.fn().mockResolvedValue(true),
      });

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
});
