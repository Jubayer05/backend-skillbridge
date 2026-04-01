import { type Router, Router as ExpressRouter } from "express";
import type { RequestHandler } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import {
  banUser,
  getUser,
  impersonateUser,
  listUserSessions,
  listUsers,
  removeUser,
  revokeAllUserSessions,
  revokeUserSession,
  setUserPassword,
  setUserRole,
  stopImpersonating,
  unbanUser,
  updateUser,
} from "./user.controller.js";

const userRoutes: Router = ExpressRouter();

// All user-management routes require a valid admin session.
// authenticate  → validates session cookie, attaches req.user
// authorize     → checks req.user.role against the allowed list

const adminOnly = [
  authenticate as RequestHandler,
  authorize("ADMIN") as RequestHandler,
];

// ── Static routes first (must come before /:id to avoid shadowing) ─────────

// POST /users/stop-impersonating
userRoutes.post(
  "/stop-impersonating",
  authenticate as RequestHandler,
  stopImpersonating as RequestHandler,
);

// DELETE /users/sessions/:token
userRoutes.delete(
  "/sessions/:token",
  ...adminOnly,
  revokeUserSession as RequestHandler,
);

// ── Collection routes ──────────────────────────────────────────────────────

// GET /users
userRoutes.get("/", ...adminOnly, listUsers as RequestHandler);

// ── Per-user routes ────────────────────────────────────────────────────────

// GET /users/:id
userRoutes.get("/:id", ...adminOnly, getUser as RequestHandler);

// PATCH /users/:id
userRoutes.patch("/:id", ...adminOnly, updateUser as RequestHandler);

// DELETE /users/:id
userRoutes.delete("/:id", ...adminOnly, removeUser as RequestHandler);

// PATCH /users/:id/role
userRoutes.patch("/:id/role", ...adminOnly, setUserRole as RequestHandler);

// PATCH /users/:id/password
userRoutes.patch("/:id/password", ...adminOnly, setUserPassword as RequestHandler);

// POST /users/:id/ban
userRoutes.post("/:id/ban", ...adminOnly, banUser as RequestHandler);

// POST /users/:id/unban
userRoutes.post("/:id/unban", ...adminOnly, unbanUser as RequestHandler);

// GET /users/:id/sessions
userRoutes.get("/:id/sessions", ...adminOnly, listUserSessions as RequestHandler);

// DELETE /users/:id/sessions
userRoutes.delete("/:id/sessions", ...adminOnly, revokeAllUserSessions as RequestHandler);

// POST /users/:id/impersonate
userRoutes.post("/:id/impersonate", ...adminOnly, impersonateUser as RequestHandler);

export default userRoutes;
