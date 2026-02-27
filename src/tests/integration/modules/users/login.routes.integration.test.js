import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

const { findOne, compare, generateAccessToken } = vi.hoisted(() => ({
  findOne: vi.fn(),
  compare: vi.fn(),
  generateAccessToken: vi.fn(),
}));

vi.mock('#modules/users/models/user.model.js', () => ({
  UserModel: { findOne },
}));

vi.mock('bcryptjs', () => ({
  default: { compare },
}));

vi.mock('#shared/utils/jwt.js', () => ({
  generateAccessToken,
}));

import app from '../../../../app.js';

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid email format', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'invalid-email',
      password: '123456',
    });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe(ERROR_CODES.INVALID_EMAIL_FORMAT);
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.field).toBe('email');
  });

  it('returns 401 when user is not found', async () => {
    findOne.mockResolvedValue(null);

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'user@example.com',
      password: '123456',
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe(ERROR_CODES.INVALID_CREDENTIAL);
    expect(compare).not.toHaveBeenCalled();
  });

  it('returns 401 when password is invalid', async () => {
    findOne.mockResolvedValue({
      _id: 'u1',
      email: 'user@example.com',
      password: 'hashed-password',
      role: 'customer',
      isActive: true,
    });
    compare.mockResolvedValue(false);

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'user@example.com',
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe(ERROR_CODES.INVALID_CREDENTIAL);
  });

  it('returns 403 when account is disabled', async () => {
    findOne.mockResolvedValue({
      _id: 'u1',
      email: 'user@example.com',
      password: 'hashed-password',
      role: 'customer',
      isActive: false,
    });
    compare.mockResolvedValue(true);

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'user@example.com',
      password: '123456',
    });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(ERROR_CODES.ACCOUNT_DISABLED);
  });

  it('returns 200 and token for valid credentials', async () => {
    findOne.mockResolvedValue({
      _id: 'u1',
      email: 'user@example.com',
      password: 'hashed-password',
      role: 'customer',
      isActive: true,
    });
    compare.mockResolvedValue(true);
    generateAccessToken.mockReturnValue('token-123');

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'user@example.com',
      password: '123456',
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      id: 'u1',
      email: 'user@example.com',
      role: 'customer',
      token: 'token-123',
    });
  });
});
