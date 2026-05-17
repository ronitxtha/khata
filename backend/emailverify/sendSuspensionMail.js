import nodemailer from "nodemailer";
import "dotenv/config";

export const sendSuspensionMail = async (email, reason) => {
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
            subject: 'Account Suspended',
            html: `<h2>Account Suspended</h2><p>Your SmartKhata shop has been suspended by the administrator.</p><p><b>Reason:</b> ${reason}</p><p>Please contact support for further assistance.</p>`
        };

        await transporter.sendMail(mailOptions);
        console.log('Suspension email sent successfully');
    } catch (error) {
        console.error('Error sending suspension email:', error);
    }
};
