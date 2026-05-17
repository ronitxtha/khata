import sgMail from "@sendgrid/mail";
import "dotenv/config";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendSuspensionMail = async (email, reason) => {
    try {
        await sgMail.send({
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL, // must be verified in SendGrid
            subject: "Account Suspended - Smart Khata",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #ef4444;">Account Suspended</h2>
                    <p>Your SmartKhata shop has been suspended by the administrator.</p>
                    <p><strong>Reason:</strong> ${reason}</p>
                    <p>Please contact support for further assistance.</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
                    <p style="color: #94a3b8; font-size: 12px;">Smart Khata Support Team</p>
                </div>
            `
        });
        console.log("Suspension email sent successfully to:", email);
    } catch (error) {
        console.error("Error sending suspension email:", error.response?.body || error.message);
    }
};
