import type { Request, Response } from "express";
import { Router, type RequestHandler } from "express";

import { sendZodError } from "../../lib/zod-response.js";
import {
  listTutorReviewsQuerySchema,
  tutorUserIdReviewsParamSchema,
} from "../reviews/review.schemas.js";
import { listReviewsForTutorUserIdService } from "../reviews/review.service.js";

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

export const listTutorReviews = async (req: Request, res: Response) => {
  try {
    const paramsParsed = tutorUserIdReviewsParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      sendZodError(res, paramsParsed.error);
      return;
    }

    const queryParsed = listTutorReviewsQuerySchema.safeParse(
      normalizeQuery(req.query),
    );
    if (!queryParsed.success) {
      sendZodError(res, queryParsed.error);
      return;
    }

    const { page, limit } = queryParsed.data;
    const data = await listReviewsForTutorUserIdService(
      paramsParsed.data.userId,
      page,
      limit,
    );

    res.status(200).json({
      message: "Reviews fetched successfully",
      data,
    });
  } catch (error: unknown) {
    console.error("List tutor reviews error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message:
        error instanceof Error ? error.message : "Failed to list reviews",
    });
  }
};

const tutorsRoutes: Router = Router();

tutorsRoutes.get("/:userId/reviews", listTutorReviews as RequestHandler);

export default tutorsRoutes;
