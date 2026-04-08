import type { AvailabilitySlotStatus } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateAvailabilitySlotBody,
  UpdateAvailabilitySlotBody,
} from "./availability.schemas.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

function parseDateOnly(dateStr: string): Date {
  if (!DATE_RE.test(dateStr)) {
    throw new Error("date must be YYYY-MM-DD");
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || m === undefined || d === undefined) {
    throw new Error("date must be YYYY-MM-DD");
  }
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function combineUtc(dateStr: string, timeStr: string): Date {
  if (!TIME_RE.test(timeStr)) {
    throw new Error("startTime and endTime must be HH:mm (24h)");
  }
  const dp = dateStr.split("-").map(Number);
  const tp = timeStr.split(":").map(Number);
  const y = dp[0];
  const mo = dp[1];
  const da = dp[2];
  const hh = tp[0];
  const mi = tp[1];
  if (
    y === undefined ||
    mo === undefined ||
    da === undefined ||
    hh === undefined ||
    mi === undefined
  ) {
    throw new Error("Invalid date or time");
  }
  return new Date(Date.UTC(y, mo - 1, da, hh, mi, 0, 0));
}

function formatDateOnly(d: Date): string {
  const y = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${month}-${day}`;
}

function parsePrice(value: string | number): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error("price must be a non-negative number");
    }
    return value.toFixed(2);
  }
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error("price must be a valid amount with up to 2 decimal places");
  }
  return trimmed;
}

function mapStatusToEnum(
  value: string | undefined,
): AvailabilitySlotStatus {
  if (value === undefined || value === "available") {
    return "AVAILABLE";
  }
  if (value === "booked") {
    return "BOOKED";
  }
  throw new Error('status must be "available" or "booked"');
}

function mapEnumToApi(status: AvailabilitySlotStatus): "available" | "booked" {
  return status === "AVAILABLE" ? "available" : "booked";
}

export type AvailabilitySlotSubjectApi = {
  id: string;
  name: string;
  category: { id: string; name: string };
};

export type AvailabilitySlotApi = {
  id: string;
  tutorId: string;
  subjectId: string | null;
  subject: AvailabilitySlotSubjectApi | null;
  date: string;
  startTime: string;
  endTime: string;
  startAt: string;
  endAt: string;
  price: string;
  status: "available" | "booked";
  createdAt: string;
};

export type AvailabilitySlotTutorApi = {
  id: string;
  name: string;
  image: string | null;
};

export type PublicAvailabilitySlotApi = AvailabilitySlotApi & {
  tutor: AvailabilitySlotTutorApi;
};

function mapSubjectToApi(
  subject: {
    id: string;
    name: string;
    category: { id: string; name: string };
  } | null,
): AvailabilitySlotSubjectApi | null {
  if (!subject) return null;
  return {
    id: subject.id,
    name: subject.name,
    category: subject.category,
  };
}

function toApiSlot(row: {
  id: string;
  tutorId: string;
  subjectId: string | null;
  date: Date;
  startTime: string;
  endTime: string;
  startAt: Date;
  endAt: Date;
  price: { toString(): string };
  status: AvailabilitySlotStatus;
  createdAt: Date;
  subject?: {
    id: string;
    name: string;
    category: { id: string; name: string };
  } | null;
}): AvailabilitySlotApi {
  return {
    id: row.id,
    tutorId: row.tutorId,
    subjectId: row.subjectId,
    subject: mapSubjectToApi(row.subject ?? null),
    date: formatDateOnly(row.date),
    startTime: row.startTime,
    endTime: row.endTime,
    startAt: row.startAt.toISOString(),
    endAt: row.endAt.toISOString(),
    price: row.price.toString(),
    status: mapEnumToApi(row.status),
    createdAt: row.createdAt.toISOString(),
  };
}

const subjectForSlotInclude = {
  subject: {
    select: {
      id: true,
      name: true,
      category: { select: { id: true, name: true } },
    },
  },
} as const;

const tutorForSlotInclude = {
  tutor: {
    select: { id: true, name: true, image: true },
  },
} as const;

function toPublicApiSlot(row: {
  id: string;
  tutorId: string;
  subjectId: string | null;
  date: Date;
  startTime: string;
  endTime: string;
  startAt: Date;
  endAt: Date;
  price: { toString(): string };
  status: AvailabilitySlotStatus;
  createdAt: Date;
  subject?: {
    id: string;
    name: string;
    category: { id: string; name: string };
  } | null;
  tutor: { id: string; name: string; image: string | null };
}): PublicAvailabilitySlotApi {
  return {
    ...toApiSlot(row),
    tutor: row.tutor,
  };
}

export const createAvailabilitySlotService = async (
  tutorId: string,
  input: CreateAvailabilitySlotBody,
): Promise<AvailabilitySlotApi> => {
  const user = await prisma.user.findUnique({
    where: { id: tutorId },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "TUTOR") {
    throw new Error("Only tutors can create availability slots");
  }

  const subject = await prisma.subject.findUnique({
    where: { id: input.subjectId },
    select: { id: true },
  });
  if (!subject) {
    throw new Error("Subject not found");
  }

  const dateStr = input.date.trim();
  const startTime = input.startTime.trim();
  const endTime = input.endTime.trim();
  const dateOnly = parseDateOnly(dateStr);
  const startAt = combineUtc(dateStr, startTime);
  const endAt = combineUtc(dateStr, endTime);

  if (startAt.getTime() >= endAt.getTime()) {
    throw new Error("endTime must be after startTime");
  }

  const price = parsePrice(input.price);
  const status = mapStatusToEnum(input.status);

  const overlapping = await prisma.availabilitySlot.findFirst({
    where: {
      tutorId,
      date: dateOnly,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { id: true },
  });

  if (overlapping) {
    throw new Error(
      "This time overlaps an existing slot on the same date for this tutor",
    );
  }

  const row = await prisma.availabilitySlot.create({
    data: {
      tutorId,
      subjectId: input.subjectId,
      date: dateOnly,
      startTime,
      endTime,
      startAt,
      endAt,
      price,
      status,
    },
    include: subjectForSlotInclude,
  });

  return toApiSlot(row);
};

export const listAvailabilitySlotsService = async (params: {
  tutorId: string;
  date?: string;
  status?: "available" | "booked";
}): Promise<AvailabilitySlotApi[]> => {
  const where: {
    tutorId: string;
    date?: Date;
    status?: AvailabilitySlotStatus;
  } = { tutorId: params.tutorId };

  if (params.date !== undefined && params.date.trim() !== "") {
    where.date = parseDateOnly(params.date.trim());
  }

  if (params.status !== undefined) {
    where.status = mapStatusToEnum(params.status);
  }

  const rows = await prisma.availabilitySlot.findMany({
    where,
    orderBy: [{ date: "asc" }, { startAt: "asc" }],
    include: subjectForSlotInclude,
  });

  return rows.map(toApiSlot);
};

export const listPublicAvailabilitySlotsService = async (params: {
  subjectId: string;
  tutorId?: string;
  date?: string;
  status?: "available" | "booked";
}): Promise<PublicAvailabilitySlotApi[]> => {
  const where: {
    subjectId: string;
    tutorId?: string;
    date?: Date;
    status?: AvailabilitySlotStatus;
  } = { subjectId: params.subjectId };

  if (params.tutorId !== undefined && params.tutorId.trim() !== "") {
    where.tutorId = params.tutorId.trim();
  }

  if (params.date !== undefined && params.date.trim() !== "") {
    where.date = parseDateOnly(params.date.trim());
  }

  if (params.status !== undefined) {
    where.status = mapStatusToEnum(params.status);
  }

  const rows = await prisma.availabilitySlot.findMany({
    where,
    orderBy: [{ date: "asc" }, { startAt: "asc" }],
    include: { ...subjectForSlotInclude, ...tutorForSlotInclude },
  });

  return rows.map(toPublicApiSlot);
};

export const getAvailabilitySlotByIdService = async (
  tutorId: string,
  slotId: string,
): Promise<AvailabilitySlotApi | null> => {
  const row = await prisma.availabilitySlot.findFirst({
    where: { id: slotId, tutorId },
    include: subjectForSlotInclude,
  });
  return row ? toApiSlot(row) : null;
};

export const updateAvailabilitySlotService = async (
  tutorId: string,
  slotId: string,
  input: UpdateAvailabilitySlotBody,
): Promise<AvailabilitySlotApi> => {
  const existing = await prisma.availabilitySlot.findFirst({
    where: { id: slotId, tutorId },
  });

  if (!existing) {
    throw new Error("Availability slot not found");
  }

  if (input.subjectId !== undefined) {
    const subj = await prisma.subject.findUnique({
      where: { id: input.subjectId },
      select: { id: true },
    });
    if (!subj) {
      throw new Error("Subject not found");
    }
  }

  const dateStr =
    input.date !== undefined
      ? input.date
      : formatDateOnly(existing.date);
  const startTime =
    input.startTime !== undefined ? input.startTime : existing.startTime;
  const endTime = input.endTime !== undefined ? input.endTime : existing.endTime;

  const dateOnly = parseDateOnly(dateStr);
  const startAt = combineUtc(dateStr, startTime);
  const endAt = combineUtc(dateStr, endTime);

  if (startAt.getTime() >= endAt.getTime()) {
    throw new Error("endTime must be after startTime");
  }

  const price =
    input.price !== undefined ? parsePrice(input.price) : existing.price.toString();
  const status =
    input.status !== undefined
      ? mapStatusToEnum(input.status)
      : existing.status;

  const timeChanged =
    dateStr !== formatDateOnly(existing.date) ||
    startTime !== existing.startTime ||
    endTime !== existing.endTime;

  if (timeChanged) {
    const overlapping = await prisma.availabilitySlot.findFirst({
      where: {
        tutorId,
        date: dateOnly,
        id: { not: slotId },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });

    if (overlapping) {
      throw new Error(
        "This time overlaps an existing slot on the same date for this tutor",
      );
    }
  }

  const row = await prisma.availabilitySlot.update({
    where: { id: slotId },
    data: {
      ...(input.subjectId !== undefined
        ? { subjectId: input.subjectId }
        : {}),
      date: dateOnly,
      startTime,
      endTime,
      startAt,
      endAt,
      price,
      status,
    },
    include: subjectForSlotInclude,
  });

  return toApiSlot(row);
};

export const deleteAvailabilitySlotService = async (
  tutorId: string,
  slotId: string,
): Promise<void> => {
  const result = await prisma.availabilitySlot.deleteMany({
    where: { id: slotId, tutorId },
  });

  if (result.count === 0) {
    throw new Error("Availability slot not found");
  }
};
