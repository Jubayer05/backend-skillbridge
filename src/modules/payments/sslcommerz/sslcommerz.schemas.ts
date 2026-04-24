import { z } from "zod";

export const sslcommerzInitBodySchema = z
  .object({
    availabilitySlotId: z.string().uuid("availabilitySlotId must be a valid UUID"),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export type SslcommerzInitBody = z.infer<typeof sslcommerzInitBodySchema>;

