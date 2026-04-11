import { toLogSummary } from '#shared/errors/customCodes.js';
import { notFound } from '#shared/errors/error.js';
import { getTopLogs, readLogs } from '#shared/logger/helper.log.js';

//Get All Logs
export const getAllLogs = async (page = 1, limit = 10, searchQuery = {}) => {
  const startIndex = (page - 1) * limit;
  const lastIndex = startIndex + limit;
  const { type, date, method, sort } = searchQuery;

  let result = await readLogs({
    type,
    specificDate: date,
  });

  if (method && typeof method === 'string') {
    result = result.filter((log) => log.method === method.toUpperCase());
  }
  if (sort === 'oldest') {
    result.sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  const summaryLogs = result.map(toLogSummary);

  const paginatedLogs = summaryLogs.slice(startIndex, lastIndex);
  return {
    count: result.length,
    totalPages: Math.ceil(result.length / limit),
    currentPage: page,
    paginatedLogs,
  };
};

//Get Log By Id
export const getLogById = async (logId, searchQuery = {}) => {
  const { date, type } = searchQuery;
  let log = await readLogs({ type, specificDate: date, logId });

  if (!log || log.length === 0) throw notFound('Log');

  return log;
};

//Get Logs Stats
export const getLogsStats = async (type) => {
  const logs = await readLogs({ type });

  const { totalLogs, topRoutes, logType } = await getTopLogs(logs);

  return {
    totalLogs,
    topRoutes,
    logType,
  };
};
