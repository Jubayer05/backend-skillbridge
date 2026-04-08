import { z } from "zod";

const dateStr = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

const timeStr = z
  .string()
  .trim()
  .regex(
    /^([01]?\d|2[0-3]):[0-5]\d$/,
    "startTime and endTime must be HH:mm (24h)",
  );

const priceField = z.union([
  z.number().finite().nonnegative(),
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "price must be a valid amount with up to 2 decimals"),
]);

const slotStatus = z.enum(["available", "booked"], {
  message: 'status must be "available" or "booked"',
});

export const createAvailabilitySlotBodySchema = z
  .object({
    subjectId: z.string().uuid("subjectId must be a valid UUID"),
    date: dateStr,
    startTime: timeStr,
    endTime: timeStr,
    price: priceField,
    status: slotStatus.optional(),
  })
  .strict();

export const updateAvailabilitySlotBodySchema = z
  .object({
    subjectId: z.string().uuid("subjectId must be a valid UUID").optional(),
    date: dateStr.optional(),
    startTime: timeStr.optional(),
    endTime: timeStr.optional(),
    price: priceField.optional(),
    status: slotStatus.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

/** User.id is a string PK (often UUID, but not guaranteed across auth/migrations). */
const tutorUserIdQuery = z
  .string()
  .trim()
  .min(1, "tutorId is required")
  .max(128, "tutorId is too long");

export const listAvailabilitySlotsQuerySchema = z.object({
  tutorId: tutorUserIdQuery,
  date: dateStr.optional(),
  status: slotStatus.optional(),
});

export const listPublicAvailabilitySlotsQuerySchema = z.object({
  subjectId: z.string().uuid("subjectId must be a valid UUID"),
  tutorId: tutorUserIdQuery.optional(),
  /** Defaults to available for public browsing. */
  status: slotStatus.optional().default("available"),
  date: dateStr.optional(),
});

export const slotIdParamSchema = z.object({
  slotId: z.string().uuid("slotId must be a valid UUID"),
});

export type CreateAvailabilitySlotBody = z.infer<
  typeof createAvailabilitySlotBodySchema
>;
export type UpdateAvailabilitySlotBody = z.infer<
  typeof updateAvailabilitySlotBodySchema
>;
export type ListAvailabilitySlotsQuery = z.infer<
  typeof listAvailabilitySlotsQuerySchema
>;

export type ListPublicAvailabilitySlotsQuery = z.infer<
  typeof listPublicAvailabilitySlotsQuerySchema
>;
