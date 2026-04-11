import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import {
  registerUser,
  doesUserExist,
  createUserFromGoogle,
  authenticateWithGoogle,
  findOrCreateUser,
  generateTokens,
} from '#modules/users/index.js';
import { UserModel } from '#modules/users/index.js';
import { generateRandomPassword } from '#shared/utils/jwt.js';
import { verifyGoogleToken } from '#shared/utils/googleOAuth.js';
import { RefreshTokenModel } from '#modules/users/models/refreshToken.model.js';

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
    findOneAndUpdate: vi.fn(),
    findOne: vi.fn(),
    save: vi.fn(),
  },
}));

vi.mock('#modules/users/models/refreshToken.model.js', () => ({
  RefreshTokenModel: { findOneAndUpdate: vi.fn() },
}));

vi.mock('#shared/utils/jwt.js', () => ({
  generateRandomPassword: vi.fn(),
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  hashToken: vi.fn((t) => `hashed-${t}`),
  REFRESH_TOKEN_EXPIRES_TIME: 3600000,
}));
vi.mock('#shared/utils/googleOAuth.js', () => ({
  verifyGoogleToken: vi.fn(),
}));

vi.mock('google-auth-library', () => {
  const OAuth2Client = vi.fn();
  OAuth2Client.verifyIdToken = vi.fn();
  return { OAuth2Client };
});

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

  describe('createUserFromGoogle', () => {
    it('Should create a user with googleId', async () => {
      const fakeGoogleUser = { name: 'test', email: 'test@exmple.com', sub: '12' };
      generateRandomPassword.mockReturnValue('random-password');

      const fakeCreatedUser = {
        _id: 'user1',
        name: fakeGoogleUser.name,
        email: fakeGoogleUser.email,
        googleId: fakeGoogleUser.sub,
        password: 'random-password',
      };
      UserModel.create.mockResolvedValue(fakeCreatedUser);

      const result = await createUserFromGoogle(fakeGoogleUser);

      expect(UserModel.create).toHaveBeenCalledWith({
        email: fakeGoogleUser.email,
        name: fakeGoogleUser.name,
        googleId: fakeGoogleUser.sub,
        password: 'random-password',
      });

      expect(result).toEqual(fakeCreatedUser);
    });
  });

  describe('findOrCreateUser', () => {
    it('should return user if account already existed', async () => {
      const mockUser = { googleId: '123', email: 'test@example.com' };
      UserModel.findOne.mockResolvedValue(mockUser);

      const result = await findOrCreateUser({ sub: '123', email: 'test@examplecom' });

      expect(result.googleId).toBe('123');
      expect(UserModel.create).not.toHaveBeenCalled();
    });

    it('should update googleId if User already existed', async () => {
      const mockUser = { email: 'test@example.com', save: vi.fn() };
      UserModel.findOne.mockResolvedValue(mockUser);

      await findOrCreateUser({ sub: 'new_google_id', email: 'test@example.com' });

      expect(mockUser.googleId).toBe('new_google_id');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('generatTokens', () => {
    it('should return access and refresh token', async () => {
      const mockUser = { _id: 'user123' };
      RefreshTokenModel.findOneAndUpdate.mockResolvedValue({});

      const tokens = await generateTokens(mockUser, 'device_001');

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(RefreshTokenModel.findOneAndUpdate).toHaveBeenCalled();
    });
  });

  describe('authenticateWithGoogle', () => {
    it('should verify and create new user with access token ', async () => {
      vi.mocked(verifyGoogleToken).mockResolvedValue({
        sub: '123',
        email: 'test@example.com',
        name: 'Test',
      });

      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        role: 'driver',
        googleId: '123',
        save: vi.fn().mockResolvedValue(true),
      };

      UserModel.findOne.mockResolvedValue(mockUser);

      const result = await authenticateWithGoogle('valid-token', 'device-123');
      expect(result).toHaveProperty('id', '123');
      expect(result.email).toBe('test@example.com');
    });
  });
});
