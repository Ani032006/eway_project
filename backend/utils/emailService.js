const { Resend } = require("resend");
const nodemailer = require("nodemailer");

// ─── Strategy ────────────────────────────────────────────────────────────────
// 1. Resend API  (HTTPS port 443 — works on ANY network, even when SMTP blocked)
// 2. SMTP        (port 587/465 — may be blocked by ISPs)
// 3. Dev mode    (logs OTP/reset URL to console + returns in API response)

// ─── Resend (primary — HTTP-based, never blocked) ────────────────────────────

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key || !key.trim() || key.trim() === "re_your_api_key_here") return null;
  return new Resend(key.trim());
}

// ─── SMTP (fallback) ─────────────────────────────────────────────────────────

function getSmtpTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_USER.trim() || !SMTP_PASS || !SMTP_PASS.trim()) return null;

  const port = Number(SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user: SMTP_USER.trim(), pass: SMTP_PASS.trim() },
    tls: { rejectUnauthorized: true },
    connectionTimeout: 10000,
  });
}

// ─── Core send function ───────────────────────────────────────────────────────

async function sendMail({ to, subject, html, text }) {
  const resend = getResendClient();
  const fromAddress =
    process.env.EMAIL_FROM ||
    (process.env.SMTP_USER
      ? `E-Way Intelligence <${process.env.SMTP_USER}>`
      : "E-Way Intelligence <onboarding@resend.dev>");

  // ── 1. Try Resend (HTTPS — works even when SMTP is blocked) ─────────────────
  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: fromAddress,
        to,
        subject,
        html,
        text,
      });
      if (error) {
        throw new Error(error.message || JSON.stringify(error));
      }
      console.log(`[EMAIL:RESEND] To: ${to} | Subject: ${subject}`);
      return { devMode: false, provider: "resend" };
    } catch (err) {
      console.warn("[EMAIL] Resend failed, trying SMTP fallback:", err.message);
    }
  }

  // ── 2. Try SMTP ──────────────────────────────────────────────────────────────
  const smtp = getSmtpTransporter();
  if (smtp) {
    try {
      await smtp.sendMail({ from: fromAddress, to, subject, html, text });
      console.log(`[EMAIL:SMTP] To: ${to} | Subject: ${subject}`);
      return { devMode: false, provider: "smtp" };
    } catch (err) {
      console.warn("[EMAIL] SMTP failed:", err.message);
    }
  }

  // ── 3. Dev mode ──────────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────────");
  console.log(`[EMAIL:DEV] To: ${to}`);
  console.log(`[EMAIL:DEV] Subject: ${subject}`);
  if (text) console.log(`[EMAIL:DEV] ${text}`);
  console.log("─────────────────────────────────────────\n");
  return { devMode: true };
}

// ─── OTP Email ───────────────────────────────────────────────────────────────

async function sendOtpEmail(email, otp) {
  const subject = "E-Way Intelligence — Your Email Verification OTP";
  const text = `Your verification OTP is: ${otp}\nThis code expires in 5 minutes.\n\nIf you did not register, ignore this email.`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

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

            <p style="color:#888;font-size:12px;line-height:1.6;margin:0;">If you did not register with E-Way Intelligence, you can safely ignore this email.</p>
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

// ─── Password Reset Email ─────────────────────────────────────────────────────

async function sendPasswordResetEmail(email, resetUrl) {
  const subject = "E-Way Intelligence — Password Reset Request";
  const text = `Reset your password (expires in 15 minutes):\n${resetUrl}\n\nIf you did not request this, ignore this email.`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

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
              Click the button below to set a new password for your officer account.
            </p>

            <!-- CTA BUTTON -->
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#004848,#007A7A);color:#FFFFCC;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:700;">
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
            <p style="color:#888;font-size:12px;margin:0;">If you did not request this reset, your account is safe and your password has not changed.</p>
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

module.exports = { sendOtpEmail, sendPasswordResetEmail };
