const EARTH_RADIUS_METERS = 6_371_000;

const degreesToRadians = (degrees) => degrees * (Math.PI / 180); // changes from degrees 

export const calculateDistanceMeters = (pickupCoordinates, dropoffCoordinates) => {
  const [pickupLongitude, pickupLatitude] = pickupCoordinates;
  const [dropoffLongitude, dropoffLatitude] = dropoffCoordinates;

  const latitudeDifference = degreesToRadians(dropoffLatitude - pickupLatitude);
  const longitudeDifference = degreesToRadians(dropoffLongitude - pickupLongitude);

  // (half versed sin): used for having distance among two points on a surface like sphere 
  // like cirlces on earth => latitude and gratitute 
  const haversineValue = 
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(degreesToRadians(pickupLatitude)) *
      Math.cos(degreesToRadians(dropoffLatitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return EARTH_RADIUS_METERS * centralAngle;
};