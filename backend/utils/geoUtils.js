function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearing(lat1, lon1, lat2, lon2) {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLambda = toRad(lon2 - lon1);
  const x = Math.sin(dLambda) * Math.cos(phi2);
  const y =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const theta = Math.atan2(x, y);
  let deg = ((toDeg(theta) % 360) + 360) % 360;
  return deg;
}

/**
 * Computes the minimum angular deviation between two bearings.
 * Always returns a value between 0 and 180 degrees.
 * E.g. bearingDeviation(350, 10) => 20, bearingDeviation(90, 270) => 180
 */
function bearingDeviation(b1, b2) {
  let diff = Math.abs(b1 - b2) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/**
 * Calculates the cross-track distance in km from a point to a great-circle path.
 * @param {number} lat1 - Start point latitude
 * @param {number} lon1 - Start point longitude
 * @param {number} lat2 - End point latitude
 * @param {number} lon2 - End point longitude
 * @param {number} pointLat - Target point latitude
 * @param {number} pointLon - Target point longitude
 */
function crossTrackDistance(lat1, lon1, lat2, lon2, pointLat, pointLon) {
  const R = 6371;
  const d13 = haversine(lat1, lon1, pointLat, pointLon);
  const brg12 = toRad(bearing(lat1, lon1, lat2, lon2));
  const brg13 = toRad(bearing(lat1, lon1, pointLat, pointLon));

  // d_xt = R * asin(sin(d13/R) * sin(brg13 - brg12))
  const d_xt = Math.abs(Math.asin(Math.sin(d13 / R) * Math.sin(brg13 - brg12)) * R);
  return d_xt;
}

module.exports = { haversine, bearing, bearingDeviation, crossTrackDistance };
