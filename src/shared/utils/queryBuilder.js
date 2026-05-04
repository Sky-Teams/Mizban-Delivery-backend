import { hashPassword } from './jwt.js';
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

const mapNestedFields = (updateQuery, prefix, value, fields) => {
  fields.forEach((field) => {
    if (value?.[field] !== undefined) {
      updateQuery[`${prefix}.${field}`] = value[field];
    }
  });
};

export const orderUpdateQuery = (deliveryRequestData, allowedFields) => {
  const updateQuery = {};

  Object.entries(deliveryRequestData).forEach(([key, value]) => {
    if (!allowedFields[key]) return;

    switch (key) {
      case 'sender':
        mapNestedFields(updateQuery, 'sender', value, ['id', 'name', 'phone']);
        break;

      case 'receiver':
        mapNestedFields(updateQuery, 'receiver', value, ['id', 'name', 'phone', 'address']);
        break;

      case 'packageDetails':
        mapNestedFields(updateQuery, 'packageDetails', value, [
          'weight',
          'size',
          'fragile',
          'note',
        ]);
        break;

      case 'deliveryPrice':
        mapNestedFields(updateQuery, 'deliveryPrice', value, ['total']);
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

// A helper function to return $sum aggregate function based on the order and offer status and reduce the code repetition
export const countByStatus = (status) => ({
  $sum: {
    $cond: [{ $eq: ['$status', status] }, 1, 0],
  },
});
