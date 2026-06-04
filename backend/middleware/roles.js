function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
}

function requireOfficer(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "officer") {
    return res.status(403).json({ error: "Officer access only" });
  }
  next();
}

module.exports = { requireAdmin, requireOfficer };
