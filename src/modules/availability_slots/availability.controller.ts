import type { Request, Response } from "express";

import { sendZodError } from "../../lib/zod-response.js";
import {
  createAvailabilitySlotBodySchema,
  listAvailabilitySlotsQuerySchema,
  listPublicAvailabilitySlotsQuerySchema,
  slotIdParamSchema,
  updateAvailabilitySlotBodySchema,
} from "./availability.schemas.js";
import {
  createAvailabilitySlotService,
  deleteAvailabilitySlotService,
  getAvailabilitySlotByIdService,
  listAvailabilitySlotsService,
  listPublicAvailabilitySlotsService,
  updateAvailabilitySlotService,
} from "./availability.service.js";

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

function handleAvailabilityError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
): void {
  const message =
    error instanceof Error ? error.message : fallbackMessage;

  let statusCode = 500;
  if (message === "Availability slot not found" || message === "Subject not found") {
    statusCode = 404;
  } else if (message.includes("Only tutors")) {
    statusCode = 403;
  } else if (message.includes("overlaps")) {
    statusCode = 409;
  } else if (
    message.includes("must be") ||
    message.includes("Invalid") ||
    message.includes("endTime must be after")
  ) {
    statusCode = 400;
  } else if (message === "User not found") {
    statusCode = 404;
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

  res.status(statusCode).json({
    error: errorLabel,
    message,
  });
}

export const createAvailabilitySlot = async (req: Request, res: Response) => {
  try {
    const tutorId = req.user?.id;
    if (!tutorId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const parsed = createAvailabilitySlotBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const result = await createAvailabilitySlotService(tutorId, parsed.data);

    res.status(201).json({
      message: "Availability slot created successfully",
      data: result,
    });
  } catch (error: unknown) {
    console.error("Create availability slot error:", error);
    handleAvailabilityError(
      res,
      error,
      "Failed to create availability slot",
    );
  }
};

export const listAvailabilitySlots = async (req: Request, res: Response) => {
  try {
    const parsed = listAvailabilitySlotsQuerySchema.safeParse(
      normalizeQuery(req.query),
    );
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const { tutorId, date, status } = parsed.data;
    const data = await listAvailabilitySlotsService({
      tutorId,
      ...(date !== undefined ? { date } : {}),
      ...(status !== undefined ? { status } : {}),
    });

    res.status(200).json({
      message: "Availability slots fetched successfully",
      data,
    });
  } catch (error: unknown) {
    console.error("List availability slots error:", error);
    handleAvailabilityError(res, error, "Failed to list availability slots");
  }
};

export const listPublicAvailabilitySlots = async (
  req: Request,
  res: Response,
) => {
  try {
    const parsed = listPublicAvailabilitySlotsQuerySchema.safeParse(
      normalizeQuery(req.query),
    );
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const { subjectId, tutorId, date, status } = parsed.data;
    const data = await listPublicAvailabilitySlotsService({
      subjectId,
      ...(tutorId !== undefined ? { tutorId } : {}),
      ...(date !== undefined ? { date } : {}),
      ...(status !== undefined ? { status } : {}),
    });

    res.status(200).json({
      message: "Public availability slots fetched successfully",
      data,
    });
  } catch (error: unknown) {
    console.error("List public availability slots error:", error);
    handleAvailabilityError(
      res,
      error,
      "Failed to list public availability slots",
    );
  }
};

export const getAvailabilitySlotById = async (req: Request, res: Response) => {
  try {
    const tutorId = req.user?.id;
    if (!tutorId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const parsed = slotIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const result = await getAvailabilitySlotByIdService(
      tutorId,
      parsed.data.slotId,
    );

    if (!result) {
      res.status(404).json({
        error: "Not Found",
        message: "Availability slot not found",
      });
      return;
    }

    res.status(200).json({
      message: "Availability slot fetched successfully",
      data: result,
    });
  } catch (error: unknown) {
    console.error("Get availability slot error:", error);
    handleAvailabilityError(res, error, "Failed to fetch availability slot");
  }
};

export const updateAvailabilitySlot = async (req: Request, res: Response) => {
  try {
    const tutorId = req.user?.id;
    if (!tutorId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const paramsParsed = slotIdParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      sendZodError(res, paramsParsed.error);
      return;
    }

    const bodyParsed = updateAvailabilitySlotBodySchema.safeParse(req.body);
    if (!bodyParsed.success) {
      sendZodError(res, bodyParsed.error);
      return;
    }

    const result = await updateAvailabilitySlotService(
      tutorId,
      paramsParsed.data.slotId,
      bodyParsed.data,
    );

    res.status(200).json({
      message: "Availability slot updated successfully",
      data: result,
    });
  } catch (error: unknown) {
    console.error("Update availability slot error:", error);
    handleAvailabilityError(
      res,
      error,
      "Failed to update availability slot",
    );
  }
};

export const deleteAvailabilitySlot = async (req: Request, res: Response) => {
  try {
    const tutorId = req.user?.id;
    if (!tutorId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const parsed = slotIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    await deleteAvailabilitySlotService(tutorId, parsed.data.slotId);

    res.status(200).json({
      message: "Availability slot deleted successfully",
      data: null,
    });
  } catch (error: unknown) {
    console.error("Delete availability slot error:", error);
    handleAvailabilityError(
      res,
      error,
      "Failed to delete availability slot",
    );
  }
};
