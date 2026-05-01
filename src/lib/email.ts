/**
 * Email service abstraction.
 *
 * In development: logs email to console.
 * In production: integrate SMTP / Resend / SendGrid by implementing transport.
 *
 * Usage:
 *   await sendEmail({ to: "user@co.com", subject: "...", html: "..." });
 */

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

const DEFAULT_FROM = "GreenPeat AgriCoX <noreply@greenpeat.vn>";

/**
 * Send an email. Currently logs to console for development.
 * Replace the body of this function with an actual transport (Resend, Nodemailer, etc.)
 * when ready for production.
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean }> {
  const { to, subject, html, from = DEFAULT_FROM } = payload;

  // --- Production transport (uncomment when ready) ---
  // import { Resend } from "resend";
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ from, to, subject, html });

  // --- Development: console log ---
  if (process.env.NODE_ENV !== "production") {
    console.log("\n📧 ══════════════════════════════════════");
    console.log(`  From:    ${from}`);
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log("  Body:    (HTML email - see below)");
    console.log("══════════════════════════════════════════");
    console.log(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 300));
    console.log("══════════════════════════════════════════\n");
  }

  return { success: true };
}
