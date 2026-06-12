const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const ctrl = require("../controllers/ewbController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roles");

// Admin-only write operations (require authentication)
router.post("/upload", authenticate, requireAdmin, upload.single("file"), ctrl.uploadEwb);
router.delete("/", authenticate, requireAdmin, ctrl.deleteAll);

// Read operations — public (no auth required so dashboard loads for all users)
router.get("/states", ctrl.getStates);
router.get("/districts", ctrl.getDistricts);
router.get("/", ctrl.getAll);
router.get("/stats", ctrl.getStats);
router.get("/:id/toll-route", ctrl.getTollRoute);
router.get("/:id", ctrl.getById);

module.exports = router;
