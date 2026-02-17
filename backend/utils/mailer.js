// backend/utils/mailer.js
import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text }) => {
  try {
    // Create a transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER, // your Gmail address
        pass: process.env.MAIL_PASS, // NEW App Password
      },
    });

    const info = await transporter.sendMail({
      from: process.env.MAIL_USER, // from same as MAIL_USER
      to,
      subject,
      text,
    });

    console.log(`✅ Email successfully sent to ${to}`);
    console.log(`Message ID: ${info.messageId}`);

  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message);
  }
};
