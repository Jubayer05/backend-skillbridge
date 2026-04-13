import type { Request, Response } from "express";

import { sendZodError } from "../../lib/zod-response.js";
import {
  listTutorReviewsQuerySchema,
  tutorUserIdReviewsParamSchema,
} from "../reviews/review.schemas.js";
import { listReviewsForTutorUserIdService } from "../reviews/review.service.js";
import { tutorUserIdParamSchema } from "../tutor/tutor.schemas.js";
import {
  getTutorPublicDetailService,
  listTutorsDiscoveryService,
} from "./tutors.discovery.service.js";
import {
  listTutorsQuerySchema,
  tutorDetailQuerySchema,
} from "./tutors.schemas.js";

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

export const listTutors = async (req: Request, res: Response) => {
  try {
    const parsed = listTutorsQuerySchema.safeParse(normalizeQuery(req.query));
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const data = await listTutorsDiscoveryService(parsed.data);
    res.status(200).json({
      message: "Tutors fetched successfully",
      data,
    });
  } catch (error: unknown) {
    console.error("List tutors error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Failed to list tutors",
    });
  }
};

export const getTutorPublicDetail = async (req: Request, res: Response) => {
  try {
    const paramsParsed = tutorUserIdParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      sendZodError(res, paramsParsed.error);
      return;
    }

    const queryParsed = tutorDetailQuerySchema.safeParse(
      normalizeQuery(req.query),
    );
    if (!queryParsed.success) {
      sendZodError(res, queryParsed.error);
      return;
    }

    const data = await getTutorPublicDetailService(
      paramsParsed.data.userId,
      queryParsed.data,
    );

    if (!data) {
      res.status(404).json({
        error: "Not Found",
        message: "Tutor profile not found",
      });
      return;
    }

    res.status(200).json({
      message: "Tutor details fetched successfully",
      data,
    });
  } catch (error: unknown) {
    console.error("Get tutor detail error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message:
        error instanceof Error ? error.message : "Failed to fetch tutor details",
    });
  }
};

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
