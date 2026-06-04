const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { loadPincodes } = require("./utils/pincodeLoader");
const ewbRoutes = require("./routes/ewbRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/ewb", ewbRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ message: "E-Way Bill Dashboard API is running" });
});

const seedAdmin = require("./utils/seedAdmin");

const start = async () => {
  await connectDB();
  await seedAdmin();
  loadPincodes();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();
