import { z } from "zod";

export const listTutorsQuerySchema = z
  .object({
    categoryId: z.string().trim().min(1).max(128).optional(),
    minPrice: z.coerce.number().finite().nonnegative().optional(),
    maxPrice: z.coerce.number().finite().nonnegative().optional(),
    minRating: z.coerce.number().finite().min(0).max(5).optional(),
    q: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(48).optional().default(12),
    sort: z
      .enum(["rating_desc", "price_asc", "price_desc", "newest"])
      .optional()
      .default("rating_desc"),
  })
  .strict()
  .refine(
    (d) =>
      d.minPrice == null ||
      d.maxPrice == null ||
      d.minPrice <= d.maxPrice,
    { message: "minPrice must be less than or equal to maxPrice", path: ["maxPrice"] },
  );

export const tutorDetailQuerySchema = z.object({
  reviewsPage: z.coerce.number().int().min(1).optional().default(1),
  reviewsLimit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type ListTutorsQuery = z.infer<typeof listTutorsQuerySchema>;
export type TutorDetailQuery = z.infer<typeof tutorDetailQuerySchema>;
