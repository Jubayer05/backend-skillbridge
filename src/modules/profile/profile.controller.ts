import type { Request, Response } from "express";

import { sendZodError } from "../../lib/zod-response.js";
import {
  updateProfileBodySchema,
  type UpdateProfileBody,
} from "./profile.schemas.js";
import {
  getProfileService,
  updateProfileService,
  type UpdateProfileInput,
} from "./profile.service.js";

function toUpdateProfileInput(body: UpdateProfileBody): UpdateProfileInput {
  const data: UpdateProfileInput = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.phoneNumber !== undefined) data.phoneNumber = body.phoneNumber;
  if (body.bio !== undefined) data.bio = body.bio;
  if (body.image !== undefined) data.image = body.image;
  return data;
}

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const result = await getProfileService(userId);
    if (!result) {
      res.status(404).json({ error: "Not Found", message: "Profile not found" });
      return;
    }

    res.status(200).json({ message: "Profile fetched successfully", data: result });
  } catch (error: unknown) {
    console.error("Get profile error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch profile";
    res.status(500).json({ error: "Failed to fetch profile", message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const parsed = updateProfileBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const existingProfile = await getProfileService(userId);
    if (!existingProfile) {
      res.status(404).json({ error: "Not Found", message: "Profile not found" });
      return;
    }

    const data = toUpdateProfileInput(parsed.data);
    const result = await updateProfileService(userId, data);

    res.status(200).json({ message: "Profile updated successfully", data: result });
  } catch (error: unknown) {
    console.error("Update profile error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update profile";
    res.status(500).json({ error: "Failed to update profile", message });
  }
};
