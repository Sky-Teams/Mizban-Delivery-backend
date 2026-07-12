import { fetchDriverByUserId } from '#modules/drivers/index.js';
import { updateDriverLocation } from '#modules/locations/index.js';
import { DriverModel } from '#modules/drivers/models/driver.model.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('#modules/drivers/models/driver.model.js', () => ({
  DriverModel: {
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('#modules/drivers/index.js', () => ({
  fetchDriverByUserId: vi.fn(),
}));

describe('Driver Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Update driver location', () => {
    it('should update driver location', async () => {
      const mockDriver = {
        id: '1',
        userId: '123',
        currentLocation: {
          type: 'Point',
          coordinates: [32.2, 64.0],
        },
      };

      fetchDriverByUserId.mockResolvedValue(mockDriver);
      DriverModel.findOneAndUpdate.mockResolvedValue(mockDriver);

      const result = await updateDriverLocation('123', {
        currentLocation: {
          type: 'Point',
          coordinates: [32.2, 64.0],
        },
      });

      expect(fetchDriverByUserId).toHaveBeenCalledWith('123');
      expect(DriverModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          user: '123',
          _id: '1',
        },
        {
          $set: {
            currentLocation: {
              type: 'Point',
              coordinates: [32.2, 64.0],
            },
            lastLocationAt: expect.any(Date),
          },
        },
        { new: true, runValidators: true }
      );

      expect(result).toEqual(mockDriver);
    });

    it('should throw an error if driver does not exist', async () => {
      fetchDriverByUserId.mockRejectedValue(new Error('Driver not found'));

      await expect(
        updateDriverLocation('123', {
          currentLocation: { type: 'Point', coordinate: [32.2, 64.2] },
        })
      ).rejects.toThrow('Driver not found');

      expect(DriverModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });
});
