import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import {
  adminAc,
  defaultRoles,
  userAc,
} from "better-auth/plugins/admin/access";
import { sendResetPasswordEmail, sendVerificationEmail } from "./email.js";
import { prisma } from "./prisma.js";

// Short session tests: set in .env (never enable in production):
//   SESSION_TEST_SHORT=true
//   SESSION_TEST_EXPIRES_SECONDS=10
//   SESSION_DISABLE_SLIDING=true   ← required for fixed 10s TTL; otherwise updateAge rolls the session on every request
const sessionTestShort =
  process.env.SESSION_TEST_SHORT === "true" &&
  process.env.NODE_ENV !== "production";

export const auth = betterAuth({
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
    defaultCookieAttributes: {
      sameSite: "none" as const,
      secure: true,
    },
  },

  session: {
    expiresIn: sessionTestShort
      ? Number(process.env.SESSION_TEST_EXPIRES_SECONDS ?? "10")
      : 60 * 60 * 24 * 7, // 7 days
    updateAge: sessionTestShort
      ? Number(process.env.SESSION_TEST_UPDATE_AGE_SECONDS ?? "86400")
      : 60 * 60 * 24, // roll session if older than 1 day (sliding window)
    // When false (default in test mode below), Better Auth keeps extending expiresAt on each getSession once (expiresIn - updateAge) has passed — so a 10s session never appears to expire while you click around.
    ...(sessionTestShort &&
    process.env.SESSION_DISABLE_SLIDING !== "false" && {
      disableSessionRefresh: true,
    }),
  },

  plugins: [
    admin({
      // Permission lookup is acRoles[session.user.role] (case-sensitive).
      // defaultRoles only has "admin" and "user"; our DB uses ADMIN/STUDENT/TUTOR.
      defaultRole: "STUDENT",
      adminRoles: ["admin", "ADMIN"],
      roles: {
        ...defaultRoles,
        ADMIN: adminAc,
        STUDENT: userAc,
        TUTOR: userAc,
      },
    }),
  ],
});

export const authClient = auth;

export default auth;
