const mongoose = require("mongoose");

const tollPassSchema = new mongoose.Schema({
  toll_id: { type: String },
  toll_name: { type: String },
  highway_type: { type: String },
  geo_lat: { type: Number },
  geo_long: { type: Number },
  readertme: { type: Date },
  veh: { type: String },
}, { timestamps: true });

// Index for fast route query by vehicle number and date range
tollPassSchema.index({ veh: 1, readertme: 1 });

module.exports = mongoose.model("TollPass", tollPassSchema);
