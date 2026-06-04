const fs = require("fs");
const EwayBill = require("../models/EwayBill");
const { parseExcel } = require("../utils/excelParser");
const { getCoords } = require("../utils/pincodeLoader");
const { haversine, bearing } = require("../utils/geoUtils");
const { detect } = require("../utils/suspiciousDetector");

exports.uploadEwb = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const rows = parseExcel(req.file.path);
    const enriched = [];

    for (const row of rows) {
      const fromCoords = getCoords(row.from_pin);
      const toCoords = getCoords(row.to_pin);

      let from_lat = null, from_lng = null;
      let to_lat = null, to_lng = null;
      let actual_distance = null;
      let ideal_bearing = null;
      let distance_ratio = null;

      if (fromCoords) {
        from_lat = fromCoords.lat;
        from_lng = fromCoords.lng;
      }
      if (toCoords) {
        to_lat = toCoords.lat;
        to_lng = toCoords.lng;
      }

      if (fromCoords && toCoords) {
        actual_distance = haversine(from_lat, from_lng, to_lat, to_lng);
        ideal_bearing = bearing(from_lat, from_lng, to_lat, to_lng);
        if (actual_distance > 0 && row.travel_distance) {
          distance_ratio = row.travel_distance / actual_distance;
        }
      }

      const bill = {
        ewb_no: String(row.ewb_no),
        ewb_dt: row.ewb_dt ? new Date(row.ewb_dt) : null,
        from_pin: row.from_pin,
        to_pin: row.to_pin,
        travel_distance: row.travel_distance,
        ewb_final_valid_dt: row.ewb_final_valid_dt
          ? new Date(row.ewb_final_valid_dt)
          : null,
        ewb_ass_amt: row.ewb_ass_amt,
        cgst_amt: row.cgst_amt,
        sgst_amt: row.sgst_amt,
        igst_amt: row.igst_amt,
        vehicle_number: row.vehicle_number ? String(row.vehicle_number) : null,
        from_lat,
        from_lng,
        to_lat,
        to_lng,
        actual_distance,
        ideal_bearing,
        distance_ratio,
      };

      const result = detect(bill);
      bill.suspicious = result.suspicious;
      bill.suspicious_reasons = result.suspicious_reasons;

      enriched.push(bill);
    }

    const inserted = await EwayBill.insertMany(enriched, { ordered: false })
      .catch((err) => {
        if (err.insertedDocs) return err.insertedDocs;
        throw err;
      });

    fs.unlinkSync(req.file.path);

    const suspiciousCount = enriched.filter((b) => b.suspicious).length;

    res.json({
      total: enriched.length,
      inserted: Array.isArray(inserted) ? inserted.length : 0,
      suspicious: suspiciousCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.suspicious === "true") filter.suspicious = true;
    if (req.query.suspicious === "false") filter.suspicious = false;
    if (req.query.state) filter.from_state = req.query.state;
    if (req.query.district) filter.from_district = req.query.district;

    const [docs, total] = await Promise.all([
      EwayBill.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      EwayBill.countDocuments(filter),
    ]);

    res.json({
      data: docs,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const doc = await EwayBill.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const filter = {};
    if (req.query.state) filter.from_state = req.query.state;
    if (req.query.district) filter.from_district = req.query.district;

    const [total, suspiciousCount, reasonAgg] = await Promise.all([
      EwayBill.countDocuments(filter),
      EwayBill.countDocuments({ ...filter, suspicious: true }),
      EwayBill.aggregate([
        { $match: { ...filter, suspicious: true } },
        { $unwind: "$suspicious_reasons" },
        { $group: { _id: "$suspicious_reasons", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      total,
      suspicious: suspiciousCount,
      clean: total - suspiciousCount,
      top_reasons: reasonAgg.map((r) => ({ reason: r._id, count: r.count })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAll = async (req, res) => {
  try {
    const result = await EwayBill.deleteMany();
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStates = async (req, res) => {
  try {
    const states = await EwayBill.distinct("from_state", { from_state: { $ne: null } });
    states.sort();
    res.json(states);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDistricts = async (req, res) => {
  try {
    const { state } = req.query;
    const filter = { from_district: { $ne: null } };
    if (state) {
      filter.from_state = state;
    }
    const districts = await EwayBill.distinct("from_district", filter);
    districts.sort();
    res.json(districts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

