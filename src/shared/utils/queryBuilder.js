import { calculateItemsTotal } from './math.helper.js';

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

export const deliveryRequestUpdateQuery = (deliveryRequestData, allowedFields) => {
  const updateQuery = {};

  Object.keys(deliveryRequestData).forEach((key) => {
    if (!allowedFields[key]) return;

    const value = deliveryRequestData[key];

    switch (key) {
      case 'sender':
        if (!value) break;

        if (value.id !== undefined) updateQuery['sender.id'] = value.id;
        if (value.name !== undefined) updateQuery['sender.name'] = value.name;
        if (value.phone !== undefined) updateQuery['sender.phone'] = value.phone;
        break;

      case 'receiver':
        if (!value) break;

        if (value.id !== undefined) updateQuery['receiver.id'] = value.id;
        if (value.name !== undefined) updateQuery['receiver.name'] = value.name;
        if (value.phone !== undefined) updateQuery['receiver.phone'] = value.phone;
        if (value.address !== undefined) updateQuery['receiver.address'] = value.address;
        break;

      case 'packageDetails':
        if (!value) break;

        if (value.weight !== undefined) updateQuery['packageDetails.weight'] = value.weight;
        if (value.size !== undefined) updateQuery['packageDetails.size'] = value.size;
        if (value.fragile !== undefined) updateQuery['packageDetails.fragile'] = value.fragile;
        if (value.note !== undefined) updateQuery['packageDetails.note'] = value.note;
        break;

      case 'deliveryPrice':
        if (!value) break;
        if (value.total !== undefined) updateQuery['deliveryPrice.total'] = value.total;
        break;

      case 'items':
        if (Array.isArray(value)) {
          updateQuery.items = calculateItemsTotal(value);
        }
        break;

      case 'pickupLocation':
        if (value?.coordinates !== undefined) {
          updateQuery['pickupLocation.coordinates'] = value.coordinates;
        }
        break;

      case 'dropoffLocation':
        if (value?.coordinates !== undefined) {
          updateQuery['dropoffLocation.coordinates'] = value.coordinates;
        }
        break;

      default:
        updateQuery[key] = value;
    }
  });

  return updateQuery;
};
