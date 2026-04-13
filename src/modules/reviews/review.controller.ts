import type { Request, Response } from "express";

import { sendZodError } from "../../lib/zod-response.js";
import {
  createReviewBodySchema,
  listTutorReviewsQuerySchema,
  reviewIdParamSchema,
} from "./review.schemas.js";
import {
  createReviewService,
  deleteReviewAdminService,
  getReviewByIdService,
} from "./review.service.js";

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

function handleReviewError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
): void {
  const message =
    error instanceof Error ? error.message : fallbackMessage;

  let statusCode = 500;
  if (
    message === "Booking not found or not eligible for review" ||
    message === "Review not found"
  ) {
    statusCode = 404;
  } else if (message === "Review already submitted for this booking") {
    statusCode = 409;
  } else if (message.includes("Only students")) {
    statusCode = 403;
  } else if (
    message.includes("must be") ||
    message.includes("Invalid") ||
    message.includes("required")
  ) {
    statusCode = 400;
  } else if (message === "User not found") {
    statusCode = 404;
  }

  res.status(statusCode).json({
    error:
      statusCode === 400
        ? "Validation Error"
        : statusCode === 403
          ? "Forbidden"
          : statusCode === 404
            ? "Not Found"
            : statusCode === 409
              ? "Conflict"
              : fallbackMessage,
    message,
  });
}

export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const parsed = createReviewBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const data = await createReviewService(userId, parsed.data);

    res.status(201).json({
      message: "Review created successfully",
      data,
    });
  } catch (error: unknown) {
    console.error("Create review error:", error);
    handleReviewError(res, error, "Failed to create review");
  }
};

export const getReviewById = async (req: Request, res: Response) => {
  try {
    const parsed = reviewIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const data = await getReviewByIdService(parsed.data.id);
    if (!data) {
      res.status(404).json({
        error: "Not Found",
        message: "Review not found",
      });
      return;
    }

    res.status(200).json({
      message: "Review fetched successfully",
      data,
    });
  } catch (error: unknown) {
    console.error("Get review error:", error);
    handleReviewError(res, error, "Failed to fetch review");
  }
};

export const deleteReviewAdmin = async (req: Request, res: Response) => {
  try {
    const parsed = reviewIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    await deleteReviewAdminService(parsed.data.id);

    res.status(200).json({
      message: "Review deleted successfully",
      data: null,
    });
  } catch (error: unknown) {
    console.error("Delete review error:", error);
    handleReviewError(res, error, "Failed to delete review");
  }
};
