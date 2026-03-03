import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BusinessModel,
  isOwner,
  updateBusinessService,
  updateBusiness,
} from '#modules/businesses/index.js';

vi.mock('#modules/businesses/services/v1/business.service.js', () => ({
  isOwner: vi.fn(),
  updateBusinessService: vi.fn(),
}));

describe('Business controller - update business(patrial)', () => {
  let res, req;
  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      userId: { _id: 'user12' },
      params: { id: '1' },
      body: {
        name: 'Mizban',
        type: 'shop',
      },
    };

    res = {
      statu: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

//   it('should update successfuly', async () => {

//   });
});
