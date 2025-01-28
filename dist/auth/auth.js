import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "../config/config";
import { sendEmail } from "../lib/email";
import { generateResetPasswordEmail } from "../utils/emailTemplate";
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mysql",
    }),
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url, token }, request) => {
            const emailContent = generateResetPasswordEmail(user, url);
            await sendEmail({
                to: user.email,
                subject: "Reset your password",
                html: emailContent,
            });
        },
        autoSignIn: false,
    },
});
