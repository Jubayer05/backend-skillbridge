import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { sendResetPasswordEmail, sendVerificationEmail } from "./email";
import { prisma } from "./prisma";

export const authClient = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  trustedOrigins: [process.env.FRONTEND_URL as string],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    sendResetPassword: async (
      {
        user,
        url,
      }: {
        user: { email: string; name?: string | null };
        url: string;
        token: string;
      },
      _request?: Request,
    ) => {
      // Fire-and-forget to avoid timing attacks
      void sendResetPasswordEmail(
        user.email,
        url,
        user.name ?? undefined,
      ).catch((error: unknown) => {
        console.error("Failed to send reset password email:", error);
      });
    },
    onPasswordReset: async (
      { user }: { user: { email: string } },
      _request?: Request,
    ) => {
      console.log(`Password for user ${user.email} has been reset.`);
    },
  },

  emailVerification: {
    sendVerificationEmail: async (
      {
        user,
        url,
      }: {
        user: { email: string; name?: string | null };
        url: string;
        token: string;
      },
      _request?: Request,
    ) => {
      await sendVerificationEmail(user.email, url, user.name ?? undefined);
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string" as const,
        defaultValue: "STUDENT",
        input: false,
        output: true,
      },
    },
  },

  advanced: {
    cookiePrefix: "skillbridge",
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh if older than 1 day
  },
});
