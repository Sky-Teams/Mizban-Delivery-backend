export const buildPaginatedResponse = (data = [], total = 0, limit = 10) => {
  const totalPage = Math.ceil(total / limit);
  return {
    data,
    total,
    totalPage,
  };
};
