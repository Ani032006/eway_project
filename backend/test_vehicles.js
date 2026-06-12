const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const EwayBill = require("./models/EwayBill");
  const TollPass = require("./models/TollPass");

  const bill = await EwayBill.findOne({ ewb_no: '881446726165' });
  if (!bill) {
    console.log("Bill 881446726165 not found.");
    return;
  }
  
  const startLimit = new Date(bill.ewb_dt);
  const endLimit = new Date(bill.ewb_final_valid_dt);
  
  console.log("E-Way Bill:", bill.ewb_no);
  console.log("Start Limit:", startLimit);
  console.log("End Limit:", endLimit);
  console.log("Vehicle Number:", bill.vehicle_number);
  
  const passes = await TollPass.find({
    veh: bill.vehicle_number,
    readertme: {
      $gte: startLimit,
      $lte: endLimit
    }
  }).sort({ readertme: 1 });
  
  console.log("Matching Toll Passes Count:", passes.length);
  if (passes.length > 0) {
    console.log("Passes:");
    console.log(passes.map(p => ({
      toll_name: p.toll_name,
      time: p.readertme,
      lat: p.geo_lat,
      lng: p.geo_long
    })));
  }

  await mongoose.disconnect();
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
