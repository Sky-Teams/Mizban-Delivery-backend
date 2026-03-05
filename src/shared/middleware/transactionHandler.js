import mongoose from 'mongoose';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';

/**
 * Wrap a service function that needs a MongoDB transaction.
 * Automatically starts a session, commits on success, aborts on error.
 */
export const withTransaction = (fn) => {
  return async (...args) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Pass the session as first argument to the wrapped function
      const result = await fn(session, ...args);

      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();

      // Optional: handle duplicate key error with custom field
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue || {})[0];
        // Send proper Error to the user with field that cause the duplicate
        throw new AppError('Duplicate value found', 400, ERROR_CODES.DUPLICATE, field);
      }

      throw error;
    } finally {
      session.endSession();
    }
  };
};
