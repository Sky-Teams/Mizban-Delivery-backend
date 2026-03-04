import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isOwner, updateBusinessService, updateBusiness } from '#modules/businesses/index.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';

vi.mock('#modules/businesses/services/v1/business.service.js', () => ({
  isOwner: vi.fn(),
  updateBusinessService: vi.fn(),
}));

describe('Business Controller - updateBusiness', () => {
  let res;
  let req;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { _id: 'user1' },
      params: { id: 'businessId' },
      body: {
        name: 'new name',
        type: 'shop',
      },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should throw unauthorized if req.user is missing', async () => {
    req.user = null;

    await expect(updateBusiness(req, res)).rejects.toMatchObject({
      message: 'User is not authorized',
      code: ERROR_CODES.UNAUTHORIZED,
    });
  });

  it('should throw error if user is not the owner', async () => {
    isOwner.mockResolvedValue(false);

    await expect(updateBusiness(req, res)).rejects.toMatchObject({
      message: 'You donot have permission to update',
      code: ERROR_CODES.FORBIDDEN,
    });
  });

  it('should update successfully', async () => {
    const mockBusiness = {
      owner: 'user1',
      _id: 'businessId',
      name: 'new name',
      type: 'shop',
    };

    isOwner.mockResolvedValue(true);
    updateBusinessService.mockResolvedValue(mockBusiness);

    await updateBusiness(req, res);

    expect(isOwner).toHaveBeenCalledWith(req.user._id,req.params.id );
    expect(updateBusinessService).toHaveBeenCalledWith(req.user._id, req.params.id, req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockBusiness });
  });

  it('should propagate errors from updateBusinessService', async () => {
    const req = { user: { _id: 'user1' }, params: { id: '1' }, body: {} };
    isOwner.mockResolvedValue(true);
    const error = new AppError('No fields provided', 400, ERROR_CODES.NO_FIELDS_PROVIDED);
    updateBusinessService.mockRejectedValue(error);

    await expect(updateBusiness(req, res)).rejects.toBe(error);
    await expect(updateBusiness(req, res)).rejects.toMatchObject({
      message: 'No fields provided',
      code: ERROR_CODES.NO_FIELDS_PROVIDED,
    });
  });
});
