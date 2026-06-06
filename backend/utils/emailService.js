const nodemailer = require("nodemailer");

// ─── Strategy ────────────────────────────────────────────────────────────────
// SMTP only (Gmail App Password via port 587 STARTTLS, fallback to 465 SSL).
// If SMTP is not configured or all ports fail → devMode (OTP/link logged to console).
//
// Required .env variables:
//   SMTP_HOST  = smtp.gmail.com
//   SMTP_PORT  = 587  (or 465)
//   SMTP_USER  = your-address@gmail.com
//   SMTP_PASS  = 16-char App Password from myaccount.google.com → Security → App Passwords
//   EMAIL_FROM = E-Way Intelligence <your-address@gmail.com>
// ─────────────────────────────────────────────────────────────────────────────

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Returns { user, pass } if SMTP credentials are present, otherwise null.
 */
function getSmtpCredentials() {
  const { SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_USER.trim() || !SMTP_PASS || !SMTP_PASS.trim()) {
    return null;
  }
  return { user: SMTP_USER.trim(), pass: SMTP_PASS.trim() };
}

/**
 * Build a nodemailer transporter for the given port.
 * Port 587 → STARTTLS (secure: false)
 * Port 465 → implicit TLS (secure: true)
 */
function buildTransporter(port) {
  const creds = getSmtpCredentials();
  if (!creds) return null;

  return nodemailer.createTransport({
    host: (process.env.SMTP_HOST || "smtp.gmail.com").trim(),
    port,
    secure: port === 465,          // false = STARTTLS on 587, true = SSL on 465
    auth: { user: creds.user, pass: creds.pass },
    tls: {
      rejectUnauthorized: false,   // allow self-signed certs on restricted networks
    },
    connectionTimeout: 15000,      // 15 s — generous for slow networks
    greetingTimeout:  10000,
    socketTimeout:    15000,
    family: 4,                     // force IPv4 (avoids IPv6 routing issues)
  });
}

/**
 * Human-readable diagnosis from a nodemailer/SMTP error.
 */
function diagnoseSMTPError(err, port) {
  const code = err.code || "";
  const resp = err.responseCode || 0;
  const msg  = err.message || "";

  if (resp === 535 || msg.toLowerCase().includes("invalid login") || msg.toLowerCase().includes("username and password")) {
    return (
      "❌ Gmail authentication failed (535). Possible causes:\n" +
      "   1. SMTP_PASS is wrong — it must be the 16-char App Password, NOT your Gmail login password.\n" +
      "   2. The App Password was revoked — regenerate it at myaccount.google.com → Security → 2-Step Verification → App Passwords.\n" +
      "   3. 2-Step Verification is disabled on the Google account — App Passwords require it to be ON."
    );
  }

  if (code === "ECONNREFUSED" || code === "ETIMEDOUT" || code === "ENOTFOUND") {
    return (
      `❌ Cannot reach ${process.env.SMTP_HOST || "smtp.gmail.com"}:${port} (${code}).\n` +
      "   Your ISP / college / office network is blocking outbound SMTP.\n" +
      "   Solutions:\n" +
      "   a) Switch to a mobile hotspot and restart the server.\n" +
      "   b) Try port 465 — set SMTP_PORT=465 in .env and restart.\n" +
      "   c) Use Resend (HTTPS port 443, never blocked) by adding RESEND_API_KEY to .env."
    );
  }

  if (resp >= 500) {
    return `❌ SMTP permanent error ${resp}: ${msg}`;
  }

  return `❌ SMTP error [${code || resp}]: ${msg}`;
}

// ─── Core send function ──────────────────────────────────────────────────────

/**
 * Send an email via SMTP.
 * Tries SMTP_PORT first (default 587), then 465 as automatic fallback.
 * Returns { devMode: false, provider: "smtp", port } on success.
 * Returns { devMode: true, smtpError: string } if all ports fail (logs OTP/link to console).
 */
async function sendMail({ to, subject, html, text }) {
  const creds = getSmtpCredentials();
  const fromAddress =
    process.env.EMAIL_FROM ||
    (creds ? `E-Way Intelligence <${creds.user}>` : "E-Way Intelligence <noreply@eway.local>");

  // ── No SMTP configured → dev mode immediately ────────────────────────────
  if (!creds) {
    console.warn("[EMAIL] ⚠️  SMTP credentials not set — falling back to dev mode.");
    _devLog(to, subject, text);
    return { devMode: true, smtpError: "SMTP credentials not configured" };
  }

  // ── Build port list: configured port first, then the other as fallback ───
  const primaryPort = Number(process.env.SMTP_PORT) || 587;
  const fallbackPort = primaryPort === 587 ? 465 : 587;
  const ports = [primaryPort, fallbackPort];

  let lastError = null;

  for (const port of ports) {
    const transporter = buildTransporter(port);
    try {
      await transporter.sendMail({ from: fromAddress, to, subject, html, text });
      console.log(`[EMAIL:SMTP] ✅ Delivered via port ${port} | To: ${to} | Subject: ${subject}`);
      return { devMode: false, provider: "smtp", port };
    } catch (err) {
      lastError = err;
      const diagnosis = diagnoseSMTPError(err, port);
      console.error(`[EMAIL:SMTP] Port ${port} failed:\n${diagnosis}`);

      // 5xx = permanent (wrong credentials etc.) — no point trying other ports
      if ((err.responseCode || 0) >= 500) {
        console.error("[EMAIL:SMTP] Permanent error — skipping port fallback.");
        break;
      }
      // Otherwise (connection issue) — try the next port
      console.warn(`[EMAIL:SMTP] Trying fallback port ${fallbackPort} …`);
    }
  }

  // ── All ports failed → dev mode ──────────────────────────────────────────
  console.error("[EMAIL:SMTP] ❌ All SMTP ports failed. Email NOT delivered to inbox.");
  _devLog(to, subject, text);
  return { devMode: true, smtpError: lastError?.message };
}

function _devLog(to, subject, text) {
  console.log("\n══════════════════════════════════════════════════════");
  console.log("[EMAIL:DEV]  Email content (not sent — SMTP failed)");
  console.log(`[EMAIL:DEV]  To:      ${to}`);
  console.log(`[EMAIL:DEV]  Subject: ${subject}`);
  if (text) console.log(`[EMAIL:DEV]  Body:    ${text}`);
  console.log("══════════════════════════════════════════════════════\n");
}

// ─── Startup SMTP health check ───────────────────────────────────────────────

/**
 * Call once at server startup to validate SMTP credentials before any user
 * triggers email sending. Logs a clear diagnosis to the console.
 * Returns true if SMTP is ready, false otherwise.
 */
async function verifySmtpConnection() {
  const creds = getSmtpCredentials();
  if (!creds) {
    console.warn(
      "[EMAIL] ⚠️  SMTP credentials missing in .env — no emails will be delivered.\n" +
      "         Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (Gmail App Password)."
    );
    return false;
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const transporter = buildTransporter(port);

  try {
    await transporter.verify();
    console.log(
      `[EMAIL] ✅ SMTP ready — ${process.env.SMTP_HOST || "smtp.gmail.com"}:${port} | User: ${creds.user}`
    );
    return true;
  } catch (err) {
    const diagnosis = diagnoseSMTPError(err, port);
    console.error(`\n[EMAIL] SMTP startup check failed:\n${diagnosis}\n`);
    return false;
  }
}

// ─── OTP Email ────────────────────────────────────────────────────────────────

async function sendOTPEmail(email, otp) {
  const subject = "E-Way Intelligence — Your Email Verification OTP";
  const text =
    `Your verification OTP is: ${otp}\n` +
    `This code expires in 5 minutes.\n\n` +
    `If you did not register, ignore this email.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#004848 0%,#007A7A 100%);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#FFFFCC;font-size:22px;font-weight:700;">🛡️ E-Way Intelligence System</h1>
            <p style="margin:6px 0 0;color:#B2DFDB;font-size:13px;">Secure Officer Registration</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:40px 40px 30px;">
            <h2 style="color:#004848;font-size:20px;margin:0 0 12px;">Email Verification</h2>
            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 28px;">
              Use the verification code below to confirm your email address and activate your officer account.
            </p>

            <!-- OTP BOX -->
            <div style="background:#f0f9f9;border:2px dashed #007A7A;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
              <p style="margin:0 0 8px;color:#555;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Your One-Time Password</p>
              <p style="margin:0;font-size:46px;font-weight:900;letter-spacing:14px;color:#004848;font-family:'Courier New',monospace;">${otp}</p>
            </div>

            <!-- WARNING -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#FFF8E1;border-left:4px solid #F9A825;padding:14px 16px;border-radius:0 8px 8px 0;">
                  <p style="margin:0;color:#795548;font-size:13px;">⏰ <strong>This OTP expires in 5 minutes.</strong> Do not share it with anyone.</p>
                </td>
              </tr>
            </table>

            <p style="color:#888;font-size:12px;line-height:1.6;margin:0;">
              If you did not register with E-Way Intelligence, you can safely ignore this email.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;color:#aaa;font-size:11px;">© ${new Date().getFullYear()} E-Way Intelligence System &nbsp;|&nbsp; Government Tax Intelligence Platform</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendMail({ to: email, subject, html, text });
}

// Legacy alias — keeps authController working without changes
const sendOtpEmail = sendOTPEmail;

// ─── Password Reset Email ─────────────────────────────────────────────────────

async function sendPasswordResetEmail(email, resetUrl) {
  const subject = "E-Way Intelligence — Password Reset Request";
  const text =
    `Reset your password (expires in 15 minutes):\n${resetUrl}\n\n` +
    `If you did not request this, ignore this email.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#004848 0%,#007A7A 100%);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#FFFFCC;font-size:22px;font-weight:700;">🛡️ E-Way Intelligence System</h1>
            <p style="margin:6px 0 0;color:#B2DFDB;font-size:13px;">Password Reset Request</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:40px 40px 30px;">
            <h2 style="color:#004848;font-size:20px;margin:0 0 12px;">Reset Your Password</h2>
            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 28px;">
              Click the button below to set a new password for your officer account. This link expires in 15 minutes.
            </p>

            <!-- CTA BUTTON -->
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${resetUrl}"
                 style="display:inline-block;background:linear-gradient(135deg,#004848,#007A7A);color:#FFFFCC;
                        text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:700;">
                🔑 Reset My Password
              </a>
            </div>

            <!-- WARNING -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#FFF8E1;border-left:4px solid #F9A825;padding:14px 16px;border-radius:0 8px 8px 0;">
                  <p style="margin:0;color:#795548;font-size:13px;">⏰ <strong>This link expires in 15 minutes.</strong></p>
                </td>
              </tr>
            </table>

            <p style="color:#888;font-size:12px;margin:0 0 10px;">If the button doesn't work, copy this link into your browser:</p>
            <p style="word-break:break-all;background:#f5f5f5;padding:10px 14px;border-radius:6px;font-size:11px;color:#555;margin:0 0 20px;">${resetUrl}</p>
            <p style="color:#888;font-size:12px;margin:0;">
              If you did not request this reset, your account is safe and your password has not changed.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;color:#aaa;font-size:11px;">© ${new Date().getFullYear()} E-Way Intelligence System &nbsp;|&nbsp; Government Tax Intelligence Platform</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendMail({ to: email, subject, html, text });
}

// ─── Welcome Email ────────────────────────────────────────────────────────────

async function sendWelcomeEmail(email, name) {
  const subject = "E-Way Intelligence — Welcome, Officer!";
  const text =
    `Welcome to E-Way Intelligence, ${name}!\n\n` +
    `Your account has been verified and activated.\n` +
    `You can now log in at ${process.env.CLIENT_URL || "http://localhost:5173"}/login\n\n` +
    `If you have any questions, contact your system administrator.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#004848 0%,#007A7A 100%);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#FFFFCC;font-size:22px;font-weight:700;">🛡️ E-Way Intelligence System</h1>
            <p style="margin:6px 0 0;color:#B2DFDB;font-size:13px;">Account Activated</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:40px 40px 30px;">
            <h2 style="color:#004848;font-size:20px;margin:0 0 12px;">Welcome aboard, ${name}! 🎉</h2>
            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 28px;">
              Your officer account has been successfully verified and is now active. You have full access to the
              E-Way Intelligence dashboard.
            </p>

            <!-- CTA BUTTON -->
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/login"
                 style="display:inline-block;background:linear-gradient(135deg,#004848,#007A7A);color:#FFFFCC;
                        text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:700;">
                🚀 Go to Dashboard
              </a>
            </div>

            <p style="color:#888;font-size:12px;margin:0;">
              If you did not register with E-Way Intelligence, please contact your system administrator immediately.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;color:#aaa;font-size:11px;">© ${new Date().getFullYear()} E-Way Intelligence System &nbsp;|&nbsp; Government Tax Intelligence Platform</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendMail({ to: email, subject, html, text });
}

// ─── Test Email ───────────────────────────────────────────────────────────────

async function sendTestEmail(toAddress) {
  const subject = "E-Way Intelligence — SMTP Connection Test";
  const text = "✅ This is a test email from E-Way Intelligence. SMTP is working correctly.";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#004848;border-radius:16px;overflow:hidden;padding:40px;">
        <tr><td style="text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">✅</div>
          <h2 style="color:#FFFFCC;margin:0 0 12px;">SMTP is working!</h2>
          <p style="color:#B2DFDB;font-size:15px;margin:0 0 20px;">
            Your <strong style="color:#FFFFCC;">E-Way Intelligence System</strong> email service is correctly
            connected via Gmail SMTP.
          </p>
          <p style="color:#80CBC4;font-size:13px;margin:0;">
            OTP verification emails and password reset links will now be delivered to users' inboxes.
          </p>
        </td></tr>
        <tr><td style="padding-top:28px;text-align:center;border-top:1px solid rgba(255,255,255,0.1);margin-top:28px;">
          <p style="color:#4DB6AC;font-size:11px;margin:0;">
            Sent: ${new Date().toISOString()} | Host: ${process.env.SMTP_HOST || "smtp.gmail.com"}:${process.env.SMTP_PORT || 587}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendMail({ to: toAddress, subject, html, text });
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  sendOtpEmail,          // alias → sendOTPEmail  (used by authController)
  sendOTPEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendTestEmail,
  verifySmtpConnection,
};
