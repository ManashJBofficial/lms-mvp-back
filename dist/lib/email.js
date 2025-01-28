// email.ts
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
export const sendEmail = async ({ to, subject, html }) => {
    try {
        await resend.emails.send({
            from: "hello@invoicegennie.com",
            to,
            subject,
            html,
        });
    }
    catch (error) {
        console.error("Failed to send email:", error);
        throw new Error("Failed to send email");
    }
};
