import pino from 'pino';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');

//create a transport
const transports = pino.transport({
  targets: [
    {
      target: './levelFilterTransport.js',
      options: {
        targetLevel: 'info',
        logType: 'ACCESS',
        file: path.join(logsDir, 'application'),
        frequency: 604800000, //weekly
        dateFormat: 'yyyy-MM-dd',
        limit: { count: 4, size: '30mb' },
        extension: '.log',
        mkdir: true,
      },
    },
    {
      target: './levelFilterTransport.js',
      options: {
        targetLevel: 'error',
        logType: 'ERROR',
        file: path.join(logsDir, 'error'),
        frequency: 604800000, //weekly
        dateFormat: 'yyyy-MM-dd',
        limit: { count: 4, size: '30mb' },
        extension: '.log',
        mkdir: true,
      },
    },
    {
      target: './levelFilterTransport.js',
      options: {
        targetLevel: 'fatal',
        logType: 'FATAL',
        file: path.join(logsDir, 'exceptions'),
        frequency: 604800000, //weekly
        dateFormat: 'yyyy-MM-dd',
        limit: { count: 4, size: '30mb' },
        extension: '.log',
        mkdir: true,
      },
    },
    {
      target: './levelFilterTransport.js',
      options: {
        targetLevel: 'info',
        logType: 'AUDIT',
        file: path.join(logsDir, 'audit-Logs'),
        frequency: 604800000, //weekly
        dateFormat: 'yyyy-MM-dd',
        limit: { count: 4, size: '30mb' },
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
