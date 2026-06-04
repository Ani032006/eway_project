const mongoose = require("mongoose");

const ewayBillSchema = new mongoose.Schema({
  ewb_no: { type: String, unique: true, required: true },
  ewb_dt: { type: Date },
  from_pin: { type: Number },
  to_pin: { type: Number },
  travel_distance: { type: Number },
  ewb_final_valid_dt: { type: Date },
  ewb_ass_amt: { type: Number },
  cgst_amt: { type: Number },
  sgst_amt: { type: Number },
  igst_amt: { type: Number },
  vehicle_number: { type: String },

  from_lat: { type: Number },
  from_lng: { type: Number },
  to_lat: { type: Number },
  to_lng: { type: Number },

  from_state: { type: String },
  to_state: { type: String },
  from_district: { type: String },
  to_district: { type: String },

  actual_distance: { type: Number },
  ideal_bearing: { type: Number },
  distance_ratio: { type: Number },

  suspicious: { type: Boolean, default: false },
  suspicious_reasons: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model("EwayBill", ewayBillSchema);

