const fs = require("fs");
const EwayBill = require("../models/EwayBill");
const TollPass = require("../models/TollPass");
const { parseExcel } = require("../utils/excelParser");
const { getCoords } = require("../utils/pincodeLoader");
const { haversine, bearing, bearingDeviation } = require("../utils/geoUtils");
const { detect, detectOverlapping } = require("../utils/suspiciousDetector");

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

      enriched.push(bill);
    }

    // Run overlapping checks against database
    const vehicles = [...new Set(enriched.map((b) => b.vehicle_number).filter(Boolean))];
    const existingBills = await EwayBill.find({ vehicle_number: { $in: vehicles } });
    const combined = [
      ...existingBills.map((b) => b.toObject()),
      ...enriched,
    ];

    detectOverlapping(combined);

    // Update suspicious state of any existing bills that now overlap with new bills
    const existingUpdates = [];
    for (const item of combined) {
      if (item._id) {
        const original = existingBills.find((eb) => String(eb._id) === String(item._id));
        if (original && (original.suspicious !== item.suspicious ||
            original.suspicious_reasons.length !== item.suspicious_reasons.length)) {
          existingUpdates.push(
            EwayBill.findByIdAndUpdate(item._id, {
              $set: {
                suspicious: item.suspicious,
                suspicious_reasons: item.suspicious_reasons,
              },
            })
          );
        }
      }
    }

    if (existingUpdates.length > 0) {
      await Promise.all(existingUpdates);
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
    if (req.query.state) filter.from_state = req.query.state;
    if (req.query.district) filter.from_district = req.query.district;
    if (req.query.vehicle) {
      filter.vehicle_number = { $regex: req.query.vehicle, $options: "i" };
    }
    if (req.query.ewb) {
      filter.ewb_no = { $regex: req.query.ewb, $options: "i" };
    }
    if (req.query.suspicious !== undefined && req.query.suspicious !== "") {
      filter.suspicious = req.query.suspicious === "true";
    }
    if (req.query.reason) {
      filter.suspicious_reasons = { $regex: req.query.reason, $options: "i" };
    }


    const pipeline = [
      { $match: filter },
      {
        $addFields: {
          total_vehicle_gst: {
            $add: [
              { $ifNull: ["$cgst_amt", 0] },
              { $ifNull: ["$sgst_amt", 0] },
              { $ifNull: ["$igst_amt", 0] }
            ]
          }
        }
      },
      { $sort: { total_vehicle_gst: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const [docs, total] = await Promise.all([
      EwayBill.aggregate(pipeline),
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
    res.json(doc.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const filter = {};
    if (req.query.state) filter.from_state = req.query.state;
    if (req.query.district) filter.from_district = req.query.district;


    const total = await EwayBill.countDocuments(filter);
    const suspiciousCount = await EwayBill.countDocuments({ ...filter, suspicious: true });

    // Get top suspicious reasons across all flagged bills
    const suspiciousBills = await EwayBill.find(
      { ...filter, suspicious: true },
      { suspicious_reasons: 1 }
    ).limit(200);

    const reasonCounts = {};
    suspiciousBills.forEach((b) => {
      (b.suspicious_reasons || []).forEach((r) => {
        // Normalize reason to a short category
        let key = r;
        const lowerR = r.toLowerCase();
        if (lowerR.includes("overlapping") || lowerR.includes("conflicting")) {
          key = "Conflicting Overlapping Directions";
        } else if (lowerR.includes("bearing")) {
          key = "Bearing Deviation";
        }
        reasonCounts[key] = (reasonCounts[key] || 0) + 1;
      });
    });
    const top_reasons = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));

    res.json({
      total,
      suspicious: suspiciousCount,
      clean: total - suspiciousCount,
      top_reasons,
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

exports.getTollRoute = async (req, res) => {
  try {
    const bill = await EwayBill.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: "Bill not found" });

    if (!bill.vehicle_number) {
      return res.json({ bill, route: [], roadGeometry: [], bearingAnalysis: null, relatedBills: [] });
    }

    const relatedBills = await EwayBill.find({
      vehicle_number: bill.vehicle_number,
      _id: { $ne: bill._id }
    }).sort({ ewb_dt: 1 });

    const token = "9a61c7e2-4e34-4c3a-b464-e05e7590d49c";
    const enrichedRelated = await Promise.all(relatedBills.map(async (rb) => {
      const rbObj = rb.toObject();
      rbObj.roadGeometry = [];
      if (rb.from_lng && rb.from_lat && rb.to_lng && rb.to_lat) {
        const coordStr = `${rb.from_lng},${rb.from_lat};${rb.to_lng},${rb.to_lat}`;
        const url = `https://apis.mappls.com/advancedmaps/v1/${token}/route_adv/driving/${coordStr}?geometries=geojson&overview=full`;
        try {
          const response = await fetch(url);
          const routeData = await response.json();
          if (routeData.routes && routeData.routes[0]) {
            rbObj.roadGeometry = routeData.routes[0].geometry.coordinates.map((c) => ({
              lat: c[1],
              lng: c[0]
            }));
          }
        } catch (err) {
          console.error("Failed to fetch related bill road route:", err.message);
        }
      }
      return rbObj;
    }));

    const startLimit = new Date(bill.ewb_dt);

    // End limit is either the validity date or 7 days after the start
    const endLimit = bill.ewb_final_valid_dt 
      ? new Date(bill.ewb_final_valid_dt) 
      : new Date(startLimit.getTime() + 7 * 24 * 60 * 60 * 1000);

    const passes = await TollPass.find({
      veh: bill.vehicle_number,
      readertme: {
        $gte: startLimit,
        $lte: endLimit,
      }
    }).sort({ readertme: 1 });

    // ─── Toll Frequency (how many times vehicle hit each plaza) ────
    const tollFrequencyMap = {};
    passes.forEach((p) => {
      const key = p.toll_id || p.toll_name || "Unknown";
      if (!tollFrequencyMap[key]) {
        tollFrequencyMap[key] = { toll_name: p.toll_name || key, count: 0, firstSeen: p.readertme, lastSeen: p.readertme };
      }
      tollFrequencyMap[key].count += 1;
      if (p.readertme < tollFrequencyMap[key].firstSeen) tollFrequencyMap[key].firstSeen = p.readertme;
      if (p.readertme > tollFrequencyMap[key].lastSeen) tollFrequencyMap[key].lastSeen = p.readertme;
    });
    const tollFrequency = Object.values(tollFrequencyMap).sort((a, b) => b.count - a.count);

    // ─── Destination Toll Detection ──────────────────────────────────
    // Find the toll pass closest to the bill's destination (to_lat/to_lng)
    let destinationTollIndex = -1;
    if (bill.to_lat && bill.to_lng && passes.length > 0) {
      let minDistToDestination = Infinity;
      passes.forEach((p, idx) => {
        if (!p.geo_lat || !p.geo_long) return;
        const dLat = p.geo_lat - bill.to_lat;
        const dLng = p.geo_long - bill.to_lng;
        const approxDist = Math.sqrt(dLat * dLat + dLng * dLng);
        if (approxDist < minDistToDestination) {
          minDistToDestination = approxDist;
          destinationTollIndex = idx;
        }
      });
    }

    const routePasses = passes.map((p, idx) => ({
      toll_id: p.toll_id,
      toll_name: p.toll_name,
      lat: p.geo_lat,
      lng: p.geo_long,
      timestamp: p.readertme,
      highway_type: p.highway_type,
      isDestinationToll: idx === destinationTollIndex,
      isPostDestination: destinationTollIndex >= 0 && idx > destinationTollIndex,
    }));

    // ─── Bearing Analysis (Overlapping E-Way Bills) ─────────────
    let bearingAnalysis = null;
    const overlapping = [];

    if (bill.from_lat !== null && bill.from_lng !== null && bill.ideal_bearing !== null && bill.ideal_bearing !== undefined) {
      const start1 = new Date(bill.ewb_dt).getTime();
      const end1 = bill.ewb_final_valid_dt 
        ? new Date(bill.ewb_final_valid_dt).getTime() 
        : new Date(start1 + 7 * 24 * 60 * 60 * 1000).getTime();

      relatedBills.forEach((rb) => {
        if (rb.to_lat === null || rb.to_lng === null) return;

        const start2 = new Date(rb.ewb_dt).getTime();
        const end2 = rb.ewb_final_valid_dt 
          ? new Date(rb.ewb_final_valid_dt).getTime() 
          : new Date(start2 + 7 * 24 * 60 * 60 * 1000).getTime();

        const overlap = start1 <= end2 && start2 <= end1;
        if (overlap) {
          const bearingToDest2 = bearing(bill.from_lat, bill.from_lng, rb.to_lat, rb.to_lng);
          const diff = bearingDeviation(bill.ideal_bearing, bearingToDest2);
          overlapping.push({
            ewb_no: rb.ewb_no,
            to_pin: rb.to_pin,
            bearing_to_dest: parseFloat(bearingToDest2.toFixed(1)),
            bearing_deviation: parseFloat(diff.toFixed(1)),
            is_suspicious: diff > 30
          });
        }
      });
    }

    if (overlapping.length > 0) {
      const maxOverlap = overlapping.reduce((prev, current) => 
        (prev.bearing_deviation > current.bearing_deviation) ? prev : current
      );

      bearingAnalysis = {
        has_overlap: true,
        ideal_bearing: parseFloat(bill.ideal_bearing.toFixed(1)),
        overlapping_bills: overlapping,
        max_deviation: maxOverlap.bearing_deviation,
        is_suspicious: maxOverlap.bearing_deviation > 30,
        threshold: 30,
        // Compatibility properties for UI:
        actual_bearing: maxOverlap.bearing_to_dest,
        bearing_deviation: maxOverlap.bearing_deviation,
        conflicting_ewb_no: maxOverlap.ewb_no
      };
    }

    // Construct route coordinates for REST API call
    // Note: Coordinates must be in longitude,latitude order for route_adv API
    const coordList = [];
    if (bill.from_lng && bill.from_lat) {
      coordList.push([bill.from_lng, bill.from_lat]);
    }
    
    // Add all intermediate tolls
    routePasses.forEach((p) => {
      if (p.lng && p.lat) {
        coordList.push([p.lng, p.lat]);
      }
    });

    if (routePasses.length === 0 && bill.to_lng && bill.to_lat) {
      coordList.push([bill.to_lng, bill.to_lat]);
    }

    let roadGeometry = [];

    if (coordList.length >= 2) {
      const coordStr = coordList.map((c) => `${c[0]},${c[1]}`).join(";");
      const token = "9a61c7e2-4e34-4c3a-b464-e05e7590d49c";
      const url = `https://apis.mappls.com/advancedmaps/v1/${token}/route_adv/driving/${coordStr}?geometries=geojson&overview=full`;
      
      try {
        const response = await fetch(url);
        const routeData = await response.json();
        if (routeData.routes && routeData.routes[0]) {
          roadGeometry = routeData.routes[0].geometry.coordinates.map((c) => ({
            lat: c[1],
            lng: c[0]
          }));
        }
      } catch (err) {
        console.error("Failed to fetch actual road route:", err.message);
        // Fallback to straight lines
        roadGeometry = coordList.map((c) => ({ lat: c[1], lng: c[0] }));
      }
    }

    res.json({
      bill: {
        from_pin: bill.from_pin,
        to_pin: bill.to_pin,
        from_lat: bill.from_lat,
        from_lng: bill.from_lng,
        to_lat: bill.to_lat,
        to_lng: bill.to_lng,
        vehicle_number: bill.vehicle_number,
        ewb_dt: bill.ewb_dt,
        ewb_final_valid_dt: bill.ewb_final_valid_dt,
      },
      route: routePasses,
      roadGeometry,
      bearingAnalysis,
      relatedBills: enrichedRelated,
      tollFrequency,
      destinationTollIndex,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

