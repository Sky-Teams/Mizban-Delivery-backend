import { SENSITIVE_KEYS } from '#shared/errors/customCodes.js';

export const maskSensitiveFields = (obj, maxDepth = 5, depth = 0, maxFields = 5) => {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (depth > maxDepth) return '[TRUNCATED_DEPTH]';

  const isArray = Array.isArray(obj);
  let result = isArray ? [] : {};

  const keys = Object.keys(obj);
  const keyToProccess = keys.slice(0, maxFields);

  for (const key of keyToProccess) {
    let value = obj[key];

    if (!isArray && SENSITIVE_KEYS.includes(key)) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      result[key] = maskSensitiveFields(value, maxDepth, depth + 1, maxFields);
    } else {
      result[key] = value;
    }
  }
  if (keys.length > maxFields) {
    const message = `and ${keys.length - maxFields} more fields`;
    if (isArray) {
      result.push(`[${message}]`);
    } else {
      result['TRUNCATED'] = message;
    }
  }

  return result;
};
