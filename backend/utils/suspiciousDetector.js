const DISTANCE_RATIO_THRESHOLD = 1.5;

function detect(bill) {
  const reasons = [];

  if (
    bill.actual_distance &&
    bill.actual_distance > 0 &&
    bill.travel_distance > 0
  ) {
    const ratio = bill.travel_distance / bill.actual_distance;
    if (ratio > DISTANCE_RATIO_THRESHOLD) {
      reasons.push(
        `Distance ratio ${ratio.toFixed(2)}x exceeds threshold ${DISTANCE_RATIO_THRESHOLD}x`
      );
    }
  }

  if (
    bill.from_pin !== bill.to_pin &&
    (bill.travel_distance === 0 || bill.travel_distance === null)
  ) {
    reasons.push("Zero travel distance between different pincodes");
  }

  if (bill.ewb_final_valid_dt && new Date(bill.ewb_final_valid_dt) < new Date()) {
    reasons.push("E-way bill validity has expired");
  }

  const hasIntra = (bill.cgst_amt > 0 || bill.sgst_amt > 0);
  const hasInter = bill.igst_amt > 0;
  if (hasIntra && hasInter) {
    reasons.push("Both intra-state (CGST/SGST) and inter-state (IGST) tax applied");
  }

  return {
    suspicious: reasons.length > 0,
    suspicious_reasons: reasons,
  };
}

module.exports = { detect };
