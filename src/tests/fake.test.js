//This file is only for testing the CI workflow. We can remove it later

import { describe, it, expect } from 'vitest';

describe('Fake test for CI', () => {
  it('Sum', () => {
    const a = 2;
    const b = 2;
    const result = a + b;
    expect(result).toBe(4);
  });
});
