/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if an event is within the specified radius from a given location
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param eventLat Event's latitude
 * @param eventLon Event's longitude
 * @param radiusKm Radius in kilometers (default: 100km)
 * @returns true if event is within radius, false otherwise
 */
export function isWithinRadius(
  userLat: number,
  userLon: number,
  eventLat: number,
  eventLon: number,
  radiusKm: number = 100
): boolean {
  const distance = calculateDistance(userLat, userLon, eventLat, eventLon);
  return distance <= radiusKm;
}
