const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roles");

// Public auth
router.post("/register", ctrl.register);
router.post("/send-otp", ctrl.sendOtp);
router.post("/verify-otp", ctrl.verifyOtp);
router.post("/login", ctrl.login);
router.post("/forgot-password", ctrl.forgotPassword);
router.post("/reset-password", ctrl.resetPassword);

// Protected
router.post("/change-password", authenticate, ctrl.changePassword);
router.get("/profile", authenticate, ctrl.getProfile);

// Admin only
router.get("/pending", authenticate, requireAdmin, ctrl.getPendingRegistrations);
router.patch("/approve/:id", authenticate, requireAdmin, ctrl.approveUser);
router.get("/officers", authenticate, requireAdmin, ctrl.getAllOfficers);

module.exports = router;
