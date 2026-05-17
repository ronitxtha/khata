import nodemailer from "nodemailer";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import handlebars from "handlebars";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const verifyMail = async (token, email) => {
  const emailTemplateSource = fs.readFileSync(
    path.join(__dirname, "template.hbs"),
    "utf-8"
  );

  const template = handlebars.compile(emailTemplateSource);

  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const frontendLink = `${baseUrl}/verify/${encodeURIComponent(token)}`;
  const htmlToSend = template({ link: frontendLink });

  // Uses Brevo SMTP — works from cloud providers (Gmail SMTP is blocked on Render)
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_USER,  // your Brevo account email
      pass: process.env.BREVO_PASS   // Brevo SMTP password (from Settings → SMTP & API)
    },
  });

  const mailConfigurations = {
    from: `"Smart Khata" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Email Verification - Smart Khata",
    html: htmlToSend,
  };

  try {
    const info = await transporter.sendMail(mailConfigurations);
    console.log("✅ Verification email sent to:", email);
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ Email send failed:", error.message);
    throw new Error("Failed to send verification email: " + error.message);
  }
};
