import { getAllLogs, getLogById, getLogsStats } from '#modules/log/services/v1/log.service.js';
import { unauthorized } from '#shared/errors/error.js';

//Fetch All Logs
export const getLogs = async (req, res) => {
  if (!req.user) throw unauthorized();

  const { page, limit } = req.query;
  const searchQuery = {
    method: req.query?.method,
    date: req.query?.date,
    type: req.query?.type,
    sort: req.query?.sort,
  };

  const { count, currentPage, totalPages, paginatedLogs } = await getAllLogs(
    page,
    limit,
    searchQuery
  );

  res.status(200).json({
    success: true,
    count,
    currentPage,
    totalPages,
    data: paginatedLogs,
  });
};

//Get Log By Id
export const getLog = async (req, res) => {
  if (!req.user) throw unauthorized();

  const log = await getLogById(req.params.logId);

  res.status(200).json({
    success: true,
    data: log,
  });
};

//Get Log Stats
export const getLogStats = async (req, res) => {
  if (!req.user) throw unauthorized();

  const { type } = req.query;

  const { totalLogs, topRoutes, logType } = await getLogsStats(type);

  res.status(200).json({
    success: true,
    totalLogs,
    logType,
    data: { topRoutes },
  });
};
