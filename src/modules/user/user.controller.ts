import type { Request, Response } from "express";
import { getHeadersAsWebHeaders, forwardSetCookie } from "../auth/auth.service.js";

// Express route params are always strings at runtime; this cast silences the
// "string | string[]" TS error that arises with strict exactOptionalPropertyTypes.
function param(req: Request, key: string): string {
  return (req.params as Record<string, string>)[key] ?? "";
}
import {
  banUserService,
  getUserService,
  impersonateUserService,
  listUserSessionsService,
  listUsersService,
  removeUserService,
  revokeAllUserSessionsService,
  revokeUserSessionService,
  setUserPasswordService,
  setUserRoleService,
  stopImpersonatingService,
  unbanUserService,
  updateUserService,
  type ListUsersQuery,
} from "./user.service.js";

// ─── List Users ───────────────────────────────────────────────────────────
// GET /users
// Supports optional query params: searchValue, searchField, searchOperator,
// limit, offset, sortBy, sortDirection, filterField, filterValue, filterOperator

export const listUsers = async (req: Request, res: Response) => {
  try {
    const {
      searchValue,
      searchField,
      searchOperator,
      limit,
      offset,
      sortBy,
      sortDirection,
      filterField,
      filterValue,
      filterOperator,
    } = req.query as Record<string, string | undefined>;

    // Build the query object only with defined keys to satisfy exactOptionalPropertyTypes
    const query: ListUsersQuery = {};
    if (searchValue) query.searchValue = searchValue;
    if (searchField) query.searchField = searchField as "email" | "name";
    if (searchOperator) query.searchOperator = searchOperator as "contains" | "starts_with" | "ends_with";
    if (limit) query.limit = Number(limit);
    if (offset) query.offset = Number(offset);
    if (sortBy) query.sortBy = sortBy;
    if (sortDirection) query.sortDirection = sortDirection as "asc" | "desc";
    if (filterField) query.filterField = filterField;
    if (filterValue) query.filterValue = filterValue;
    if (filterOperator) query.filterOperator = filterOperator;

    const result = await listUsersService(query, getHeadersAsWebHeaders(req));
    res.status(200).json({ message: "Users fetched successfully", data: result });
  } catch (error: unknown) {
    console.error("List users error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch users";
    res.status(500).json({ error: "Failed to fetch users", message });
  }
};

// ─── Get User ─────────────────────────────────────────────────────────────
// GET /users/:id

export const getUser = async (req: Request, res: Response) => {
  try {
    const id = param(req, "id");
    if (!id) {
      res.status(400).json({ error: "User id is required" });
      return;
    }

    const result = await getUserService(id, getHeadersAsWebHeaders(req));
    if (!result) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }

    res.status(200).json({ message: "User fetched successfully", data: result });
  } catch (error: unknown) {
    console.error("Get user error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch user";
    res.status(500).json({ error: "Failed to fetch user", message });
  }
};

// ─── Update User ──────────────────────────────────────────────────────────
// PATCH /users/:id

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = param(req, "id");
    const data = req.body as Record<string, unknown>;

    if (!userId) {
      res.status(400).json({ error: "User id is required" });
      return;
    }
    if (!data || Object.keys(data).length === 0) {
      res.status(400).json({ error: "Request body must contain fields to update" });
      return;
    }

    const result = await updateUserService(userId, data, getHeadersAsWebHeaders(req));
    res.status(200).json({ message: "User updated successfully", data: result });
  } catch (error: unknown) {
    console.error("Update user error:", error);
    const message = error instanceof Error ? error.message : "Failed to update user";
    res.status(500).json({ error: "Failed to update user", message });
  }
};

// ─── Remove User ──────────────────────────────────────────────────────────
// DELETE /users/:id

export const removeUser = async (req: Request, res: Response) => {
  try {
    const userId = param(req, "id");
    if (!userId) {
      res.status(400).json({ error: "User id is required" });
      return;
    }

    await removeUserService(userId, getHeadersAsWebHeaders(req));
    res.status(200).json({ message: "User removed successfully" });
  } catch (error: unknown) {
    console.error("Remove user error:", error);
    const message = error instanceof Error ? error.message : "Failed to remove user";
    res.status(500).json({ error: "Failed to remove user", message });
  }
};

// ─── Set User Role ────────────────────────────────────────────────────────
// PATCH /users/:id/role

export const setUserRole = async (req: Request, res: Response) => {
  try {
    const userId = param(req, "id");
    const { role } = req.body as { role?: string };

    if (!userId) {
      res.status(400).json({ error: "User id is required" });
      return;
    }
    if (!role) {
      res.status(400).json({ error: "role is required" });
      return;
    }

    const result = await setUserRoleService(userId, role, getHeadersAsWebHeaders(req));
    res.status(200).json({ message: "User role updated successfully", data: result });
  } catch (error: unknown) {
    console.error("Set role error:", error);
    const message = error instanceof Error ? error.message : "Failed to set role";
    res.status(500).json({ error: "Failed to set role", message });
  }
};

// ─── Set User Password ────────────────────────────────────────────────────
// PATCH /users/:id/password

export const setUserPassword = async (req: Request, res: Response) => {
  try {
    const userId = param(req, "id");
    const { newPassword } = req.body as { newPassword?: string };

    if (!userId) {
      res.status(400).json({ error: "User id is required" });
      return;
    }
    if (!newPassword) {
      res.status(400).json({ error: "newPassword is required" });
      return;
    }

    const result = await setUserPasswordService(userId, newPassword, getHeadersAsWebHeaders(req));
    res.status(200).json({ message: "User password updated successfully", data: result });
  } catch (error: unknown) {
    console.error("Set password error:", error);
    const message = error instanceof Error ? error.message : "Failed to set password";
    res.status(500).json({ error: "Failed to set password", message });
  }
};

// ─── Ban User ─────────────────────────────────────────────────────────────
// POST /users/:id/ban

export const banUser = async (req: Request, res: Response) => {
  try {
    const userId = param(req, "id");
    const { banReason, banExpiresIn } = req.body as {
      banReason?: string;
      banExpiresIn?: number;
    };

    if (!userId) {
      res.status(400).json({ error: "User id is required" });
      return;
    }

    await banUserService(userId, banReason, banExpiresIn, getHeadersAsWebHeaders(req));
    res.status(200).json({ message: "User banned successfully" });
  } catch (error: unknown) {
    console.error("Ban user error:", error);
    const message = error instanceof Error ? error.message : "Failed to ban user";
    res.status(500).json({ error: "Failed to ban user", message });
  }
};

// ─── Unban User ───────────────────────────────────────────────────────────
// POST /users/:id/unban

export const unbanUser = async (req: Request, res: Response) => {
  try {
    const userId = param(req, "id");
    if (!userId) {
      res.status(400).json({ error: "User id is required" });
      return;
    }

    await unbanUserService(userId, getHeadersAsWebHeaders(req));
    res.status(200).json({ message: "User unbanned successfully" });
  } catch (error: unknown) {
    console.error("Unban user error:", error);
    const message = error instanceof Error ? error.message : "Failed to unban user";
    res.status(500).json({ error: "Failed to unban user", message });
  }
};

// ─── List User Sessions ───────────────────────────────────────────────────
// GET /users/:id/sessions

export const listUserSessions = async (req: Request, res: Response) => {
  try {
    const userId = param(req, "id");
    if (!userId) {
      res.status(400).json({ error: "User id is required" });
      return;
    }

    const result = await listUserSessionsService(userId, getHeadersAsWebHeaders(req));
    res.status(200).json({ message: "Sessions fetched successfully", data: result });
  } catch (error: unknown) {
    console.error("List sessions error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch sessions";
    res.status(500).json({ error: "Failed to fetch sessions", message });
  }
};

// ─── Revoke User Session ──────────────────────────────────────────────────
// DELETE /users/sessions/:token

export const revokeUserSession = async (req: Request, res: Response) => {
  try {
    const sessionToken = param(req, "token");
    if (!sessionToken) {
      res.status(400).json({ error: "sessionToken is required" });
      return;
    }

    await revokeUserSessionService(sessionToken, getHeadersAsWebHeaders(req));
    res.status(200).json({ message: "Session revoked successfully" });
  } catch (error: unknown) {
    console.error("Revoke session error:", error);
    const message = error instanceof Error ? error.message : "Failed to revoke session";
    res.status(500).json({ error: "Failed to revoke session", message });
  }
};

// ─── Revoke All User Sessions ─────────────────────────────────────────────
// DELETE /users/:id/sessions

export const revokeAllUserSessions = async (req: Request, res: Response) => {
  try {
    const userId = param(req, "id");
    if (!userId) {
      res.status(400).json({ error: "User id is required" });
      return;
    }

    await revokeAllUserSessionsService(userId, getHeadersAsWebHeaders(req));
    res.status(200).json({ message: "All sessions revoked successfully" });
  } catch (error: unknown) {
    console.error("Revoke all sessions error:", error);
    const message = error instanceof Error ? error.message : "Failed to revoke sessions";
    res.status(500).json({ error: "Failed to revoke sessions", message });
  }
};

// ─── Impersonate User ─────────────────────────────────────────────────────
// POST /users/:id/impersonate

export const impersonateUser = async (req: Request, res: Response) => {
  try {
    const userId = param(req, "id");
    if (!userId) {
      res.status(400).json({ error: "User id is required" });
      return;
    }

    const result = await impersonateUserService(userId, getHeadersAsWebHeaders(req));
    forwardSetCookie(res, result.headers);
    res.status(200).json({ message: "Impersonation started", data: result.response });
  } catch (error: unknown) {
    console.error("Impersonate user error:", error);
    const message = error instanceof Error ? error.message : "Failed to impersonate user";
    res.status(500).json({ error: "Failed to impersonate user", message });
  }
};

// ─── Stop Impersonating ───────────────────────────────────────────────────
// POST /users/stop-impersonating

export const stopImpersonating = async (req: Request, res: Response) => {
  try {
    const result = await stopImpersonatingService(getHeadersAsWebHeaders(req));
    forwardSetCookie(res, result.headers);
    res.status(200).json({ message: "Impersonation stopped", data: result.response });
  } catch (error: unknown) {
    console.error("Stop impersonating error:", error);
    const message = error instanceof Error ? error.message : "Failed to stop impersonating";
    res.status(500).json({ error: "Failed to stop impersonating", message });
  }
};
