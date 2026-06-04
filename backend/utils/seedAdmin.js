const User = require("../models/User");

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@gmail.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const existing = await User.findOne({ email });
  if (existing) {
    if (process.env.SYNC_ADMIN_PASSWORD === "true") {
      existing.password = password;
      existing.isVerified = true;
      existing.approved = true;
      await existing.save();
      console.log(`Admin password synced for: ${email}`);
    }
    return;
  }

  await User.create({
    name: "System Admin",
    email,
    password,
    role: "admin",
    state: "All States",
    department: "System Administration",
    isVerified: true,
    approved: true,
  });

  console.log(`Admin account ready: ${email}`);
}

module.exports = seedAdmin;
