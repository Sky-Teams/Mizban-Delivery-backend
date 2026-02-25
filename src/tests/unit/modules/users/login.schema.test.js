import { loginValidator } from '#modules/users/dto/login.schema.js';
import { ERROR_CODES } from '#shared/errors/customCodes.js';

describe('loginValidator', () => {
  it('passes for valid payload', () => {
    const req = {
      body: {
        email: 'user@example.com',
        password: 'test1234',
      },
    };

    const result = loginValidator(req);
    expect(result.success).toBe(true);
  });

  it('fails for Invalid email', () => {
    const req = {
      body: {
        email: 'user.com',
        password: 'test1234',
      },
    };

    const result = loginValidator(req);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe(ERROR_CODES.INVALID_EMAIL_FORMAT);
  });

  it('fails short passwords', () => {
    const req = {
      body: {
        email: 'test@example.com',
        password: 'test',
      },
    };

    const result = loginValidator(req);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe(ERROR_CODES.PASSWORD_TOO_SHORT);
  });

  it('fails for missing fields', () => {
    const req = { body: {} };
    const result = loginValidator(req);

    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe(ERROR_CODES.REQUIRED_FIELD);
  });
});
