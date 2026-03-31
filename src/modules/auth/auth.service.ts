import type { Request, Response } from "express";
import { authClient } from "../../lib/auth";

// ─── Header Helpers ───────────────────────────────────────────────────────────

export function getHeadersFromRequest(req: Request): Record<string, string> {
  const headers: Record<string, string> = {};

  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      const headerValue = Array.isArray(value) ? value[0] : value;
      if (headerValue) {
        headers[key.toLowerCase()] = headerValue;
      }
    }
  }

  // Reconstruct cookie header from parsed cookies if raw header is missing
  if (req.cookies && Object.keys(req.cookies).length > 0) {
    const cookieString = Object.entries(req.cookies as Record<string, string>)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");

    headers["cookie"] = headers["cookie"]
      ? `${headers["cookie"]}; ${cookieString}`
      : cookieString;
  }

  return headers;
}

export function getHeadersAsWebHeaders(req: Request): Headers {
  return new Headers(getHeadersFromRequest(req));
}

export function forwardSetCookie(
  res: Response,
  headers: Headers | undefined,
): void {
  if (!headers) return;

  // Node/undici Headers exposes getSetCookie(); fall back to get("set-cookie")
  const anyHeaders = headers as Headers & { getSetCookie?: () => string[] };
  const setCookies: string[] =
    (typeof anyHeaders.getSetCookie === "function"
      ? anyHeaders.getSetCookie()
      : null) ??
    (headers.get("set-cookie") ? [headers.get("set-cookie") as string] : []);

  if (setCookies.length > 0) {
    res.setHeader("Set-Cookie", setCookies);
  }
}

// ─── Auth Services ────────────────────────────────────────────────────────────

export const registerService = async (payload: unknown, headers: Headers) => {
  return authClient.api.signUpEmail({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: payload as any,
    headers,
    returnHeaders: true,
  });
};

export const loginService = async (payload: unknown, headers: Headers) => {
  return authClient.api.signInEmail({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: payload as any,
    headers,
    returnHeaders: true,
  });
};

export const verifyEmailService = async (
  payload: { email: string; callbackURL?: string },
  headers: Headers,
) => {
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
  const callbackURL = payload.callbackURL ?? `${frontendUrl}/auth/verify-email`;

  return authClient.api.sendVerificationEmail({
    body: { email: payload.email, callbackURL },
    headers,
    returnHeaders: true,
  });
};

export const forgotPasswordService = async (
  payload: { email: string },
  headers: Headers,
) => {
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
  const redirectTo = `${frontendUrl}/auth/reset-password`;

  return authClient.api.requestPasswordReset({
    body: { email: payload.email, redirectTo },
    headers,
    returnHeaders: true,
  });
};

export const resetPasswordService = async (
  payload: unknown,
  headers: Headers,
) => {
  return authClient.api.resetPassword({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: payload as any,
    headers,
    returnHeaders: true,
  });
};

export const updatePasswordService = async (
  payload: { newPassword: string; currentPassword: string },
  headers: Headers,
) => {
  if (!payload.newPassword || !payload.currentPassword) {
    throw new Error("newPassword and currentPassword are required");
  }

  // Strip authorization header – session cookie is the source of truth
  headers.delete("authorization");

  return authClient.api.changePassword({
    body: payload,
    headers,
    returnHeaders: true,
  });
};

export const logoutService = async (headers: Headers) => {
  return authClient.api.signOut({
    headers,
    returnHeaders: true,
  });
};
