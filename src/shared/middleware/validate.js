import { ERROR_CODES } from '../errors/customCodes.js';
import { AppError } from '../errors/error.js';

export const validate = (validatorFn) => (req, res, next) => {
  const result = validatorFn(req);

  if (!result.success) {
    const issue = result.error.issues[0];

    const field = issue.path.slice(1).join('.') || 'unknown';
    const errorCode = issue.message || ERROR_CODES.VALIDATION_ERROR;

    return next(new AppError('Validation failed', 400, errorCode, field));
  }

  //TODO We can add Sanitization in here in future
  // Only replace req.body with validated data if available.
  // This prevents one validator (e.g., params/id validator) from overwriting the actual body data.
  if (result.data.body) req.body = result.data.body;
  if (result.data.params) req.params = result.data.params;
  if (result.data.query) Object.assign(req.query, result.data.query);

  next();
};
