require("dotenv").config();
const fs = require("fs");
const readline = require("readline");
const mongoose = require("mongoose");
const TollPass = require("../models/TollPass");

const CSV_PATH = "C:\\Users\\gamer\\Downloads\\fastag_data_intern\\fastag_data_intern.csv";
const BATCH_SIZE = 5000;

function parseDateTime(str) {
  if (!str) return null;
  const parts = str.split(" ");
  if (parts.length < 2) return null;
  const dateParts = parts[0].split("/");
  if (dateParts.length < 3) return null;
  
  const day = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1;
  const year = parseInt(dateParts[2]);

  const timeParts = parts[1].split(":");
  if (timeParts.length < 3) return null;
  
  let hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);
  const seconds = parseInt(timeParts[2]);

  if (parts[2]) {
    const ampm = parts[2].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
  }

  return new Date(year, month, day, hours, minutes, seconds);
}

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected!\n");

  console.log("Clearing existing TollPass records...");
  await TollPass.deleteMany({});
  console.log("Cleared!\n");

  console.log(`Reading CSV: ${CSV_PATH}`);
  const fileStream = fs.createReadStream(CSV_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isHeader = true;
  let headers = [];
  let buffer = [];
  let insertedCount = 0;
  let totalProcessed = 0;

  for await (const line of rl) {
    if (isHeader) {
      headers = line.split(",").map(h => h.trim());
      isHeader = false;
      continue;
    }

    const cols = line.split(",");
    if (cols.length < headers.length) continue;

    const row = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = cols[i]?.trim();
    }

    const tollPass = {
      toll_id: row.toll_id,
      toll_name: row.toll_name,
      highway_type: row.highway_type,
      geo_lat: parseFloat(row.geo_lat) || null,
      geo_long: parseFloat(row.geo_long) || null,
      readertme: parseDateTime(row.readertme),
      veh: row.veh ? String(row.veh).replace(/[\\s-]/g, '').toUpperCase() : null,
    };

    buffer.push(tollPass);
    totalProcessed++;

    if (buffer.length >= BATCH_SIZE) {
      await TollPass.insertMany(buffer);
      insertedCount += buffer.length;
      buffer = [];
      process.stdout.write(`\rProgress: Processed ${totalProcessed} | Inserted ${insertedCount}`);
    }
  }

  if (buffer.length > 0) {
    await TollPass.insertMany(buffer);
    insertedCount += buffer.length;
  }

  console.log(`\n\n========== IMPORT COMPLETE ==========`);
  console.log(`Total rows processed: ${totalProcessed}`);
  console.log(`Successfully inserted: ${insertedCount}`);
  console.log(`=====================================\n`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
