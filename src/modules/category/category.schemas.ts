import { z } from "zod";

const nameField = z
  .string()
  .trim()
  .min(1, "name is required")
  .max(100, "name must be at most 100 characters");

const descriptionField = z
  .string()
  .trim()
  .max(500, "description must be at most 500 characters")
  .optional();

export const createCategoryBodySchema = z
  .object({
    name: nameField,
    description: descriptionField,
  })
  .strict();

export const updateCategoryBodySchema = z
  .object({
    name: nameField.optional(),
    description: descriptionField,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const categoryIdParamSchema = z.object({
  categoryId: z.string().uuid("categoryId must be a valid UUID"),
});

export type CreateCategoryBody = z.infer<typeof createCategoryBodySchema>;
export type UpdateCategoryBody = z.infer<typeof updateCategoryBodySchema>;
export type CategoryIdParam = z.infer<typeof categoryIdParamSchema>;
