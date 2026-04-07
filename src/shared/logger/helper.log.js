import { SENSITIVE_KEYS } from '#shared/errors/customCodes.js';
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import readline from 'readline';
import utc from 'dayjs/plugin/utc.js';
dayjs.extend(utc);

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

//Read data from log files
export const readLogs = async ({ type = 'audit', specificDate, logId } = {}) => {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    const files = await fs.promises.readdir(logsDir);

    if (!files.length) return []; //Check files exist

    const targetFiles = files
      .filter((f) => f.endsWith('.log') && f.startsWith(type))
      .map((f) => {
        const [fileLevel, fileDateStr] = f.replace('.log', '').split('.');
        return { file: f, date: dayjs(fileDateStr) };
      })
      .sort((a, b) => a.date - b.date);

    let fileToRead;

    if (specificDate) {
      //Read file base date
      const targetDay = dayjs.utc(specificDate);
      fileToRead = targetFiles
        .filter((f) => f.date.isSame(targetDay) || f.date.isBefore(targetDay))
        .pop();
    } else {
      fileToRead = targetFiles.pop(); //Read last file
    }

    let results = [];

    if (fileToRead) {
      const filePath = path.join(logsDir, fileToRead.file);
      const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (!line.trim()) continue;
        const log = JSON.parse(line);
        const logTime = dayjs.utc(log.time);

        if (logId) {
          if (log.logId === logId) {
            results.push(log);
            break;
          }
          continue;
        }

        if (specificDate && !logTime.isSame(dayjs(specificDate).utc(), 'day')) continue;
        results.push(log);
      }
    }
    results.sort((a, b) => new Date(b.time) - new Date(a.time));
    return results;
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const getTopLogs = async (logs) => {
  let totalLogs = 0;
  let routeMap = {};
  let logType;
  for (const log of logs) {
    totalLogs++;
    const route = log.path || 'unknown';
    if (!routeMap[route]) {
      routeMap[route] = 0;
    }
    routeMap[route]++;
    logType = log.logType;
  }

  const topRoutes = Object.entries(routeMap)
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { totalLogs, topRoutes, logType };
};
