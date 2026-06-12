require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const xlsx = require("xlsx");
const EwayBill = require("../models/EwayBill");
const { getCoords, loadPincodes } = require("../utils/pincodeLoader");
const { haversine, bearing } = require("../utils/geoUtils");
const { detect, detectOverlapping } = require("../utils/suspiciousDetector");

const BATCH_SIZE = 1000;

// Try CSV (Excel format) first, then fallback to .xlsx path
const pathsToTry = [
  "C:\\Users\\gamer\\Downloads\\intern_data_500_to_pin_shuffled.csv",

];

let EXCEL_PATH = null;
for (const p of pathsToTry) {
  if (fs.existsSync(p)) {
    EXCEL_PATH = p;
    break;
  }
}

if (!EXCEL_PATH) {
  console.error("Error: Could not find ewb_500_modified.csv or ewb_500_modified.xlsx on Desktop!");
  process.exit(1);
}

function enrichRow(row) {
  const from_pin = parseInt(row.from_pin) || null;
  const to_pin = parseInt(row.to_pin) || null;
  const travel_distance = parseFloat(row.travel_distance) || null;

  const fromCoords = from_pin ? getCoords(from_pin) : null;
  const toCoords = to_pin ? getCoords(to_pin) : null;

  let from_lat = null, from_lng = null;
  let to_lat = null, to_lng = null;
  let from_state = null, to_state = null;
  let from_district = null, to_district = null;
  let actual_distance = null;
  let ideal_bearing = null;

  if (fromCoords) {
    from_lat = fromCoords.lat;
    from_lng = fromCoords.lng;
    from_state = fromCoords.state || null;
    from_district = fromCoords.district || null;
  }
  if (toCoords) {
    to_lat = toCoords.lat;
    to_lng = toCoords.lng;
    to_state = toCoords.state || null;
    to_district = toCoords.district || null;
  }

  if (fromCoords && toCoords) {
    actual_distance = haversine(from_lat, from_lng, to_lat, to_lng);
    ideal_bearing = bearing(from_lat, from_lng, to_lat, to_lng);
  }

  const bill = {
    ewb_no: String(row.ewb_no),
    ewb_dt: row.ewb_dt ? new Date(row.ewb_dt) : null,
    from_pin,
    to_pin,
    travel_distance,
    ewb_final_valid_dt: row.ewb_final_valid_dt
      ? new Date(row.ewb_final_valid_dt)
      : null,
    ewb_ass_amt: parseFloat(row.ewb_ass_amt) || null,
    cgst_amt: parseFloat(row.cgst_amt) || 0,
    sgst_amt: parseFloat(row.sgst_amt) || 0,
    igst_amt: parseFloat(row.igst_amt) || 0,
    vehicle_number: row.vehicle_number ? String(row.vehicle_number).replace(/[\\s-]/g, '').toUpperCase() : null,
    from_lat,
    from_lng,
    to_lat,
    to_lng,
    from_state,
    to_state,
    from_district,
    to_district,
    actual_distance,
    ideal_bearing,
  };

  const result = detect(bill);
  bill.suspicious = result.suspicious;
  bill.suspicious_reasons = result.suspicious_reasons;

  return bill;
}

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected!\n");

  console.log("Clearing existing EwayBill records...");
  await EwayBill.deleteMany({});

  console.log("Loading pincode lookup...");
  loadPincodes();

  console.log(`\nParsing Excel/CSV: ${EXCEL_PATH}`);
  const workbook = xlsx.readFile(EXCEL_PATH, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);
  console.log(`Found ${rows.length} rows\n`);

  console.log("Enriching rows...");
  const enriched = rows.map(enrichRow);

  console.log("Detecting conflicting overlapping direction E-Way Bills...");
  detectOverlapping(enriched);

  console.log("Inserting EwayBill records in batches...");
  let inserted = 0;
  let skipped = 0;
  let suspicious = 0;

  for (let i = 0; i < enriched.length; i += BATCH_SIZE) {
    const batch = enriched.slice(i, i + BATCH_SIZE);
    suspicious += batch.filter((b) => b.suspicious).length;

    try {
      const result = await EwayBill.insertMany(batch, { ordered: false });
      inserted += result.length;
    } catch (err) {
      if (err.insertedDocs) {
        inserted += err.insertedDocs.length;
        skipped += batch.length - err.insertedDocs.length;
      } else if (err.result) {
        inserted += err.result.nInserted || 0;
        skipped += batch.length - (err.result.nInserted || 0);
      } else {
        console.error(`Batch error at row ${i}:`, err.message);
        skipped += batch.length;
      }
    }
  }

  console.log(`\n========== IMPORT COMPLETE ==========`);
  console.log(`Total rows:    ${enriched.length}`);
  console.log(`Inserted:      ${inserted}`);
  console.log(`Skipped (dup): ${skipped}`);
  console.log(`Suspicious:    ${suspicious}`);
  console.log(`=====================================\n`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
