const { Resend } = require("./backend/node_modules/resend");
const resend = new Resend("re_LZQNkxiZ_C5jcZUTzwJS9yGNt8gVw1Gio");

resend.emails.send({
  from: "E-Way Intelligence <onboarding@resend.dev>",
  to: "e.admin26@gmail.com",
  subject: "E-Way Intelligence — Email Service Test",
  html: `
    <div style="font-family:Arial,sans-serif;max-width:480px;padding:30px;background:#004848;border-radius:16px;color:#fff;">
      <h2 style="color:#FFFFCC;margin:0 0 16px;">✅ Email is working!</h2>
      <p style="color:#E0E0E0;margin:0 0 12px;">Your <strong>E-Way Intelligence System</strong> email service is now connected via Resend.</p>
      <p style="color:#B2DFDB;margin:0;font-size:14px;">OTP verification emails and password reset links will now be delivered directly to users' inboxes.</p>
    </div>
  `,
  text: "Email working! E-Way Intelligence email service is connected via Resend.",
}).then((r) => {
  if (r.error) {
    console.log("RESEND ERROR:", JSON.stringify(r.error, null, 2));
  } else {
    console.log("SUCCESS! Email sent. Message ID:", r.data.id);
    console.log("Check e.admin26@gmail.com inbox (also check Spam).");
  }
}).catch((e) => {
  console.log("FATAL:", e.message);
});
