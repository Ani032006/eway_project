const fs = require("fs");
const path = require("path");

const CSV_PATH = "C:\\Users\\gamer\\Downloads\\PinCode_GeoLat_Long.csv";
const OUT_PATH = path.join(__dirname, "..", "data", "pincode_lookup.json");

function run() {
  const raw = fs.readFileSync(CSV_PATH, "utf-8");
  const lines = raw.split("\n");
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const pinIdx = header.indexOf("pincode");
  const latIdx = header.indexOf("latitude");
  const lngIdx = header.indexOf("longitude");
  const stateIdx = header.indexOf("statename");
  const districtIdx = header.indexOf("district");

  if (pinIdx === -1 || latIdx === -1 || lngIdx === -1) {
    console.error("Required columns not found. Header:", header);
    process.exit(1);
  }

  const accumulator = {};

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length <= Math.max(pinIdx, latIdx, lngIdx)) continue;

    const pin = parseInt(cols[pinIdx]);
    const lat = parseFloat(cols[latIdx]);
    const lng = parseFloat(cols[lngIdx]);
    const state = cols[stateIdx]?.replace(/^"|"$/g, "").trim();
    const district = cols[districtIdx]?.replace(/^"|"$/g, "").trim();

    if (isNaN(pin) || isNaN(lat) || isNaN(lng)) continue;

    if (!accumulator[pin]) {
      accumulator[pin] = { latSum: 0, lngSum: 0, count: 0, state: state || "", district: district || "" };
    }
    accumulator[pin].latSum += lat;
    accumulator[pin].lngSum += lng;
    accumulator[pin].count += 1;
    if (state && !accumulator[pin].state) accumulator[pin].state = state;
    if (district && !accumulator[pin].district) accumulator[pin].district = district;
  }

  const lookup = {};
  for (const [pin, data] of Object.entries(accumulator)) {
    lookup[pin] = {
      lat: parseFloat((data.latSum / data.count).toFixed(6)),
      lng: parseFloat((data.lngSum / data.count).toFixed(6)),
      state: data.state,
      district: data.district,
    };
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(lookup));
  console.log(`Pincode lookup built: ${Object.keys(lookup).length} entries`);
  console.log(`Saved to: ${OUT_PATH}`);
}

run();

