"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const prisma_1 = require("better-auth/adapters/prisma");
const db_1 = __importDefault(require("../config/db"));
// import { sendEmail } from "@/lib/email"; // your email sending function
// import { generateResetPasswordEmail } from "@/utils/emailTemplate";
exports.auth = (0, better_auth_1.betterAuth)({
    database: (0, prisma_1.prismaAdapter)(db_1.default, {
        provider: "mysql",
    }),
    emailAndPassword: {
        enabled: true,
        // sendResetPassword: async ({ user, url, token }, request) => {
        //   const emailContent = generateResetPasswordEmail(user, url);
        //   await sendEmail({
        //     to: user.email,
        //     subject: "Reset your password",
        //     html: emailContent,
        //   });
        // },
        autoSignIn: false,
    },
});
