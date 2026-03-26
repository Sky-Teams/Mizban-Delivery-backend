import { describe, it, expect } from 'vitest';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { ERROR_MESSAGES } from '#shared/errors/errorMessages.js';

describe('Error Messages (PRO)', () => {
  const codes = Object.values(ERROR_CODES);
  const codeSet = new Set(codes);
  const messages = ERROR_MESSAGES;

  it('every ERROR_CODE must have a message', () => {
    codes.forEach((code) => {
      expect(messages[code], `Missing message for: ${code}`).toBeDefined();
    });
  });

  it('each message must include en, fa, ps', () => {
    Object.entries(messages).forEach(([code, msg]) => {
      expect(msg, `Missing message object for: ${code}`).toBeDefined();
      expect(msg.en, `Missing EN for: ${code}`).toBeDefined();
      expect(msg.fa, `Missing FA for: ${code}`).toBeDefined();
      expect(msg.ps, `Missing PS for: ${code}`).toBeDefined();
    });
  });

  it('should not contain messages not defined in ERROR_CODES', () => {
    Object.keys(messages).forEach((code) => {
      expect(codeSet.has(code), `Extra message not in ERROR_CODES: ${code}`).toBe(true);
    });
  });

  it('messages should not be empty', () => {
    Object.entries(messages).forEach(([code, msg]) => {
      Object.entries(msg).forEach(([lang, value]) => {
        expect(value?.trim(), `Empty ${lang} message for: ${code}`).toBeTruthy();
      });
    });
  });

  it('ERROR_CODES should have key === value pattern', () => {
    Object.entries(ERROR_CODES).forEach(([key, value]) => {
      expect(key, `Key and value mismatch: ${key} !== ${value}`).toBe(value);
    });
  });
});
