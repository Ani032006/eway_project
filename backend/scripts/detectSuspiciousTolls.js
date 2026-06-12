require("dotenv").config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require("mongoose");
const EwayBill = require("../models/EwayBill");
const TollPass = require("../models/TollPass");
const { crossTrackDistance } = require("../utils/geoUtils");

const BATCH_SIZE = 1000;
const CROSS_TRACK_THRESHOLD_KM = 50;

async function processBatch(bills) {
  const updates = [];
  
  // We can query tolls in parallel to speed things up
  await Promise.all(bills.map(async (bill) => {
    let sus = false;
    let reasons = [];

    const startLimit = new Date(bill.ewb_dt);

    const endLimit = bill.ewb_final_valid_dt 
      ? new Date(bill.ewb_final_valid_dt) 
      : new Date(new Date(bill.ewb_dt).getTime() + 7 * 24 * 60 * 60 * 1000);

    const passes = await TollPass.find({
      veh: bill.vehicle_number,
      readertme: {
        $gte: startLimit,
        $lte: endLimit,
      }
    });

    if (passes.length === 0) {
      sus = true;
      reasons.push("No toll data available for this trip");
    } else {
      let outOfPathCount = 0;
      const tollFrequency = {};
      let multiplePasses = false;

      for (const pass of passes) {
        // Track duplicate tolls
        if (pass.toll_id || pass.toll_name) {
          const tId = pass.toll_id || pass.toll_name;
          tollFrequency[tId] = (tollFrequency[tId] || 0) + 1;
          if (tollFrequency[tId] > 2) {
            multiplePasses = true;
          }
        }

        if (!pass.geo_lat || !pass.geo_long) continue;
        const d_xt = crossTrackDistance(
          bill.from_lat, bill.from_lng,
          bill.to_lat, bill.to_lng,
          pass.geo_lat, pass.geo_long
        );
        if (d_xt > CROSS_TRACK_THRESHOLD_KM) {
          outOfPathCount++;
        }
      }
      
      if (outOfPathCount > 0) {
        sus = true;
        reasons.push(`Toll triggered significantly outside of the expected path`);
      }

      if (multiplePasses) {
        sus = true;
        reasons.push(`Vehicle passed through the same toll plaza multiple times during this trip`);
      }
    }

    const existingReasons = (bill.suspicious_reasons || []).filter(r => 
      !r.startsWith("No toll data") && 
      !r.startsWith("Toll triggered significantly") &&
      !r.startsWith("Vehicle passed through the same toll plaza")
    );
    
    const newReasons = [...new Set([...existingReasons, ...reasons])];
    const isNowSuspicious = newReasons.length > 0;

    updates.push({
      updateOne: {
        filter: { _id: bill._id },
        update: {
          $set: { 
            suspicious: isNowSuspicious,
            suspicious_reasons: newReasons
          }
        }
      }
    });
  }));

  if (updates.length > 0) {
    await EwayBill.bulkWrite(updates, { ordered: false });
  }
}

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected!\n");

  const query = { 
    vehicle_number: { $ne: null, $ne: "" },
    from_lat: { $ne: null },
    from_lng: { $ne: null },
    to_lat: { $ne: null },
    to_lng: { $ne: null },
    ewb_dt: { $ne: null }
  };
  
  const totalBills = await EwayBill.countDocuments(query);
  console.log(`Found ${totalBills} E-Way Bills to process.\n`);

  let processed = 0;
  let batch = [];
  const cursor = EwayBill.find(query).lean().cursor();

  for await (const bill of cursor) {
    batch.push(bill);
    if (batch.length === BATCH_SIZE) {
      await processBatch(batch);
      processed += batch.length;
      batch = [];
      process.stdout.write(`\rProcessed ${processed} / ${totalBills} bills...`);
    }
  }

  if (batch.length > 0) {
    await processBatch(batch);
    processed += batch.length;
    process.stdout.write(`\rProcessed ${processed} / ${totalBills} bills...`);
  }

  console.log("\n\nFinished processing toll-based suspicious rules.");
  await mongoose.disconnect();
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
