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

export const createSubjectBodySchema = z
  .object({
    name: nameField,
    description: descriptionField,
    categoryId: z.string().uuid("categoryId must be a valid UUID"),
  })
  .strict();

export const updateSubjectBodySchema = z
  .object({
    name: nameField.optional(),
    description: descriptionField,
    categoryId: z.string().uuid("categoryId must be a valid UUID").optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const subjectIdParamSchema = z.object({
  subjectId: z.string().uuid("subjectId must be a valid UUID"),
});

export const listSubjectsQuerySchema = z.object({
  categoryId: z.string().uuid("categoryId must be a valid UUID").optional(),
});

export type CreateSubjectBody = z.infer<typeof createSubjectBodySchema>;
export type UpdateSubjectBody = z.infer<typeof updateSubjectBodySchema>;
export type SubjectIdParam = z.infer<typeof subjectIdParamSchema>;
export type ListSubjectsQuery = z.infer<typeof listSubjectsQuerySchema>;
