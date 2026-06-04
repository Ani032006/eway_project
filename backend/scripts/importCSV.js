/**
 * Import intern_data.csv into MongoDB
 *
 * Reads the CSV, enriches each row with geo-coordinates,
 * haversine distance, bearing, distance ratio, and suspicious
 * detection — identical to the Excel upload pipeline.
 *
 * Usage:  node scripts/importCSV.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const EwayBill = require("../models/EwayBill");
const { getCoords, loadPincodes } = require("../utils/pincodeLoader");
const { haversine, bearing } = require("../utils/geoUtils");
const { detect } = require("../utils/suspiciousDetector");

// Resolve intern_data.csv relative to this script's location.
// __dirname = Eway_project/frontend/backend/scripts
// 3 levels up  → Eway_project/  (where intern_data.csv lives)
const CSV_PATH = path.join(__dirname, "..", "..", "..", "intern_data.csv");
const BATCH_SIZE = 2000;

function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim());
  const header = lines[0].split(",").map((h) => h.trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < header.length) continue;

    const row = {};
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = cols[j]?.trim();
    }
    rows.push(row);
  }
  return rows;
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
  let distance_ratio = null;

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
    if (actual_distance > 0 && travel_distance) {
      distance_ratio = travel_distance / actual_distance;
    }
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
    vehicle_number: row.vehicle_number || null,
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
    distance_ratio,
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

  // Verify the CSV file exists before proceeding
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`\n❌ CSV file not found at:\n   ${CSV_PATH}`);
    console.error(`\n   Expected: intern_data.csv at the project root (Eway_project/intern_data.csv)`);
    console.error(`   Please ensure intern_data.csv is placed there and retry.\n`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log("Clearing existing EwayBill records...");
  await EwayBill.deleteMany({});

  console.log("Loading pincode lookup...");
  loadPincodes();

  console.log(`\nParsing CSV: ${CSV_PATH}`);
  const rows = parseCSV(CSV_PATH);
  console.log(`Found ${rows.length} rows\n`);

  let inserted = 0;
  let skipped = 0;
  let suspicious = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const enriched = batch.map(enrichRow);

    suspicious += enriched.filter((b) => b.suspicious).length;

    try {
      const result = await EwayBill.insertMany(enriched, {
        ordered: false,
      });
      inserted += result.length;
    } catch (err) {
      // Duplicate key errors — count what was inserted
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

    const pct = Math.min(100, Math.round(((i + batch.length) / rows.length) * 100));
    process.stdout.write(`\rProgress: ${pct}% | Inserted: ${inserted} | Skipped: ${skipped}`);
  }

  console.log(`\n\n========== IMPORT COMPLETE ==========`);
  console.log(`Total rows:    ${rows.length}`);
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
