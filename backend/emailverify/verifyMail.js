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

  const frontendLink = `http://localhost:5173/verify/${encodeURIComponent(token)}`;
  const htmlToSend = template({ link: frontendLink });

  // Strip spaces from App Password (Google shows it with spaces, but it must be used without)
  const appPassword = (process.env.MAIL_PASS || "").replace(/\s+/g, "");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: appPassword,
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
