import { beforeEach, describe, expect, it } from 'vitest';
import { UserModel } from '#modules/users/index.js';
import { getUserProfile, getProfile } from '#modules/users/index.js';

vi.mock('#modules/users/services/v1/user.service.js', () => ({
  getUserProfile: vi.fn(),
}));

describe('User Contoller', () => {
  let req, res;
  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { _id: 'user1' },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });
  describe('getProfile', () => {
    it('Should return user info', async () => {
      const mockData = {
        _id: 'user1',
        name: 'driver',
        email: 'driver@example.com',
        phone: '0789123456',
      };
      getUserProfile.mockResolvedValue(mockData);

      getProfile(req, res);
      const result = await getUserProfile('user1');

      expect(result).toEqual(mockData);
      expect(getUserProfile).toHaveBeenCalledWith('user1');
    });

    it('should throw unauthorized error if user is missing', async () => {
      req.user = null;

      await expect(getProfile(req, res)).rejects.toThrow();
    });
  });
});
