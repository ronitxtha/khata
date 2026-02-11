import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text }) => {
  try {
    // Create transporter using your email provider
    const transporter = nodemailer.createTransport({
      service: "gmail", // or your email provider
      auth: {
        user: process.env.MAIL_USER, // your email
        pass: process.env.MAIL_PASS, // app password or email password
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });

    console.log("Email sent to", to);
  } catch (err) {
    console.error("Error sending email:", err);
  }
};
