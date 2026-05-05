import nodemailer from "nodemailer";
import "dotenv/config";

export const sendSuspensionMail = async (email, reason) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.MAIL_USER,
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
