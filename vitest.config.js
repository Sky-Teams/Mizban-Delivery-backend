import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '#root': path.resolve(__dirname),
      '#shared': path.resolve(__dirname, './src/shared'),
      '#modules': path.resolve(__dirname, './src/modules'),
      '#tests': path.resolve(__dirname, './src/tests'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.test.js'],
  },
});
