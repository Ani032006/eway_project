const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const ctrl = require("../controllers/ewbController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roles");

router.use(authenticate);

router.post("/upload", requireAdmin, upload.single("file"), ctrl.uploadEwb);
router.delete("/", requireAdmin, ctrl.deleteAll);

router.get("/states", ctrl.getStates);
router.get("/districts", ctrl.getDistricts);
router.get("/", ctrl.getAll);
router.get("/stats", ctrl.getStats);
router.get("/:id", ctrl.getById);

module.exports = router;
