import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // IMPORTANT for Gmail SSL
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS, // MUST be App Password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: `"Khata App" <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log(`✅ Email sent to ${to}`);

  } catch (err) {
    console.error(`❌ Email failed:`, err.message);
  }
};