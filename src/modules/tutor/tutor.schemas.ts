import { z } from "zod";

const hourlyRateField = z.union([
  z.number().finite().nonnegative(),
  z
    .string()
    .trim()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "hourlyRate must be a valid amount with up to 2 decimal places",
    ),
]);

export const upsertTutorProfileBodySchema = z
  .object({
    headline: z.string().trim().min(1).max(150),
    bio: z.string().trim().min(1).max(3000),
    hourlyRate: hourlyRateField,
    experience: z.number().int().nonnegative(),
    education: z.string().trim().min(1).max(255),
    languages: z
      .array(z.string().trim().min(1, "languages must not contain empty values"))
      .min(1, "languages must be a non-empty array")
      .transform((items) => [...new Set(items)]),
    profileImageUrl: z
      .union([z.string().trim().max(2048), z.null()])
      .optional(),
  })
  .strict();

export const tutorUserIdParamSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
});

export const featuredTutorsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(24).optional().default(8),
});

export type UpsertTutorProfileBody = z.infer<typeof upsertTutorProfileBodySchema>;
