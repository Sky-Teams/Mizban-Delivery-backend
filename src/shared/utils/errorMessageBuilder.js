import { ERROR_MESSAGES } from '../errors/errorMessages.js';

export const buildErrorMessages = (code) => {
  const messages = ERROR_MESSAGES[code];

  return {
    messages,
  };
};
