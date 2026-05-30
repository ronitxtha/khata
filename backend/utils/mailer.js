import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text }) => {
  // Guard: log and throw if credentials are missing
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    const msg = `❌ [mailer] MAIL_USER or MAIL_PASS env var is missing — cannot send email to ${to}`;
    console.error(msg);
    throw new Error(msg);
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Throws on SMTP failure — caller is responsible for catching
  await transporter.sendMail({
    from: `"Khata App" <${process.env.MAIL_USER}>`,
    to,
    subject,
    text,
  });

  console.log(`✅ [mailer] Email sent successfully to ${to} | Subject: "${subject}"`);
};