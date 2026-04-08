import { z } from "zod";

/** Trimmed string or null; empty / whitespace-only becomes null. */
function optionalProfileString(max: number) {
  return z
    .union([
      z
        .string()
        .trim()
        .max(max)
        .transform((s) => (s === "" ? null : s)),
      z.null(),
    ])
    .optional();
}

export const updateProfileBodySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    phoneNumber: optionalProfileString(30),
    bio: optionalProfileString(1000),
    image: optionalProfileString(2048),
  })
  .strict()
  .refine(
    (data) =>
      data.name !== undefined ||
      data.phoneNumber !== undefined ||
      data.bio !== undefined ||
      data.image !== undefined,
    { message: "Request body must contain at least one valid field" },
  );

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;
