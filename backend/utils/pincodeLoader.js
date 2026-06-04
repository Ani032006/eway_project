const fs = require("fs");
const path = require("path");

const LOOKUP_PATH = path.join(__dirname, "..", "data", "pincode_lookup.json");
let pincodeMap = null;
let sortedPincodes = [];

function loadPincodes() {
  const raw = fs.readFileSync(LOOKUP_PATH, "utf-8");
  const data = JSON.parse(raw);
  pincodeMap = new Map();
  for (const [pin, coords] of Object.entries(data)) {
    pincodeMap.set(Number(pin), coords);
  }
  sortedPincodes = Array.from(pincodeMap.keys()).sort((a, b) => a - b);
  console.log(`Pincode lookup loaded: ${pincodeMap.size} entries`);
}

function findNearestPincode(pin) {
  if (sortedPincodes.length === 0) return null;
  let low = 0;
  let high = sortedPincodes.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const val = sortedPincodes[mid];

    if (val === pin) {
      return val;
    } else if (val < pin) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  let closest = sortedPincodes[0];
  let minDiff = Math.abs(pin - closest);

  const candidates = [low - 1, low, low + 1];
  for (const idx of candidates) {
    if (idx >= 0 && idx < sortedPincodes.length) {
      const val = sortedPincodes[idx];
      const diff = Math.abs(pin - val);
      if (diff < minDiff) {
        minDiff = diff;
        closest = val;
      }
    }
  }
  return closest;
}

function getCoords(pincode) {
  if (!pincodeMap) loadPincodes();
  const numPin = Number(pincode);

  if (pincodeMap.has(numPin)) {
    return pincodeMap.get(numPin);
  }

  // Fallback to nearest pincode if exact match is not found
  const nearest = findNearestPincode(numPin);
  if (nearest) {
    return pincodeMap.get(nearest);
  }

  return null;
}

module.exports = { loadPincodes, getCoords };

