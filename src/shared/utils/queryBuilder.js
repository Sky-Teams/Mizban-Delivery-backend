export const driverQueryBuilder = (searchQuery) => {
  const query = {};
  if (searchQuery.vehicleType) query.vehicleType = searchQuery.vehicleType;
  if (searchQuery.status) query.status = searchQuery.status;

  // Only check if isVerified is true or false; ignore any other values
  if (searchQuery.isVerified === 'true') {
    query.isVerified = true;
  } else if (searchQuery.isVerified === 'false') {
    query.isVerified = false;
  }

  // Single search field "searchTerm" for name, email, phone
  if (searchQuery.searchTerm) {
    query['$or'] = [
      { 'user.name': { $regex: searchQuery.searchTerm, $options: 'i' } },
      { 'user.email': { $regex: searchQuery.searchTerm, $options: 'i' } },
      { 'user.phone': { $regex: searchQuery.searchTerm, $options: 'i' } },
    ];
  }

  return query;
};
