const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "ewb_dashboard_secret_key_2026";

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = header.split(" ")[1];
    if (!token || token === "immediate_access_token") {
      return res.status(401).json({ error: "Invalid token" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password -otp -resetPasswordToken");

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: "Email not verified" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { authenticate, JWT_SECRET };
