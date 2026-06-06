const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../middleware/auth");
const { generateOtp, generateResetToken, hashToken } = require("../utils/otp");
const { sendOtpEmail, sendPasswordResetEmail, sendWelcomeEmail, sendTestEmail } = require("../utils/emailService");
const {
  validateEmail,
  validatePassword,
  validateRegisterBody,
} = require("../utils/validators");

const OTP_TTL_MS = 5 * 60 * 1000;
const RESET_TTL_MS = 15 * 60 * 1000;

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    state: user.state,
    department: user.department,
    isVerified: user.isVerified,
    approved: user.approved,
  };
}

async function issueOtp(user) {
  const otp = generateOtp();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
  await user.save({ validateBeforeSave: false });
  const emailResult = await sendOtpEmail(user.email, otp);
  // emailResult.devMode === true means neither Resend nor SMTP could send
  return { otp, devMode: emailResult?.devMode === true };
}

exports.register = async (req, res) => {
  try {
    const validationError = validateRegisterBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { name, email, password, state, department } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === "admin@gmail.com") {
      return res.status(400).json({ error: "Use admin login credentials for admin access" });
    }

    let user = await User.findOne({ email: normalizedEmail });

    if (user && user.isVerified) {
      return res.status(409).json({ error: "Email already registered" });
    }

    if (user && !user.isVerified) {
      user.name = name.trim();
      user.password = password;
      user.state = state.trim();
      user.department = department.trim();
      user.role = "officer";
      user.isVerified = false;
      user.approved = false;
    } else {
      user = new User({
        name: name.trim(),
        email: normalizedEmail,
        password,
        state: state.trim(),
        department: department.trim(),
        role: "officer",
        isVerified: false,
        approved: false,
      });
    }

    await user.save();
    const { otp, devMode } = await issueOtp(user);

    const payload = {
      message: "Registration started. Enter the OTP sent to your email.",
      email: user.email,
      requiresVerification: true,
    };

    // Show OTP in response when email delivery failed (dev fallback)
    if (devMode || process.env.NODE_ENV !== "production") {
      payload.devOtp = otp;
    }

    res.status(201).json(payload);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "No registration found for this email" });
    }
    if (user.isVerified) {
      return res.status(400).json({ error: "Email is already verified" });
    }

    const { otp, devMode } = await issueOtp(user);
    const payload = { message: "OTP sent to your email" };
    if (devMode || process.env.NODE_ENV !== "production") payload.devOtp = otp;

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr });
    if (!otp || String(otp).trim().length !== 6) {
      return res.status(400).json({ error: "Valid 6-digit OTP is required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.isVerified) {
      return res.status(400).json({ error: "Account is already verified" });
    }
    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ error: "No OTP found. Request a new one." });
    }
    if (user.otpExpires < new Date()) {
      return res.status(400).json({ error: "OTP has expired. Request a new one." });
    }
    if (user.otp !== String(otp).trim()) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    user.isVerified = true;
    user.approved = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save({ validateBeforeSave: false });

    // Send welcome email (non-blocking — don't let this failure block the response)
    sendWelcomeEmail(user.email, user.name).catch((e) =>
      console.warn("[AUTH] Welcome email failed (non-critical):", e.message)
    );

    const token = signToken(user);

    res.json({
      message: "Email verified. Your account is now active.",
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr });
    const passErr = validatePassword(password);
    if (passErr) return res.status(400).json({ error: passErr });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: "Email not verified. Complete OTP verification first.",
        requiresVerification: true,
        email: user.email,
      });
    }

    if (user.role === "officer" && !user.approved) {
      return res.status(403).json({ error: "Account pending approval" });
    }

    const token = signToken(user);

    res.json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr });

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user || !user.isVerified) {
      return res.json({
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const { token, hashed } = generateResetToken();
    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    const emailResult = await sendPasswordResetEmail(user.email, resetUrl);

    const payload = { message: "If that email exists, a reset link has been sent." };
    // Show reset URL in response when email delivery failed (dev fallback)
    if (emailResult?.devMode || process.env.NODE_ENV !== "production") {
      payload.devResetUrl = resetUrl;
    }

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, email, password } = req.body;
    if (!token) return res.status(400).json({ error: "Reset token is required" });
    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr });
    const passErr = validatePassword(password);
    if (passErr) return res.status(400).json({ error: passErr });

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password reset successful. You can log in now." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword) {
      return res.status(400).json({ error: "Current password is required" });
    }
    const passErr = validatePassword(newPassword);
    if (passErr) return res.status(400).json({ error: passErr });
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: "New password must be different" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPendingRegistrations = async (req, res) => {
  try {
    const pending = await User.find({
      role: "officer",
      isVerified: true,
      approved: false,
    })
      .select("-password -otp -resetPasswordToken")
      .sort({ createdAt: -1 });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    ).select("-password -otp -resetPasswordToken");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User approved", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllOfficers = async (req, res) => {
  try {
    const officers = await User.find({ role: "officer" })
      .select("-password -otp -resetPasswordToken")
      .sort({ createdAt: -1 });
    res.json(officers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Test Email endpoint (POST /api/auth/test-email) ─────────────────────────
// Sends a real email via the configured SMTP transport.
// Useful to verify SMTP credentials independently of user flows.
exports.testEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "\"email\" field is required in the request body." });
    }

    const emailErr = validateEmail(email.trim());
    if (emailErr) return res.status(400).json({ error: emailErr });

    console.log(`[TEST-EMAIL] Sending test email to: ${email.trim()}`);
    const result = await sendTestEmail(email.trim());

    if (result.devMode) {
      return res.status(502).json({
        success: false,
        devMode: true,
        message: "SMTP failed — email was NOT delivered. Check the server console for the exact error and diagnosis.",
        hint: [
          "1. Verify SMTP_USER and SMTP_PASS (16-char App Password) in .env",
          "2. Ensure 2-Step Verification is ON for the Gmail account",
          "3. Try SMTP_PORT=465 in .env if port 587 is blocked",
          "4. Test on a mobile hotspot — your ISP may block port 587",
        ],
        smtpError: result.smtpError || null,
      });
    }

    return res.json({
      success: true,
      provider: result.provider,
      port: result.port,
      message: `✅ Test email delivered via SMTP (port ${result.port}) to ${email.trim()}. Check your inbox (and spam folder).`,
    });
  } catch (err) {
    console.error("[TEST-EMAIL] Unexpected error:", err);
    res.status(500).json({ error: err.message });
  }
};
