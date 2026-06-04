const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const ctrl = require("../controllers/ewbController");

router.post("/upload", upload.single("file"), ctrl.uploadEwb);
router.get("/states", ctrl.getStates);
router.get("/districts", ctrl.getDistricts);
router.get("/", ctrl.getAll);
router.get("/stats", ctrl.getStats);
router.get("/:id", ctrl.getById);
router.delete("/", ctrl.deleteAll);

module.exports = router;

