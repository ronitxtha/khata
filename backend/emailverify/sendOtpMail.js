import nodemailer from "nodemailer";
import "dotenv/config";

export const sendOtpMail = async (email, otp) => {
    try {
        // Uses Brevo SMTP — works from cloud providers (Gmail SMTP is blocked on Render)
        const transporter = nodemailer.createTransport({
            host: 'smtp-relay.brevo.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.BREVO_USER,  // your Brevo account email
                pass: process.env.BREVO_PASS   // Brevo SMTP password (from Settings → SMTP & API)
            }
        });

        const mailOptions = {
            from: `"Smart Khata" <${process.env.BREVO_USER}>`,
            to: email,
            subject: 'Password reset OTP',
            html: `<p>Your OTP for password reset is: <b>${otp}</b>. It is valid for 10 minutes.</p>`
        };

        await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully');
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw error;
    }
};