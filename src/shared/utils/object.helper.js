/**
 * Accept and object and return the values of that object as an array
 * @param {object} object
 * @returns Array
 */
export const getObjectValues = (object) => {
  const values = [];

  for (const value of Object.values(object)) {
    values.push(value);
  }

  return values;
};

export const cleanObject = (obj) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined));
};

export const deduplicateById = (orders = []) => {
  const map = new Map();

  for (const order of orders) {
    if (!order?._id) continue;

    map.set(order._id.toString(), order);
  }

  return Array.from(map.values());
};
