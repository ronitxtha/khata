import sgMail from "@sendgrid/mail";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import handlebars from "handlebars";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

  try {
    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL, // must be verified in SendGrid
      subject: "Email Verification - Smart Khata",
      html: htmlToSend,
    });
    console.log("✅ Verification email sent to:", email);
  } catch (error) {
    console.error("❌ Email send failed:", error.response?.body || error.message);
    throw new Error("Failed to send verification email: " + error.message);
  }
};
