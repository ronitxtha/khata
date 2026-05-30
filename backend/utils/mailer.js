import sgMail from "@sendgrid/mail";
import "dotenv/config";

export const sendEmail = async ({ to, subject, text }) => {
  // Guard: log and throw if credentials are missing
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    const msg = `❌ [mailer] SENDGRID_API_KEY or SENDGRID_FROM_EMAIL env var is missing — cannot send email to ${to}`;
    console.error(msg);
    throw new Error(msg);
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL, // must be verified in SendGrid
    subject,
    text,
    html: text.replace(/\n/g, "<br>"),
  };

  // Throws on SendGrid failure — caller is responsible for catching
  await sgMail.send(msg);

  console.log(`✅ [mailer] SendGrid email sent successfully to ${to} | Subject: "${subject}"`);
};