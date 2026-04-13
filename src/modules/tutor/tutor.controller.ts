import type { Request, Response } from "express";

import { sendZodError } from "../../lib/zod-response.js";
import { listTutorReviewsQuerySchema } from "../reviews/review.schemas.js";
import { listReviewsForLoggedInTutorDashboardService } from "../reviews/review.service.js";
import {
  featuredTutorsQuerySchema,
  tutorUserIdParamSchema,
  upsertTutorProfileBodySchema,
} from "./tutor.schemas.js";
import {
  getTutorProfileByUserIdService,
  listFeaturedTutorsService,
  upsertTutorProfileService,
  type UpsertTutorProfileInput,
} from "./tutor.service.js";

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

function handleTutorUpsertError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
): void {
  const message =
    error instanceof Error ? error.message : fallbackMessage;

  let statusCode = 500;
  if (message === "User not found") {
    statusCode = 404;
  } else if (message.includes("Only tutors")) {
    statusCode = 403;
  }

  res.status(statusCode).json({
    error:
      statusCode === 403
        ? "Forbidden"
        : statusCode === 404
          ? "Not Found"
          : fallbackMessage,
    message,
  });
}

export const upsertTutorProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const parsed = upsertTutorProfileBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const { profileImageUrl, ...rest } = parsed.data;
    const payload: UpsertTutorProfileInput = { ...rest };
    if (profileImageUrl !== undefined) {
      payload.profileImageUrl = profileImageUrl;
    }

    const result = await upsertTutorProfileService(userId, payload);

    res.status(200).json({
      message: "Tutor profile saved successfully",
      data: result,
    });
  } catch (error: unknown) {
    console.error("Upsert tutor profile error:", error);
    handleTutorUpsertError(res, error, "Failed to save tutor profile");
  }
};

export const listFeaturedTutors = async (req: Request, res: Response) => {
  try {
    const parsed = featuredTutorsQuerySchema.safeParse(
      normalizeQuery(req.query),
    );
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const data = await listFeaturedTutorsService(parsed.data.limit);

    res.status(200).json({
      message: "Featured tutors fetched successfully",
      data,
    });
  } catch (error: unknown) {
    console.error("List featured tutors error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to list featured tutors";
    res.status(500).json({ error: "Failed to list featured tutors", message });
  }
};

export const listMyTutorReviews = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const parsed = listTutorReviewsQuerySchema.safeParse(normalizeQuery(req.query));
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const { page, limit } = parsed.data;
    const data = await listReviewsForLoggedInTutorDashboardService(
      userId,
      page,
      limit,
    );

    res.status(200).json({
      message: "Tutor reviews fetched successfully",
      data,
    });
  } catch (error: unknown) {
    console.error("List my tutor reviews error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to list reviews";
    let statusCode = 500;
    if (message.includes("Only tutors")) {
      statusCode = 403;
    }
    res.status(statusCode).json({
      error: statusCode === 403 ? "Forbidden" : "Internal Server Error",
      message,
    });
  }
};

export const getTutorProfileByUserId = async (req: Request, res: Response) => {
  try {
    const parsed = tutorUserIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const result = await getTutorProfileByUserIdService(parsed.data.userId);
    if (!result) {
      res.status(404).json({ error: "Not Found", message: "Tutor profile not found" });
      return;
    }

    res.status(200).json({
      message: "Tutor profile fetched successfully",
      data: result,
    });
  } catch (error: unknown) {
    console.error("Get tutor profile error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch tutor profile";
    res.status(500).json({ error: "Failed to fetch tutor profile", message });
  }
};
