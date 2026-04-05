import { SENSITIVE_KEYS } from '#shared/errors/customCodes.js';
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween.js';
import readline from 'readline';
dayjs.extend(isBetween);

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

export const readLogs = async (type, startOfWeek, endOfWeek) => {
  const logsDir = path.join(process.cwd(), 'logs');
  const files = await fs.promises.readdir(logsDir);

  const start = dayjs(startOfWeek);
  const end = dayjs(endOfWeek);
  const targetFiles = files.filter((file) => {
    const clean = file.replace('.log', '');
    const part = clean.split('.');
    const fileLevel = part[0];
    const fileDateStr = part[1];

    const fileDate = dayjs(fileDateStr);
    if (!fileDate.isValid()) return false;

    return type
      ? fileLevel === type
      : fileLevel === 'application' &&
          (fileDate.isAfter(start) || fileDate.isSame(start)) &&
          (fileDate.isBefore(end) || fileDate.isSame(end));
  });

  let results = [];

  for (const file of targetFiles) {
    const filePath = path.join(logsDir, file);

    const stream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      const log = JSON.parse(line);

      results.push(log);
    }
  }

  return results;
};
