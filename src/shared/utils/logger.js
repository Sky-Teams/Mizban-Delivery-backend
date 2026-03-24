import pino from 'pino';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');

//create a transport
const transports = pino.transport({
  targets: [
    {
      target: 'pino-roll',
      options: {
        targetLevel: 'info',
        file: path.join(logsDir, 'application_info'),
        frequency: 10000,
        limit: { count: 3, size: '30mb' },
        extension: '.log',
        mkdir: true,
      },
    },
    {
      target: 'pino-roll',
      options: {
        targetLevel: 'warn',
        file: path.join(logsDir, 'application_warn'),
        frequency: 10000,
        limit: { count: 3, size: '30mb' },
        extension: '.log',
        mkdir: true,
      },
    },
    {
      target: 'pino-roll',
      options: {
        targetLevel: 'error',
        file: path.join(logsDir, 'application_error'),
        frequency: 10000,
        limit: { count: 3, size: '30mb' },
        extension: '.log',
        mkdir: true,
      },
    },
    {
      target: 'pino-roll',
      options: {
        targetLevel: 'fatal',
        file: path.join(logsDir, 'exceptions_error'),
        frequency: 10000,
        limit: { count: 3, size: '30mb' },
        extension: '.log',
        mkdir: true,
      },
    },
  ],
});

//create a logger instance
export const logger = pino(
  {
    level: 'info',
    redact: {
      paths: [
        '*.password',
        '*.token',
        '*.authorization',
        '*.cookie',
        '*.refreshToken',
        '*.accessToken',
      ], //We can add more sensitive fields here
      placeholder: '[REDACTED]',
      remove: false,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transports
);
