import { beforeEach, describe, expect, it } from 'vitest';
import { UserModel } from '#modules/users/index.js';
import { getUserProfile } from '#modules/users/index.js';

vi.mock('#modules/users/models/user.model.js', () => ({
  UserModel: {
    findById: vi.fn(),
  },
}));

describe('User Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe('getUserProfile', () => {
    it('Should return user info', async () => {
      const mockData = {
        _id: 'user1',
        name: 'driver',
        email: 'driver@example.com',
        phone: '0789123456',
      };
      UserModel.findById.mockResolvedValue(mockData);

      const result = await getUserProfile('user1');

      expect(result).toEqual(mockData);
      expect(UserModel.findById).toHaveBeenCalledWith('user1');
    });

    it('Should return an error is user not found', async () => {
      UserModel.findById.mockResolvedValue(null);

      await expect(getUserProfile('user1')).rejects.toThrow();
    });
  });
});
