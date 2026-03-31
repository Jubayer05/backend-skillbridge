import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { sendResetPasswordEmail, sendVerificationEmail } from "./email.js";
import { prisma } from "./prisma.js";

export const authClient = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  trustedOrigins: [
    (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  ],

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
        token,
      }: {
        user: { email: string; name?: string | null };
        url: string;
        token: string;
      },
      _request?: Request,
    ) => {
      const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
      const verificationUrl = `${frontendUrl}/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;

      await sendVerificationEmail(
        user.email,
        verificationUrl,
        user.name ?? undefined,
      );
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string" as const,
        defaultValue: "STUDENT",
        input: true,
        output: true,
      },
    },
  },

  advanced: {
    cookiePrefix: "skillbridge",
    // SameSite=None + Secure is required when the frontend and backend
    // are on different domains (e.g. different Vercel deployments).
    // Without this the browser blocks the session cookie on cross-site
    // POST requests, causing logout / protected routes to return 401.
    defaultCookieAttributes: {
      sameSite: "none" as const,
      secure: true,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh if older than 1 day
  },
});
