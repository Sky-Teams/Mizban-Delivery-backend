import { describe, expect, it, vi } from 'vitest';
import { authorize, authorizeRole } from '#shared/middleware/authorizeRole.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

const runMiddleware = (middleware, req = {}) => {
  const next = vi.fn();
  middleware(req, {}, next);
  return next;
};

describe('authorize middleware', () => {
  it('allows an approved service', () => {
    const next = runMiddleware(authorize({ services: ['mizban'] }), {
      service: { name: 'mizban' },
    });

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects an unapproved service', () => {
    const next = runMiddleware(authorize({ services: ['mizban'] }), {
      service: { name: 'other-service' },
    });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 403, code: ERROR_CODES.FORBIDDEN })
    );
  });

  it('allows a user with an approved role', () => {
    const next = runMiddleware(authorizeRole('admin'), { user: { role: 'admin' } });

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a user with an unapproved role', () => {
    const next = runMiddleware(authorizeRole('admin'), { user: { role: 'driver' } });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 403, code: ERROR_CODES.FORBIDDEN })
    );
  });

  it('rejects a request without a user or service', () => {
    const next = runMiddleware(authorizeRole('admin'));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 403, code: ERROR_CODES.FORBIDDEN })
    );
  });
});
