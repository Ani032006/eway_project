const crypto = require("crypto");

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, hashed: hashToken(token) };
}

module.exports = { generateOtp, hashToken, generateResetToken };
