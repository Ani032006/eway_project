require("dotenv").config();
const mongoose = require("mongoose");

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await mongoose.connection.db
    .collection("users")
    .updateMany(
      { isVerified: { $ne: true } },
      { $set: { isVerified: true, approved: true } }
    );
  console.log("✅ Migrated", result.modifiedCount, "existing users → isVerified: true");
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
