import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../../../../../app.js'; // we use relative path,because #root is not working for importing from root
// import app from '#root/app.js'; // TODO: #root is not working for importing from root of project.
import { connectDB, disconnectDB, clearDB } from '../../../../config/memoryDB.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { UserModel } from '#modules/users/index.js';

describe('User API v1 Integration', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  describe('POST /api/v1/auth/register', () => {
    let res;
    it('should create new user return success response', async () => {
      const newUser = {
        name: 'test',
        email: 'test@gmail.com',
        phone: '0797123456',
        password: 'myPassword12',
      };

      res = await request(app).post('/api/v1/auth/register').send(newUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User registered successfully');

      const userInDB = await UserModel.findOne({ email: newUser.email });

      expect(userInDB).not.toBeNull();
      expect(userInDB.name).toBe('test');
      expect(userInDB.email).toBe('test@gmail.com');
    });

    it('should not allow duplicate email and return error', async () => {
      await UserModel.create({
        name: 'test',
        email: 'test@gmail.com',
        phone: '0093781234567',
        password: 'myPassword12',
      });
      const newUser = {
        name: 'test',
        email: 'test@gmail.com',
        phone: '0797123456',
        password: 'myPassword12',
      };

      res = await request(app).post('/api/v1/auth/register').send(newUser);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.DUPLICATE);
      expect(res.body.message).toBe('Email already exists');
    });

    it('Password not returned in response', async () => {
      const newUser = {
        name: 'test2',
        email: 'test2@gmail.com',
        phone: '0797123456',
        password: 'myPassword12',
      };

      res = await request(app).post('/api/v1/auth/register').send(newUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User registered successfully');

      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 400 if name is too short', async () => {
      const newUser = {
        name: 'ab',
        email: 'user@gmail.com',
        phone: '0700123456',
        password: 'password123',
      };
      const res = await request(app).post('/api/v1/auth/register').send(newUser);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.MIN_LENGTH_IS_3_CHARACTERS);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.field).toBe('name');
    });

    it('should return 400 if email is invalid', async () => {
      const newUser = {
        name: 'username',
        email: 'invalid-email',
        phone: '0700123456',
        password: 'password123',
      };
      const res = await request(app).post('/api/v1/auth/register').send(newUser);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_EMAIL);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.field).toBe('email');
    });
    it('should return 400 if phone number is invalid', async () => {
      const newUser = {
        name: 'username',
        email: 'email@gmail.com',
        phone:'12343',
        password: 'password123',
      };
      const res = await request(app).post('/api/v1/auth/register').send(newUser);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.INVALID_PHONE_NUMBER);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.field).toBe('phone');
    });

    it('should return 400 if password is too short', async () => {
      const newUser = {
        name: 'username',
        email: 'user@gmail.com',
        phone: '0700123456',
        password: '123',
      };
      const res = await request(app).post('/api/v1/auth/register').send(newUser);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ERROR_CODES.PASSWORD_MUST_BE_AT_LEAST_6_CHARACTERS);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.field).toBe('password');
    });

    it('should return an error if missing required field', async () => {
      const newUser = {
        email: 'test@gmail.com',
        name: 'test',
        phone: '0781234567',
      };

      res = await request(app).post('/api/v1/auth/register').send(newUser);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.field).toBe('password');
    });
  });
});
