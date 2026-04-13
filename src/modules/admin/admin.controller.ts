import type { Request, Response } from "express";
import { z } from "zod";

import { sendZodError } from "../../lib/zod-response.js";
import { getHeadersAsWebHeaders } from "../auth/auth.service.js";
import {
  getAdminStatsService,
  listAdminBookingsService,
  listAdminUsersService,
  patchAdminUserService,
} from "./admin.service.js";
import {
  listAdminBookingsQuerySchema,
  listAdminUsersQuerySchema,
  patchAdminUserBodySchema,
} from "./admin.schemas.js";

function normalizeQuery(
  query: Request["query"],
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    const first = Array.isArray(value) ? value[0] : value;
    out[key] = typeof first === "string" ? first : undefined;
  }
  return out;
}

/** Better Auth / Prisma user ids are strings and may not be RFC UUIDs. */
const userIdParamSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "id is required")
    .max(256, "id is too long"),
});

export const listAdminUsers = async (req: Request, res: Response) => {
  try {
    const parsed = listAdminUsersQuerySchema.safeParse(
      normalizeQuery(req.query),
    );
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const data = await listAdminUsersService(parsed.data);
    res.status(200).json({ message: "Users fetched successfully", data });
  } catch (error: unknown) {
    console.error("Admin list users error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch users";
    res.status(500).json({ error: "Failed to fetch users", message });
  }
};

export const patchAdminUser = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const paramsParsed = userIdParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      sendZodError(res, paramsParsed.error);
      return;
    }

    const bodyParsed = patchAdminUserBodySchema.safeParse(req.body);
    if (!bodyParsed.success) {
      sendZodError(res, bodyParsed.error);
      return;
    }

    const data = await patchAdminUserService(
      adminId,
      paramsParsed.data.id,
      bodyParsed.data,
      getHeadersAsWebHeaders(req),
    );

    res.status(200).json({ message: "User updated successfully", data });
  } catch (error: unknown) {
    console.error("Admin patch user error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update user";
    const status =
      message === "User not found"
        ? 404
        : message.startsWith("Cannot ")
          ? 400
          : 500;
    res.status(status).json({ error: "Failed to update user", message });
  }
};

export const listAdminBookings = async (req: Request, res: Response) => {
  try {
    const parsed = listAdminBookingsQuerySchema.safeParse(
      normalizeQuery(req.query),
    );
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const data = await listAdminBookingsService(parsed.data);
    res.status(200).json({ message: "Bookings fetched successfully", data });
  } catch (error: unknown) {
    console.error("Admin list bookings error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch bookings";
    res.status(500).json({ error: "Failed to fetch bookings", message });
  }
};

export const getAdminStats = async (_req: Request, res: Response) => {
  try {
    const data = await getAdminStatsService();
    res.status(200).json({ message: "Stats fetched successfully", data });
  } catch (error: unknown) {
    console.error("Admin stats error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch stats";
    res.status(500).json({ error: "Failed to fetch stats", message });
  }
};
