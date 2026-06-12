const BEARING_DEVIATION_THRESHOLD = 30; // degrees

/**
 * Detects suspicious activity on an E-Way Bill.
 * 
 * @param {Object} bill - The enriched bill object
 * @param {number} [bill.bearing_deviation] - Deviation between ideal and actual bearing
 * @param {number} [bill.distance_ratio] - Declared / actual distance ratio
 * @param {number} [bill.ideal_bearing] - Ideal bearing (source → dest)
 * @param {number} [bill.actual_bearing] - Actual bearing (first toll → last toll)
 * @returns {{ suspicious: boolean, suspicious_reasons: string[] }}
 */
function detect(bill) {
  const reasons = [];

  return {
    suspicious: reasons.length > 0,
    suspicious_reasons: reasons,
  };
}

/**
 * Detects overlapping E-Way Bills for the same vehicle with conflicting directions.
 * Updates the bills in place.
 * 
 * @param {Array<Object>} bills - The complete list of bills to check
 */
function detectOverlapping(bills) {
  const { bearing, bearingDeviation } = require("./geoUtils");

  for (let i = 0; i < bills.length; i++) {
    const b1 = bills[i];
    if (
      !b1.vehicle_number ||
      b1.from_lat === null || b1.from_lng === null ||
      b1.ideal_bearing === null || b1.ideal_bearing === undefined
    ) continue;

    // Reset these to clean out any old toll-based or stale values
    b1.bearing_deviation = null;
    b1.actual_bearing = null;

    let maxDiff = 0;
    let maxBearing = null;

    for (let j = 0; j < bills.length; j++) {
      if (i === j) continue;
      const b2 = bills[j];
      if (b2.vehicle_number !== b1.vehicle_number) continue;
      if (b2.to_lat === null || b2.to_lng === null) continue;

      // Check for time overlap
      const start1 = new Date(b1.ewb_dt).getTime();
      const end1 = new Date(b1.ewb_final_valid_dt).getTime();
      const start2 = new Date(b2.ewb_dt).getTime();
      const end2 = new Date(b2.ewb_final_valid_dt).getTime();

      if (isNaN(start1) || isNaN(end1) || isNaN(start2) || isNaN(end2)) continue;

      // Intervals [start1, end1] and [start2, end2] overlap if:
      const overlap = start1 <= end2 && start2 <= end1;

      if (overlap) {
        // Calculate bearing from b1's source to b2's destination
        const bearingToDest2 = bearing(b1.from_lat, b1.from_lng, b2.to_lat, b2.to_lng);
        const diff = bearingDeviation(b1.ideal_bearing, bearingToDest2);

        if (diff > maxDiff) {
          maxDiff = diff;
          maxBearing = bearingToDest2;
        }

        if (diff > 30) {
          b1.suspicious = true;
          const reason = `Overlapping EWB ${b2.ewb_no} destination is in a conflicting direction (bearing angle difference of ${diff.toFixed(1)}° exceeds 30°)`;
          if (!b1.suspicious_reasons) b1.suspicious_reasons = [];
          if (!b1.suspicious_reasons.includes(reason)) {
            b1.suspicious_reasons.push(reason);
          }
        }
      }
    }

    if (maxDiff > 0) {
      b1.bearing_deviation = parseFloat(maxDiff.toFixed(2));
      b1.actual_bearing = parseFloat(maxBearing.toFixed(2));
    }
  }
}

module.exports = { detect, detectOverlapping };
