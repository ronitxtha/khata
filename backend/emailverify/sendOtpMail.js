import sgMail from "@sendgrid/mail";
import "dotenv/config";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendOtpMail = async (email, otp) => {
    try {
        await sgMail.send({
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL, // must be verified in SendGrid
            subject: "Password Reset OTP - Smart Khata",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #6366f1;">Smart Khata</h2>
                    <p>You requested a password reset. Use the OTP below:</p>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366f1; padding: 16px 0;">
                        ${otp}
                    </div>
                    <p style="color: #64748b; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
                    <p style="color: #94a3b8; font-size: 12px;">If you did not request this, please ignore this email.</p>
                </div>
            `
        });
        console.log("OTP email sent successfully to:", email);
    } catch (error) {
        console.error("Error sending OTP email:", error.response?.body || error.message);
        throw error;
    }
};