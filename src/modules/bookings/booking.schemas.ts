import { z } from "zod";

const bookingStatus = z.enum(["confirmed", "completed", "cancelled"], {
  message: 'status must be "confirmed", "completed", or "cancelled"',
});

export const createBookingBodySchema = z
  .object({
    availabilitySlotId: z.string().uuid("availabilitySlotId must be a valid UUID"),
    paymentMethod: z
      .enum(["COD", "SSLCOMMERZ"], {
        message: 'paymentMethod must be "COD" or "SSLCOMMERZ"',
      })
      .optional()
      .default("COD"),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export const listBookingsQuerySchema = z.object({
  status: bookingStatus.optional(),
  from: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "from must be YYYY-MM-DD")
    .optional(),
  to: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "to must be YYYY-MM-DD")
    .optional(),
});

export const bookingIdParamSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
});

export type CreateBookingBody = z.infer<typeof createBookingBodySchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;

