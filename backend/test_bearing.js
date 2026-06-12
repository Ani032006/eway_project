const { bearing } = require('./utils/geoUtils');

// Start point: 10.0, 10.0
const lat1 = 10.0;
const lon1 = 10.0;

// Test 1: North-East (lat difference +5, lon difference +5)
console.log('NE (15, 15) Bearing:', bearing(lat1, lon1, 15.0, 15.0));

// Test 2: South-East (lat difference -5, lon difference +5)
console.log('SE (5, 15) Bearing:', bearing(lat1, lon1, 5.0, 15.0));

// Test 3: South-West (lat difference -5, lon difference -5)
console.log('SW (5, 5) Bearing:', bearing(lat1, lon1, 5.0, 5.0));

// Test 4: North-West (lat difference +5, lon difference -5)
console.log('NW (15, 5) Bearing:', bearing(lat1, lon1, 15.0, 5.0));
