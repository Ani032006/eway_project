const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors    = require("cors");

const connectDB              = require("./config/db");
const { loadPincodes }       = require("./utils/pincodeLoader");
const { verifySmtpConnection } = require("./utils/emailService");
const ewbRoutes              = require("./routes/ewbRoutes");
const authRoutes             = require("./routes/authRoutes");
const seedAdmin              = require("./utils/seedAdmin");

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/ewb",  ewbRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (_req, res) =>
  res.json({ message: "E-Way Bill Dashboard API is running" })
);

// ─── Startup ─────────────────────────────────────────────────────────────────

function checkEnvConfig() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║          E-Way Intelligence — Environment Check          ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  const warnings = [];

  // JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET || "";
  if (!jwtSecret || jwtSecret === "change_this_to_a_long_random_secret") {
    warnings.push(
      "JWT_SECRET is set to the placeholder value.\n" +
      "         → Replace it with a long random string in .env before going to production."
    );
  } else {
    console.log("[ENV] ✅ JWT_SECRET   — configured");
  }

  // MongoDB
  if (!process.env.MONGO_URI) {
    warnings.push("MONGO_URI is not set in .env");
  } else {
    console.log("[ENV] ✅ MONGO_URI    — configured");
  }

  // SMTP
  const hasSmtp = process.env.SMTP_USER && process.env.SMTP_PASS;
  if (!hasSmtp) {
    warnings.push(
      "No email credentials found (SMTP_USER / SMTP_PASS missing).\n" +
      "         → OTP and password-reset emails will only print to the console."
    );
  } else {
    console.log(`[ENV] ✅ SMTP         — ${process.env.SMTP_USER} on ${process.env.SMTP_HOST || "smtp.gmail.com"}:${process.env.SMTP_PORT || 587}`);
  }

  if (warnings.length) {
    console.warn("");
    warnings.forEach((w) => console.warn(`[ENV] ⚠️  ${w}`));
  }
  console.log("");
}

const start = async () => {
  checkEnvConfig();

  await connectDB();
  await seedAdmin();
  loadPincodes();

  // Verify SMTP on startup so any credential problems are visible immediately
  await verifySmtpConnection();

  app.listen(PORT, () =>
    console.log(`\n[SERVER] 🚀 Running on http://localhost:${PORT}\n`)
  );
};

start();
