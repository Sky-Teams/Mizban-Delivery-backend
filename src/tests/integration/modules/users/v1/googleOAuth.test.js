import app from '../../../../../app.js';
import request from 'supertest';
import { connectDB, disconnectDB, clearDB } from '../../../../config/memoryDB.js';

import { UserModel } from '#modules/users/index.js';
import { verifyGoogleToken } from '#shared/utils/googleOAuth.js';

const baseURL = '/api/auth/google';

vi.mock('#shared/utils/googleOAuth.js', () => ({
  verifyGoogleToken: vi.fn(),
}));

describe('User API v1 Integration', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();
    vi.clearAllMocks();
  });

  describe('POST /api/auth/google', () => {
    let res;

    it('Should verify and create new User', async () => {
      const fakeGoogleUser = {
        sub: '123',
        name: 'test',
        email: 'test@example.com',
      };

      vi.mocked(verifyGoogleToken).mockResolvedValue(fakeGoogleUser);

      res = await request(app).post(baseURL).send({ id_token: 'valid-token', deviceId: 'postman' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@example.com');

      const user = await UserModel.findOne({ email: 'test@example.com' });
      expect(user).not.toBeNull();
    });

    it('Should return an error for invalid token', async () => {
      vi.mocked(verifyGoogleToken).mockResolvedValue(new Error('Invalid google token'));

      res = await request(app).post(baseURL).send({ token: 'invalid-token', deviceId: 'device1' });

      expect(res.status).toBe(401);
    });
  });
});
