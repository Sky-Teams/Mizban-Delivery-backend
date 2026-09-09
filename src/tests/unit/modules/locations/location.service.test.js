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
        id: '123',
        currentLocation: {
          type: 'Point',
          coordinates: [64.0, 32.2],
        },
      };

      DriverModel.findOneAndUpdate.mockReturnValue(mockDriver);

      const result = await updateDriverLocation('123', {
        currentLocation: {
          type: 'Point',
          coordinates: [32.2, 64.0],
        },
      });

      expect(DriverModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: '123',
        },
        {
          $set: {
            currentLocation: {
              type: 'Point',
              coordinates: [64.0, 32.2],
            },
            lastLocationAt: expect.any(Date),
          },
        },
        { returnDocument: 'after', runValidators: true }
      );

      expect(result).toEqual(mockDriver);
    });
  });
});
