import { ERROR_CODES } from '../errors/customCodes.js';
import { buildErrorMessages } from '../utils/errorMessageBuilder.js';

const VALIDATION_ERROR = 'ValidationError'; // Error throw by the mongodb

export const errorHandler = (err, req, res, next) => {
  console.warn(err);

  if (err.isOperational) {
    const { messages } = buildErrorMessages(err.code);

    return res.status(err.status).json({
      code: err.code,
      message: err.message, // This message help us in debugging
      messages, // These are only for UI.
      field: err.field,
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const { messages } = buildErrorMessages(ERROR_CODES.INVALID_JWT);

    return res.status(401).json({
      code: ERROR_CODES.INVALID_JWT,
      message: 'Invalid or expired token',
      messages,
    });
  }

  if (err.code === 11000) {
    const { messages } = buildErrorMessages(ERROR_CODES.DUPLICATE);

    return res.status(400).json({
      code: ERROR_CODES.DUPLICATE,
      messages,
    });
  }

  if (err.name === VALIDATION_ERROR) {
    const { messages } = buildErrorMessages(ERROR_CODES.VALIDATION_ERROR);

    return res.status(400).json({
      code: ERROR_CODES.VALIDATION_ERROR,
      error: err.message,
      messages,
    });
  }

  const { messages } = buildErrorMessages(ERROR_CODES.SERVER_ERROR);

  return res.status(500).json({
    code: ERROR_CODES.SERVER_ERROR,
    message: 'Server error',
    messages,
  });
};
