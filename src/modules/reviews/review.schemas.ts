import { z } from "zod";

export const createReviewBodySchema = z
  .object({
    bookingId: z.string().uuid("bookingId must be a valid UUID"),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional(),
  })
  .strict();

export const listTutorReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const reviewIdParamSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
});

export const tutorUserIdReviewsParamSchema = z.object({
  userId: z
    .string()
    .trim()
    .min(1, "userId is required")
    .max(128, "userId is too long"),
});

export type CreateReviewBody = z.infer<typeof createReviewBodySchema>;
export type ListTutorReviewsQuery = z.infer<typeof listTutorReviewsQuerySchema>;
