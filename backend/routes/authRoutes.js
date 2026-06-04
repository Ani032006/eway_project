const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/authController");

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.get("/profile", ctrl.getProfile);
router.get("/pending", ctrl.getPendingRegistrations);
router.patch("/approve/:id", ctrl.approveUser);
router.get("/officers", ctrl.getAllOfficers);

module.exports = router;
