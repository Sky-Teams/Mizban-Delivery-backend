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

// Used only for admin services
export const filterDriverField = (driverData) => {
  const driverAllowedFields = {
    vehicleType: true,
    status: true,
    capacity: true,
    currentLocation: true,
    lastLocationAt: true,
    vehicleRegistrationNumber: true,
    address: true,
    timeAvailability: true,
    isVerified: true,
  };

  const driverUpdateQuery = {};

  for (const key of Object.keys(driverAllowedFields)) {
    if (key in driverData && !['capacity', 'currentLocation', 'timeAvailability'].includes(key)) {
      driverUpdateQuery[key] = driverData[key];
    }
  }

  // Handle nested object for capacity
  if (driverData.capacity) {
    if (driverData.capacity.maxWeightKg !== undefined) {
      driverUpdateQuery['capacity.maxWeightKg'] = driverData.capacity.maxWeightKg;
    }

    if (driverData.capacity.maxPackages !== undefined) {
      driverUpdateQuery['capacity.maxPackages'] = driverData.capacity.maxPackages;
    }
  }

  // Handle currentLocation coordinates
  if (driverData.currentLocation?.coordinates !== undefined) {
    driverUpdateQuery['currentLocation.coordinates'] = driverData.currentLocation.coordinates;
  }

  if (driverData.timeAvailability) {
    if (driverData.timeAvailability.start !== undefined)
      driverUpdateQuery['timeAvailability.start'] = driverData.timeAvailability.start;
    if (driverData.timeAvailability.end !== undefined)
      driverUpdateQuery['timeAvailability.end'] = driverData.timeAvailability.end;
  }

  return driverUpdateQuery;
};

export const filterUserField = async (data) => {
  const userAllowedFields = {
    name: true,
    email: true,
    phone: true,
    password: true,
  };

  const userUpdateQuery = {};
  for (const key of Object.keys(userAllowedFields)) {
    if (key in data) {
      userUpdateQuery[key] = key === 'password' ? await hashPassword(data[key]) : data[key];
    }
  }
  return userUpdateQuery;
};
