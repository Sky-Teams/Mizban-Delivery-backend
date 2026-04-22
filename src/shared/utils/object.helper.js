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
