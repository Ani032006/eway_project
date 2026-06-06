/**
 * Standalone SMTP test script.
 * Run from the `frontend/` folder:
 *   node test-email.js your.address@gmail.com
 *
 * This loads the same .env and the same emailService the backend uses —
 * so if this works, registration/forgot-password emails will work too.
 */

const path = require("path");
require(path.join(__dirname, "backend", "node_modules", "dotenv")).config({
  path: path.join(__dirname, "backend", ".env"),
});

const { sendTestEmail, verifySmtpConnection } = require("./backend/utils/emailService");

const recipient = process.argv[2];

if (!recipient) {
  console.error("\nUsage: node test-email.js <recipient-email>\n");
  console.error("Example: node test-email.js e.admin26@gmail.com\n");
  process.exit(1);
}

(async () => {
  console.log("\n══════════════════════════════════════════════");
  console.log("  E-Way Intelligence — SMTP Diagnostic Test");
  console.log("══════════════════════════════════════════════\n");

  console.log("Step 1: Verifying SMTP connection …");
  const verified = await verifySmtpConnection();

  if (!verified) {
    console.error(
      "\n❌ SMTP connection could not be verified. Fix the issues above, then re-run this script.\n"
    );
    process.exit(1);
  }

  console.log(`\nStep 2: Sending test email to ${recipient} …`);
  const result = await sendTestEmail(recipient);

  if (result.devMode) {
    console.error("\n❌ Test email was NOT delivered (SMTP failed).");
    console.error("   See the error details printed above ↑");
    console.error("   Fix the SMTP issue, restart the server, and try again.\n");
    process.exit(1);
  }

  console.log(`\n✅ SUCCESS — test email sent via port ${result.port}!`);
  console.log(`   Check ${recipient} inbox (also check the Spam/Junk folder).\n`);
})();
