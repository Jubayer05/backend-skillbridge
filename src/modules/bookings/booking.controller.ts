import type { Request, Response } from "express";

import { sendZodError } from "../../lib/zod-response.js";
import {
  bookingIdParamSchema,
  createBookingBodySchema,
  listBookingsQuerySchema,
} from "./booking.schemas.js";
import {
  cancelBookingService,
  completeBookingService,
  createBookingService,
  getBookingByIdService,
  listBookingsService,
} from "./booking.service.js";

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

function handleBookingError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
) {
  const message = error instanceof Error ? error.message : fallbackMessage;

  let statusCode = 500;
  if (
    message.includes("must be") ||
    message.includes("Only") ||
    message.includes("Forbidden") ||
    message.includes("not available") ||
    message.includes("future") ||
    message.includes("already booked")
  ) {
    statusCode =
      message.includes("Forbidden") ? 403 : message.includes("Only") ? 403 : 400;
  }
  if (
    message === "User not found" ||
    message === "Availability slot not found" ||
    message === "Tutor profile not found" ||
    message === "Booking not found"
  ) {
    statusCode = 404;
  }
  if (message.includes("already")) {
    statusCode = 409;
  }

  const errorLabel =
    statusCode === 400
      ? "Validation Error"
      : statusCode === 403
        ? "Forbidden"
        : statusCode === 404
          ? "Not Found"
          : statusCode === 409
            ? "Conflict"
            : fallbackMessage;

  res.status(statusCode).json({ error: errorLabel, message });
}

export const createBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const parsed = createBookingBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const result = await createBookingService(userId, parsed.data);
    res.status(201).json({
      message: "Booking created successfully",
      data: result,
    });
  } catch (error: unknown) {
    console.error("Create booking error:", error);
    handleBookingError(res, error, "Failed to create booking");
  }
};

export const listBookings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const parsed = listBookingsQuerySchema.safeParse(normalizeQuery(req.query));
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const data = await listBookingsService(userId, parsed.data);
    res.status(200).json({ message: "Bookings fetched successfully", data });
  } catch (error: unknown) {
    console.error("List bookings error:", error);
    handleBookingError(res, error, "Failed to list bookings");
  }
};

export const getBookingById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const parsed = bookingIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const result = await getBookingByIdService(userId, parsed.data.id);
    if (!result) {
      res.status(404).json({ error: "Not Found", message: "Booking not found" });
      return;
    }

    res.status(200).json({ message: "Booking fetched successfully", data: result });
  } catch (error: unknown) {
    console.error("Get booking error:", error);
    handleBookingError(res, error, "Failed to fetch booking");
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const parsed = bookingIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const result = await cancelBookingService(userId, parsed.data.id);
    res.status(200).json({ message: "Booking cancelled successfully", data: result });
  } catch (error: unknown) {
    console.error("Cancel booking error:", error);
    handleBookingError(res, error, "Failed to cancel booking");
  }
};

export const completeBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const parsed = bookingIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const result = await completeBookingService(userId, parsed.data.id);
    res.status(200).json({ message: "Booking completed successfully", data: result });
  } catch (error: unknown) {
    console.error("Complete booking error:", error);
    handleBookingError(res, error, "Failed to complete booking");
  }
};

